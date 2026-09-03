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
import type { CollectorMetadata } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import { useMetricCollectors } from '../useMetricCollectors';

jest.mock('@backstage/core-plugin-api');
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

const mockUseApi = useApi as jest.MockedFunction<typeof useApi>;
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;

describe('useMetricCollectors', () => {
  const mockScorecardApi = {
    getMetricCollectors: jest.fn(),
  };

  const collectors: CollectorMetadata[] = [
    {
      id: 'github:deploymentWorkflowRuns',
      description: 'Collects deployments from GitHub Actions.',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseApi.mockReturnValue(mockScorecardApi);
  });

  it('should return collectors when the query succeeds', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error: null,
      data: collectors,
    } as any);

    const { result } = renderHook(() =>
      useMetricCollectors('dora.changeFailureRate', true),
    );

    expect(result.current).toEqual({
      data: collectors,
      isLoading: false,
      error: undefined,
    });
  });

  it('should call useQuery with the metric id and enabled flag', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error: null,
      data: undefined,
    } as any);

    renderHook(() => useMetricCollectors('dora.changeFailureRate', true));

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['metricCollectors', 'dora.changeFailureRate'],
        enabled: true,
      }),
    );
  });

  it('should disable the query when enabled is false', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error: null,
      data: undefined,
    } as any);

    renderHook(() => useMetricCollectors('dora.changeFailureRate', false));

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      }),
    );
  });

  it('should disable the query when metric id is empty', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error: null,
      data: undefined,
    } as any);

    renderHook(() => useMetricCollectors('', true));

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      }),
    );
  });

  it('should fetch collectors for the given metric id when enabled', async () => {
    mockScorecardApi.getMetricCollectors.mockResolvedValue(collectors);
    mockUseQuery.mockReturnValue({
      isLoading: false,
      error: null,
      data: undefined,
    } as any);

    renderHook(() => useMetricCollectors('dora.changeFailureRate', true));

    const queryFn = mockUseQuery.mock.calls[0][0]
      .queryFn as () => Promise<unknown>;
    await expect(queryFn()).resolves.toEqual(collectors);
    expect(mockScorecardApi.getMetricCollectors).toHaveBeenCalledWith(
      'dora.changeFailureRate',
    );
  });

  it('should hide loading and error when the query is disabled', () => {
    mockUseQuery.mockReturnValue({
      isLoading: true,
      error: new Error('collectors unavailable'),
      data: undefined,
    } as any);

    const { result } = renderHook(() =>
      useMetricCollectors('dora.changeFailureRate', false),
    );

    expect(result.current).toEqual({
      data: undefined,
      isLoading: false,
      error: undefined,
    });
  });
});
