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
import type { DocumentInfo, VectorStoreInfo } from '../../types';
import type { VectorStoreService } from './VectorStoreService';
import type { DocumentSyncService, SyncResult } from './DocumentSyncService';
import type { ConfigResolutionService } from './ConfigResolutionService';
import { toErrorMessage } from '../../services/utils';
import {
  getVectorStoreConfig as queryGetConfig,
  getVectorStoreStatus as queryGetStatus,
  searchVectorStore as querySearch,
  syncDocuments as querySyncDocs,
  uploadDocument as queryUploadDoc,
} from './VectorStoreQueryOps';

/**
 * Context provided by the orchestrator for vector store operations.
 * Config resolution is delegated to ConfigResolutionService; only
 * orchestrator lifecycle state is passed via callbacks.
 */
export interface VectorStoreFacadeContext {
  ensureInitialized: () => void;
  configResolution: ConfigResolutionService;
  getVectorStoreReady: () => boolean;
  setVectorStoreReady: (ready: boolean) => void;
  getInitialized: () => boolean;
}

/**
 * Dependencies for VectorStoreFacade.
 */
export interface VectorStoreFacadeDeps {
  vectorStore: VectorStoreService | null;
  docSync: DocumentSyncService | null;
  logger: LoggerService;
  context: VectorStoreFacadeContext;
}

/**
 * Facade for all vector-store-related operations.
 * Extracted from ResponsesApiCoordinator to separate concerns.
 */
export class VectorStoreFacade {
  private vectorStore: VectorStoreService | null;
  private docSync: DocumentSyncService | null;
  private readonly logger: LoggerService;
  private readonly ctx: VectorStoreFacadeContext;
  private initPromise: Promise<void> | null = null;

  constructor(deps: VectorStoreFacadeDeps) {
    this.vectorStore = deps.vectorStore;
    this.docSync = deps.docSync;
    this.logger = deps.logger;
    this.ctx = deps.context;
  }

  /**
   * Update the underlying vector store and doc sync references.
   * Called by the orchestrator after initialization.
   */
  setServices(
    vectorStore: VectorStoreService | null,
    docSync: DocumentSyncService | null,
  ): void {
    this.vectorStore = vectorStore;
    this.docSync = docSync;
  }

  /**
   * Lazily ensure the vector store exists on the Llama Stack server.
   * Called on first sync or RAG operation rather than at plugin startup
   * so that boot time is not affected by network calls.
   */
  private async ensureVectorStoreReady(): Promise<void> {
    if (this.ctx.getVectorStoreReady()) return;
    if (!this.vectorStore) {
      throw new Error('Vector store service not created');
    }

    // Single-flight guard: concurrent callers share one init attempt
    if (this.initPromise !== null) {
      await this.initPromise;
      return;
    }

    this.initPromise = this.doVectorStoreInit();
    try {
      await this.initPromise;
    } finally {
      this.initPromise = null;
    }
  }

  private async doVectorStoreInit(): Promise<void> {
    const vs = this.vectorStore;
    if (!vs) {
      throw new Error('Vector store service not created');
    }
    try {
      await vs.ensureExists();
      this.ctx.configResolution.setLlamaStackConfig(vs.getConfig());
      this.ctx.setVectorStoreReady(true);
      this.logger.info('Vector store initialized on first use');
    } catch (error) {
      throw new Error(
        `Vector store initialization failed: ${toErrorMessage(error)}`,
      );
    }
  }

  /**
   * List all documents in the vector store
   */
  async listDocuments(vectorStoreId?: string): Promise<DocumentInfo[]> {
    this.ctx.ensureInitialized();
    if (!this.vectorStore) {
      return [];
    }
    try {
      await this.ensureVectorStoreReady();
    } catch (error) {
      this.logger.warn(
        `Vector store init failed, cannot list documents: ${toErrorMessage(error)}`,
      );
      return [];
    }
    return this.vectorStore.listDocuments(vectorStoreId);
  }

  /**
   * List all available vector stores
   */
  async listVectorStores(): Promise<VectorStoreInfo[]> {
    this.ctx.ensureInitialized();
    if (!this.vectorStore) {
      return [];
    }
    return this.vectorStore.listVectorStores();
  }

  /**
   * Get the default vector store ID
   */
  getDefaultVectorStoreId(): string | undefined {
    return this.vectorStore?.getDefaultVectorStoreId();
  }

  async getActiveVectorStoreIds(): Promise<string[]> {
    const config = this.ctx.configResolution.getLlamaStackConfig();
    if (!config) return [];
    try {
      const resolved = await this.ctx.configResolution.resolve();
      return resolved.vectorStoreIds;
    } catch (error) {
      this.logger.debug(
        'Config resolution failed, using fallback vector store IDs',
        error as Error,
      );
      return config.vectorStoreIds ?? [];
    }
  }

  addVectorStoreId(id: string): void {
    const config = this.ctx.configResolution.getLlamaStackConfig();
    if (!config) return;
    if (!config.vectorStoreIds.includes(id)) {
      config.vectorStoreIds.push(id);
      if (this.vectorStore) {
        this.vectorStore.updateConfig(config);
      }
      this.ctx.configResolution.invalidateCache();
    }
  }

