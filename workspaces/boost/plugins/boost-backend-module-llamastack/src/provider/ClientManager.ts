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
import type { ClientState } from '../types';

/**
 * Options for creating a {@link ClientManager}.
 *
 * @internal
 */
export interface ClientManagerOptions {
  cache: CacheService;
  logger: LoggerService;
}

/**
 * Manages identity-keyed client state using Backstage cacheService.
 *
 * Each user identity gets its own client state entry, enabling per-user
 * session tracking and activity monitoring. Uses cacheService with a
 * 1-hour default TTL (task 3.8, platform-ops 1.6).
 *
 * @internal
 */
export class ClientManager {
  private static readonly KEY_PREFIX = 'llamastack:client:';
  static readonly TTL_MS = 3600 * 1000; // 1 hour

  private readonly cache: CacheService;
  private readonly logger: LoggerService;

  constructor(options: ClientManagerOptions) {
    this.cache = options.cache;
    this.logger = options.logger;
  }

  /**
   * Retrieve client state for the given user identity.
   *
   * @param userRef - The user entity ref (e.g., 'user:default/john').
   * @returns The client state, or undefined if not tracked.
   */
  async get(userRef: string): Promise<ClientState | undefined> {
    const key = `${ClientManager.KEY_PREFIX}${userRef}`;
    const cached = await this.cache.get(key);
    if (typeof cached === 'string') {
      try {
        return JSON.parse(cached) as ClientState;
      } catch {
        this.logger.warn(`Corrupted cache entry for "${userRef}", deleting`);
        await this.cache.delete(key);
        return undefined;
      }
    }
    return undefined;
  }

  /**
   * Update or create client state for the given user identity.
   * Refreshes the TTL on each update to keep active clients alive.
   *
   * @param userRef - The user entity ref.
   * @param state - The client state to store.
   */
  async set(userRef: string, state: ClientState): Promise<void> {
    const key = `${ClientManager.KEY_PREFIX}${userRef}`;
    await this.cache.set(key, JSON.stringify(state), {
      ttl: ClientManager.TTL_MS,
    });
    this.logger.debug(
      `Updated client state for "${userRef}" (sessions: ${state.sessionCount})`,
    );
  }

  /**
   * Record activity for a user, creating or updating their client state.
   *
   * @param userRef - The user entity ref.
   */
  async recordActivity(userRef: string): Promise<ClientState> {
    const existing = await this.get(userRef);
    const state: ClientState = {
      userRef,
      lastActivity: new Date().toISOString(),
      sessionCount: existing ? existing.sessionCount + 1 : 1,
    };
    await this.set(userRef, state);
    return state;
  }

  /**
   * Delete client state for the given user identity.
   *
   * @param userRef - The user entity ref.
   */
  async delete(userRef: string): Promise<void> {
    const key = `${ClientManager.KEY_PREFIX}${userRef}`;
    await this.cache.delete(key);
    this.logger.debug(`Deleted client state for "${userRef}"`);
  }
}
