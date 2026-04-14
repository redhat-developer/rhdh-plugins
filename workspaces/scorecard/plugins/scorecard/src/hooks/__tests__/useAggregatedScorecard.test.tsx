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
import {
  DEFAULT_NUMBER_THRESHOLDS,
  type AggregatedMetricResult,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import { useAggregatedScorecard } from '../useAggregatedScorecard';
import { useTranslation } from '../useTranslation';

jest.mock('@backstage/core-plugin-api');
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));
jest.mock('../useTranslation', () => ({
  useTranslation: jest.fn(),
}));

const mockUseApi = useApi as jest.MockedFunction<typeof useApi>;
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;

describe('useAggregatedScorecard', () => {
  const mockScorecardApi = {
    getAggregatedScorecard: jest.fn(),
  };

  const mockAggregated: AggregatedMetricResult = {
    id: 'kpi1',
    status: 'success',
    metadata: {
      title: 'T',
      description: 'D',
      type: 'number',
      history: true,
      aggregationType: 'statusGrouped',
    },
    result: {
      total: 1,
      values: [{ name: 'success', count: 1 }],
      timestamp: '2025-01-01T00:00:00Z',
      thresholds: DEFAULT_NUMBER_THRESHOLDS,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseApi.mockReturnValue(mockScorecardApi);
    (useTranslation as jest.Mock).mockImplementation(() => ({
      t: (key: string, opts?: { error?: string }) =>
        key === 'errors.fetchError' && opts?.error !== undefined
          ? `fetch:${opts.error}`
          : key,
    }));
  });

  it('should return aggregated data when API succeeds', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error: null,
      data: mockAggregated,
    } as any);

    const { result } = renderHook(() =>
      useAggregatedScorecard({ aggregationId: 'kpi1' }),
    );

    expect(result.current).toEqual({
      data: mockAggregated,
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
      useAggregatedScorecard({ aggregationId: 'kpi1' }),
    );

    expect(result.current).toEqual({
      data: undefined,
      isLoading: true,
      error: undefined,
    });
  });

  it('should return error when useQuery has error', () => {
    const apiError = new Error('backend failed');
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error: apiError,
      data: undefined,
    } as any);

    const { result } = renderHook(() =>
      useAggregatedScorecard({ aggregationId: 'kpi1' }),
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

    renderHook(() => useAggregatedScorecard({ aggregationId: 'myAgg' }));

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['aggregatedScorecard', 'myAgg'],
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

    renderHook(() => useAggregatedScorecard({ aggregationId: '' }));

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

    renderHook(() => useAggregatedScorecard({ aggregationId: '   ' }));

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
      useAggregatedScorecard({ aggregationId: 'kpi1', enabled: false }),
    );

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      }),
    );
  });

  it('should call getAggregatedScorecard with aggregationId in queryFn', async () => {
    mockScorecardApi.getAggregatedScorecard.mockResolvedValue(mockAggregated);
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error: null,
      data: undefined,
    } as any);

    renderHook(() => useAggregatedScorecard({ aggregationId: 'aggX' }));

    const queryFn = mockUseQuery.mock.calls[0][0]
      .queryFn as () => Promise<unknown>;
    await queryFn();

    expect(mockScorecardApi.getAggregatedScorecard).toHaveBeenCalledWith(
      'aggX',
    );
  });

  it('should propagate Error instances from the API', async () => {
    const apiError = new Error('backend failed');
    mockScorecardApi.getAggregatedScorecard.mockRejectedValue(apiError);
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error: null,
      data: undefined,
    } as any);

    renderHook(() => useAggregatedScorecard({ aggregationId: 'kpi1' }));

    const queryFn = mockUseQuery.mock.calls[0][0]
      .queryFn as () => Promise<unknown>;
    await expect(queryFn()).rejects.toBe(apiError);
  });

  it('should wrap non-Error rejections with translated fetch error', async () => {
    mockScorecardApi.getAggregatedScorecard.mockRejectedValue('not an error');
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error: null,
      data: undefined,
    } as any);

    renderHook(() => useAggregatedScorecard({ aggregationId: 'kpi1' }));

    const queryFn = mockUseQuery.mock.calls[0][0]
      .queryFn as () => Promise<unknown>;
    await expect(queryFn()).rejects.toThrow('fetch:not an error');
  });
});
