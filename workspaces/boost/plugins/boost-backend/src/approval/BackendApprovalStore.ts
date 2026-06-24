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
 * The status of an approval request.
 *
 * @public
 */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

/**
 * A pending tool call approval request stored in the cache.
 *
 * @public
 */
export interface ApprovalRequest {
  /** Unique identifier for the approval request. */
  requestId: string;
  /** The conversation this approval belongs to. */
  conversationId: string;
  /** The tool call identifier from the inference loop. */
  toolCallId: string;
  /** The name of the tool being called. */
  toolName: string;
  /** JSON-serialized arguments proposed by the agent. */
  args: string;
  /** Current status of the approval request. */
  status: ApprovalStatus;
  /** Identity of the user who will review the request (userEntityRef). */
  userRef: string;
  /** ISO 8601 timestamp of when the request was created. */
  createdAt: string;
  /** ISO 8601 timestamp of when the request was resolved (if resolved). */
  resolvedAt?: string;
  /** The approved arguments (may differ from original if edited). */
  resolvedArgs?: string;
  /** Optional message describing what needs approval. */
  message?: string;
}

/**
 * Options for creating a BackendApprovalStore.
 *
 * @public
 */
export interface BackendApprovalStoreOptions {
  /** The Backstage cache service. */
  cache: CacheService;
  /** The Backstage logger service. */
  logger: LoggerService;
}

/**
 * Request-scoped cache that stores HITL (human-in-the-loop) approval
 * state for tool calls. Uses Backstage cacheService with namespace
 * isolation per Decision 3 (design.md, task 1.10).
 *
 * Approval requests have a short TTL (10 minutes) because they are
 * transient — tied to an active inference loop that is paused waiting
 * for a user decision.
 *
 * @public
 */
export class BackendApprovalStore {
  private readonly cache: CacheService;
  private readonly logger: LoggerService;

  /** Cache TTL for approval requests: 10 minutes. */
  static readonly TTL_MS = 10 * 60 * 1000;

  constructor(options: BackendApprovalStoreOptions) {
    this.cache = options.cache.withOptions({
      defaultTtl: BackendApprovalStore.TTL_MS,
    });
    this.logger = options.logger;
  }

  /**
   * Stores a new pending approval request.
   *
   * Called when the inference loop encounters a tool call with
   * `requireApproval: true` and pauses execution.
   *
   * @param request - The approval request to store.
   */
  async create(request: ApprovalRequest): Promise<void> {
    const key = `approval:${request.requestId}`;
    await this.cache.set(key, JSON.stringify(request));
    this.logger.debug(
      `Stored approval request ${request.requestId} for tool ${request.toolName}`,
    );
  }

  /**
   * Retrieves an approval request by its ID.
   *
   * @param requestId - The approval request identifier.
   * @returns The approval request or undefined if not found or expired.
   */
  async get(requestId: string): Promise<ApprovalRequest | undefined> {
    const key = `approval:${requestId}`;
    const raw = await this.cache.get(key);

    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw) as ApprovalRequest;
      } catch {
        // Corrupt entry — treat as missing
        this.logger.warn(
          `Corrupt approval cache entry for ${requestId}, treating as missing`,
        );
        return undefined;
      }
    }

    // Some cache backends auto-deserialize JSON into objects
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      const candidate = raw as Record<string, unknown>;
      if (
        typeof candidate.requestId === 'string' &&
        typeof candidate.status === 'string'
      ) {
        return raw as unknown as ApprovalRequest;
      }
    }

    return undefined;
  }

  /**
   * Resolves an approval request by approving it.
   *
   * The approved arguments may differ from the original if the user
   * edited parameters before approving.
   *
   * @param requestId - The approval request identifier.
   * @param resolvedArgs - The approved JSON-serialized arguments.
   * @returns The updated approval request, or undefined if not found.
   */
  async approve(
    requestId: string,
    resolvedArgs?: string,
  ): Promise<ApprovalRequest | undefined> {
    const request = await this.get(requestId);
    if (!request) {
      this.logger.warn(
        `Cannot approve: approval request ${requestId} not found or expired`,
      );
      return undefined;
    }

    if (request.status !== 'pending') {
      this.logger.warn(
        `Cannot approve: approval request ${requestId} is already ${request.status}`,
      );
      return undefined;
    }

    const updated: ApprovalRequest = {
      ...request,
      status: 'approved',
      resolvedAt: new Date().toISOString(),
      resolvedArgs: resolvedArgs ?? request.args,
    };

    const key = `approval:${requestId}`;
    await this.cache.set(key, JSON.stringify(updated));
    this.logger.debug(
      `Approved tool call ${request.toolName} (request ${requestId})`,
    );
    return updated;
  }

  /**
   * Resolves an approval request by rejecting it.
   *
   * @param requestId - The approval request identifier.
   * @returns The updated approval request, or undefined if not found.
   */
  async reject(requestId: string): Promise<ApprovalRequest | undefined> {
    const request = await this.get(requestId);
    if (!request) {
      this.logger.warn(
        `Cannot reject: approval request ${requestId} not found or expired`,
      );
      return undefined;
    }

    if (request.status !== 'pending') {
      this.logger.warn(
        `Cannot reject: approval request ${requestId} is already ${request.status}`,
      );
      return undefined;
    }

    const updated: ApprovalRequest = {
      ...request,
      status: 'rejected',
      resolvedAt: new Date().toISOString(),
    };

    const key = `approval:${requestId}`;
    await this.cache.set(key, JSON.stringify(updated));
    this.logger.debug(
      `Rejected tool call ${request.toolName} (request ${requestId})`,
    );
    return updated;
  }

  /**
   * Removes an approval request from the cache.
   *
   * @param requestId - The approval request identifier.
   */
  async delete(requestId: string): Promise<void> {
    const key = `approval:${requestId}`;
    await this.cache.delete(key);
    this.logger.debug(`Removed approval request ${requestId}`);
  }
}
