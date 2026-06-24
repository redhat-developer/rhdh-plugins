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
  CacheService,
  LoggerService,
} from '@backstage/backend-plugin-api';

/**
 * Options for creating a {@link McpAuthTokenCache}.
 *
 * @internal
 */
export interface McpAuthTokenCacheOptions {
  cache: CacheService;
  logger: LoggerService;
}

const KEY_PREFIX = 'llamastack:mcp-token:';

/**
 * Caches MCP server authentication tokens using Backstage cacheService.
 *
 * Each token is keyed by server label and stored with a TTL derived from
 * the token's expiry time (task 3.5). Redis-backed in production for
 * multi-instance safety.
 *
 * @internal
 */
export class McpAuthTokenCache {
  private readonly cache: CacheService;
  private readonly logger: LoggerService;

  constructor(options: McpAuthTokenCacheOptions) {
    this.cache = options.cache;
    this.logger = options.logger;
  }

  /**
   * Retrieve a cached token for the given MCP server.
   *
   * @param serverLabel - The MCP server label.
   * @returns The cached token, or undefined if not cached or expired.
   */
  async get(serverLabel: string): Promise<string | undefined> {
    const key = `${KEY_PREFIX}${serverLabel}`;
    const cached = await this.cache.get(key);
    if (typeof cached === 'string') {
      this.logger.debug(`MCP auth token cache hit for server "${serverLabel}"`);
      return cached;
    }
    return undefined;
  }

  /**
   * Store a token for the given MCP server with an explicit TTL.
   *
   * @param serverLabel - The MCP server label.
   * @param token - The access token.
   * @param ttlSeconds - TTL in seconds, typically derived from token expiry.
   */
  async set(
    serverLabel: string,
    token: string,
    ttlSeconds: number,
  ): Promise<void> {
    const key = `${KEY_PREFIX}${serverLabel}`;
    await this.cache.set(key, token, {
      ttl: ttlSeconds * 1000,
    });
    this.logger.debug(
      `Cached MCP auth token for server "${serverLabel}" (TTL: ${ttlSeconds}s)`,
    );
  }

  /**
   * Invalidate the cached token for the given MCP server.
   *
   * @param serverLabel - The MCP server label.
   */
  async invalidate(serverLabel: string): Promise<void> {
    const key = `${KEY_PREFIX}${serverLabel}`;
    await this.cache.delete(key);
    this.logger.debug(
      `MCP auth token cache invalidated for server "${serverLabel}"`,
    );
  }
}
