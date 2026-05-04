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
import { validatePublicUrl } from './validatePublicUrl';
import type { KagentiRouteRegistrarContext } from './kagentiRoutes';
import { getVisibleNamespaces } from '../providers/kagenti/kagentiNamespaceUtils';

/**
 * Registers Kagenti agent CRUD, migration, builds, and env utility routes.
 */
export function registerKagentiAgentRoutes(
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
    '/kagenti/agents',
    validateNamespaceParam,
    withRoute(
      'GET /kagenti/agents',
      'Failed to list agents',
      async (req, res) => {
        const namespace = req.query.namespace as string | undefined;
        const includeCards = req.query.include === 'cards';

        let allAgents: import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiAgentSummary[];

        if (namespace) {
          const result = await api.listAgents(namespace);
          allAgents = result.items ?? [];
        } else {
          const visibleNs = await getVisibleNamespaces(
            api,
            kagenti.getConfig(),
            logger,
          );

          allAgents = [];
          for (const ns of visibleNs) {
            try {
              const result = await api.listAgents(ns);
              allAgents.push(...(result.items ?? []));
            } catch (nsErr) {
              logger.warn(
                `Failed to list agents in namespace ${ns}: ${nsErr instanceof Error ? nsErr.message : nsErr}`,
              );
            }
          }
        }

        if (!includeCards) {
          res.json({ agents: allAgents });
          return;
        }

        const CARD_CONCURRENCY = 6;
        const enriched: Array<
          import('@red-hat-developer-hub/backstage-plugin-augment-common').KagentiAgentSummary & {
            agentCard?: unknown;
          }
        > = new Array(allAgents.length);
        let cursor = 0;
        async function nextCard() {
          while (cursor < allAgents.length) {
            const idx = cursor++;
            const agent = allAgents[idx];
            try {
              const cached = await kagenti.getAgentCardCached(
                agent.namespace,
                agent.name,
                { retries: 0 },
              );
              enriched[idx] = { ...agent, agentCard: cached.card };
            } catch (err) {
              logger.warn(
                `Failed to fetch agent card for ${agent.namespace}/${agent.name}: ${err instanceof Error ? err.message : err}`,
              );
              enriched[idx] = agent;
            }
          }
        }
        await Promise.all(
          Array.from(
            { length: Math.min(CARD_CONCURRENCY, allAgents.length) },
            () => nextCard(),
          ),
        );
        res.json({ agents: enriched });
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
    validateNamespaceParam,
    withRoute(
      req => `GET /kagenti/agents/${req.params.namespace}/${req.params.name}`,
      'Failed to get agent',
      async (req, res) => {
        const { namespace, name } = req.params;
        const detail = await api.getAgent(namespace, name);
        let agentCard;
        let securityDemands: Record<string, boolean> | undefined;
        try {
          const cached = await kagenti.getAgentCardCached(namespace, name);
          agentCard = cached.card;
          const d = cached.demands;
          securityDemands = {
            requiresOAuth: !!d.oauthDemands,
            requiresSecrets: !!d.secretDemands,
            requiresLlm: !!d.llmDemands,
            requiresMcp: !!d.mcpDemands,
            requiresForm: !!d.formDemands,
          };
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
        res.json({ ...detail, agentCard, securityDemands });
      },
    ),
  );

  router.get(
    '/kagenti/agents/:namespace/:name/route-status',
    validateNamespaceParam,
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
    requireAdminAccess,
    validateNamespaceParam,
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

  router.post(
    '/kagenti/agents/:namespace/:name/migrate',
    requireAdminAccess,
    validateNamespaceParam,
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
    requireAdminAccess,
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

  router.get(
    '/kagenti/agents/:namespace/:name/build-info',
    validateNamespaceParam,
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
    requireAdminAccess,
    validateNamespaceParam,
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
    requireAdminAccess,
    validateNamespaceParam,
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

  router.get(
    '/kagenti/agents/shipwright-builds',
    withRoute(
      'GET /kagenti/agents/shipwright-builds',
      'Failed to list agent builds',
      async (req, res) => {
        const namespace = req.query.namespace as string | undefined;
        const allNamespaces = req.query.all_namespaces === 'true';
        const result = await api.listAgentBuilds(namespace, allNamespaces);
        res.json(result);
      },
    ),
  );

  router.get(
    '/kagenti/agents/:namespace/:name/shipwright-build',
    validateNamespaceParam,
    withRoute(
      req =>
        `GET /kagenti/agents/${req.params.namespace}/${req.params.name}/shipwright-build`,
      'Failed to get agent build status',
      async (req, res) => {
        const { namespace, name } = req.params;
        const result = await api.getAgentBuild(namespace, name);
        res.json(result);
      },
    ),
  );

  router.get(
    '/kagenti/agents/:namespace/:name/shipwright-buildrun',
    validateNamespaceParam,
    withRoute(
      req =>
        `GET /kagenti/agents/${req.params.namespace}/${req.params.name}/shipwright-buildrun`,
      'Failed to get agent build run status',
      async (req, res) => {
        const { namespace, name } = req.params;
        const result = await api.getAgentBuildRun(namespace, name);
        res.json(result);
      },
    ),
  );

  router.post(
    '/kagenti/agents/parse-env',
    requireAdminAccess,
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
    requireAdminAccess,
    withRoute(
      'POST /kagenti/agents/fetch-env-url',
      'Failed to fetch env URL',
      async (req, res) => {
        const url = req.body?.url;
        if (!url || typeof url !== 'string') {
          throw new InputError('url is required');
        }
        await validatePublicUrl(url);
        const result = await api.fetchEnvUrl(url);
        res.json(result);
      },
    ),
  );
}
