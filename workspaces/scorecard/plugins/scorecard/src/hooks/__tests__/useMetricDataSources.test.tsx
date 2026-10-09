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

  it('shows N/A for missing aggregated value and status when labels are provided', () => {
    const metric: MetricResult = {
      id: 'github.openPRs',
      status: 'success',
      metadata: {
        title: 'GitHub open PRs',
        description: 'Current count of open Pull Requests',
        type: 'number',
      },
      result: {
        value: null,
        timestamp: '2026-09-22T04:31:25.653Z',
        thresholdResult: {
          status: 'success',
          definition: undefined,
          evaluation: null,
        },
      },
    };

    const { result } = renderHook(() =>
      useMetricDataSources({
        metricId: 'github.openPRs',
        lastSyncedTimestamp: '2026-09-22T04:31:25.653Z',
        metric,
        unavailableValueLabel: 'N/A',
        unavailableStatusLabel: 'N/A',
        showThresholdLegend: false,
      }),
    );

    expect(result.current.dialogProps.rows[0]?.value).toBe('N/A');
    expect(result.current.dialogProps.rows[0]?.statusLabel).toBe('N/A');
    expect(result.current.dialogProps.rows[0]?.statusIcon).toBe('');
    expect(result.current.dialogProps.buckets).toBeUndefined();
  });

  it('falls back to the metric snapshot when collectors fetch fails', () => {
    useMetricCollectorsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch metric collectors: 403 Forbidden'),
    });

    const metric: MetricResult = {
      id: 'github.openPRs',
      status: 'success',
      metadata: {
        title: 'GitHub open PRs',
        description: 'Current count of open Pull Requests',
        type: 'number',
      },
      result: {
        value: 12,
        timestamp: '2026-09-22T04:31:25.653Z',
        thresholdResult: {
          definition: {
            rules: [{ key: 'warning', expression: '10-50' }],
          },
          status: 'success',
          evaluation: 'warning',
        },
      },
    };

    const { result } = renderHook(() =>
      useMetricDataSources({
        metricId: 'github.openPRs',
        lastSyncedTimestamp: '2026-09-22T04:31:25.653Z',
        fetchEnabled: true,
        metric,
        unavailableStatusLabel: 'N/A',
      }),
    );

    act(() => {
      result.current.menuActions[0].onClick();
    });

    expect(result.current.dialogProps.error).toBeUndefined();
    expect(result.current.dialogProps.isLoading).toBe(false);
    expect(result.current.dialogProps.rows).toHaveLength(1);
    expect(result.current.dialogProps.rows[0]?.metricId).toBe('github.openPRs');
    expect(result.current.dialogProps.rows[0]?.value).toBe('12');
    expect(result.current.dialogProps.rows[0]?.evaluationKey).toBe('warning');
  });

  it('surfaces the collectors error when there is no metric snapshot to fall back to', () => {
    const collectorsError = new Error(
      'Failed to fetch metric collectors: 403 Forbidden',
    );
    useMetricCollectorsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: collectorsError,
    });

    const { result } = renderHook(() =>
      useMetricDataSources({
        metricId: 'dora.deploymentFrequency',
        fetchEnabled: true,
      }),
    );

    act(() => {
      result.current.menuActions[0].onClick();
    });

    expect(result.current.dialogProps.error).toBe(collectorsError);
    expect(result.current.dialogProps.rows).toEqual([]);
  });
});
