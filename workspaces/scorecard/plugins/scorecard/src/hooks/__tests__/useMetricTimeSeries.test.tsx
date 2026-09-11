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
import { useEntity } from '@backstage/plugin-catalog-react';
import { useQuery } from '@tanstack/react-query';
import type { MetricTimeSeriesResponse } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import { TIME_SERIES_DEFAULT_RANGE_DAYS } from '../../utils/constants';
import { useMetricTimeSeries } from '../useMetricTimeSeries';

jest.mock('@backstage/plugin-catalog-react');
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

const mockUseEntity = useEntity as jest.MockedFunction<typeof useEntity>;
const mockUseApi = useApi as jest.MockedFunction<typeof useApi>;
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;

describe('useMetricTimeSeries', () => {
  const mockScorecardApi = {
    getMetricTimeSeries: jest.fn(),
  };

  const mockEntity = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      namespace: 'default',
      name: 'dora-scorecard',
    },
  };

  const timeSeries: MetricTimeSeriesResponse = {
    metricId: 'dora.deploymentFrequency',
    entityRef: 'component:default/dora-scorecard',
    points: [{ value: 8, timestamp: '2026-04-27T23:10:00.000Z' }],
    metadata: {
      title: 'DORA - Deployment Frequency',
      description: 'How often we deploy',
      type: 'number',
      history: true,
      defaultVisualization: 'sparkline',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseEntity.mockReturnValue({ entity: { ...mockEntity } });
    mockUseApi.mockReturnValue(mockScorecardApi);
  });

  it('should return time series data when the query succeeds', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error: null,
      data: timeSeries,
    } as any);

    const { result } = renderHook(() =>
      useMetricTimeSeries('dora.deploymentFrequency'),
    );

    expect(result.current).toEqual({
      data: timeSeries,
      isLoading: false,
      error: undefined,
    });
  });

  it('should call useQuery with entity, metric, and range in the queryKey', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error: null,
      data: undefined,
    } as any);

    renderHook(() => useMetricTimeSeries('dora.deploymentFrequency'));

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [
          'metricTimeSeries',
          'component:default/dora-scorecard',
          'dora.deploymentFrequency',
          TIME_SERIES_DEFAULT_RANGE_DAYS,
        ],
        enabled: true,
      }),
    );
  });

  it('should disable the query when metric id is empty', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error: null,
      data: undefined,
    } as any);

    renderHook(() => useMetricTimeSeries(''));

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      }),
    );
  });

  it('should call getMetricTimeSeries with entity, metric id, and a 30-day range', async () => {
    mockScorecardApi.getMetricTimeSeries.mockResolvedValue(timeSeries);
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error: null,
      data: undefined,
    } as any);

    renderHook(() => useMetricTimeSeries('dora.deploymentFrequency'));

    const queryFn = mockUseQuery.mock.calls[0][0]
      .queryFn as () => Promise<unknown>;
    await queryFn();

    expect(mockScorecardApi.getMetricTimeSeries).toHaveBeenCalledWith({
      entity: mockEntity,
      metricId: 'dora.deploymentFrequency',
      from: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      to: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    });
  });

  it('should wrap non-Error rejections with translated fetch error', async () => {
    mockScorecardApi.getMetricTimeSeries.mockRejectedValue(503);
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error: null,
      data: undefined,
    } as any);

    renderHook(() => useMetricTimeSeries('dora.deploymentFrequency'));

    const queryFn = mockUseQuery.mock.calls[0][0]
      .queryFn as () => Promise<unknown>;
    await expect(queryFn()).rejects.toThrow('fetch:503');
  });

  it('should return loading state while fetching', () => {
    mockUseQuery.mockReturnValue({
      isLoading: true,
      error: null,
      data: undefined,
    } as any);

    const { result } = renderHook(() =>
      useMetricTimeSeries('dora.deploymentFrequency'),
    );

    expect(result.current).toEqual({
      data: undefined,
      isLoading: true,
      error: undefined,
    });
  });
});
