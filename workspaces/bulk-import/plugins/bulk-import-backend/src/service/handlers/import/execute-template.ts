/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  AuthService,
  DiscoveryService,
  LoggerService,
} from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';

import { createEventSource } from 'eventsource-client';
import gitUrlParse from 'git-url-parse';

import { getCatalogFilename } from '../../../catalog/catalogUtils';
import {
  RepositoryDao,
  ScaffolderTaskDao,
  TaskLocationsDao,
} from '../../../database/repositoryDao';
import { Components } from '../../../generated/openapi';
import { GithubApiService } from '../../../github';
import { HandlerResponse } from '../handlers';
import { sortImports } from './bulkImports';

interface ScaffolderEvent {
  id: number;
  isTaskRecoverable: boolean;
  taskId: string;
  body: {
    message: string;
    stepId?: string;
    status?: string;
    [key: string]: any;
  };
  type: 'log' | 'completion' | 'error';
  createdAt: string;
  error?: any;
}

async function* getEvents(
  taskId: string,
  scaffolderUrl: string,
  token: string,
  logger: LoggerService,
): AsyncGenerator<ScaffolderEvent> {
  const url = `${scaffolderUrl}/v2/tasks/${taskId}/eventstream`;

  const eventSource = createEventSource({
    url,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  try {
    for await (const event of eventSource) {
      try {
        const data: ScaffolderEvent = JSON.parse(event.data);
        yield data;
        if (data.type === 'completion' || data.type === 'error') {
          break;
        }
      } catch (err) {
        logger.error('Failed to parse SSE event', err);
      }
    }
  } catch (err) {
    logger.error('SSE error', err);
  } finally {
    eventSource.close();
  }
}

export async function processTaskEvents(
  taskId: string,
  scaffolderUrl: string,
  token: string,
  logger: LoggerService,
  taskLocationsDao: TaskLocationsDao,
) {
  try {
    for await (const event of getEvents(taskId, scaffolderUrl, token, logger)) {
      if (event.type === 'log') {
        const message = event.body.message;
        const match = message.match(/Registering (.*) in the catalog/);
        if (match?.[1]) {
          await taskLocationsDao.addTaskLocation(taskId, match[1]);
        }
      }
    }
  } catch (e) {
    logger.error(`Failed to process events for task ${taskId}`, e);
  }
}

const handlePullRequestUpdate = async (
  importReq: Components.Schemas.ImportRequest,
  logger: LoggerService,
  config: Config,
  githubApiService: GithubApiService,
): Promise<Components.Schemas.Import> => {
  const url = importReq.repository.url;
  const owner = importReq.repository.organization;
  const repoName = importReq.repository.name;
  const prUrl = importReq.github?.pullRequest?.url;
  const prNumber = importReq.github?.pullRequest?.number;
  const prTitle = importReq.github?.pullRequest?.title;
  const prBody = importReq.github?.pullRequest?.body;
  const catalogInfoContent = importReq.catalogInfoContent;

  const result: Components.Schemas.Import = {
    repository: {
      organization: owner,
      url: url,
      name: repoName,
    },
    github: {
      pullRequest: {
        url: prUrl,
        number: prNumber,
        title: prTitle,
        body: prBody,
        catalogInfoContent: catalogInfoContent,
      },
    },
    approvalTool: importReq.approvalTool,
  };

  try {
    if (prNumber && prTitle && prBody) {
      await githubApiService.updatePullRequest(url, prNumber, prTitle, prBody);

      const prInfo = await githubApiService.getPullRequest(url, prNumber);

      // Update catalog info content in the pull request
      const gitUrl = gitUrlParse(url);
      const fileName = getCatalogFilename(config);
      if (catalogInfoContent && prInfo.prBranch) {
        await githubApiService.createOrUpdateFileInBranch(
          gitUrl.owner,
          gitUrl.name,
          prInfo.prBranch,
          fileName,
          catalogInfoContent,
        );
      }
    } else {
      logger.warn(`prNumber is undefined, skipping updatePullRequest`);
    }
  } catch (err) {
    logger.error(`Failed to update pull request ${prUrl}`, err);
    result.status = 'PR_ERROR';
    result.errors = [(err as Error).message];
    return result;
  }

  result.status = 'WAIT_PR_APPROVAL';
  return result;
};

export const createTaskImportJobs = async (
  templateRef: string,
  discovery: DiscoveryService,
  logger: LoggerService,
  auth: AuthService,
  config: Config,
  repositoryDao: RepositoryDao<'repositories'>,
  taskDao: ScaffolderTaskDao,
  taskLocationsDao: TaskLocationsDao,
  importRequests: Components.Schemas.ImportRequest[],
  githubApiService: GithubApiService,
): Promise<HandlerResponse<Components.Schemas.Import[]>> => {
  if (importRequests.length === 0) {
    logger.debug('Missing import requests from request body');
    return {
      statusCode: 400,
      responseBody: [],
    };
  }

  const result: Components.Schemas.Import[] = [];

  const scaffolderUrl = await discovery.getBaseUrl('scaffolder');
  const { token } = await auth.getPluginRequestToken({
    onBehalfOf: await auth.getOwnServiceCredentials(),
    targetPluginId: 'scaffolder',
  });

  const executeTask = async (
    values: Record<string, any>,
  ): Promise<{ taskId: string; status: string; createdAt: string }> => {
    const response = await fetch(`${scaffolderUrl}/v2/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        templateRef: `${templateRef}`,
        values: {
          repoUrl: values.repoUrl,
          owner: values.owner,
          ...values,
        },
        secrets: {},
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to start scaffolder task: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    const taskResp = await fetch(`${scaffolderUrl}/v2/tasks/${data.id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const task = await taskResp.json();
    return { taskId: data.id, status: task.status, createdAt: task.createdAt };
  };

  for (const importReq of importRequests) {
    const url = importReq.repository.url;
    const owner = importReq.repository.organization;
    const repoName = importReq.repository.name;
    if (importReq.github?.pullRequest?.url) {
      const updatedImport = await handlePullRequestUpdate(
        importReq,
        logger,
        config,
        githubApiService,
      );
      result.push(updatedImport);
    } else {
      try {
        // Create new task
        const gitProviderHost = new URL(importReq.repository.url).hostname;
        const normalizedUrl = `${gitProviderHost}?owner=${owner}&repo=${repoName}`;

        const scaffolderOptions = {
          name: repoName,
          organization: owner,
          repoUrl: normalizedUrl,
          branchName: `bulk-import-catalog-entity`,
          targetBranchName: importReq.repository.defaultBranch,
          gitProviderHost,
        };
        const { taskId, status, createdAt } =
          await executeTask(scaffolderOptions);

        const repositoryId = await repositoryDao.insertRepository(
          url,
          taskId,
          importReq.approvalTool ?? 'GIT',
        );
        await taskDao.insertTask({
          repositoryId,
          scaffolderOptions,
          taskId,
          executedAt: new Date(),
        });
        result.push({
          repository: {
            organization: owner,
            url,
            name: repoName,
          },
          status:
            `TASK_${status.toLocaleUpperCase()}` as Components.Schemas.TaskImportStatus,
          task: { taskId },
          lastUpdate: createdAt,
          approvalTool: importReq.approvalTool,
        });

        processTaskEvents(
          taskId,
          scaffolderUrl,
          token,
          logger,
          taskLocationsDao,
        );
      } catch (error: any) {
        logger.error(`Error processing import request for ${url}`, error);
        result.push({
          repository: {
            organization: owner,
            url,
            name: repoName,
          },
          status: 'TASK_FAILED',
          errors: [error.message],
          approvalTool: importReq.approvalTool,
        });
      }
    }
  }

  sortImports(result);

  return {
    statusCode: 202,
    responseBody: result,
  };
};
