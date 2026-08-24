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

import { AggregatedMetricCard } from '../../AggregatedMetricCards/AggregatedMetricCard';
import {
  aggregationTypes,
  DEFAULT_NUMBER_THRESHOLDS,
  type AggregatedMetricResult,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
// --------------------
// Mocks
// --------------------

jest.mock('@backstage/core-components', () => {
  const actual = jest.requireActual('@backstage/core-components');
  return {
    ...actual,
    ResponseErrorPanel: ({ error }: { error: Error }) => (
      <div data-testid="response-error-panel">{error.message}</div>
    ),
  };
});

jest.mock('../../Common/CardWrapper', () => ({
  CardWrapper: ({
    title,
    subheader,
    description,
    children,
  }: {
    title: string;
    subheader?: React.ReactNode;
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
    LabelContent,
  }: {
    legendContent?: (props: unknown) => React.ReactNode;
    tooltipContent?: (props: {
      active?: boolean;
      payload?: unknown[];
    }) => React.ReactNode;
    pieData: Array<{ name: string; value: number; color: string }>;
    LabelContent?: (props: Record<string, unknown>) => React.ReactNode;
  }) => (
    <div data-testid="responsive-pie-chart">
      <div data-testid="pie-data-length">{pieData.length}</div>
      {pieData.map(data => (
        <div
          key={data.name}
          data-testid={`pie-segment-${data.name}`}
          data-color={data.color}
        >
          {data.name}: {data.value}
        </div>
      ))}
      <div data-testid="weighted-status-score-pie-label-area">
        <svg>
          {typeof LabelContent === 'function' ? (
            <LabelContent cx={100} cy={50} index={0} />
          ) : null}
        </svg>
      </div>
      {legendContent ? (
        <div data-testid="legend">{legendContent({})}</div>
      ) : null}
      <div data-testid="tooltip">
        {typeof tooltipContent === 'function'
          ? tooltipContent({ active: true, payload: [] })
          : null}
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
    t: (key: string, options?: any) => {
      switch (key) {
        case 'metric.homepageEntityHealthRatio':
          return '{{healthy}}/{{total}} entities';
        case 'thresholds.entities':
          return `${options?.count} entities`;
        case 'metric.someEntitiesNotReportingValues':
          return 'Some entities are not reporting values related to this metric.';
        case 'thresholds.noEntities':
          return `No entities in ${options?.category} state`;
        case 'thresholds.Test':
          return 'Test';
        case 'errors.missingPermissionMessage':
          return 'Missing permission';
        case 'errors.unsupportedAggregationType':
          return 'Unsupported aggregation type';
        case 'aggregation.min':
          return 'Min';
        case 'aggregation.max':
          return 'Max';
        case 'aggregation.sum':
          return 'Sum';
        case 'aggregation.count':
          return 'Count';
        case 'aggregation.average':
          return 'Average';
        default:
          return key;
      }
    },
  }),
}));

// --------------------
// Test data
// --------------------

const mockScorecard: AggregatedMetricResult = {
  id: 'github.openPRs',
  status: 'success',
  metadata: {
    title: 'GitHub open PRs',
    description: 'Open PRs',
    type: 'number',
    history: true,
    aggregationType: aggregationTypes.statusGrouped,
  },
  result: {
    total: 37,
    values: [
      { name: 'success', count: 11 },
      { name: 'warning', count: 14 },
      { name: 'error', count: 12 },
    ],
    timestamp: '2024-01-01T00:00:00Z',
    thresholds: DEFAULT_NUMBER_THRESHOLDS,
    entitiesConsidered: 37,
    calculationErrorCount: 0,
  },
};

const mockWeightedStatusScoreScorecard: AggregatedMetricResult = {
  ...mockScorecard,
  metadata: {
    ...mockScorecard.metadata,
    aggregationType: aggregationTypes.weightedStatusScore,
  },
  result: {
    ...mockScorecard.result,
    weightedStatusScore: 75,
    weightedStatusSum: 18,
    weightedStatusMaxPossible: 24,
    aggregationChartDisplayColor: 'warning.main',
  },
};

