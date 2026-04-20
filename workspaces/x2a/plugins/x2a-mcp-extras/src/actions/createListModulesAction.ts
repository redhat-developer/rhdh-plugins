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
import { listModulesWithReconciledStatuses } from '@red-hat-developer-hub/backstage-plugin-x2a-node';

import type { X2aActionsOptions } from './index';
import { resolveCredentialsContext } from './credentials';

export function createListModulesAction(options: X2aActionsOptions) {
  const {
    actionsRegistry,
    auth,
    catalog,
    config,
    logger,
    permissionsSvc,
    x2aDatabase,
    kubeService,
  } = options;

  actionsRegistry.register({
    name: 'x2a-list-modules',
    title: 'List X2A Project Modules',
    description: `List all migration modules for an X2A project identified by projectId, including aggregate status and last job per phase (analyze, migrate, publish).`,
    attributes: {
      readOnly: true,
      idempotent: true,
      destructive: false,
    },
    schema: {
      input: z =>
        z.object({
          projectId: z
            .string()
            .describe('UUID of the project whose modules should be listed.'),
        }),
      output: z =>
        z.object({
          projectId: z.string(),
          projectName: z.string(),
          projectDetailsUrl: z
            .string()
            .describe(
              'Full URL to the Project Details page in the Backstage UI.',
            ),
          items: z
            .array(z.record(z.string(), z.unknown()))
            .describe(
              'Modules with statuses and optional phase jobs, same JSON shape as GET /projects/:projectId/modules plus augmented for the moduleDetailsUrl where the user can see module details and trigger next phase.',
            ),
        }),
    },
    action: async ({ input, credentials }) => {
      const { projectId } = input;
      logger.info(`MCP tool x2a-list-modules invoked for project ${projectId}`);

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
          canViewAll: ctx.canViewAll,
          groupsOfUser: ctx.groupsOfUser,
        },
      );
      if (!project) {
        throw new NotFoundError(
          `Project not found for the "${ctx.userRef}" user.`,
        );
      }

      const modules = await x2aDatabase.listModules({ projectId });
      await listModulesWithReconciledStatuses(modules, {
        kubeService,
        x2aDatabase,
        logger,
      });

      const appBaseUrl = config.getString('app.baseUrl');
      const serialized = JSON.parse(
        JSON.stringify(
          modules.map(module => ({
            ...module,
            moduleDetailsUrl: `${appBaseUrl}/x2a/projects/${project.id}/modules/${module.id}`,
          })),
        ),
      ) as Record<string, unknown>[];

      return {
        output: {
          projectId: project.id,
          projectName: project.name,
          projectDetailsUrl: `${appBaseUrl}/x2a/projects/${project.id}`,
          items: serialized,
        },
      };
    },
  });
}
