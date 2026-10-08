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

import { SparklineChart } from '../SparklineChart';
import type { SparklineChartPoint } from '../../../utils/timeSeriesChartData';

jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => (key === 'common.current' ? 'current' : key),
  }),
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

const points: SparklineChartPoint[] = [
  {
    date: '2026-04-27T00:00:00.000Z',
    dateLabel: 'Apr 27',
    value: 18,
    plotValue: 18,
  },
  {
    date: '2026-04-30T00:00:00.000Z',
    dateLabel: 'Apr 30',
    value: 22,
    plotValue: 22,
  },
];

describe('SparklineChart', () => {
  it('renders the chart without a legend when no label is provided', () => {
    render(
      <SparklineChart
        data={points}
        color="#d32f2f"
        unit="%"
        testId="sparkline-chart-demo"
      />,
    );

    expect(screen.getByTestId('sparkline-chart-demo')).toBeInTheDocument();
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('sparkline-tooltip-slot')).toBeInTheDocument();
    expect(
      screen.queryByTestId('sparkline-current-value'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('sparkline-threshold-color'),
    ).not.toBeInTheDocument();
  });

  it('renders the threshold legend when items are provided', () => {
    render(
      <SparklineChart
        data={points}
        color="#d32f2f"
        legendItems={[{ key: 'low', label: 'Low (>15%)', color: '#d32f2f' }]}
        legendTestId="sparkline-threshold-legend-demo"
      />,
    );

    expect(screen.getByText('Low (>15%)')).toBeInTheDocument();
    expect(
      screen.getByTestId('sparkline-threshold-legend-demo'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('sparkline-threshold-color')).toHaveAttribute(
      'stroke',
      '#d32f2f',
    );
  });

  it('renders every legend item when multiple thresholds are provided', () => {
    render(
      <SparklineChart
        data={points}
        color="#2e7d32"
        legendItems={[
          {
            key: 'elite',
            label: 'Elite (>=7/week)',
            color: '#2e7d32',
            strokeDasharray: '10 7',
          },
          {
            key: 'medium',
            label: 'Medium (1-7/week)',
            color: '#F0AB00',
            strokeDasharray: '2 4',
          },
          { key: 'low', label: 'Low (<1/week)', color: '#C9190B' },
        ]}
        legendTestId="sparkline-threshold-legend-demo"
      />,
    );

    expect(screen.getByText('Elite (>=7/week)')).toBeInTheDocument();
    expect(screen.getByText('Medium (1-7/week)')).toBeInTheDocument();
    expect(screen.getByText('Low (<1/week)')).toBeInTheDocument();
    expect(screen.getAllByTestId('sparkline-threshold-color')).toHaveLength(3);
  });

  it('should use the latest successful value when the last day is an error', () => {
    render(
      <SparklineChart
        data={[
          {
            date: '2026-04-27T00:00:00.000Z',
            dateLabel: 'Apr 27',
            value: 4.7,
            plotValue: 4.7,
          },
          {
            date: '2026-04-30T00:00:00.000Z',
            dateLabel: 'Apr 30',
            value: null,
            plotValue: 4.7,
            error: 'Metric data unavailable',
          },
        ]}
        color="#2e7d32"
        testId="sparkline-chart-demo"
        showCurrentValue
      />,
    );

    expect(
      screen.getByTestId('sparkline-current-value-number'),
    ).toHaveTextContent('4.7');
    expect(screen.getByText('current')).toBeInTheDocument();
  });

  it('should hide the current value when every point is an error', () => {
    render(
      <SparklineChart
        data={[
          {
            date: '2026-04-30T00:00:00.000Z',
            dateLabel: 'Apr 30',
            value: null,
            plotValue: 0,
            error: 'Metric data unavailable',
          },
        ]}
        color="#d32f2f"
        testId="sparkline-chart-demo"
        showCurrentValue
      />,
    );

    expect(
      screen.queryByTestId('sparkline-current-value'),
    ).not.toBeInTheDocument();
  });
});
