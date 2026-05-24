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

import {
  type ChatToolConfig,
  type AgentLifecycleStage,
  type KagentiToolSummary,
  LIFECYCLE_STAGE_ORDER,
  isValidTransition,
  normalizeLifecycleStage,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { InputError } from '@backstage/errors';
import { createWithRoute } from './routeWrapper';
import type { RouteContext } from './types';
import type { AdminConfigService } from '../services/AdminConfigService';
import { AuditLogger } from '../services/AuditLogger';

function isValidLifecycleStage(stage: unknown): stage is AgentLifecycleStage {
  return (
    typeof stage === 'string' &&
    (LIFECYCLE_STAGE_ORDER as readonly string[]).includes(stage)
  );
}

function isPublishedStage(stage: AgentLifecycleStage): boolean {
  return stage === 'published';
}

export interface ToolLifecycleOptions {
  listProviderTools(): Promise<KagentiToolSummary[]>;
}

/**
 * Registers tool lifecycle endpoints mirroring the agent lifecycle.
 * Merges tools from the provider (Kagenti) with lifecycle config from the DB,
 * enabling draft -> pending -> published -> archived lifecycle for tools.
 */
export function registerToolLifecycleRoutes(
  ctx: RouteContext,
  adminConfig: AdminConfigService,
  options: ToolLifecycleOptions,
): void {
  const { router, logger, sendRouteError } = ctx;
  const withRoute = createWithRoute(logger, sendRouteError);
  const audit = new AuditLogger(logger);

  async function loadChatToolConfigs(): Promise<ChatToolConfig[]> {
    const raw = await adminConfig.get('chatTools');
    if (Array.isArray(raw)) return raw as ChatToolConfig[];
    return [];
  }

  async function saveChatToolConfigs(
    configs: ChatToolConfig[],
    updatedBy: string,
  ): Promise<void> {
    await adminConfig.set('chatTools', configs, updatedBy);
  }

  /**
   * Build a unified tool list by merging provider tools with lifecycle config.
   */
  async function buildUnifiedToolList(): Promise<{
    tools: (KagentiToolSummary & {
      published?: boolean;
      lifecycleStage?: AgentLifecycleStage;
      version?: number;
      promotedAt?: string;
      promotedBy?: string;
    })[];
  }> {
    const [providerTools, chatConfigs] = await Promise.all([
      options.listProviderTools(),
      loadChatToolConfigs(),
    ]);

    const configMap = new Map(chatConfigs.map(c => [c.toolId, c]));

    const merged = providerTools.map((tool: KagentiToolSummary) => {
      const toolId = `${tool.namespace}/${tool.name}`;
      const cfg = configMap.get(toolId);
      const stage = normalizeLifecycleStage(cfg?.lifecycleStage);
      return {
        ...tool,
        published: isPublishedStage(stage),
        lifecycleStage: stage,
        version: cfg?.version ?? 0,
        promotedAt: cfg?.promotedAt,
        promotedBy: cfg?.promotedBy,
      };
    });

    return { tools: merged };
  }

  // ---------------------------------------------------------------------------
  // GET /tools -- unified tool listing with lifecycle overlay
  // ---------------------------------------------------------------------------
  router.get(
    '/tools',
    withRoute('GET /tools', 'Failed to list tools', async (req, res) => {
      const { tools } = await buildUnifiedToolList();
      const publishedFilter = req.query.published;

      const filtered =
        publishedFilter === 'true'
          ? tools.filter(t => t.published === true)
          : tools;

      res.json({ tools: filtered });
    }),
  );

  // ---------------------------------------------------------------------------
  // PUT /tools/:toolId/promote -- promote tool to the next lifecycle stage
  // draft → pending is open to any authenticated user.
  // All other transitions require admin access.
  // ---------------------------------------------------------------------------
  router.put(
    '/tools/:toolId/promote',
    withRoute(
      'PUT /tools/:toolId/promote',
      'Failed to promote tool',
      async (req, res) => {
        const toolId = decodeURIComponent(req.params.toolId);
        const { targetStage } = req.body as { targetStage?: string };
        const resolved = targetStage
          ? normalizeLifecycleStage(targetStage)
          : undefined;
        if (resolved !== undefined && !isValidLifecycleStage(resolved)) {
          throw new InputError(
            `Invalid targetStage "${targetStage}". Must be one of: ${LIFECYCLE_STAGE_ORDER.join(', ')}`,
          );
        }
        const userRef = await ctx.getUserRef(req);
        const configs = await loadChatToolConfigs();
        const existing = configs.find(c => c.toolId === toolId);

        const currentStage = normalizeLifecycleStage(existing?.lifecycleStage);
        const nextStage =
          resolved ??
          (() => {
            const idx = LIFECYCLE_STAGE_ORDER.indexOf(currentStage);
            const nextIdx = Math.min(idx + 1, LIFECYCLE_STAGE_ORDER.length - 2);
            return LIFECYCLE_STAGE_ORDER[nextIdx];
          })();

        if (!isValidTransition(currentStage, nextStage)) {
          throw new InputError(
            `Cannot transition tool from "${currentStage}" to "${nextStage}". ` +
              `Check available transitions for the current stage.`,
          );
        }

        const isSubmitForReview =
          currentStage === 'draft' && nextStage === 'pending';
        if (!isSubmitForReview) {
          const isAdmin = await ctx.checkIsAdmin(req);
          if (!isAdmin) {
            res.status(403).json({
              error:
                'Only admins can perform this lifecycle transition. ' +
                'Non-admin users may only submit draft tools for review.',
            });
            return;
          }
        }

        const now = new Date().toISOString();
        const isProd = isPublishedStage(nextStage);

        if (existing) {
          existing.lifecycleStage = nextStage;
          existing.published = isProd;
          existing.visible = isProd;
          existing.version = (existing.version ?? 0) + 1;
          existing.promotedAt = now;
          existing.promotedBy = userRef;
        } else {
          configs.push({
            toolId,
            lifecycleStage: nextStage,
            published: isProd,
            visible: isProd,
            version: 1,
            promotedAt: now,
            promotedBy: userRef,
          });
        }

        await saveChatToolConfigs(configs, userRef);
        audit.log({
          action: 'tool.lifecycle',
          actor: userRef,
          target: toolId,
          outcome: 'success',
          sourceIp: AuditLogger.extractIp(req),
          meta: {
            from: currentStage,
            to: nextStage,
            direction: 'promote',
            version: existing?.version ?? 1,
          },
        });
        logger.info(
          `Tool "${toolId}" promoted to ${nextStage} (v${existing?.version ?? 1}) by ${userRef}`,
        );
        res.json({
          success: true,
          toolId,
          lifecycleStage: nextStage,
          version: existing?.version ?? 1,
        });
      },
    ),
  );

  // ---------------------------------------------------------------------------
  // PUT /tools/:toolId/demote -- demote tool to a previous lifecycle stage
  // ---------------------------------------------------------------------------
  router.put(
    '/tools/:toolId/demote',
    ctx.requireAdminAccess,
    withRoute(
      'PUT /tools/:toolId/demote',
      'Failed to demote tool',
      async (req, res) => {
        const toolId = decodeURIComponent(req.params.toolId);
        const { targetStage } = req.body as { targetStage?: string };
        const resolved = targetStage
          ? normalizeLifecycleStage(targetStage)
          : undefined;
        if (resolved !== undefined && !isValidLifecycleStage(resolved)) {
          throw new InputError(
            `Invalid targetStage "${targetStage}". Must be one of: ${LIFECYCLE_STAGE_ORDER.join(', ')}`,
          );
        }
        const userRef = await ctx.getUserRef(req);
        const configs = await loadChatToolConfigs();
        const existing = configs.find(c => c.toolId === toolId);

        const currentStage = normalizeLifecycleStage(existing?.lifecycleStage);
        const nextStage =
          resolved ??
          (() => {
            const idx = LIFECYCLE_STAGE_ORDER.indexOf(currentStage);
            return LIFECYCLE_STAGE_ORDER[Math.max(idx - 1, 0)];
          })();

        if (!isValidTransition(currentStage, nextStage)) {
          throw new InputError(
            `Cannot transition tool from "${currentStage}" to "${nextStage}". ` +
              `Check available transitions for the current stage.`,
          );
        }

        const now = new Date().toISOString();
        const isProd = isPublishedStage(nextStage);

        if (existing) {
          existing.lifecycleStage = nextStage;
          existing.published = isProd;
          if (!isProd) {
            existing.visible = false;
          }
          existing.promotedAt = now;
          existing.promotedBy = userRef;
        } else {
          configs.push({
            toolId,
            lifecycleStage: nextStage,
            published: false,
            visible: false,
            promotedAt: now,
            promotedBy: userRef,
          });
        }

        await saveChatToolConfigs(configs, userRef);
        audit.log({
          action: 'tool.lifecycle',
          actor: userRef,
          target: toolId,
          outcome: 'success',
          sourceIp: AuditLogger.extractIp(req),
          meta: { from: currentStage, to: nextStage, direction: 'demote' },
        });
        logger.info(`Tool "${toolId}" demoted to ${nextStage} by ${userRef}`);
        res.json({ success: true, toolId, lifecycleStage: nextStage });
      },
    ),
  );

  // ---------------------------------------------------------------------------
  // PUT /tools/:toolId/publish -- shortcut: promote to published
  // ---------------------------------------------------------------------------
  router.put(
    '/tools/:toolId/publish',
    ctx.requireAdminAccess,
    withRoute(
      'PUT /tools/:toolId/publish',
      'Failed to publish tool',
      async (req, res) => {
        const toolId = decodeURIComponent(req.params.toolId);
        const userRef = await ctx.getUserRef(req);
        const configs = await loadChatToolConfigs();
        const existing = configs.find(c => c.toolId === toolId);
        const now = new Date().toISOString();

        if (existing) {
          existing.lifecycleStage = 'published';
          existing.published = true;
          existing.visible = true;
          existing.version = (existing.version ?? 0) + 1;
          existing.promotedAt = now;
          existing.promotedBy = userRef;
        } else {
          configs.push({
            toolId,
            lifecycleStage: 'published',
            published: true,
            visible: true,
            version: 1,
            promotedAt: now,
            promotedBy: userRef,
          });
        }

        await saveChatToolConfigs(configs, userRef);
        audit.log({
          action: 'tool.lifecycle',
          actor: userRef,
          target: toolId,
          outcome: 'success',
          sourceIp: AuditLogger.extractIp(req),
          meta: { to: 'published', direction: 'publish' },
        });
        logger.info(`Tool "${toolId}" published by ${userRef}`);
        res.json({ success: true, toolId, published: true });
      },
    ),
  );

  // ---------------------------------------------------------------------------
  // PUT /tools/:toolId/unpublish -- move from published to pending
  // ---------------------------------------------------------------------------
  router.put(
    '/tools/:toolId/unpublish',
    ctx.requireAdminAccess,
    withRoute(
      'PUT /tools/:toolId/unpublish',
      'Failed to unpublish tool',
      async (req, res) => {
        const toolId = decodeURIComponent(req.params.toolId);
        const userRef = await ctx.getUserRef(req);
        const configs = await loadChatToolConfigs();
        const existing = configs.find(c => c.toolId === toolId);
        const now = new Date().toISOString();

        if (existing) {
          existing.lifecycleStage = 'pending';
          existing.published = false;
          existing.visible = false;
          existing.promotedAt = now;
          existing.promotedBy = userRef;
        } else {
          configs.push({
            toolId,
            lifecycleStage: 'pending',
            published: false,
            visible: false,
            promotedAt: now,
            promotedBy: userRef,
          });
        }

        await saveChatToolConfigs(configs, userRef);
        audit.log({
          action: 'tool.lifecycle',
          actor: userRef,
          target: toolId,
          outcome: 'success',
          sourceIp: AuditLogger.extractIp(req),
          meta: { to: 'pending', direction: 'unpublish' },
        });
        logger.info(`Tool "${toolId}" unpublished by ${userRef}`);
        res.json({ success: true, toolId, published: false });
      },
    ),
  );
}
