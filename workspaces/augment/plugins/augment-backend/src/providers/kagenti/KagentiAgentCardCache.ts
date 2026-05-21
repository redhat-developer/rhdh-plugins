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

import type {
  LoggerService,
  CacheService,
} from '@backstage/backend-plugin-api';
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

export class KagentiAgentCardCache {
  private readonly logger: LoggerService;
  private readonly cacheService: CacheService;

  constructor(logger: LoggerService, cacheService: CacheService) {
    this.logger = logger;
    this.cacheService = cacheService;
  }

  async getAgentCardCached(
    apiClient: KagentiApiClient,
    config: KagentiConfig,
    namespace: string,
    name: string,
    options?: { retries?: number },
  ): Promise<AgentCardCacheEntry> {
    const key = `agent-card:${namespace}/${name}`;
    const cachedCard = (await this.cacheService.get(key)) as
      | AgentCardResponse
      | undefined;

    if (cachedCard) {
      return this.buildEntry(cachedCard);
    }

    const card = await apiClient.getAgentCard(namespace, name, options);

    if (config.validateResponses) {
      const result = agentCardSchema.safeParse(card);
      if (!result.success) {
        const msg = `Agent card validation failed for ${namespace}/${name}: ${JSON.stringify(result.error.issues)}`;
        this.logger.warn(msg);
        throw new Error(msg);
      }
    }

    await this.cacheService.set(key, JSON.parse(JSON.stringify(card)));
    return this.buildEntry(card);
  }

  clear(): void {
    // CacheService doesn't expose a bulk-clear; individual entries expire via TTL
  }

  private buildEntry(card: AgentCardResponse): AgentCardCacheEntry {
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
      }
    } catch (err) {
      this.logger.warn(`Failed to parse agent card demands: ${err}`);
    }

    return { card, demands, resolveMetadata, fetchedAt: Date.now() };
  }
}
