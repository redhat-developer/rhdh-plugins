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

import { ChatbotDisplayMode } from '@patternfly/chatbot';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useDisplayModeSettings } from '../useDisplayModeSettings';

describe('useDisplayModeSettings', () => {
  // Use a non-guest user for most tests (guest users don't persist)
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
    it('should initialize with default value when user is undefined', () => {
      const { result } = renderHook(
        () => useDisplayModeSettings(undefined, ChatbotDisplayMode.default),
        {
          wrapper: createWrapper(mockStorageApi),
        },
      );

      expect(result.current.displayMode).toBe(ChatbotDisplayMode.default);
    });

    it('should initialize with default value for a new user', () => {
      const { result } = renderHook(
        () => useDisplayModeSettings(mockUser, ChatbotDisplayMode.default),
        {
          wrapper: createWrapper(mockStorageApi),
        },
      );

      expect(result.current.displayMode).toBe(ChatbotDisplayMode.default);
    });

    it('should initialize with default for guest user without loading from storage', async () => {
      const { result } = renderHook(
        () => useDisplayModeSettings(guestUser, ChatbotDisplayMode.default),
        {
          wrapper: createWrapper(mockStorageApi),
        },
      );

      // Guest users should always get default values
      expect(result.current.displayMode).toBe(ChatbotDisplayMode.default);
    });

    it('should load persisted value from storage', async () => {
      // Set a value in storage first
      const bucket = mockStorageApi.forBucket('lightspeed');
      await bucket.set('displayMode', ChatbotDisplayMode.docked);

      const { result } = renderHook(
        () => useDisplayModeSettings(mockUser, ChatbotDisplayMode.default),
        {
          wrapper: createWrapper(mockStorageApi),
        },
      );

      await waitFor(() => {
        expect(result.current.displayMode).toBe(ChatbotDisplayMode.docked);
      });
    });
  });

  describe('setDisplayMode', () => {
    it('should change display mode to docked', async () => {
      const { result } = renderHook(
        () => useDisplayModeSettings(mockUser, ChatbotDisplayMode.default),
        {
          wrapper: createWrapper(mockStorageApi),
        },
      );

      expect(result.current.displayMode).toBe(ChatbotDisplayMode.default);

      act(() => {
        result.current.setDisplayMode(ChatbotDisplayMode.docked);
      });

      await waitFor(() => {
        expect(result.current.displayMode).toBe(ChatbotDisplayMode.docked);
      });

      // Verify it was persisted
      const bucket = mockStorageApi.forBucket('lightspeed');
      const snapshot = bucket.snapshot<ChatbotDisplayMode>('displayMode');
      expect(snapshot.value).toBe(ChatbotDisplayMode.docked);
    });

    it('should change display mode to embedded', async () => {
      const { result } = renderHook(
        () => useDisplayModeSettings(mockUser, ChatbotDisplayMode.default),
        {
          wrapper: createWrapper(mockStorageApi),
        },
      );

      act(() => {
        result.current.setDisplayMode(ChatbotDisplayMode.embedded);
      });

      await waitFor(() => {
        expect(result.current.displayMode).toBe(ChatbotDisplayMode.embedded);
      });

      // Verify it was persisted
      const bucket = mockStorageApi.forBucket('lightspeed');
      const snapshot = bucket.snapshot<ChatbotDisplayMode>('displayMode');
      expect(snapshot.value).toBe(ChatbotDisplayMode.embedded);
    });

    it('should not persist for guest users', async () => {
      const { result } = renderHook(
        () => useDisplayModeSettings(guestUser, ChatbotDisplayMode.default),
        {
          wrapper: createWrapper(mockStorageApi),
        },
      );

      act(() => {
        result.current.setDisplayMode(ChatbotDisplayMode.docked);
      });

      await waitFor(() => {
        // State should change locally
        expect(result.current.displayMode).toBe(ChatbotDisplayMode.docked);
      });

      // But should not be persisted
      const bucket = mockStorageApi.forBucket('lightspeed');
      const snapshot = bucket.snapshot<ChatbotDisplayMode>('displayMode');
      expect(snapshot.value).toBeUndefined();
    });

    it('should not change mode when user is undefined', async () => {
      const { result } = renderHook(
        () => useDisplayModeSettings(undefined, ChatbotDisplayMode.default),
        {
          wrapper: createWrapper(mockStorageApi),
        },
      );

      const initialMode = result.current.displayMode;

      act(() => {
        result.current.setDisplayMode(ChatbotDisplayMode.docked);
      });

      // Should remain unchanged
      expect(result.current.displayMode).toBe(initialMode);
    });
  });

  describe('cross-tab synchronization', () => {
    it('should update when storage changes (simulating cross-tab sync)', async () => {
      const { result } = renderHook(
        () => useDisplayModeSettings(mockUser, ChatbotDisplayMode.default),
        {
          wrapper: createWrapper(mockStorageApi),
        },
      );

      expect(result.current.displayMode).toBe(ChatbotDisplayMode.default);

      // Simulate storage change from another tab
      const bucket = mockStorageApi.forBucket('lightspeed');
      await bucket.set('displayMode', ChatbotDisplayMode.docked);

      await waitFor(() => {
        expect(result.current.displayMode).toBe(ChatbotDisplayMode.docked);
      });
    });
  });
});
