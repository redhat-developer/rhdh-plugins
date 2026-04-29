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

import { type ChatAgent, type ChatAgentConfig, type AgentLifecycleStage, deriveRoleFromTopology } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { InputError } from '@backstage/errors';
import { createWithRoute } from './routeWrapper';
import type { RouteContext } from './types';
import type { AdminConfigService } from '../services/AdminConfigService';

const VALID_LIFECYCLE_STAGES: readonly AgentLifecycleStage[] = ['draft', 'registered', 'deployed'] as const;

function isValidLifecycleStage(stage: unknown): stage is AgentLifecycleStage {
  return typeof stage === 'string' && (VALID_LIFECYCLE_STAGES as readonly string[]).includes(stage);
}

/**
 * Registers provider-agnostic agent listing and publish/unpublish endpoints.
 * Merges agents from all sources (Kagenti deployed, orchestration config)
 * into a unified catalog with publish-state gating.
 */
export function registerAgentRoutes(
  ctx: RouteContext,
  adminConfig: AdminConfigService,
): void {
  const { router, logger, sendRouteError } = ctx;
  const withRoute = createWithRoute(logger, sendRouteError);

  /**
   * Load the ChatAgentConfig[] array from the chatAgents DB key.
   */
  async function loadChatAgentConfigs(): Promise<ChatAgentConfig[]> {
    const raw = await adminConfig.get('chatAgents');
    if (Array.isArray(raw)) return raw as ChatAgentConfig[];
    return [];
  }

  /**
   * Persist the full ChatAgentConfig[] array back to the chatAgents DB key.
   */
  async function saveChatAgentConfigs(
    configs: ChatAgentConfig[],
    updatedBy: string,
  ): Promise<void> {
    await adminConfig.set('chatAgents', configs, updatedBy);
  }

  /**
   * Read orchestration agents from the 'agents' DB key and map to ChatAgent[].
   * Roles are always derived from topology via deriveRoleFromTopology.
   * Specialists are hidden from the gallery.
   */
  async function loadOrchestrationAgents(): Promise<ChatAgent[]> {
    const raw = await adminConfig.get('agents');
    if (!raw || typeof raw !== 'object') return [];

    const agents: ChatAgent[] = [];
    const agentMap = raw as Record<string, { name?: string; instructions?: string; model?: string; handoffs?: string[]; asTools?: string[] }>;
    const defaultAgent = await adminConfig.get('defaultAgent');

    for (const [key, agentCfg] of Object.entries(agentMap)) {
      if (!agentCfg || typeof agentCfg !== 'object') continue;

      const role = deriveRoleFromTopology(key, agentMap);
      if (role === 'specialist') continue;

      agents.push({
        id: key,
        name: agentCfg.name ?? key,
        description: agentCfg.instructions
          ? String(agentCfg.instructions).slice(0, 200)
          : undefined,
        status: 'config',
        isDefault: key === defaultAgent,
        providerType: 'orchestration',
        framework: 'responses-api',
        source: 'orchestration',
        agentRole: role,
      });
    }
    return agents;
  }

  /**
   * Merge agents from all sources and overlay publish state.
   */
  async function buildUnifiedAgentList(): Promise<{
    agents: ChatAgent[];
    sources: { kagenti: number; orchestration: number };
  }> {
    const provider = ctx.provider;

    const orchProvider = ctx.orchestrationProvider;
    const [providerAgents, orchAgents, orchProviderAgents, chatConfigs] = await Promise.all([
      provider.listAgents ? provider.listAgents() : Promise.resolve([]),
      loadOrchestrationAgents(),
      orchProvider?.listAgents ? orchProvider.listAgents() : Promise.resolve([]),
      loadChatAgentConfigs(),
    ]);

    const configMap = new Map(chatConfigs.map(c => [c.agentId, c]));
    const seen = new Set<string>();
    const merged: ChatAgent[] = [];

    function overlayConfig(agent: ChatAgent, cfg?: ChatAgentConfig): ChatAgent {
      const stage: AgentLifecycleStage = cfg?.lifecycleStage ?? 'draft';
      return {
        ...agent,
        published: stage === 'deployed',
        lifecycleStage: stage,
        version: cfg?.version ?? 0,
        promotedAt: cfg?.promotedAt,
        promotedBy: cfg?.promotedBy,
      };
    }

    for (const agent of providerAgents) {
      seen.add(agent.id);
      const cfg = configMap.get(agent.id);
      merged.push(overlayConfig({
        ...agent,
        source: agent.source ?? 'kagenti',
        namespace: agent.id.includes('/') ? agent.id.split('/')[0] : undefined,
      }, cfg));
    }

    for (const agent of orchAgents) {
      if (seen.has(agent.id)) continue;
      seen.add(agent.id);
      const cfg = configMap.get(agent.id);
      merged.push(overlayConfig(agent, cfg));
    }

    for (const agent of orchProviderAgents) {
      if (seen.has(agent.id)) continue;
      seen.add(agent.id);
      const cfg = configMap.get(agent.id);
      merged.push(overlayConfig(agent, cfg));
    }

    return {
      agents: merged,
      sources: {
        kagenti: merged.filter(a => a.source !== 'orchestration').length,
        orchestration: merged.filter(a => a.source === 'orchestration').length,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // GET /agents -- unified agent listing
  // ---------------------------------------------------------------------------
  router.get(
    '/agents',
    withRoute(
      'GET /agents',
      'Failed to list agents',
      async (req, res) => {
        const { agents, sources } = await buildUnifiedAgentList();
        const publishedFilter = req.query.published;

        const filtered = publishedFilter === 'true'
          ? agents.filter(a => a.published === true)
          : agents;

        res.json({ agents: filtered, sources });
      },
    ),
  );

  // ---------------------------------------------------------------------------
  // PUT /agents/:agentId/promote -- promote agent to the next lifecycle stage
  // draft → registered → deployed
  // ---------------------------------------------------------------------------
  router.put(
    '/agents/:agentId/promote',
    ctx.requireAdminAccess,
    withRoute(
      'PUT /agents/:agentId/promote',
      'Failed to promote agent',
      async (req, res) => {
        const agentId = decodeURIComponent(req.params.agentId);
        const { targetStage } = req.body as { targetStage?: AgentLifecycleStage };
        if (targetStage !== undefined && !isValidLifecycleStage(targetStage)) {
          throw new InputError(`Invalid targetStage "${targetStage}". Must be one of: ${VALID_LIFECYCLE_STAGES.join(', ')}`);
        }
        const userRef = await ctx.getUserRef(req);
        const configs = await loadChatAgentConfigs();
        const existing = configs.find(c => c.agentId === agentId);

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
            agentId,
            lifecycleStage: nextStage,
            published: nextStage === 'deployed',
            visible: nextStage === 'deployed',
            featured: false,
            version: 1,
            promotedAt: new Date().toISOString(),
            promotedBy: userRef,
          });
        }

        await saveChatAgentConfigs(configs, userRef);
        logger.info(`Agent "${agentId}" promoted to ${nextStage} (v${existing?.version ?? 1}) by ${userRef}`);
        res.json({ success: true, agentId, lifecycleStage: nextStage, version: existing?.version ?? 1 });
      },
    ),
  );

  // ---------------------------------------------------------------------------
  // PUT /agents/:agentId/demote -- demote agent to a previous lifecycle stage
  // deployed → registered → draft
  // ---------------------------------------------------------------------------
  router.put(
    '/agents/:agentId/demote',
    ctx.requireAdminAccess,
    withRoute(
      'PUT /agents/:agentId/demote',
      'Failed to demote agent',
      async (req, res) => {
        const agentId = decodeURIComponent(req.params.agentId);
        const { targetStage } = req.body as { targetStage?: AgentLifecycleStage };
        if (targetStage !== undefined && !isValidLifecycleStage(targetStage)) {
          throw new InputError(`Invalid targetStage "${targetStage}". Must be one of: ${VALID_LIFECYCLE_STAGES.join(', ')}`);
        }
        const userRef = await ctx.getUserRef(req);
        const configs = await loadChatAgentConfigs();
        const existing = configs.find(c => c.agentId === agentId);

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
            existing.featured = false;
          }
          existing.promotedAt = new Date().toISOString();
          existing.promotedBy = userRef;
        } else {
          configs.push({
            agentId,
            lifecycleStage: nextStage,
            published: false,
            visible: false,
            featured: false,
            promotedAt: new Date().toISOString(),
            promotedBy: userRef,
          });
        }

        await saveChatAgentConfigs(configs, userRef);
        logger.info(`Agent "${agentId}" demoted to ${nextStage} by ${userRef}`);
        res.json({ success: true, agentId, lifecycleStage: nextStage });
      },
    ),
  );

  // ---------------------------------------------------------------------------
  // PUT /agents/:agentId/publish -- publish (shortcut to promote to deployed)
  // ---------------------------------------------------------------------------
  router.put(
    '/agents/:agentId/publish',
    ctx.requireAdminAccess,
    withRoute(
      'PUT /agents/:agentId/publish',
      'Failed to publish agent',
      async (req, res) => {
        const agentId = decodeURIComponent(req.params.agentId);
        const userRef = await ctx.getUserRef(req);
        const configs = await loadChatAgentConfigs();
        const existing = configs.find(c => c.agentId === agentId);

        if (existing) {
          existing.lifecycleStage = 'deployed';
          existing.published = true;
          existing.visible = true;
          existing.version = (existing.version ?? 0) + 1;
          existing.promotedAt = new Date().toISOString();
          existing.promotedBy = userRef;
        } else {
          configs.push({
            agentId,
            lifecycleStage: 'deployed',
            published: true,
            visible: true,
            featured: false,
            version: 1,
            promotedAt: new Date().toISOString(),
            promotedBy: userRef,
          });
        }

        await saveChatAgentConfigs(configs, userRef);
        logger.info(`Agent "${agentId}" published by ${userRef}`);
        res.json({ success: true, agentId, published: true });
      },
    ),
  );

  // ---------------------------------------------------------------------------
  // PUT /agents/:agentId/unpublish -- unpublish (demote from deployed)
  // ---------------------------------------------------------------------------
  router.put(
    '/agents/:agentId/unpublish',
    ctx.requireAdminAccess,
    withRoute(
      'PUT /agents/:agentId/unpublish',
      'Failed to unpublish agent',
      async (req, res) => {
        const agentId = decodeURIComponent(req.params.agentId);
        const userRef = await ctx.getUserRef(req);
        const configs = await loadChatAgentConfigs();
        const existing = configs.find(c => c.agentId === agentId);

        if (existing) {
          existing.lifecycleStage = 'registered';
          existing.published = false;
          existing.visible = false;
          existing.promotedAt = new Date().toISOString();
          existing.promotedBy = userRef;
        } else {
          configs.push({
            agentId,
            lifecycleStage: 'registered',
            published: false,
            visible: false,
            featured: false,
            promotedAt: new Date().toISOString(),
            promotedBy: userRef,
          });
        }

        await saveChatAgentConfigs(configs, userRef);
        logger.info(`Agent "${agentId}" unpublished by ${userRef}`);
        res.json({ success: true, agentId, published: false });
      },
    ),
  );

  // ---------------------------------------------------------------------------
  // PUT /agents/bulk-publish -- bulk publish/unpublish
  // ---------------------------------------------------------------------------
  router.put(
    '/agents/bulk-publish',
    ctx.requireAdminAccess,
    withRoute(
      'PUT /agents/bulk-publish',
      'Failed to bulk update publish state',
      async (req, res) => {
        const { agentIds, published } = req.body as {
          agentIds: string[];
          published: boolean;
        };
        if (!Array.isArray(agentIds) || typeof published !== 'boolean') {
          res.status(400).json({ error: 'agentIds (string[]) and published (boolean) required' });
          return;
        }

        const userRef = await ctx.getUserRef(req);
        const configs = await loadChatAgentConfigs();
        const configMap = new Map(configs.map(c => [c.agentId, c]));
        const now = new Date().toISOString();

        for (const agentId of agentIds) {
          const existing = configMap.get(agentId);
          if (existing) {
            existing.lifecycleStage = published ? 'deployed' : 'registered';
            existing.published = published;
            if (published) {
              existing.visible = true;
              existing.version = (existing.version ?? 0) + 1;
            } else {
              existing.visible = false;
              existing.featured = false;
            }
            existing.promotedAt = now;
            existing.promotedBy = userRef;
          } else {
            const newCfg: ChatAgentConfig = {
              agentId,
              lifecycleStage: published ? 'deployed' : 'registered',
              published,
              visible: published,
              featured: false,
              version: published ? 1 : 0,
              promotedAt: now,
              promotedBy: userRef,
            };
            configs.push(newCfg);
            configMap.set(agentId, newCfg);
          }
        }

        await saveChatAgentConfigs(configs, userRef);
        logger.info(`Bulk ${published ? 'publish' : 'unpublish'} of ${agentIds.length} agents by ${userRef}`);
        res.json({ success: true, count: agentIds.length, published });
      },
    ),
  );

  // ---------------------------------------------------------------------------
  // PUT /agents/:agentId/config -- update agent display config
  // ---------------------------------------------------------------------------
  router.put(
    '/agents/:agentId/config',
    ctx.requireAdminAccess,
    withRoute(
      'PUT /agents/:agentId/config',
      'Failed to update agent config',
      async (req, res) => {
        const agentId = decodeURIComponent(req.params.agentId);
        const userRef = await ctx.getUserRef(req);
        const patch = req.body as Partial<ChatAgentConfig>;
        const configs = await loadChatAgentConfigs();
        const existing = configs.find(c => c.agentId === agentId);

        if (existing) {
          Object.assign(existing, patch, { agentId });
        } else {
          configs.push({
            agentId,
            published: false,
            visible: false,
            featured: false,
            ...patch,
          });
        }

        await saveChatAgentConfigs(configs, userRef);
        res.json({ success: true, agentId });
      },
    ),
  );
}
