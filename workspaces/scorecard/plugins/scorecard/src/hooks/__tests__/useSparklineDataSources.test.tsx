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

import { act, renderHook } from '@testing-library/react';

import { useSparklineDataSources } from '../useSparklineDataSources';
import { useMetricCollectors } from '../useMetricCollectors';

jest.mock('../useLanguage', () => ({
  useLanguage: () => 'en',
}));

jest.mock('../useMetricCollectors', () => ({
  useMetricCollectors: jest.fn(),
}));

const useMetricCollectorsMock = useMetricCollectors as jest.Mock;

describe('useSparklineDataSources', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useMetricCollectorsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: undefined,
    });
  });

  it('does not fetch collectors until the dialog is opened', () => {
    renderHook(() =>
      useSparklineDataSources({
        metricId: 'dora.deploymentFrequency',
        lastSyncedTimestamp: '2026-08-24T00:00:00.000Z',
      }),
    );

    expect(useMetricCollectorsMock).toHaveBeenCalledWith(
      'dora.deploymentFrequency',
      false,
    );
  });

  it('fetches collectors after the view-data-sources action is clicked', () => {
    useMetricCollectorsMock.mockReturnValue({
      data: [
        {
          id: 'github:doraDeploymentWorkflowRuns',
          description: 'Collects deployments from GitHub Actions.',
        },
      ],
      isLoading: false,
      error: undefined,
    });

    const { result } = renderHook(() =>
      useSparklineDataSources({
        metricId: 'dora.deploymentFrequency',
        lastSyncedTimestamp: '2026-08-24T00:00:00.000Z',
      }),
    );

    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.menuActions[0].onClick();
    });

    expect(result.current.isOpen).toBe(true);
    expect(useMetricCollectorsMock).toHaveBeenCalledWith(
      'dora.deploymentFrequency',
      true,
    );
    expect(result.current.dialogProps.rows[0]?.plugin).toBe('GitHub');
  });

  it('does not fetch collectors when fetchEnabled is false', () => {
    const { result } = renderHook(() =>
      useSparklineDataSources({
        metricId: 'dora.deploymentFrequency',
        fetchEnabled: false,
      }),
    );

    act(() => {
      result.current.menuActions[0].onClick();
    });

    expect(result.current.isOpen).toBe(true);
    expect(useMetricCollectorsMock).toHaveBeenCalledWith(
      'dora.deploymentFrequency',
      false,
    );
  });
});
