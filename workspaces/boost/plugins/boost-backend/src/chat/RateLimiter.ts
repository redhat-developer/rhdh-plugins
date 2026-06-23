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
 * Options for creating a RateLimiter.
 *
 * @public
 */
export interface RateLimiterOptions {
  /** The Backstage cache service. */
  cache: CacheService;
  /** The Backstage logger service. */
  logger: LoggerService;
  /** Maximum number of requests per window. Defaults to 60. */
  maxRequests?: number;
  /** Window duration in milliseconds. Defaults to 60000 (1 minute). */
  windowMs?: number;
}

/**
 * Serializable state stored in cacheService for a rate limit window.
 */
interface RateLimitEntry {
  /** Number of requests in the current window. */
  count: number;
  /** Timestamp (ms) when the window resets. */
  windowStart: number;
}

/**
 * Per-window rate limiter backed by Backstage cacheService.
 * Uses cacheService for all state per Decision 3 (design.md, task 1.9).
 *
 * @public
 */
export class RateLimiter {
  private readonly cache: CacheService;
  private readonly logger: LoggerService;
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(options: RateLimiterOptions) {
    this.maxRequests = options.maxRequests ?? 60;
    this.windowMs = options.windowMs ?? 60_000;
    this.cache = options.cache.withOptions({
      defaultTtl: this.windowMs,
    });
    this.logger = options.logger;
  }

  /**
   * Checks whether a request from the given identity is allowed.
   *
   * @param identity - A unique key for the requester (e.g. userEntityRef).
   * @returns An object indicating whether the request is allowed and remaining quota.
   */
  async consume(
    identity: string,
  ): Promise<{ allowed: boolean; remaining: number; retryAfterMs?: number }> {
    const key = `rate-limit:${identity}`;
    const now = Date.now();

    const raw = await this.cache.get(key);
    let entry: RateLimitEntry | undefined;

    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          typeof parsed.count === 'number' &&
          typeof parsed.windowStart === 'number'
        ) {
          entry = parsed as RateLimitEntry;
        }
      } catch {
        // Corrupt entry — treat as missing
      }
    }

    // If no entry or the window has expired, start a new window
    if (!entry || now - entry.windowStart >= this.windowMs) {
      const newEntry: RateLimitEntry = { count: 1, windowStart: now };
      await this.cache.set(key, JSON.stringify(newEntry));
      return { allowed: true, remaining: this.maxRequests - 1 };
    }

    // Window is still active
    if (entry.count >= this.maxRequests) {
      const retryAfterMs = entry.windowStart + this.windowMs - now;
      this.logger.warn(
        `Rate limit exceeded for ${identity}: ${entry.count}/${this.maxRequests}`,
      );
      return { allowed: false, remaining: 0, retryAfterMs };
    }

    // Increment count
    entry.count += 1;
    await this.cache.set(key, JSON.stringify(entry));
    return { allowed: true, remaining: this.maxRequests - entry.count };
  }
}
