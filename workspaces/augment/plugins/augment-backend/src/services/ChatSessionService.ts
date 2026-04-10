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

import { randomUUID } from 'crypto';
import type {
  LoggerService,
  DatabaseService,
} from '@backstage/backend-plugin-api';
import {
  MAX_SESSION_LIST_LIMIT,
  DEFAULT_SESSION_LIST_LIMIT,
} from '../constants';
import { toErrorMessage } from './utils';

export interface ChatSession {
  id: string;
  title: string;
  userRef: string;
  conversationId: string | null;
  createdAt: string;
  updatedAt: string;
  model?: string;
  providerId?: string;
}

export interface SessionMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  agentName?: string;
  toolCalls?: string;
  ragSources?: string;
  usage?: string;
  reasoning?: string;
  createdAt: string;
}

interface ChatSessionRow {
  id: string;
  title: string;
  user_ref: string;
  conversation_id: string | null;
  created_at: string;
  updated_at: string;
  model: string | null;
  provider_id: string | null;
}

interface SessionMessageRow {
  id: string;
  session_id: string;
  role: string;
  content: string;
  agent_name: string | null;
  tool_calls: string | null;
  rag_sources: string | null;
  usage: string | null;
  reasoning: string | null;
  created_at: string;
}

const TABLE_NAME = 'augment_sessions';
const MESSAGES_TABLE = 'augment_session_messages';

/**
 * Manages chat sessions in a local database (SQLite for dev, Postgres for prod).
 * Each session links to a LlamaStack conversation_id (set on first message).
 * Mirrors the ai-virtual-agent pattern: the DB is the source of truth for
 * the sidebar, LlamaStack is the source of truth for message content.
 */
export class ChatSessionService {
  private readonly logger: LoggerService;
  private db: Awaited<ReturnType<DatabaseService['getClient']>> | null = null;

  constructor(
    private readonly database: DatabaseService,
    logger: LoggerService,
  ) {
    this.logger = logger;
  }

  async initialize(): Promise<void> {
    try {
      this.db = await this.database.getClient();

      const hasTable = await this.db.schema.hasTable(TABLE_NAME);
      if (hasTable) {
        // Add user_ref column if missing (migration for existing tables)
        const hasUserRef = await this.db.schema.hasColumn(
          TABLE_NAME,
          'user_ref',
        );
        if (!hasUserRef) {
          try {
            await this.db.schema.alterTable(TABLE_NAME, table => {
              table
                .string('user_ref')
                .notNullable()
                .defaultTo('user:default/guest');
              table.index(['user_ref', 'updated_at']);
            });
            this.logger.info(`Added user_ref column to ${TABLE_NAME} table`);
          } catch (alterError) {
            const hasUserRefNow = await this.db.schema.hasColumn(
              TABLE_NAME,
              'user_ref',
            );
            if (!hasUserRefNow) throw alterError;
            this.logger.info(
              `user_ref column in ${TABLE_NAME} was added by another instance`,
            );
          }
        }
        // Add model column if missing (migration for existing tables)
        const hasModel = await this.db.schema.hasColumn(TABLE_NAME, 'model');
        if (!hasModel) {
          try {
            await this.db.schema.alterTable(TABLE_NAME, table => {
              table.string('model').nullable();
            });
            this.logger.info(`Added model column to ${TABLE_NAME} table`);
          } catch (alterError) {
            const hasModelNow = await this.db.schema.hasColumn(
              TABLE_NAME,
              'model',
            );
            if (!hasModelNow) throw alterError;
            this.logger.info(
              `model column in ${TABLE_NAME} was added by another instance`,
            );
          }
        }

        // Add provider_id column if missing (migration for existing tables)
        const hasProviderId = await this.db.schema.hasColumn(
          TABLE_NAME,
          'provider_id',
        );
        if (!hasProviderId) {
          try {
            await this.db.schema.alterTable(TABLE_NAME, table => {
              table.string('provider_id').nullable();
            });
            this.logger.info(`Added provider_id column to ${TABLE_NAME} table`);
          } catch (alterError) {
            const hasProviderIdNow = await this.db.schema.hasColumn(
              TABLE_NAME,
              'provider_id',
            );
            if (!hasProviderIdNow) throw alterError;
            this.logger.info(
              `provider_id column in ${TABLE_NAME} was added by another instance`,
            );
          }
        }

        this.logger.info(`Using existing ${TABLE_NAME} table`);
      } else {
        try {
          await this.db.schema.createTable(TABLE_NAME, table => {
            table.string('id').primary().notNullable();
            table.string('title').notNullable();
            table
              .string('user_ref')
              .notNullable()
              .defaultTo('user:default/guest');
            table.string('conversation_id').nullable();
            table.string('model').nullable();
            table.string('provider_id').nullable();
            table
              .timestamp('created_at')
              .notNullable()
              .defaultTo(this.db!.fn.now());
            table
              .timestamp('updated_at')
              .notNullable()
              .defaultTo(this.db!.fn.now());
            table.index(['user_ref', 'updated_at']);
          });
          this.logger.info(`Created ${TABLE_NAME} table`);
        } catch (createError) {
          const existsNow = await this.db.schema.hasTable(TABLE_NAME);
          if (!existsNow) throw createError;
          this.logger.info(
            `${TABLE_NAME} table was created by another instance`,
          );
        }
      }

      // Initialize the session messages table
      await this.initializeMessagesTable();
    } catch (error) {
      const msg = toErrorMessage(error);
      this.logger.error(`Failed to initialize chat sessions database: ${msg}`);
      throw error;
    }
  }

