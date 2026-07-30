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
import { InputError } from '@backstage/errors';
import type { ResponsesApiClient } from '../client/ResponsesApiClient';
import { toErrorMessage } from '../../../services/utils';
import type {
  LlamaStackConfig,
  LlamaStackVectorStoreResponse,
  LlamaStackVectorStoreFileResponse,
  VectorStoreInfo,
} from '../../../types';

export interface MutationContext {
  client: ResponsesApiClient;
  config: LlamaStackConfig;
  logger: LoggerService;
}

export async function deleteDocument(
  ctx: MutationContext,
  fileId: string,
  vectorStoreId?: string,
): Promise<{ success: boolean }> {
  const targetId = vectorStoreId ?? ctx.config.vectorStoreIds[0];
  if (!targetId)
    throw new InputError('No vector store configured — cannot delete document');
  let deletedFromVectorStore = false;
  let deletedFromFiles = false;
  try {
    await ctx.client.request(`/v1/vector_stores/${targetId}/files/${fileId}`, {
      method: 'DELETE',
    });
    deletedFromVectorStore = true;
    ctx.logger.debug(`Deleted from vector store: ${fileId}`);
  } catch (error) {
    const errorMsg = toErrorMessage(error, '');
    if (!errorMsg.includes('400') && !errorMsg.includes('not found'))
      ctx.logger.warn(`Vector store delete failed for ${fileId}: ${errorMsg}`);
  }
  try {
    await ctx.client.request(`/v1/files/${fileId}`, { method: 'DELETE' });
    deletedFromFiles = true;
    ctx.logger.debug(`Deleted from files API: ${fileId}`);
  } catch (error) {
    const errorMsg = toErrorMessage(error, '');
    if (!errorMsg.includes('404') && !errorMsg.includes('not found'))
      ctx.logger.debug(`Files API delete failed for ${fileId}: ${errorMsg}`);
  }
  if (deletedFromVectorStore || deletedFromFiles) {
    ctx.logger.info(`Deleted document: ${fileId}`);
    return { success: true };
  }
  ctx.logger.warn(`Could not delete ${fileId} from either endpoint`);
  return { success: false };
}

export async function deleteVectorStore(
  ctx: MutationContext,
  vectorStoreId: string,
  fetchFiles: (vsId: string) => Promise<LlamaStackVectorStoreFileResponse[]>,
  deleteDoc: (fileId: string, vsId?: string) => Promise<{ success: boolean }>,
): Promise<{ success: boolean; filesDeleted: number }> {
  let filesDeleted = 0;
  try {
    const files = await fetchFiles(vectorStoreId);
    for (const file of files) {
      try {
        await deleteDoc(file.id, vectorStoreId);
        filesDeleted++;
      } catch (err) {
        ctx.logger.warn(
          `Failed to delete file ${file.id}: ${toErrorMessage(err, 'Unknown')}`,
        );
      }
    }
    ctx.logger.info(
      `Deleted ${filesDeleted}/${files.length} files from store ${vectorStoreId}`,
    );
  } catch (err) {
    ctx.logger.warn(
      `Could not list files for store ${vectorStoreId}: ${toErrorMessage(err, 'Unknown')}`,
    );
  }
  try {
    await ctx.client.request(`/v1/vector_stores/${vectorStoreId}`, {
      method: 'DELETE',
    });
    ctx.logger.info(`Permanently deleted vector store: ${vectorStoreId}`);
  } catch (error) {
    const msg = toErrorMessage(error);
    if (msg.includes('not found') || msg.includes('404')) {
      ctx.logger.info(
        `Vector store ${vectorStoreId} not found on server (already deleted)`,
      );
    } else {
      ctx.logger.error(
        `Failed to delete vector store ${vectorStoreId}: ${msg}`,
      );
      throw new Error(`Failed to delete vector store ${vectorStoreId}: ${msg}`);
    }
  }
  return { success: true, filesDeleted };
}

export async function updateVectorStore(
  ctx: MutationContext,
  vectorStoreId: string,
  updates: { name?: string; metadata?: Record<string, string> },
  mapStoreToInfo: (s: LlamaStackVectorStoreResponse) => VectorStoreInfo,
): Promise<VectorStoreInfo> {
  const body: Record<string, unknown> = {};
  if (updates.name !== undefined) body.name = updates.name;
  if (updates.metadata !== undefined) body.metadata = updates.metadata;
  const response = await ctx.client.request<LlamaStackVectorStoreResponse>(
    `/v1/vector_stores/${vectorStoreId}`,
    { method: 'POST', body },
  );
  return mapStoreToInfo(response);
}
