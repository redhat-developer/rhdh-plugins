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
import { Metric } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import { useMetric } from '../useMetric';

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

  it('should return loading state when useQuery is loading', () => {
    mockUseQuery.mockReturnValue({
      isLoading: true,
      error: null,
      data: undefined,
    } as any);

    const { result } = renderHook(() =>
      useMetric({ metricId: 'github.open_prs' }),
    );

    expect(result.current).toEqual({
      metric: undefined,
      loadingData: true,
      error: null,
    });
  });

  it('should return metric when API call succeeds', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error: null,
      data: mockMetric,
    } as any);

    const { result } = renderHook(() =>
      useMetric({ metricId: 'github.open_prs' }),
    );

    expect(result.current).toEqual({
      metric: mockMetric,
      loadingData: false,
      error: null,
    });
  });

  it('should return error when useQuery has error', () => {
    const apiError = new Error('Failed to fetch metric');
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error: apiError,
      data: undefined,
    } as any);

    const { result } = renderHook(() =>
      useMetric({ metricId: 'github.open_prs' }),
    );

    expect(result.current).toEqual({
      metric: undefined,
      loadingData: false,
      error: apiError,
    });
  });

  it('should call useQuery with the correct queryKey and enabled flag', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error: null,
      data: undefined,
    } as any);

    renderHook(() => useMetric({ metricId: 'jira.blocking_tickets' }));

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['metric', 'jira.blocking_tickets'],
        enabled: true,
      }),
    );
  });
});
