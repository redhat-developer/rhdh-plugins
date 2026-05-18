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
import { RUN_INIT_DEEP_LINK_HASH } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
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

After the project is created, the output includes a projectDetailsUrl (including a URL fragment that opens the init re-run confirmation when the project is eligible).
IMPORTANT: The next step is to instruct the user to open this URL in their browser.
On the Project Details page, the user confirms in the dialog and provides the source and target SCM (repository) authentication tokens.
The init phase cannot be started automatically from this tool - the user must visit the page to pass down tokens for the source control managers.`,
    schema: {
      input: z =>
        z.object({
          name: z.string().describe('Full name of the migration project.'),
          description: z.string().describe('Description of the project.'),
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
          acceptedRuleIds: z
            .array(z.string())
            .optional()
            .describe(
              'UUIDs of rules to accept for this project. ' +
                'Required rules are auto-appended. ' +
                'Use x2a-list-rules to discover available rules.',
            ),
        }),
      output: z =>
        z.object({
          id: z.string().describe('UUID of the newly created project.'),
          name: z.string().describe('Full name of the project.'),
          description: z
            .string()
            .optional()
            .describe('Human-readable description of the migration project.'),
          sourceRepoUrl: z
            .string()
            .describe(
              'Clone URL of the legacy source repository to migrate from.',
            ),
          targetRepoUrl: z
            .string()
            .describe(
              'Clone URL of the target repository where migrated content is pushed.',
            ),
          sourceRepoBranch: z
            .string()
            .describe('Git branch to read from in the source repository.'),
          targetRepoBranch: z
            .string()
            .describe('Git branch to write to in the target repository.'),
          ownedBy: z
            .string()
            .describe(
              'Backstage user entity reference of the project owner (e.g. user:default/jane).',
            ),
          createdAt: z
            .string()
            .describe('ISO 8601 timestamp when the project was created.'),
          projectDetailsUrl: z
            .string()
            .describe(
              'Full URL to the Project Details page, ending with a hash that opens the init re-run confirmation when eligible. ' +
                'Direct the user to open this URL in their browser to confirm init and provide source and target SCM authentication tokens.',
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
          sourceRepoUrl: input.sourceRepoUrl,
          targetRepoUrl: input.targetRepoUrl,
          sourceRepoBranch: input.sourceRepoBranch,
          targetRepoBranch: input.targetRepoBranch,
          ownedByGroup: input.ownedByGroup,
        },
        { credentials: ctx.credentials },
      );

      // Attach accepted rules (auto-appends required rules even with empty array)
      await x2aDatabase.attachRulesToProject({
        projectId: project.id,
        ruleIds: input.acceptedRuleIds ?? [],
      });

      const appBaseUrl = config.getString('app.baseUrl');
      const projectDetailsUrl = `${appBaseUrl}/x2a/projects/${project.id}${RUN_INIT_DEEP_LINK_HASH}`;

      return {
        output: {
          id: project.id,
          name: project.name,
          description: project.description,
          sourceRepoUrl: project.sourceRepoUrl,
          targetRepoUrl: project.targetRepoUrl,
          sourceRepoBranch: project.sourceRepoBranch,
          targetRepoBranch: project.targetRepoBranch,
          ownedBy: project.ownedBy,
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