  private async initializeMessagesTable(): Promise<void> {
    if (!this.db) return;

    const hasTable = await this.db.schema.hasTable(MESSAGES_TABLE);
    if (hasTable) {
      this.logger.info(`Using existing ${MESSAGES_TABLE} table`);
      return;
    }

    try {
      await this.db.schema.createTable(MESSAGES_TABLE, table => {
        table.string('id').primary().notNullable();
        table.string('session_id').notNullable();
        table.string('role').notNullable();
        table.text('content').notNullable();
        table.string('agent_name').nullable();
        table.text('tool_calls').nullable();
        table.text('rag_sources').nullable();
        table.text('usage').nullable();
        table.text('reasoning').nullable();
        table
          .timestamp('created_at')
          .notNullable()
          .defaultTo(this.db!.fn.now());
        table.index(['session_id', 'created_at']);
      });
      this.logger.info(`Created ${MESSAGES_TABLE} table`);
    } catch (createError) {
      const existsNow = await this.db.schema.hasTable(MESSAGES_TABLE);
      if (!existsNow) throw createError;
      this.logger.info(
        `${MESSAGES_TABLE} table was created by another instance`,
      );
    }
  }

  private rowToSession(row: ChatSessionRow): ChatSession {
    return {
      id: row.id,
      title: row.title,
      userRef: row.user_ref,
      conversationId: row.conversation_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      ...(row.model ? { model: row.model } : {}),
      ...(row.provider_id ? { providerId: row.provider_id } : {}),
    };
  }

  private rowToMessage(row: SessionMessageRow): SessionMessage {
    return {
      id: row.id,
      sessionId: row.session_id,
      role: row.role as 'user' | 'assistant',
      content: row.content,
      ...(row.agent_name ? { agentName: row.agent_name } : {}),
      ...(row.tool_calls ? { toolCalls: row.tool_calls } : {}),
      ...(row.rag_sources ? { ragSources: row.rag_sources } : {}),
      ...(row.usage ? { usage: row.usage } : {}),
      ...(row.reasoning ? { reasoning: row.reasoning } : {}),
      createdAt: row.created_at,
    };
  }

  async createSession(
    userRef: string,
    title?: string,
    model?: string,
    providerId?: string,
  ): Promise<ChatSession> {
    if (!this.db) throw new Error('Database not initialized');

    const id = randomUUID();
    const now = new Date().toISOString();
    const sessionTitle = title || `Chat ${now.slice(0, 16).replace('T', ' ')}`;

    await this.db(TABLE_NAME).insert({
      id,
      title: sessionTitle,
      user_ref: userRef,
      conversation_id: null,
      model: model || null,
      provider_id: providerId || null,
      created_at: now,
      updated_at: now,
    });

    this.logger.info(`Created session ${id} for ${userRef}: "${sessionTitle}"`);
    return {
      id,
      title: sessionTitle,
      userRef,
      conversationId: null,
      createdAt: now,
      updatedAt: now,
      ...(model ? { model } : {}),
      ...(providerId ? { providerId } : {}),
    };
  }

  async listSessions(
    userRef: string,
    limit: number = 50,
    offset: number = 0,
    providerId?: string,
  ): Promise<ChatSession[]> {
    if (!this.db) throw new Error('Database not initialized');

    const cappedLimit = Math.min(Math.max(1, limit), MAX_SESSION_LIST_LIMIT);
    const cappedOffset = Math.max(0, offset);
    let query = this.db(TABLE_NAME)
      .select('*')
      .where('user_ref', userRef)
      .orderBy('updated_at', 'desc')
      .limit(cappedLimit)
      .offset(cappedOffset);

    if (providerId) {
      query = query.where(function providerFilter() {
        this.where('provider_id', providerId).orWhereNull('provider_id');
      });
    }

    const rows: ChatSessionRow[] = await query;
    return rows.map(r => this.rowToSession(r));
  }

  /**
   * List all sessions across all users.
   * @remarks Admin-only: callers must verify admin access before invoking.
   */
  async listAllSessions(
    limit: number = DEFAULT_SESSION_LIST_LIMIT,
  ): Promise<ChatSession[]> {
    if (!this.db) throw new Error('Database not initialized');

    const cappedLimit = Math.min(Math.max(1, limit), MAX_SESSION_LIST_LIMIT);
    const rows: ChatSessionRow[] = await this.db(TABLE_NAME)
      .select('*')
      .orderBy('updated_at', 'desc')
      .limit(cappedLimit);

    return rows.map(r => this.rowToSession(r));
  }

