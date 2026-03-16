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

import { LlamaStackClient, toFile } from 'llama-stack-client';
import fetch from 'node-fetch';

import { NotebookSession, SessionDocument } from './ai-notebooks-types';

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
      ) || 30000;

    // Chunking strategy configuration
    const chunkingType =
      config?.getOptionalString(
        'lightspeed.aiNotebooks.chunkingStrategy.type',
      ) || 'auto';

    if (chunkingType === 'static') {
      this.chunkingStrategy = {
        type: 'static',
        static: {
          max_chunk_size_tokens:
            config?.getOptionalNumber(
              'lightspeed.aiNotebooks.chunkingStrategy.maxChunkSizeTokens',
            ) || 512,
          chunk_overlap_tokens:
            config?.getOptionalNumber(
              'lightspeed.aiNotebooks.chunkingStrategy.chunkOverlapTokens',
            ) || 50,
        },
      };
    } else {
      this.chunkingStrategy = { type: 'auto' };
    }
  }

  /**
   * Sanitize title to create a valid document ID
   * Converts title to lowercase, replaces spaces/special chars with hyphens
   * Public so it can be used by router for delete operations
   */
  sanitizeTitle(title: string): string {
    return (
      title
        .trim()
        .toLocaleLowerCase('en-US')
        .replace(/[^a-z0-9]{1,100}/g, '-')
        .replace(/^-{1,100}/g, '')
        .replace(/-{1,100}$/g, '') || 'untitled'
    );
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

      const metadata = vectorStore.metadata as Record<string, any>;

      return {
        session_id: sessionId,
        user_id: metadata.user_id as string,
        name: metadata.name as string,
        description: metadata.description as string,
        created_at: metadata.created_at as string,
        updated_at: metadata.updated_at as string,
        metadata: {
          category: metadata.category,
          tags: metadata.tags,
          project: metadata.project,
          document_ids: metadata.document_ids,
          embedding_model: metadata.embedding_model,
          embedding_dimension: metadata.embedding_dimension,
          provider_id: metadata.provider_id,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve session metadata: ${error}`);
      return null;
    }
  }

  /**
   * Store session metadata in vector store metadata field
   * Ensures document_ids and embedding config are preserved
   */
  private async storeSessionMetadata(session: NotebookSession): Promise<void> {
    const metadata = {
      user_id: session.user_id,
      name: session.name,
      description: session.description,
      created_at: session.created_at,
      updated_at: session.updated_at,
      // Spread session.metadata which includes embedding config and document_ids
      ...(session.metadata || {}),
    };

    await this.client.vectorStores.update(session.session_id, {
      metadata,
    });
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
        const errorMsg = file.last_error?.message || 'Unknown error';
        this.logger.error(`File ${fileId} processing failed: ${errorMsg}`);
        throw new Error(`File processing failed: ${errorMsg}`);
      }

      if (file.status === 'cancelled') {
        throw new Error('File processing was cancelled');
      }

      // Still in_progress, wait and retry
      this.logger.debug(`File ${fileId} still processing, waiting...`);
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error(
      `File processing timeout after ${this.fileProcessingTimeoutMs}ms`,
    );
  }

  async uploadDocument(
    sessionId: string,
    userId: string,
    title: string,
    content: string,
    metadata?: Record<string, any>,
  ): Promise<UpsertResult> {
    const documentId = this.sanitizeTitle(title);

    // Check if document already exists by listing files
    const existingFiles = await this.client.vectorStores.files.list(sessionId);
    const existingFile = existingFiles.data.find(
      f => f.attributes?.document_id === documentId,
    );

    // Throw error if document with this title already exists
    if (existingFile) {
      throw new Error(
        `A document with the title "${title}" already exists in this session. Please use a different title or update the existing document.`,
      );
    }

    // 1. Upload file to Files API
    const file = await this.client.files.create({
      file: await toFile(Buffer.from(content, 'utf-8'), `${documentId}.txt`, {
        type: 'text/plain',
      }),
      purpose: 'assistants',
    });

    this.logger.info(`File uploaded: ${file.id} for document ${documentId}`);

    // 2. Attach file to vector store with metadata
    const vectorStoreFile = await this.client.vectorStores.files.create(
      sessionId,
      {
        file_id: file.id,
        attributes: {
          document_id: documentId,
          user_id: userId,
          title: title,
          session_id: sessionId,
          source_type: metadata?.fileType || 'text',
          created_at: new Date().toISOString(),
          ...(metadata || {}),
        },
        chunking_strategy: this.chunkingStrategy,
      },
    );

    // 3. Wait for file processing to complete
    await this.waitForFileProcessing(sessionId, file.id);

    // 4. Update session metadata with document list
    const session = await this.retrieveSessionMetadata(sessionId);
    if (session) {
      const documentIds = session.metadata?.document_ids || [];
      if (!documentIds.includes(documentId)) {
        documentIds.push(documentId);
        session.metadata = {
          ...session.metadata,
          document_ids: documentIds,
        };
        session.updated_at = new Date().toISOString();
        await this.storeSessionMetadata(session);
      }
    }

    this.logger.info(
      `Document "${title}" (ID: ${documentId}) created with file ${file.id}`,
    );

    return {
      document_id: documentId,
      file_id: file.id,
      replaced: false,
      status: vectorStoreFile.status,
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
          session_id: sessionId,
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
   * Retrieve file content from Files API
   */
  private async retrieveFileContent(fileId: string): Promise<string> {
    try {
      // Llama Stack Files API should support content retrieval via /v1/files/{file_id}/content
      const fileObject = await this.client.files.retrieve(fileId);

      // If the file object has content, return it
      if (fileObject && typeof fileObject === 'object') {
        const anyFileObject = fileObject as any;
        if (anyFileObject.content) {
          return anyFileObject.content;
        }
      }

      // If content not in retrieve response, try fetching raw content
      // This follows OpenAI Files API pattern: GET /v1/files/{file_id}/content
      const baseURL =
        (this.client as any)._client?.baseURL || 'http://localhost:8321';
      const response = await fetch(`${baseURL}/v1/files/${fileId}/content`);

      if (!response.ok) {
        throw new Error(
          `Failed to retrieve file content: ${response.statusText}`,
        );
      }

      return await response.text();
    } catch (error) {
      this.logger.warn(
        `Could not retrieve file content for ${fileId}: ${error}`,
      );
      throw new Error(
        `Cannot retrieve existing file content. Please provide new content when updating the document.`,
      );
    }
  }

  /**
   * Update a document's title and/or content
   * If only title is updated, existing content is retrieved and re-uploaded
   * If content is updated, new content must be provided
   */
  async updateDocument(
    sessionId: string,
    userId: string,
    currentDocumentId: string,
    newTitle?: string,
    newContent?: string,
    metadata?: Record<string, any>,
  ): Promise<UpsertResult> {
    this.logger.info(`Updating document ${currentDocumentId} in ${sessionId}`);

    // Find the existing document
    const filesResponse = await this.client.vectorStores.files.list(sessionId);
    const existingFile = filesResponse.data.find(
      f => f.attributes?.document_id === currentDocumentId,
    );

    if (!existingFile) {
      throw new Error(`Document not found: ${currentDocumentId}`);
    }

    // Get current attributes
    const currentAttrs = existingFile.attributes || {};
    const currentTitle = (currentAttrs.title as string) || currentDocumentId;

    // Determine new title
    const finalTitle = newTitle || currentTitle;

    // Determine content: use new content if provided, otherwise retrieve existing
    let contentToUpload: string;
    if (newContent) {
      contentToUpload = newContent;
      this.logger.info('Using new content for document update');
    } else {
      this.logger.info(
        'No new content provided, retrieving existing file content',
      );
      contentToUpload = await this.retrieveFileContent(existingFile.id);
    }

    // Calculate new document ID from new title
    const newDocumentId = this.sanitizeTitle(finalTitle);

    // If title is changing, check if new document_id already exists as a different document
    if (newDocumentId !== currentDocumentId) {
      const conflictingFile = filesResponse.data.find(
        f => f.attributes?.document_id === newDocumentId,
      );

      if (conflictingFile) {
        throw new Error(
          `A document with the title "${finalTitle}" already exists in this session`,
        );
      }
    }

    this.logger.info(`Updating document: "${currentTitle}" -> "${finalTitle}"`);

    // Delete the old file
    await this.client.vectorStores.files.delete(sessionId, existingFile.id);
    try {
      await this.client.files.delete(existingFile.id);
    } catch (error) {
      this.logger.warn(
        `Failed to delete old file ${existingFile.id}: ${error}`,
      );
    }

    // Create new file with updated data
    const file = await this.client.files.create({
      file: await toFile(
        Buffer.from(contentToUpload, 'utf-8'),
        `${newDocumentId}.txt`,
        { type: 'text/plain' },
      ),
      purpose: 'assistants',
    });

    this.logger.info(
      `New file uploaded: ${file.id} for document ${newDocumentId}`,
    );

    // Attach file to vector store with updated metadata
    const vectorStoreFile = await this.client.vectorStores.files.create(
      sessionId,
      {
        file_id: file.id,
        attributes: {
          ...currentAttrs,
          document_id: newDocumentId,
          user_id: userId,
          title: finalTitle,
          session_id: sessionId,
          updated_at: new Date().toISOString(),
          ...(metadata || {}),
        },
        chunking_strategy: this.chunkingStrategy,
      },
    );

    // Wait for file processing to complete
    await this.waitForFileProcessing(sessionId, file.id);

    // Update session metadata if document_id changed
    if (newDocumentId !== currentDocumentId) {
      const session = await this.retrieveSessionMetadata(sessionId);
      if (session && session.metadata?.document_ids) {
        const documentIds = session.metadata.document_ids.map(id =>
          id === currentDocumentId ? newDocumentId : id,
        );
        session.metadata = {
          ...session.metadata,
          document_ids: documentIds,
        };
        session.updated_at = new Date().toISOString();
        await this.storeSessionMetadata(session);
      }
    }

    this.logger.info(
      `Document "${currentDocumentId}" updated successfully (new ID: ${newDocumentId})`,
    );

    return {
      document_id: newDocumentId,
      file_id: file.id,
      replaced: true,
      status: vectorStoreFile.status,
    };
  }

  /**
   * Delete a document from the vector store
   */
  async deleteDocument(sessionId: string, documentId: string): Promise<void> {
    this.logger.info(`Deleting document ${documentId} from ${sessionId}`);

    // Find file by document_id in attributes
    const filesResponse = await this.client.vectorStores.files.list(sessionId);
    const file = filesResponse.data.find(
      f => f.attributes?.document_id === documentId,
    );

    if (!file) {
      throw new Error(`Document not found: ${documentId}`);
    }

    // Delete from vector store (removes chunks and embeddings)
    await this.client.vectorStores.files.delete(sessionId, file.id);
    this.logger.info(`Deleted file ${file.id} from vector store`);

    // Delete from Files API (cleanup)
    try {
      await this.client.files.delete(file.id);
      this.logger.info(`Deleted file ${file.id} from Files API`);
    } catch (error) {
      this.logger.warn(
        `Failed to delete file ${file.id} from Files API: ${error}`,
      );
    }

    // Update session metadata to remove document
    const session = await this.retrieveSessionMetadata(sessionId);
    if (session && session.metadata?.document_ids) {
      const documentIds = session.metadata.document_ids.filter(
        id => id !== documentId,
      );
      session.metadata = {
        ...session.metadata,
        document_ids: documentIds,
      };
      session.updated_at = new Date().toISOString();
      await this.storeSessionMetadata(session);
    }

    this.logger.info(`Document ${documentId} successfully deleted`);
  }
}
