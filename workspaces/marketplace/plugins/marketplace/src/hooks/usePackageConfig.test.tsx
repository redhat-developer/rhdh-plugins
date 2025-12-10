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

import { usePackageConfig } from './usePackageConfig';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

describe('usePackageConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns package config when namespace and name are provided', async () => {
    const mockConfig = { configYaml: 'key: value\nother: config' };
    (useQuery as jest.Mock).mockReturnValue({
      data: mockConfig,
      isLoading: false,
      error: undefined,
    });

    const { result } = renderHook(() =>
      usePackageConfig('default', 'my-package'),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(mockConfig);
    expect(result.current.error).toBeUndefined();
  });

  it('returns null when namespace is empty', async () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: undefined,
    });

    const { result } = renderHook(() => usePackageConfig('', 'my-package'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toBeNull();
  });

  it('returns null when name is empty', async () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: undefined,
    });

    const { result } = renderHook(() => usePackageConfig('default', ''));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toBeNull();
  });

  it('handles loading state', async () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
    });

    const { result } = renderHook(() =>
      usePackageConfig('default', 'my-package'),
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('handles error state', async () => {
    const error = new Error('Failed to fetch package config');
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error,
    });

    const { result } = renderHook(() =>
      usePackageConfig('default', 'my-package'),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe(
      'Failed to fetch package config',
    );
  });

  it('uses correct query key with namespace and name', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: { configYaml: '' },
      isLoading: false,
      error: undefined,
    });

    renderHook(() => usePackageConfig('my-namespace', 'my-package'));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [
          'marketplaceApi',
          'getPackageConfigByName',
          'my-namespace',
          'my-package',
        ],
        refetchOnWindowFocus: false,
      }),
    );
  });

  it('disables refetch on window focus', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: { configYaml: '' },
      isLoading: false,
      error: undefined,
    });

    renderHook(() => usePackageConfig('default', 'my-package'));

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        refetchOnWindowFocus: false,
      }),
    );
  });
});
