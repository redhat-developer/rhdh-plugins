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

import { LlamaStackClient, toFile } from 'llama-stack-client';

import {
  DEFAULT_CHUNK_OVERLAP_TOKENS,
  DEFAULT_CHUNKING_STRATEGY_TYPE,
  DEFAULT_FILE_PROCESSING_TIMEOUT_MS,
  DEFAULT_MAX_CHUNK_SIZE_TOKENS,
} from '../../constant';
import { NotebookSession, SessionDocument } from '../types/notebooksTypes';
import { buildVectorStoreMetadata, extractSessionFromMetadata } from '../utils';
import { sanitizeTitle } from './documentHelpers';

interface UpsertResult {
  document_id: string;
  file_id: string;
  replaced: boolean;
  status: 'completed' | 'in_progress' | 'failed' | 'cancelled';
}

/**
 * Service for managing documents within notebook sessions using File-Based API
 * Each session has its own dedicated vector store
 * Uses Llama Stack File API for automatic chunking, embedding, and indexing
 */
export class DocumentService {
  private logger: LoggerService;
  private client: LlamaStackClient;
  private fileProcessingTimeoutMs: number;
  private chunkingStrategy: any;

  constructor(llamaStackUrl: string, logger: LoggerService, config?: Config) {
    this.client = new LlamaStackClient({ baseURL: llamaStackUrl });
    this.logger = logger;

    // File processing timeout
    this.fileProcessingTimeoutMs =
      config?.getOptionalNumber(
        'lightspeed.aiNotebooks.fileProcessingTimeoutMs',
      ) || DEFAULT_FILE_PROCESSING_TIMEOUT_MS;

    // Chunking strategy configuration
    const chunkingType =
      config?.getOptionalString(
        'lightspeed.aiNotebooks.chunkingStrategy.type',
      ) || DEFAULT_CHUNKING_STRATEGY_TYPE;

    if (chunkingType === 'static') {
      this.chunkingStrategy = {
        type: 'static',
        static: {
          max_chunk_size_tokens:
            config?.getOptionalNumber(
              'lightspeed.aiNotebooks.chunkingStrategy.maxChunkSizeTokens',
            ) || DEFAULT_MAX_CHUNK_SIZE_TOKENS,
          chunk_overlap_tokens:
            config?.getOptionalNumber(
              'lightspeed.aiNotebooks.chunkingStrategy.chunkOverlapTokens',
            ) || DEFAULT_CHUNK_OVERLAP_TOKENS,
        },
      };
    } else {
      this.chunkingStrategy = { type: 'auto' };
    }
  }

  /**
   * Retrieve session metadata from vector store metadata field
   */
  private async retrieveSessionMetadata(
    sessionId: string,
  ): Promise<NotebookSession | null> {
    try {
      const vectorStore = await this.client.vectorStores.retrieve(sessionId);

      if (!vectorStore.metadata) {
        return null;
      }

      return extractSessionFromMetadata(
        sessionId,
        vectorStore.metadata as Record<string, any>,
      );
    } catch (error) {
      throw new Error(`Failed to retrieve session metadata: ${error}`);
    }
  }

  /**
   * Store session metadata in vector store metadata field
   */
  private async storeSessionMetadata(session: NotebookSession): Promise<void> {
    await this.client.vectorStores.update(session.session_id, {
      metadata: buildVectorStoreMetadata(session),
    });
  }

  /**
   * Find a file by document_id in vector store
   */
  private async findFileByDocumentId(
    sessionId: string,
    documentId: string,
  ): Promise<any | null> {
    const filesResponse = await this.client.vectorStores.files.list(sessionId);
    return (
      filesResponse.data.find(f => f.attributes?.document_id === documentId) ||
      null
    );
  }

  /**
   * Update session metadata document IDs
   */
  private async updateSessionDocumentIds(
    sessionId: string,
    documentId: string,
    operation: 'add' | 'replace' | 'remove',
    oldDocumentId?: string,
  ): Promise<void> {
    const session = await this.retrieveSessionMetadata(sessionId);
    if (!session) {
      return;
    }

    // For remove operation, only proceed if document_ids exists
    if (operation === 'remove' && !session.metadata?.document_ids) {
      return;
    }

    const documentIds = session.metadata?.document_ids || [];

    if (
      operation === 'replace' &&
      oldDocumentId &&
      oldDocumentId !== documentId
    ) {
      const index = documentIds.indexOf(oldDocumentId);
      if (index !== -1) {
        documentIds[index] = documentId;
      }
    } else if (operation === 'add' && !documentIds.includes(documentId)) {
      documentIds.push(documentId);
    } else if (operation === 'remove') {
      const filteredIds = documentIds.filter(id => id !== documentId);
      session.metadata = {
        ...session.metadata,
        document_ids: filteredIds,
      };
      session.updated_at = new Date().toISOString();
      await this.storeSessionMetadata(session);
      return;
    }

    session.metadata = {
      ...session.metadata,
      document_ids: documentIds,
    };
    session.updated_at = new Date().toISOString();
    await this.storeSessionMetadata(session);
  }

