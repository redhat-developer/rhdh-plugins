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

import type { ComponentProps } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import type { AggregatedMetricTimeSeriesResponse } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import { AggregatedSparklineCard } from '../AggregatedSparklineCard';
import { useMetricCollectors } from '../../../hooks/useMetricCollectors';

jest.mock('recharts', () => {
  const actual = jest.requireActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
  };
});

jest.mock('../../../hooks/useLanguage', () => ({
  useLanguage: () => 'en',
}));

jest.mock('../../../hooks/useMetricCollectors', () => ({
  useMetricCollectors: jest.fn(),
}));

jest.mock('../../MetricGroupCard/MetricGroupCardMenu', () => ({
  MetricGroupCardMenu: ({
    actions,
  }: {
    actions: Array<{ id: string; label: string; onClick: () => void }>;
  }) => (
    <div data-testid="homepage-sparkline-menu">
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

const useMetricCollectorsMock = useMetricCollectors as jest.Mock;

const series: AggregatedMetricTimeSeriesResponse = {
  id: 'deploymentFrequencyKpi',
  metricId: 'dora.deploymentFrequency',
  metadata: {
    title: 'DORA - Deployment Frequency',
    description: 'Weekly production deploys',
    type: 'number',
    unit: '/week',
    history: true,
    visualization: 'sparkline',
    aggregationType: 'average',
  },
  points: [
    {
      value: 10,
      successCount: 5,
      errorCount: 0,
      total: 5,
      status: 'success',
      timestamp: '2026-08-23T00:00:00.000Z',
    },
    {
      value: 6.8,
      successCount: 4,
      errorCount: 3,
      total: 7,
      status: 'success',
      timestamp: '2026-08-24T00:00:00.000Z',
    },
  ],
  thresholds: {
    rules: [
      {
        key: 'elite',
        expression: '>=7',
        color: 'success.main',
      },
      {
        key: 'medium',
        expression: '1-7',
        color: 'warning.main',
      },
      {
        key: 'error',
        expression: '<1',
        color: 'error.main',
      },
    ],
  },
  aggregationChartDisplayColor: 'warning.main',
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <ThemeProvider
      theme={createTheme({
        palette: {
          success: { main: '#2e7d32' },
          warning: { main: '#F0AB00' },
          error: { main: '#C9190B' },
        },
      })}
    >
      {children}
    </ThemeProvider>
  </BrowserRouter>
);

const renderCard = (
  props: Partial<ComponentProps<typeof AggregatedSparklineCard>> = {},
) =>
  render(
    <AggregatedSparklineCard
      series={series}
      aggregationId="deploymentFrequencyKpi"
      cardTitle="DORA - Deployment Frequency"
      description="Weekly production deploys"
      {...props}
    />,
    { wrapper: TestWrapper },
  );

describe('AggregatedSparklineCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useMetricCollectorsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: undefined,
    });
  });

  it('renders the sparkline, threshold legend, and last-day entity counts', () => {
    renderCard();

    expect(
      screen.getByTestId('sparkline-chart-deploymentFrequencyKpi'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('sparkline-threshold-legend-deploymentFrequencyKpi'),
    ).toBeInTheDocument();
    expect(screen.getByText('Elite (>=7/week)')).toBeInTheDocument();
    expect(screen.getByText('Medium (1-7/week)')).toBeInTheDocument();
    expect(screen.getByText('Error (<1/week)')).toBeInTheDocument();
    expect(screen.getByText('4/7 entities')).toBeInTheDocument();
    expect(
      screen.queryByTestId('sparkline-current-value'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId('scorecard-homepage-card-info'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('menu-action-view-data-sources'),
    ).toBeInTheDocument();
  });

  it('hides the info button and data sources menu when showInfo is false', () => {
    renderCard({ showInfo: false });

    expect(
      screen.queryByTestId('scorecard-homepage-card-info'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('menu-action-view-data-sources'),
    ).not.toBeInTheDocument();
  });

  it('colors each legend item from its threshold rule', () => {
    renderCard();

    const swatches = screen.getAllByTestId('sparkline-threshold-color');
    expect(swatches).toHaveLength(3);
    expect(swatches[0]).toHaveAttribute('stroke', '#2e7d32');
    expect(swatches[1]).toHaveAttribute('stroke', '#F0AB00');
    expect(swatches[2]).toHaveAttribute('stroke', '#C9190B');
  });

  it('still lists every threshold when the backend does not send a chart color', () => {
    renderCard({
      series: {
        ...series,
        aggregationChartDisplayColor: null,
        points: [
          {
            value: 12,
            successCount: 3,
            errorCount: 0,
            total: 3,
            status: 'success',
            timestamp: '2026-08-23T00:00:00.000Z',
          },
        ],
      },
    });

    expect(screen.getByText('Elite (>=7/week)')).toBeInTheDocument();
    expect(screen.getByText('Medium (1-7/week)')).toBeInTheDocument();
    expect(screen.getByText('Error (<1/week)')).toBeInTheDocument();
  });
  it('opens the data sources dialog with collectors after the menu click', () => {
    useMetricCollectorsMock.mockReturnValue({
      data: [
        {
          id: 'github:doraDeploymentWorkflowRuns',
          description: 'Collects deployments from GitHub Actions.',
        },
        {
          id: 'jira:doraIncidents',
          description: 'Collects Jira incidents.',
        },
      ],
      isLoading: false,
      error: undefined,
    });

    renderCard();

    expect(screen.queryByTestId('data-sources-dialog')).not.toBeInTheDocument();
    expect(useMetricCollectorsMock).toHaveBeenCalledWith(
      'dora.deploymentFrequency',
      false,
    );

    fireEvent.click(screen.getByTestId('menu-action-view-data-sources'));

    expect(screen.getByTestId('data-sources-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toHaveTextContent(
      'DORA - Deployment Frequency',
    );
    expect(screen.getByTestId('dialog-metric-id')).toHaveTextContent(
      'dora.deploymentFrequency',
    );
    expect(screen.getByTestId('dialog-collectors')).toHaveTextContent(
      'GitHub,Jira',
    );
    expect(screen.getByTestId('dialog-legend')).toHaveTextContent('false');
    expect(useMetricCollectorsMock).toHaveBeenCalledWith(
      'dora.deploymentFrequency',
      true,
    );
  });
});
