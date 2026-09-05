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

import { fireEvent, render, screen } from '@testing-library/react';
import {
  ScorecardThresholdRuleColors,
  type MetricResult,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import { EntitySparklineCard } from '../EntitySparklineCard';
import { useMetricCollectors } from '../../../hooks/useMetricCollectors';
import { useMetricTimeSeries } from '../../../hooks/useMetricTimeSeries';

jest.mock('../../../hooks/useMetricTimeSeries', () => ({
  useMetricTimeSeries: jest.fn(),
}));

jest.mock('../../../hooks/useMetricCollectors', () => ({
  useMetricCollectors: jest.fn(),
}));

jest.mock('../../../hooks/useLanguage', () => ({
  useLanguage: () => 'en',
}));

jest.mock('../../MetricGroupCard/MetricGroupCardMenu', () => ({
  MetricGroupCardMenu: ({
    actions,
  }: {
    actions: Array<{ id: string; label: string; onClick: () => void }>;
  }) => (
    <div data-testid="area-chart-menu">
      {actions.map(action => (
        <button
          key={action.id}
          data-testid={`menu-action-${action.id}`}
          onClick={action.onClick}
        >
          {action.label}
        </button>
      ))}
    </div>
  ),
}));

jest.mock('../../MetricGroupCard/DataSourcesDialog', () => ({
  DataSourcesDialog: ({
    title,
    rows,
    isLoading,
    error,
    buckets,
  }: {
    title: string;
    rows: Array<{ plugin: string; metricId: string }>;
    isLoading?: boolean;
    error?: Error;
    buckets?: unknown[];
  }) => (
    <div data-testid="data-sources-dialog">
      <span data-testid="dialog-title">{title}</span>
      <span data-testid="dialog-metric-id">{rows[0]?.metricId ?? ''}</span>
      <span data-testid="dialog-collectors">
        {rows.map(row => row.plugin).join(',')}
      </span>
      <span data-testid="dialog-loading">{String(Boolean(isLoading))}</span>
      <span data-testid="dialog-error">{error?.message ?? ''}</span>
      <span data-testid="dialog-legend">{String(Boolean(buckets))}</span>
    </div>
  ),
}));

jest.mock('@backstage/core-components', () => ({
  ResponseErrorPanel: ({ error }: { error: Error }) => (
    <div data-testid="error-panel">{error.message}</div>
  ),
}));

jest.mock('recharts', () => {
  const actual = jest.requireActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
  };
});

const useMetricTimeSeriesMock = useMetricTimeSeries as jest.Mock;
const useMetricCollectorsMock = useMetricCollectors as jest.Mock;

const metric: MetricResult = {
  id: 'dora.changeFailureRate',
  status: 'success',
  metadata: {
    title: 'DORA - Change Failure Rate',
    description: 'Change failure rate',
    type: 'number',
    unit: '%',
    history: true,
    defaultVisualization: 'sparkline',
    collectorIds: ['github:deploymentWorkflowRuns', 'jira:incidents'],
  },
  result: {
    value: 4.2,
    timestamp: '2026-04-30T10:00:00.000Z',
    thresholdResult: {
      status: 'success',
      definition: { rules: [] },
      evaluation: 'success',
    },
  },
};

const lowChangeFailureRateMetric: MetricResult = {
  ...metric,
  result: {
    ...metric.result,
    value: 22,
    thresholdResult: {
      status: 'success',
      evaluation: 'low',
      definition: {
        rules: [
          {
            key: 'elite',
            expression: '<5',
            color: ScorecardThresholdRuleColors.SUCCESS,
          },
          {
            key: 'medium',
            expression: '5-15',
            color: ScorecardThresholdRuleColors.WARNING,
          },
          {
            key: 'low',
            expression: '>15',
            color: ScorecardThresholdRuleColors.ERROR,
          },
        ],
      },
    },
  },
};

const mockTimeSeries = (metricId: string) => ({
  data: {
    metricId,
    entityRef: 'component:default/svc',
    points: [
      { value: 18, timestamp: '2026-04-27T12:00:00.000Z' },
      { value: 22, timestamp: '2026-04-30T12:00:00.000Z' },
    ],
    metadata: metric.metadata,
  },
  isLoading: false,
  error: undefined,
});

