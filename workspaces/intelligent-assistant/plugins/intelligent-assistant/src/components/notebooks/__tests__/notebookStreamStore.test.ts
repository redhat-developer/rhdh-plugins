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

import { TEMP_CONVERSATION_ID } from '../../../const';
import {
  createNotebookStreamStore,
  NotebookSendParams,
  NotebookStreamStore,
} from '../notebookStreamStore';

jest.mock('../../../utils/queryClient', () => ({
  __esModule: true,
  default: {
    setQueryData: jest.fn(),
    invalidateQueries: jest.fn(),
  },
}));

jest.mock('../../../hooks/toolCallsCacheStore', () => ({
  clearSharedToolCallsCacheSessionPrefix: jest.fn(),
  migrateSharedToolCallsCacheSessionPrefixToConversation: jest.fn(),
  setSharedToolCallsCache: jest.fn(),
}));

jest.mock('../../../utils/stream-event-helpers', () => ({
  ...jest.requireActual('../../../utils/stream-event-helpers'),
  createTempToolCallsCacheSessionPrefix: () => 'lightspeed-temp:test-prefix',
}));

function encodeSSE(event: string, data: Record<string, any>): Uint8Array {
  const json = JSON.stringify({ event, data });
  return new TextEncoder().encode(`data:${json}\n\n`);
}

function createMockReader(
  chunks: Uint8Array[],
): ReadableStreamDefaultReader<Uint8Array> {
  let index = 0;
  return {
    read: jest.fn(async () => {
      if (index >= chunks.length) {
        return { done: true as const, value: undefined };
      }
      const value = chunks[index++];
      return { done: false as const, value };
    }),
    releaseLock: jest.fn(),
    cancel: jest.fn(),
    closed: Promise.resolve(undefined),
  } as unknown as ReadableStreamDefaultReader<Uint8Array>;
}

function createDeferredReader(): {
  reader: ReadableStreamDefaultReader<Uint8Array>;
  push: (chunk: Uint8Array) => void;
  end: () => void;
} {
  const pending: Array<{
    resolve: (r: ReadableStreamReadResult<Uint8Array>) => void;
  }> = [];
  const buffer: Uint8Array[] = [];
  let ended = false;

  const reader = {
    read: jest.fn(
      () =>
        new Promise<ReadableStreamReadResult<Uint8Array>>(resolve => {
          if (buffer.length > 0) {
            resolve({ done: false, value: buffer.shift()! });
          } else if (ended) {
            resolve({ done: true, value: undefined } as any);
          } else {
            pending.push({ resolve });
          }
        }),
    ),
    releaseLock: jest.fn(),
    cancel: jest.fn(),
    closed: Promise.resolve(undefined),
  } as unknown as ReadableStreamDefaultReader<Uint8Array>;

  return {
    reader,
    push(chunk: Uint8Array) {
      if (pending.length > 0) {
        pending.shift()!.resolve({ done: false, value: chunk });
      } else {
        buffer.push(chunk);
      }
    },
    end() {
      ended = true;
      for (const p of pending) {
        p.resolve({ done: true, value: undefined } as any);
      }
      pending.length = 0;
    },
  };
}

function makeParams(
  overrides?: Partial<NotebookSendParams>,
): NotebookSendParams {
  return {
    prompt: 'hello',
    seedMessages: [],
    conversationId: 'conv-1',
    userName: 'user',
    avatar: 'avatar.png',
    botAvatar: 'bot.png',
    selectedModel: 'model-a',
    createMessage: jest.fn(),
    ...overrides,
  };
}

async function flushMicrotasks() {
  await new Promise(resolve => setTimeout(resolve, 0));
}

