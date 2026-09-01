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

import { MessageProps } from '@patternfly/chatbot';

import { TEMP_CONVERSATION_ID } from '../../const';
import {
  clearSharedToolCallsCacheSessionPrefix,
  migrateSharedToolCallsCacheSessionPrefixToConversation,
  setSharedToolCallsCache,
} from '../../hooks/toolCallsCacheStore';
import { NotebookSession, ToolCall } from '../../types';
import {
  createBotMessage,
  createUserMessage,
  getTimestamp,
  normalizeChatUserInput,
  transformDocumentsToSources,
} from '../../utils/lightspeed-chatbox-utils';
import queryClient from '../../utils/queryClient';
import {
  applyToolResultToToolCalls,
  createTempToolCallsCacheSessionPrefix,
  normalizeToolCalls,
  parseSSEBuffer,
  parseToolCallFromEvent,
  parseToolResultFromEvent,
  toolCallIdKey,
} from '../../utils/stream-event-helpers';

/**
 * External store that owns notebook message streaming, keyed by notebook
 * `sessionId`. The store lives above the display-mode remount boundary
 * (mounted by {@link NotebookStreamProvider}) so a stream started in one mode
 * (overlay/docked/fullscreen) keeps running when the notebook view unmounts and
 * remounts in another mode. The view is a pure subscriber: it never owns the
 * stream lifecycle, and the stream is aborted only on explicit intent
 * (stop/close/delete/provider-unmount), never on unmount.
 */

export type ExtendedMessageProps = MessageProps & { toolCalls?: ToolCall[] };

export type NotebookStreamStatus =
  'idle' | 'streaming' | 'complete' | 'stopped' | 'error';

export interface NotebookStreamSnapshot {
  messages: ExtendedMessageProps[];
  conversationId: string;
  requestId: string;
  status: NotebookStreamStatus;
}

export interface NotebookSendParams {
  prompt: string;
  /** Current on-screen messages the new turn is appended to. */
  seedMessages: ExtendedMessageProps[];
  /** Current conversation id (may be the provisional temp id). */
  conversationId: string;
  userName?: string;
  avatar: string;
  botAvatar: string;
  selectedModel: string;
  /** Bound to the notebook session; returns the SSE reader. */
  createMessage: (
    prompt: string,
    options?: { signal?: AbortSignal },
  ) => Promise<ReadableStreamDefaultReader<Uint8Array>>;
}

export interface NotebookStreamStore {
  subscribe(sessionId: string, listener: () => void): () => void;
  getSnapshot(sessionId: string): NotebookStreamSnapshot;
  send(sessionId: string, params: NotebookSendParams): void;
  stop(sessionId: string): void;
  clear(sessionId: string): void;
  clearAll(): void;
}

const IDLE_SNAPSHOT: NotebookStreamSnapshot = Object.freeze({
  messages: [],
  conversationId: '',
  requestId: '',
  status: 'idle',
});

interface Entry {
  snapshot: NotebookStreamSnapshot;
  listeners: Set<() => void>;
  abort?: AbortController;
  generation: number;
  pendingToolCalls: Record<string, ToolCall>;
}

