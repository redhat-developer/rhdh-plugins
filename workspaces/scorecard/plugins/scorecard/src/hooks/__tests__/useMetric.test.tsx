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
import { Metric } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import { useMetric } from '../useMetric';

jest.mock('@backstage/core-plugin-api');
jest.mock('react-use/lib/useAsync');
jest.mock('../useTranslation', () => ({
  useTranslation: jest.fn(),
}));

const mockUseApi = useApi as jest.MockedFunction<typeof useApi>;
const mockUseAsync = useAsync as jest.MockedFunction<typeof useAsync>;

import { useTranslation } from '../useTranslation';

describe('useMetric', () => {
  const mockScorecardApi = {
    getMetrics: jest.fn(),
  };

  const mockMetric: Metric = {
    id: 'github.open_prs',
    title: 'GitHub open PRs',
    description:
      'Current count of open Pull Requests for a given GitHub repository.',
    type: 'number',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseApi.mockReturnValue(mockScorecardApi);
    (useTranslation as jest.Mock).mockImplementation(() => ({
      t: (key: string) => key,
    }));
  });

  it('should return loading state when useAsync is loading', () => {
    mockUseAsync.mockReturnValue({
      loading: true,
      error: undefined,
      value: undefined,
    });

    const { result } = renderHook(() =>
      useMetric({ metricId: 'github.open_prs' }),
    );

    expect(result.current).toEqual({
      metric: undefined,
      loadingData: true,
      error: undefined,
    });
  });

  it('should return metric when API call succeeds', () => {
    mockUseAsync.mockReturnValue({
      loading: false,
      error: undefined,
      value: mockMetric,
    });

    const { result } = renderHook(() =>
      useMetric({ metricId: 'github.open_prs' }),
    );

    expect(result.current).toEqual({
      metric: mockMetric,
      loadingData: false,
      error: undefined,
    });
  });

  it('should return error when useAsync has error', () => {
    const apiError = new Error('Failed to fetch metric');
    mockUseAsync.mockReturnValue({
      loading: false,
      error: apiError,
      value: undefined,
    });

    const { result } = renderHook(() =>
      useMetric({ metricId: 'github.open_prs' }),
    );

    expect(result.current).toEqual({
      metric: undefined,
      loadingData: false,
      error: apiError,
    });
  });

  it('should call getMetrics with the provided metricId', () => {
    mockScorecardApi.getMetrics.mockResolvedValue({ metrics: [mockMetric] });
    mockUseAsync.mockImplementation(fn => {
      void fn();
      return {
        loading: false,
        error: undefined,
        value: undefined,
      };
    });

    renderHook(() => useMetric({ metricId: 'jira.blocking_tickets' }));

    expect(mockScorecardApi.getMetrics).toHaveBeenCalledWith({
      metricIds: ['jira.blocking_tickets'],
    });
  });
});
