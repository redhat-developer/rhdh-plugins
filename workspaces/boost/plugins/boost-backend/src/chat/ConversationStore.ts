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
  DatabaseService,
  LoggerService,
} from '@backstage/backend-plugin-api';
import { NotFoundError } from '@backstage/errors';
import type { Knex } from 'knex';
import type {
  ConversationSummary,
  ConversationDetails,
  ConversationMessage,
  FeedbackRecord,
} from '@red-hat-developer-hub/backstage-plugin-boost-common';

// ---------------------------------------------------------------------------
// Table and row types
// ---------------------------------------------------------------------------

const SESSIONS_TABLE = 'boost_sessions';
const MESSAGES_TABLE = 'boost_messages';
const FEEDBACK_TABLE = 'boost_feedback';

/** @internal */
interface SessionRow {
  id: string;
  title: string;
  provider_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/** @internal */
interface MessageRow {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

/** @internal */
interface FeedbackRow {
  id: string;
  session_id: string;
  message_id: string;
  sentiment: 'positive' | 'negative';
  reason: string | null;
  created_by: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

/**
 * Options for creating a {@link ConversationStore}.
 *
 * @public
 */
export interface ConversationStoreOptions {
  /** The Backstage database service. */
  database: DatabaseService;
  /** The Backstage logger service. */
  logger: LoggerService;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

/**
 * Database-backed store for conversation persistence.
 *
 * Manages three tables: `boost_sessions`, `boost_messages`, and
 * `boost_feedback`, following the established store pattern used
 * by {@link AgentLifecycleStore} and {@link McpServerStore}.
 *
 * @public
 */
export class ConversationStore {
  private readonly logger: LoggerService;
  private knexPromise: Promise<Knex> | undefined;
  private readonly database: DatabaseService;

  constructor(options: ConversationStoreOptions) {
    this.logger = options.logger.child({ service: 'ConversationStore' });
    this.database = options.database;
  }

  /**
   * Get the Knex instance, creating tables on first access.
   */
  private async getDb(): Promise<Knex> {
    if (!this.knexPromise) {
      this.knexPromise = (async () => {
        const knex = await this.database.getClient();
        await this.ensureTables(knex);
        return knex;
      })().catch(err => {
        this.knexPromise = undefined;
        throw err;
      });
    }
    return this.knexPromise;
  }

  /**
   * Ensure all conversation tables exist.
   */
  private async ensureTables(knex: Knex): Promise<void> {
    if (!(await knex.schema.hasTable(SESSIONS_TABLE))) {
      await knex.schema.createTable(SESSIONS_TABLE, table => {
        table.string('id').primary().notNullable();
        table.string('title').notNullable();
        table.string('provider_id').notNullable();
        table.string('created_by').notNullable();
        table
          .timestamp('created_at', { useTz: true })
          .defaultTo(knex.fn.now())
          .notNullable();
        table
          .timestamp('updated_at', { useTz: true })
          .defaultTo(knex.fn.now())
          .notNullable();
      });
      this.logger.info(`Created ${SESSIONS_TABLE} table`);
    }

    if (!(await knex.schema.hasTable(MESSAGES_TABLE))) {
      await knex.schema.createTable(MESSAGES_TABLE, table => {
        table.string('id').primary().notNullable();
        table.string('session_id').notNullable();
        table.string('role').notNullable();
        table.text('content').notNullable();
        table
          .timestamp('created_at', { useTz: true })
          .defaultTo(knex.fn.now())
          .notNullable();

        table.foreign('session_id').references('id').inTable(SESSIONS_TABLE);
        table.index('session_id');
      });
      this.logger.info(`Created ${MESSAGES_TABLE} table`);
    }

    if (!(await knex.schema.hasTable(FEEDBACK_TABLE))) {
      await knex.schema.createTable(FEEDBACK_TABLE, table => {
        table.string('id').primary().notNullable();
        table.string('session_id').notNullable();
        table.string('message_id').notNullable();
        table.string('sentiment').notNullable();
        table.text('reason').nullable();
        table.string('created_by').notNullable();
        table
          .timestamp('created_at', { useTz: true })
          .defaultTo(knex.fn.now())
          .notNullable();

        table.foreign('session_id').references('id').inTable(SESSIONS_TABLE);
        table.foreign('message_id').references('id').inTable(MESSAGES_TABLE);
        table.index('message_id');
      });
      this.logger.info(`Created ${FEEDBACK_TABLE} table`);
    }
  }

