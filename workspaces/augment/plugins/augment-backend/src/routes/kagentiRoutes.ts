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

import * as net from 'net';
import { InputError } from '@backstage/errors';
import { createWithRoute } from './routeWrapper';
import type { RouteContext } from './types';
import type { KagentiProvider } from '../providers/kagenti';

const PRIVATE_IP_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
];

function isPrivateHost(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '::1' || hostname === '[::1]') {
    return true;
  }
  if (net.isIPv4(hostname)) {
    return PRIVATE_IP_RANGES.some(r => r.test(hostname));
  }
  if (net.isIPv6(hostname.replace(/^\[|\]$/g, ''))) {
    const bare = hostname.replace(/^\[|\]$/g, '');
    return (
      bare === '::1' ||
      bare.startsWith('fe80:') ||
      bare.startsWith('fc') ||
      bare.startsWith('fd')
    );
  }
  return false;
}

/**
 * Registers core Kagenti routes for agent lifecycle, tool management,
 * namespaces, config, and Shipwright builds.
 *
 * These routes are always registered when the active provider is 'kagenti'.
 */
export function registerKagentiRoutes(ctx: RouteContext): void {
  const { router, logger, provider, sendRouteError } = ctx;
  const withRoute = createWithRoute(logger, sendRouteError);

  if (provider.id !== 'kagenti') {
    logger.warn(
      'registerKagentiRoutes called but provider is not kagenti, skipping',
    );
    return;
  }

  const kagenti = provider as KagentiProvider;
  const api = kagenti.getApiClient();

  // -- Health -----------------------------------------------------------------

  router.get(
    '/kagenti/health',
    withRoute(
      'GET /kagenti/health',
      'Failed to get Kagenti health',
      async (_req, res) => {
        const [health, ready] = await Promise.all([api.health(), api.ready()]);
        res.json({ health: health.status, ready: ready.status });
      },
    ),
  );

  // -- Config -----------------------------------------------------------------

  router.get(
    '/kagenti/config/features',
    withRoute(
      'GET /kagenti/config/features',
      'Failed to get feature flags',
      async (_req, res) => {
        const flags = await api.getFeatureFlags();
        res.json(flags);
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
        };
        res.json(merged);
      },
    ),
  );

  // -- Namespaces -------------------------------------------------------------

  router.get(
    '/kagenti/namespaces',
    withRoute(
      'GET /kagenti/namespaces',
      'Failed to list namespaces',
      async (req, res) => {
        const enabledOnly = req.query.enabled_only !== 'false';
        const result = await api.listNamespaces(enabledOnly);
        res.json(result);
      },
    ),
  );

  // -- Agents -----------------------------------------------------------------

  router.get(
    '/kagenti/agents',
    withRoute(
      'GET /kagenti/agents',
      'Failed to list agents',
      async (req, res) => {
        const namespace = req.query.namespace as string | undefined;
        const result = await api.listAgents(namespace);
        res.json(result);
      },
    ),
  );

  router.get(
    '/kagenti/agents/migration/migratable',
    withRoute(
      'GET /kagenti/agents/migration/migratable',
      'Failed to list migratable agents',
      async (_req, res) => {
        const result = await api.listMigratableAgents();
        res.json(result);
      },
    ),
  );

  router.get(
    '/kagenti/agents/build-strategies',
    withRoute(
      'GET /kagenti/agents/build-strategies',
      'Failed to list build strategies',
      async (_req, res) => {
        const result = await api.listBuildStrategies();
        res.json(result);
      },
    ),
  );

  router.get(
    '/kagenti/agents/:namespace/:name',
    withRoute(
      req => `GET /kagenti/agents/${req.params.namespace}/${req.params.name}`,
      'Failed to get agent',
      async (req, res) => {
        const { namespace, name } = req.params;
        const detail = await api.getAgent(namespace, name);
        let agentCard;
        try {
          agentCard = await api.getAgentCard(namespace, name);
        } catch (cardErr) {
          const msg =
            cardErr instanceof Error ? cardErr.message : String(cardErr);
          const statusMatch = msg.match(/status (\d+)/);
          const status = statusMatch ? Number(statusMatch[1]) : 0;
          if (status === 404 || status === 503) {
            logger.debug(
              `No agent card for ${namespace}/${name} (status ${status})`,
            );
          } else {
            logger.warn(
              `Failed to fetch agent card for ${namespace}/${name}: ${msg}`,
            );
          }
        }
        res.json({ ...detail, agentCard });
      },
    ),
  );

  router.get(
    '/kagenti/agents/:namespace/:name/route-status',
    withRoute(
      req =>
        `GET /kagenti/agents/${req.params.namespace}/${req.params.name}/route-status`,
      'Failed to get agent route status',
      async (req, res) => {
        const { namespace, name } = req.params;
        const result = await api.getAgentRouteStatus(namespace, name);
        res.json(result);
      },
    ),
  );

  router.post(
    '/kagenti/agents',
    withRoute(
      'POST /kagenti/agents',
      'Failed to create agent',
      async (req, res) => {
        if (!req.body?.name || typeof req.body.name !== 'string') {
          throw new InputError('name is required and must be a string');
        }
        if (!req.body?.namespace || typeof req.body.namespace !== 'string') {
          throw new InputError('namespace is required and must be a string');
        }
        const result = await api.createAgent(req.body);
        res.json(result);
      },
    ),
  );

  router.delete(
    '/kagenti/agents/:namespace/:name',
    withRoute(
      req =>
        `DELETE /kagenti/agents/${req.params.namespace}/${req.params.name}`,
      'Failed to delete agent',
      async (req, res) => {
        const { namespace, name } = req.params;
        const result = await api.deleteAgent(namespace, name);
        res.json(result);
      },
    ),
  );

  // -- Agent Migration --------------------------------------------------------

  router.post(
    '/kagenti/agents/:namespace/:name/migrate',
    withRoute(
      req =>
        `POST /kagenti/agents/${req.params.namespace}/${req.params.name}/migrate`,
      'Failed to migrate agent',
      async (req, res) => {
        const { namespace, name } = req.params;
        const migrationDefaults = kagenti.getConfig().migration;
        const deleteOld = req.body?.delete_old ?? migrationDefaults.deleteOld;
        const result = await api.migrateAgent(namespace, name, deleteOld);
        res.json(result);
      },
    ),
  );

  router.post(
    '/kagenti/agents/migration/migrate-all',
    withRoute(
      'POST /kagenti/agents/migration/migrate-all',
      'Failed to migrate all agents',
      async (req, res) => {
        const migrationDefaults = kagenti.getConfig().migration;
        const dryRunParam = req.query.dry_run as string | undefined;
        const deleteOldParam = req.query.delete_old as string | undefined;
        const result = await api.migrateAllAgents({
          namespace: req.query.namespace as string | undefined,
          dryRun:
            dryRunParam !== undefined
              ? dryRunParam === 'true'
              : migrationDefaults.dryRun,
          deleteOld:
            deleteOldParam !== undefined
              ? deleteOldParam === 'true'
              : migrationDefaults.deleteOld,
        });
        res.json(result);
      },
    ),
  );

  // -- Agent Builds -----------------------------------------------------------

  router.get(
    '/kagenti/agents/:namespace/:name/build-info',
    withRoute(
      req =>
        `GET /kagenti/agents/${req.params.namespace}/${req.params.name}/build-info`,
      'Failed to get agent build info',
      async (req, res) => {
        const { namespace, name } = req.params;
        const result = await api.getAgentBuildInfo(namespace, name);
        res.json(result);
      },
    ),
  );

  router.post(
    '/kagenti/agents/:namespace/:name/buildrun',
    withRoute(
      req =>
        `POST /kagenti/agents/${req.params.namespace}/${req.params.name}/buildrun`,
      'Failed to trigger agent build run',
      async (req, res) => {
        const { namespace, name } = req.params;
        const result = await api.triggerAgentBuildRun(namespace, name);
        res.json(result);
      },
    ),
  );

  router.post(
    '/kagenti/agents/:namespace/:name/finalize-build',
    withRoute(
      req =>
        `POST /kagenti/agents/${req.params.namespace}/${req.params.name}/finalize-build`,
      'Failed to finalize agent build',
      async (req, res) => {
        const { namespace, name } = req.params;
        const result = await api.finalizeAgentBuild(namespace, name, req.body);
        res.json(result);
      },
    ),
  );

  // -- Agent Utilities --------------------------------------------------------

  router.post(
    '/kagenti/agents/parse-env',
    withRoute(
      'POST /kagenti/agents/parse-env',
      'Failed to parse env',
      async (req, res) => {
        const result = await api.parseEnv(req.body?.content ?? '');
        res.json(result);
      },
    ),
  );

  router.post(
    '/kagenti/agents/fetch-env-url',
    withRoute(
      'POST /kagenti/agents/fetch-env-url',
      'Failed to fetch env URL',
      async (req, res) => {
        const url = req.body?.url;
        if (!url || typeof url !== 'string') {
          throw new InputError('url is required');
        }
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          throw new InputError('Only http and https URLs are allowed');
        }
        const hostname = parsed.hostname;
        if (isPrivateHost(hostname)) {
          throw new InputError(
            'Requests to private/internal addresses are not allowed',
          );
        }
        const result = await api.fetchEnvUrl(url);
        res.json(result);
      },
    ),
  );

  // -- Tools ------------------------------------------------------------------

  router.get(
    '/kagenti/tools',
    withRoute(
      'GET /kagenti/tools',
      'Failed to list tools',
      async (req, res) => {
        const namespace = req.query.namespace as string | undefined;
        const result = await api.listTools(namespace);
        res.json(result);
      },
    ),
  );

  router.get(
    '/kagenti/tools/:namespace/:name',
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

  // -- Tool Builds ------------------------------------------------------------

  router.get(
    '/kagenti/tools/:namespace/:name/build-info',
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

  // -- Tool MCP ---------------------------------------------------------------

  router.post(
    '/kagenti/tools/:namespace/:name/connect',
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

  // -- Shipwright (global) ----------------------------------------------------

  router.get(
    '/kagenti/shipwright/builds',
    withRoute(
      'GET /kagenti/shipwright/builds',
      'Failed to list Shipwright builds',
      async (req, res) => {
        const namespace = req.query.namespace as string | undefined;
        const allNamespaces = req.query.allNamespaces === 'true';
        const result = await api.listAllBuilds(namespace, allNamespaces);
        res.json(result);
      },
    ),
  );
}
