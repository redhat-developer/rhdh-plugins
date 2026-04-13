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
import { NotFoundError } from '@backstage/errors';
import type { X2aActionsOptions } from './index';
import { resolveCredentialsContext } from './credentials';

export function createTriggerNextPhaseAction(options: X2aActionsOptions) {
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
    name: 'x2a-trigger-next-phase',
    title: 'Get URL to Trigger X2A Next Phase',
    attributes: {
      readOnly: true,
      idempotent: true,
    },
    description: `Return the full URL to the Project Details page for an X2A migration project.

IMPORTANT: This tool does NOT trigger the next phase automatically.
The output includes a projectDetailsUrl that the user must open in their browser.
On the Project Details page, the user will manually trigger the next migration phase
and provide source and target SCM (repository) authentication tokens.

Instruct the user to:
1. Open the returned projectDetailsUrl in their browser.
2. On the Project Details page, trigger the next phase and enter the required SCM tokens.`,
    schema: {
      input: z =>
        z.object({
          projectId: z
            .string()
            .describe('UUID of the project to get the details page URL for.'),
        }),
      output: z =>
        z.object({
          projectId: z.string().describe('UUID of the project.'),
          name: z.string().describe('Name of the project.'),
          projectDetailsUrl: z
            .string()
            .describe(
              'Full URL to the Project Details page. ' +
                'Direct the user to open this URL in their browser to trigger the next migration phase ' +
                'and provide source and target SCM authentication tokens.',
            ),
        }),
    },
    action: async ({ input, credentials }) => {
      const { projectId } = input;
      logger.info(
        `MCP tool x2a-trigger-next-phase invoked for project ${projectId}`,
      );

      const ctx = await resolveCredentialsContext({
        credentials,
        auth,
        catalog,
        permissionsSvc,
        readOnly: true,
      });

      const project = await x2aDatabase.getProject(
        { projectId, skipEnrichment: true },
        {
          credentials: ctx.credentials,
          canViewAll: ctx.canWriteAll || ctx.canViewAll,
          groupsOfUser: ctx.groupsOfUser,
        },
      );
      if (!project) {
        throw new NotFoundError(
          `Project not found for the "${ctx.userRef}" user.`,
        );
      }

      const appBaseUrl = config.getString('app.baseUrl');
      const projectDetailsUrl = `${appBaseUrl}/x2a/projects/${projectId}`;

      return {
        output: {
          projectId: project.id,
          name: project.name,
          projectDetailsUrl,
        },
      };
    },
  });
}
