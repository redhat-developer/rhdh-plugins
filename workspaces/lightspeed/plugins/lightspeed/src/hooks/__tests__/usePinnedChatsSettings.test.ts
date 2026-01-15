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
import { createElement, ReactNode } from 'react';

import { storageApiRef } from '@backstage/core-plugin-api';
import { MockStorageApi, TestApiProvider } from '@backstage/test-utils';

import { act, renderHook, waitFor } from '@testing-library/react';

import { usePinnedChatsSettings } from '../usePinnedChatsSettings';

describe('usePinnedChatsSettings', () => {
  // Use a non-guest user for most tests (guest users don't persist)
  const mockUser = 'user:default/john';
  const guestUser = 'user:default/guest';
  let mockStorageApi: MockStorageApi;

  const createWrapper = (storageApi: MockStorageApi) => {
    return ({ children }: { children: ReactNode }) =>
      createElement(TestApiProvider, {
        apis: [[storageApiRef, storageApi]],
        children,
      });
  };

  beforeEach(() => {
    mockStorageApi = MockStorageApi.create();
  });

  describe('initialization', () => {
    it('should initialize with default values when user is undefined', () => {
      const { result } = renderHook(() => usePinnedChatsSettings(undefined), {
        wrapper: createWrapper(mockStorageApi),
      });

      expect(result.current.isPinningChatsEnabled).toBe(true);
      expect(result.current.pinnedChats).toEqual([]);
    });

    it('should initialize with default values for a new user', () => {
      const { result } = renderHook(() => usePinnedChatsSettings(mockUser), {
        wrapper: createWrapper(mockStorageApi),
      });

      expect(result.current.isPinningChatsEnabled).toBe(true);
      expect(result.current.pinnedChats).toEqual([]);
    });

    it('should initialize with defaults for guest user without loading from storage', async () => {
      const { result } = renderHook(() => usePinnedChatsSettings(guestUser), {
        wrapper: createWrapper(mockStorageApi),
      });

      // Guest users should always get default values
      expect(result.current.isPinningChatsEnabled).toBe(true);
      expect(result.current.pinnedChats).toEqual([]);
    });
  });

  describe('handlePinningChatsToggle', () => {
    it('should toggle pinning chats enabled state', async () => {
      const { result } = renderHook(() => usePinnedChatsSettings(mockUser), {
        wrapper: createWrapper(mockStorageApi),
      });

      expect(result.current.isPinningChatsEnabled).toBe(true);

      act(() => {
        result.current.handlePinningChatsToggle(false);
      });

      await waitFor(() => {
        expect(result.current.isPinningChatsEnabled).toBe(false);
      });

      act(() => {
        result.current.handlePinningChatsToggle(true);
      });

      await waitFor(() => {
        expect(result.current.isPinningChatsEnabled).toBe(true);
      });
    });

    it('should persist toggle state to storage', async () => {
      const { result } = renderHook(() => usePinnedChatsSettings(mockUser), {
        wrapper: createWrapper(mockStorageApi),
      });

      act(() => {
        result.current.handlePinningChatsToggle(false);
      });

      await waitFor(() => {
        const bucket = mockStorageApi.forBucket('lightspeed');
        const snapshot = bucket.snapshot<boolean>('pinnedChatsEnabled');
        expect(snapshot.value).toBe(false);
      });
    });

    it('should clear pinned chats when disabling pinning', async () => {
      const { result } = renderHook(() => usePinnedChatsSettings(mockUser), {
        wrapper: createWrapper(mockStorageApi),
      });

      // First add some pinned chats
      act(() => {
        result.current.pinChat('conv-1');
        result.current.pinChat('conv-2');
      });

      await waitFor(() => {
        expect(result.current.pinnedChats).toEqual(['conv-1', 'conv-2']);
      });

      // Now disable pinning
      act(() => {
        result.current.handlePinningChatsToggle(false);
      });

      await waitFor(() => {
        expect(result.current.pinnedChats).toEqual([]);
      });
    });

    it('should not update if user is undefined', () => {
      const { result } = renderHook(() => usePinnedChatsSettings(undefined), {
        wrapper: createWrapper(mockStorageApi),
      });

      act(() => {
        result.current.handlePinningChatsToggle(false);
      });

      // Should remain at default value
      expect(result.current.isPinningChatsEnabled).toBe(true);
    });

    it('should update local state but not persist for guest users', async () => {
      const { result } = renderHook(() => usePinnedChatsSettings(guestUser), {
        wrapper: createWrapper(mockStorageApi),
      });

      act(() => {
        result.current.handlePinningChatsToggle(false);
      });

      await waitFor(() => {
        // Local state should update
        expect(result.current.isPinningChatsEnabled).toBe(false);
      });

      // Storage should not be updated for guest users
      const bucket = mockStorageApi.forBucket('lightspeed');
      const snapshot = bucket.snapshot<boolean>('pinnedChatsEnabled');
      expect(snapshot.value).toBeUndefined();
    });
  });

  describe('pinChat', () => {
    it('should add a chat to pinned chats', async () => {
      const { result } = renderHook(() => usePinnedChatsSettings(mockUser), {
        wrapper: createWrapper(mockStorageApi),
      });

      expect(result.current.pinnedChats).toEqual([]);

      act(() => {
        result.current.pinChat('conv-1');
      });

      await waitFor(() => {
        expect(result.current.pinnedChats).toEqual(['conv-1']);
      });
    });

    it('should add multiple chats to pinned chats', async () => {
      const { result } = renderHook(() => usePinnedChatsSettings(mockUser), {
        wrapper: createWrapper(mockStorageApi),
      });

      act(() => {
        result.current.pinChat('conv-1');
      });

      await waitFor(() => {
        expect(result.current.pinnedChats).toEqual(['conv-1']);
      });

      act(() => {
        result.current.pinChat('conv-2');
      });

      await waitFor(() => {
        expect(result.current.pinnedChats).toEqual(['conv-1', 'conv-2']);
      });
    });

    it('should persist pinned chats to storage', async () => {
      const { result } = renderHook(() => usePinnedChatsSettings(mockUser), {
        wrapper: createWrapper(mockStorageApi),
      });

      act(() => {
        result.current.pinChat('conv-1');
      });

      await waitFor(() => {
        const bucket = mockStorageApi.forBucket('lightspeed');
        const snapshot = bucket.snapshot<string[]>('pinnedChats');
        expect(snapshot.value).toEqual(['conv-1']);
      });
    });

    it('should not update if user is undefined', () => {
      const { result } = renderHook(() => usePinnedChatsSettings(undefined), {
        wrapper: createWrapper(mockStorageApi),
      });

      act(() => {
        result.current.pinChat('conv-1');
      });

      expect(result.current.pinnedChats).toEqual([]);
    });

    it('should update local state but not persist for guest users', async () => {
      const { result } = renderHook(() => usePinnedChatsSettings(guestUser), {
        wrapper: createWrapper(mockStorageApi),
      });

      act(() => {
        result.current.pinChat('conv-1');
      });

      await waitFor(() => {
        // Local state should update
        expect(result.current.pinnedChats).toEqual(['conv-1']);
      });

      // Storage should not be updated for guest users
      const bucket = mockStorageApi.forBucket('lightspeed');
      const snapshot = bucket.snapshot<string[]>('pinnedChats');
      expect(snapshot.value).toBeUndefined();
    });
  });

  describe('unpinChat', () => {
    it('should remove a chat from pinned chats', async () => {
      const { result } = renderHook(() => usePinnedChatsSettings(mockUser), {
        wrapper: createWrapper(mockStorageApi),
      });

      // First add some chats
      act(() => {
        result.current.pinChat('conv-1');
        result.current.pinChat('conv-2');
      });

      await waitFor(() => {
        expect(result.current.pinnedChats).toEqual(['conv-1', 'conv-2']);
      });

      act(() => {
        result.current.unpinChat('conv-1');
      });

      await waitFor(() => {
        expect(result.current.pinnedChats).toEqual(['conv-2']);
      });
    });

    it('should persist unpinned chats to storage', async () => {
      const { result } = renderHook(() => usePinnedChatsSettings(mockUser), {
        wrapper: createWrapper(mockStorageApi),
      });

      // First add some chats
      act(() => {
        result.current.pinChat('conv-1');
        result.current.pinChat('conv-2');
      });

      await waitFor(() => {
        expect(result.current.pinnedChats).toEqual(['conv-1', 'conv-2']);
      });

      act(() => {
        result.current.unpinChat('conv-1');
      });

      await waitFor(() => {
        const bucket = mockStorageApi.forBucket('lightspeed');
        const snapshot = bucket.snapshot<string[]>('pinnedChats');
        expect(snapshot.value).toEqual(['conv-2']);
      });
    });

    it('should handle unpinning non-existent chat gracefully', async () => {
      const { result } = renderHook(() => usePinnedChatsSettings(mockUser), {
        wrapper: createWrapper(mockStorageApi),
      });

      // First add a chat
      act(() => {
        result.current.pinChat('conv-1');
      });

      await waitFor(() => {
        expect(result.current.pinnedChats).toEqual(['conv-1']);
      });

      act(() => {
        result.current.unpinChat('non-existent');
      });

      await waitFor(() => {
        expect(result.current.pinnedChats).toEqual(['conv-1']);
      });
    });

    it('should not update if user is undefined', async () => {
      const { result } = renderHook(() => usePinnedChatsSettings(undefined), {
        wrapper: createWrapper(mockStorageApi),
      });

      act(() => {
        result.current.unpinChat('conv-1');
      });

      expect(result.current.pinnedChats).toEqual([]);
    });

    it('should update local state but not persist for guest users', async () => {
      const { result } = renderHook(() => usePinnedChatsSettings(guestUser), {
        wrapper: createWrapper(mockStorageApi),
      });

      // First pin chats
      act(() => {
        result.current.pinChat('conv-1');
        result.current.pinChat('conv-2');
      });

      await waitFor(() => {
        expect(result.current.pinnedChats).toEqual(['conv-1', 'conv-2']);
      });

      // Then unpin
      act(() => {
        result.current.unpinChat('conv-1');
      });

      await waitFor(() => {
        // Local state should update
        expect(result.current.pinnedChats).toEqual(['conv-2']);
      });

      // Storage should not be updated for guest users
      const bucket = mockStorageApi.forBucket('lightspeed');
      const snapshot = bucket.snapshot<string[]>('pinnedChats');
      expect(snapshot.value).toBeUndefined();
    });
  });

  describe('user change behavior', () => {
    it('should reset to defaults when user becomes undefined', async () => {
      const { result, rerender } = renderHook(
        ({ user }) => usePinnedChatsSettings(user),
        {
          wrapper: createWrapper(mockStorageApi),
          initialProps: { user: mockUser as string | undefined },
        },
      );

      // Set some values
      act(() => {
        result.current.handlePinningChatsToggle(false);
        result.current.pinChat('conv-1');
      });

      await waitFor(() => {
        expect(result.current.isPinningChatsEnabled).toBe(false);
        expect(result.current.pinnedChats).toEqual(['conv-1']);
      });

      rerender({ user: undefined });

      await waitFor(() => {
        expect(result.current.isPinningChatsEnabled).toBe(true);
        expect(result.current.pinnedChats).toEqual([]);
      });
    });

    it('should reset to defaults when user changes to guest', async () => {
      const { result, rerender } = renderHook(
        ({ user }) => usePinnedChatsSettings(user),
        {
          wrapper: createWrapper(mockStorageApi),
          initialProps: { user: mockUser },
        },
      );

      // Set some values
      act(() => {
        result.current.handlePinningChatsToggle(false);
        result.current.pinChat('conv-1');
      });

      await waitFor(() => {
        expect(result.current.isPinningChatsEnabled).toBe(false);
        expect(result.current.pinnedChats).toEqual(['conv-1']);
      });

      rerender({ user: guestUser });

      await waitFor(() => {
        // Guest users should get default values
        expect(result.current.isPinningChatsEnabled).toBe(true);
        expect(result.current.pinnedChats).toEqual([]);
      });
    });
  });

  describe('guest user detection', () => {
    it('should identify user:default/guest as guest user', () => {
      const { result } = renderHook(
        () => usePinnedChatsSettings('user:default/guest'),
        {
          wrapper: createWrapper(mockStorageApi),
        },
      );

      // Guest user should have default values
      expect(result.current.isPinningChatsEnabled).toBe(true);
      expect(result.current.pinnedChats).toEqual([]);
    });

    it('should identify user:development/guest as guest user', () => {
      const { result } = renderHook(
        () => usePinnedChatsSettings('user:development/guest'),
        {
          wrapper: createWrapper(mockStorageApi),
        },
      );

      // Guest user should have default values
      expect(result.current.isPinningChatsEnabled).toBe(true);
      expect(result.current.pinnedChats).toEqual([]);
    });

    it('should not identify regular users as guest', async () => {
      const { result } = renderHook(
        () => usePinnedChatsSettings('user:default/john'),
        {
          wrapper: createWrapper(mockStorageApi),
        },
      );

      // Set some values to verify it's not a guest user
      act(() => {
        result.current.handlePinningChatsToggle(false);
        result.current.pinChat('conv-1');
      });

      await waitFor(() => {
        // Regular user should be able to set and persist values
        expect(result.current.isPinningChatsEnabled).toBe(false);
        expect(result.current.pinnedChats).toEqual(['conv-1']);
      });

      // Verify it was persisted
      const bucket = mockStorageApi.forBucket('lightspeed');
      expect(bucket.snapshot<boolean>('pinnedChatsEnabled').value).toBe(false);
      expect(bucket.snapshot<string[]>('pinnedChats').value).toEqual([
        'conv-1',
      ]);
    });
  });
});
