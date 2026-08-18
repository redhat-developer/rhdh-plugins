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
import type { ResponsesApiClient } from '../client/ResponsesApiClient';
import { toErrorMessage } from '../../../services/utils';
import type {
  LlamaStackConfig,
  LlamaStackVectorStoreResponse,
  VectorStoreInfo,
} from '../../../types';

export interface VsContext {
  client: ResponsesApiClient;
  config: LlamaStackConfig;
  logger: LoggerService;
}

export async function validateVectorStore(
  ctx: VsContext,
  vectorStoreId: string,
): Promise<boolean> {
  try {
    const response = await ctx.client.request<LlamaStackVectorStoreResponse>(
      `/v1/vector_stores/${vectorStoreId}`,
      { method: 'GET' },
    );
    ctx.logger.debug(
      `Vector store ${vectorStoreId} validated: status=${response.status}, files=${response.file_counts?.total || 0}`,
    );
    return true;
  } catch (error) {
    ctx.logger.debug(
      `Vector store ${vectorStoreId} validation failed: ${toErrorMessage(error)}`,
    );
    return false;
  }
}

export async function findVectorStoreByName(
  ctx: VsContext,
  vectorStoreName: string,
): Promise<LlamaStackVectorStoreResponse | undefined> {
  const listResponse = await ctx.client.request<
    { data?: LlamaStackVectorStoreResponse[] } | LlamaStackVectorStoreResponse[]
  >('/v1/vector_stores', { method: 'GET' });
  const existingStores = Array.isArray(listResponse)
    ? listResponse
    : listResponse.data || [];
  ctx.logger.debug(
    `Found ${existingStores.length} existing vector store(s) on server`,
  );
  return existingStores.find(
    (vs: LlamaStackVectorStoreResponse) => vs.name === vectorStoreName,
  );
}

export async function resolveFromExistingStores(
  ctx: VsContext,
  listVectorStores: () => Promise<VectorStoreInfo[]>,
): Promise<{ dimension: number | undefined; providerId: string | undefined }> {
  const configuredDim = ctx.config.embeddingDimension;
  const model = ctx.config.embeddingModel;
  if (!model) return { dimension: configuredDim, providerId: undefined };
  try {
    const stores = await listVectorStores();
    const sameModelStore = stores.find(
      s => s.embeddingModel === model && s.embeddingDimension,
    );
    if (sameModelStore) {
      const detectedDim = sameModelStore.embeddingDimension;
      if (detectedDim && configuredDim && configuredDim !== detectedDim)
        ctx.logger.info(
          `Correcting embeddingDimension from ${configuredDim} to ${detectedDim} (detected from existing store using "${model}")`,
        );
      return {
        dimension: detectedDim ?? configuredDim,
        providerId: sameModelStore.providerType,
      };
    }
    if (stores.length > 0 && stores[0].providerType)
      return { dimension: configuredDim, providerId: stores[0].providerType };
  } catch {
    ctx.logger.debug('Could not auto-detect settings from existing stores');
  }
  return { dimension: configuredDim, providerId: undefined };
}

export async function createVectorStoreOnServer(
  ctx: VsContext,
  vectorStoreName: string,
  listVectorStores: () => Promise<VectorStoreInfo[]>,
): Promise<LlamaStackVectorStoreResponse> {
  const createBody: Record<string, unknown> = { name: vectorStoreName };
  if (ctx.config.embeddingModel)
    createBody.embedding_model = ctx.config.embeddingModel;
  const { dimension, providerId } = await resolveFromExistingStores(
    ctx,
    listVectorStores,
  );
  if (dimension) createBody.embedding_dimension = dimension;
  if (providerId) createBody.provider_id = providerId;
  if (ctx.config.searchMode) createBody.search_mode = ctx.config.searchMode;
  if (ctx.config.bm25Weight !== undefined)
    createBody.bm25_weight = ctx.config.bm25Weight;
  if (ctx.config.semanticWeight !== undefined)
    createBody.semantic_weight = ctx.config.semanticWeight;
  logVectorStoreConfig(ctx, vectorStoreName);
  try {
    return await ctx.client.request<LlamaStackVectorStoreResponse>(
      '/v1/vector_stores',
      { method: 'POST', body: createBody },
    );
  } catch (error) {
    const message = toErrorMessage(error);
    ctx.logger.error(
      `Failed to create vector store "${vectorStoreName}": ${message}`,
    );
    throw new Error(
      `Failed to create vector store "${vectorStoreName}": ${message}`,
    );
  }
}

function logVectorStoreConfig(ctx: VsContext, vectorStoreName: string): void {
  const lines = [
    `  name: "${vectorStoreName}"`,
    `  embedding_model: ${ctx.config.embeddingModel || '(default)'}`,
    `  embedding_dimension: ${ctx.config.embeddingDimension || '(default)'}`,
  ];
  if (ctx.config.searchMode) {
    lines.push(`  search_mode: ${ctx.config.searchMode}`);
    if (ctx.config.searchMode === 'hybrid') {
      lines.push(
        `  bm25_weight: ${ctx.config.bm25Weight ?? 0.5}`,
        `  semantic_weight: ${ctx.config.semanticWeight ?? 0.5}`,
      );
    }
  }
  ctx.logger.info(`Vector store configuration:\n${lines.join('\n')}`);
}

export async function findOrCreateVectorStore(
  ctx: VsContext,
  vectorStoreName: string,
  listVectorStores: () => Promise<VectorStoreInfo[]>,
): Promise<string> {
  try {
    const existingStore = await findVectorStoreByName(ctx, vectorStoreName);
    if (existingStore) {
      ctx.logger.info(
        `✓ Found existing vector store: ${existingStore.id} ("${vectorStoreName}") with ${existingStore.file_counts?.total || 0} files`,
      );
      return existingStore.id;
    }
  } catch (error) {
    ctx.logger.warn(
      `Could not list vector stores: ${toErrorMessage(error)}. Will attempt to create new vector store.`,
    );
  }
  ctx.logger.info(`Creating new vector store: "${vectorStoreName}"`);
  const createdStore = await createVectorStoreOnServer(
    ctx,
    vectorStoreName,
    listVectorStores,
  );
  ctx.logger.info(
    `✓ Created new vector store: ${createdStore.id} ("${vectorStoreName}")`,
  );
  return createdStore.id;
}
