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
import {
  DEFAULT_BRANDING,
  isProviderScopedKey,
  deriveRoleFromTopology,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { ProviderType } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { AdminConfigService } from '../services/AdminConfigService';
import { validateAdminConfigValue } from '../services/utils/configValidation';
import { loadBrandingOverrides } from '../providers/llamastack/BrandingConfigLoader';
import { createWithRoute } from './routeWrapper';
import type { AdminRouteDeps } from './adminRouteTypes';

export function registerAdminConfigRoutes(
  router: import('express').Router,
  deps: AdminRouteDeps,
): void {
  const {
    adminConfig,
    config,
    logger,
    sendRouteError,
    getUserRef,
    onConfigChanged,
  } = deps;

  const withRoute = createWithRoute(logger, sendRouteError);

  router.get(
    '/admin/config',
    withRoute(
      'GET /admin/config',
      'Failed to list admin configuration',
      async (_req, res) => {
        const entries = await adminConfig.listAll();
        res.json({
          success: true,
          entries,
          timestamp: new Date().toISOString(),
        });
      },
    ),
  );

  router.get(
    '/admin/config/:key',
    withRoute(
      req => `GET /admin/config/${req.params.key}`,
      'Failed to get admin configuration',
      async (req, res) => {
        const validKey = AdminConfigService.validateKey(req.params.key);
        const providerId =
          (req.query.provider as string | undefined) ?? deps.provider.id;

        if (isProviderScopedKey(validKey)) {
          const value = await adminConfig.getScopedValue(
            validKey,
            providerId as ProviderType,
          );
          if (value === undefined) {
            res.json({
              success: true,
              entry: null,
              source: 'default',
              timestamp: new Date().toISOString(),
            });
            return;
          }
          res.json({
            success: true,
            entry: {
              configKey: validKey,
              configValue: value,
              updatedAt: new Date().toISOString(),
              updatedBy: 'system',
            },
            source: 'database',
            timestamp: new Date().toISOString(),
          });
          return;
        }

        const entry = await adminConfig.getEntry(validKey);
        if (!entry) {
          res.json({
            success: true,
            entry: null,
            source: 'default',
            timestamp: new Date().toISOString(),
          });
          return;
        }
        res.json({
          success: true,
          entry,
          source: 'database',
          timestamp: new Date().toISOString(),
        });
      },
    ),
  );

  router.put(
    '/admin/config/:key',
    withRoute(
      req => `PUT /admin/config/${req.params.key}`,
      'Failed to update admin configuration',
      async (req, res) => {
        const validKey = AdminConfigService.validateKey(req.params.key);
        const { value } = req.body;
        if (value === undefined) {
          throw new InputError('Request body must contain a "value" field');
        }

        validateAdminConfigValue(validKey, value);

        const userRef = await getUserRef(req);
        const providerId =
          (req.query.provider as string | undefined) ?? deps.provider.id;

        if (validKey === 'agents') {
          try {
            const previous = await adminConfig.get('agents');
            if (previous && typeof previous === 'object') {
              const prevKeys = Object.keys(previous as Record<string, unknown>);
              const newKeys = Object.keys(value as Record<string, unknown>);
              const added = newKeys.filter(k => !prevKeys.includes(k));
              const removed = prevKeys.filter(k => !newKeys.includes(k));
              if (added.length > 0 || removed.length > 0) {
                logger.info(
                  `[AdminConfig] Agent roster changed by ${userRef}: ` +
                    `added=[${added.join(', ')}], removed=[${removed.join(', ')}]`,
                );
              }
            }
          } catch {
            // best-effort audit — don't block the save
          }
        }

        if (isProviderScopedKey(validKey)) {
          await adminConfig.setScopedValue(
            validKey,
            value,
            providerId as ProviderType,
            userRef,
          );
        } else {
          await adminConfig.set(validKey, value, userRef);
        }

        onConfigChanged?.();

        // Auto-register chatAgents entries for agents that can be published
        // (router or standalone). New agents start as 'registered' so they're
        // one click away from being published. Specialists are hidden.
        if (validKey === 'agents' && value && typeof value === 'object') {
          try {
            const agentMap = value as Record<string, { handoffs?: string[]; asTools?: string[] }>;

            const existing = await adminConfig.get('chatAgents');
            const configs: import('@red-hat-developer-hub/backstage-plugin-augment-common').ChatAgentConfig[] =
              Array.isArray(existing) ? [...(existing as import('@red-hat-developer-hub/backstage-plugin-augment-common').ChatAgentConfig[])] : [];
            const existingIds = new Set(configs.map(c => c.agentId));
            let added = 0;

            for (const [agentKey, agentCfg] of Object.entries(agentMap)) {
              if (!agentCfg || typeof agentCfg !== 'object') continue;

              const role = deriveRoleFromTopology(agentKey, agentMap);
              if (role === 'specialist') continue;
              if (existingIds.has(agentKey)) continue;

              configs.push({
                agentId: agentKey,
                published: false,
                visible: false,
                featured: false,
                lifecycleStage: 'registered',
                version: 1,
                promotedAt: new Date().toISOString(),
                promotedBy: userRef,
              });
              added++;
            }

            // Remove chatAgents entries for agents whose role is now specialist
            // or that no longer exist in the agents map.
            const agentKeys = new Set(Object.keys(agentMap));
            const before = configs.length;
            const cleaned = configs.filter(c => {
              if (!agentKeys.has(c.agentId)) return false;
              const cfg = agentMap[c.agentId];
              if (!cfg || typeof cfg !== 'object') return false;
              return deriveRoleFromTopology(c.agentId, agentMap) !== 'specialist';
            });
            const removed = before - cleaned.length;

            if (added > 0 || removed > 0) {
              const final = removed > 0 ? cleaned : configs;
              await adminConfig.set('chatAgents', final, userRef);
              const parts: string[] = [];
              if (added > 0) parts.push(`registered ${added} new`);
              if (removed > 0) parts.push(`removed ${removed} chatAgent entries`);
              logger.info(
                `[AdminConfig] chatAgent entries: ${parts.join(', ')}`,
              );
            }
          } catch (err) {
            logger.warn(`Failed to auto-manage chatAgent entries: ${err}`);
          }
        }

        const warnings: string[] = [];

        if (
          validKey === 'model' &&
          typeof value === 'string' &&
          deps.provider.listModels
        ) {
          try {
            const models = await deps.provider.listModels();
            const found = models.some(m => m.id === value.trim());
            if (!found) {
              warnings.push(
                `Model "${value.trim()}" was not found on the inference server. It will be saved, but chat may fail if the model is unavailable.`,
              );
              logger.warn(
                `Admin saved model "${value.trim()}" which is not in the server's model list`,
              );
            }
          } catch (listErr) {
            logger.warn(`Could not validate model against server: ${listErr}`);
          }
        }

        if (validKey === 'defaultAgent' && typeof value === 'string') {
          try {
            const currentAgents = await adminConfig.get('agents');
            if (currentAgents && typeof currentAgents === 'object') {
              const agentKeys = Object.keys(
                currentAgents as Record<string, unknown>,
              );
              if (agentKeys.length > 0 && !agentKeys.includes(value)) {
                warnings.push(
                  `Default agent "${value}" does not match any configured agent. ` +
                    `Available: [${agentKeys.join(', ')}]. Chat will fall back ` +
                    `to single-agent mode until this is corrected.`,
                );
                logger.warn(
                  `Admin saved defaultAgent "${value}" which does not exist in agents config`,
                );
              }
            }
          } catch (lookupErr) {
            logger.warn(`Could not cross-validate defaultAgent: ${lookupErr}`);
          }
        }

        res.json({
          success: true,
          configKey: validKey,
          ...(warnings.length > 0 && { warnings }),
          timestamp: new Date().toISOString(),
        });
      },
    ),
  );

  router.delete(
    '/admin/config/:key',
    withRoute(
      req => `DELETE /admin/config/${req.params.key}`,
      'Failed to reset admin configuration',
      async (req, res) => {
        const validKey = AdminConfigService.validateKey(req.params.key);
        const providerId =
          (req.query.provider as string | undefined) ?? deps.provider.id;

        let deleted: boolean;
        if (isProviderScopedKey(validKey)) {
          deleted = await adminConfig.deleteScopedValue(
            validKey,
            providerId as ProviderType,
          );
        } else {
          deleted = await adminConfig.delete(validKey);
        }

        onConfigChanged?.();

        res.json({
          success: true,
          deleted,
          configKey: validKey,
          timestamp: new Date().toISOString(),
        });
      },
    ),
  );

  router.get(
    '/admin/effective-config',
    withRoute(
      'GET /admin/effective-config',
      'Failed to get effective configuration',
      async (_req, res) => {
        let effectiveConfig: Record<string, unknown>;

        if (deps.provider.getEffectiveConfig) {
          effectiveConfig = await deps.provider.getEffectiveConfig();
        } else {
          const ls = config.getOptionalConfig('augment.llamaStack');
          const yamlBranding = loadBrandingOverrides(config, logger);
          effectiveConfig = {
            model: ls?.getOptionalString('model') ?? '',
            baseUrl: ls?.getOptionalString('baseUrl') ?? '',
            systemPrompt:
              config.getOptionalString('augment.systemPrompt') ?? '',
            toolChoice: ls?.getOptionalString('toolChoice') ?? 'auto',
            enableWebSearch: ls?.getOptionalBoolean('enableWebSearch') ?? false,
            enableCodeInterpreter:
              ls?.getOptionalBoolean('enableCodeInterpreter') ?? false,
            safetyEnabled: ls?.getOptionalBoolean('safetyEnabled') ?? false,
            inputShields: ls?.getOptionalStringArray('inputShields') ?? [],
            outputShields: ls?.getOptionalStringArray('outputShields') ?? [],
            evaluationEnabled:
              ls?.getOptionalBoolean('evaluationEnabled') ?? false,
            scoringFunctions:
              ls?.getOptionalStringArray('scoringFunctions') ?? [],
            minScoreThreshold: ls?.getOptionalNumber('minScoreThreshold'),
            branding: { ...DEFAULT_BRANDING, ...yamlBranding },
          };
        }

        const {
          token: _t,
          skipTlsVerify: _s,
          functions: _f,
          ...safeConfig
        } = effectiveConfig;

        res.json({
          success: true,
          config: safeConfig,
          timestamp: new Date().toISOString(),
        });
      },
    ),
  );
}