const mockUnsupportedAggregationScorecard: AggregatedMetricResult = {
  id: 'unknown.kpi',
  status: 'success',
  metadata: {
    title: 'Unknown KPI',
    description: 'desc',
    type: 'number',
    history: true,
    aggregationType:
      'futureStrategy' as AggregatedMetricResult['metadata']['aggregationType'],
  },
  result: {
    total: 4,
    timestamp: '2024-01-01T00:00:00Z',
    entitiesConsidered: 4,
    calculationErrorCount: 0,
    thresholds: DEFAULT_NUMBER_THRESHOLDS,
  } as AggregatedMetricResult['result'],
};

const mockScalarAggregationScorecard: AggregatedMetricResult = {
  id: 'totalCriticalPRs',
  status: 'success',
  metadata: {
    title: 'Total Critical PRs',
    description: 'Sum of open PRs for entities in error status.',
    type: 'number',
    history: true,
    aggregationType: aggregationTypes.sum,
  },
  result: {
    value: 12,
    total: 4,
    timestamp: '2024-01-01T00:00:00Z',
    thresholds: DEFAULT_NUMBER_THRESHOLDS,
    entitiesConsidered: 4,
    calculationErrorCount: 0,
  },
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
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
  </BrowserRouter>
);

// --------------------
// Tests
// --------------------

