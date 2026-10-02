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
import type { EntityMetricDetailResponse } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import { useAggregatedScorecardEntities } from '../useAggregatedScorecardEntities';
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

const detailResponse = {
  metricId: 'github.openPRs',
} as EntityMetricDetailResponse;

describe('useAggregatedScorecardEntities', () => {
  const mockScorecardApi = {
    getAggregatedScorecardEntities: jest.fn(),
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

  function queryFn(): () => Promise<unknown> {
    return mockUseQuery.mock.calls[0][0].queryFn as () => Promise<unknown>;
  }

  it('passes metric, page, and sort options through to the client', async () => {
    mockScorecardApi.getAggregatedScorecardEntities.mockResolvedValue(
      detailResponse,
    );
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error: null,
      data: detailResponse,
    } as any);

    const { result } = renderHook(() =>
      useAggregatedScorecardEntities({
        metricId: 'github.openPRs',
        page: 2,
        pageSize: 20,
        ownershipEntityRefs: ['group:default/team-a'],
        orderBy: 'entityRef',
        order: 'desc',
      }),
    );

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [
          'aggregatedScorecardEntities',
          'github.openPRs',
          2,
          20,
          ['group:default/team-a'],
          'entityRef',
          'desc',
        ],
        enabled: true,
      }),
    );
    await expect(queryFn()).resolves.toBe(detailResponse);
    expect(
      mockScorecardApi.getAggregatedScorecardEntities,
    ).toHaveBeenCalledWith({
      metricId: 'github.openPRs',
      page: 2,
      pageSize: 20,
      ownershipEntityRefs: ['group:default/team-a'],
      orderBy: 'entityRef',
      order: 'desc',
    });
    expect(result.current).toEqual({
      aggregatedScorecardEntities: detailResponse,
      loadingData: false,
      error: null,
    });
  });

  it('uses the default page, page size, and sort when they are omitted', async () => {
    mockScorecardApi.getAggregatedScorecardEntities.mockResolvedValue(
      detailResponse,
    );
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error: null,
      data: undefined,
    } as any);

    renderHook(() =>
      useAggregatedScorecardEntities({ metricId: 'github.openPRs' }),
    );

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [
          'aggregatedScorecardEntities',
          'github.openPRs',
          1,
          5,
          [],
          null,
          'asc',
        ],
        enabled: true,
      }),
    );
    await expect(queryFn()).resolves.toBe(detailResponse);
    expect(
      mockScorecardApi.getAggregatedScorecardEntities,
    ).toHaveBeenCalledWith({
      metricId: 'github.openPRs',
      page: 1,
      pageSize: 5,
      ownershipEntityRefs: [],
      orderBy: null,
      order: 'asc',
    });
  });

  it('does not run the query without a metric id or when disabled', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error: null,
      data: undefined,
    } as any);

    renderHook(() => useAggregatedScorecardEntities({ metricId: '' }));
    renderHook(() =>
      useAggregatedScorecardEntities({
        metricId: 'github.openPRs',
        enabled: false,
      }),
    );

    expect(mockUseQuery).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ enabled: false }),
    );
    expect(mockUseQuery).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ enabled: false }),
    );
  });

  it('rejects an array or empty payload from the client', async () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error: null,
      data: undefined,
    } as any);

    mockScorecardApi.getAggregatedScorecardEntities.mockResolvedValue([]);
    renderHook(() =>
      useAggregatedScorecardEntities({ metricId: 'github.openPRs' }),
    );
    await expect(queryFn()).rejects.toThrow('errors.invalidApiResponse');

    mockScorecardApi.getAggregatedScorecardEntities.mockResolvedValue(null);
    renderHook(() =>
      useAggregatedScorecardEntities({ metricId: 'github.openPRs' }),
    );
    await expect(queryFn()).rejects.toThrow('errors.invalidApiResponse');
  });

  it('rethrows Error results and wraps other failures', async () => {
    const apiError = new Error('backend failed');
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error: null,
      data: undefined,
    } as any);

    mockScorecardApi.getAggregatedScorecardEntities.mockRejectedValue(apiError);
    renderHook(() =>
      useAggregatedScorecardEntities({ metricId: 'github.openPRs' }),
    );
    await expect(queryFn()).rejects.toBe(apiError);

    mockScorecardApi.getAggregatedScorecardEntities.mockRejectedValue(
      'not an error',
    );
    renderHook(() =>
      useAggregatedScorecardEntities({ metricId: 'github.openPRs' }),
    );
    await expect(queryFn()).rejects.toThrow('fetch:not an error');
  });
});
