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

import { LlamaStackClient } from 'llama-stack-client';

import { NotebookSession, SessionMetadata } from './types/notebooksTypes';
import { buildVectorStoreMetadata, extractSessionFromMetadata } from './utils';

/**
 * Service for managing notebook sessions with dedicated vector stores
 * - Session ID is the Llama Stack vector store ID
 * - Session metadata stored in VectorStore metadata field
 * - Uses ONLY Llama Stack APIs (no direct database access)
 */
export class SessionService {
  private logger: LoggerService;
  private client: LlamaStackClient;
  private embeddingModel: string;
  private embeddingDimension: number;
  private providerId: string;

  constructor(llamaStackUrl: string, logger: LoggerService, config?: Config) {
    this.client = new LlamaStackClient({ baseURL: llamaStackUrl });
    this.logger = logger;

    // Read from config or use Llama Stack 0.5 distribution defaults
    this.embeddingModel =
      config?.getOptionalString(
        'lightspeed.aiNotebooks.llamaStack.embeddingModel',
      ) || 'sentence-transformers/nomic-ai/nomic-embed-text-v1.5';

    this.embeddingDimension =
      config?.getOptionalNumber(
        'lightspeed.aiNotebooks.llamaStack.embeddingDimension',
      ) || 768;

    this.providerId =
      config?.getOptionalString(
        'lightspeed.aiNotebooks.llamaStack.vectorIo.providerId',
      ) || 'rhdh-docs';
  }

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
      session_id: 'temp', // Will be replaced with actual ID
      user_id: userId,
      name,
      description: description || '',
      created_at: now,
      updated_at: now,
      metadata: {
        ...metadata,
        document_ids: [],
        conversation_id: null,
      },
    };

    // Create vector store with embedding config AND metadata in one call
    const vectorStore = await this.client.vectorStores.create({
      name: name || `Session for ${userId}`,
      embedding_model: this.embeddingModel,
      embedding_dimension: this.embeddingDimension,
      provider_id: this.providerId,
      metadata: buildVectorStoreMetadata(tempSession),
    });

    const sessionId = vectorStore.id;

    // Build final session object with actual ID
    const session: NotebookSession = {
      ...tempSession,
      session_id: sessionId,
    };

    this.logger.info(`Created session ${sessionId} for user ${userId}`);
    return session;
  }

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

    return session;
  }

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

    // Update vector store metadata
    await this.client.vectorStores.update(sessionId, {
      metadata: buildVectorStoreMetadata(updated),
    });

    return updated;
  }

  async deleteSession(sessionId: string, userId: string): Promise<void> {
    // Verify ownership before deletion
    await this.readSession(sessionId, userId);

    // Unregister the vector store
    await this.client.vectorStores.delete(sessionId);
    this.logger.info(`Session ${sessionId} deleted`);
  }

  async listSessions(userId: string): Promise<NotebookSession[]> {
    // List all vector stores - the new API returns a paginated response
    const vectorStoresPage = await this.client.vectorStores.list();
    const vectorStores = vectorStoresPage.data;

    const sessions: NotebookSession[] = [];
    for (const store of vectorStores) {
      // Filter by user ID from metadata
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

    // Sort by created_at descending (newest first)
    return sessions.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }
}
