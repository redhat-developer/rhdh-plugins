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
import { DEFAULT_BRANDING } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { BrandingConfig } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { AdminConfigService } from '../services/AdminConfigService';
import { loadBrandingOverrides } from '../providers/llamastack/BrandingConfigLoader';
import { createWithRoute } from './routeWrapper';
import type { RouteContext } from './types';

/**
 * Registers unauthenticated status and branding endpoints.
 * These are needed for UI bootstrapping and k8s probes.
 */
export function registerStatusRoutes(
  ctx: RouteContext,
  adminConfig?: AdminConfigService,
  initializationError?: string | null,
): void {
  const { router, logger, config, sendRouteError } = ctx;
  const withRoute = createWithRoute(logger, sendRouteError);

  router.get('/health', (_req, res) => {
    if (initializationError) {
      res.status(503).json({
        status: 'degraded',
        error: 'Provider initialization failed',
      });
      return;
    }
    res.json({ status: 'ok' });
  });

  router.get(
    '/status',
    withRoute('GET /status', 'Failed to get status', async (req, res) => {
      const currentProvider = ctx.provider;
      if (initializationError) {
        res.status(503).json({
          providerId: currentProvider.id,
          initializationError: 'Provider initialization failed',
          provider: { connected: false, baseUrl: '(not connected)' },
          mcpServers: [],
        });
        return;
      }

      const status = await currentProvider.getStatus();
      const isAdmin = await ctx.checkIsAdmin(req);

      const redacted = {
        ...status,
        providerId: currentProvider.id,
        isAdmin,
        provider: {
          ...status.provider,
          baseUrl: status.provider.connected
            ? '(connected)'
            : '(not connected)',
        },
        mcpServers: status.mcpServers.map(s => ({
          ...s,
          url: s.connected ? '(connected)' : '(not connected)',
        })),
      };
      res.json(redacted);
    }),
  );

  router.get(
    '/branding',
    withRoute(
      'GET /branding',
      'Failed to get branding configuration',
      async (_req, res) => {
        const yamlOverrides = loadBrandingOverrides(config, logger);
        const yamlBranding: BrandingConfig = {
          ...DEFAULT_BRANDING,
          ...yamlOverrides,
        };

        let branding: BrandingConfig = yamlBranding;
        if (adminConfig) {
          try {
            const dbBranding = await adminConfig.get('branding');
            if (
              dbBranding &&
              typeof dbBranding === 'object' &&
              !Array.isArray(dbBranding)
            ) {
              branding = {
                ...yamlBranding,
                ...(dbBranding as Partial<BrandingConfig>),
              };
            }
          } catch (err) {
            logger.warn(
              `Failed to read branding overrides from DB, using YAML only: ${
                err instanceof Error ? err.message : 'Unknown error'
              }`,
            );
          }
        }

        res.json({
          success: true,
          branding,
          timestamp: new Date().toISOString(),
        });
      },
    ),
  );
}
