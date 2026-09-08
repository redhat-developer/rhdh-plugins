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

import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import type { AggregatedMetricTimeSeriesResponse } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import { AggregatedSparklineCard } from '../AggregatedSparklineCard';

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

const series: AggregatedMetricTimeSeriesResponse = {
  id: 'avgDeploymentFrequency',
  metricId: 'dora.deploymentFrequency',
  metadata: {
    title: 'Average Deployment Frequency',
    description: 'Average weekly production deploys',
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

describe('AggregatedSparklineCard', () => {
  it('renders the sparkline, threshold legend, and last-day entity counts', () => {
    render(
      <AggregatedSparklineCard
        series={series}
        aggregationId="avgDeploymentFrequency"
        cardTitle="Average Deployment Frequency"
        description="Average weekly production deploys"
      />,
      { wrapper: TestWrapper },
    );

    expect(
      screen.getByTestId('sparkline-chart-avgDeploymentFrequency'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('sparkline-threshold-legend-avgDeploymentFrequency'),
    ).toBeInTheDocument();
    expect(screen.getByText('Elite (>=7/week)')).toBeInTheDocument();
    expect(screen.getByText('Medium (1-7/week)')).toBeInTheDocument();
    expect(screen.getByText('Error (<1/week)')).toBeInTheDocument();
    expect(screen.getByText('4/7 entities')).toBeInTheDocument();
    expect(
      screen.getByTestId('scorecard-homepage-card-info'),
    ).toBeInTheDocument();
  });

  it('colors each legend item from its threshold rule', () => {
    render(
      <AggregatedSparklineCard
        series={series}
        aggregationId="avgDeploymentFrequency"
        cardTitle="Average Deployment Frequency"
        description="Average weekly production deploys"
      />,
      { wrapper: TestWrapper },
    );

    const swatches = screen.getAllByTestId('sparkline-threshold-color');
    expect(swatches).toHaveLength(3);
    expect(swatches[0]).toHaveAttribute('stroke', '#2e7d32');
    expect(swatches[1]).toHaveAttribute('stroke', '#F0AB00');
    expect(swatches[2]).toHaveAttribute('stroke', '#C9190B');
  });

  it('still lists every threshold when the chart color falls back to the last successful point', () => {
    render(
      <AggregatedSparklineCard
        series={{
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
        }}
        aggregationId="avgDeploymentFrequency"
        cardTitle="Average Deployment Frequency"
        description="Average weekly production deploys"
      />,
      { wrapper: TestWrapper },
    );

    expect(screen.getByText('Elite (>=7/week)')).toBeInTheDocument();
    expect(screen.getByText('Medium (1-7/week)')).toBeInTheDocument();
    expect(screen.getByText('Error (<1/week)')).toBeInTheDocument();
  });
});
