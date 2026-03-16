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
import FormDataNode from 'form-data';
import type { ResponsesApiClient } from '../client/ResponsesApiClient';
import type {
  LlamaStackConfig,
  LlamaStackFileResponse,
  LlamaStackVectorStoreFileResponse,
  FileAttributes,
} from '../../../types';
import { toErrorMessage } from '../../../services/utils';

/** Batch size for concurrent uploads to avoid overwhelming the API */
const UPLOAD_BATCH_SIZE = 5;

/** How long to wait between polls when checking file attach status */
const POLL_INTERVAL_MS = 3_000;
/** Maximum number of polls before giving up */
const MAX_POLL_ATTEMPTS = 40; // ~2 minutes

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isTimeoutOrHangup(error: unknown): boolean {
  const msg = toErrorMessage(error);
  return msg.includes('socket hang up') || msg.includes('timed out');
}

async function deleteOrphanedFile(
  client: ResponsesApiClient,
  fileId: string,
  fileName: string,
  logger: LoggerService,
): Promise<void> {
  try {
    await client.request(`/v1/files/${fileId}`, { method: 'DELETE' });
    logger.info(`Cleaned up orphaned file ${fileId} (${fileName})`);
  } catch (cleanupErr) {
    logger.warn(
      `Failed to clean up orphaned file ${fileId} (${fileName}): ${toErrorMessage(
        cleanupErr,
      )}`,
    );
  }
}

export interface DocumentUploaderDeps {
  client: ResponsesApiClient;
  config: LlamaStackConfig;
  logger: LoggerService;
}

/**
 * File to upload to the vector store.
 */
export interface UploadFile {
  fileName: string;
  content: string;
  attributes?: FileAttributes;
}

/**
 * Result of an upload operation.
 */
export interface UploadResult {
  uploaded: Array<{ id: string; fileName: string; status: string }>;
  failed: Array<{ fileName?: string; error: string }>;
}

/**
 * Poll the vector store file endpoint until the file reaches a terminal
 * state (completed/failed/cancelled) or we exceed MAX_POLL_ATTEMPTS.
 */
async function pollFileStatus(
  client: ResponsesApiClient,
  vectorStoreId: string,
  fileId: string,
  logger: LoggerService,
): Promise<LlamaStackVectorStoreFileResponse | null> {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    await sleep(POLL_INTERVAL_MS);
    try {
      const files = await client.request<{
        data?: LlamaStackVectorStoreFileResponse[];
      }>(`/v1/vector_stores/${vectorStoreId}/files`, { method: 'GET' });

      const list = Array.isArray(files) ? files : (files.data ?? []);
      const match = list.find(
        (f: LlamaStackVectorStoreFileResponse) => f.id === fileId,
      );

      if (!match) {
        logger.debug(`[upload] Poll ${i + 1}: file ${fileId} not in store yet`);
        continue;
      }

      if (
        match.status === 'completed' ||
        match.status === 'failed' ||
        match.status === 'cancelled'
      ) {
        logger.info(
          `[upload] Poll ${i + 1}: file ${fileId} status=${match.status}`,
        );
        return match;
      }

      logger.debug(
        `[upload] Poll ${i + 1}: file ${fileId} status=${match.status}`,
      );
    } catch (pollErr) {
      logger.debug(`[upload] Poll ${i + 1} error: ${toErrorMessage(pollErr)}`);
    }
  }
  return null;
}

/**
 * Upload a single file to the Files API and attach it to the vector store.
 *
 * The attach step (POST /v1/vector_stores/{id}/files) can be slow because
 * LlamaStack processes embeddings synchronously. If a reverse proxy
 * (e.g. OpenShift route) times out before the operation completes, we
 * fall back to polling the file list to check whether the file was
 * actually ingested.
 */
async function uploadSingleFile(
  file: UploadFile,
  deps: DocumentUploaderDeps,
  vectorStoreId: string,
): Promise<
  | { id: string; fileName: string; status: string }
  | { fileName: string; error: string }