describe('EntitySparklineCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useMetricCollectorsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: undefined,
    });
  });

  it('should fetch time series for the given metric', () => {
    useMetricTimeSeriesMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
    });

    render(
      <EntitySparklineCard
        metric={metric}
        title="DORA - Change Failure Rate"
        description="Change failure rate"
      />,
    );

    expect(useMetricTimeSeriesMock).toHaveBeenCalledWith(metric.id);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render a fetch error inside the card', () => {
    useMetricTimeSeriesMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('GitHub API 500'),
    });

    render(
      <EntitySparklineCard
        metric={metric}
        title="DORA - Change Failure Rate"
        description="Change failure rate"
      />,
    );

    expect(screen.getByTestId('error-panel')).toHaveTextContent(
      'GitHub API 500',
    );
  });

  it('should render an empty state when the series has no points', () => {
    useMetricTimeSeriesMock.mockReturnValue({
      data: {
        metricId: 'dora.changeFailureRate',
        entityRef: 'component:default/svc',
        points: [],
        metadata: metric.metadata,
      },
      isLoading: false,
      error: undefined,
    });

    render(
      <EntitySparklineCard
        metric={metric}
        title="DORA - Change Failure Rate"
        description="Change failure rate"
      />,
    );

    expect(screen.getByText('No data found')).toBeInTheDocument();
  });

  it('should still render the chart when a point is a calculation failure', () => {
    useMetricTimeSeriesMock.mockReturnValue({
      data: {
        metricId: 'dora.changeFailureRate',
        entityRef: 'component:default/svc',
        points: [
          { value: 4.2, timestamp: '2026-04-27T12:00:00.000Z' },
          {
            value: null,
            timestamp: '2026-04-28T12:00:00.000Z',
            error: 'GitHub API 500',
          },
          { value: 3.8, timestamp: '2026-04-30T12:00:00.000Z' },
        ],
        metadata: metric.metadata,
      },
      isLoading: false,
      error: undefined,
    });

    render(
      <EntitySparklineCard
        metric={metric}
        title="DORA - Change Failure Rate"
        description="Change failure rate"
      />,
    );

    expect(
      screen.getByTestId('sparkline-chart-dora.changeFailureRate'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument();
    expect(screen.queryByText('No data found')).not.toBeInTheDocument();
  });

  it('should render the chart when time series points are available', () => {
    useMetricTimeSeriesMock.mockReturnValue({
      data: {
        metricId: 'dora.changeFailureRate',
        entityRef: 'component:default/svc',
        points: [
          { value: 4.2, timestamp: '2026-04-27T12:00:00.000Z' },
          { value: 3.8, timestamp: '2026-04-30T12:00:00.000Z' },
        ],
        metadata: metric.metadata,
      },
      isLoading: false,
      error: undefined,
    });

    render(
      <EntitySparklineCard
        metric={metric}
        title="DORA - Change Failure Rate"
        description="Change failure rate"
      />,
    );

    expect(
      screen.getByTestId('sparkline-chart-dora.changeFailureRate'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(
      screen.queryByTestId('sparkline-threshold-legend-dora.changeFailureRate'),
    ).not.toBeInTheDocument();
  });

  it('should color the sparkline from the matched metric threshold and show a legend', () => {
    useMetricTimeSeriesMock.mockReturnValue(
      mockTimeSeries('dora.changeFailureRate'),
    );

    render(
      <EntitySparklineCard
        metric={lowChangeFailureRateMetric}
        title="DORA - Change Failure Rate"
        description="Change failure rate"
      />,
    );

    expect(screen.getByText('Low (>15%)')).toBeInTheDocument();
    expect(screen.queryByText('Elite (<5%)')).not.toBeInTheDocument();
    expect(screen.queryByText('Medium (5-15%)')).not.toBeInTheDocument();
    expect(
      screen.getByTestId('sparkline-threshold-legend-dora.changeFailureRate'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('sparkline-threshold-color')).toHaveAttribute(
      'stroke',
      '#d32f2f',
    );
  });

  it('should update the legend label when the metric evaluates to a different threshold', () => {
    useMetricTimeSeriesMock.mockReturnValue(
      mockTimeSeries('dora.changeFailureRate'),
    );

    const eliteMetric: MetricResult = {
      ...lowChangeFailureRateMetric,
      result: {
        ...lowChangeFailureRateMetric.result,
        value: 2,
        thresholdResult: {
          ...lowChangeFailureRateMetric.result.thresholdResult,
          evaluation: 'elite',
        },
      },
    };

    render(
      <EntitySparklineCard
        metric={eliteMetric}
        title="DORA - Change Failure Rate"
        description="Change failure rate"
      />,
    );

    expect(screen.getByText('Elite (<5%)')).toBeInTheDocument();
    expect(screen.queryByText('Low (>15%)')).not.toBeInTheDocument();
    expect(screen.getByTestId('sparkline-threshold-color')).toHaveAttribute(
      'stroke',
      '#2e7d32',
    );
  });

  it('should open the data sources dialog with collectors after the menu click', () => {
    useMetricTimeSeriesMock.mockReturnValue(
      mockTimeSeries('dora.changeFailureRate'),
    );
    useMetricCollectorsMock.mockReturnValue({
      data: [
        {
          id: 'github:deploymentWorkflowRuns',
          description: 'Collects deployments from GitHub Actions.',
        },
        {
          id: 'jira:incidents',
          description: 'Collects Jira incidents.',
        },
      ],
      isLoading: false,
      error: undefined,
    });

    render(
      <EntitySparklineCard
        metric={lowChangeFailureRateMetric}
        title="DORA - Change Failure Rate"
        description="Change failure rate"
      />,
    );

    expect(screen.queryByTestId('data-sources-dialog')).not.toBeInTheDocument();
    expect(useMetricCollectorsMock).toHaveBeenCalledWith(metric.id, false);

    fireEvent.click(screen.getByTestId('menu-action-view-data-sources'));

    expect(screen.getByTestId('data-sources-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toHaveTextContent(
      'DORA - Change Failure Rate',
    );
    expect(screen.getByTestId('dialog-metric-id')).toHaveTextContent(
      'dora.changeFailureRate',
    );
    expect(screen.getByTestId('dialog-collectors')).toHaveTextContent(
      'GitHub,Jira',
    );
    expect(screen.getByTestId('dialog-legend')).toHaveTextContent('false');
    expect(useMetricCollectorsMock).toHaveBeenCalledWith(metric.id, true);
  });

  it('should not fetch collectors when the metric has no collector ids', () => {
    useMetricTimeSeriesMock.mockReturnValue(
      mockTimeSeries('dora.changeFailureRate'),
    );

    const metricWithoutCollectors: MetricResult = {
      ...metric,
      metadata: {
        ...metric.metadata,
        collectorIds: [],
      },
    };

    render(
      <EntitySparklineCard
        metric={metricWithoutCollectors}
        title="DORA - Change Failure Rate"
        description="Change failure rate"
      />,
    );

    fireEvent.click(screen.getByTestId('menu-action-view-data-sources'));

    expect(useMetricCollectorsMock).toHaveBeenCalledWith(metric.id, false);
    expect(screen.getByTestId('dialog-collectors')).toHaveTextContent('');
  });
});
