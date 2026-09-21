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

import { useScreenContextSettings } from '../useScreenContextSettings';

describe('useScreenContextSettings', () => {
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

  it('defaults sharing to false and paused to false for signed-in user', () => {
    const { result } = renderHook(() => useScreenContextSettings(mockUser), {
      wrapper: createWrapper(mockStorageApi),
    });

    expect(result.current.isScreenContextSharingEnabled).toBe(false);
    expect(result.current.isScreenContextPaused).toBe(false);
  });

  it('toggles sharing and resets paused when disabling', async () => {
    const { result } = renderHook(() => useScreenContextSettings(mockUser), {
      wrapper: createWrapper(mockStorageApi),
    });

    act(() => {
      result.current.handleScreenContextSharingToggle(true);
    });

    await waitFor(() => {
      expect(result.current.isScreenContextSharingEnabled).toBe(true);
    });

    act(() => {
      result.current.setScreenContextPaused(true);
    });

    await waitFor(() => {
      expect(result.current.isScreenContextPaused).toBe(true);
    });

    act(() => {
      result.current.handleScreenContextSharingToggle(false);
    });

    await waitFor(() => {
      expect(result.current.isScreenContextSharingEnabled).toBe(false);
      expect(result.current.isScreenContextPaused).toBe(false);
    });
  });

  it('toggles paused state', async () => {
    const { result } = renderHook(() => useScreenContextSettings(mockUser), {
      wrapper: createWrapper(mockStorageApi),
    });

    act(() => {
      result.current.handleScreenContextSharingToggle(true);
      result.current.toggleScreenContextPaused();
    });

    await waitFor(() => {
      expect(result.current.isScreenContextPaused).toBe(true);
    });

    act(() => {
      result.current.toggleScreenContextPaused();
    });

    await waitFor(() => {
      expect(result.current.isScreenContextPaused).toBe(false);
    });
  });

  it('does not persist for guest users', async () => {
    const { result } = renderHook(() => useScreenContextSettings(guestUser), {
      wrapper: createWrapper(mockStorageApi),
    });

    act(() => {
      result.current.handleScreenContextSharingToggle(true);
    });

    await waitFor(() => {
      expect(result.current.isScreenContextSharingEnabled).toBe(true);
    });

    const bucket = mockStorageApi.forBucket('lightspeed');
    expect(
      bucket.snapshot('screenContextSharingEnabled').value,
    ).toBeUndefined();
  });
});
