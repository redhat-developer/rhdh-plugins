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
  RootConfigService,
  CacheService,
} from '@backstage/backend-plugin-api';

export const KAGENTI_PROVIDER_ID = 'kagenti';
export const KAGENTI_DISPLAY_NAME = 'Kagenti';
import { InputError } from '@backstage/errors';
import type { ChatRequest as AugmentChatRequest } from '../types';
import type { KagentiConfig } from './config/KagentiConfigLoader';
import type { AgentCardCacheEntry } from './KagentiAgentCardCache';

export interface KagentiProviderOptions {
  logger: LoggerService;
  config: RootConfigService;
  adminConfig?: import('../../services/AdminConfigService').AdminConfigService;
  cache?: CacheService;
}

export function stripTrailingSlashes(s: string): string {
  let end = s.length;
  while (end > 0 && s[end - 1] === '/') end--;
  return end === s.length ? s : s.slice(0, end);
}

export function createNoopCache(): CacheService {
  const store = new Map<string, { value: unknown; expiresAt: number }>();
  return {
    async get<T>(key: string): Promise<T | undefined> {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (Date.now() > entry.expiresAt) {
        store.delete(key);
        return undefined;
      }
      return entry.value as T;
    },
    async set(
      key: string,
      value: unknown,
      options?: { ttl?: number },
    ): Promise<void> {
      store.set(key, {
        value,
        expiresAt: Date.now() + (options?.ttl ?? 24 * 60 * 60 * 1000),
      });
    },
    async delete(key: string): Promise<void> {
      store.delete(key);
    },
    withOptions(_options: { defaultTtl?: number }): CacheService {
      return createNoopCache();
    },
  };
}

export function resolveAgent(
  request: AugmentChatRequest,
  config: KagentiConfig,
  nsValidator: (ns: string) => void,
  idParser: (id: string) => { namespace: string; name: string },
): { namespace: string; name: string } {
  const model =
    'model' in request ? (request.model as string | undefined) : undefined;
  if (model && model.includes('/')) {
    const parsed = idParser(model);
    nsValidator(parsed.namespace);
    return parsed;
  }
  return {
    namespace: config.namespace,
    name: config.agentName ?? model ?? 'default',
  };
}

export function parseAgentId(
  agentId: string,
  defaultNamespace: string,
): { namespace: string; name: string } {
  const slashIdx = agentId.indexOf('/');
  if (slashIdx > 0)
    return {
      namespace: agentId.substring(0, slashIdx),
      name: agentId.substring(slashIdx + 1),
    };
  return { namespace: defaultNamespace, name: agentId };
}

export function extractLastUserMessage(request: AugmentChatRequest): string {
  if (request.messages) {
    for (let i = request.messages.length - 1; i >= 0; i--) {
      if (request.messages[i].role === 'user')
        return request.messages[i].content || '';
    }
  }
  return '';
}

export async function buildA2AMetadata(
  namespace: string,
  name: string,
  getAgentCardCached: (ns: string, n: string) => Promise<AgentCardCacheEntry>,
  logger: LoggerService,
): Promise<
  | {
      metadata?: Record<string, unknown>;
      parts?: Array<Record<string, unknown>>;
      contextId?: string;
    }
  | undefined
> {
  try {
    const entry = await getAgentCardCached(namespace, name);
    const hasDemands = Object.values(entry.demands).some(d => d !== null);
    if (!hasDemands) return undefined;
    const metadata = await entry.resolveMetadata({});
    if (!metadata || Object.keys(metadata).length === 0) return undefined;
    return { metadata };
  } catch (err) {
    logger.debug(
      `Could not build A2A metadata for ${namespace}/${name}: ${err}`,
    );
    return undefined;
  }
}

export function validateNamespace(
  namespace: string,
  config: KagentiConfig,
): void {
  if (config.namespaces?.length) {
    if (!new Set(config.namespaces).has(namespace))
      throw new InputError(
        `Namespace "${namespace}" is not in the configured allow-list`,
      );
    return;
  }
  if (!config.showAllNamespaces && namespace !== config.namespace)
    throw new InputError(
      `Namespace "${namespace}" is not accessible (default: "${config.namespace}")`,
    );
}
