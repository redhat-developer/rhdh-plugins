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
  const mockUser = 'user:default/guest';
  const anotherUser = 'user:default/another';
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
      expect(result.current.selectedSort).toBe('newest');
    });

    it('should initialize with default values for a new user', () => {
      const { result } = renderHook(() => usePinnedChatsSettings(mockUser), {
        wrapper: createWrapper(mockStorageApi),
      });

      expect(result.current.isPinningChatsEnabled).toBe(true);
      expect(result.current.pinnedChats).toEqual([]);
      expect(result.current.selectedSort).toBe('newest');
    });

    it('should load persisted values from storage for existing user', async () => {
      // Pre-populate storage with user data
      const bucket = mockStorageApi.forBucket('lightspeed');
      bucket.set('pinnedChatsEnabled', { [mockUser]: false });
      bucket.set('pinnedChats', { [mockUser]: ['conv-1', 'conv-2'] });
      bucket.set('sortOrder', { [mockUser]: 'oldest' });

      const { result } = renderHook(() => usePinnedChatsSettings(mockUser), {
        wrapper: createWrapper(mockStorageApi),
      });

      await waitFor(() => {
        expect(result.current.isPinningChatsEnabled).toBe(false);
        expect(result.current.pinnedChats).toEqual(['conv-1', 'conv-2']);
        expect(result.current.selectedSort).toBe('oldest');
      });
    });

    it('should scope settings per user', async () => {
      const bucket = mockStorageApi.forBucket('lightspeed');
      bucket.set('pinnedChatsEnabled', {
        [mockUser]: true,
        [anotherUser]: false,
      });
      bucket.set('pinnedChats', {
        [mockUser]: ['conv-1'],
        [anotherUser]: ['conv-2', 'conv-3'],
      });
      bucket.set('sortOrder', {
        [mockUser]: 'newest',
        [anotherUser]: 'alphabeticalAsc',
      });

      const { result: result1 } = renderHook(
        () => usePinnedChatsSettings(mockUser),
        {
          wrapper: createWrapper(mockStorageApi),
        },
      );

      const { result: result2 } = renderHook(
        () => usePinnedChatsSettings(anotherUser),
        {
          wrapper: createWrapper(mockStorageApi),
        },
      );

      await waitFor(() => {
        expect(result1.current.isPinningChatsEnabled).toBe(true);
        expect(result1.current.pinnedChats).toEqual(['conv-1']);
        expect(result1.current.selectedSort).toBe('newest');

        expect(result2.current.isPinningChatsEnabled).toBe(false);
        expect(result2.current.pinnedChats).toEqual(['conv-2', 'conv-3']);
        expect(result2.current.selectedSort).toBe('alphabeticalAsc');
      });
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
        const snapshot = bucket.snapshot<{ [key: string]: boolean }>(
          'pinnedChatsEnabled',
        );
        expect(snapshot.value?.[mockUser]).toBe(false);
      });
    });

    it('should clear pinned chats when disabling pinning', async () => {
      const bucket = mockStorageApi.forBucket('lightspeed');
      bucket.set('pinnedChats', { [mockUser]: ['conv-1', 'conv-2'] });

      const { result } = renderHook(() => usePinnedChatsSettings(mockUser), {
        wrapper: createWrapper(mockStorageApi),
      });

      await waitFor(() => {
        expect(result.current.pinnedChats).toEqual(['conv-1', 'conv-2']);
      });

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
        const snapshot = bucket.snapshot<{ [key: string]: string[] }>(
          'pinnedChats',
        );
        expect(snapshot.value?.[mockUser]).toEqual(['conv-1']);
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
  });

  describe('unpinChat', () => {
    it('should remove a chat from pinned chats', async () => {
      const bucket = mockStorageApi.forBucket('lightspeed');
      bucket.set('pinnedChats', { [mockUser]: ['conv-1', 'conv-2'] });

      const { result } = renderHook(() => usePinnedChatsSettings(mockUser), {
        wrapper: createWrapper(mockStorageApi),
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
      const bucket = mockStorageApi.forBucket('lightspeed');
      bucket.set('pinnedChats', { [mockUser]: ['conv-1', 'conv-2'] });

      const { result } = renderHook(() => usePinnedChatsSettings(mockUser), {
        wrapper: createWrapper(mockStorageApi),
      });

      await waitFor(() => {
        expect(result.current.pinnedChats).toEqual(['conv-1', 'conv-2']);
      });

      act(() => {
        result.current.unpinChat('conv-1');
      });

      await waitFor(() => {
        const snapshot = bucket.snapshot<{ [key: string]: string[] }>(
          'pinnedChats',
        );
        expect(snapshot.value?.[mockUser]).toEqual(['conv-2']);
      });
    });

    it('should handle unpinning non-existent chat gracefully', async () => {
      const bucket = mockStorageApi.forBucket('lightspeed');
      bucket.set('pinnedChats', { [mockUser]: ['conv-1'] });

      const { result } = renderHook(() => usePinnedChatsSettings(mockUser), {
        wrapper: createWrapper(mockStorageApi),
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
      const bucket = mockStorageApi.forBucket('lightspeed');
      bucket.set('pinnedChats', { [mockUser]: ['conv-1'] });

      const { result } = renderHook(() => usePinnedChatsSettings(undefined), {
        wrapper: createWrapper(mockStorageApi),
      });

      act(() => {
        result.current.unpinChat('conv-1');
      });

      expect(result.current.pinnedChats).toEqual([]);
    });
  });

  describe('handleSortChange', () => {
    it('should change sort order to oldest', async () => {
      const { result } = renderHook(() => usePinnedChatsSettings(mockUser), {
        wrapper: createWrapper(mockStorageApi),
      });

      expect(result.current.selectedSort).toBe('newest');

      act(() => {
        result.current.handleSortChange('oldest');
      });

      await waitFor(() => {
        expect(result.current.selectedSort).toBe('oldest');
      });
    });

    it('should change sort order to alphabeticalAsc', async () => {
      const { result } = renderHook(() => usePinnedChatsSettings(mockUser), {
        wrapper: createWrapper(mockStorageApi),
      });

      act(() => {
        result.current.handleSortChange('alphabeticalAsc');
      });

      await waitFor(() => {
        expect(result.current.selectedSort).toBe('alphabeticalAsc');
      });
    });

    it('should change sort order to alphabeticalDesc', async () => {
      const { result } = renderHook(() => usePinnedChatsSettings(mockUser), {
        wrapper: createWrapper(mockStorageApi),
      });

      act(() => {
        result.current.handleSortChange('alphabeticalDesc');
      });

      await waitFor(() => {
        expect(result.current.selectedSort).toBe('alphabeticalDesc');
      });
    });

    it('should persist sort order to storage', async () => {
      const { result } = renderHook(() => usePinnedChatsSettings(mockUser), {
        wrapper: createWrapper(mockStorageApi),
      });

      act(() => {
        result.current.handleSortChange('oldest');
      });

      await waitFor(() => {
        const bucket = mockStorageApi.forBucket('lightspeed');
        const snapshot = bucket.snapshot<{ [key: string]: string }>(
          'sortOrder',
        );
        expect(snapshot.value?.[mockUser]).toBe('oldest');
      });
    });

    it('should not update if user is undefined', () => {
      const { result } = renderHook(() => usePinnedChatsSettings(undefined), {
        wrapper: createWrapper(mockStorageApi),
      });

      act(() => {
        result.current.handleSortChange('oldest');
      });

      expect(result.current.selectedSort).toBe('newest');
    });
  });

  describe('user change behavior', () => {
    it('should reset to defaults when user becomes undefined', async () => {
      const bucket = mockStorageApi.forBucket('lightspeed');
      bucket.set('pinnedChatsEnabled', { [mockUser]: false });
      bucket.set('pinnedChats', { [mockUser]: ['conv-1'] });
      bucket.set('sortOrder', { [mockUser]: 'oldest' });

      const { result, rerender } = renderHook(
        ({ user }) => usePinnedChatsSettings(user),
        {
          wrapper: createWrapper(mockStorageApi),
          initialProps: { user: mockUser as string | undefined },
        },
      );

      await waitFor(() => {
        expect(result.current.isPinningChatsEnabled).toBe(false);
        expect(result.current.pinnedChats).toEqual(['conv-1']);
        expect(result.current.selectedSort).toBe('oldest');
      });

      rerender({ user: undefined });

      await waitFor(() => {
        expect(result.current.isPinningChatsEnabled).toBe(true);
        expect(result.current.pinnedChats).toEqual([]);
        expect(result.current.selectedSort).toBe('newest');
      });
    });

    it('should load different user settings when user changes', async () => {
      const bucket = mockStorageApi.forBucket('lightspeed');
      bucket.set('pinnedChatsEnabled', {
        [mockUser]: true,
        [anotherUser]: false,
      });
      bucket.set('pinnedChats', {
        [mockUser]: ['conv-1'],
        [anotherUser]: ['conv-2', 'conv-3'],
      });
      bucket.set('sortOrder', {
        [mockUser]: 'newest',
        [anotherUser]: 'alphabeticalDesc',
      });

      const { result, rerender } = renderHook(
        ({ user }) => usePinnedChatsSettings(user),
        {
          wrapper: createWrapper(mockStorageApi),
          initialProps: { user: mockUser },
        },
      );

      await waitFor(() => {
        expect(result.current.isPinningChatsEnabled).toBe(true);
        expect(result.current.pinnedChats).toEqual(['conv-1']);
        expect(result.current.selectedSort).toBe('newest');
      });

      rerender({ user: anotherUser });

      await waitFor(() => {
        expect(result.current.isPinningChatsEnabled).toBe(false);
        expect(result.current.pinnedChats).toEqual(['conv-2', 'conv-3']);
        expect(result.current.selectedSort).toBe('alphabeticalDesc');
      });
    });
  });
});
