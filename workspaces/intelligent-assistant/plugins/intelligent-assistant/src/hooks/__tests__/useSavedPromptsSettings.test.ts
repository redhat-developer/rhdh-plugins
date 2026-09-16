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

import { StorageApi, storageApiRef } from '@backstage/core-plugin-api';
import { mockApis, TestApiProvider } from '@backstage/test-utils';

import { act, renderHook, waitFor } from '@testing-library/react';

import { useSavedPromptsSettings } from '../useSavedPromptsSettings';

describe('useSavedPromptsSettings', () => {
  const mockUser = 'user:default/john';
  const guestUser = 'user:default/guest';
  let mockStorageApi: StorageApi;

  const createWrapper = (storageApi: StorageApi) => {
    return ({ children }: { children: ReactNode }) =>
      createElement(TestApiProvider, {
        apis: [[storageApiRef, storageApi]],
        children,
      });
  };

  beforeEach(() => {
    mockStorageApi = mockApis.storage();
  });

  describe('initialization', () => {
    it('should initialize with enabled=true when user is undefined', () => {
      const { result } = renderHook(() => useSavedPromptsSettings(undefined), {
        wrapper: createWrapper(mockStorageApi),
      });

      expect(result.current.isSavedPromptsEnabled).toBe(true);
    });

    it('should initialize with enabled=true for a new user', () => {
      const { result } = renderHook(() => useSavedPromptsSettings(mockUser), {
        wrapper: createWrapper(mockStorageApi),
      });

      expect(result.current.isSavedPromptsEnabled).toBe(true);
    });

    it('should initialize with defaults for guest user', () => {
      const { result } = renderHook(() => useSavedPromptsSettings(guestUser), {
        wrapper: createWrapper(mockStorageApi),
      });

      expect(result.current.isSavedPromptsEnabled).toBe(true);
    });
  });

  describe('handleSavedPromptsToggle', () => {
    it('should toggle saved prompts enabled state', async () => {
      const { result } = renderHook(() => useSavedPromptsSettings(mockUser), {
        wrapper: createWrapper(mockStorageApi),
      });

      expect(result.current.isSavedPromptsEnabled).toBe(true);

      act(() => {
        result.current.handleSavedPromptsToggle(false);
      });

      await waitFor(() => {
        expect(result.current.isSavedPromptsEnabled).toBe(false);
      });

      act(() => {
        result.current.handleSavedPromptsToggle(true);
      });

      await waitFor(() => {
        expect(result.current.isSavedPromptsEnabled).toBe(true);
      });
    });

    it('should persist toggle state to storage', async () => {
      const { result } = renderHook(() => useSavedPromptsSettings(mockUser), {
        wrapper: createWrapper(mockStorageApi),
      });

      act(() => {
        result.current.handleSavedPromptsToggle(false);
      });

      await waitFor(() => {
        const bucket = mockStorageApi.forBucket('lightspeed');
        const snapshot = bucket.snapshot<boolean>('savedPromptsEnabled');
        expect(snapshot.value).toBe(false);
      });
    });

    it('should not update if user is undefined', () => {
      const { result } = renderHook(() => useSavedPromptsSettings(undefined), {
        wrapper: createWrapper(mockStorageApi),
      });

      act(() => {
        result.current.handleSavedPromptsToggle(false);
      });

      expect(result.current.isSavedPromptsEnabled).toBe(true);
    });

    it('should update local state but not persist for guest users', async () => {
      const { result } = renderHook(() => useSavedPromptsSettings(guestUser), {
        wrapper: createWrapper(mockStorageApi),
      });

      act(() => {
        result.current.handleSavedPromptsToggle(false);
      });

      await waitFor(() => {
        expect(result.current.isSavedPromptsEnabled).toBe(false);
      });

      const bucket = mockStorageApi.forBucket('lightspeed');
      const snapshot = bucket.snapshot<boolean>('savedPromptsEnabled');
      expect(snapshot.value).toBeUndefined();
    });
  });
});