  async getSession(
    sessionId: string,
    userRef: string,
  ): Promise<ChatSession | null> {
    if (!this.db) throw new Error('Database not initialized');

    const row: ChatSessionRow | undefined = await this.db(TABLE_NAME)
      .where('id', sessionId)
      .where('user_ref', userRef)
      .first();

    return row ? this.rowToSession(row) : null;
  }

  /**
   * Retrieve any session by ID without user_ref filtering.
   * @remarks Admin-only: callers must verify admin access before invoking.
   */
  async getSessionById(sessionId: string): Promise<ChatSession | null> {
    if (!this.db) throw new Error('Database not initialized');

    const row: ChatSessionRow | undefined = await this.db(TABLE_NAME)
      .where('id', sessionId)
      .first();

    return row ? this.rowToSession(row) : null;
  }

  async deleteSession(sessionId: string, userRef: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    const deleted = await this.db.transaction(async (trx): Promise<number> => {
      await trx(MESSAGES_TABLE).where('session_id', sessionId).delete();

      return trx(TABLE_NAME)
        .where('id', sessionId)
        .where('user_ref', userRef)
        .delete();
    });

    if (deleted > 0) {
      this.logger.info(`Deleted session ${sessionId} for ${userRef}`);
    }
    return deleted > 0;
  }

  /**
   * Set the LlamaStack conversation_id for a session.
   * Called after the first message creates a conversation in LlamaStack.
   */
  async setConversationId(
    sessionId: string,
    userRef: string,
    conversationId: string,
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db(TABLE_NAME)
      .where('id', sessionId)
      .where('user_ref', userRef)
      .update({
        conversation_id: conversationId,
        updated_at: new Date().toISOString(),
      });

    this.logger.info(
      `Linked session ${sessionId} to conversation ${conversationId} for ${userRef}`,
    );
  }

  /**
   * Conditionally set conversation_id only if the session has no conversation
   * yet. Prevents race conditions where two concurrent requests both try to
   * link a conversation. Returns true if the update was applied.
   */
  async setConversationIdIfNull(
    sessionId: string,
    userRef: string,
    conversationId: string,
  ): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    const updated = await this.db(TABLE_NAME)
      .where('id', sessionId)
      .where('user_ref', userRef)
      .whereNull('conversation_id')
      .update({
        conversation_id: conversationId,
        updated_at: new Date().toISOString(),
      });

    if (updated > 0) {
      this.logger.info(
        `Linked session ${sessionId} to conversation ${conversationId} for ${userRef}`,
      );
      return true;
    }

    this.logger.info(
      `Session ${sessionId} already has a conversation_id, skipping link to ${conversationId}`,
    );
    return false;
  }

  /**
   * Update the session title (e.g., from the first user message).
   */
  async updateTitle(
    sessionId: string,
    userRef: string,
    title: string,
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db(TABLE_NAME)
      .where('id', sessionId)
      .where('user_ref', userRef)
      .update({
        title,
        updated_at: new Date().toISOString(),
      });
  }

  /**
   * Touch the updated_at timestamp (called after each message).
   */
  async touch(sessionId: string, userRef: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db(TABLE_NAME)
      .where('id', sessionId)
      .where('user_ref', userRef)
      .update({ updated_at: new Date().toISOString() });
  }

  // =========================================================================
  // Session Messages — local persistence for conversation history
  // =========================================================================

  /**
   * Persist a message (user or assistant) for a session.
   */
  async addMessage(
    msg: Omit<SessionMessage, 'id' | 'createdAt'>,
  ): Promise<SessionMessage> {
    if (!this.db) throw new Error('Database not initialized');

    const id = randomUUID();
    const now = new Date().toISOString();

    await this.db(MESSAGES_TABLE).insert({
      id,
      session_id: msg.sessionId,
      role: msg.role,
      content: msg.content,
      agent_name: msg.agentName || null,
      tool_calls: msg.toolCalls || null,
      rag_sources: msg.ragSources || null,
      usage: msg.usage || null,
      reasoning: msg.reasoning || null,
      created_at: now,
    });

    return {
      id,
      ...msg,
      createdAt: now,
    };
  }

  /**
   * Retrieve messages for a session, ordered chronologically.
   * Optional `limit` and `offset` enable pagination for large conversations.
   */
  async getMessages(
    sessionId: string,
    limit?: number,
    offset?: number,
  ): Promise<SessionMessage[]> {
    if (!this.db) throw new Error('Database not initialized');

    let query = this.db(MESSAGES_TABLE)
      .select('*')
      .where('session_id', sessionId)
      .orderBy('created_at', 'asc');

    if (typeof offset === 'number' && offset > 0) {
      query = query.offset(offset);
    }
    if (typeof limit === 'number' && limit > 0) {
      query = query.limit(limit);
    }

    const rows: SessionMessageRow[] = await query;
    return rows.map(r => this.rowToMessage(r));
  }

  /**
   * Delete all messages for a session (used when deleting the session).
   */
  async deleteMessagesBySession(sessionId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const deleted = await this.db(MESSAGES_TABLE)
      .where('session_id', sessionId)
      .delete();

    if (deleted > 0) {
      this.logger.info(`Deleted ${deleted} messages for session ${sessionId}`);
    }
  }
}
