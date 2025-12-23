/*
 * Copyright The Backstage Authors
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

import { renderHook, waitFor } from '@testing-library/react';
import { useQuery } from '@tanstack/react-query';

import { usePluginConfigurationPermissions } from './usePluginConfigurationPermissions';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

describe('usePluginConfigurationPermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns read and write permissions when namespace and name are provided', async () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: { read: 'ALLOW', write: 'ALLOW' },
      isLoading: false,
      error: undefined,
    });

    const { result } = renderHook(() =>
      usePluginConfigurationPermissions('default', 'my-plugin'),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual({ read: 'ALLOW', write: 'ALLOW' });
    expect(result.current.error).toBeUndefined();
  });

  it('returns DENY permissions when namespace is empty', async () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: { read: 'DENY', write: 'DENY' },
      isLoading: false,
      error: undefined,
    });

    const { result } = renderHook(() =>
      usePluginConfigurationPermissions('', 'my-plugin'),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual({ read: 'DENY', write: 'DENY' });
  });

  it('returns DENY permissions when name is empty', async () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: { read: 'DENY', write: 'DENY' },
      isLoading: false,
      error: undefined,
    });

    const { result } = renderHook(() =>
      usePluginConfigurationPermissions('default', ''),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual({ read: 'DENY', write: 'DENY' });
  });

  it('returns read-only permissions', async () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: { read: 'ALLOW', write: 'DENY' },
      isLoading: false,
      error: undefined,
    });

    const { result } = renderHook(() =>
      usePluginConfigurationPermissions('default', 'my-plugin'),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual({ read: 'ALLOW', write: 'DENY' });
  });

  it('handles loading state', async () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
    });

    const { result } = renderHook(() =>
      usePluginConfigurationPermissions('default', 'my-plugin'),
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('handles error state', async () => {
    const error = new Error('Failed to fetch permissions');
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error,
    });

    const { result } = renderHook(() =>
      usePluginConfigurationPermissions('default', 'my-plugin'),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Failed to fetch permissions');
  });

  it('uses correct query key with namespace and name', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: { read: 'ALLOW', write: 'ALLOW' },
      isLoading: false,
      error: undefined,
    });

    renderHook(() =>
      usePluginConfigurationPermissions('my-namespace', 'my-plugin'),
    );

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [
          'marketplaceApi',
          'getPluginConfigAuthorization',
          'my-namespace',
          'my-plugin',
        ],
      }),
    );
  });
});