  /**
   * Wait for file processing to complete
   */
  private async waitForFileProcessing(
    sessionId: string,
    fileId: string,
  ): Promise<void> {
    const startTime = Date.now();
    const pollIntervalMs = 1000;

    while (Date.now() - startTime < this.fileProcessingTimeoutMs) {
      const file = await this.client.vectorStores.files.retrieve(
        sessionId,
        fileId,
      );

      if (file.status === 'completed') {
        this.logger.info(`File ${fileId} processing completed`);
        return;
      }

      if (file.status === 'failed') {
        this.logger.error(
          `File ${fileId} processing failed: ${file.last_error?.message}`,
        );
        throw new Error(`File processing failed: ${file.last_error}`);
      }

      if (file.status === 'cancelled') {
        this.logger.error(
          `File ${fileId} processing was cancelled: ${file.last_error?.message}`,
        );
        throw new Error('File processing was cancelled');
      }
      console.log('File still processing, waiting...', file.status);
      // Still in_progress, wait and retry
      this.logger.debug(`File ${fileId} still processing, waiting...`);
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error(
      `File processing timeout after ${this.fileProcessingTimeoutMs}ms`,
    );
  }

  /**
   * Upsert a document - create if it doesn't exist, update if it does
   * Efficient single method for both create and update operations
   */
  async upsertDocument(
    sessionId: string,
    title: string,
    content: string,
    metadata?: Record<string, any>,
    newTitle?: string,
  ): Promise<UpsertResult> {
    const documentId = sanitizeTitle(title);
    const newDocumentId: string = sanitizeTitle(newTitle || title);

    // Find existing file by document_id
    const existingFile = await this.findFileByDocumentId(sessionId, documentId);

    // If document doesn't exist, create it
    if (!existingFile) {
      this.logger.info(`Creating new document: "${newTitle || title}"`);

      const file = await this.client.files.create({
        file: await toFile(
          Buffer.from(content, 'utf-8'),
          `${newDocumentId}.txt`,
          {
            type: 'text/plain',
          },
        ),
        purpose: 'assistants',
      });

      this.logger.info(
        `File uploaded: ${file.id} for document ${newDocumentId}`,
      );

      const vectorStoreFile = await this.client.vectorStores.files.create(
        sessionId,
        {
          file_id: file.id,
          attributes: {
            document_id: newDocumentId,
            title: newTitle || title,
            source_type: metadata?.fileType || 'text',
            created_at: new Date().toISOString(),
            ...(metadata || {}),
          },
          chunking_strategy: this.chunkingStrategy,
        },
      );

      // Start background process to update session metadata
      this.updateSessionMetadataWhenComplete(
        sessionId,
        file.id,
        newDocumentId,
        false,
        undefined,
      ).catch(error => {
        this.logger.error(`Background metadata update failed: ${error}`);
      });

      this.logger.info(
        `Document "${newTitle || title}" (ID: ${newDocumentId}) upload started with file ${file.id}`,
      );

      return {
        document_id: newDocumentId,
        file_id: file.id,
        replaced: false,
        status: vectorStoreFile.status,
      };
    }

    // Document exists - determine if we can just update or need to recreate
    const createdAt =
      (existingFile.attributes?.created_at as string) ||
      new Date().toISOString();

    // Check for title conflicts when renaming
    if (documentId !== newDocumentId) {
      const conflictingFile = await this.findFileByDocumentId(
        sessionId,
        newDocumentId,
      );

      if (conflictingFile) {
        throw new ConflictError(
          `A document with the title "${newTitle || title}" already exists in this session`,
        );
      }
    }

    // Delete old file and create new one with updated content
    await this.deleteDocument(sessionId, documentId);
    this.logger.info(`Updating document: "${title}" -> "${newTitle || title}"`);

    const file = await this.client.files.create({
      file: await toFile(
        Buffer.from(content, 'utf-8'),
        `${newDocumentId}.txt`,
        {
          type: 'text/plain',
        },
      ),
      purpose: 'assistants',
    });

    this.logger.info(`File uploaded: ${file.id} for document ${newDocumentId}`);

    const vectorStoreFile = await this.client.vectorStores.files.create(
      sessionId,
      {
        file_id: file.id,
        attributes: {
          document_id: newDocumentId,
          title: newTitle || title,
          source_type: metadata?.fileType || 'text',
          created_at: createdAt,
          updated_at: new Date().toISOString(),
          ...(metadata || {}),
        },
        chunking_strategy: this.chunkingStrategy,
      },
    );

    // Start background process
    this.updateSessionMetadataWhenComplete(
      sessionId,
      file.id,
      newDocumentId,
      true,
      documentId,
    ).catch(error => {
      this.logger.error(`Background metadata update failed: ${error}`);
    });

    this.logger.info(
      `Document "${newTitle || title}" (ID: ${newDocumentId}) upload started with file ${file.id}`,
    );

    return {
      document_id: newDocumentId,
      file_id: file.id,
      replaced: true,
      status: vectorStoreFile.status,
    };
  }

  /**
   * Update session metadata in background after file processing completes
   */
  private async updateSessionMetadataWhenComplete(
    sessionId: string,
    fileId: string,
    documentId: string,
    replaced: boolean,
    oldDocumentId?: string,
  ): Promise<void> {
    try {
      // Wait for file processing in background (non-blocking for HTTP)
      await this.waitForFileProcessing(sessionId, fileId);

      // Update session metadata after processing completes
      const operation = replaced ? 'replace' : 'add';
      await this.updateSessionDocumentIds(
        sessionId,
        documentId,
        operation,
        oldDocumentId,
      );

      this.logger.info(
        `Background metadata update completed for document ${documentId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update metadata for ${documentId}: ${error}`,
      );
    }
  }

  /**
   * Get file processing status from Llama Stack
   */
  async getFileStatus(
    sessionId: string,
    documentId: string,
  ): Promise<{
    status: 'in_progress' | 'completed' | 'failed' | 'cancelled';
    error?: string;
  }> {
    const file = await this.findFileByDocumentId(sessionId, documentId);

    if (!file) {
      throw new NotFoundError(`Document not found: ${documentId}`);
    }

    return {
      status: file.status,
      error: file.last_error?.message,
    };
  }

  async listDocuments(
    sessionId: string,
    userId: string,
    fileTypeFilter?: string,
  ): Promise<SessionDocument[]> {
    this.logger.info(`Listing documents for session ${sessionId}`);

    // List all files in vector store
    const filesResponse = await this.client.vectorStores.files.list(sessionId);

    if (!filesResponse.data || filesResponse.data.length === 0) {
      return [];
    }

    // Map files to SessionDocument format
    const documents = filesResponse.data
      .filter(file => {
        // Apply file type filter if provided
        if (fileTypeFilter && file.attributes?.source_type !== fileTypeFilter) {
          return false;
        }
        return true;
      })
      .map(file => {
        const attrs = file.attributes || {};

        return {
          document_id: (attrs.document_id as string) || file.id,
          title: (attrs.title as string) || file.id,
          session_id: (attrs.session_id as string) || sessionId,
          user_id: (attrs.user_id as string) || userId,
          source_type:
            (attrs.source_type as SessionDocument['source_type']) || 'text',
          created_at: attrs.created_at
            ? (attrs.created_at as string)
            : new Date(file.created_at * 1000).toISOString(),
        };
      });

    this.logger.info(
      `Found ${documents.length} documents in session ${sessionId}`,
    );
    return documents;
  }

  /**
   * Delete a document from the vector store
   */
  async deleteDocument(
    sessionId: string,
    documentTitle: string,
  ): Promise<void> {
    const documentId = sanitizeTitle(documentTitle);
    this.logger.info(`Deleting document ${documentId} from ${sessionId}`);

    const file = await this.findFileByDocumentId(sessionId, documentId);

    if (!file) {
      throw new NotFoundError(`Document not found: ${documentId}`);
    }

    // Delete file completely
    await this.client.vectorStores.files.delete(sessionId, file.id);

    this.logger.info(`Deleted file ${file.id} from vector store and Files API`);

    // Update session metadata to remove document
    await this.updateSessionDocumentIds(sessionId, documentId, 'remove');
    this.logger.info(`Deleted document ${documentTitle} from ${sessionId}`);
  }
}
