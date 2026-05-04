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
import type { AgentCardResponse } from './client/types';
import type { KagentiApiClient } from './client/KagentiApiClient';
import type { KagentiConfig } from './config/KagentiConfigLoader';
import { handleAgentCard } from '@kagenti/adk/core';
import { agentCardSchema } from '@kagenti/adk';

export interface AgentCardCacheEntry {
  card: AgentCardResponse;
  demands: ReturnType<typeof handleAgentCard>['demands'];
  resolveMetadata: ReturnType<typeof handleAgentCard>['resolveMetadata'];
  fetchedAt: number;
}

const AGENT_CARD_CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;

export class KagentiAgentCardCache {
  private readonly cache = new Map<string, AgentCardCacheEntry>();
  private readonly logger: LoggerService;

  constructor(logger: LoggerService) {
    this.logger = logger;
  }

  async getAgentCardCached(
    apiClient: KagentiApiClient,
    config: KagentiConfig,
    namespace: string,
    name: string,
    options?: { retries?: number },
  ): Promise<AgentCardCacheEntry> {
    const key = `${namespace}/${name}`;
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.fetchedAt < AGENT_CARD_CACHE_TTL_MS) {
      return cached;
    }

    const card = await apiClient.getAgentCard(namespace, name, options);

    if (config.validateResponses) {
      const result = agentCardSchema.safeParse(card);
      if (!result.success) {
        const msg = `Agent card validation failed for ${key}: ${JSON.stringify(result.error.issues)}`;
        this.logger.warn(msg);
        throw new Error(msg);
      }
    }

    let demands: AgentCardCacheEntry['demands'] = {
      llmDemands: null,
      embeddingDemands: null,
      mcpDemands: null,
      oauthDemands: null,
      secretDemands: null,
      settingsDemands: null,
      formDemands: null,
    };
    let resolveMetadata: AgentCardCacheEntry['resolveMetadata'] =
      async () => ({});

    try {
      if (card.capabilities?.extensions?.length) {
        const adkResult = handleAgentCard(
          card as Parameters<typeof handleAgentCard>[0],
        );
        demands = adkResult.demands;
        resolveMetadata = adkResult.resolveMetadata;
        this.logger.debug(
          `Agent card demands for ${key}: llm=${!!demands.llmDemands}, mcp=${!!demands.mcpDemands}, oauth=${!!demands.oauthDemands}, secrets=${!!demands.secretDemands}`,
        );
      }
    } catch (err) {
      this.logger.warn(`Failed to parse agent card demands for ${key}: ${err}`);
    }

    const entry: AgentCardCacheEntry = {
      card,
      demands,
      resolveMetadata,
      fetchedAt: Date.now(),
    };

    if (this.cache.size >= MAX_CACHE_ENTRIES) {
      this.evictOldest();
    }
    this.cache.set(key, entry);
    return entry;
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  private evictOldest(): void {
    let oldestKey: string | undefined;
    let oldestTime = Infinity;
    for (const [key, entry] of this.cache) {
      if (entry.fetchedAt < oldestTime) {
        oldestTime = entry.fetchedAt;
        oldestKey = key;
      }
    }
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}
