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
import { act, renderHook } from '@testing-library/react';

import { useLastOpenedConversation } from '../useLastOpenedConversation';

describe('useLastOpenedConversation', () => {
  const localStorageKey = 'lastOpenedConversation';
  const mockUser = 'user123';

  beforeEach(() => {
    localStorage.clear();
  });

  it('should not be ready when user is undefined', () => {
    const { result } = renderHook(() => useLastOpenedConversation(undefined));

    expect(result.current.isReady).toBe(false);
    expect(result.current.lastOpenedId).toBeNull();
  });

  it('should load the lastOpenedId from localStorage when user is provided', () => {
    const storedData = JSON.stringify({ [mockUser]: 'conv456' });
    localStorage.setItem(localStorageKey, storedData);

    const { result } = renderHook(() => useLastOpenedConversation(mockUser));

    expect(result.current.isReady).toBe(true);
    expect(result.current.lastOpenedId).toBe('conv456');
  });

  it('should handle missing user data in localStorage', () => {
    localStorage.setItem(localStorageKey, JSON.stringify({}));

    const { result } = renderHook(() => useLastOpenedConversation(mockUser));

    expect(result.current.isReady).toBe(true);
    expect(result.current.lastOpenedId).toBeNull();
  });

  it('should update localStorage when setLastOpenedId is called', () => {
    const { result } = renderHook(() => useLastOpenedConversation(mockUser));

    act(() => {
      result.current.setLastOpenedId('conv789');
    });

    const storedData = JSON.parse(
      localStorage.getItem(localStorageKey) || '{}',
    );
    expect(storedData[mockUser]).toBe('conv789');
    expect(result.current.lastOpenedId).toBe('conv789');
  });

  it('should clear lastOpenedId when clearLastOpenedId is called', () => {
    localStorage.setItem(
      localStorageKey,
      JSON.stringify({ [mockUser]: 'conv456' }),
    );

    const { result } = renderHook(() => useLastOpenedConversation(mockUser));

    act(() => {
      result.current.clearLastOpenedId();
    });

    const storedData = JSON.parse(
      localStorage.getItem(localStorageKey) || '{}',
    );
    expect(storedData[mockUser]).toBeUndefined();
    expect(result.current.lastOpenedId).toBeNull();
  });

  it('should not update localStorage if user is undefined', () => {
    const { result } = renderHook(() => useLastOpenedConversation(undefined));

    act(() => {
      result.current.setLastOpenedId('conv123');
    });

    expect(localStorage.getItem(localStorageKey)).toBeNull();
  });

  it('should not clear localStorage if user is undefined', () => {
    const storedData = JSON.stringify({ [mockUser]: 'conv456' });
    localStorage.setItem(localStorageKey, storedData);
  });
});
