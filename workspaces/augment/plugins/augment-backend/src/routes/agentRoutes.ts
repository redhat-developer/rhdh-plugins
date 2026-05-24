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
  type ChatAgent,
  type ChatAgentConfig,
  type AgentLifecycleStage,
  deriveRoleFromTopology,
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

interface LifecycleTransitionOpts {
  configs: ChatAgentConfig[];
  agentId: string;
  targetStage: AgentLifecycleStage;
  userRef: string;
  direction: string;
  rejection?: { reason?: string };
  saveFn: (c: ChatAgentConfig[], actor: string) => Promise<void>;
  audit: AuditLogger;
  logger: { info: (msg: string) => void };
  req: { headers: Record<string, string | string[] | undefined> };
}

async function applyLifecycleTransition(
  opts: LifecycleTransitionOpts,
): Promise<{ agentId: string; to: AgentLifecycleStage; version: number }> {
  const {
    configs,
    agentId,
    targetStage,
    userRef,
    direction,
    rejection,
    saveFn,
    audit,
    logger,
    req,
  } = opts;
  const existing = configs.find(c => c.agentId === agentId);
  const currentStage = normalizeLifecycleStage(existing?.lifecycleStage);

  if (!isValidTransition(currentStage, targetStage)) {
    throw new InputError(
      `Cannot transition from "${currentStage}" to "${targetStage}". ` +
        `Check available transitions for the current stage.`,
    );
  }

  const now = new Date().toISOString();
  const isProd = isPublishedStage(targetStage);

  if (existing) {
    existing.lifecycleStage = targetStage;
    existing.published = isProd;
    existing.visible = isProd;
    if (!isProd) existing.featured = false;
    existing.version = (existing.version ?? 0) + 1;
    existing.promotedAt = now;
    existing.promotedBy = userRef;
    if (rejection) {
      existing.rejectionReason = rejection.reason || undefined;
      existing.rejectedBy = userRef;
      existing.rejectedAt = now;
    } else if (existing.rejectionReason) {
      existing.rejectionReason = undefined;
      existing.rejectedBy = undefined;
      existing.rejectedAt = undefined;
    }
  } else {
    configs.push({
      agentId,
      lifecycleStage: targetStage,
      published: isProd,
      visible: isProd,
      featured: false,
      version: 1,
      promotedAt: now,
      promotedBy: userRef,
      createdBy: userRef,
      createdAt: now,
      ...(rejection
        ? {
            rejectionReason: rejection.reason || undefined,
            rejectedBy: userRef,
            rejectedAt: now,
          }
        : {}),
    });
  }

  await saveFn(configs, userRef);
  const version = existing?.version ?? 1;
  audit.log({
    action: 'agent.lifecycle',
    actor: userRef,
    target: agentId,
    outcome: 'success',
    sourceIp: AuditLogger.extractIp(
      req as Parameters<typeof AuditLogger.extractIp>[0],
    ),
    meta: {
      from: currentStage,
      to: targetStage,
      direction,
      version,
      ...(rejection?.reason ? { rejectionReason: rejection.reason } : {}),
    },
  });
  logger.info(
    `Agent "${agentId}" ${direction} to ${targetStage} (v${version}) by ${userRef}`,
  );
  return { agentId, to: targetStage, version };
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
  const audit = new AuditLogger(logger);

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
    const agentMap = raw as Record<
      string,
      {
        name?: string;
        instructions?: string;
        model?: string;
        handoffs?: string[];
        asTools?: string[];
      }
    >;
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
   * Load published workflows as agents (workflow-builder-sourced agents).
   */
  async function loadWorkflowAgents(): Promise<ChatAgent[]> {
    const raw = await adminConfig.get('workflows');
    if (!raw || typeof raw !== 'object') return [];
    const workflows = Array.isArray(raw) ? raw : Object.values(raw);
    return workflows
      .filter((w: Record<string, unknown>) => w && w.id && w.name)
      .map((w: Record<string, unknown>) => ({
        id: w.id as string,
        name: w.name as string,
        description: (w.description as string) || undefined,
        status: (w.status as string) === 'published' ? 'ready' : 'config',
        isDefault: false,
        providerType: 'orchestration',
        framework: 'workflow-builder',
        source: 'orchestration',
      }));
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
    const [
      providerAgents,
      orchAgents,
      orchProviderAgents,
      workflowAgents,
      chatConfigs,
    ] = await Promise.all([
      provider.listAgents ? provider.listAgents() : Promise.resolve([]),
      loadOrchestrationAgents(),
      orchProvider?.listAgents
        ? orchProvider.listAgents()
        : Promise.resolve([]),
      loadWorkflowAgents(),
      loadChatAgentConfigs(),
    ]);

    const configMap = new Map(chatConfigs.map(c => [c.agentId, c]));
    const seen = new Set<string>();
    const merged: ChatAgent[] = [];

    function overlayConfig(agent: ChatAgent, cfg?: ChatAgentConfig): ChatAgent {
      const stage = normalizeLifecycleStage(cfg?.lifecycleStage);
      return {
        ...agent,
        published: isPublishedStage(stage),
        lifecycleStage: stage,
        governanceRegistered: cfg !== undefined,
        version: cfg?.version ?? 0,
        promotedAt: cfg?.promotedAt,
        promotedBy: cfg?.promotedBy,
        createdBy: cfg?.createdBy,
        rejectionReason: cfg?.rejectionReason,
        rejectedBy: cfg?.rejectedBy,
        rejectedAt: cfg?.rejectedAt,
      };
    }

    for (const agent of providerAgents) {
      seen.add(agent.id);
      const cfg = configMap.get(agent.id);
      merged.push(
        overlayConfig(
          {
            ...agent,
            source: agent.source ?? 'kagenti',
            namespace: agent.id.includes('/')
              ? agent.id.split('/')[0]
              : undefined,
          },
          cfg,
        ),
      );
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

    for (const agent of workflowAgents) {
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
  // Non-admins see: published agents + their own agents + legacy unowned agents.
  // Admins see everything.
  // ---------------------------------------------------------------------------
  router.get(
    '/agents',
    withRoute('GET /agents', 'Failed to list agents', async (req, res) => {
      const { agents, sources } = await buildUnifiedAgentList();
      const publishedFilter = req.query.published;
      const isAdmin = await ctx.checkIsAdmin(req);

      let filtered = agents;

      if (publishedFilter === 'true') {
        filtered = filtered.filter(a => a.published === true);
      } else if (!isAdmin) {
        const userRef = await ctx.getUserRef(req);
        filtered = filtered.filter(
          a => a.published === true || a.createdBy === userRef || !a.createdBy,
        );
      }

      res.json({ agents: filtered, sources });
    }),
  );

  // ---------------------------------------------------------------------------
  // PUT /agents/:agentId/register -- add runtime agent to governance (draft)
  // ---------------------------------------------------------------------------
  router.put(
    '/agents/:agentId/register',
    ctx.requireAdminAccess,
    withRoute(
      'PUT /agents/:agentId/register',
      'Failed to register agent for governance',
      async (req, res) => {
        const agentId = decodeURIComponent(req.params.agentId);
        const userRef = await ctx.getUserRef(req);
        const { agents } = await buildUnifiedAgentList();
        if (!agents.some(a => a.id === agentId)) {
          res.status(404).json({
            error: `Agent "${agentId}" not found in the unified catalog.`,
          });
          return;
        }

        const configs = await loadChatAgentConfigs();
        if (configs.some(c => c.agentId === agentId)) {
          res.status(409).json({
            error: `Agent "${agentId}" is already registered for governance.`,
          });
          return;
        }

        const now = new Date().toISOString();
        configs.push({
          agentId,
          lifecycleStage: 'draft',
          published: false,
          visible: false,
          featured: false,
          version: 0,
          createdBy: userRef,
          createdAt: now,
        });
        await saveChatAgentConfigs(configs, userRef);
        audit.log({
          action: 'agent.lifecycle',
          actor: userRef,
          target: agentId,
          outcome: 'success',
          sourceIp: AuditLogger.extractIp(req),
          meta: { to: 'draft', direction: 'register' },
        });
        logger.info(
          `Agent "${agentId}" registered for governance by ${userRef}`,
        );
        res.status(201).json({
          success: true,
          agentId,
          lifecycleStage: 'draft',
          governanceRegistered: true,
        });
      },
    ),
  );

  // ---------------------------------------------------------------------------
  // PUT /agents/:agentId/promote -- transition agent to the specified target stage
  // Enforces valid transitions defined in LIFECYCLE_TRANSITIONS.
  // draft → review is open to any authenticated user (submit for approval).
  // All other transitions require admin access.
  // Non-admins cannot promote phantom drafts (agents with no config entry).
  // Non-admins can only promote agents they own (createdBy === userRef).
  // ---------------------------------------------------------------------------
  router.put(
    '/agents/:agentId/promote',
    withRoute(
      'PUT /agents/:agentId/promote',
      'Failed to promote agent',
      async (req, res) => {
        const agentId = decodeURIComponent(req.params.agentId);
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
        const isAdmin = await ctx.checkIsAdmin(req);
        const configs = await loadChatAgentConfigs();
        const existing = configs.find(c => c.agentId === agentId);

        const currentStage = normalizeLifecycleStage(existing?.lifecycleStage);
        const nextStage =
          resolved ??
          (() => {
            const idx = LIFECYCLE_STAGE_ORDER.indexOf(currentStage);
            const nextIdx = Math.min(idx + 1, LIFECYCLE_STAGE_ORDER.length - 2);
            return LIFECYCLE_STAGE_ORDER[nextIdx];
          })();

        const isSubmitForReview =
          currentStage === 'draft' && nextStage === 'pending';
        if (!isSubmitForReview && !isAdmin) {
          res.status(403).json({
            error:
              'Only admins can perform this lifecycle transition. ' +
              'Non-admin users may only submit draft agents for review.',
          });
          return;
        }
        if (!isAdmin && !existing) {
          res.status(404).json({
            error:
              'Agent not found in lifecycle config. ' +
              'Only agents you have created can be submitted for review.',
          });
          return;
        }
        if (!isAdmin && existing?.createdBy && existing.createdBy !== userRef) {
          res.status(403).json({
            error: 'You can only promote agents you created.',
          });
          return;
        }

        const result = await applyLifecycleTransition({
          configs,
          agentId,
          targetStage: nextStage,
          userRef,
          direction: 'promote',
          saveFn: saveChatAgentConfigs,
          audit,
          logger,
          req,
        });
        res.json({
          success: true,
          agentId: result.agentId,
          lifecycleStage: result.to,
          version: result.version,
        });
      },
    ),
  );

  // ---------------------------------------------------------------------------
  // PUT /agents/:agentId/demote -- transition agent backward
  // Enforces valid transitions defined in LIFECYCLE_TRANSITIONS.
  // Accepts optional `reason` for review → draft (rejection).
  // ---------------------------------------------------------------------------
  router.put(
    '/agents/:agentId/demote',
    ctx.requireAdminAccess,
    withRoute(
      'PUT /agents/:agentId/demote',
      'Failed to demote agent',
      async (req, res) => {
        const agentId = decodeURIComponent(req.params.agentId);
        const { targetStage, reason } = req.body as {
          targetStage?: string;
          reason?: string;
        };
        const resolved = targetStage
          ? normalizeLifecycleStage(targetStage)
          : undefined;
        if (resolved !== undefined && !isValidLifecycleStage(resolved)) {
          throw new InputError(
            `Invalid targetStage "${targetStage}". Must be one of: ${LIFECYCLE_STAGE_ORDER.join(', ')}`,
          );
        }
        const userRef = await ctx.getUserRef(req);
        const configs = await loadChatAgentConfigs();
        const existing = configs.find(c => c.agentId === agentId);

        const currentStage = normalizeLifecycleStage(existing?.lifecycleStage);
        const nextStage =
          resolved ??
          (() => {
            const idx = LIFECYCLE_STAGE_ORDER.indexOf(currentStage);
            return LIFECYCLE_STAGE_ORDER[Math.max(idx - 1, 0)];
          })();

        const isRejection = currentStage === 'pending' && nextStage === 'draft';
        const result = await applyLifecycleTransition({
          configs,
          agentId,
          targetStage: nextStage,
          userRef,
          direction: 'demote',
          rejection: isRejection ? { reason } : undefined,
          saveFn: saveChatAgentConfigs,
          audit,
          logger,
          req,
        });
        res.json({
          success: true,
          agentId: result.agentId,
          lifecycleStage: result.to,
        });
      },
    ),
  );

  // ---------------------------------------------------------------------------
  // PUT /agents/:agentId/publish and /unpublish
  // ---------------------------------------------------------------------------
  for (const { path, target, dir, notFoundMsg } of [
    {
      path: '/agents/:agentId/publish',
      target: 'published' as AgentLifecycleStage,
      dir: 'publish',
      notFoundMsg:
        'Agent is not registered for governance. Register the agent before publishing.',
    },
    {
      path: '/agents/:agentId/unpublish',
      target: 'pending' as AgentLifecycleStage,
      dir: 'unpublish',
      notFoundMsg:
        'Agent is not registered for governance. Nothing to unpublish.',
    },
  ] as const) {
    router.put(
      path,
      ctx.requireAdminAccess,
      withRoute(`PUT ${path}`, `Failed to ${dir} agent`, async (req, res) => {
        const agentId = decodeURIComponent(req.params.agentId);
        const userRef = await ctx.getUserRef(req);
        const configs = await loadChatAgentConfigs();
        const existing = configs.find(c => c.agentId === agentId);
        if (!existing) {
          res.status(404).json({ error: notFoundMsg });
          return;
        }
        const result = await applyLifecycleTransition({
          configs,
          agentId,
          targetStage: target,
          userRef,
          direction: dir,
          saveFn: saveChatAgentConfigs,
          audit,
          logger,
          req,
        });
        res.json({
          success: true,
          agentId: result.agentId,
          published: target === 'published',
          lifecycleStage: result.to,
        });
      }),
    );
  }

  // ---------------------------------------------------------------------------
  // PUT /agents/bulk-publish -- bulk publish/unpublish (valid transitions only)
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
          res.status(400).json({
            error: 'agentIds (string[]) and published (boolean) required',
          });
          return;
        }

        const userRef = await ctx.getUserRef(req);
        const configs = await loadChatAgentConfigs();
        const configMap = new Map(configs.map(c => [c.agentId, c]));
        const now = new Date().toISOString();
        const targetStage: AgentLifecycleStage = published
          ? 'published'
          : 'pending';

        const invalid: Array<{
          agentId: string;
          reason: string;
          currentStage?: AgentLifecycleStage;
        }> = [];

        for (const agentId of agentIds) {
          const existing = configMap.get(agentId);
          if (!existing) {
            invalid.push({
              agentId,
              reason: 'not_registered_for_governance',
            });
            continue;
          }
          const currentStage = normalizeLifecycleStage(existing.lifecycleStage);
          if (!isValidTransition(currentStage, targetStage)) {
            invalid.push({
              agentId,
              reason: 'invalid_lifecycle_transition',
              currentStage,
            });
          }
        }

        if (invalid.length > 0) {
          res.status(400).json({
            error:
              'One or more agents cannot be updated. All agents must be registered and in a valid stage.',
            invalid,
            targetStage,
          });
          return;
        }

        for (const agentId of agentIds) {
          const existing = configMap.get(agentId)!;
          existing.lifecycleStage = targetStage;
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
        }

        await saveChatAgentConfigs(configs, userRef);
        audit.log({
          action: 'agent.lifecycle',
          actor: userRef,
          target: agentIds.join(', '),
          outcome: 'success',
          sourceIp: AuditLogger.extractIp(req),
          meta: {
            direction: 'bulk-publish',
            to: targetStage,
            count: agentIds.length,
          },
        });
        logger.info(
          `Bulk ${published ? 'publish' : 'unpublish'} of ${agentIds.length} agents by ${userRef}`,
        );
        res.json({
          success: true,
          count: agentIds.length,
          published,
          lifecycleStage: targetStage,
        });
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

  // ---------------------------------------------------------------------------
  // DELETE /agents/:agentId -- enterprise-grade cascading delete
  // Detects the agent's source and cleans up all stores:
  //   - chatAgents lifecycle config entry
  //   - orchestration admin config ('agents' key) for responses-api agents
  // Kagenti K8s resource cleanup requires the dedicated admin endpoint.
  // Non-admins can only delete their own draft agents.
  // Admins can delete any agent's config.
  // ---------------------------------------------------------------------------
  router.delete(
    '/agents/:agentId',
    withRoute(
      'DELETE /agents/:agentId',
      'Failed to delete agent config',
      async (req, res) => {
        const agentId = decodeURIComponent(req.params.agentId);
        const userRef = await ctx.getUserRef(req);
        const admin = await ctx.checkIsAdmin(req);

        const { agents: allAgents } = await buildUnifiedAgentList();
        const agentRecord = allAgents.find(a => a.id === agentId);
        const source = agentRecord?.source ?? 'unknown';

        const configs = await loadChatAgentConfigs();
        const idx = configs.findIndex(c => c.agentId === agentId);

        if (idx === -1 && !agentRecord) {
          res.status(404).json({ error: 'Agent not found' });
          return;
        }

        const existing = idx !== -1 ? configs[idx] : undefined;
        const stage = normalizeLifecycleStage(existing?.lifecycleStage);

        if (!admin) {
          if (stage !== 'draft') {
            res.status(403).json({
              error: 'Non-admin users can only delete agents in draft stage.',
            });
            return;
          }
          if (existing?.createdBy && existing.createdBy !== userRef) {
            res.status(403).json({
              error: 'You can only delete agents you created.',
            });
            return;
          }
        }

        const cleanupResults: Record<string, string> = {};

        if (idx !== -1) {
          configs.splice(idx, 1);
          await saveChatAgentConfigs(configs, userRef);
          cleanupResults.chatAgents = 'success';
        } else {
          cleanupResults.chatAgents = 'skipped';
        }

        if (source === 'orchestration') {
          try {
            const raw = await adminConfig.get('agents');
            if (raw && typeof raw === 'object') {
              const agentMap = { ...(raw as Record<string, unknown>) };
              if (Object.hasOwn(agentMap, agentId)) {
                delete agentMap[agentId];
                await adminConfig.set('agents', agentMap, userRef);
                cleanupResults.orchestration = 'success';
              } else {
                cleanupResults.orchestration = 'skipped';
              }
            } else {
              cleanupResults.orchestration = 'skipped';
            }
          } catch (err) {
            cleanupResults.orchestration = `failed: ${err instanceof Error ? err.message : 'unknown'}`;
            logger.warn(
              `Orchestration cleanup failed for "${agentId}": ${cleanupResults.orchestration}`,
            );
          }
        } else {
          cleanupResults.orchestration = 'skipped';
        }

        if (source === 'kagenti') {
          cleanupResults.kagenti =
            'requires DELETE /kagenti/agents/:ns/:name (admin endpoint)';
        } else {
          cleanupResults.kagenti = 'skipped';
        }

        audit.log({
          action: 'agent.delete',
          actor: userRef,
          target: agentId,
          outcome: 'success',
          sourceIp: AuditLogger.extractIp(req),
          meta: {
            lifecycleStage: stage,
            isAdmin: admin,
            source,
            cleanupResults,
          },
        });
        logger.info(
          `Agent "${agentId}" deleted (source: ${source}, stage: ${stage}) by ${userRef}`,
        );
        res.json({ success: true, agentId, source, cleanupResults });
      },
    ),
  );
}