  // -------------------------------------------------------------------------
  // Row → Record conversions
  // -------------------------------------------------------------------------

  private sessionToSummary(row: SessionRow): ConversationSummary {
    return {
      id: row.id,
      title: row.title,
      createdBy: row.created_by,
      providerId: row.provider_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private messageToRecord(row: MessageRow): ConversationMessage {
    return {
      id: row.id,
      role: row.role,
      content: row.content,
      createdAt: row.created_at,
    };
  }

  private feedbackToRecord(row: FeedbackRow): FeedbackRecord {
    return {
      id: row.id,
      sessionId: row.session_id,
      messageId: row.message_id,
      sentiment: row.sentiment,
      reason: row.reason ?? undefined,
      createdBy: row.created_by,
      createdAt: row.created_at,
    };
  }

  // -------------------------------------------------------------------------
  // Session operations
  // -------------------------------------------------------------------------

  /**
   * List conversation sessions for a user, optionally filtered by provider.
   *
   * @param createdBy - The user entity ref to scope sessions.
   * @param providerId - Optional provider ID to filter by.
   * @returns Matching sessions ordered by most recent update.
   */
  async listSessions(
    createdBy: string,
    providerId?: string,
  ): Promise<ConversationSummary[]> {
    const knex = await this.getDb();
    let query = knex<SessionRow>(SESSIONS_TABLE)
      .where({ created_by: createdBy })
      .orderBy('updated_at', 'desc');

    if (providerId) {
      query = query.where({ provider_id: providerId });
    }

    const rows = await query.select();
    return rows.map(row => this.sessionToSummary(row));
  }

  /**
   * List all conversation sessions (admin view, no user scoping).
   *
   * @param providerId - Optional provider ID to filter by.
   * @returns All sessions ordered by most recent update.
   */
  async listAllSessions(providerId?: string): Promise<ConversationSummary[]> {
    const knex = await this.getDb();
    let query = knex<SessionRow>(SESSIONS_TABLE).orderBy('updated_at', 'desc');

    if (providerId) {
      query = query.where({ provider_id: providerId });
    }

    const rows = await query.select();
    return rows.map(row => this.sessionToSummary(row));
  }

  /**
   * Search sessions by keyword in message content.
   *
   * @param createdBy - The user entity ref to scope the search.
   * @param keyword - The search term to match in message content.
   * @returns Matching sessions ordered by most recent update.
   */
  async searchSessions(
    createdBy: string,
    keyword: string,
  ): Promise<ConversationSummary[]> {
    const knex = await this.getDb();
    const escaped = keyword.replace(/[%_\\]/g, c => `\\${c}`);
    const rows = await knex<SessionRow>(SESSIONS_TABLE)
      .whereIn(
        'id',
        knex<MessageRow>(MESSAGES_TABLE)
          .select('session_id')
          .where('content', 'like', `%${escaped}%`),
      )
      .where({ created_by: createdBy })
      .orderBy('updated_at', 'desc')
      .select();
    return rows.map(row => this.sessionToSummary(row));
  }

  /**
   * Get a session with all its messages.
   *
   * @param sessionId - The session identifier.
   * @returns The full conversation details or undefined if not found.
   */
  async getSession(
    sessionId: string,
  ): Promise<ConversationDetails | undefined> {
    const knex = await this.getDb();
    const session = await knex<SessionRow>(SESSIONS_TABLE)
      .where({ id: sessionId })
      .first();
    if (!session) {
      return undefined;
    }

    const messages = await knex<MessageRow>(MESSAGES_TABLE)
      .where({ session_id: sessionId })
      .orderBy('created_at', 'asc')
      .select();

    return {
      id: session.id,
      title: session.title,
      createdBy: session.created_by,
      providerId: session.provider_id,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
      messages: messages.map(m => this.messageToRecord(m)),
    };
  }

  /**
   * Create a new conversation session.
   *
   * @param session - Session details to create.
   * @returns The created session summary.
   */
  async createSession(session: {
    id: string;
    title: string;
    providerId: string;
    createdBy: string;
  }): Promise<ConversationSummary> {
    const knex = await this.getDb();
    const now = knex.fn.now() as unknown as string;

    await knex<SessionRow>(SESSIONS_TABLE).insert({
      id: session.id,
      title: session.title,
      provider_id: session.providerId,
      created_by: session.createdBy,
      created_at: now,
      updated_at: now,
    });

    this.logger.info(`Session created: ${session.id} by ${session.createdBy}`);

    const created = await knex<SessionRow>(SESSIONS_TABLE)
      .where({ id: session.id })
      .first();
    return this.sessionToSummary(created!);
  }

  /**
   * Delete a conversation session and its messages and feedback.
   *
   * @param sessionId - The session to delete.
   * @returns `true` if the session was deleted, `false` if not found.
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    const knex = await this.getDb();
    return knex.transaction(async trx => {
      await trx<FeedbackRow>(FEEDBACK_TABLE)
        .where({ session_id: sessionId })
        .delete();
      await trx<MessageRow>(MESSAGES_TABLE)
        .where({ session_id: sessionId })
        .delete();
      const deleted = await trx<SessionRow>(SESSIONS_TABLE)
        .where({ id: sessionId })
        .delete();

      if (deleted > 0) {
        this.logger.info(`Session deleted: ${sessionId}`);
        return true;
      }
      return false;
    });
  }

  // -------------------------------------------------------------------------
  // Message operations
  // -------------------------------------------------------------------------

  /**
   * Add a message to a session. Updates the session's `updated_at` timestamp.
   *
   * @param message - The message to add.
   * @returns The created message record.
   */
  async addMessage(message: {
    id: string;
    sessionId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
  }): Promise<ConversationMessage> {
    const knex = await this.getDb();
    const now = knex.fn.now() as unknown as string;

    // Verify session exists
    const session = await knex<SessionRow>(SESSIONS_TABLE)
      .where({ id: message.sessionId })
      .first();
    if (!session) {
      throw new NotFoundError(`Session "${message.sessionId}" not found`);
    }

    await knex<MessageRow>(MESSAGES_TABLE).insert({
      id: message.id,
      session_id: message.sessionId,
      role: message.role,
      content: message.content,
      created_at: now,
    });

    // Touch session updated_at
    await knex<SessionRow>(SESSIONS_TABLE)
      .where({ id: message.sessionId })
      .update({ updated_at: now });

    const created = await knex<MessageRow>(MESSAGES_TABLE)
      .where({ id: message.id })
      .first();
    return this.messageToRecord(created!);
  }

  // -------------------------------------------------------------------------
  // Feedback operations
  // -------------------------------------------------------------------------

  /**
   * Submit feedback on a message.
   *
   * @param feedback - The feedback to record.
   * @returns The created feedback record.
   */
  async addFeedback(feedback: {
    id: string;
    sessionId: string;
    messageId: string;
    sentiment: 'positive' | 'negative';
    reason?: string;
    createdBy: string;
  }): Promise<FeedbackRecord> {
    const knex = await this.getDb();
    const now = knex.fn.now() as unknown as string;

    // Verify message exists
    const message = await knex<MessageRow>(MESSAGES_TABLE)
      .where({ id: feedback.messageId, session_id: feedback.sessionId })
      .first();
    if (!message) {
      throw new NotFoundError(
        `Message "${feedback.messageId}" not found in session "${feedback.sessionId}"`,
      );
    }

    await knex<FeedbackRow>(FEEDBACK_TABLE).insert({
      id: feedback.id,
      session_id: feedback.sessionId,
      message_id: feedback.messageId,
      sentiment: feedback.sentiment,
      reason: feedback.reason ?? null,
      created_by: feedback.createdBy,
      created_at: now,
    });

    this.logger.info(
      `Feedback ${feedback.sentiment} recorded on message ${feedback.messageId}`,
    );

    const created = await knex<FeedbackRow>(FEEDBACK_TABLE)
      .where({ id: feedback.id })
      .first();
    return this.feedbackToRecord(created!);
  }

  /**
   * List feedback for a session.
   *
   * @param sessionId - The session identifier.
   * @returns All feedback records for the session.
   */
  async listFeedback(sessionId: string): Promise<FeedbackRecord[]> {
    const knex = await this.getDb();
    const rows = await knex<FeedbackRow>(FEEDBACK_TABLE)
      .where({ session_id: sessionId })
      .orderBy('created_at', 'asc')
      .select();
    return rows.map(row => this.feedbackToRecord(row));
  }
}
