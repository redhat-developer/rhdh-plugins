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

import { ChatbotDisplayMode } from '@patternfly/chatbot';
import { act, renderHook } from '@testing-library/react';

import { lightspeedDrawerStore } from '../../store/lightspeedDrawerStore';
import { useLightspeedDrawer } from '../useLightspeedDrawer';

describe('useLightspeedDrawer', () => {
  beforeEach(() => {
    lightspeedDrawerStore.reset();
  });

  it('returns initial state without a Provider', () => {
    const { result } = renderHook(() => useLightspeedDrawer());

    expect(result.current.isChatbotActive).toBe(false);
    expect(result.current.displayMode).toBe(ChatbotDisplayMode.default);
    expect(result.current.drawerWidth).toBe(400);
    expect(result.current.currentConversationId).toBeUndefined();
    expect(result.current.draftMessage).toBe('');
    expect(result.current.draftFileContents).toEqual([]);
    expect(result.current.shellViewTab).toBe(0);
  });

  it('reacts to store.open()', () => {
    const { result } = renderHook(() => useLightspeedDrawer());

    act(() => {
      lightspeedDrawerStore.open();
    });

    expect(result.current.isChatbotActive).toBe(true);
  });

  it('reacts to store.close()', () => {
    lightspeedDrawerStore.open();
    const { result } = renderHook(() => useLightspeedDrawer());

    act(() => {
      lightspeedDrawerStore.close();
    });

    expect(result.current.isChatbotActive).toBe(false);
  });

  it('toggle works without registered handlers', () => {
    const { result } = renderHook(() => useLightspeedDrawer());

    act(() => {
      result.current.toggleChatbot();
    });
    expect(result.current.isChatbotActive).toBe(true);

    act(() => {
      result.current.toggleChatbot();
    });
    expect(result.current.isChatbotActive).toBe(false);
  });

  it('setDisplayMode updates displayMode without handlers', () => {
    const { result } = renderHook(() => useLightspeedDrawer());

    act(() => {
      result.current.setDisplayMode(ChatbotDisplayMode.docked);
    });

    expect(result.current.displayMode).toBe(ChatbotDisplayMode.docked);
  });

  it('setDrawerWidth updates drawerWidth', () => {
    const { result } = renderHook(() => useLightspeedDrawer());

    act(() => {
      result.current.setDrawerWidth(600);
    });

    expect(result.current.drawerWidth).toBe(600);
  });

  it('setCurrentConversationId updates the conversation id', () => {
    const { result } = renderHook(() => useLightspeedDrawer());

    act(() => {
      result.current.setCurrentConversationId('conv-123');
    });

    expect(result.current.currentConversationId).toBe('conv-123');
  });

  it('setDraftMessage updates draftMessage', () => {
    const { result } = renderHook(() => useLightspeedDrawer());

    act(() => {
      result.current.setDraftMessage('hello world');
    });

    expect(result.current.draftMessage).toBe('hello world');
  });

  it('setDraftFileContents updates draftFileContents', () => {
    const { result } = renderHook(() => useLightspeedDrawer());
    const files = [{ content: 'test', type: 'text/plain', name: 'test.txt' }];

    act(() => {
      result.current.setDraftFileContents(files);
    });

    expect(result.current.draftFileContents).toEqual(files);
  });

  it('setShellViewTab clamps to 0 or 1', () => {
    const { result } = renderHook(() => useLightspeedDrawer());

    act(() => {
      result.current.setShellViewTab(1);
    });
    expect(result.current.shellViewTab).toBe(1);

    act(() => {
      result.current.setShellViewTab(5);
    });
    expect(result.current.shellViewTab).toBe(0);
  });

  it('consumePendingOverlayThreadHandoff returns false when not pending', () => {
    const { result } = renderHook(() => useLightspeedDrawer());
    expect(result.current.consumePendingOverlayThreadHandoff?.()).toBe(false);
  });

  it('consumePendingOverlayThreadHandoff returns true once when pending', () => {
    lightspeedDrawerStore.setPendingOverlayThreadHandoff(true);
    const { result } = renderHook(() => useLightspeedDrawer());

    expect(result.current.consumePendingOverlayThreadHandoff?.()).toBe(true);
    expect(result.current.consumePendingOverlayThreadHandoff?.()).toBe(false);
  });

  it('delegates to registered handlers when available', () => {
    const mockToggle = jest.fn();
    const mockSetDisplayMode = jest.fn();
    const mockSetConversationId = jest.fn();

    lightspeedDrawerStore.registerHandlers({
      toggleChatbot: mockToggle,
      setDisplayMode: mockSetDisplayMode,
      setCurrentConversationId: mockSetConversationId,
    });

    const { result } = renderHook(() => useLightspeedDrawer());

    act(() => {
      result.current.toggleChatbot();
    });
    expect(mockToggle).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.setDisplayMode(ChatbotDisplayMode.embedded);
    });
    expect(mockSetDisplayMode).toHaveBeenCalledWith(
      ChatbotDisplayMode.embedded,
      undefined,
      undefined,
    );

    act(() => {
      result.current.setCurrentConversationId('abc');
    });
    expect(mockSetConversationId).toHaveBeenCalledWith('abc');
  });
});
