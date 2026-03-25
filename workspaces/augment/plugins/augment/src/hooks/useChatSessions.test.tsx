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

import { renderHook, act } from '@testing-library/react';
import {
  useChatSessions,
  UseChatSessionsApi,
  UseChatSessionsOptions,
} from './useChatSessions';
import type { ChatContainerRef } from '../components/ChatContainer';

function createMockApi(
  overrides: Partial<UseChatSessionsApi> = {},
): UseChatSessionsApi {
  return {
    getSessionMessages: jest.fn().mockResolvedValue({
      messages: [
        { role: 'user', text: 'Hello' },
        { role: 'assistant', text: 'Hi there!' },
      ],
      sessionCreatedAt: '2025-01-01T00:00:00Z',
    }),
    getAdminSessionMessages: jest.fn().mockResolvedValue({
      messages: [],
      sessionCreatedAt: '2025-01-01T00:00:00Z',
    }),
    ...overrides,
  };
}

function createMockChatContainerRef(
  overrides: Partial<ChatContainerRef> = {},
): React.RefObject<ChatContainerRef | null> {
  const ref: ChatContainerRef = {
    cancelOngoingRequest: jest.fn(),
    resetConversation: jest.fn(),
    setPreviousResponseId: jest.fn(),
    setConversationId: jest.fn(),
    setSessionId: jest.fn(),
    isStreaming: jest.fn().mockReturnValue(false),
    clearInput: jest.fn(),
    ...overrides,
  };
  return { current: ref } as React.RefObject<ChatContainerRef | null>;
}

function renderUseChatSessions(
  overrides: Partial<UseChatSessionsOptions> = {},
  apiOverrides: Partial<UseChatSessionsApi> = {},
) {
  const api = createMockApi(apiOverrides);
  const chatContainerRef = createMockChatContainerRef(
    overrides.chatContainerRef?.current
      ? (overrides.chatContainerRef.current as Partial<ChatContainerRef>)
      : {},
  );
  return renderHook(() =>
    useChatSessions({
      api,
      chatContainerRef,
      ...overrides,
      ...(overrides.chatContainerRef ? {} : { chatContainerRef }),
    }),
  );
}

