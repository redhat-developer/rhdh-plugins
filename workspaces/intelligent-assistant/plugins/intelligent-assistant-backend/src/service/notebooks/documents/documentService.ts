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
import { Config } from '@backstage/config';
import { ConflictError, NotFoundError } from '@backstage/errors';

import {
  DEFAULT_CHUNK_OVERLAP_TOKENS,
  DEFAULT_CHUNKING_STRATEGY_TYPE,
  DEFAULT_MAX_CHUNK_SIZE_TOKENS,
} from '../../constant';
import { SessionDocument, UpsertResult } from '../types/notebooksTypes';
import { VectorStoresOperator } from '../VectorStoresOperator';

/**
 * Service for managing documents within notebook sessions using File-Based API
 * Each session has its own dedicated vector store
 * Uses VectorStoresOperator to proxy through lightspeed-core
 */
export class DocumentService {
  private logger: LoggerService;
  private client: VectorStoresOperator;
  private chunkingStrategy: {
    type: string;
    static?: { max_chunk_size_tokens: number; chunk_overlap_tokens: number };
  };

  constructor(
    client: VectorStoresOperator,
    logger: LoggerService,
    config?: Config,
  ) {
    this.client = client;
    this.logger = logger;

    // Chunking strategy configuration
    const chunkingType =
      config?.getOptionalString(
        'intelligent-assistant.notebooks.chunkingStrategy.type',
      ) || DEFAULT_CHUNKING_STRATEGY_TYPE;

    if (chunkingType === 'static') {
      this.chunkingStrategy = {
        type: 'static',
        static: {
          max_chunk_size_tokens:
            config?.getOptionalNumber(
              'intelligent-assistant.notebooks.chunkingStrategy.maxChunkSizeTokens',
            ) || DEFAULT_MAX_CHUNK_SIZE_TOKENS,
          chunk_overlap_tokens:
            config?.getOptionalNumber(
              'intelligent-assistant.notebooks.chunkingStrategy.chunkOverlapTokens',
            ) || DEFAULT_CHUNK_OVERLAP_TOKENS,
        },
      };
    } else {
      this.chunkingStrategy = { type: 'auto' };
    }
  }

  /**
   * Find a file by title in vector store
   * @param sessionId - Vector store ID
   * @param documentTitle - Document title to search for
   * @returns File object if found, null otherwise
   */
  async findFileByTitle(
    sessionId: string,
    documentTitle: string,
  ): Promise<any | null> {
    const filesResponse = await this.client.vectorStores.files.list(sessionId);
    return (
      filesResponse.data.find(
        (f: any) => f.attributes?.title === documentTitle,
      ) || null
    );
  }

