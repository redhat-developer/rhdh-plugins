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

import { createWithRoute } from './routeWrapper';
import type { RouteContext } from './types';
import type { KagentiProvider } from '../providers/kagenti';

/**
 * Registers Kagenti admin routes for models, LLM keys/teams,
 * integrations, and triggers. Conditionally registered based on feature flags.
 */
export function registerKagentiAdminRoutes(ctx: RouteContext): void {
  const { router, logger, sendRouteError, requireAdminAccess } = ctx;
  const withRoute = createWithRoute(logger, sendRouteError);

  if (ctx.provider.id !== 'kagenti') {
    return;
  }
  const kagenti = ctx.provider as KagentiProvider;
  const flags = kagenti.getFeatureFlags();

  const admin = kagenti.getAdminClient();
  if (!admin) {
    logger.warn('Admin client not available, skipping admin routes');
    return;
  }

  // Admin routes intentionally skip per-namespace validation:
  // admins may need cross-namespace access for LLM key management,
  // integrations, and model configuration.
  router.use('/kagenti/models', requireAdminAccess);
  router.use('/kagenti/llm', requireAdminAccess);
  router.use('/kagenti/integrations', requireAdminAccess);

  // -- Models (sandbox flag) --------------------------------------------------

  if (flags.sandbox) {
    router.get(
      '/kagenti/models',
      withRoute(
        'GET /kagenti/models',
        'Failed to list LLM models',
        async (_req, res) => {
          const result = await admin.listLlmModels();
          res.json(result);
        },
      ),
    );

    // -- LLM Teams ------------------------------------------------------------

    router.post(
      '/kagenti/llm/teams',
      withRoute(
        'POST /kagenti/llm/teams',
        'Failed to create team',
        async (req, res) => {
          const result = await admin.createTeam(req.body);
          res.json(result);
        },
      ),
    );

    router.get(
      '/kagenti/llm/teams',
      withRoute(
        'GET /kagenti/llm/teams',
        'Failed to list teams',
        async (_req, res) => {
          const result = await admin.listTeams();
          res.json({ teams: Array.isArray(result) ? result : [] });
        },
      ),
    );

    router.get(
      '/kagenti/llm/teams/:namespace',
      withRoute(
        'GET /kagenti/llm/teams by namespace',
        'Failed to get team',
        async (req, res) => {
          const result = await admin.getTeam(req.params.namespace);
          res.json(result);
        },
      ),
    );

    // -- LLM Keys -------------------------------------------------------------

    router.post(
      '/kagenti/llm/keys',
      withRoute(
        'POST /kagenti/llm/keys',
        'Failed to create key',
        async (req, res) => {
          const result = await admin.createKey(req.body);
          res.json(result);
        },
      ),
    );

    router.get(
      '/kagenti/llm/keys',
      withRoute(
        'GET /kagenti/llm/keys',
        'Failed to list keys',
        async (_req, res) => {
          const result = await admin.listKeys();
          res.json({ keys: Array.isArray(result) ? result : [] });
        },
      ),
    );

    router.delete(
      '/kagenti/llm/keys/:namespace/:agentName',
      withRoute(
        'DELETE /kagenti/llm/keys',
        'Failed to delete key',
        async (req, res) => {
          const result = await admin.deleteKey(
            req.params.namespace,
            req.params.agentName,
          );
          res.json(result);
        },
      ),
    );

    router.get(
      '/kagenti/llm/agent-models/:namespace/:agentName',
      withRoute(
        'GET /kagenti/llm/agent-models',
        'Failed to get agent models',
        async (req, res) => {
          const result = await admin.getAgentModels(
            req.params.namespace,
            req.params.agentName,
          );
          res.json(result);
        },
      ),
    );
  }

  // -- Integrations (integrations flag) ---------------------------------------

  if (flags.integrations) {
    router.get(
      '/kagenti/integrations',
      withRoute(
        'GET /kagenti/integrations',
        'Failed to list integrations',
        async (req, res) => {
          const namespace = req.query.namespace as string | undefined;
          const result = await admin.listIntegrations(namespace);
          res.json(result);
        },
      ),
    );

    router.get(
      '/kagenti/integrations/:namespace/:name',
      withRoute(
        'GET /kagenti/integration detail',
        'Failed to get integration',
        async (req, res) => {
          const result = await admin.getIntegration(
            req.params.namespace,
            req.params.name,
          );
          res.json(result);
        },
      ),
    );

    router.post(
      '/kagenti/integrations',
      withRoute(
        'POST /kagenti/integrations',
        'Failed to create integration',
        async (req, res) => {
          const result = await admin.createIntegration(req.body);
          res.json(result);
        },
      ),
    );

    router.put(
      '/kagenti/integrations/:namespace/:name',
      withRoute(
        'PUT /kagenti/integration',
        'Failed to update integration',
        async (req, res) => {
          const result = await admin.updateIntegration(
            req.params.namespace,
            req.params.name,
            req.body,
          );
          res.json(result);
        },
      ),
    );

    router.delete(
      '/kagenti/integrations/:namespace/:name',
      withRoute(
        'DELETE /kagenti/integration',
        'Failed to delete integration',
        async (req, res) => {
          const result = await admin.deleteIntegration(
            req.params.namespace,
            req.params.name,
          );
          res.json(result);
        },
      ),
    );

    router.post(
      '/kagenti/integrations/:namespace/:name/test',
      withRoute(
        'POST /kagenti/integration test',
        'Failed to test integration',
        async (req, res) => {
          const result = await admin.testIntegration(
            req.params.namespace,
            req.params.name,
          );
          res.json(result);
        },
      ),
    );
  }

  // -- Triggers (triggers flag) -----------------------------------------------

  if (flags.triggers) {
    router.post(
      '/kagenti/sandbox/trigger',
      requireAdminAccess,
      withRoute(
        'POST /kagenti/sandbox/trigger',
        'Failed to create trigger',
        async (req, res) => {
          const result = await admin.createTrigger(req.body);
          res.json(result);
        },
      ),
    );
  }
}
