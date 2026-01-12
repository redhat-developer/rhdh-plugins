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

import { ScorecardHomepageCard } from '../ScorecardHomepageCard';
import { mockAggregatedScorecardSuccessData } from '../../../../__fixtures__/aggregatedScorecardData';
import type { AggregatedMetricResult } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

// Mock the child components
jest.mock('../../Common/CardWrapper', () => ({
  CardWrapper: function MockCardWrapper({
    title,
    subtitle,
    children,
  }: {
    title: string;
    subtitle: string;
    children: React.ReactNode;
  }) {
    return (
      <div data-testid="card-wrapper">
        <div data-testid="card-title">{title}</div>
        <div data-testid="card-subtitle">{subtitle}</div>
        <div data-testid="card-content">{children}</div>
      </div>
    );
  },
}));

jest.mock('../CustomTooltip', () => ({
  CustomTooltip: function MockCustomTooltip() {
    return <div data-testid="custom-tooltip">Custom Tooltip</div>;
  },
}));

jest.mock('../CustomLegend', () => ({
  __esModule: true,
  default: function MockCustomLegend() {
    return <div data-testid="custom-legend">Custom Legend</div>;
  },
}));

// Mock recharts components
jest.mock('recharts', () => ({
  PieChart: function MockPieChart({ children }: { children: React.ReactNode }) {
    return <div data-testid="pie-chart">{children}</div>;
  },
  Pie: function MockPie({ children }: { children: React.ReactNode }) {
    return <div data-testid="pie">{children}</div>;
  },
  ResponsiveContainer: function MockResponsiveContainer({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return <div data-testid="responsive-container">{children}</div>;
  },
  Cell: function MockCell() {
    return <div data-testid="cell" />;
  },
  Tooltip: function MockTooltip() {
    return <div data-testid="tooltip" />;
  },
  Legend: function MockLegend() {
    return <div data-testid="legend" />;
  },
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const theme = createTheme({
    palette: {
      success: { main: '#52c41a' },
      warning: { main: '#F0AB00' },
      error: { main: '#C9190B' },
    },
  });
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

describe('ScorecardHomepageCard Component', () => {
  it('should render card with title and subtitle', () => {
    render(
      <ScorecardHomepageCard
        scorecard={mockAggregatedScorecardSuccessData[0]}
      />,
      { wrapper: TestWrapper },
    );

    expect(screen.getByTestId('card-title')).toHaveTextContent(
      'GitHub open PRs',
    );
    expect(screen.getByTestId('card-subtitle')).toHaveTextContent(
      '37 entities',
    );
  });

  it('should render description', () => {
    render(
      <ScorecardHomepageCard
        scorecard={mockAggregatedScorecardSuccessData[0]}
      />,
      { wrapper: TestWrapper },
    );

    expect(
      screen.getByText(
        'Current count of open Pull Requests for a given GitHub repository.',
      ),
    ).toBeInTheDocument();
  });

  it('should render pie chart components', () => {
    render(
      <ScorecardHomepageCard
        scorecard={mockAggregatedScorecardSuccessData[0]}
      />,
      { wrapper: TestWrapper },
    );

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie')).toBeInTheDocument();
  });

  it('should calculate total entities correctly', () => {
    render(
      <ScorecardHomepageCard
        scorecard={mockAggregatedScorecardSuccessData[0]}
      />,
      { wrapper: TestWrapper },
    );

    // 11 + 14 + 12 = 37
    expect(screen.getByTestId('card-subtitle')).toHaveTextContent(
      '37 entities',
    );
  });

  it('should handle scorecard with zero total entities', () => {
    const scorecardWithZero: AggregatedMetricResult = {
      ...mockAggregatedScorecardSuccessData[0],
      result: {
        ...mockAggregatedScorecardSuccessData[0].result,
        values: [
          { count: 0, name: 'success' },
          { count: 0, name: 'warning' },
          { count: 0, name: 'error' },
        ],
        total: 0,
      },
    };

    render(<ScorecardHomepageCard scorecard={scorecardWithZero} />, {
      wrapper: TestWrapper,
    });

    expect(screen.getByTestId('card-subtitle')).toHaveTextContent('0 entities');
  });

  it('should handle scorecard with empty result values', () => {
    const scorecardWithEmpty: AggregatedMetricResult = {
      ...mockAggregatedScorecardSuccessData[0],
      result: {
        ...mockAggregatedScorecardSuccessData[0].result,
        values: [],
        total: 0,
      },
    };

    render(<ScorecardHomepageCard scorecard={scorecardWithEmpty} />, {
      wrapper: TestWrapper,
    });

    expect(screen.getByTestId('card-subtitle')).toHaveTextContent('0 entities');
  });

  it('should handle scorecard with missing result values', () => {
    const scorecardWithNull: AggregatedMetricResult = {
      ...mockAggregatedScorecardSuccessData[0],
      result: {
        ...mockAggregatedScorecardSuccessData[0].result,
        values: [],
        total: 0,
      },
    };

    render(<ScorecardHomepageCard scorecard={scorecardWithNull} />, {
      wrapper: TestWrapper,
    });

    expect(screen.getByTestId('card-subtitle')).toHaveTextContent('0 entities');
  });

  it('should render with different scorecard data', () => {
    render(
      <ScorecardHomepageCard
        scorecard={mockAggregatedScorecardSuccessData[1]}
      />,
      { wrapper: TestWrapper },
    );

    expect(screen.getByTestId('card-title')).toHaveTextContent(
      'Jira open blocking tickets',
    );
    expect(screen.getByTestId('card-subtitle')).toHaveTextContent('4 entities');
    expect(
      screen.getByText(
        'Highlights the number of critical, blocking issues that are currently open in Jira.',
      ),
    ).toBeInTheDocument();
  });

  it('should render chart container with correct attributes', () => {
    const { container } = render(
      <ScorecardHomepageCard
        scorecard={mockAggregatedScorecardSuccessData[0]}
      />,
      { wrapper: TestWrapper },
    );

    const chartContainer = container.querySelector('[data-chart-container]');
    expect(chartContainer).toBeInTheDocument();
  });
});