  /**
   * Upload markdown content to the Files API
   * @param content - Markdown content string
   * @param title - File title/name
   * @returns File ID from the Files API
   * @throws Error if upload fails
   */
  async uploadFile(content: string, title: string): Promise<string> {
    try {
      const mdFilename = `${title.replace(/\.[^.]+$/, '')}.md`;

      const file = await this.client.files.create({
        file: {
          name: mdFilename,
          buffer: Buffer.from(content, 'utf-8'),
          type: 'text/markdown',
        },
        purpose: 'assistants',
      });

      this.logger.info(
        `File created - id: ${file.id}, filename: ${file.filename}`,
      );
      return file.id;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to upload file: ${String(error)}`);
    }
  }

  /**
   * Upsert a document - create if it doesn't exist, update if it does.
   * Also used for rename-only operations when fileType/fileId are omitted.
   * @param sessionId - Vector store ID
   * @param title - Original document title
   * @param opts - Optional parameters for upload or rename
   * @param opts.fileType - Document source type (derived from existing file when omitted)
   * @param opts.fileId - File ID from Files API (derived from existing file when omitted)
   * @param opts.newTitle - New title for rename operation
   * @returns Upsert result with document ID and status
   * @throws NotFoundError if fileId is omitted and document does not exist
   * @throws ConflictError if newTitle conflicts with existing document
   */
  async upsertDocument(
    sessionId: string,
    title: string,
    opts?: {
      fileType?: string;
      fileId?: string;
      newTitle?: string;
    },
  ): Promise<UpsertResult> {
    const { fileType, fileId, newTitle } = opts || {};
    const existingFile = await this.findFileByTitle(sessionId, title);

    // Rename-only mode: no fileId means we must have an existing file
    let resolvedFileId: string;
    let resolvedFileType: string;
    if (fileId) {
      resolvedFileId = fileId;
      resolvedFileType = fileType || 'unknown';
    } else {
      if (!existingFile) {
        throw new NotFoundError(`Document not found: ${title}`);
      }
      resolvedFileId = existingFile.id;
      resolvedFileType =
        fileType ||
        (existingFile.attributes?.source_type as string) ||
        'unknown';
    }

    const createdAt =
      (existingFile?.attributes?.created_at as string) ||
      new Date().toISOString();

    if (newTitle && title !== newTitle) {
      const conflictingFile = await this.findFileByTitle(sessionId, newTitle);
      if (conflictingFile) {
        throw new ConflictError(
          `A resource with the title "${newTitle || title}" already exists in this session`,
        );
      }
    }

    if (existingFile) {
      await this.deleteDocument(sessionId, title);
    }

    // Preserve existing attributes, override with known fields
    const baseAttrs = existingFile?.attributes || {};
    const attributes = {
      ...baseAttrs,
      title: newTitle || title,
      source_type: resolvedFileType,
      created_at: createdAt,
      updated_at: new Date().toISOString(),
    };

    try {
      const vectorStoreFile = await this.client.vectorStores.files.create(
        sessionId,
        {
          file_id: resolvedFileId,
          chunking_strategy: this.chunkingStrategy,
          attributes,
        },
      );

      this.logger.info(
        `Document "${newTitle || title}" (ID: ${title}) upsert started with file ${resolvedFileId}`,
      );

      return {
        document_id: newTitle || title,
        file_id: resolvedFileId,
        replaced: !!existingFile,
        status: vectorStoreFile.status,
      };
    } catch (error) {
      // Rollback: restore original entry if delete succeeded but create failed
      if (existingFile) {
        this.logger.error(
          `Failed to re-create vector store entry after delete for "${title}". Attempting rollback.`,
        );
        try {
          await this.client.vectorStores.files.create(sessionId, {
            file_id: existingFile.id,
            chunking_strategy: this.chunkingStrategy,
            attributes: existingFile.attributes || {},
          });
          this.logger.info(
            `Rollback succeeded: restored "${title}" in session ${sessionId}`,
          );
        } catch (rollbackError) {
          this.logger.error(
            `Rollback failed: document "${title}" (file ${existingFile.id}) is orphaned in session ${sessionId}`,
          );
        }
      }
      throw error;
    }
  }

  /**
   * Get file processing status
   * @param sessionId - Vector store ID
   * @param documentTitle - Document title
   * @returns File status including processing state, chunk count, and error if any
   * @throws NotFoundError if document not found
   */
  async getFileStatus(
    sessionId: string,
    documentTitle: string,
  ): Promise<{
    status: 'in_progress' | 'completed' | 'failed' | 'cancelled';
    chunks_count: number;
    error?: string;
  }> {
    const file = await this.findFileByTitle(sessionId, documentTitle);

    if (!file) {
      throw new NotFoundError(`Resource not found: ${documentTitle}`);
    }
    return {
      status: file.status,
      chunks_count: file.chunks_count,
      error: file.last_error?.message,
    };
  }

  /**
   * List all documents in a session
   * @param sessionId - Vector store ID
   * @param fileTypeFilter - Optional filter by source type (text, pdf, url, etc.)
   * @returns Array of session documents
   */
  async listDocuments(
    sessionId: string,
    fileTypeFilter?: string,
  ): Promise<SessionDocument[]> {
    this.logger.info(`Listing documents for session ${sessionId}`);

    // List all files in vector store
    const filesResponse = await this.client.vectorStores.files.list(sessionId);

    if (!filesResponse.data || filesResponse.data.length === 0) {
      return [];
    }

    // Map files to SessionDocument format, sorted by original upload time
    const documents = filesResponse.data
      .filter((file: any) => {
        if (fileTypeFilter && file.attributes?.source_type !== fileTypeFilter) {
          return false;
        }
        return true;
      })
      .map((file: any) => {
        const attrs = file.attributes || {};
        return {
          document_id: attrs.title,
          source_type:
            (attrs.source_type as SessionDocument['source_type']) || 'text',
          created_at: attrs.created_at,
          updated_at: attrs.updated_at,
        };
      })
      .sort((a: SessionDocument, b: SessionDocument) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeA - timeB;
      });

    this.logger.info(
      `Found ${documents.length} documents in session ${sessionId}`,
    );
    return documents;
  }

  /**
   * Remove a document's vector store entry.
   * Note: the underlying file in the Files API is intentionally preserved
   * so it can be re-associated (e.g., during rename/upsert).
   * @param sessionId - Vector store ID
   * @param documentTitle - Document title to delete
   * @throws NotFoundError if document not found
   */
  async deleteDocument(
    sessionId: string,
    documentTitle: string,
  ): Promise<void> {
    this.logger.info(`Deleting document ${documentTitle} from ${sessionId}`);

    const file = await this.findFileByTitle(sessionId, documentTitle);

    if (!file) {
      throw new NotFoundError(`Resource not found: ${documentTitle}`);
    }

    // Delete from vector store first
    await this.client.vectorStores.files.delete(sessionId, file.id);

    this.logger.info(
      `Deleted document ${documentTitle} (file ${file.id}) from session ${sessionId}`,
    );
  }
}
