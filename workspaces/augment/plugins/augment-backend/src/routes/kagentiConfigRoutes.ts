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

import type { KagentiRouteRegistrarContext } from './kagentiRoutes';

/**
 * Registers Kagenti health, config, and namespace listing routes.
 */
export function registerKagentiConfigRoutes(
  ctx: KagentiRouteRegistrarContext,
): void {
  const { router, kagenti, api, withRoute } = ctx;

  router.get(
    '/kagenti/health',
    withRoute(
      'GET /kagenti/health',
      'Failed to get Kagenti health',
      async (_req, res) => {
        const [health, ready] = await Promise.all([api.health(), api.ready()]);
        res.json({ health: health.status, ready: ready.status === 'ready' });
      },
    ),
  );

  router.get(
    '/kagenti/config/features',
    withRoute(
      'GET /kagenti/config/features',
      'Failed to get feature flags',
      async (_req, res) => {
        res.json(kagenti.getFeatureFlags());
      },
    ),
  );

  router.get(
    '/kagenti/config/dashboards',
    withRoute(
      'GET /kagenti/config/dashboards',
      'Failed to get dashboards',
      async (_req, res) => {
        const dashboards = await api.getDashboards();
        const overrides = kagenti.getConfig().dashboards;
        const merged = {
          ...dashboards,
          ...(overrides.mcpInspector && {
            mcpInspector: overrides.mcpInspector,
          }),
          ...(overrides.mcpProxy && { mcpProxy: overrides.mcpProxy }),
          ...(overrides.traces && { traces: overrides.traces }),
          ...(overrides.network && { network: overrides.network }),
          ...(overrides.keycloakConsole && {
            keycloakConsole: overrides.keycloakConsole,
          }),
          ...(overrides.domainName && {
            domainName: overrides.domainName,
          }),
        };
        res.json(merged);
      },
    ),
  );

  router.get(
    '/kagenti/namespaces',
    withRoute(
      'GET /kagenti/namespaces',
      'Failed to list namespaces',
      async (req, res) => {
        const enabledOnly = req.query.enabled_only !== 'false';
        const result = await api.listNamespaces(enabledOnly);
        res.json({
          ...result,
          defaultNamespace: kagenti.getConfig().namespace,
        });
      },
    ),
  );
}
