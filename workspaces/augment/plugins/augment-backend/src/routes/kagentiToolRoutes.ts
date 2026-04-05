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

import { InputError } from '@backstage/errors';
import type { KagentiRouteRegistrarContext } from './kagentiRoutes';
import { getVisibleNamespaces } from '../providers/kagenti/kagentiNamespaceUtils';

/**
 * Registers Kagenti tool CRUD, builds, MCP connect/invoke, and Shipwright routes.
 */
export function registerKagentiToolRoutes(
  ctx: KagentiRouteRegistrarContext,
): void {
  const {
    router,
    logger,
    kagenti,
    api,
    withRoute,
    validateNamespaceParam,
    requireAdminAccess,
  } = ctx;

  router.get(
    '/kagenti/tools',
    validateNamespaceParam,
    withRoute(
      'GET /kagenti/tools',
      'Failed to list tools',
      async (req, res) => {
        const namespace = req.query.namespace as string | undefined;
        if (namespace) {
          const result = await api.listTools(namespace);
          res.json(result);
          return;
        }

        const visibleNs = await getVisibleNamespaces(
          api,
          kagenti.getConfig(),
          logger,
        );

        const allTools: import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiToolSummary[] =
          [];
        for (const ns of visibleNs) {
          try {
            const result = await api.listTools(ns);
            allTools.push(...(result.items ?? []));
          } catch (nsErr) {
            logger.warn(
              `Failed to list tools in namespace ${ns}: ${nsErr instanceof Error ? nsErr.message : nsErr}`,
            );
          }
        }
        res.json({ tools: allTools });
      },
    ),
  );

  router.get(
    '/kagenti/tools/:namespace/:name',
    validateNamespaceParam,
    withRoute(
      req => `GET /kagenti/tools/${req.params.namespace}/${req.params.name}`,
      'Failed to get tool',
      async (req, res) => {
        const { namespace, name } = req.params;
        const result = await api.getTool(namespace, name);
        res.json(result);
      },
    ),
  );

  router.get(
    '/kagenti/tools/:namespace/:name/route-status',
    validateNamespaceParam,
    withRoute(
      req =>
        `GET /kagenti/tools/${req.params.namespace}/${req.params.name}/route-status`,
      'Failed to get tool route status',
      async (req, res) => {
        const { namespace, name } = req.params;
        const result = await api.getToolRouteStatus(namespace, name);
        res.json(result);
      },
    ),
  );

  router.post(
    '/kagenti/tools',
    requireAdminAccess,
    withRoute(
      'POST /kagenti/tools',
      'Failed to create tool',
      async (req, res) => {
        if (!req.body?.name || typeof req.body.name !== 'string') {
          throw new InputError('name is required and must be a string');
        }
        if (!req.body?.namespace || typeof req.body.namespace !== 'string') {
          throw new InputError('namespace is required and must be a string');
        }
        const result = await api.createTool(req.body);
        res.json(result);
      },
    ),
  );

  router.delete(
    '/kagenti/tools/:namespace/:name',
    requireAdminAccess,
    validateNamespaceParam,
    withRoute(
      req => `DELETE /kagenti/tools/${req.params.namespace}/${req.params.name}`,
      'Failed to delete tool',
      async (req, res) => {
        const { namespace, name } = req.params;
        const result = await api.deleteTool(namespace, name);
        res.json(result);
      },
    ),
  );

  router.get(
    '/kagenti/tools/:namespace/:name/build-info',
    validateNamespaceParam,
    withRoute(
      req =>
        `GET /kagenti/tools/${req.params.namespace}/${req.params.name}/build-info`,
      'Failed to get tool build info',
      async (req, res) => {
        const { namespace, name } = req.params;
        const result = await api.getToolBuildInfo(namespace, name);
        res.json(result);
      },
    ),
  );

  router.post(
    '/kagenti/tools/:namespace/:name/buildrun',
    requireAdminAccess,
    validateNamespaceParam,
    withRoute(
      req =>
        `POST /kagenti/tools/${req.params.namespace}/${req.params.name}/buildrun`,
      'Failed to trigger tool build run',
      async (req, res) => {
        const { namespace, name } = req.params;
        const result = await api.triggerToolBuildRun(namespace, name);
        res.json(result);
      },
    ),
  );

  router.post(
    '/kagenti/tools/:namespace/:name/finalize-build',
    requireAdminAccess,
    validateNamespaceParam,
    withRoute(
      req =>
        `POST /kagenti/tools/${req.params.namespace}/${req.params.name}/finalize-build`,
      'Failed to finalize tool build',
      async (req, res) => {
        const { namespace, name } = req.params;
        const result = await api.finalizeToolBuild(namespace, name, req.body);
        res.json(result);
      },
    ),
  );

  router.post(
    '/kagenti/tools/:namespace/:name/connect',
    validateNamespaceParam,
    withRoute(
      req =>
        `POST /kagenti/tools/${req.params.namespace}/${req.params.name}/connect`,
      'Failed to connect to MCP tool',
      async (req, res) => {
        const { namespace, name } = req.params;
        const result = await api.connectTool(namespace, name);
        res.json(result);
      },
    ),
  );

  router.post(
    '/kagenti/tools/:namespace/:name/invoke',
    validateNamespaceParam,
    withRoute(
      req =>
        `POST /kagenti/tools/${req.params.namespace}/${req.params.name}/invoke`,
      'Failed to invoke MCP tool',
      async (req, res) => {
        const { namespace, name } = req.params;
        const { tool_name, arguments: args } = req.body ?? {};
        if (!tool_name || typeof tool_name !== 'string') {
          throw new InputError('tool_name is required and must be a string');
        }
        const result = await api.invokeTool(
          namespace,
          name,
          tool_name,
          args ?? {},
        );
        res.json(result);
      },
    ),
  );

  router.get(
    '/kagenti/shipwright/builds',
    withRoute(
      'GET /kagenti/shipwright/builds',
      'Failed to list Shipwright builds',
      async (req, res) => {
        const namespace = req.query.namespace as string | undefined;
        const allNamespaces = req.query.allNamespaces === 'true';
        const result = await api.listAllBuilds(namespace, allNamespaces);
        res.json({ builds: result.items ?? [] });
      },
    ),
  );
}
