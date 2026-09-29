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
import type { MetricResult } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import { useMetricDataSources } from '../useMetricDataSources';
import { useMetricCollectors } from '../useMetricCollectors';

jest.mock('../useLanguage', () => ({
  useLanguage: () => 'en',
}));

jest.mock('../useMetricCollectors', () => ({
  useMetricCollectors: jest.fn(),
}));

const useMetricCollectorsMock = useMetricCollectors as jest.Mock;

describe('useMetricDataSources', () => {
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
      useMetricDataSources({
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
      useMetricDataSources({
        metricId: 'dora.deploymentFrequency',
        lastSyncedTimestamp: '2026-08-24T00:00:00.000Z',
        fetchEnabled: true,
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
      useMetricDataSources({
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

  it('shows actual metric value and status when metric result is provided', () => {
    useMetricCollectorsMock.mockReturnValue({
      data: [],
      isLoading: false,
      error: undefined,
    });

    const metric: MetricResult = {
      id: 'github.openPRs',
      status: 'success',
      metadata: {
        title: 'GitHub open PRs',
        description: 'Current count of open Pull Requests',
        type: 'number',
        history: true,
      },
      result: {
        value: 0,
        timestamp: '2026-09-22T04:31:25.653Z',
        thresholdResult: {
          definition: {
            rules: [
              { key: 'success', expression: '<10' },
              { key: 'warning', expression: '10-50' },
              { key: 'error', expression: '>50' },
            ],
          },
          status: 'success',
          evaluation: 'success',
        },
      },
    };

    const { result } = renderHook(() =>
      useMetricDataSources({
        metricId: 'github.openPRs',
        lastSyncedTimestamp: '2026-09-22T04:31:25.653Z',
        metric,
      }),
    );

    act(() => {
      result.current.menuActions[0].onClick();
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.dialogProps.rows).toHaveLength(1);
    const row = result.current.dialogProps.rows[0];
    expect(row?.metricId).toBe('github.openPRs');
    expect(row?.value).toBe('0');
    expect(row?.evaluationKey).toBe('success');
    expect(row?.thresholdExpression).toBe('<10');
  });
});
