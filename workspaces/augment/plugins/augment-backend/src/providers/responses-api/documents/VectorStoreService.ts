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
import { LoggerService } from '@backstage/backend-plugin-api';
import { ResponsesApiClient } from '../client/ResponsesApiClient';
import type {
  LlamaStackConfig,
  LlamaStackVectorStoreResponse,
  VectorStoreInfo,
} from '../../../types';
import {
  uploadDocuments as uploadDocumentsImpl,
  type UploadFile,
  type UploadResult,
} from './DocumentUploader';
import {
  listDocuments as listDocumentsImpl,
  fetchAllVectorStoreFiles,
} from './DocumentLister';
import {
  validateVectorStore,
  findOrCreateVectorStore,
} from './vectorStoreLifecycle';
import {
  deleteDocument as doDeleteDocument,
  deleteVectorStore as doDeleteVectorStore,
  updateVectorStore as doUpdateVectorStore,
} from './vectorStoreMutations';

export type { UploadFile, UploadResult } from './DocumentUploader';

function applyVectorStoreOverrides(
  baseConfig: LlamaStackConfig,
  overrides: Record<string, unknown>,
): LlamaStackConfig {
  const cfg = { ...baseConfig } as LlamaStackConfig;
  if (typeof overrides.vectorStoreName === 'string')
    cfg.vectorStoreName = overrides.vectorStoreName;
  if (typeof overrides.embeddingModel === 'string')
    cfg.embeddingModel = overrides.embeddingModel;
  if (typeof overrides.embeddingDimension === 'number')
    cfg.embeddingDimension = overrides.embeddingDimension;
  if (
    overrides.searchMode === 'semantic' ||
    overrides.searchMode === 'keyword' ||
    overrides.searchMode === 'hybrid'
  )
    cfg.searchMode = overrides.searchMode;
  if (typeof overrides.bm25Weight === 'number')
    cfg.bm25Weight = overrides.bm25Weight;
  if (typeof overrides.semanticWeight === 'number')
    cfg.semanticWeight = overrides.semanticWeight;
  if (
    overrides.chunkingStrategy === 'auto' ||
    overrides.chunkingStrategy === 'static'
  )
    cfg.chunkingStrategy = overrides.chunkingStrategy;
  if (typeof overrides.maxChunkSizeTokens === 'number')
    cfg.maxChunkSizeTokens = overrides.maxChunkSizeTokens;
  if (typeof overrides.chunkOverlapTokens === 'number')
    cfg.chunkOverlapTokens = overrides.chunkOverlapTokens;
  if (typeof overrides.fileSearchMaxResults === 'number')
    cfg.fileSearchMaxResults = overrides.fileSearchMaxResults;
  if (typeof overrides.fileSearchScoreThreshold === 'number')
    cfg.fileSearchScoreThreshold = overrides.fileSearchScoreThreshold;
  return cfg;
}

export class DuplicateVectorStoreError extends Error {
  constructor(name: string, existingId: string) {
    super(
      `A vector store named "${name}" already exists (ID: ${existingId}). Use a different name or connect the existing store.`,
    );
    this.name = 'DuplicateVectorStoreError';
  }
}

export class VectorStoreService {
  private readonly client: ResponsesApiClient;
  private readonly logger: LoggerService;
  private config: LlamaStackConfig;

  constructor(
    client: ResponsesApiClient,
    config: LlamaStackConfig,
    logger: LoggerService,
  ) {
    this.client = client;
    this.config = config;
    this.logger = logger;
  }

  getConfig(): LlamaStackConfig {
    return this.config;
  }
  updateConfig(config: LlamaStackConfig): void {
    this.config = config;
  }
  getDefaultVectorStoreId(): string | undefined {
    return this.config.vectorStoreIds[0];
  }

  private get ctx() {
    return { client: this.client, config: this.config, logger: this.logger };
  }

  async ensureExists(): Promise<void> {
    const vectorStoreName = this.config.vectorStoreName;
    if (!vectorStoreName)
      throw new Error(
        'CONFIGURATION ERROR: augment.llamaStack.vectorStoreName is required.',
      );
    this.logger.info(
      `Initializing RAG with vector store: "${vectorStoreName}"`,
    );
    if (this.config.vectorStoreIds.length > 0) {
      const configuredId = this.config.vectorStoreIds[0];
      const validated = await validateVectorStore(this.ctx, configuredId);
      if (validated) {
        this.logger.info(`✓ Using configured vector store: ${configuredId}`);
        return;
      }
      this.logger.warn(
        `Configured vectorStoreId "${configuredId}" not found on server. Will find or create by name.`,
      );
    }
    const id = await findOrCreateVectorStore(this.ctx, vectorStoreName, () =>
      this.listVectorStores(),
    );
    this.config.vectorStoreIds = [id];
  }

  async uploadDocuments(
    files: UploadFile[],
    vectorStoreId?: string,
  ): Promise<UploadResult> {
    return uploadDocumentsImpl(files, this.ctx, vectorStoreId);
  }

  async listDocuments(vectorStoreId?: string) {
    return listDocumentsImpl(this.ctx, vectorStoreId);
  }

