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

import {
  RepositoryDao,
  ScaffolderTaskDao,
  TaskLocationsDao,
} from '../../../database/repositoryDao';

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

async function processEvents(
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

export const executeTemplate = async (
  discovery: DiscoveryService,
  logger: LoggerService,
  auth: AuthService,
  config: Config,
  repositoryDao: RepositoryDao,
  taskDao: ScaffolderTaskDao,
  taskLocationsDao: TaskLocationsDao,
  repositories: string[],
  scaffolderOptions: Record<string, any> = {},
  templateName?: string,
) => {
  const taskIds: string[] = [];
  const scaffolderUrl = await discovery.getBaseUrl('scaffolder');
  const { token } = await auth.getPluginRequestToken({
    onBehalfOf: await auth.getOwnServiceCredentials(),
    targetPluginId: 'scaffolder',
  });
  const finalTemplateName =
    templateName ?? config.getString('bulkImport.importTemplate');

  const execute = async (values: Record<string, any>) => {
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

  if (repositories?.length) {
    for (const repo of repositories) {
      const url = new URL(repo);
      const owner = url.pathname.split('/')[1];
      const repoName = url.pathname.split('/')[2];
      const normalizedUrl = `${url.hostname}?owner=${owner}&repo=${repoName}`;

      const taskId = await execute({
        repoUrl: normalizedUrl,
        ...scaffolderOptions,
        owner,
        repo: repoName,
      });

      const repositoryId = await repositoryDao.insertRepository(repo, taskId);
      await taskDao.insertTask({ repositoryId, scaffolderOptions, taskId });
      taskIds.push(taskId);

      logger.info(`Started scaffolder task ${taskId} for ${repo}`);

      processEvents(taskId, scaffolderUrl, token, logger, taskLocationsDao);
    }
  }

  return { taskIds };
};
