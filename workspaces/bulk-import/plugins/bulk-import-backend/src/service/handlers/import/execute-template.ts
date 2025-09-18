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

import { fetchEventSource } from '@ai-zen/node-fetch-event-source';
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
) {
  const url = `${scaffolderUrl}/v2/tasks/${taskId}/eventstream`;

  const queue: ScaffolderEvent[] = [];
  let resolver: ((event: ScaffolderEvent) => void) | undefined;

  const handleEvent = (data: any) => {
    logger.info('Received event:', data);
    if (resolver) {
      resolver(data);
      resolver = undefined;
    } else {
      queue.push(data);
    }
  };

  const controller = new AbortController();

  fetchEventSource(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal: controller.signal,
    onopen: async response => {
      logger.info('SSE connection opened', { status: response.status });
    },
    onmessage: event => {
      try {
        const data: ScaffolderEvent = JSON.parse(event.data);
        handleEvent(data);
      } catch (err) {
        logger.error('==== Failed to parse SSE event', err);
      }
    },
    onclose: () => {
      logger.info('SSE connection closed');
    },
    onerror: err => {
      logger.error('==== SSE error', err);
      handleEvent({
        type: 'error',
        error: err,
        id: -1,
        isTaskRecoverable: false,
        taskId,
        body: { message: err?.message ?? '' },
        createdAt: new Date().toISOString(),
      });
      controller.abort();
    },
  }).catch(err => logger.error('==== fetchEventSource failed', err));

  const nextEvent = (): Promise<ScaffolderEvent> =>
    new Promise(resolve => {
      resolver = resolve;
    });

  while (true) {
    const event: ScaffolderEvent =
      queue.length > 0 ? queue.shift()! : await nextEvent();

    yield event;

    if (event.type === 'completion' || event.type === 'error') {
      controller.abort();
      break;
    }
  }
}

async function processTaskEvents(
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
    logger.error(`==== Failed to process events for task ${taskId}`, e);
  }
}

const handlePullRequestUpdate = async (
  importReq: Components.Schemas.ImportRequest,
  logger: LoggerService,
  config: Config,
  githubApiService: GithubApiService,
): Promise<Components.Schemas.Import | undefined> => {
  const url = importReq.repository.url;
  const owner = importReq.repository.organization;
  const repoName = importReq.repository.name;
  const prUrl = importReq.github?.pullRequest?.url;
  const prNumber = importReq.github?.pullRequest?.number;
  const prTitle = importReq.github?.pullRequest?.title;
  const prBody = importReq.github?.pullRequest?.body;
  const catalogInfoContent = importReq.catalogInfoContent;

  try {
    if (prNumber && prTitle && prBody) {
      try {
        await githubApiService.updatePullRequest(
          url,
          prNumber,
          prTitle,
          prBody,
        );
      } catch (err) {
        // todo: handle error
        console.log(`===== ${err}`);
      }

      const prInfo = await githubApiService.getPullRequest(url, prNumber);

      // Update catalog info content in the pull request
      const gitUrl = gitUrlParse(url);
      const fileName = getCatalogFilename(config);

      console.log(
        `let update catalog-info yaml file with content ${catalogInfoContent}`,
      );
      if (catalogInfoContent) {
        try {
          await githubApiService.createOrUpdateFileInBranch(
            gitUrl.owner,
            gitUrl.name,
            prInfo.prBranch!, // todo handle undefined.
            fileName,
            catalogInfoContent,
          );
        } catch (e) {
          // todo: handle error
          logger.error(`Failed to update file in branch`, e);
        }
      } else {
        logger.warn(
          `catalogInfoContent is undefined, skipping createOrUpdateFileInBranch`,
        );
      }
    } else {
      logger.warn(`prNumber is undefined, skipping updatePullRequest`);
    }
  } catch (error: any) {
    // todo: handle error
    logger.error(`Error updating pull request ${prUrl}`, error);
    return {
      repository: {
        organization: owner,
        url: url,
        name: repoName,
      },
      status: 'PR_ERROR', // Update with correct status
      errors: [error.message],
      approvalTool: importReq.approvalTool,
    } as Components.Schemas.Import;
  }

  return {
    repository: {
      organization: owner,
      url: url,
      name: repoName,
    },
    status: 'TASK_IN_PROGRESS', // Update with correct status
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
  } as Components.Schemas.Import;
};

export const createTaskImportJobs = async (
  discovery: DiscoveryService,
  logger: LoggerService,
  auth: AuthService,
  config: Config,
  repositoryDao: RepositoryDao,
  taskDao: ScaffolderTaskDao,
  taskLocationsDao: TaskLocationsDao,
  importRequests: Components.Schemas.ImportRequest[],
  githubApiService: GithubApiService,
): Promise<
  HandlerResponse<Components.Schemas.Import[] | { errors: string[] }>
> => {
  const result: Components.Schemas.Import[] = [];

  const scaffolderUrl = await discovery.getBaseUrl('scaffolder');
  const { token } = await auth.getPluginRequestToken({
    onBehalfOf: await auth.getOwnServiceCredentials(),
    targetPluginId: 'scaffolder',
  });
  const finalTemplateName = config.getString('bulkImport.importTemplate');

  const executeTask = async (values: Record<string, any>) => {
    const response = await fetch(`${scaffolderUrl}/v2/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        templateRef: `template:default/${finalTemplateName}`,
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
    console.log(`===== ${JSON.stringify(data)}`);
    return data.id;
  };

  if (importRequests?.length) {
    for (const importReq of importRequests) {
      const url = importReq.repository.url;
      const owner = importReq.repository.organization;
      const repoName = importReq.repository.name;

      try {
        if (importReq.github?.pullRequest?.url) {
          const updatedImport = await handlePullRequestUpdate(
            importReq,
            logger,
            config,
            githubApiService,
          );
          if (updatedImport) {
            result.push(updatedImport);
          }
        } else {
          // Create new task
          const normalizedUrl = `${new URL(importReq.repository.url).hostname}?owner=${owner}&repo=${repoName}`;

          const scaffolderOptions = {
            repoUrl: normalizedUrl,
          };
          const taskId = await executeTask(scaffolderOptions);

          const repositoryId = await repositoryDao.insertRepository(
            url,
            taskId,
          );
          await taskDao.insertTask({ repositoryId, scaffolderOptions, taskId });
          result.push({
            repository: {
              organization: owner,
              url,
              name: repoName,
            },
            status: 'TASK_IN_PROGRESS',
            task: { taskId },
            approvalTool: importReq.approvalTool,
            // errors // todo
          });

          processTaskEvents(
            taskId,
            scaffolderUrl,
            token,
            logger,
            taskLocationsDao,
          );
        }
      } catch (error: any) {
        logger.error(`Error processing import request for ${url}`, error);
        result.push({
          repository: {
            organization: owner,
            url,
            name: repoName,
          },
          status: 'PR_ERROR', // Update with correct status
          errors: [error.message],
          approvalTool: importReq.approvalTool,
        });
      }
    }
  }

  return {
    statusCode: 202,
    responseBody: result,
  };
};
