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

import type { ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react';
import { ChatViewModeProvider, useChatViewMode } from './useChatViewMode';

const STORAGE_KEY = 'augment:chat-view-mode';

function wrapper({ children }: { children: ReactNode }) {
  return <ChatViewModeProvider>{children}</ChatViewModeProvider>;
}

describe('useChatViewMode', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to user mode when nothing is persisted', () => {
    const { result } = renderHook(() => useChatViewMode(), { wrapper });

    expect(result.current.mode).toBe('user');
    expect(result.current.isDev).toBe(false);
  });

  it('reads dev mode from localStorage', () => {
    localStorage.setItem(STORAGE_KEY, 'dev');

    const { result } = renderHook(() => useChatViewMode(), { wrapper });

    expect(result.current.mode).toBe('dev');
    expect(result.current.isDev).toBe(true);
  });

  it('ignores invalid localStorage values', () => {
    localStorage.setItem(STORAGE_KEY, 'invalid');

    const { result } = renderHook(() => useChatViewMode(), { wrapper });

    expect(result.current.mode).toBe('user');
  });

  it('toggles from user to dev', () => {
    const { result } = renderHook(() => useChatViewMode(), { wrapper });

    act(() => {
      result.current.toggleMode();
    });

    expect(result.current.mode).toBe('dev');
    expect(result.current.isDev).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dev');
  });

  it('toggles from dev back to user', () => {
    localStorage.setItem(STORAGE_KEY, 'dev');

    const { result } = renderHook(() => useChatViewMode(), { wrapper });

    act(() => {
      result.current.toggleMode();
    });

    expect(result.current.mode).toBe('user');
    expect(result.current.isDev).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('user');
  });

  it('persists mode after multiple toggles', () => {
    const { result } = renderHook(() => useChatViewMode(), { wrapper });

    act(() => result.current.toggleMode());
    act(() => result.current.toggleMode());
    act(() => result.current.toggleMode());

    expect(result.current.mode).toBe('dev');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dev');
  });

  it('returns default values outside of provider', () => {
    const { result } = renderHook(() => useChatViewMode());

    expect(result.current.mode).toBe('user');
    expect(result.current.isDev).toBe(false);
    expect(typeof result.current.toggleMode).toBe('function');
  });
});
