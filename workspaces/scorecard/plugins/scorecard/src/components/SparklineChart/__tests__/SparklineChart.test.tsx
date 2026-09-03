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
  { date: 'Apr 27', value: 18, plotValue: 18 },
  { date: 'Apr 30', value: 22, plotValue: 22 },
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
});