describe('useChatSessions', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('initial state', () => {
    it('returns correct initial values', () => {
      const { result } = renderUseChatSessions();
      expect(result.current.activeSessionId).toBeUndefined();
      expect(result.current.messages).toEqual([]);
      expect(result.current.loadingConversation).toBe(false);
      expect(result.current.switchDialogOpen).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('handleSelectSession – error path', () => {
    it('clears activeSessionId and sets error on API failure', async () => {
      const api = createMockApi({
        getSessionMessages: jest
          .fn()
          .mockRejectedValue(new Error('Network failure')),
      });
      const chatContainerRef = createMockChatContainerRef();
      const { result } = renderHook(() =>
        useChatSessions({ api, chatContainerRef }),
      );

      await act(async () => {
        await result.current.handleSelectSession('sess-1');
      });

      expect(result.current.activeSessionId).toBeUndefined();
      expect(result.current.messages).toEqual([]);
      expect(result.current.error).toContain('Network failure');
      expect(result.current.loadingConversation).toBe(false);
    });

    it('sets generic error message for non-Error throws', async () => {
      const api = createMockApi({
        getSessionMessages: jest.fn().mockRejectedValue('string error'),
      });
      const chatContainerRef = createMockChatContainerRef();
      const { result } = renderHook(() =>
        useChatSessions({ api, chatContainerRef }),
      );

      await act(async () => {
        await result.current.handleSelectSession('sess-1');
      });

      expect(result.current.error).toBe('Failed to load session');
    });
  });

  describe('handleSelectSession – success path', () => {
    it('sets messages and activeSessionId on success', async () => {
      const api = createMockApi();
      const chatContainerRef = createMockChatContainerRef();
      const { result } = renderHook(() =>
        useChatSessions({ api, chatContainerRef }),
      );

      await act(async () => {
        await result.current.handleSelectSession('sess-1');
      });

      expect(result.current.activeSessionId).toBe('sess-1');
      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[0].isUser).toBe(true);
      expect(result.current.messages[1].isUser).toBe(false);
      expect(result.current.error).toBeNull();
      expect(chatContainerRef.current!.setSessionId).toHaveBeenCalledWith(
        'sess-1',
      );
    });
  });

  describe('guardedSelectSession – streaming guard', () => {
    it('opens switch dialog when streaming is active', () => {
      const api = createMockApi();
      const chatContainerRef = createMockChatContainerRef();
      const { result } = renderHook(() =>
        useChatSessions({ api, chatContainerRef, isStreaming: true }),
      );

      act(() => {
        result.current.guardedSelectSession('sess-2');
      });

      expect(result.current.switchDialogOpen).toBe(true);
      expect(api.getSessionMessages).not.toHaveBeenCalled();
    });

    it('proceeds directly when not streaming', async () => {
      const api = createMockApi();
      const chatContainerRef = createMockChatContainerRef();
      const { result } = renderHook(() =>
        useChatSessions({ api, chatContainerRef, isStreaming: false }),
      );

      await act(async () => {
        result.current.guardedSelectSession('sess-2');
      });

      expect(result.current.switchDialogOpen).toBe(false);
      expect(api.getSessionMessages).toHaveBeenCalledWith('sess-2');
    });

    it('falls back to ref.isStreaming() when isStreaming prop not provided', () => {
      const api = createMockApi();
      const chatContainerRef = createMockChatContainerRef({
        isStreaming: jest.fn().mockReturnValue(true),
      });
      const { result } = renderHook(() =>
        useChatSessions({ api, chatContainerRef }),
      );

      act(() => {
        result.current.guardedSelectSession('sess-2');
      });

      expect(result.current.switchDialogOpen).toBe(true);
    });
  });

  describe('switch confirm/cancel', () => {
    it('handleSwitchConfirm cancels stream and loads pending session', async () => {
      const api = createMockApi();
      const chatContainerRef = createMockChatContainerRef();
      const { result } = renderHook(() =>
        useChatSessions({ api, chatContainerRef, isStreaming: true }),
      );

      act(() => {
        result.current.guardedSelectSession('sess-pending');
      });

      expect(result.current.switchDialogOpen).toBe(true);

      await act(async () => {
        result.current.handleSwitchConfirm();
      });

      expect(result.current.switchDialogOpen).toBe(false);
      expect(chatContainerRef.current!.cancelOngoingRequest).toHaveBeenCalled();
      expect(api.getSessionMessages).toHaveBeenCalledWith('sess-pending');
    });

    it('handleSwitchCancel closes dialog without loading', () => {
      const api = createMockApi();
      const chatContainerRef = createMockChatContainerRef();
      const { result } = renderHook(() =>
        useChatSessions({ api, chatContainerRef, isStreaming: true }),
      );

      act(() => {
        result.current.guardedSelectSession('sess-pending');
      });

      act(() => {
        result.current.handleSwitchCancel();
      });

      expect(result.current.switchDialogOpen).toBe(false);
      expect(api.getSessionMessages).not.toHaveBeenCalled();
    });
  });

  describe('handleMessagesChange – debouncing', () => {
    it('debounces sessionRefreshTrigger updates', () => {
      const api = createMockApi();
      const chatContainerRef = createMockChatContainerRef();
      const { result } = renderHook(() =>
        useChatSessions({ api, chatContainerRef }),
      );

      const initialTrigger = result.current.sessionRefreshTrigger;

      act(() => {
        result.current.handleMessagesChange([
          { id: '1', text: 'hi', isUser: true, timestamp: new Date() },
        ]);
        result.current.handleMessagesChange([
          { id: '1', text: 'hi', isUser: true, timestamp: new Date() },
          { id: '2', text: 'hello', isUser: false, timestamp: new Date() },
        ]);
      });

      // Trigger should not have incremented yet (debounced)
      expect(result.current.sessionRefreshTrigger).toBe(initialTrigger);

      // Advance past debounce window
      act(() => {
        jest.advanceTimersByTime(600);
      });

      // Should have incremented only once
      expect(result.current.sessionRefreshTrigger).toBe(initialTrigger + 1);
    });
  });

  describe('handleNewChat', () => {
    it('resets all state and clears input', async () => {
      const api = createMockApi();
      const chatContainerRef = createMockChatContainerRef();
      const { result } = renderHook(() =>
        useChatSessions({ api, chatContainerRef }),
      );

      // Load a session first
      await act(async () => {
        await result.current.handleSelectSession('sess-1');
      });

      expect(result.current.activeSessionId).toBe('sess-1');
      expect(result.current.messages.length).toBeGreaterThan(0);

      // Reset
      act(() => {
        result.current.handleNewChat();
      });

      expect(result.current.activeSessionId).toBeUndefined();
      expect(result.current.messages).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(chatContainerRef.current!.resetConversation).toHaveBeenCalled();
      expect(chatContainerRef.current!.clearInput).toHaveBeenCalled();
    });
  });

  describe('switch confirm – full cleanup', () => {
    it('handleSwitchConfirm resets conversation and clears input', async () => {
      const api = createMockApi();
      const chatContainerRef = createMockChatContainerRef();
      const { result } = renderHook(() =>
        useChatSessions({ api, chatContainerRef, isStreaming: true }),
      );

      act(() => {
        result.current.guardedSelectSession('sess-new');
      });

      await act(async () => {
        result.current.handleSwitchConfirm();
      });

      expect(chatContainerRef.current!.cancelOngoingRequest).toHaveBeenCalled();
      expect(chatContainerRef.current!.resetConversation).toHaveBeenCalled();
      expect(chatContainerRef.current!.clearInput).toHaveBeenCalled();
    });
  });

  describe('handleSelectSession – clears input', () => {
    it('clears input when selecting a session', async () => {
      const api = createMockApi();
      const chatContainerRef = createMockChatContainerRef();
      const { result } = renderHook(() =>
        useChatSessions({ api, chatContainerRef }),
      );

      await act(async () => {
        await result.current.handleSelectSession('sess-1');
      });

      expect(chatContainerRef.current!.clearInput).toHaveBeenCalled();
    });
  });

  describe('messagesUnavailable', () => {
    it('is false initially', () => {
      const { result } = renderUseChatSessions();
      expect(result.current.messagesUnavailable).toBe(false);
    });

    it('is true when session has conversationId but returns empty messages', async () => {
      const api = createMockApi({
        getSessionMessages: jest.fn().mockResolvedValue({
          messages: [],
          sessionCreatedAt: '2025-01-01T00:00:00Z',
          hasConversationId: true,
        }),
      });
      const chatContainerRef = createMockChatContainerRef();
      const { result } = renderHook(() =>
        useChatSessions({ api, chatContainerRef }),
      );

      await act(async () => {
        await result.current.handleSelectSession('sess-lost');
      });

      expect(result.current.messagesUnavailable).toBe(true);
      expect(result.current.messages).toHaveLength(0);
      expect(result.current.activeSessionId).toBe('sess-lost');
    });

    it('is false when session has no conversationId and empty messages', async () => {
      const api = createMockApi({
        getSessionMessages: jest.fn().mockResolvedValue({
          messages: [],
          sessionCreatedAt: '2025-01-01T00:00:00Z',
          hasConversationId: false,
        }),
      });
      const chatContainerRef = createMockChatContainerRef();
      const { result } = renderHook(() =>
        useChatSessions({ api, chatContainerRef }),
      );

      await act(async () => {
        await result.current.handleSelectSession('sess-new');
      });

      expect(result.current.messagesUnavailable).toBe(false);
    });

    it('is false when session loads messages successfully', async () => {
      const { result } = renderUseChatSessions();

      await act(async () => {
        await result.current.handleSelectSession('sess-ok');
      });

      expect(result.current.messagesUnavailable).toBe(false);
      expect(result.current.messages.length).toBeGreaterThan(0);
    });

    it('resets to false on handleNewChat', async () => {
      const api = createMockApi({
        getSessionMessages: jest.fn().mockResolvedValue({
          messages: [],
          hasConversationId: true,
        }),
      });
      const chatContainerRef = createMockChatContainerRef();
      const { result } = renderHook(() =>
        useChatSessions({ api, chatContainerRef }),
      );

      await act(async () => {
        await result.current.handleSelectSession('sess-lost');
      });
      expect(result.current.messagesUnavailable).toBe(true);

      act(() => {
        result.current.handleNewChat();
      });
      expect(result.current.messagesUnavailable).toBe(false);
    });
  });
});
