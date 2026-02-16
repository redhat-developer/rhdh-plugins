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
import {
  DefaultApiClient,
  Project,
  ProjectsProjectIdRunPost200Response,
  normalizeRepoUrl,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

/**
 * Options for createProjectAction (e.g. for testing with a mock fetch).
 *
 * @public
 */
export type CreateProjectActionOptions = {
  fetchApi?: { fetch: typeof fetch };
};

/**
 * Creates an `x2a:project:create` Scaffolder action.
 *
 * This action creates a new project in the x2a database.
 *
 * @param discoveryApi - Backstage discovery service
 * @param options - Optional; use fetchApi to inject a custom fetch (e.g. in tests)
 * @public
 */
export function createProjectAction(
  discoveryApi: DiscoveryService,
  options?: CreateProjectActionOptions,
) {
  const fetchApi = options?.fetchApi ?? { fetch };

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
        sourceRepoBranch: z =>
          z.string({ description: 'The branch of the source repository' }),
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
        initJobId: z =>
          z.string({ description: 'The ID of the created init job' }),
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
        fetchApi,
      });

      // Create the project in the x2a database
      const targetRepoUrl = ctx.input.areTargeAndSourceRepoShared
        ? ctx.input.sourceRepoUrl
        : ctx.input.targetRepoUrl;
      if (!targetRepoUrl) {
        throw new Error('Target repository URL is required');
      }

      const sourceRepoToken = ctx.secrets?.SRC_USER_OAUTH_TOKEN;
      if (!sourceRepoToken) {
        throw new Error('Source repository token is required');
      }
      const targetRepoToken = ctx.input.areTargeAndSourceRepoShared
        ? sourceRepoToken
        : ctx.secrets?.TGT_USER_OAUTH_TOKEN;
      if (!targetRepoToken) {
        throw new Error('Target repository token is required');
      }

      const body = {
        name: ctx.input.name,
        description: ctx.input.description ?? '',
        abbreviation: ctx.input.abbreviation,
        sourceRepoUrl: normalizeRepoUrl(ctx.input.sourceRepoUrl),
        targetRepoUrl: normalizeRepoUrl(targetRepoUrl),
        sourceRepoBranch: ctx.input.sourceRepoBranch,
        targetRepoBranch: ctx.input.targetRepoBranch,
      };
      ctx.logger.info(`Creating project ${JSON.stringify(body)}`);

      let project: Project;
      try {
        const response = await api.projectsPost({ body }, { token: token });
        if (!response.ok) {
          const error = (await response.json()) as any;
          ctx.logger.error(
            `Project creation response status: ${response.status}, error: ${JSON.stringify(error)}`,
          );
          throw new Error(error);
        }

        project = await response.json();
      } catch (error) {
        ctx.logger.error(`Error creating project: ${JSON.stringify(error)}`);
        throw new Error(error as string);
      }

      // The project is created, trigger the init-phase automatically
      ctx.logger.info(
        `Triggering init-phase for the just-created project ${project.id}`,
      );

      let initResponseData: ProjectsProjectIdRunPost200Response;
      try {
        const initResponse = await api.projectsProjectIdRunPost(
          {
            path: {
              projectId: project.id,
            },
            body: {
              sourceRepoAuth: {
                token: sourceRepoToken,
              },
              targetRepoAuth: {
                token: targetRepoToken,
              },
              // aapCredentials are skipped in favor of the app-config configuration
              userPrompt: ctx.input.userPrompt,
            },
          },
          { token: token },
        );

        if (!initResponse.ok) {
          const error = (await initResponse.json()) as any;
          ctx.logger.error(
            `Init-phase response status: ${initResponse.status}, error: ${JSON.stringify(error)}`,
          );
          throw new Error(error);
        }

        initResponseData = await initResponse.json();
      } catch (error) {
        ctx.logger.error(
          `Error triggering init-phase: ${JSON.stringify(error)}`,
        );
        throw new Error(error as string);
      }

      ctx.logger.info(
        `Init-phase triggered for project ${project.id} with response ${JSON.stringify(initResponseData)}`,
      );

      // Output the results
      ctx.output('projectId', project.id);
      ctx.output('initJobId', initResponseData.jobId);
      // TODO: Build proper URL of project detail page once implemented
      ctx.output('nextUrl', `/x2a/projects/${project.id}`);
    },
  });
}
