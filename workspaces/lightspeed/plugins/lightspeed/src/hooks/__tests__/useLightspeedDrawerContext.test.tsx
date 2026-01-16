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
import { renderHook } from '@testing-library/react';

import { LightspeedDrawerContext } from '../../components/LightspeedDrawerContext';
import { useLightspeedDrawerContext } from '../useLightspeedDrawerContext';

describe('useLightspeedDrawerContext', () => {
  const mockContextValue = {
    isChatbotActive: true,
    toggleChatbot: jest.fn(),
    displayMode: ChatbotDisplayMode.default,
    setDisplayMode: jest.fn(),
    drawerWidth: 500,
    setDrawerWidth: jest.fn(),
    currentConversationId: 'test-conv-id',
    setCurrentConversationId: jest.fn(),
    draftMessage: '',
    setDraftMessage: jest.fn(),
    draftFileContents: [],
    setDraftFileContents: jest.fn(),
  };

  it('should return context value when used within provider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LightspeedDrawerContext.Provider value={mockContextValue}>
        {children}
      </LightspeedDrawerContext.Provider>
    );

    const { result } = renderHook(() => useLightspeedDrawerContext(), {
      wrapper,
    });

    expect(result.current).toEqual(mockContextValue);
  });

  it('should throw error when used outside of provider', () => {
    // Suppress console.error for this test as React will log the error
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => useLightspeedDrawerContext());
    }).toThrow(
      'useLightspeedDrawerContext must be used within a LightspeedDrawerProvider',
    );

    consoleSpy.mockRestore();
  });

  it('should return isChatbotActive from context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LightspeedDrawerContext.Provider
        value={{ ...mockContextValue, isChatbotActive: false }}
      >
        {children}
      </LightspeedDrawerContext.Provider>
    );

    const { result } = renderHook(() => useLightspeedDrawerContext(), {
      wrapper,
    });

    expect(result.current.isChatbotActive).toBe(false);
  });

  it('should return displayMode from context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LightspeedDrawerContext.Provider
        value={{ ...mockContextValue, displayMode: ChatbotDisplayMode.docked }}
      >
        {children}
      </LightspeedDrawerContext.Provider>
    );

    const { result } = renderHook(() => useLightspeedDrawerContext(), {
      wrapper,
    });

    expect(result.current.displayMode).toBe(ChatbotDisplayMode.docked);
  });

  it('should return drawerWidth from context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LightspeedDrawerContext.Provider
        value={{ ...mockContextValue, drawerWidth: 600 }}
      >
        {children}
      </LightspeedDrawerContext.Provider>
    );

    const { result } = renderHook(() => useLightspeedDrawerContext(), {
      wrapper,
    });

    expect(result.current.drawerWidth).toBe(600);
  });

  it('should return currentConversationId from context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LightspeedDrawerContext.Provider
        value={{ ...mockContextValue, currentConversationId: 'my-conv-123' }}
      >
        {children}
      </LightspeedDrawerContext.Provider>
    );

    const { result } = renderHook(() => useLightspeedDrawerContext(), {
      wrapper,
    });

    expect(result.current.currentConversationId).toBe('my-conv-123');
  });

  it('should return undefined currentConversationId when not set', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LightspeedDrawerContext.Provider
        value={{ ...mockContextValue, currentConversationId: undefined }}
      >
        {children}
      </LightspeedDrawerContext.Provider>
    );

    const { result } = renderHook(() => useLightspeedDrawerContext(), {
      wrapper,
    });

    expect(result.current.currentConversationId).toBeUndefined();
  });

  it('should provide working toggleChatbot function', () => {
    const mockToggle = jest.fn();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LightspeedDrawerContext.Provider
        value={{ ...mockContextValue, toggleChatbot: mockToggle }}
      >
        {children}
      </LightspeedDrawerContext.Provider>
    );

    const { result } = renderHook(() => useLightspeedDrawerContext(), {
      wrapper,
    });

    result.current.toggleChatbot();
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  it('should provide working setDisplayMode function', () => {
    const mockSetDisplayMode = jest.fn();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LightspeedDrawerContext.Provider
        value={{ ...mockContextValue, setDisplayMode: mockSetDisplayMode }}
      >
        {children}
      </LightspeedDrawerContext.Provider>
    );

    const { result } = renderHook(() => useLightspeedDrawerContext(), {
      wrapper,
    });

    result.current.setDisplayMode(ChatbotDisplayMode.fullscreen);
    expect(mockSetDisplayMode).toHaveBeenCalledWith(
      ChatbotDisplayMode.fullscreen,
    );
  });

  it('should provide working setDrawerWidth function', () => {
    const mockSetDrawerWidth = jest.fn();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LightspeedDrawerContext.Provider
        value={{ ...mockContextValue, setDrawerWidth: mockSetDrawerWidth }}
      >
        {children}
      </LightspeedDrawerContext.Provider>
    );

    const { result } = renderHook(() => useLightspeedDrawerContext(), {
      wrapper,
    });

    result.current.setDrawerWidth(800);
    expect(mockSetDrawerWidth).toHaveBeenCalledWith(800);
  });

  it('should provide working setCurrentConversationId function', () => {
    const mockSetConversationId = jest.fn();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LightspeedDrawerContext.Provider
        value={{
          ...mockContextValue,
          setCurrentConversationId: mockSetConversationId,
        }}
      >
        {children}
      </LightspeedDrawerContext.Provider>
    );

    const { result } = renderHook(() => useLightspeedDrawerContext(), {
      wrapper,
    });

    result.current.setCurrentConversationId('new-conv-id');
    expect(mockSetConversationId).toHaveBeenCalledWith('new-conv-id');
  });

  it('should return draftMessage from context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LightspeedDrawerContext.Provider
        value={{ ...mockContextValue, draftMessage: 'test draft message' }}
      >
        {children}
      </LightspeedDrawerContext.Provider>
    );

    const { result } = renderHook(() => useLightspeedDrawerContext(), {
      wrapper,
    });

    expect(result.current.draftMessage).toBe('test draft message');
  });

  it('should provide working setDraftMessage function', () => {
    const mockSetDraftMessage = jest.fn();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LightspeedDrawerContext.Provider
        value={{
          ...mockContextValue,
          setDraftMessage: mockSetDraftMessage,
        }}
      >
        {children}
      </LightspeedDrawerContext.Provider>
    );

    const { result } = renderHook(() => useLightspeedDrawerContext(), {
      wrapper,
    });

    result.current.setDraftMessage('new draft message');
    expect(mockSetDraftMessage).toHaveBeenCalledWith('new draft message');
  });
});
