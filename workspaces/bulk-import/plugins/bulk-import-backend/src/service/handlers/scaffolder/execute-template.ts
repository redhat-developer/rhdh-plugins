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

export const executeTemplate = async (
  discovery: DiscoveryService,
  logger: LoggerService,
  auth: AuthService,
  config: Config,
  repositories: string[],
  templateParameters: Record<string, any>,
) => {
  const taskIds = [];
  const scaffolderUrl = await discovery.getBaseUrl('scaffolder');
  const { token } = await auth.getPluginRequestToken({
    onBehalfOf: await auth.getOwnServiceCredentials(),
    targetPluginId: 'scaffolder',
  });
  const templateName = config.getString('bulkImport.importTemplate');

  const execute = async (values: Record<string, any>) => {
    const response = await fetch(`${scaffolderUrl}/v2/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        templateRef: `template:default/${templateName}`,
        values: {
          repoUrl: values.repoUrl,
          owner: values.owner,
          ...values,
        },
      }),
    });
    if (!response.ok) {
      throw new Error(
        `Failed to start scaffolder task: ${response.status} ${response.statusText}`,
      );
    }
    const data = await response.json();
    return data.id;
  };

  if (repositories && repositories.length > 0) {
    for (const repoUrl of repositories) {
      const taskId = await execute({
        repoUrl,
        ...templateParameters,
      });
      taskIds.push(taskId);
      logger.info(`Started scaffolder task ${taskId} for ${repoUrl}`);
    }
  }

  return {
    taskIds,
  };
};
