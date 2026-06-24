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
 * Options for creating a {@link KeycloakTokenCache}.
 *
 * @internal
 */
export interface KeycloakTokenCacheOptions {
  cache: CacheService;
  logger: LoggerService;
}

/**
 * Caches Keycloak access tokens using Backstage cacheService.
 *
 * Each token is keyed by realm and client ID and stored with a TTL
 * derived from the token's expiry time (task 3.4). Redis-backed in
 * production for multi-instance safety.
 *
 * @internal
 */
export class KeycloakTokenCache {
  private static readonly KEY_PREFIX = 'kagenti:keycloak-token:';

  private readonly cache: CacheService;
  private readonly logger: LoggerService;

  constructor(options: KeycloakTokenCacheOptions) {
    this.cache = options.cache;
    this.logger = options.logger;
  }

  /**
   * Retrieve a cached Keycloak token for the given key.
   *
   * @param tokenKey - A unique key identifying the token scope (e.g., realm/clientId).
   * @returns The cached token, or undefined if not cached or expired.
   */
  async get(tokenKey: string): Promise<string | undefined> {
    const key = `${KeycloakTokenCache.KEY_PREFIX}${tokenKey}`;
    const cached = await this.cache.get(key);
    if (typeof cached === 'string') {
      this.logger.debug(`Keycloak token cache hit for key "${tokenKey}"`);
      return cached;
    }
    return undefined;
  }

  /**
   * Store a Keycloak token with an explicit TTL derived from token expiry.
   *
   * @param tokenKey - A unique key identifying the token scope.
   * @param token - The access token.
   * @param ttlSeconds - TTL in seconds, typically derived from token expiry.
   */
  async set(
    tokenKey: string,
    token: string,
    ttlSeconds: number,
  ): Promise<void> {
    const key = `${KeycloakTokenCache.KEY_PREFIX}${tokenKey}`;
    await this.cache.set(key, token, {
      ttl: ttlSeconds * 1000,
    });
    this.logger.debug(
      `Cached Keycloak token for key "${tokenKey}" (TTL: ${ttlSeconds}s)`,
    );
  }

  /**
   * Invalidate the cached token for the given key.
   *
   * @param tokenKey - The token key to invalidate.
   */
  async invalidate(tokenKey: string): Promise<void> {
    const key = `${KeycloakTokenCache.KEY_PREFIX}${tokenKey}`;
    await this.cache.delete(key);
    this.logger.debug(`Keycloak token cache invalidated for key "${tokenKey}"`);
  }
}
