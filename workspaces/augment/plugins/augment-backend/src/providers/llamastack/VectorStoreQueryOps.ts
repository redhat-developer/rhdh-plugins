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
import type { EffectiveConfig } from '../../types';
import type { VectorStoreService } from './VectorStoreService';
import type { DocumentSyncService, SyncResult } from './DocumentSyncService';
import type { ConfigResolutionService } from './ConfigResolutionService';
import { toErrorMessage } from '../../services/utils';

export interface VectorStoreQueryContext {
  getInitialized: () => boolean;
  getVectorStoreReady: () => boolean;
  configResolution: ConfigResolutionService;
}

export async function getVectorStoreConfig(
  ctx: VectorStoreQueryContext,
  logger: LoggerService,
): Promise<{
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
  if (!ctx.getInitialized() || !ctx.configResolution.getLlamaStackConfig()) {
    return null;
  }
  let cfg: EffectiveConfig;
  try {
    cfg = await ctx.configResolution.resolve();
  } catch (error) {
    logger.debug(
      'Config resolution failed, using fallback vector store IDs',
      error as Error,
    );
    cfg = ctx.configResolution.buildYamlFallback();
  }
  return {
    vectorStoreName: cfg.vectorStoreName,
    embeddingModel: cfg.embeddingModel,
    embeddingDimension: cfg.embeddingDimension,
    searchMode: cfg.searchMode,
    bm25Weight: cfg.bm25Weight,
    semanticWeight: cfg.semanticWeight,
    chunkingStrategy: cfg.chunkingStrategy,
    maxChunkSizeTokens: cfg.maxChunkSizeTokens,
    chunkOverlapTokens: cfg.chunkOverlapTokens,
    fileSearchMaxResults: cfg.fileSearchMaxResults,
    fileSearchScoreThreshold: cfg.fileSearchScoreThreshold,
  };
}

export async function getVectorStoreStatus(
  vectorStore: VectorStoreService | null,
  ctx: VectorStoreQueryContext,
  ensureVectorStoreReady: () => Promise<void>,
  logger: LoggerService,
): Promise<{
  exists: boolean;
  vectorStoreId?: string;
  vectorStoreName?: string;
  documentCount?: number;
  embeddingModel?: string;
  ready: boolean;
}> {
  if (
    !ctx.getInitialized() ||
    !vectorStore ||
    !ctx.configResolution.getLlamaStackConfig()
  ) {
    return { exists: false, ready: false };
  }

  let resolved: EffectiveConfig;
  try {
    resolved = await ctx.configResolution.resolve();
  } catch (error) {
    logger.debug(
      'Config resolution failed, using fallback vector store IDs',
      error as Error,
    );
    resolved = ctx.configResolution.buildYamlFallback();
  }

  if (!ctx.getVectorStoreReady()) {
    try {
      await ensureVectorStoreReady();
    } catch (error) {
      logger.debug(
        'Vector store readiness check failed, using existing store',
        error as Error,
      );
      return {
        exists: false,
        ready: false,
        vectorStoreName: resolved.vectorStoreName,
        embeddingModel: resolved.embeddingModel,
      };
    }
  }

  try {
    const docs = await vectorStore.listDocuments();
    const vsId = vectorStore.getDefaultVectorStoreId();
    return {
      exists: true,
      ready: true,
      vectorStoreId: vsId,
      vectorStoreName: resolved.vectorStoreName,
      documentCount: docs.length,
      embeddingModel: resolved.embeddingModel,
    };
  } catch (error) {
    logger.warn(
      `Failed to get vector store status: ${toErrorMessage(error, 'Unknown')}`,
    );
    return {
      exists: true,
      ready: true,
      vectorStoreId: vectorStore.getDefaultVectorStoreId(),
      vectorStoreName: resolved.vectorStoreName,
      embeddingModel: resolved.embeddingModel,
    };
  }
}

