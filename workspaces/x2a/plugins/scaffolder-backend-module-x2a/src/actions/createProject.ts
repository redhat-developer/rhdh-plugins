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
import { DiscoveryService } from '@backstage/backend-plugin-api';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { DefaultApiClient } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

/**
 * Creates an `x2a:project:create` Scaffolder action.
 *
 * This action creates a new project in the x2a database.
 *
 * @public
 */
export function createProjectAction(discoveryApi: DiscoveryService) {
  return createTemplateAction({
    id: 'x2a:project:create',
    description: 'Create a new conversion project.',
    schema: {
      input: {
        name: z => z.string({ description: 'The name of the project' }),
        description: z =>
          z
            .string({ description: 'The description of the project' })
            .optional(),
        abbreviation: z =>
          z.string({ description: 'The abbreviation of the project' }),
        sourceRepoUrl: z =>
          z.string({ description: 'The URL of the source repository' }),
        areTargeAndSourceRepoShared: z =>
          z.boolean({
            description:
              'Whether the target and source repositories are shared',
          }),
        targetRepoUrl: z =>
          z
            .string({ description: 'The URL of the target repository' })
            .optional(),
        targetRepoBranch: z =>
          z.string({ description: 'The branch of the target repository' }),
        userPrompt: z =>
          z
            .string({
              description: 'The user prompt for the project init phase',
            })
            .optional(),
      },
      output: {
        projectId: z =>
          z.string({ description: 'The ID of the created project' }),
        nextUrl: z =>
          z.string({
            description: 'The URL to the next step in the conversion process',
          }),
      },
    },
    async handler(ctx) {
      ctx.logger.info(
        `Running x2a:project:create template action for ${ctx.user?.ref}`,
      );

      const token = ctx.secrets?.backstageToken;

      const api = new DefaultApiClient({
        discoveryApi,
        fetchApi: {
          fetch: (url, options = {}) => {
            // Ensure headers exist and are an object
            const mergedHeaders = {
              ...(options.headers || {}),
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            };
            return fetch(url, {
              ...options,
              headers: mergedHeaders,
            });
          },
        },
      });

      const response = await api.projectsPost({
        body: {
          name: ctx.input.name,
          description: ctx.input.description ?? '',
          abbreviation: ctx.input.abbreviation,
        },
      });
      const project = await response.json();

      ctx.output('projectId', project.id);
      // TODO: Build proper URL of project detail page once implemented
      ctx.output('nextUrl', `/x2a/projects/${project.id}`);
    },
  });
}