export function createNotebookStreamStore(): NotebookStreamStore {
  const entries = new Map<string, Entry>();

  const ensureEntry = (sessionId: string): Entry => {
    let entry = entries.get(sessionId);
    if (!entry) {
      entry = {
        snapshot: IDLE_SNAPSHOT,
        listeners: new Set(),
        generation: 0,
        pendingToolCalls: {},
      };
      entries.set(sessionId, entry);
    }
    return entry;
  };

  const emit = (
    sessionId: string,
    next: Partial<NotebookStreamSnapshot> & {
      messages?: ExtendedMessageProps[];
    },
  ) => {
    const entry = ensureEntry(sessionId);
    entry.snapshot = { ...entry.snapshot, ...next };
    entry.listeners.forEach(l => l());
  };

  const updateSessionConversationId = (
    sessionId: string,
    conversationId: string,
  ) => {
    queryClient.setQueryData<NotebookSession>(
      ['notebooks', 'session', sessionId],
      old =>
        old
          ? {
              ...old,
              metadata: { ...old.metadata, conversation_id: conversationId },
            }
          : old,
    );
  };

  async function runStream(sessionId: string, params: NotebookSendParams) {
    const {
      prompt,
      seedMessages,
      userName,
      avatar,
      botAvatar,
      selectedModel,
      createMessage,
    } = params;

    const entry = ensureEntry(sessionId);
    const signal = entry.abort!.signal;
    const runGeneration = entry.generation;
    entry.pendingToolCalls = {};

    const isStale = () => signal.aborted || entry.generation !== runGeneration;

    let convId = params.conversationId;
    let requestId = '';
    let newConversationId = '';
    const startedOnTemp = convId === TEMP_CONVERSATION_ID;
    const toolCallsCacheKeyPrefix = startedOnTemp
      ? createTempToolCallsCacheSessionPrefix()
      : convId;

    let working: ExtendedMessageProps[] = [
      ...seedMessages,
      createUserMessage({
        avatar,
        name: userName,
        content: prompt,
        timestamp: getTimestamp(Date.now()) ?? '',
      }),
      createBotMessage({
        avatar: botAvatar,
        isLoading: true,
        name: selectedModel,
        content: '',
        timestamp: '',
      }),
    ];

    const commit = (status: NotebookStreamStatus = 'streaming') =>
      emit(sessionId, {
        messages: [...working],
        conversationId: convId,
        requestId,
        status,
      });

    const updateLast = (
      fn: (msg: ExtendedMessageProps) => ExtendedMessageProps,
    ) => {
      if (working.length === 0) return;
      const lastIndex = working.length - 1;
      working = [...working.slice(0, lastIndex), fn({ ...working[lastIndex] })];
    };

    commit('streaming');

    const finalMessages: string[] = [];
    let buffer = '';

    try {
      const reader = await createMessage(prompt, { signal });
      if (isStale()) return;

      const decoder = new TextDecoder('utf-8');
      let streamEnded = false;

      while (!streamEnded) {
        if (isStale()) return;

        const { value, done } = await reader.read();
        if (isStale()) return;
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const { events: parsedEvents, remainder } = parseSSEBuffer(buffer);
        buffer = remainder;

        for (const { event, data } of parsedEvents) {
          if (event === 'start') {
            requestId = data?.request_id;
            if (startedOnTemp) {
              newConversationId = data?.conversation_id;
              if (newConversationId) {
                updateSessionConversationId(sessionId, newConversationId);
              }
            }
            commit('streaming');
          }

          if (event === 'tool_call') {
            const toolCall = parseToolCallFromEvent(data);

            if (toolCall && data.id !== null) {
              entry.pendingToolCalls[toolCallIdKey(data.id)] = toolCall;
              const lastIndex = working.length - 1;
              const messageIndex = Math.floor(lastIndex / 2);
              updateLast(last => {
                const nextToolCalls = [
                  ...normalizeToolCalls(last.toolCalls),
                  toolCall,
                ];
                setSharedToolCallsCache(
                  `${toolCallsCacheKeyPrefix}-${messageIndex}`,
                  nextToolCalls,
                );
                return { ...last, toolCalls: nextToolCalls };
              });
              commit('streaming');
            }
          }

          if (event === 'tool_result') {
            const result = parseToolResultFromEvent(
              data,
              entry.pendingToolCalls,
            );

            if (result) {
              const lastIndex = working.length - 1;
              const messageIndex = Math.floor(lastIndex / 2);
              updateLast(last => {
                const updatedToolCalls = applyToolResultToToolCalls(
                  last.toolCalls || [],
                  result,
                );
                setSharedToolCallsCache(
                  `${toolCallsCacheKeyPrefix}-${messageIndex}`,
                  updatedToolCalls,
                );
                return { ...last, toolCalls: updatedToolCalls };
              });
              delete entry.pendingToolCalls[result.toolIdKey];
              commit('streaming');
            }
          }

          if (event === 'token') {
            const content = data?.token || '';
            finalMessages.push(content);
            updateLast(last => {
              const next = { ...last };
              if ((next.content ?? '').trim().length > 0) {
                next.isLoading = false;
              }
              next.content = (next.content ?? '') + content;
              next.name = data?.response_metadata?.model || selectedModel;
              next.timestamp = getTimestamp(
                data?.response_metadata?.created_at || Date.now(),
              );
              return next;
            });
            commit('streaming');
          }

          if (event === 'interrupted') {
            if (startedOnTemp && data?.conversation_id) {
              newConversationId = data.conversation_id;
            }
            updateLast(last => ({ ...last, isLoading: false }));
            commit('streaming');
            streamEnded = true;
            break;
          }

          if (event === 'end') {
            const documents = data?.referenced_documents || [];
            const sources = transformDocumentsToSources(documents);
            updateLast(last => ({
              ...last,
              isLoading: false,
              ...(sources ? { sources } : {}),
            }));
            commit('streaming');
          }
        }
        if (streamEnded) break;
      }
    } catch (e: any) {
      if (isStale()) return;
      updateLast(last => ({
        ...last,
        isLoading: false,
        content: `${last.content ?? ''}${e}`,
        error: { title: e?.message },
        timestamp: getTimestamp(Date.now()),
      }));
      finalMessages.push(`${e}`);
      emit(sessionId, {
        messages: [...working],
        conversationId: newConversationId || convId,
        requestId,
        status: 'error',
      });
      return;
    }

    if (isStale()) return;

    // Migrate temp conversation to its real id (tool-call cache + session cache).
    if (startedOnTemp && newConversationId) {
      migrateSharedToolCallsCacheSessionPrefixToConversation(
        toolCallsCacheKeyPrefix,
        newConversationId,
      );
      convId = newConversationId;
      updateSessionConversationId(sessionId, newConversationId);
    } else if (startedOnTemp) {
      clearSharedToolCallsCacheSessionPrefix(toolCallsCacheKeyPrefix);
    }

    // Status stays 'complete' (never reverts to 'idle') so the in-memory
    // transcript is preserved across remounts. The view layer merges this with
    // react-query's refetch which fires after invalidation below. If the
    // notebook is later closed/deleted, clear() drops the entry entirely and
    // getSnapshot falls back to IDLE_SNAPSHOT; the next open re-fetches from
    // the server via useConversationMessages.
    commit('complete');

    queryClient.invalidateQueries({
      queryKey: ['conversationMessages', convId],
    });
    queryClient.invalidateQueries({ queryKey: ['notebooks', 'sessions'] });
  }

  return {
    subscribe(sessionId, listener) {
      const entry = ensureEntry(sessionId);
      entry.listeners.add(listener);
      return () => {
        entry.listeners.delete(listener);
      };
    },

    getSnapshot(sessionId) {
      return entries.get(sessionId)?.snapshot ?? IDLE_SNAPSHOT;
    },

    send(sessionId, params) {
      if (!normalizeChatUserInput(params.prompt)) return;
      const entry = ensureEntry(sessionId);
      entry.abort?.abort();
      entry.abort = new AbortController();
      entry.generation++;
      void runStream(sessionId, params);
    },

    stop(sessionId) {
      const entry = entries.get(sessionId);
      if (!entry) return;
      entry.abort?.abort();
      const messages = entry.snapshot.messages;
      const lastIndex = messages.length - 1;
      const nextMessages =
        lastIndex >= 0
          ? [
              ...messages.slice(0, lastIndex),
              { ...messages[lastIndex], isLoading: false },
            ]
          : messages;
      emit(sessionId, {
        messages: nextMessages,
        requestId: '',
        status: 'stopped',
      });
    },

    clear(sessionId) {
      const entry = entries.get(sessionId);
      if (!entry) return;
      entry.abort?.abort();
      entries.delete(sessionId);
    },

    clearAll() {
      entries.forEach(entry => entry.abort?.abort());
      entries.clear();
    },
  };
}