export async function searchVectorStore(
  vectorStore: VectorStoreService,
  query: string,
  maxResults: number,
  targetVectorStoreId: string | undefined,
  targetVectorStoreIds: string[] | undefined,
  logger: LoggerService,
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
  const ids: string[] =
    targetVectorStoreIds && targetVectorStoreIds.length > 0
      ? targetVectorStoreIds
      : [
          targetVectorStoreId ?? vectorStore.getDefaultVectorStoreId() ?? '',
        ].filter(Boolean);

  if (ids.length === 0) {
    throw new Error('No vector store available to search');
  }

  logger.info(
    `searchVectorStore: query="${query.substring(0, 80)}${query.length > 80 ? '...' : ''}", storeIds=[${ids.join(',')}], maxResults=${maxResults}`,
  );

  const perStore = await Promise.all(
    ids.map(storeId => vectorStore.searchSingle(storeId, query, maxResults)),
  );
  const allChunks = perStore
    .flat()
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  logger.info(
    `searchVectorStore: ${allChunks.length} results across ${ids.length} store(s), topScore=${allChunks[0]?.score ?? 'N/A'}`,
  );

  return {
    query,
    chunks: allChunks,
    vectorStoreId: ids.join(','),
    totalResults: allChunks.length,
  };
}

export async function syncDocuments(
  vectorStore: VectorStoreService | null,
  docSync: DocumentSyncService | null,
  ctx: VectorStoreQueryContextFull,
  ensureVectorStoreReady: () => Promise<void>,
): Promise<SyncResult> {
  ctx.ensureInitialized();
  if (!docSync) {
    return {
      added: 0,
      removed: 0,
      failed: 0,
      unchanged: 0,
      updated: 0,
      errors: [],
    };
  }

  await ensureVectorStoreReady();

  const config = ctx.configResolution.getLlamaStackConfig();
  if (config && vectorStore) {
    const cfg = await ctx.configResolution.resolve();
    vectorStore.updateConfig({
      ...config,
      chunkingStrategy: cfg.chunkingStrategy ?? config.chunkingStrategy,
      maxChunkSizeTokens: cfg.maxChunkSizeTokens ?? config.maxChunkSizeTokens,
      chunkOverlapTokens: cfg.chunkOverlapTokens ?? config.chunkOverlapTokens,
    });
  }

  return docSync.sync();
}

export async function uploadDocument(
  vectorStore: VectorStoreService,
  ctx: VectorStoreQueryContextFull,
  ensureVectorStoreReady: () => Promise<void>,
  fileName: string,
  content: Buffer,
  vectorStoreId?: string,
): Promise<{ fileId: string; fileName: string; status: string }> {
  ctx.ensureInitialized();
  await ensureVectorStoreReady();

  const config = ctx.configResolution.getLlamaStackConfig();
  if (config) {
    const cfg = await ctx.configResolution.resolve();
    vectorStore.updateConfig({
      ...config,
      chunkingStrategy: cfg.chunkingStrategy ?? config.chunkingStrategy,
      maxChunkSizeTokens: cfg.maxChunkSizeTokens ?? config.maxChunkSizeTokens,
      chunkOverlapTokens: cfg.chunkOverlapTokens ?? config.chunkOverlapTokens,
    });
  }

  const result = await vectorStore.uploadDocuments(
    [{ fileName, content: content.toString('utf-8') }],
    vectorStoreId,
  );

  if (result.failed.length > 0) {
    throw new Error(`Upload failed for ${fileName}: ${result.failed[0].error}`);
  }
  if (result.uploaded.length === 0) {
    throw new Error(`Upload produced no result for ${fileName}`);
  }

  const doc = result.uploaded[0];
  return { fileId: doc.id, fileName: doc.fileName, status: doc.status };
}

export interface VectorStoreQueryContextFull extends VectorStoreQueryContext {
  configResolution: ConfigResolutionService;
  ensureInitialized: () => void;
}
