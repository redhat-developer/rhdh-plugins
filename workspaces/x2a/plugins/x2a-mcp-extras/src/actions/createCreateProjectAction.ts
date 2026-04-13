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
import { NotAllowedError } from '@backstage/errors';
import type { X2aActionsOptions } from './index';
import { resolveCredentialsContext } from './credentials';

export function createCreateProjectAction(options: X2aActionsOptions) {
  const {
    actionsRegistry,
    auth,
    catalog,
    config,
    logger,
    permissionsSvc,
    x2aDatabase,
  } = options;

  actionsRegistry.register({
    name: 'x2a-create-project',
    title: 'Create X2A Migration Project',
    attributes: {
      destructive: true,
      readOnly: false,
      idempotent: false,
    },
    description: `Create a new X2A migration project.
Requires the source and target repository URLs and branch names.
The project will be owned by the authenticated user (when using OAuth) or by the system user (when using static tokens).
An optional ownedByGroup can be specified if the user is a member of that Backstage group.

After the project is created, the output includes a projectDetailsUrl.
IMPORTANT: The next step is to instruct the user to open this URL in their browser.
On the Project Details page, the user must manually trigger the init phase and provide the source and target SCM (repository) authentication tokens.
The init phase cannot be started automatically from this tool - the user must visit the page and trigger it themselves to pass down tokens for the source control managers.`,
    schema: {
      input: z =>
        z.object({
          name: z.string().describe('Full name of the migration project.'),
          description: z.string().describe('Description of the project.'),
          abbreviation: z
            .string()
            .describe('Short abbreviation for the project.'),
          sourceRepoUrl: z.string().describe('URL of the source repository.'),
          targetRepoUrl: z.string().describe('URL of the target repository.'),
          sourceRepoBranch: z
            .string()
            .describe('Branch of the source repository.'),
          targetRepoBranch: z
            .string()
            .describe('Branch of the target repository.'),
          ownedByGroup: z
            .string()
            .optional()
            .describe(
              'Optional Backstage group entity ref to own this project. ' +
                'The user must be a member of this group.',
            ),
        }),
      output: z =>
        z.object({
          id: z.string().describe('UUID of the newly created project.'),
          name: z.string(),
          abbreviation: z.string(),
          description: z.string().optional(),
          sourceRepoUrl: z.string(),
          targetRepoUrl: z.string(),
          sourceRepoBranch: z.string(),
          targetRepoBranch: z.string(),
          createdBy: z.string(),
          createdAt: z.string(),
          projectDetailsUrl: z
            .string()
            .describe(
              'Full URL to the Project Details page. ' +
                'Direct the user to open this URL in their browser to trigger the init phase ' +
                'and provide source and target SCM authentication tokens.',
            ),
        }),
    },
    action: async ({ input, credentials }) => {
      logger.info('MCP tool x2a-create-project invoked');

      const ctx = await resolveCredentialsContext({
        credentials,
        auth,
        catalog,
        permissionsSvc,
        readOnly: false,
      });

      if (input.ownedByGroup) {
        if (!ctx.groupsOfUser.includes(input.ownedByGroup)) {
          throw new NotAllowedError(
            'You are not allowed to create a project for the given group.',
          );
        }
      }

      const project = await x2aDatabase.createProject(
        {
          name: input.name,
          description: input.description,
          abbreviation: input.abbreviation,
          sourceRepoUrl: input.sourceRepoUrl,
          targetRepoUrl: input.targetRepoUrl,
          sourceRepoBranch: input.sourceRepoBranch,
          targetRepoBranch: input.targetRepoBranch,
          ownedByGroup: input.ownedByGroup,
        },
        { credentials: ctx.credentials },
      );

      const appBaseUrl = config.getString('app.baseUrl');
      const projectDetailsUrl = `${appBaseUrl}/x2a/projects/${project.id}`;

      return {
        output: {
          id: project.id,
          name: project.name,
          abbreviation: project.abbreviation,
          description: project.description,
          sourceRepoUrl: project.sourceRepoUrl,
          targetRepoUrl: project.targetRepoUrl,
          sourceRepoBranch: project.sourceRepoBranch,
          targetRepoBranch: project.targetRepoBranch,
          createdBy: project.createdBy,
          createdAt:
            project.createdAt instanceof Date
              ? project.createdAt.toISOString()
              : String(project.createdAt),
          projectDetailsUrl,
        },
      };
    },
  });
}
