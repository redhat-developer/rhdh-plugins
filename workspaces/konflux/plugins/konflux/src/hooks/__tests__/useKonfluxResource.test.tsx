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

import { renderHook } from '@testing-library/react';
import { useKonfluxResource } from '../useKonfluxResource';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useApi } from '@backstage/core-plugin-api';
import { useKonfluxConfig } from '../useKonfluxConfig';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Entity } from '@backstage/catalog-model';

jest.mock('@backstage/plugin-catalog-react', () => ({
  ...jest.requireActual('@backstage/plugin-catalog-react'),
  useEntity: jest.fn(),
}));

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));

jest.mock('../useKonfluxConfig', () => ({
  useKonfluxConfig: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useInfiniteQuery: jest.fn(),
}));

const mockUseEntity = useEntity as jest.MockedFunction<typeof useEntity>;
const mockUseApi = useApi as jest.MockedFunction<typeof useApi>;
const mockUseKonfluxConfig = useKonfluxConfig as jest.MockedFunction<
  typeof useKonfluxConfig
>;
const mockUseInfiniteQuery = useInfiniteQuery as jest.MockedFunction<
  typeof useInfiniteQuery
>;

describe('useKonfluxResource', () => {
  const mockEntity: Entity = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'test-entity',
      namespace: 'default',
    },
  };

  const mockDiscoveryApi = {
    getBaseUrl: jest
      .fn()
      .mockResolvedValue('http://localhost:7007/api/konflux'),
  };

  const mockFetchApi = {
    fetch: jest.fn(),
  };

  const mockOidcApi = {
    getIdToken: jest.fn().mockResolvedValue('mock-oidc-token'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseEntity.mockReturnValue({ entity: mockEntity });
    mockUseApi.mockImplementation((apiRef: any) => {
      if (apiRef.id === 'core.discovery') {
        return mockDiscoveryApi;
      }
      if (apiRef.id === 'core.fetch') {
        return mockFetchApi;
      }
      if (apiRef.id === 'internal.auth.oidc') {
        return mockOidcApi;
      }
      return undefined;
    });
    mockUseKonfluxConfig.mockReturnValue({
      clusters: {},
      subcomponentConfigs: [],
      authProvider: 'serviceAccount',
    });
  });

  it('should return loading state when query is loading', () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: false,
      isSuccess: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);

    const { result } = renderHook(() => useKonfluxResource('applications'));

    expect(result.current.loaded).toBe(false);
    expect(result.current.isFetching).toBe(false);
    expect(result.current.data).toEqual([]);
  });

  it('should return data when query succeeds', () => {
    const mockData = [
      {
        apiVersion: 'v1',
        apiGroup: 'test',
        kind: 'Application',
        metadata: { name: 'app1' },
        cluster: { name: 'cluster1' },
      },
      {
        apiVersion: 'v1',
        apiGroup: 'test',
        kind: 'Application',
        metadata: { name: 'app2' },
        cluster: { name: 'cluster1' },
      },
    ];

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [{ data: mockData, continuationToken: undefined }],
      },
      isLoading: false,
      isFetching: false,
      isSuccess: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);

    const { result } = renderHook(() => useKonfluxResource('applications'));

    expect(result.current.data).toEqual(mockData);
    expect(result.current.loaded).toBe(true);
    expect(result.current.isFetching).toBe(false);
  });

  it('should aggregate data from multiple pages', () => {
    const page1Data = [
      {
        apiVersion: 'v1',
        apiGroup: 'test',
        kind: 'Application',
        metadata: { name: 'app1' },
        cluster: { name: 'cluster1' },
      },
    ];
    const page2Data = [
      {
        apiVersion: 'v1',
        apiGroup: 'test',
        kind: 'Application',
        metadata: { name: 'app2' },
        cluster: { name: 'cluster1' },
      },
    ];

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          { data: page1Data, continuationToken: 'token1' },
          { data: page2Data, continuationToken: undefined },
        ],
      },
      isLoading: false,
      isFetching: false,
      isSuccess: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);

    const { result } = renderHook(() => useKonfluxResource('applications'));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data).toEqual([...page1Data, ...page2Data]);
  });

  it('should return error when query fails', () => {
    const mockError = new Error('Network error');

    mockUseInfiniteQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isSuccess: false,
      isError: true,
      error: mockError,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);

    const { result } = renderHook(() => useKonfluxResource('applications'));

    expect(result.current.error).toBe('Network error');
    expect(result.current.loaded).toBe(true);
  });

  it('should return clusterErrors from last page', () => {
    const mockClusterErrors = [
      {
        cluster: 'cluster1',
        namespace: 'namespace1',
        error: 'Connection failed',
      },
    ];

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          { data: [], continuationToken: 'token1' },
          { data: [], clusterErrors: mockClusterErrors },
        ],
      },
      isLoading: false,
      isFetching: false,
      isSuccess: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);

    const { result } = renderHook(() => useKonfluxResource('applications'));

    expect(result.current.clusterErrors).toEqual(mockClusterErrors);
  });

  it('should return hasMore when there are more pages', () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [{ data: [], continuationToken: 'token1' }],
      },
      isLoading: false,
      isFetching: false,
      isSuccess: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      hasNextPage: true,
      isFetchingNextPage: false,
    } as any);

    const { result } = renderHook(() => useKonfluxResource('applications'));

    expect(result.current.hasMore).toBe(true);
  });

  it('should call loadMore when hasMore is true', async () => {
    const mockFetchNextPage = jest.fn().mockResolvedValue(undefined);

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [{ data: [], continuationToken: 'token1' }],
      },
      isLoading: false,
      isFetching: false,
      isSuccess: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
      fetchNextPage: mockFetchNextPage,
      hasNextPage: true,
      isFetchingNextPage: false,
    } as any);

    const { result } = renderHook(() => useKonfluxResource('applications'));

    await result.current.loadMore();

    expect(mockFetchNextPage).toHaveBeenCalled();
  });

  it('should not call loadMore when hasMore is false', async () => {
    const mockFetchNextPage = jest.fn();

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [{ data: [], continuationToken: undefined }],
      },
      isLoading: false,
      isFetching: false,
      isSuccess: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
      fetchNextPage: mockFetchNextPage,
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);

    const { result } = renderHook(() => useKonfluxResource('applications'));

    await result.current.loadMore();

    expect(mockFetchNextPage).not.toHaveBeenCalled();
  });

  it('should not call loadMore when already fetching', async () => {
    const mockFetchNextPage = jest.fn();

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [{ data: [], continuationToken: 'token1' }],
      },
      isLoading: false,
      isFetching: false,
      isSuccess: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
      fetchNextPage: mockFetchNextPage,
      hasNextPage: true,
      isFetchingNextPage: true,
    } as any);

    const { result } = renderHook(() => useKonfluxResource('applications'));

    await result.current.loadMore();

    expect(mockFetchNextPage).not.toHaveBeenCalled();
  });

  it('should call refetch when refetch is called', () => {
    const mockRefetch = jest.fn();

    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [{ data: [] }],
      },
      isLoading: false,
      isFetching: false,
      isSuccess: true,
      isError: false,
      error: null,
      refetch: mockRefetch,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);

    const { result } = renderHook(() => useKonfluxResource('applications'));

    result.current.refetch();

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('should pass options to query key', () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [{ data: [] }] },
      isLoading: false,
      isFetching: false,
      isSuccess: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);

    renderHook(() =>
      useKonfluxResource('applications', {
        subcomponent: 'sub1',
        clusters: ['cluster1', 'cluster2'],
        application: 'app1',
      }),
    );

    expect(mockUseInfiniteQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [
          'konflux',
          'resources',
          'applications',
          'component:default/test-entity',
          'sub1',
          'cluster1,cluster2',
          'app1',
        ],
      }),
    );
  });

  it('should disable query when enabled is false', () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isSuccess: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);

    renderHook(() => useKonfluxResource('applications', { enabled: false }));

    expect(mockUseInfiniteQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      }),
    );
  });

  it('should disable query when entity is missing', () => {
    mockUseEntity.mockReturnValue({ entity: undefined as any });

    mockUseInfiniteQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isSuccess: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);

    renderHook(() => useKonfluxResource('applications'));

    expect(mockUseInfiniteQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      }),
    );
  });

  it('should handle OIDC token when authProvider is oidc', () => {
    mockUseKonfluxConfig.mockReturnValue({
      clusters: {},
      subcomponentConfigs: [],
      authProvider: 'oidc',
    });

    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [{ data: [] }] },
      isLoading: false,
      isFetching: false,
      isSuccess: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);

    renderHook(() => useKonfluxResource('applications'));

    expect(mockUseInfiniteQuery).toHaveBeenCalled();
    const callArgs = mockUseInfiniteQuery.mock.calls[0][0] as any;
    expect(callArgs.queryFn).toBeDefined();
    expect(typeof callArgs.queryFn).toBe('function');
  });

  it('should handle OIDC token fetch failure gracefully', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    mockUseKonfluxConfig.mockReturnValue({
      clusters: {},
      subcomponentConfigs: [],
      authProvider: 'oidc',
    });
    mockOidcApi.getIdToken.mockRejectedValue(new Error('Token fetch failed'));

    mockFetchApi.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ data: [] }),
    } as any);

    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [{ data: [] }] },
      isLoading: false,
      isFetching: false,
      isSuccess: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);

    renderHook(() => useKonfluxResource('applications'));

    const callArgs = mockUseInfiniteQuery.mock.calls[0][0] as any;
    const queryFn = callArgs.queryFn as (params: {
      pageParam?: string;
    }) => Promise<any>;

    await queryFn({ pageParam: undefined });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Failed to get OIDC token:',
      expect.any(Error),
    );

    consoleWarnSpy.mockRestore();
  });

  it('should return isFetching state correctly', () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [{ data: [] }] },
      isLoading: false,
      isFetching: true,
      isSuccess: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);

    const { result } = renderHook(() => useKonfluxResource('applications'));

    expect(result.current.isFetching).toBe(true);
  });

  it('should handle empty data pages', () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          { data: [], continuationToken: undefined },
          { data: [], continuationToken: undefined },
        ],
      },
      isLoading: false,
      isFetching: false,
      isSuccess: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);

    const { result } = renderHook(() => useKonfluxResource('applications'));

    expect(result.current.data).toEqual([]);
  });

  it('should handle non-Error error objects', () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isSuccess: false,
      isError: true,
      error: { message: 'Custom error' } as any,
      refetch: jest.fn(),
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as any);

    const { result } = renderHook(() => useKonfluxResource('applications'));

    expect(result.current.error).toBeUndefined();
  });
});