describe('AggregatedMetricCard (homepage scorecard)', () => {
  it('should render title, subheader, and description', () => {
    render(
      <AggregatedMetricCard
        scorecard={mockScorecard}
        aggregationId={mockScorecard.id}
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

  it('should render ratio and warning affordance when calculation errors exist', () => {
    const scorecardWithCalculationErrors: AggregatedMetricResult = {
      ...mockScorecard,
      result: {
        ...mockScorecard.result,
        entitiesConsidered: 45,
        calculationErrorCount: 8,
      },
    };

    render(
      <AggregatedMetricCard
        scorecard={scorecardWithCalculationErrors}
        aggregationId={scorecardWithCalculationErrors.id}
        cardTitle="GitHub open PRs"
        description="desc"
      />,
      { wrapper: TestWrapper },
    );

    expect(screen.getByTestId('card-subheader')).toHaveTextContent(
      '37/45 entities',
    );
    expect(screen.queryByTestId('scorecard-homepage-card-warning')).toBeNull();
  });

  it('should infer ratio and warning from entitiesConsidered minus total when calculationErrorCount is missing', () => {
    const scorecardWithImplicitCalculationErrors: AggregatedMetricResult = {
      ...mockScorecard,
      result: {
        ...mockScorecard.result,
        total: 4,
        entitiesConsidered: 5,
        calculationErrorCount: 0,
      },
    };

    render(
      <AggregatedMetricCard
        scorecard={scorecardWithImplicitCalculationErrors}
        aggregationId={scorecardWithImplicitCalculationErrors.id}
        cardTitle="GitHub open PRs"
        description="desc"
      />,
      { wrapper: TestWrapper },
    );

    expect(screen.getByTestId('card-subheader')).toHaveTextContent(
      '4/5 entities',
    );
    expect(screen.queryByTestId('scorecard-homepage-card-warning')).toBeNull();
  });

  it('should render ResponsivePieChart', () => {
    render(
      <AggregatedMetricCard
        scorecard={mockScorecard}
        aggregationId={mockScorecard.id}
        cardTitle="GitHub open PRs"
        description="desc"
      />,
      { wrapper: TestWrapper },
    );

    expect(screen.getByTestId('responsive-pie-chart')).toBeInTheDocument();
  });

  it('should pass correct colors for rings to ResponsivePieChart', () => {
    render(
      <AggregatedMetricCard
        scorecard={mockScorecard}
        aggregationId={mockScorecard.id}
        cardTitle="Test"
        description="desc"
      />,
      { wrapper: TestWrapper },
    );

    expect(screen.getByTestId('pie-segment-success')).toHaveAttribute(
      'data-color',
      '#52c41a',
    );
    expect(screen.getByTestId('pie-segment-warning')).toHaveAttribute(
      'data-color',
      '#F0AB00',
    );
    expect(screen.getByTestId('pie-segment-error')).toHaveAttribute(
      'data-color',
      '#C9190B',
    );
  });

  it('should pass correct pie data length', () => {
    render(
      <AggregatedMetricCard
        scorecard={mockScorecard}
        aggregationId={mockScorecard.id}
        cardTitle="GitHub open PRs"
        description="desc"
      />,
      { wrapper: TestWrapper },
    );

    expect(screen.getByTestId('pie-data-length')).toHaveTextContent('3');
  });

  it('should render CustomLegend and CustomTooltip', () => {
    render(
      <AggregatedMetricCard
        scorecard={mockScorecard}
        aggregationId={mockScorecard.id}
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
        entitiesConsidered: 0,
        calculationErrorCount: 0,
      },
    };

    render(
      <AggregatedMetricCard
        scorecard={emptyScorecard}
        aggregationId={emptyScorecard.id}
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
      <AggregatedMetricCard
        scorecard={mockScorecard}
        aggregationId={mockScorecard.id}
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
        entitiesConsidered: 37,
        calculationErrorCount: 0,
      },
    };

    render(
      <AggregatedMetricCard
        scorecard={scorecardWithoutValues}
        aggregationId={scorecardWithoutValues.id}
        cardTitle="No Values"
        description="desc"
      />,
      { wrapper: TestWrapper },
    );

    expect(screen.getByTestId('pie-data-length')).toHaveTextContent('0');
  });

  it('should render two donut slices and center percent for weightedStatusScore aggregation', () => {
    render(
      <AggregatedMetricCard
        scorecard={mockWeightedStatusScoreScorecard}
        aggregationId={mockWeightedStatusScoreScorecard.id}
        cardTitle="Generative AI APIs"
        description="Weighted health score for the group."
      />,
      { wrapper: TestWrapper },
    );

    expect(screen.getByTestId('pie-data-length')).toHaveTextContent('2');
    expect(
      screen.getByTestId('pie-segment-weightedStatusScoreFill'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('pie-segment-weightedStatusScoreRemainder'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('weighted-status-score-card-center-percent'),
    ).toHaveTextContent('75%');
  });

  it('should render error panel when the result shape is unrecognized', () => {
    render(
      <AggregatedMetricCard
        scorecard={mockUnsupportedAggregationScorecard}
        aggregationId={mockUnsupportedAggregationScorecard.id}
        cardTitle="Unknown KPI"
        description="desc"
        dataTestId="unsupported-agg-card"
      />,
      { wrapper: TestWrapper },
    );

    expect(screen.getByTestId('response-error-panel')).toHaveTextContent(
      'Unsupported aggregation type (futureStrategy)',
    );
  });

  it.each([
    aggregationTypes.sum,
    aggregationTypes.average,
    aggregationTypes.min,
    aggregationTypes.max,
    aggregationTypes.count,
  ])(
    'should render scalar value and threshold status for %s',
    aggregationType => {
      render(
        <AggregatedMetricCard
          scorecard={{
            ...mockScalarAggregationScorecard,
            metadata: {
              ...mockScalarAggregationScorecard.metadata,
              aggregationType,
            },
          }}
          aggregationId={mockScalarAggregationScorecard.id}
          cardTitle="Total Critical PRs"
          description="Sum of open PRs for entities in error status."
        />,
        { wrapper: TestWrapper },
      );

      expect(screen.getByTestId('card-title')).toHaveTextContent(
        'Total Critical PRs',
      );
      expect(screen.getByTestId('card-description')).toHaveTextContent(
        'Sum of open PRs for entities in error status.',
      );
      expect(screen.getByTestId('card-subheader')).toHaveTextContent(
        '4 entities',
      );
      expect(screen.getByTestId('scalar-stat-value')).toHaveTextContent('12');
      expect(screen.getByTestId('scalar-stat-tile')).toHaveAttribute(
        'data-threshold-status',
        'warning',
      );
      expect(screen.getByTestId('scalar-stat-label')).toHaveTextContent(
        aggregationType.charAt(0).toUpperCase() + aggregationType.slice(1),
      );
      expect(
        screen.queryByTestId('responsive-pie-chart'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('response-error-panel'),
      ).not.toBeInTheDocument();
    },
  );

  it('should render calculation-error ratio for scalar aggregations', () => {
    render(
      <AggregatedMetricCard
        scorecard={{
          ...mockScalarAggregationScorecard,
          result: {
            ...mockScalarAggregationScorecard.result,
            total: 0,
            value: 0,
            entitiesConsidered: 5,
            calculationErrorCount: 5,
          },
        }}
        aggregationId={mockScalarAggregationScorecard.id}
        cardTitle="Total Critical PRs"
        description="desc"
      />,
      { wrapper: TestWrapper },
    );

    expect(screen.getByTestId('card-subheader')).toHaveTextContent(
      '0/5 entities',
    );
    expect(screen.getByTestId('scalar-stat-value')).toHaveTextContent('0');
    expect(screen.getByTestId('scalar-stat-tile')).toHaveAttribute(
      'data-threshold-status',
      '',
    );
  });

  it('should skip threshold coloring when a scalar aggregation has no entities', () => {
    render(
      <AggregatedMetricCard
        scorecard={{
          ...mockScalarAggregationScorecard,
          result: {
            ...mockScalarAggregationScorecard.result,
            total: 0,
            value: 0,
            entitiesConsidered: 0,
            calculationErrorCount: 0,
          },
        }}
        aggregationId={mockScalarAggregationScorecard.id}
        cardTitle="Total Critical PRs"
        description="desc"
      />,
      { wrapper: TestWrapper },
    );

    expect(screen.getByTestId('scalar-stat-value')).toHaveTextContent('0');
    expect(screen.getByTestId('scalar-stat-tile')).toHaveAttribute(
      'data-threshold-status',
      '',
    );
  });

  it('should render ScalarStatCard for an unknown type when the result is scalar-shaped', () => {
    render(
      <AggregatedMetricCard
        scorecard={{
          ...mockScalarAggregationScorecard,
          metadata: {
            ...mockScalarAggregationScorecard.metadata,
            aggregationType:
              'median' as AggregatedMetricResult['metadata']['aggregationType'],
          },
        }}
        aggregationId={mockScalarAggregationScorecard.id}
        cardTitle="Median Open PRs"
        description="Median open PR count."
      />,
      { wrapper: TestWrapper },
    );

    expect(screen.getByTestId('scalar-stat-value')).toHaveTextContent('12');
    expect(screen.getByTestId('scalar-stat-label')).toHaveTextContent('Median');
    expect(
      screen.queryByTestId('response-error-panel'),
    ).not.toBeInTheDocument();
  });

  it('should render a distribution card when the result has a values array, regardless of type name', () => {
    render(
      <AggregatedMetricCard
        scorecard={{
          ...mockScorecard,
          metadata: {
            ...mockScorecard.metadata,
            aggregationType: aggregationTypes.sum,
          },
        }}
        aggregationId={mockScorecard.id}
        cardTitle="Distribution-shaped KPI"
        description="desc"
      />,
      { wrapper: TestWrapper },
    );

    expect(screen.getByTestId('responsive-pie-chart')).toBeInTheDocument();
    expect(
      screen.queryByTestId('response-error-panel'),
    ).not.toBeInTheDocument();
  });
});
