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

import { ScorecardHomepageCardComponent } from '../ScorecardHomepageCardComponent';
import type { AggregatedMetricResult } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

// --------------------
// Mocks
// --------------------

jest.mock('../../Common/CardWrapper', () => ({
  CardWrapper: ({
    title,
    subheader,
    description,
    children,
  }: {
    title: string;
    subheader: string;
    description: string;
    children: React.ReactNode;
  }) => (
    <div data-testid="card-wrapper">
      <div data-testid="card-title">{title}</div>
      <div data-testid="card-subheader">{subheader}</div>
      <div data-testid="card-description">{description}</div>
      <div data-testid="card-content">{children}</div>
    </div>
  ),
}));

jest.mock('../ResponsivePieChart', () => ({
  ResponsivePieChart: ({
    legendContent,
    tooltipContent,
    pieData,
  }: {
    legendContent: (props: unknown) => React.ReactNode;
    tooltipContent: (props: {
      active?: boolean;
      payload?: unknown[];
    }) => React.ReactNode;
    pieData: Array<{ name: string; value: number; color: string }>;
  }) => (
    <div data-testid="responsive-pie-chart">
      <div data-testid="pie-data-length">{pieData.length}</div>
      <div data-testid="legend">{legendContent({})}</div>
      <div data-testid="tooltip">
        {tooltipContent({ active: true, payload: [] })}
      </div>
    </div>
  ),
}));

jest.mock('../CustomLegend', () => ({
  __esModule: true,
  default: () => <div data-testid="custom-legend">Custom Legend</div>,
}));

jest.mock('../CustomTooltip', () => ({
  CustomTooltip: () => <div data-testid="custom-tooltip">Custom Tooltip</div>,
}));

jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (_key: string, { count }: { count?: number } = {}) =>
      count !== undefined ? `${count} entities` : _key,
  }),
}));

// --------------------
// Test data
// --------------------

const mockScorecard: AggregatedMetricResult = {
  id: 'github.open_prs',
  status: 'success',
  metadata: {
    title: 'GitHub open PRs',
    description: 'Open PRs',
    type: 'number',
    history: true,
  },
  result: {
    total: 37,
    values: [
      { name: 'success', count: 11 },
      { name: 'warning', count: 14 },
      { name: 'error', count: 12 },
    ],
    timestamp: '2024-01-01T00:00:00Z',
  },
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider
    theme={createTheme({
      palette: {
        success: { main: '#52c41a' },
        warning: { main: '#F0AB00' },
        error: { main: '#C9190B' },
      },
    })}
  >
    {children}
  </ThemeProvider>
);

// --------------------
// Tests
// --------------------

describe('ScorecardHomepageCardComponent', () => {
  it('should render title, subheader, and description', () => {
    render(
      <ScorecardHomepageCardComponent
        scorecard={mockScorecard}
        cardTitle="GitHub open PRs"
        description="Current count of open Pull Requests"
      />,
      { wrapper: TestWrapper },
    );

    expect(screen.getByTestId('card-title')).toHaveTextContent(
      'GitHub open PRs',
    );
    expect(screen.getByTestId('card-subheader')).toHaveTextContent(
      '37 entities',
    );
    expect(screen.getByTestId('card-description')).toHaveTextContent(
      'Current count of open Pull Requests',
    );
  });

  it('should render ResponsivePieChart', () => {
    render(
      <ScorecardHomepageCardComponent
        scorecard={mockScorecard}
        cardTitle="GitHub open PRs"
        description="desc"
      />,
      { wrapper: TestWrapper },
    );

    expect(screen.getByTestId('responsive-pie-chart')).toBeInTheDocument();
  });

  it('should pass correct pie data length', () => {
    render(
      <ScorecardHomepageCardComponent
        scorecard={mockScorecard}
        cardTitle="GitHub open PRs"
        description="desc"
      />,
      { wrapper: TestWrapper },
    );

    expect(screen.getByTestId('pie-data-length')).toHaveTextContent('3');
  });

  it('should render CustomLegend and CustomTooltip', () => {
    render(
      <ScorecardHomepageCardComponent
        scorecard={mockScorecard}
        cardTitle="GitHub open PRs"
        description="desc"
      />,
      { wrapper: TestWrapper },
    );

    expect(screen.getByTestId('custom-legend')).toBeInTheDocument();
    expect(screen.getByTestId('custom-tooltip')).toBeInTheDocument();
  });

  it('should handle empty values gracefully', () => {
    const emptyScorecard: AggregatedMetricResult = {
      ...mockScorecard,
      result: {
        ...mockScorecard.result,
        values: [],
        total: 0,
      },
    };

    render(
      <ScorecardHomepageCardComponent
        scorecard={emptyScorecard}
        cardTitle="Empty"
        description="desc"
      />,
      { wrapper: TestWrapper },
    );

    expect(screen.getByTestId('card-subheader')).toHaveTextContent(
      '0 entities',
    );
    expect(screen.getByTestId('pie-data-length')).toHaveTextContent('0');
  });

  it('should render chart container element', () => {
    const { container } = render(
      <ScorecardHomepageCardComponent
        scorecard={mockScorecard}
        cardTitle="GitHub open PRs"
        description="desc"
      />,
      { wrapper: TestWrapper },
    );

    expect(
      container.querySelector('[data-chart-container]'),
    ).toBeInTheDocument();
  });

  it('should handle undefined values array', () => {
    const scorecardWithoutValues: AggregatedMetricResult = {
      ...mockScorecard,
      result: {
        ...mockScorecard.result,
        values: [],
      },
    };

    render(
      <ScorecardHomepageCardComponent
        scorecard={scorecardWithoutValues}
        cardTitle="No Values"
        description="desc"
      />,
      { wrapper: TestWrapper },
    );

    expect(screen.getByTestId('pie-data-length')).toHaveTextContent('0');
  });
});
