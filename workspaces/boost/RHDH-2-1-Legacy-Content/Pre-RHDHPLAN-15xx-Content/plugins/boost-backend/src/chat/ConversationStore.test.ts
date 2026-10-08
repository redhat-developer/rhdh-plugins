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
import { ConversationStore } from './ConversationStore';

function createMockLogger(): LoggerService {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  };
}

/**
 * Creates a mock Knex client that operates on in-memory arrays,
 * following the pattern used by AdminConfigService.test.ts.
 */
function createMockKnex() {
  const sessions: Array<{
    id: string;
    title: string;
    provider_id: string;
    created_by: string;
    created_at: string;
    updated_at: string;
  }> = [];

  const messages: Array<{
    id: string;
    session_id: string;
    role: string;
    content: string;
    created_at: string;
  }> = [];

  const feedback: Array<{
    id: string;
    session_id: string;
    message_id: string;
    sentiment: string;
    reason: string | null;
    created_by: string;
    created_at: string;
  }> = [];

  const schema = {
    hasTable: jest.fn().mockResolvedValue(true),
    createTable: jest.fn(),
  };

  function getStore(table: string) {
    if (table === 'boost_sessions') return sessions;
    if (table === 'boost_messages') return messages;
    if (table === 'boost_feedback') return feedback;
    return [];
  }

  function createQueryBuilder(tableName: string) {
    const store = getStore(tableName);
    let filters: Record<string, unknown> = {};
    let orderField: string | undefined;
    let orderDir: string | undefined;
    let whereInField: string | undefined;
    let whereInValues: unknown[] | undefined;
    const likeFilters: Array<{ field: string; pattern: string }> = [];
    let selectedColumn: string | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let whereInSubquery: any;
    const builder: Record<
      string,
      jest.Mock | ((...args: unknown[]) => unknown)
    > = {
      where: jest.fn((...args: unknown[]) => {
        if (args.length === 1 && typeof args[0] === 'object') {
          filters = { ...filters, ...(args[0] as Record<string, unknown>) };
        } else if (args.length === 3 && args[1] === 'like') {
          likeFilters.push({
            field: args[0] as string,
            pattern: args[2] as string,
          });
        }
        return builder;
      }),
      whereIn: jest.fn((field: string, values: unknown) => {
        whereInField = field;
        if (Array.isArray(values)) {
          whereInValues = values;
        } else {
          whereInSubquery = values;
        }
        return builder;
      }),
      orderBy: jest.fn((field: string, dir: string) => {
        orderField = field;
        orderDir = dir;
        return builder;
      }),
      first: jest.fn(async () => {
        const results = store.filter(row => {
          return Object.entries(filters).every(
            ([k, v]) => (row as Record<string, unknown>)[k] === v,
          );
        });
        return results[0] || undefined;
      }),
      select: jest.fn((...selectArgs: unknown[]) => {
        if (selectArgs.length > 0 && typeof selectArgs[0] === 'string') {
          selectedColumn = selectArgs[0] as string;
          return builder;
        }
        return (async () => {
          let resolvedWhereIn = whereInValues;
          if (whereInSubquery && whereInField) {
            // eslint-disable-next-line no-underscore-dangle
            resolvedWhereIn = await whereInSubquery._resolve();
          }
          let results = store.filter(row => {
            const matchFilters = Object.entries(filters).every(
              ([k, v]) => (row as Record<string, unknown>)[k] === v,
            );
            const matchLike = likeFilters.every(({ field, pattern }) => {
              const val = String((row as Record<string, unknown>)[field] ?? '');
              const inner = pattern.replace(/^%/, '').replace(/%$/, '');
              return val.includes(inner);
            });
            const matchWhereIn =
              !whereInField ||
              !resolvedWhereIn ||
              resolvedWhereIn.includes(
                (row as Record<string, unknown>)[whereInField!],
              );
            return matchFilters && matchLike && matchWhereIn;
          });
          if (orderField) {
            results = [...results].sort((a, b) => {
              const aVal = (a as Record<string, unknown>)[
                orderField!
              ] as string;
              const bVal = (b as Record<string, unknown>)[
                orderField!
              ] as string;
              return orderDir === 'asc'
                ? aVal.localeCompare(bVal)
                : bVal.localeCompare(aVal);
            });
          }
          return results;
        })();
      }),
      insert: jest.fn(async (row: Record<string, unknown>) => {
        const now = new Date().toISOString();
        const newRow = { ...row } as Record<string, unknown>;
        if (!newRow.created_at || newRow.created_at === 'NOW') {
          newRow.created_at = now;
        }
        if (!newRow.updated_at || newRow.updated_at === 'NOW') {
          newRow.updated_at = now;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (store as any[]).push(newRow);
        return [1];
      }),
      update: jest.fn(async (values: Record<string, unknown>) => {
        let count = 0;
        const now = new Date().toISOString();
        for (const row of store) {
          const match = Object.entries(filters).every(
            ([k, v]) => (row as Record<string, unknown>)[k] === v,
          );
          if (match) {
            for (const [k, v] of Object.entries(values)) {
              (row as Record<string, unknown>)[k] = v === 'NOW' ? now : v;
            }
            count++;
          }
        }
        return count;
      }),
      delete: jest.fn(async () => {
        let count = 0;
        for (let i = store.length - 1; i >= 0; i--) {
          const match = Object.entries(filters).every(
            ([k, v]) => (store[i] as Record<string, unknown>)[k] === v,
          );
          if (match) {
            store.splice(i, 1);
            count++;
          }
        }
        return count;
      }),
      index: jest.fn(),
      foreign: jest.fn().mockReturnValue({
        references: jest.fn().mockReturnValue({
          inTable: jest.fn(),
        }),
      }),
      _resolve: async () => {
        const results = store.filter(row => {
          const matchFilters = Object.entries(filters).every(
            ([k, v]) => (row as Record<string, unknown>)[k] === v,
          );
          const matchLike = likeFilters.every(({ field, pattern }) => {
            const val = String((row as Record<string, unknown>)[field] ?? '');
            const inner = pattern.replace(/^%/, '').replace(/%$/, '');
            return val.includes(inner);
          });
          return matchFilters && matchLike;
        });
        if (selectedColumn) {
          return results.map(
            r => (r as Record<string, unknown>)[selectedColumn!],
          );
        }
        return results;
      },
    };

    return builder;
  }

  // The knex callable + schema
  const knex = jest.fn((tableName: string) =>
    createQueryBuilder(tableName),
  ) as unknown as {
    (table: string): ReturnType<typeof createQueryBuilder>;
    schema: typeof schema;
    fn: { now: () => string };
  };
  knex.schema = schema;
  knex.fn = { now: () => 'NOW' as unknown as string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (knex as any).transaction = jest.fn(
    async (cb: (trx: typeof knex) => Promise<unknown>) => cb(knex),
  );

  return { knex, sessions, messages, feedback };
}

describe('ConversationStore', () => {
  let store: ConversationStore;
  let mock: ReturnType<typeof createMockKnex>;

  beforeEach(() => {
    mock = createMockKnex();
    const database: DatabaseService = {
      getClient: jest.fn().mockResolvedValue(mock.knex),
    };
    store = new ConversationStore({
      database,
      logger: createMockLogger(),
    });
  });

  afterEach(() => {
    mock.sessions.length = 0;
    mock.messages.length = 0;
    mock.feedback.length = 0;
  });

  describe('createSession', () => {
    it('creates and returns a session', async () => {
      const session = await store.createSession({
        id: 'sess-1',
        title: 'Test Session',
        providerId: 'test-provider',
        createdBy: 'user:default/alice',
      });

      expect(session.id).toBe('sess-1');
      expect(session.title).toBe('Test Session');
    });
  });

  describe('listSessions', () => {
    it('lists sessions for a specific user', async () => {
      await store.createSession({
        id: 'sess-1',
        title: 'Session 1',
        providerId: 'provider-a',
        createdBy: 'user:default/alice',
      });
      await store.createSession({
        id: 'sess-2',
        title: 'Session 2',
        providerId: 'provider-a',
        createdBy: 'user:default/bob',
      });

      const sessions = await store.listSessions('user:default/alice');
      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe('sess-1');
    });
  });

  describe('getSession', () => {
    it('returns session with messages', async () => {
      await store.createSession({
        id: 'sess-1',
        title: 'Session 1',
        providerId: 'provider-a',
        createdBy: 'user:default/alice',
      });
      await store.addMessage({
        id: 'msg-1',
        sessionId: 'sess-1',
        role: 'user',
        content: 'Hello',
      });

      const details = await store.getSession('sess-1');
      expect(details).toBeDefined();
      expect(details!.id).toBe('sess-1');
      expect(details!.messages).toHaveLength(1);
      expect(details!.messages[0].content).toBe('Hello');
    });

    it('returns undefined for non-existent session', async () => {
      const details = await store.getSession('nonexistent');
      expect(details).toBeUndefined();
    });
  });

  describe('deleteSession', () => {
    it('deletes a session and cascades', async () => {
      await store.createSession({
        id: 'sess-1',
        title: 'Session 1',
        providerId: 'provider-a',
        createdBy: 'user:default/alice',
      });
      await store.addMessage({
        id: 'msg-1',
        sessionId: 'sess-1',
        role: 'user',
        content: 'Hello',
      });

      const deleted = await store.deleteSession('sess-1');
      expect(deleted).toBe(true);
      expect(mock.sessions).toHaveLength(0);
      expect(mock.messages).toHaveLength(0);
    });

    it('returns false for non-existent session', async () => {
      const deleted = await store.deleteSession('nonexistent');
      expect(deleted).toBe(false);
    });
  });

  describe('addMessage', () => {
    it('adds a message to a session', async () => {
      await store.createSession({
        id: 'sess-1',
        title: 'Session 1',
        providerId: 'provider-a',
        createdBy: 'user:default/alice',
      });

      const message = await store.addMessage({
        id: 'msg-1',
        sessionId: 'sess-1',
        role: 'user',
        content: 'Hello world',
      });

      expect(message.id).toBe('msg-1');
      expect(message.role).toBe('user');
      expect(message.content).toBe('Hello world');
    });

    it('throws NotFoundError for non-existent session', async () => {
      await expect(
        store.addMessage({
          id: 'msg-1',
          sessionId: 'nonexistent',
          role: 'user',
          content: 'Hello',
        }),
      ).rejects.toThrow('Session "nonexistent" not found');
    });
  });

  describe('addFeedback', () => {
    it('adds feedback on a message', async () => {
      await store.createSession({
        id: 'sess-1',
        title: 'Session 1',
        providerId: 'provider-a',
        createdBy: 'user:default/alice',
      });
      await store.addMessage({
        id: 'msg-1',
        sessionId: 'sess-1',
        role: 'assistant',
        content: 'Here is the answer',
      });

      const fb = await store.addFeedback({
        id: 'fb-1',
        sessionId: 'sess-1',
        messageId: 'msg-1',
        sentiment: 'positive',
        reason: 'Helpful!',
        createdBy: 'user:default/alice',
      });

      expect(fb.sentiment).toBe('positive');
      expect(fb.reason).toBe('Helpful!');
    });

    it('throws NotFoundError for non-existent message', async () => {
      await store.createSession({
        id: 'sess-1',
        title: 'Session 1',
        providerId: 'provider-a',
        createdBy: 'user:default/alice',
      });

      await expect(
        store.addFeedback({
          id: 'fb-1',
          sessionId: 'sess-1',
          messageId: 'nonexistent',
          sentiment: 'negative',
          createdBy: 'user:default/alice',
        }),
      ).rejects.toThrow('Message "nonexistent" not found');
    });
  });

  describe('listAllSessions', () => {
    it('returns sessions for all users', async () => {
      await store.createSession({
        id: 'sess-1',
        title: 'Alice Session',
        providerId: 'provider-a',
        createdBy: 'user:default/alice',
      });
      await store.createSession({
        id: 'sess-2',
        title: 'Bob Session',
        providerId: 'provider-a',
        createdBy: 'user:default/bob',
      });

      const sessions = await store.listAllSessions();
      expect(sessions).toHaveLength(2);
    });

    it('filters by providerId', async () => {
      await store.createSession({
        id: 'sess-1',
        title: 'Session A',
        providerId: 'provider-a',
        createdBy: 'user:default/alice',
      });
      await store.createSession({
        id: 'sess-2',
        title: 'Session B',
        providerId: 'provider-b',
        createdBy: 'user:default/alice',
      });

      const sessions = await store.listAllSessions('provider-a');
      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe('sess-1');
    });
  });

  describe('searchSessions', () => {
    it('finds sessions by message content', async () => {
      await store.createSession({
        id: 'sess-1',
        title: 'Session 1',
        providerId: 'provider-a',
        createdBy: 'user:default/alice',
      });
      await store.addMessage({
        id: 'msg-1',
        sessionId: 'sess-1',
        role: 'user',
        content: 'How do I deploy to Kubernetes?',
      });

      await store.createSession({
        id: 'sess-2',
        title: 'Session 2',
        providerId: 'provider-a',
        createdBy: 'user:default/alice',
      });
      await store.addMessage({
        id: 'msg-2',
        sessionId: 'sess-2',
        role: 'user',
        content: 'What is OpenShift?',
      });

      const results = await store.searchSessions(
        'user:default/alice',
        'Kubernetes',
      );
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('sess-1');
    });

    it('scopes search to the requesting user', async () => {
      await store.createSession({
        id: 'sess-1',
        title: 'Alice Session',
        providerId: 'provider-a',
        createdBy: 'user:default/alice',
      });
      await store.addMessage({
        id: 'msg-1',
        sessionId: 'sess-1',
        role: 'user',
        content: 'deploy topic',
      });

      await store.createSession({
        id: 'sess-2',
        title: 'Bob Session',
        providerId: 'provider-a',
        createdBy: 'user:default/bob',
      });
      await store.addMessage({
        id: 'msg-2',
        sessionId: 'sess-2',
        role: 'user',
        content: 'deploy topic',
      });

      const results = await store.searchSessions(
        'user:default/alice',
        'deploy',
      );
      expect(results).toHaveLength(1);
      expect(results[0].createdBy).toBe('user:default/alice');
    });
  });

  describe('listFeedback', () => {
    it('lists feedback for a session', async () => {
      await store.createSession({
        id: 'sess-1',
        title: 'Session 1',
        providerId: 'provider-a',
        createdBy: 'user:default/alice',
      });
      await store.addMessage({
        id: 'msg-1',
        sessionId: 'sess-1',
        role: 'assistant',
        content: 'Answer',
      });
      await store.addFeedback({
        id: 'fb-1',
        sessionId: 'sess-1',
        messageId: 'msg-1',
        sentiment: 'negative',
        createdBy: 'user:default/alice',
      });

      const list = await store.listFeedback('sess-1');
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe('fb-1');
      expect(list[0].sentiment).toBe('negative');
    });
  });
});
