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

import { useSortSettings } from '../useSortSettings';

describe('useSortSettings', () => {
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
    it('should initialize with default value when user is undefined', () => {
      const { result } = renderHook(() => useSortSettings(undefined), {
        wrapper: createWrapper(mockStorageApi),
      });

      expect(result.current.selectedSort).toBe('newest');
    });

    it('should initialize with default value for a new user', () => {
      const { result } = renderHook(() => useSortSettings(mockUser), {
        wrapper: createWrapper(mockStorageApi),
      });

      expect(result.current.selectedSort).toBe('newest');
    });

    it('should initialize with default for guest user without loading from storage', async () => {
      const { result } = renderHook(() => useSortSettings(guestUser), {
        wrapper: createWrapper(mockStorageApi),
      });

      // Guest users should always get default values
      expect(result.current.selectedSort).toBe('newest');
    });
  });

  describe('handleSortChange', () => {
    it('should change sort order to oldest', async () => {
      const { result } = renderHook(() => useSortSettings(mockUser), {
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
      const { result } = renderHook(() => useSortSettings(mockUser), {
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
      const { result } = renderHook(() => useSortSettings(mockUser), {
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
      const { result } = renderHook(() => useSortSettings(mockUser), {
        wrapper: createWrapper(mockStorageApi),
      });

      act(() => {
        result.current.handleSortChange('oldest');
      });

      await waitFor(() => {
        const bucket = mockStorageApi.forBucket('lightspeed');
        const snapshot = bucket.snapshot<string>('sortOrder');
        expect(snapshot.value).toBe('oldest');
      });
    });

    it('should not update if user is undefined', () => {
      const { result } = renderHook(() => useSortSettings(undefined), {
        wrapper: createWrapper(mockStorageApi),
      });

      act(() => {
        result.current.handleSortChange('oldest');
      });

      expect(result.current.selectedSort).toBe('newest');
    });

    it('should update local state but not persist for guest users', async () => {
      const { result } = renderHook(() => useSortSettings(guestUser), {
        wrapper: createWrapper(mockStorageApi),
      });

      act(() => {
        result.current.handleSortChange('oldest');
      });

      await waitFor(() => {
        // Local state should update
        expect(result.current.selectedSort).toBe('oldest');
      });

      // Storage should not be updated for guest users
      const bucket = mockStorageApi.forBucket('lightspeed');
      const snapshot = bucket.snapshot<string>('sortOrder');
      expect(snapshot.value).toBeUndefined();
    });
  });

  describe('user change behavior', () => {
    it('should reset to default when user becomes undefined', async () => {
      const { result, rerender } = renderHook(
        ({ user }) => useSortSettings(user),
        {
          wrapper: createWrapper(mockStorageApi),
          initialProps: { user: mockUser as string | undefined },
        },
      );

      // Set a value
      act(() => {
        result.current.handleSortChange('oldest');
      });

      await waitFor(() => {
        expect(result.current.selectedSort).toBe('oldest');
      });

      rerender({ user: undefined });

      await waitFor(() => {
        expect(result.current.selectedSort).toBe('newest');
      });
    });

    it('should reset to default when user changes to guest', async () => {
      const { result, rerender } = renderHook(
        ({ user }) => useSortSettings(user),
        {
          wrapper: createWrapper(mockStorageApi),
          initialProps: { user: mockUser },
        },
      );

      // Set a value
      act(() => {
        result.current.handleSortChange('oldest');
      });

      await waitFor(() => {
        expect(result.current.selectedSort).toBe('oldest');
      });

      rerender({ user: guestUser });

      await waitFor(() => {
        // Guest users should get default values
        expect(result.current.selectedSort).toBe('newest');
      });
    });
  });

  describe('guest user detection', () => {
    it('should identify user:default/guest as guest user', () => {
      const { result } = renderHook(
        () => useSortSettings('user:default/guest'),
        {
          wrapper: createWrapper(mockStorageApi),
        },
      );

      // Guest user should have default value
      expect(result.current.selectedSort).toBe('newest');
    });

    it('should identify user:development/guest as guest user', () => {
      const { result } = renderHook(
        () => useSortSettings('user:development/guest'),
        {
          wrapper: createWrapper(mockStorageApi),
        },
      );

      // Guest user should have default value
      expect(result.current.selectedSort).toBe('newest');
    });

    it('should not identify regular users as guest', async () => {
      const { result } = renderHook(
        () => useSortSettings('user:default/john'),
        {
          wrapper: createWrapper(mockStorageApi),
        },
      );

      // Set a value to verify it's not a guest user
      act(() => {
        result.current.handleSortChange('oldest');
      });

      await waitFor(() => {
        // Regular user should be able to set and persist values
        expect(result.current.selectedSort).toBe('oldest');
      });

      // Verify it was persisted
      const bucket = mockStorageApi.forBucket('lightspeed');
      expect(bucket.snapshot<string>('sortOrder').value).toBe('oldest');
    });
  });
});