  async searchSingle(
    storeId: string,
    query: string,
    maxResults: number,
  ): Promise<
    Array<{
      text: string;
      score?: number;
      fileId?: string;
      fileName?: string;
      vectorStoreId?: string;
    }>
  > {
    const response = await this.client.request<{
      data?: Array<{
        content?: Array<{ text?: string; type?: string }>;
        score?: number;
        file_id?: string;
        filename?: string;
      }>;
    }>(`/v1/vector_stores/${storeId}/search`, {
      method: 'POST',
      body: { query, max_num_results: maxResults },
    });
    return (response.data ?? []).map(item => ({
      text: item.content?.map(c => c.text ?? '').join('') ?? '',
      score: item.score,
      fileId: item.file_id,
      fileName: item.filename,
      vectorStoreId: storeId,
    }));
  }

  async createWithConfig(
    baseConfig: LlamaStackConfig,
    overrides: Record<string, unknown>,
  ): Promise<{
    vectorStoreId: string;
    vectorStoreName: string;
    created: boolean;
    embeddingModel: string;
    embeddingDimension?: number;
  }> {
    const cfg = applyVectorStoreOverrides(baseConfig, overrides);
    try {
      const serverStores = await this.listVectorStores();
      const duplicate = serverStores.find(s => s.name === cfg.vectorStoreName);
      if (duplicate)
        throw new DuplicateVectorStoreError(cfg.vectorStoreName, duplicate.id);
    } catch (error) {
      if (error instanceof DuplicateVectorStoreError) throw error;
      this.logger.warn(
        `Could not check for duplicate vector stores. Proceeding with creation.`,
      );
    }
    cfg.vectorStoreIds = [];
    this.updateConfig(cfg);
    await this.ensureExists();
    const updatedCfg = this.getConfig();
    const newId = updatedCfg.vectorStoreIds[0];
    if (!newId)
      throw new Error(
        `Vector store "${cfg.vectorStoreName}" was created but no ID was returned.`,
      );
    return {
      vectorStoreId: newId,
      vectorStoreName: cfg.vectorStoreName,
      created: true,
      embeddingModel: cfg.embeddingModel,
      embeddingDimension: cfg.embeddingDimension,
    };
  }

  private mapStoreToInfo(
    store: LlamaStackVectorStoreResponse,
  ): VectorStoreInfo {
    return {
      id: store.id,
      name: store.name || store.id,
      status: store.status || 'unknown',
      fileCount: store.file_counts?.total || 0,
      createdAt: store.created_at ?? 0,
      embeddingModel: store.metadata?.embedding_model,
      embeddingDimension: (() => {
        if (!store.metadata?.embedding_dimension) return undefined;
        const p = parseInt(store.metadata.embedding_dimension, 10);
        return Number.isFinite(p) ? p : undefined;
      })(),
      providerType: store.metadata?.provider_id,
      usageBytes: store.usage_bytes,
      lastActiveAt: store.last_active_at,
      fileCounts: store.file_counts
        ? {
            completed: store.file_counts.completed,
            inProgress: store.file_counts.in_progress,
            failed: store.file_counts.failed,
            cancelled: store.file_counts.cancelled,
            total: store.file_counts.total,
          }
        : undefined,
    };
  }

  async listVectorStores(): Promise<VectorStoreInfo[]> {
    const PAGE_LIMIT = 100;
    const MAX_PAGES = 20;
    const allStores: LlamaStackVectorStoreResponse[] = [];
    let after: string | undefined;
    for (let page = 0; page < MAX_PAGES; page++) {
      const qs = new URLSearchParams();
      qs.set('limit', String(PAGE_LIMIT));
      qs.set('order', 'desc');
      if (after) qs.set('after', after);
      const response = await this.client.request<
        | {
            data?: LlamaStackVectorStoreResponse[];
            has_more?: boolean;
            last_id?: string;
          }
        | LlamaStackVectorStoreResponse[]
      >(`/v1/vector_stores?${qs.toString()}`, { method: 'GET' });
      let pageStores: LlamaStackVectorStoreResponse[];
      let hasMore = false;
      let lastId: string | undefined;
      if (Array.isArray(response)) {
        pageStores = response;
      } else {
        pageStores = response.data || [];
        hasMore = response.has_more ?? false;
        lastId = response.last_id ?? undefined;
      }
      allStores.push(...pageStores);
      if (!hasMore || pageStores.length === 0) break;
      after = lastId ?? pageStores[pageStores.length - 1]?.id;
      if (!after) break;
    }
    this.logger.info(`Found ${allStores.length} vector stores`);
    return allStores.map(store => this.mapStoreToInfo(store));
  }

  async deleteDocument(
    fileId: string,
    vectorStoreId?: string,
  ): Promise<{ success: boolean }> {
    return doDeleteDocument(this.ctx, fileId, vectorStoreId);
  }

  async deleteVectorStore(
    vectorStoreId: string,
  ): Promise<{ success: boolean; filesDeleted: number }> {
    return doDeleteVectorStore(
      this.ctx,
      vectorStoreId,
      vsId => fetchAllVectorStoreFiles(this.ctx, vsId),
      (fId, vsId) => this.deleteDocument(fId, vsId),
    );
  }

  async updateVectorStore(
    vectorStoreId: string,
    updates: { name?: string; metadata?: Record<string, string> },
  ): Promise<VectorStoreInfo> {
    return doUpdateVectorStore(this.ctx, vectorStoreId, updates, s =>
      this.mapStoreToInfo(s),
    );
  }
}
