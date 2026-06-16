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
  DatabaseService,
} from '@backstage/backend-plugin-api';
import type { SyncResult } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { toErrorMessage } from '../../../services/utils';
import { MAX_CONTENT_HASH_CACHE_SIZE } from '../../../constants';
import { VectorStoreService } from './VectorStoreService';
import { DocumentIngestionService } from '../../../services/DocumentIngestionService';
import type { DocumentsConfig } from '../../../types';
import { performSync } from './documentSyncOps';

export type { SyncResult };

const HASH_TABLE = 'augment_content_hashes';

export class DocumentSyncService {
  private readonly vectorStore: VectorStoreService;
  private readonly ingestion: DocumentIngestionService;
  private readonly logger: LoggerService;
  private readonly database?: DatabaseService;
  private documentsConfig: DocumentsConfig | null;

  private contentHashCache: Map<string, string> = new Map();
  private hashCacheLoaded = false;
  private db: Awaited<ReturnType<DatabaseService['getClient']>> | null = null;
  private syncLock: Promise<SyncResult> | null = null;

  constructor(
    vectorStore: VectorStoreService,
    ingestion: DocumentIngestionService,
    documentsConfig: DocumentsConfig | null,
    logger: LoggerService,
    database?: DatabaseService,
  ) {
    this.vectorStore = vectorStore;
    this.ingestion = ingestion;
    this.documentsConfig = documentsConfig;
    this.logger = logger;
    this.database = database;
  }

  async initialize(): Promise<void> {
    if (!this.database) {
      this.logger.debug(
        'No database provided — content hashes will not persist across restarts',
      );
      return;
    }
    try {
      this.db = await this.database.getClient();
      const hasTable = await this.db.schema.hasTable(HASH_TABLE);
      if (!hasTable) {
        try {
          await this.db.schema.createTable(HASH_TABLE, table => {
            table.string('file_name', 512).primary().notNullable();
            table.string('content_hash', 64).notNullable();
            table.string('source_id', 1024).nullable();
            table
              .timestamp('updated_at')
              .notNullable()
              .defaultTo(this.db!.fn.now());
          });
          this.logger.info(`Created ${HASH_TABLE} table`);
        } catch (createError) {
          const existsNow = await this.db.schema.hasTable(HASH_TABLE);
          if (!existsNow) throw createError;
          this.logger.info(
            `${HASH_TABLE} table was created by another instance`,
          );
        }
      }
    } catch (error) {
      this.logger.warn(
        `Failed to initialize hash cache table: ${toErrorMessage(error)}. Falling back to in-memory cache.`,
      );
      this.db = null;
    }
  }

  private evictCacheIfNeeded(): void {
    if (this.contentHashCache.size >= MAX_CONTENT_HASH_CACHE_SIZE) {
      const firstKey = this.contentHashCache.keys().next().value;
      if (firstKey !== undefined) this.contentHashCache.delete(firstKey);
    }
  }

  private async loadHashCache(): Promise<void> {
    if (this.hashCacheLoaded || !this.db) return;
    try {
      const rows = await this.db<{
        file_name: string;
        content_hash: string;
        source_id: string | null;
      }>(HASH_TABLE).select('file_name', 'content_hash', 'source_id');
      for (const row of rows) {
        this.evictCacheIfNeeded();
        this.contentHashCache.set(
          row.source_id || row.file_name,
          row.content_hash,
        );
      }
      this.hashCacheLoaded = true;
      this.logger.debug(`Loaded ${rows.length} content hash(es) from database`);
    } catch (error) {
      this.logger.warn(
        `Failed to load hash cache from database: ${toErrorMessage(error)}`,
      );
    }
  }

  private async persistHash(
    fileName: string,
    contentHash: string,
    sourceId?: string,
  ): Promise<void> {
    if (!this.db) return;
    try {
      await this.db(HASH_TABLE)
        .insert({
          file_name: fileName,
          content_hash: contentHash,
          source_id: sourceId ?? null,
          updated_at: this.db.fn.now(),
        })
        .onConflict('file_name')
        .merge({
          content_hash: contentHash,
          source_id: sourceId ?? null,
          updated_at: this.db.fn.now(),
        });
    } catch (error) {
      this.logger.debug(
        `Failed to persist hash for ${fileName}: ${toErrorMessage(error)}`,
      );
    }
  }

  private evictCacheByFileName(fileName: string): void {
    for (const key of this.contentHashCache.keys()) {
      if (key === fileName || key.endsWith(`:${fileName}`))
        this.contentHashCache.delete(key);
    }
  }

  private async removePersistedHash(fileName: string): Promise<void> {
    if (!this.db) return;
    try {
      await this.db(HASH_TABLE).where('file_name', fileName).delete();
    } catch (error) {
      this.logger.debug(
        `Failed to remove hash for ${fileName}: ${toErrorMessage(error)}`,
      );
    }
  }

  setDocumentsConfig(config: DocumentsConfig | null): void {
    this.documentsConfig = config;
  }
  getDocumentsConfig(): DocumentsConfig | null {
    return this.documentsConfig;
  }
  isSyncInProgress(): boolean {
    return this.syncLock !== null;
  }
  getSyncSchedule(): string | undefined {
    return this.documentsConfig?.syncSchedule;
  }

  async sync(): Promise<SyncResult> {
    if (this.syncLock !== null) {
      this.logger.info('Document sync already in progress, skipping');
      return {
        added: 0,
        updated: 0,
        removed: 0,
        failed: 0,
        unchanged: 0,
        errors: [],
      };
    }
    if (!this.documentsConfig || this.documentsConfig.sources.length === 0) {
      this.logger.debug('No document sources configured, skipping sync');
      return {
        added: 0,
        updated: 0,
        removed: 0,
        failed: 0,
        unchanged: 0,
        errors: [],
      };
    }

    const syncPromise = performSync(
      this.documentsConfig,
      this.ingestion,
      this.vectorStore,
      {
        evictCacheIfNeeded: () => this.evictCacheIfNeeded(),
        contentHashCache: this.contentHashCache,
        persistHash: (fn, h, s) => this.persistHash(fn, h, s),
        evictCacheByFileName: fn => this.evictCacheByFileName(fn),
        removePersistedHash: fn => this.removePersistedHash(fn),
      },
      () => this.loadHashCache(),
      this.logger,
    );
    this.syncLock = syncPromise;
    try {
      return await syncPromise;
    } finally {
      this.syncLock = null;
    }
  }
}
