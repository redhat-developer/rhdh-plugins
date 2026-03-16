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
import type { LoggerService } from '@backstage/backend-plugin-api';
import type { ConfigResolutionService } from './ConfigResolutionService';
import type { ConfigLoader } from './ConfigLoader';
import {
  resolveAgentGraph,
  type AgentGraphSnapshot,
} from '../responses-api/agents/agentGraph';
import { DEFAULT_SYSTEM_PROMPT } from '../../constants';

/**
 * Manages the agent graph lifecycle with generation-based caching.
 *
 * Follows the OpenAI Agents SDK pattern: agents are resolved per-request,
 * not frozen at startup. The manager produces an AgentGraphSnapshot from
 * the effective config (YAML + DB overrides) and caches it until
 * invalidated by an admin config change.
 *
 * Flow:
 * 1. Admin saves agents → `invalidate()` increments generation
 * 2. Next chat request → `getSnapshot()` detects stale cache → re-resolves
 * 3. Snapshot is passed to `AdkOrchestrator.chat()` / `chatStream()` — immutable for that run
 */
export class AgentGraphManager {
  private cachedSnapshot: AgentGraphSnapshot | null = null;
  private generation = 0;
  private snapshotGeneration = -1;
  private inflightResolve: Promise<AgentGraphSnapshot> | null = null;
  private lastResolutionError: string | null = null;
  private lastResolveTimestamp = 0;
  private static readonly MIN_RESOLVE_INTERVAL_MS = 500;

  constructor(
    private readonly configResolution: ConfigResolutionService,
    private readonly configLoader: ConfigLoader,
    private readonly logger: LoggerService,
  ) {}

  getLastResolutionError(): string | null {
    return this.lastResolutionError;
  }

  /**
   * Bump the generation counter so the next `getSnapshot()` re-resolves.
   * Called by ResponsesApiCoordinator.invalidateRuntimeConfig().
   */
  invalidate(): void {
    this.generation++;
  }

  /**
   * Get the current agent graph snapshot. Re-resolves from EffectiveConfig
   * only when the generation has changed (i.e., after invalidation).
   * Concurrent callers share a single in-flight resolution.
   */
  async getSnapshot(): Promise<AgentGraphSnapshot> {
    if (this.cachedSnapshot && this.snapshotGeneration === this.generation) {
      return this.cachedSnapshot;
    }

    // Debounce: if we have a cached snapshot that was valid (successfully
    // cached) and resolved very recently, return it to prevent thrashing
    // under rapid admin save cycles. Only applies when the snapshot was
    // actually cached (snapshotGeneration was updated), not when caching
    // was skipped due to a mid-resolution invalidation.
    if (
      this.cachedSnapshot &&
      this.snapshotGeneration >= 0 &&
      this.generation - this.snapshotGeneration <= 2
    ) {
      const elapsed = Date.now() - this.lastResolveTimestamp;
      if (elapsed < AgentGraphManager.MIN_RESOLVE_INTERVAL_MS) {
        return this.cachedSnapshot;
      }
    }

    if (this.inflightResolve) {
      return this.inflightResolve;
    }

    const targetGen = this.generation;

    this.inflightResolve = this.resolveSnapshot(targetGen).finally(() => {
      this.inflightResolve = null;
    });

    return this.inflightResolve;
  }

  private async resolveSnapshot(
    targetGen: number,
  ): Promise<AgentGraphSnapshot> {
    const config = await this.configResolution.resolve();

    const isZdr = config.zdrMode ?? false;

    // Agents can come from two sources:
    // 1. EffectiveConfig (YAML + DB merge via RuntimeConfigResolver)
    // 2. ConfigLoader.loadAgentConfigs() (YAML-only fallback when
    //    no RuntimeConfigResolver exists, e.g. no AdminConfigService)
    let agents = config.agents;
    let defaultAgent = config.defaultAgent;
    let maxAgentTurns = config.maxAgentTurns;

    if (!agents || Object.keys(agents).length === 0) {
      const yamlAgents = this.configLoader.loadAgentConfigs();
      if (yamlAgents) {
        agents = yamlAgents.agents;
        defaultAgent = yamlAgents.defaultAgent;
        maxAgentTurns = yamlAgents.maxAgentTurns;
      }
    }

    const hasAgents = agents && Object.keys(agents).length > 0;

    if (hasAgents && isZdr) {
      const errorMsg =
        'Cannot use multi-agent mode with zdrMode=true. ' +
        'Multi-agent requires store:true for previous_response_id chaining. ' +
        'Falling back to auto-synthesized single agent.';
      this.logger.error(`[AgentGraphManager] ${errorMsg}`);
      this.lastResolutionError = errorMsg;
      return this.buildAndCache(
        this.buildSingleAgentFallback(config.systemPrompt, 1),
        targetGen,
      );
    }

    if (hasAgents) {
      try {
        const snapshot = resolveAgentGraph(
          agents!,
          defaultAgent!,
          maxAgentTurns,
          this.logger,
        );
        this.lastResolutionError = null;
        return this.buildAndCache(snapshot, targetGen);
      } catch (error) {
        const errorMsg = `Failed to resolve agent graph: ${String(error)}. Falling back to single-agent mode.`;
        this.logger.error(`[AgentGraphManager] ${errorMsg}`);
        this.lastResolutionError = errorMsg;
        return this.buildAndCache(
          this.buildSingleAgentFallback(config.systemPrompt, isZdr ? 1 : 3),
          targetGen,
        );
      }
    }

    this.lastResolutionError = null;
    const maxTurns = isZdr ? 1 : 3;
    this.logger.info(
      `[AgentGraphManager] No agents configured — auto-synthesized default agent (maxTurns=${maxTurns}, zdr=${isZdr})`,
    );
    return this.buildAndCache(
      this.buildSingleAgentFallback(config.systemPrompt, maxTurns),
      targetGen,
    );
  }

  private buildAndCache(
    snapshot: AgentGraphSnapshot,
    targetGen: number,
  ): AgentGraphSnapshot {
    if (this.generation === targetGen) {
      this.cachedSnapshot = snapshot;
      this.snapshotGeneration = targetGen;
    }
    this.lastResolveTimestamp = Date.now();
    return snapshot;
  }

  private buildSingleAgentFallback(
    systemPrompt: string | undefined,
    maxTurns: number,
  ): AgentGraphSnapshot {
    return resolveAgentGraph(
      {
        default: {
          name: 'Assistant',
          instructions: systemPrompt || DEFAULT_SYSTEM_PROMPT,
          enableRAG: true,
        },
      },
      'default',
      maxTurns,
      this.logger,
    );
  }
}