  removeVectorStoreId(id: string): void {
    const config = this.ctx.configResolution.getLlamaStackConfig();
    if (!config) return;
    config.vectorStoreIds = config.vectorStoreIds.filter(vsId => vsId !== id);
    if (this.vectorStore) {
      this.vectorStore.updateConfig(config);
    }
    this.ctx.configResolution.invalidateCache();
  }

  async syncDocuments(): Promise<SyncResult> {
    return querySyncDocs(this.vectorStore, this.docSync, this.ctx, () =>
      this.ensureVectorStoreReady(),
    );
  }

  async uploadDocument(
    fileName: string,
    content: Buffer,
    vectorStoreId?: string,
  ): Promise<{ fileId: string; fileName: string; status: string }> {
    if (!this.vectorStore)
      throw new Error('Vector store service not available');
    return queryUploadDoc(
      this.vectorStore,
      this.ctx,
      () => this.ensureVectorStoreReady(),
      fileName,
      content,
      vectorStoreId,
    );
  }

  /**
   * Delete a document from the vector store.
   */
  async deleteDocument(
    fileId: string,
    vectorStoreId?: string,
  ): Promise<{ success: boolean }> {
    this.ctx.ensureInitialized();
    if (!this.vectorStore) {
      throw new Error('Vector store service not available');
    }
    await this.ensureVectorStoreReady();
    return this.vectorStore.deleteDocument(fileId, vectorStoreId);
  }

  /**
   * Permanently delete a vector store and all its files from the server.
   */
  async deleteVectorStore(
    vectorStoreId: string,
  ): Promise<{ success: boolean; filesDeleted: number }> {
    this.ctx.ensureInitialized();
    if (!this.vectorStore) {
      throw new Error('Vector store service not available');
    }
    return this.vectorStore.deleteVectorStore(vectorStoreId);
  }

  async searchVectorStore(
    query: string,
    maxResults: number = 5,
    targetVectorStoreId?: string,
    targetVectorStoreIds?: string[],
  ): Promise<{
    query: string;
    chunks: Array<{
      text: string;
      score?: number;
      fileId?: string;
      fileName?: string;
      vectorStoreId?: string;
    }>;
    vectorStoreId: string;
    totalResults: number;
  }> {
    this.ctx.ensureInitialized();
    if (!this.vectorStore)
      throw new Error('Vector store service not available');
    return querySearch(
      this.vectorStore,
      query,
      maxResults,
      targetVectorStoreId,
      targetVectorStoreIds,
      this.logger,
    );
  }

  /**
   * Get the sync schedule configuration
   */
  getSyncSchedule(): string | undefined {
    return this.docSync?.getSyncSchedule();
  }

  /**
   * Return the vector-store-related subset of the effective config.
   */
  async getVectorStoreConfig(): Promise<{
    vectorStoreName: string;
    embeddingModel: string;
    embeddingDimension: number;
    searchMode?: 'semantic' | 'keyword' | 'hybrid';
    bm25Weight?: number;
    semanticWeight?: number;
    chunkingStrategy: 'auto' | 'static';
    maxChunkSizeTokens: number;
    chunkOverlapTokens: number;
    fileSearchMaxResults?: number;
    fileSearchScoreThreshold?: number;
  } | null> {
    return queryGetConfig(this.ctx, this.logger);
  }

  async createVectorStoreWithConfig(
    overrides: Record<string, unknown>,
  ): Promise<{
    vectorStoreId: string;
    vectorStoreName: string;
    created: boolean;
    embeddingModel: string;
    embeddingDimension?: number;
  }> {
    this.ctx.ensureInitialized();
    if (!this.vectorStore || !this.ctx.configResolution.getLlamaStackConfig())
      throw new Error('Vector store service not available');
    const existingIds = await this.getActiveVectorStoreIds();
    const config = this.ctx.configResolution.getLlamaStackConfig()!;
    const result = await this.vectorStore.createWithConfig(config, overrides);
    this.ctx.configResolution.setLlamaStackConfig(this.vectorStore.getConfig());
    this.ctx.setVectorStoreReady(false);
    await this.ensureVectorStoreReady();
    const newId = result.vectorStoreId;
    const mergedIds = [...new Set([...existingIds, newId])];
    const updatedConfig = this.ctx.configResolution.getLlamaStackConfig()!;
    updatedConfig.vectorStoreIds = mergedIds;
    this.vectorStore.updateConfig(updatedConfig);
    return {
      vectorStoreId: newId,
      vectorStoreName: result.vectorStoreName,
      created: result.created,
      embeddingModel: result.embeddingModel,
      embeddingDimension: result.embeddingDimension,
    };
  }

  /**
   * Return the runtime status of the vector store.
   */
  async getVectorStoreStatus(): Promise<{
    exists: boolean;
    vectorStoreId?: string;
    vectorStoreName?: string;
    documentCount?: number;
    embeddingModel?: string;
    ready: boolean;
  }> {
    return queryGetStatus(
      this.vectorStore,
      this.ctx,
      () => this.ensureVectorStoreReady(),
      this.logger,
    );
  }
}