> {
  const { client, config, logger } = deps;

  try {
    const form = new FormDataNode();
    form.append('file', Buffer.from(file.content, 'utf-8'), file.fileName);
    form.append('purpose', 'assistants');

    logger.info(
      `[upload] POST /v1/files (${file.content.length} bytes, ${file.fileName})`,
    );
    const uploadResponse = await client.request<LlamaStackFileResponse>(
      '/v1/files',
      { method: 'POST', body: form },
    );
    logger.info(`[upload] File created: ${uploadResponse.id}`);

    const chunkingStrategy =
      config.chunkingStrategy === 'auto'
        ? { type: 'auto' as const }
        : {
            type: 'static' as const,
            static: {
              max_chunk_size_tokens: config.maxChunkSizeTokens ?? 512,
              chunk_overlap_tokens: config.chunkOverlapTokens ?? 50,
            },
          };

    const attachBody: Record<string, unknown> = {
      file_id: uploadResponse.id,
      chunking_strategy: chunkingStrategy,
    };
    if (file.attributes && Object.keys(file.attributes).length > 0) {
      attachBody.attributes = file.attributes;
    }

    let attachResponse: LlamaStackVectorStoreFileResponse | null = null;

    try {
      attachResponse = await client.request<LlamaStackVectorStoreFileResponse>(
        `/v1/vector_stores/${vectorStoreId}/files`,
        { method: 'POST', body: attachBody },
      );
    } catch (attachError) {
      if (isTimeoutOrHangup(attachError)) {
        logger.info(
          `[upload] Attach request timed out for ${file.fileName} — polling for completion`,
        );
        attachResponse = await pollFileStatus(
          client,
          vectorStoreId,
          uploadResponse.id,
          logger,
        );
        if (!attachResponse) {
          return {
            fileName: file.fileName,
            error:
              'File ingestion timed out. The file may still be processing on the server. ' +
              'Check the OpenShift route timeout (annotation haproxy.router.openshift.io/timeout).',
          };
        }
      } else {
        await deleteOrphanedFile(
          client,
          uploadResponse.id,
          file.fileName,
          logger,
        );
        throw attachError;
      }
    }

    if (attachResponse.status === 'failed') {
      const errMsg = attachResponse.last_error?.message ?? 'Attachment failed';
      logger.warn(`File attachment failed for ${file.fileName}: ${errMsg}`);
      await deleteOrphanedFile(
        client,
        uploadResponse.id,
        file.fileName,
        logger,
      );
      return { fileName: file.fileName, error: errMsg };
    }

    return {
      id: uploadResponse.id,
      fileName: file.fileName,
      status: attachResponse.status,
    };
  } catch (error) {
    const msg = toErrorMessage(error);
    logger.warn(`Upload failed for ${file.fileName}: ${msg}`);
    return { fileName: file.fileName, error: msg };
  }
}

/**
 * Upload documents to the vector store in batches.
 * Each file is uploaded to the Files API, then attached to the vector store.
 *
 * @param files - Files to upload
 * @param deps - Client, config, and logger
 * @param vectorStoreId - Optional vector store ID (defaults to config.vectorStoreIds[0])
 */
export async function uploadDocuments(
  files: UploadFile[],
  deps: DocumentUploaderDeps,
  vectorStoreId?: string,
): Promise<UploadResult> {
  const { config, logger } = deps;
  const targetId = vectorStoreId ?? config.vectorStoreIds[0];

  if (!targetId) {
    throw new InputError(
      'No vector store configured — cannot upload documents',
    );
  }

  const uploaded: UploadResult['uploaded'] = [];
  const failed: UploadResult['failed'] = [];

  for (let i = 0; i < files.length; i += UPLOAD_BATCH_SIZE) {
    const batch = files.slice(i, i + UPLOAD_BATCH_SIZE);
    const results = await Promise.all(
      batch.map(file => uploadSingleFile(file, deps, targetId)),
    );

    for (const result of results) {
      if ('id' in result) {
        uploaded.push(result);
      } else {
        failed.push(result);
      }
    }
  }

  logger.info(`Uploaded ${uploaded.length} documents, ${failed.length} failed`);

  return { uploaded, failed };
}
