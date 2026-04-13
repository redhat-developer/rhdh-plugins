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
import { NotAllowedError, NotFoundError } from '@backstage/errors';

import { NotebookSession, SessionMetadata } from '../types/notebooksTypes';
import { buildVectorStoreMetadata, extractSessionFromMetadata } from '../utils';
import { VectorStoresOperator } from '../VectorStoresOperator';

/**
 * Service for managing notebook sessions with dedicated vector stores
 * - Session ID is the vector store ID
 * - Session metadata stored in VectorStore metadata field
 * - Uses VectorStoresOperator to proxy through lightspeed-core
 */
export class SessionService {
  private logger: LoggerService;
  private client: VectorStoresOperator;
  private providerId: string;
  private embeddingModel: string;
  private embeddingDimension: number;

  constructor(
    client: VectorStoresOperator,
    logger: LoggerService,
    config?: Config,
  ) {
    this.client = client;
    this.logger = logger;

    const requireConfig = <T>(value: T | undefined, key: string): T => {
      if (value === undefined) throw new Error(`${key} is required in config`);
      return value;
    };

    this.providerId = requireConfig(
      config?.getString('lightspeed.Notebooks.sessionDefaults.provider_id'),
      'lightspeed.Notebooks.sessionDefaults.provider_id',
    );
    this.embeddingModel = requireConfig(
      config?.getString('lightspeed.Notebooks.sessionDefaults.embedding_model'),
      'lightspeed.Notebooks.sessionDefaults.embedding_model',
    );
    this.embeddingDimension = requireConfig(
      config?.getNumber(
        'lightspeed.Notebooks.sessionDefaults.embedding_dimension',
      ),
      'lightspeed.Notebooks.sessionDefaults.embedding_dimension',
    );
  }

  /**
   * Create a new notebook session
   * @param userId - User ID creating the session
   * @param name - Session name
   * @param description - Optional session description
   * @param metadata - Optional session metadata
   * @returns Created notebook session
   */
  async createSession(
    userId: string,
    name: string,
    description?: string,
    metadata?: SessionMetadata,
  ): Promise<NotebookSession> {
    const now = new Date().toISOString();

    this.logger.info(`Creating session for user ${userId}`);

    // Build temporary session object to generate metadata
    const tempSession: NotebookSession = {
      session_id: 'temp', // Placeholder - will be replaced with vector store ID
      user_id: userId,
      name,
      description: description || '',
      created_at: now,
      updated_at: now,
      metadata: {
        ...metadata,
        conversation_id: null,
        provider_id: this.providerId,
        embedding_model: this.embeddingModel,
        embedding_dimension: this.embeddingDimension,
      },
    };

    const vectorStore = await this.client.vectorStores.create({
      name: name || `Session for ${userId}`,
      provider_id: this.providerId,
      embedding_model: this.embeddingModel,
      embedding_dimension: this.embeddingDimension,
      metadata: buildVectorStoreMetadata(tempSession),
    });

    const sessionId = vectorStore.id;

    // Build final session object with actual ID
    const session: NotebookSession = {
      ...tempSession,
      session_id: sessionId,
      document_count: 0,
    };

    this.logger.info(`Created session ${sessionId} for user ${userId}`);
    return session;
  }

  /**
   * Retrieve a session and verify ownership
   * @param sessionId - Session ID to retrieve
   * @param userId - User ID requesting access
   * @returns Notebook session
   * @throws NotFoundError if session not found or has no metadata
   * @throws NotAllowedError if user does not own the session
   */
  async readSession(
    sessionId: string,
    userId: string,
  ): Promise<NotebookSession> {
    // Retrieve vector store to get metadata
    const vectorStore = await this.client.vectorStores.retrieve(sessionId);

    if (!vectorStore.metadata) {
      throw new NotFoundError(`Session ${sessionId} has no metadata`);
    }

    const session = extractSessionFromMetadata(
      sessionId,
      vectorStore.metadata as Record<string, any>,
    );

    // Verify ownership
    if (session.user_id !== userId) {
      throw new NotAllowedError(
        `User ${userId} does not have access to session ${sessionId}`,
      );
    }

    // Fetch document count
    try {
      const filesResponse =
        await this.client.vectorStores.files.list(sessionId);
      session.document_count = filesResponse.data?.length || 0;
    } catch (error) {
      this.logger.warn(
        `Failed to fetch document count for session ${sessionId}: ${error}`,
      );
      session.document_count = 0;
    }

    return session;
  }

  /**
   * Update session details
   * @param sessionId - Session ID to update
   * @param userId - User ID performing the update
   * @param name - New session name (optional)
   * @param description - New session description (optional)
   * @param metadata - New session metadata (optional)
   * @returns Updated notebook session
   * @throws NotAllowedError if user does not own the session
   */
  async updateSession(
    sessionId: string,
    userId: string,
    name?: string,
    description?: string,
    metadata?: SessionMetadata,
  ): Promise<NotebookSession> {
    const existing = await this.readSession(sessionId, userId);

    const updated: NotebookSession = {
      ...existing,
      name: name !== undefined ? name : existing.name,
      description:
        description !== undefined ? description : existing.description,
      metadata: metadata !== undefined ? metadata : existing.metadata,
      updated_at: new Date().toISOString(),
    };

    // Retrieve vector store to preserve embedding configuration
    const vectorStore = await this.client.vectorStores.retrieve(sessionId);

    // Update vector store metadata while preserving embedding fields
    await this.client.vectorStores.update(sessionId, {
      embedding_model: vectorStore.embedding_model,
      embedding_dimension: vectorStore.embedding_dimension,
      metadata: buildVectorStoreMetadata(updated),
    });

    return updated;
  }

  /**
   * Delete a session
   * @param sessionId - Session ID to delete
   * @param userId - User ID performing the deletion
   * @throws NotAllowedError if user does not own the session
   */
  async deleteSession(sessionId: string, userId: string): Promise<void> {
    // Verify ownership before deletion
    await this.readSession(sessionId, userId);

    // Unregister the vector store
    await this.client.vectorStores.delete(sessionId);
    this.logger.info(`Session ${sessionId} deleted`);
  }

  /**
   * List all sessions for a user
   * @param userId - User ID to filter sessions
   * @returns Array of notebook sessions sorted by creation date (newest first)
   */
  async listSessions(userId: string): Promise<NotebookSession[]> {
    const vectorStoresPage = await this.client.vectorStores.list();
    const vectorStores = vectorStoresPage.data;
    const sessions: NotebookSession[] = [];

    // Extract sessions first
    for (const store of vectorStores) {
      const session_user_id = (store.metadata?.user_id as string) || '';
      if (session_user_id === userId && store.metadata) {
        try {
          const session = extractSessionFromMetadata(
            store.id,
            store.metadata as Record<string, any>,
          );
          sessions.push(session);
        } catch (error) {
          this.logger.warn(
            `Failed to extract session from vector store ${store.id}: ${error}`,
          );
        }
      }
    }

    // Fetch document counts in parallel
    await Promise.all(
      sessions.map(async session => {
        try {
          const filesResponse = await this.client.vectorStores.files.list(
            session.session_id,
          );
          session.document_count = filesResponse.data?.length || 0;
        } catch (error) {
          this.logger.warn(
            `Failed to fetch document count for session ${session.session_id}: ${error}`,
          );
          session.document_count = 0;
        }
      }),
    );

    // Sort by created_at descending (newest first)
    return sessions.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }
}
