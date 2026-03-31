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
import {
  DEFAULT_NUMBER_THRESHOLDS,
  type AggregatedMetricResult,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import { useAggregatedScorecard } from '../useAggregatedScorecard';
import { useTranslation } from '../useTranslation';

jest.mock('@backstage/core-plugin-api');
jest.mock('react-use/lib/useAsync');
jest.mock('../useTranslation', () => ({
  useTranslation: jest.fn(),
}));

const mockUseApi = useApi as jest.MockedFunction<typeof useApi>;
const mockUseAsync = useAsync as jest.MockedFunction<typeof useAsync>;

const useTranslationMock = useTranslation as jest.Mock;

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

    useTranslationMock.mockReturnValue({
      t: (key: string, opts?: { error?: string }) =>
        key === 'errors.fetchError' && opts?.error !== undefined
          ? `fetch:${opts.error}`
          : key,
    });
  });

  it('should return aggregated data when API succeeds', () => {
    mockUseAsync.mockReturnValue({
      loading: false,
      error: undefined,
      value: mockAggregated,
    });

    const { result } = renderHook(() => useAggregatedScorecard('kpi1'));

    expect(result.current).toEqual({
      data: mockAggregated,
      isLoading: false,
      error: undefined,
    });
  });

  it('should register useAsync with aggregationId and scorecard API in deps', () => {
    mockUseAsync.mockReturnValue({
      loading: false,
      error: undefined,
      value: mockAggregated,
    });

    renderHook(() => useAggregatedScorecard('myAgg'));

    expect(mockUseAsync).toHaveBeenCalledWith(expect.any(Function), [
      mockScorecardApi,
      'myAgg',
      expect.any(Function),
    ]);
  });

  it('should call getAggregatedScorecard with aggregationId from async callback', async () => {
    mockScorecardApi.getAggregatedScorecard.mockResolvedValue(mockAggregated);

    mockUseAsync.mockImplementation(() => ({
      loading: false,
      error: undefined,
      value: undefined,
    }));

    renderHook(() => useAggregatedScorecard('aggX'));

    const asyncFn = mockUseAsync.mock.calls[0][0] as () => Promise<unknown>;
    await asyncFn();

    expect(mockScorecardApi.getAggregatedScorecard).toHaveBeenCalledWith(
      'aggX',
    );
  });

  it('should propagate Error instances from the API', async () => {
    const apiError = new Error('backend failed');

    mockScorecardApi.getAggregatedScorecard.mockRejectedValue(apiError);
    mockUseAsync.mockImplementation(() => ({
      loading: false,
      error: undefined,
      value: undefined,
    }));

    renderHook(() => useAggregatedScorecard('kpi1'));

    const asyncFn = mockUseAsync.mock.calls[0][0] as () => Promise<unknown>;

    await expect(asyncFn()).rejects.toBe(apiError);
  });

  it('should wrap non-Error rejections with translated fetch error', async () => {
    mockScorecardApi.getAggregatedScorecard.mockRejectedValue('not an error');
    mockUseAsync.mockImplementation(() => ({
      loading: false,
      error: undefined,
      value: undefined,
    }));

    renderHook(() => useAggregatedScorecard('kpi1'));

    const asyncFn = mockUseAsync.mock.calls[0][0] as () => Promise<unknown>;
    await expect(asyncFn()).rejects.toThrow('fetch:not an error');
  });

  it('should expose loading state from useAsync', () => {
    mockUseAsync.mockReturnValue({
      loading: true,
      error: undefined,
      value: undefined,
    });

    const { result } = renderHook(() => useAggregatedScorecard('kpi1'));

    expect(result.current).toEqual({
      data: undefined,
      isLoading: true,
      error: undefined,
    });
  });

  it('should throw when aggregationId is empty string', () => {
    expect(() => {
      renderHook(() => useAggregatedScorecard(''));
    }).toThrow('errors.aggregationMissingProperties');
  });

  it('should throw when aggregationId is whitespace only', () => {
    expect(() => {
      renderHook(() => useAggregatedScorecard('   '));
    }).toThrow('errors.aggregationMissingProperties');
  });
});
