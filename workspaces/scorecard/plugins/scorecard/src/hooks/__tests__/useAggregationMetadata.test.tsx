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
import { useApi } from '@backstage/core-plugin-api';
import { useQuery } from '@tanstack/react-query';

import { useAggregationMetadata } from '../useAggregationMetadata';

jest.mock('@backstage/core-plugin-api');
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));
jest.mock('../useTranslation', () => ({
  useTranslation: jest.fn().mockReturnValue({
    t: (key: string, opts?: { error?: string }) =>
      key === 'errors.fetchError' && opts?.error !== undefined
        ? `fetch:${opts.error}`
        : key,
  }),
}));

const mockUseApi = useApi as jest.MockedFunction<typeof useApi>;
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;

describe('useAggregationMetadata', () => {
  const mockScorecardApi = {
    getAggregationMetadata: jest.fn(),
  };

  const mockMeta = {
    title: 'Title',
    description: 'Desc',
    type: 'number' as const,
    history: true,
    aggregationType: 'statusGrouped' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseApi.mockReturnValue(mockScorecardApi);
  });

  it('should return metadata when API succeeds', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error: null,
      data: mockMeta,
    } as any);

    const { result } = renderHook(() =>
      useAggregationMetadata({ aggregationId: 'kpi1' }),
    );

    expect(result.current).toEqual({
      data: mockMeta,
      isLoading: false,
      error: undefined,
    });
  });

  it('should return loading state from useQuery', () => {
    mockUseQuery.mockReturnValue({
      isLoading: true,
      error: null,
      data: undefined,
    } as any);

    const { result } = renderHook(() =>
      useAggregationMetadata({ aggregationId: 'kpi1' }),
    );

    expect(result.current).toEqual({
      data: undefined,
      isLoading: true,
      error: undefined,
    });
  });

  it('should return error when useQuery has error', () => {
    const apiError = new Error('metadata failed');
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error: apiError,
      data: undefined,
    } as any);

    const { result } = renderHook(() =>
      useAggregationMetadata({ aggregationId: 'kpi1' }),
    );

    expect(result.current).toEqual({
      data: undefined,
      isLoading: false,
      error: apiError,
    });
  });

  it('should call useQuery with the correct queryKey and enabled flag', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error: null,
      data: undefined,
    } as any);

    renderHook(() => useAggregationMetadata({ aggregationId: 'metaAgg' }));

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['aggregationMetadata', 'metaAgg'],
        enabled: true,
      }),
    );
  });

  it('should disable the query when aggregationId is empty', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error: null,
      data: undefined,
    } as any);

    renderHook(() => useAggregationMetadata({ aggregationId: '' }));

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      }),
    );
  });

  it('should disable the query when aggregationId is whitespace only', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error: null,
      data: undefined,
    } as any);

    renderHook(() => useAggregationMetadata({ aggregationId: '   ' }));

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      }),
    );
  });

  it('should respect the enabled option', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error: null,
      data: undefined,
    } as any);

    renderHook(() =>
      useAggregationMetadata({ aggregationId: 'kpi1', enabled: false }),
    );

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      }),
    );
  });

  it('should call getAggregationMetadata with aggregationId in queryFn', async () => {
    mockScorecardApi.getAggregationMetadata.mockResolvedValue(mockMeta);
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error: null,
      data: undefined,
    } as any);

    renderHook(() => useAggregationMetadata({ aggregationId: 'aggY' }));

    const queryFn = mockUseQuery.mock.calls[0][0]
      .queryFn as () => Promise<unknown>;
    await queryFn();

    expect(mockScorecardApi.getAggregationMetadata).toHaveBeenCalledWith(
      'aggY',
    );
  });

  it('should propagate Error instances from the API', async () => {
    const apiError = new Error('metadata failed');
    mockScorecardApi.getAggregationMetadata.mockRejectedValue(apiError);
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error: null,
      data: undefined,
    } as any);

    renderHook(() => useAggregationMetadata({ aggregationId: 'kpi1' }));

    const queryFn = mockUseQuery.mock.calls[0][0]
      .queryFn as () => Promise<unknown>;
    await expect(queryFn()).rejects.toBe(apiError);
  });

  it('should wrap non-Error rejections with translated fetch error', async () => {
    mockScorecardApi.getAggregationMetadata.mockRejectedValue(503);
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error: null,
      data: undefined,
    } as any);

    renderHook(() => useAggregationMetadata({ aggregationId: 'kpi1' }));

    const queryFn = mockUseQuery.mock.calls[0][0]
      .queryFn as () => Promise<unknown>;
    await expect(queryFn()).rejects.toThrow('fetch:503');
  });
});
