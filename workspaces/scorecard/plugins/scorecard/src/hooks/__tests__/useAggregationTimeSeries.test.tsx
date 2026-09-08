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
import type { AggregatedMetricTimeSeriesResponse } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import { useAggregationTimeSeries } from '../useAggregationTimeSeries';
import { TIME_SERIES_DEFAULT_RANGE_DAYS } from '../../utils/constants';

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

describe('useAggregationTimeSeries', () => {
  const mockScorecardApi = {
    getAggregationTimeSeries: jest.fn(),
  };

  const timeSeries: AggregatedMetricTimeSeriesResponse = {
    id: 'avgDeploymentFrequency',
    metricId: 'dora.deploymentFrequency',
    points: [
      {
        value: 10,
        successCount: 5,
        errorCount: 0,
        total: 5,
        status: 'success',
        timestamp: '2026-08-23T00:00:00.000Z',
      },
    ],
    metadata: {
      title: 'Average Deployment Frequency',
      description: 'Average weekly production deploys',
      type: 'number',
      history: true,
      visualization: 'sparkline',
      aggregationType: 'average',
    },
    thresholds: { rules: [] },
    aggregationChartDisplayColor: 'warning.main',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseApi.mockReturnValue(mockScorecardApi);
  });

  it('should return time series data when the query succeeds', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error: null,
      data: timeSeries,
    } as any);

    const { result } = renderHook(() =>
      useAggregationTimeSeries({ aggregationId: 'avgDeploymentFrequency' }),
    );

    expect(result.current).toEqual({
      data: timeSeries,
      isLoading: false,
      error: undefined,
    });
  });

  it('should call useQuery with the correct queryKey and enabled flag', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error: null,
      data: undefined,
    } as any);

    renderHook(() =>
      useAggregationTimeSeries({ aggregationId: 'avgDeploymentFrequency' }),
    );

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [
          'aggregationTimeSeries',
          'avgDeploymentFrequency',
          TIME_SERIES_DEFAULT_RANGE_DAYS,
        ],
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

    renderHook(() => useAggregationTimeSeries({ aggregationId: '' }));

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
      useAggregationTimeSeries({
        aggregationId: 'avgDeploymentFrequency',
        enabled: false,
      }),
    );

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      }),
    );
  });

  it('should call getAggregationTimeSeries with aggregationId and a 30-day range', async () => {
    mockScorecardApi.getAggregationTimeSeries.mockResolvedValue(timeSeries);
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error: null,
      data: undefined,
    } as any);

    renderHook(() =>
      useAggregationTimeSeries({ aggregationId: 'avgDeploymentFrequency' }),
    );

    const queryFn = mockUseQuery.mock.calls[0][0]
      .queryFn as () => Promise<unknown>;
    await queryFn();

    expect(mockScorecardApi.getAggregationTimeSeries).toHaveBeenCalledWith({
      aggregationId: 'avgDeploymentFrequency',
      from: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      to: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    });
  });

  it('should wrap non-Error rejections with translated fetch error', async () => {
    mockScorecardApi.getAggregationTimeSeries.mockRejectedValue(503);
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error: null,
      data: undefined,
    } as any);

    renderHook(() =>
      useAggregationTimeSeries({ aggregationId: 'avgDeploymentFrequency' }),
    );

    const queryFn = mockUseQuery.mock.calls[0][0]
      .queryFn as () => Promise<unknown>;
    await expect(queryFn()).rejects.toThrow('fetch:503');
  });
});
