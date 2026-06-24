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
 * Options for creating a DocumentSyncService.
 *
 * @public
 */
export interface DocumentSyncServiceOptions {
  /** The Backstage cache service. */
  cache: CacheService;
  /** The Backstage logger service. */
  logger: LoggerService;
}

/**
 * Cache-backed service that tracks content hashes for document change detection.
 * Uses Backstage cacheService with a long TTL per the cache-migration spec (task 1.4).
 *
 * Content hashes are shared across instances for consistent sync behavior,
 * enabling the RAG pipeline to detect which documents have changed and
 * only re-ingest modified files.
 *
 * @public
 */
export class DocumentSyncService {
  private readonly cache: CacheService;
  private readonly logger: LoggerService;

  /** Cache TTL for content hashes: 365 days (effectively no expiry). */
  static readonly TTL_MS = 365 * 24 * 60 * 60 * 1000;

  constructor(options: DocumentSyncServiceOptions) {
    this.cache = options.cache.withOptions({
      defaultTtl: DocumentSyncService.TTL_MS,
    });
    this.logger = options.logger;
  }

  /**
   * Stores a content hash for a document.
   *
   * @param documentId - The unique document identifier.
   * @param hash - The content hash of the document.
   */
  async setHash(documentId: string, hash: string): Promise<void> {
    const key = `doc-sync:${documentId}`;
    await this.cache.set(key, hash);
    this.logger.debug(`Stored content hash for document ${documentId}`);
  }

  /**
   * Retrieves the stored content hash for a document.
   *
   * @param documentId - The unique document identifier.
   * @returns The content hash or undefined if not cached.
   */
  async getHash(documentId: string): Promise<string | undefined> {
    const key = `doc-sync:${documentId}`;
    const value = await this.cache.get(key);
    return typeof value === 'string' ? value : undefined;
  }

  /**
   * Removes the content hash for a document.
   *
   * @param documentId - The unique document identifier.
   */
  async deleteHash(documentId: string): Promise<void> {
    const key = `doc-sync:${documentId}`;
    await this.cache.delete(key);
    this.logger.debug(`Removed content hash for document ${documentId}`);
  }

  /**
   * Checks whether a document has changed by comparing its current content
   * hash against the stored hash.
   *
   * @param documentId - The unique document identifier.
   * @param currentHash - The current content hash to compare.
   * @returns True if the document is new or has changed, false otherwise.
   */
  async hasChanged(documentId: string, currentHash: string): Promise<boolean> {
    const storedHash = await this.getHash(documentId);
    return storedHash !== currentHash;
  }
}
