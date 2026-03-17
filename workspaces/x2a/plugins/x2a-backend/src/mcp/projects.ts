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
import type {
  BackstageCredentials,
  BackstageUserPrincipal,
  PermissionsService,
} from '@backstage/backend-plugin-api';
import type { ActionsRegistryService } from '@backstage/backend-plugin-api/alpha';
import type { CatalogService } from '@backstage/plugin-catalog-node';
import type { x2aDatabaseServiceRef } from '../services/X2ADatabaseService';
import { listProjects } from '../router/listProjects';

interface ProjectActionsOptions {
  actionsRegistry: ActionsRegistryService;
  permissionsSvc: PermissionsService;
  catalog: CatalogService;
  x2aDatabase: typeof x2aDatabaseServiceRef.T;
}

export function registerProjectActions({
  actionsRegistry,
  permissionsSvc,
  catalog,
  x2aDatabase,
}: ProjectActionsOptions): void {
  actionsRegistry.register({
    name: 'x2a:project:list',
    title: 'List x2a Projects',
    description:
      'List conversion projects with optional pagination and sorting.',
    attributes: { readOnly: true },
    schema: {
      input: z =>
        z.object({
          page: z.number().optional().describe('Page number (0-indexed)'),
          pageSize: z
            .number()
            .optional()
            .describe('Number of results per page'),
          order: z.enum(['asc', 'desc']).optional().describe('Sort order'),
          sort: z
            .enum([
              'createdAt',
              'name',
              'abbreviation',
              'status',
              'description',
              'createdBy',
            ])
            .optional()
            .describe('Field to sort by'),
        }),
      output: z =>
        z.object({
          totalCount: z.number().describe('Total number of projects'),
          projects: z
            .string()
            .describe('JSON-serialized array of project objects'),
        }),
    },
    action: async ({ input, credentials, logger }) => {
      logger.info('Running x2a:project:list MCP action');
      const response = await listProjects(
        input,
        { permissionsSvc, catalog, x2aDatabase },
        credentials as BackstageCredentials<BackstageUserPrincipal>,
      );
      return {
        output: {
          totalCount: response.totalCount ?? 0,
          projects: JSON.stringify(response.items ?? []),
        },
      };
    },
  });
}
