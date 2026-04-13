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

import useAsync from 'react-use/lib/useAsync';
import { renderHook } from '@testing-library/react';
import { useApi } from '@backstage/core-plugin-api';

import { useAggregationMetadata } from '../useAggregationMetadata';

jest.mock('@backstage/core-plugin-api');
jest.mock('react-use/lib/useAsync');
jest.mock('../useTranslation', () => ({
  useTranslation: jest.fn().mockReturnValue({
    t: (key: string, opts?: { error?: string }) =>
      key === 'errors.fetchError' && opts?.error !== undefined
        ? `fetch:${opts.error}`
        : key,
  }),
}));

const mockUseApi = useApi as jest.MockedFunction<typeof useApi>;
const mockUseAsync = useAsync as jest.MockedFunction<typeof useAsync>;

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
    mockUseAsync.mockReturnValue({
      loading: false,
      error: undefined,
      value: mockMeta,
    });

    const { result } = renderHook(() => useAggregationMetadata('kpi1'));

    expect(result.current).toEqual({
      data: mockMeta,
      isLoading: false,
      error: undefined,
    });
  });

  it('should register useAsync with aggregationId and scorecard API in deps', () => {
    mockUseAsync.mockReturnValue({
      loading: false,
      error: undefined,
      value: mockMeta,
    });

    renderHook(() => useAggregationMetadata('metaAgg'));

    expect(mockUseAsync).toHaveBeenCalledWith(expect.any(Function), [
      mockScorecardApi,
      'metaAgg',
      expect.any(Function),
    ]);
  });

  it('should call getAggregationMetadata from async callback', async () => {
    mockScorecardApi.getAggregationMetadata.mockResolvedValue(mockMeta);
    mockUseAsync.mockImplementation(() => ({
      loading: false,
      error: undefined,
      value: undefined,
    }));

    renderHook(() => useAggregationMetadata('aggY'));

    const asyncFn = mockUseAsync.mock.calls[0][0] as () => Promise<unknown>;
    await asyncFn();

    expect(mockScorecardApi.getAggregationMetadata).toHaveBeenCalledWith(
      'aggY',
    );
  });

  it('should propagate Error instances from the API', async () => {
    const apiError = new Error('metadata failed');
    mockScorecardApi.getAggregationMetadata.mockRejectedValue(apiError);
    mockUseAsync.mockImplementation(() => ({
      loading: false,
      error: undefined,
      value: undefined,
    }));

    renderHook(() => useAggregationMetadata('kpi1'));

    const asyncFn = mockUseAsync.mock.calls[0][0] as () => Promise<unknown>;
    await expect(asyncFn()).rejects.toBe(apiError);
  });

  it('should wrap non-Error rejections with translated fetch error', async () => {
    mockScorecardApi.getAggregationMetadata.mockRejectedValue(503);
    mockUseAsync.mockImplementation(() => ({
      loading: false,
      error: undefined,
      value: undefined,
    }));

    renderHook(() => useAggregationMetadata('kpi1'));

    const asyncFn = mockUseAsync.mock.calls[0][0] as () => Promise<unknown>;
    await expect(asyncFn()).rejects.toThrow('fetch:503');
  });
});