describe('notebookStreamStore', () => {
  let store: NotebookStreamStore;

  beforeEach(() => {
    store = createNotebookStreamStore();
  });

  describe('subscribe / getSnapshot', () => {
    it('returns idle snapshot for unknown sessions', () => {
      const snap = store.getSnapshot('unknown');
      expect(snap.status).toBe('idle');
      expect(snap.messages).toEqual([]);
    });

    it('notifies listeners on state change', () => {
      const listener = jest.fn();
      store.subscribe('s1', listener);

      const reader = createMockReader([encodeSSE('token', { token: 'hi' })]);
      const createMessage = jest.fn().mockResolvedValue(reader);
      store.send('s1', makeParams({ createMessage }));

      expect(listener).toHaveBeenCalled();
    });

    it('unsubscribe removes listener', async () => {
      const listener = jest.fn();
      const unsub = store.subscribe('s1', listener);
      unsub();

      const reader = createMockReader([encodeSSE('token', { token: 'hi' })]);
      const createMessage = jest.fn().mockResolvedValue(reader);
      store.send('s1', makeParams({ createMessage }));
      await flushMicrotasks();

      expect(listener).toHaveBeenCalledTimes(0);
    });

    it('snapshot survives subscribe/unsubscribe/re-subscribe (remount)', async () => {
      const reader = createMockReader([encodeSSE('token', { token: 'hi' })]);
      const createMessage = jest.fn().mockResolvedValue(reader);
      store.send('s1', makeParams({ createMessage }));
      await flushMicrotasks();

      const snap1 = store.getSnapshot('s1');
      expect(snap1.status).toBe('complete');

      const listener1 = jest.fn();
      const unsub = store.subscribe('s1', listener1);
      unsub();

      const listener2 = jest.fn();
      store.subscribe('s1', listener2);
      const snap2 = store.getSnapshot('s1');
      expect(snap2).toBe(snap1);
    });
  });

  describe('send — happy path', () => {
    it('streams tokens and reaches complete status', async () => {
      const reader = createMockReader([
        encodeSSE('start', { request_id: 'req-1' }),
        encodeSSE('token', { token: 'Hello' }),
        encodeSSE('token', { token: ' world' }),
        encodeSSE('end', { referenced_documents: [] }),
      ]);
      const createMessage = jest.fn().mockResolvedValue(reader);
      store.send('s1', makeParams({ createMessage }));
      await flushMicrotasks();

      const snap = store.getSnapshot('s1');
      expect(snap.status).toBe('complete');
      expect(snap.requestId).toBe('req-1');
      const lastMsg = snap.messages[snap.messages.length - 1];
      expect(lastMsg.content).toContain('Hello world');
    });

    it('passes abort signal to createMessage', async () => {
      const reader = createMockReader([]);
      const createMessage = jest.fn().mockResolvedValue(reader);
      store.send('s1', makeParams({ createMessage }));
      await flushMicrotasks();

      expect(createMessage).toHaveBeenCalledWith('hello', {
        signal: expect.any(AbortSignal),
      });
    });

    it('rejects empty prompts', () => {
      const createMessage = jest.fn();
      store.send('s1', makeParams({ prompt: '   ', createMessage }));
      expect(createMessage).not.toHaveBeenCalled();
      expect(store.getSnapshot('s1').status).toBe('idle');
    });
  });

  describe('stop — abort race protection', () => {
    it('stop sets status to stopped and it is not overwritten', async () => {
      const { reader, push, end } = createDeferredReader();
      const createMessage = jest.fn().mockResolvedValue(reader);

      store.send('s1', makeParams({ createMessage }));
      await flushMicrotasks();

      expect(store.getSnapshot('s1').status).toBe('streaming');

      store.stop('s1');
      expect(store.getSnapshot('s1').status).toBe('stopped');

      push(encodeSSE('token', { token: 'late data' }));
      end();
      await flushMicrotasks();

      expect(store.getSnapshot('s1').status).toBe('stopped');
    });

    it('stop sets isLoading to false on the last message', async () => {
      const { reader, push } = createDeferredReader();
      const createMessage = jest.fn().mockResolvedValue(reader);

      store.send('s1', makeParams({ createMessage }));
      await flushMicrotasks();

      push(encodeSSE('start', { request_id: 'req-1' }));
      await flushMicrotasks();

      store.stop('s1');
      const snap = store.getSnapshot('s1');
      const lastMsg = snap.messages[snap.messages.length - 1];
      expect(lastMsg.isLoading).toBe(false);
    });
  });

  describe('rapid send — generation protection', () => {
    it('old stream cannot overwrite new stream messages', async () => {
      const {
        reader: reader1,
        push: push1,
        end: end1,
      } = createDeferredReader();
      const {
        reader: reader2,
        push: push2,
        end: end2,
      } = createDeferredReader();

      const createMessage1 = jest.fn().mockResolvedValue(reader1);
      const createMessage2 = jest.fn().mockResolvedValue(reader2);

      store.send(
        's1',
        makeParams({ prompt: 'first', createMessage: createMessage1 }),
      );
      await flushMicrotasks();

      store.send(
        's1',
        makeParams({ prompt: 'second', createMessage: createMessage2 }),
      );
      await flushMicrotasks();

      push1(encodeSSE('token', { token: 'stale data from run 1' }));
      end1();
      await flushMicrotasks();

      push2(encodeSSE('token', { token: 'fresh' }));
      end2();
      await flushMicrotasks();

      const snap = store.getSnapshot('s1');
      expect(snap.status).toBe('complete');
      const lastMsg = snap.messages[snap.messages.length - 1];
      expect(lastMsg.content).toContain('fresh');
      expect(lastMsg.content).not.toContain('stale');
    });

    it('old stream does not emit complete after new stream starts', async () => {
      const { reader: reader1, end: end1 } = createDeferredReader();
      const {
        reader: reader2,
        push: push2,
        end: end2,
      } = createDeferredReader();

      const createMessage1 = jest.fn().mockResolvedValue(reader1);
      const createMessage2 = jest.fn().mockResolvedValue(reader2);

      store.send('s1', makeParams({ createMessage: createMessage1 }));
      await flushMicrotasks();

      store.send('s1', makeParams({ createMessage: createMessage2 }));
      await flushMicrotasks();

      end1();
      await flushMicrotasks();

      expect(store.getSnapshot('s1').status).toBe('streaming');

      push2(encodeSSE('end', { referenced_documents: [] }));
      end2();
      await flushMicrotasks();

      expect(store.getSnapshot('s1').status).toBe('complete');
    });
  });

  describe('temp → real conversation id migration', () => {
    it('migrates conversation id when server returns one', async () => {
      const { migrateSharedToolCallsCacheSessionPrefixToConversation } =
        jest.requireMock('../../../hooks/toolCallsCacheStore');
      const { default: queryClient } = jest.requireMock(
        '../../../utils/queryClient',
      );

      const reader = createMockReader([
        encodeSSE('start', {
          request_id: 'req-1',
          conversation_id: 'real-conv-123',
        }),
        encodeSSE('token', { token: 'hi' }),
        encodeSSE('end', { referenced_documents: [] }),
      ]);
      const createMessage = jest.fn().mockResolvedValue(reader);

      store.send(
        's1',
        makeParams({
          conversationId: TEMP_CONVERSATION_ID,
          createMessage,
        }),
      );
      await flushMicrotasks();

      const snap = store.getSnapshot('s1');
      expect(snap.conversationId).toBe('real-conv-123');
      expect(snap.status).toBe('complete');

      expect(
        migrateSharedToolCallsCacheSessionPrefixToConversation,
      ).toHaveBeenCalledWith('lightspeed-temp:test-prefix', 'real-conv-123');

      expect(queryClient.setQueryData).toHaveBeenCalled();
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['conversationMessages', 'real-conv-123'],
      });
    });

    it('clears temp cache when no real id is returned', async () => {
      const { clearSharedToolCallsCacheSessionPrefix } = jest.requireMock(
        '../../../hooks/toolCallsCacheStore',
      );

      const reader = createMockReader([
        encodeSSE('start', { request_id: 'req-1' }),
        encodeSSE('end', { referenced_documents: [] }),
      ]);
      const createMessage = jest.fn().mockResolvedValue(reader);

      store.send(
        's1',
        makeParams({
          conversationId: TEMP_CONVERSATION_ID,
          createMessage,
        }),
      );
      await flushMicrotasks();

      expect(clearSharedToolCallsCacheSessionPrefix).toHaveBeenCalledWith(
        'lightspeed-temp:test-prefix',
      );
    });
  });

  describe('error handling', () => {
    it('sets error status when createMessage throws', async () => {
      const createMessage = jest
        .fn()
        .mockRejectedValue(new Error('network failure'));

      store.send('s1', makeParams({ createMessage }));
      await flushMicrotasks();

      const snap = store.getSnapshot('s1');
      expect(snap.status).toBe('error');
    });

    it('does not set error status if aborted before error', async () => {
      const createMessage = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        throw new Error('network failure');
      });

      store.send('s1', makeParams({ createMessage }));
      store.stop('s1');
      await flushMicrotasks();

      const snap = store.getSnapshot('s1');
      expect(snap.status).toBe('stopped');
    });
  });

  describe('clear / clearAll', () => {
    it('clear resets a session to idle', async () => {
      const reader = createMockReader([encodeSSE('token', { token: 'hi' })]);
      const createMessage = jest.fn().mockResolvedValue(reader);
      store.send('s1', makeParams({ createMessage }));
      await flushMicrotasks();

      store.clear('s1');
      expect(store.getSnapshot('s1').status).toBe('idle');
    });

    it('clearAll resets all sessions', async () => {
      const reader1 = createMockReader([encodeSSE('token', { token: 'a' })]);
      const reader2 = createMockReader([encodeSSE('token', { token: 'b' })]);

      store.send(
        's1',
        makeParams({ createMessage: jest.fn().mockResolvedValue(reader1) }),
      );
      store.send(
        's2',
        makeParams({ createMessage: jest.fn().mockResolvedValue(reader2) }),
      );
      await flushMicrotasks();

      store.clearAll();
      expect(store.getSnapshot('s1').status).toBe('idle');
      expect(store.getSnapshot('s2').status).toBe('idle');
    });
  });
});
