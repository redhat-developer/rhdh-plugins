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
import type { X2aActionsOptions } from './index';
import { resolveCredentialsContext } from './credentials';

export function createListProjectsAction(options: X2aActionsOptions) {
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
    name: 'x2a-list-projects',
    title: 'List X2A Migration Projects',
    description: `List migration projects visible to the current user with optional pagination and sorting.
Returns projects with their current status, migration plan summary, and init-job state.
The output includes projectListUrl, a full URL to the X2A projects list in the UI.
When authenticated via OAuth (DCR), results are scoped to the user's RBAC permissions.`,
    attributes: {
      readOnly: true,
      idempotent: true,
    },
    schema: {
      input: z =>
        z.object({
          page: z
            .number()
            .int()
            .min(0)
            .optional()
            .describe('Page number (0-based). Defaults to 0.'),
          pageSize: z
            .number()
            .int()
            .min(1)
            .max(100)
            .optional()
            .describe('Number of results per page (1-100). Defaults to 20.'),
          sort: z
            .enum([
              'createdAt',
              'name',
              'abbreviation',
              'status',
              'description',
              'ownedBy',
            ])
            .optional()
            .describe('Field to sort by. Defaults to createdAt.'),
          order: z
            .enum(['asc', 'desc'])
            .optional()
            .describe('Sort order. Defaults to desc.'),
        }),
      output: z =>
        z.object({
          totalCount: z.number().describe('Total number of matching projects.'),
          projectListUrl: z
            .string()
            .describe(
              'Full URL to the X2A projects list page in the Backstage UI (app base URL + /x2a/projects).',
            ),
          items: z
            .array(
              z.object({
                id: z.string(),
                name: z.string(),
                abbreviation: z.string(),
                description: z.string().optional(),
                sourceRepoUrl: z.string(),
                targetRepoUrl: z.string(),
                sourceRepoBranch: z.string(),
                targetRepoBranch: z.string(),
                ownedBy: z.string(),
                createdAt: z.string(),
                status: z
                  .object({
                    state: z.string(),
                  })
                  .optional(),
                projectDetailsUrl: z.string(),
              }),
            )
            .describe('List of projects on this page.'),
        }),
    },
    action: async ({ input, credentials }) => {
      logger.info('MCP tool x2a-list-projects invoked');

      const ctx = await resolveCredentialsContext({
        credentials,
        auth,
        catalog,
        permissionsSvc,
        readOnly: true,
      });

      const { projects, totalCount } = await x2aDatabase.listProjects(
        {
          page: input.page,
          pageSize: input.pageSize,
          sort: input.sort,
          order: input.order,
        },
        {
          credentials: ctx.credentials,
          canViewAll: ctx.canViewAll,
          groupsOfUser: ctx.groupsOfUser,
        },
      );

      const appBaseUrl = config.getString('app.baseUrl');
      const projectListUrl = `${appBaseUrl}/x2a/projects`;

      return {
        output: {
          totalCount,
          projectListUrl,
          items: projects.map(p => ({
            id: p.id,
            name: p.name,
            abbreviation: p.abbreviation,
            description: p.description,
            sourceRepoUrl: p.sourceRepoUrl,
            targetRepoUrl: p.targetRepoUrl,
            sourceRepoBranch: p.sourceRepoBranch,
            targetRepoBranch: p.targetRepoBranch,
            ownedBy: p.ownedBy,
            createdAt:
              p.createdAt instanceof Date
                ? p.createdAt.toISOString()
                : String(p.createdAt),
            status: p.status ? { state: p.status.state } : undefined,
            projectDetailsUrl: `${appBaseUrl}/x2a/projects/${p.id}`,
          })),
        },
      };
    },
  });
}
