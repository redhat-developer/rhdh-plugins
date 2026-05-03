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

import { type ChatToolConfig, type AgentLifecycleStage, type KagentiToolSummary } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { InputError } from '@backstage/errors';
import { createWithRoute } from './routeWrapper';
import type { RouteContext } from './types';
import type { AdminConfigService } from '../services/AdminConfigService';

const VALID_LIFECYCLE_STAGES: readonly AgentLifecycleStage[] = ['draft', 'registered', 'deployed'] as const;

function isValidLifecycleStage(stage: unknown): stage is AgentLifecycleStage {
  return typeof stage === 'string' && (VALID_LIFECYCLE_STAGES as readonly string[]).includes(stage);
}

export interface ToolLifecycleOptions {
  listProviderTools(): Promise<KagentiToolSummary[]>;
}

/**
 * Registers tool lifecycle endpoints mirroring the agent lifecycle.
 * Merges tools from the provider (Kagenti) with lifecycle config from the DB,
 * enabling draft -> registered -> deployed promotion pipeline for tools.
 */
export function registerToolLifecycleRoutes(
  ctx: RouteContext,
  adminConfig: AdminConfigService,
  options: ToolLifecycleOptions,
): void {
  const { router, logger, sendRouteError } = ctx;
  const withRoute = createWithRoute(logger, sendRouteError);

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
    tools: (KagentiToolSummary & { published?: boolean; lifecycleStage?: AgentLifecycleStage; version?: number; promotedAt?: string; promotedBy?: string })[];
  }> {
    const [providerTools, chatConfigs] = await Promise.all([
      options.listProviderTools(),
      loadChatToolConfigs(),
    ]);

    const configMap = new Map(chatConfigs.map(c => [c.toolId, c]));

    const merged = providerTools.map((tool: KagentiToolSummary) => {
      const toolId = `${tool.namespace}/${tool.name}`;
      const cfg = configMap.get(toolId);
      const stage: AgentLifecycleStage = cfg?.lifecycleStage ?? 'draft';
      return {
        ...tool,
        published: stage === 'deployed',
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
    withRoute(
      'GET /tools',
      'Failed to list tools',
      async (req, res) => {
        const { tools } = await buildUnifiedToolList();
        const publishedFilter = req.query.published;

        const filtered = publishedFilter === 'true'
          ? tools.filter(t => t.published === true)
          : tools;

        res.json({ tools: filtered });
      },
    ),
  );

  // ---------------------------------------------------------------------------
  // PUT /tools/:toolId/promote -- promote tool to the next lifecycle stage
  // ---------------------------------------------------------------------------
  router.put(
    '/tools/:toolId/promote',
    ctx.requireAdminAccess,
    withRoute(
      'PUT /tools/:toolId/promote',
      'Failed to promote tool',
      async (req, res) => {
        const toolId = decodeURIComponent(req.params.toolId);
        const { targetStage } = req.body as { targetStage?: AgentLifecycleStage };
        if (targetStage !== undefined && !isValidLifecycleStage(targetStage)) {
          throw new InputError(`Invalid targetStage "${targetStage}". Must be one of: ${VALID_LIFECYCLE_STAGES.join(', ')}`);
        }
        const userRef = await ctx.getUserRef(req);
        const configs = await loadChatToolConfigs();
        const existing = configs.find(c => c.toolId === toolId);

        const stageOrder: AgentLifecycleStage[] = ['draft', 'registered', 'deployed'];
        const currentStage = existing?.lifecycleStage ?? 'draft';
        const currentIdx = stageOrder.indexOf(currentStage);
        const safeCurrentIdx = currentIdx === -1 ? 0 : currentIdx;
        const nextStage = targetStage ?? stageOrder[Math.min(safeCurrentIdx + 1, stageOrder.length - 1)];

        if (existing) {
          existing.lifecycleStage = nextStage;
          existing.published = nextStage === 'deployed';
          existing.visible = nextStage === 'deployed';
          existing.version = (existing.version ?? 0) + 1;
          existing.promotedAt = new Date().toISOString();
          existing.promotedBy = userRef;
        } else {
          configs.push({
            toolId,
            lifecycleStage: nextStage,
            published: nextStage === 'deployed',
            visible: nextStage === 'deployed',
            version: 1,
            promotedAt: new Date().toISOString(),
            promotedBy: userRef,
          });
        }

        await saveChatToolConfigs(configs, userRef);
        logger.info(`Tool "${toolId}" promoted to ${nextStage} (v${existing?.version ?? 1}) by ${userRef}`);
        res.json({ success: true, toolId, lifecycleStage: nextStage, version: existing?.version ?? 1 });
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
        const { targetStage } = req.body as { targetStage?: AgentLifecycleStage };
        if (targetStage !== undefined && !isValidLifecycleStage(targetStage)) {
          throw new InputError(`Invalid targetStage "${targetStage}". Must be one of: ${VALID_LIFECYCLE_STAGES.join(', ')}`);
        }
        const userRef = await ctx.getUserRef(req);
        const configs = await loadChatToolConfigs();
        const existing = configs.find(c => c.toolId === toolId);

        const stageOrder: AgentLifecycleStage[] = ['draft', 'registered', 'deployed'];
        const currentStage = existing?.lifecycleStage ?? 'draft';
        const currentIdx = stageOrder.indexOf(currentStage);
        const safeCurrentIdx = currentIdx === -1 ? 0 : currentIdx;
        const nextStage = targetStage ?? stageOrder[Math.max(safeCurrentIdx - 1, 0)];

        if (existing) {
          existing.lifecycleStage = nextStage;
          existing.published = nextStage === 'deployed';
          if (nextStage !== 'deployed') {
            existing.visible = false;
          }
          existing.promotedAt = new Date().toISOString();
          existing.promotedBy = userRef;
        } else {
          configs.push({
            toolId,
            lifecycleStage: nextStage,
            published: false,
            visible: false,
            promotedAt: new Date().toISOString(),
            promotedBy: userRef,
          });
        }

        await saveChatToolConfigs(configs, userRef);
        logger.info(`Tool "${toolId}" demoted to ${nextStage} by ${userRef}`);
        res.json({ success: true, toolId, lifecycleStage: nextStage });
      },
    ),
  );

  // ---------------------------------------------------------------------------
  // PUT /tools/:toolId/publish -- shortcut to deploy (publish) a tool
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

        if (existing) {
          existing.lifecycleStage = 'deployed';
          existing.published = true;
          existing.visible = true;
          existing.version = (existing.version ?? 0) + 1;
          existing.promotedAt = new Date().toISOString();
          existing.promotedBy = userRef;
        } else {
          configs.push({
            toolId,
            lifecycleStage: 'deployed',
            published: true,
            visible: true,
            version: 1,
            promotedAt: new Date().toISOString(),
            promotedBy: userRef,
          });
        }

        await saveChatToolConfigs(configs, userRef);
        logger.info(`Tool "${toolId}" published by ${userRef}`);
        res.json({ success: true, toolId, published: true });
      },
    ),
  );

  // ---------------------------------------------------------------------------
  // PUT /tools/:toolId/unpublish -- set tool back to registered (unpublish)
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

        if (existing) {
          existing.lifecycleStage = 'registered';
          existing.published = false;
          existing.visible = false;
          existing.promotedAt = new Date().toISOString();
          existing.promotedBy = userRef;
        } else {
          configs.push({
            toolId,
            lifecycleStage: 'registered',
            published: false,
            visible: false,
            promotedAt: new Date().toISOString(),
            promotedBy: userRef,
          });
        }

        await saveChatToolConfigs(configs, userRef);
        logger.info(`Tool "${toolId}" unpublished by ${userRef}`);
        res.json({ success: true, toolId, published: false });
      },
    ),
  );
}
