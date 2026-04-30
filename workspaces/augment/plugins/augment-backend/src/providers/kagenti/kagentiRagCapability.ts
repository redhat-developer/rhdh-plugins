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
  RootConfigService,
} from '@backstage/backend-plugin-api';
import type { SyncResult } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { RAGCapability } from '../types';
import { ResponsesApiClient } from '../responses-api/client/ResponsesApiClient';
import { VectorStoreService } from '../responses-api/documents/VectorStoreService';
import type { LlamaStackConfig } from '../../types';
import {
  DEFAULT_EMBEDDING_MODEL,
  DEFAULT_EMBEDDING_DIMENSION,
  DEFAULT_VECTOR_STORE_NAME,
  DEFAULT_CHUNK_SIZE,
  DEFAULT_CHUNK_OVERLAP,
} from '../../constants';

/**
 * Build a RAG capability for the Kagenti provider using the
 * augment.llamaStack config section for vector store operations.
 *
 * Returns undefined if llamaStack is not configured.
 */
export function buildKagentiRag(
  rootConfig: RootConfigService,
  logger: LoggerService,
): { rag: RAGCapability; vectorStoreService: VectorStoreService } | undefined {
  const ls = rootConfig.getOptionalConfig('augment.llamaStack');
  const baseUrl = ls?.getOptionalString('baseUrl');

  if (!baseUrl) {
    logger.info(
      'augment.llamaStack.baseUrl not configured; RAG/vector stores unavailable for Kagenti provider',
    );
    return undefined;
  }

  const skipTlsVerify = ls?.getOptionalBoolean('skipTlsVerify') ?? false;
  const token = ls?.getOptionalString('token');

  const client = new ResponsesApiClient(
    { baseUrl, token, skipTlsVerify },
    logger,
  );

  let vectorStoreIds: string[] = [];
  const idsArray = ls?.getOptionalStringArray('vectorStoreIds');
  if (idsArray && idsArray.length > 0) {
    vectorStoreIds = idsArray;
  } else {
    const singleId = ls?.getOptionalString('vectorStoreId');
    if (singleId) vectorStoreIds = [singleId];
  }

  const llamaStackConfig: LlamaStackConfig = {
    baseUrl,
    vectorStoreIds,
    vectorStoreName:
      ls?.getOptionalString('vectorStoreName') ?? DEFAULT_VECTOR_STORE_NAME,
    embeddingModel:
      ls?.getOptionalString('embeddingModel') ?? DEFAULT_EMBEDDING_MODEL,
    embeddingDimension:
      ls?.getOptionalNumber('embeddingDimension') ??
      DEFAULT_EMBEDDING_DIMENSION,
    model: ls?.getOptionalString('model') ?? '',
    token,
    skipTlsVerify,
    chunkingStrategy:
      (ls?.getOptionalString('chunkingStrategy') as 'auto' | 'static') ??
      'auto',
    maxChunkSizeTokens:
      ls?.getOptionalNumber('maxChunkSizeTokens') ?? DEFAULT_CHUNK_SIZE,
    chunkOverlapTokens:
      ls?.getOptionalNumber('chunkOverlapTokens') ?? DEFAULT_CHUNK_OVERLAP,
    searchMode:
      (ls?.getOptionalString('searchMode') as
        | 'semantic'
        | 'keyword'
        | 'hybrid') ?? 'semantic',
  };

  const vectorStore = new VectorStoreService(client, llamaStackConfig, logger);

  logger.info(
    `Kagenti RAG initialized: LlamaStack at ${baseUrl}, ${vectorStoreIds.length} configured store(s)`,
  );

  const rag: RAGCapability = {
    listDocuments: (vectorStoreId?: string) =>
      vectorStore.listDocuments(vectorStoreId),

    listVectorStores: () => vectorStore.listVectorStores(),

    getDefaultVectorStoreId: () => llamaStackConfig.vectorStoreIds[0],

    getActiveVectorStoreIds: () =>
      Promise.resolve([...llamaStackConfig.vectorStoreIds]),

    syncDocuments: (): Promise<SyncResult> =>
      Promise.resolve({
        added: 0,
        removed: 0,
        updated: 0,
        failed: 0,
        unchanged: 0,
        errors: [],
      }),

    uploadDocument: (
      fileName: string,
      content: Buffer,
      vectorStoreId?: string,
    ) =>
      vectorStore
        .uploadDocuments(
          [{ fileName, content: content.toString('utf-8') }],
          vectorStoreId,
        )
        .then(result => {
          const first = result.uploaded[0];
          if (!first) {
            const err = result.failed[0];
            throw new Error(err?.error ?? 'Upload failed');
          }
          return {
            fileId: first.id,
            fileName: first.fileName,
            status: first.status,
          };
        }),

    deleteDocument: (fileId: string, vectorStoreId?: string) =>
      vectorStore.deleteDocument(fileId, vectorStoreId),

    searchVectorStore: async (
      query: string,
      maxResults?: number,
      vectorStoreId?: string,
      storeIds?: string[],
    ) => {
      const ids =
        storeIds ??
        (vectorStoreId ? [vectorStoreId] : llamaStackConfig.vectorStoreIds);
      if (ids.length === 0) {
        return { query, chunks: [], vectorStoreId: '', totalResults: 0 };
      }
      const limit = maxResults ?? 10;
      const allChunks = (
        await Promise.all(
          ids.map(id =>
            vectorStore.searchSingle(id, query, limit).catch(() => []),
          ),
        )
      ).flat();
      allChunks.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
      const trimmed = allChunks.slice(0, limit);
      return {
        query,
        chunks: trimmed,
        vectorStoreId: ids[0],
        totalResults: trimmed.length,
      };
    },

    getVectorStoreConfig: () =>
      Promise.resolve({
        vectorStoreName: llamaStackConfig.vectorStoreName,
        embeddingModel: llamaStackConfig.embeddingModel,
        embeddingDimension:
          llamaStackConfig.embeddingDimension ?? DEFAULT_EMBEDDING_DIMENSION,
        searchMode: llamaStackConfig.searchMode,
        chunkingStrategy: llamaStackConfig.chunkingStrategy,
        maxChunkSizeTokens: llamaStackConfig.maxChunkSizeTokens,
        chunkOverlapTokens: llamaStackConfig.chunkOverlapTokens,
      }),

    createVectorStoreWithConfig: (overrides: Record<string, unknown>) =>
      vectorStore.createWithConfig(llamaStackConfig, overrides),

    getVectorStoreStatus: async () => {
      const storeId = llamaStackConfig.vectorStoreIds[0];
      if (!storeId) {
        return { exists: false, ready: false };
      }
      try {
        const stores = await vectorStore.listVectorStores();
        const found = stores.find(s => s.id === storeId);
        return {
          exists: !!found,
          vectorStoreId: storeId,
          vectorStoreName: found?.name,
          documentCount: found?.fileCount,
          ready: found?.status === 'completed',
        };
      } catch {
        return { exists: false, vectorStoreId: storeId, ready: false };
      }
    },

    addVectorStoreId: (id: string) => {
      if (!llamaStackConfig.vectorStoreIds.includes(id)) {
        llamaStackConfig.vectorStoreIds.push(id);
        vectorStore.updateConfig(llamaStackConfig);
      }
    },

    removeVectorStoreId: (id: string) => {
      const idx = llamaStackConfig.vectorStoreIds.indexOf(id);
      if (idx >= 0) {
        llamaStackConfig.vectorStoreIds.splice(idx, 1);
        vectorStore.updateConfig(llamaStackConfig);
      }
    },

    deleteVectorStore: (vectorStoreId: string) =>
      vectorStore.deleteVectorStore(vectorStoreId),

    updateVectorStore: (
      vectorStoreId: string,
      updates: { name?: string; metadata?: Record<string, string> },
    ) => vectorStore.updateVectorStore(vectorStoreId, updates),
  };

  return { rag, vectorStoreService: vectorStore };
}
