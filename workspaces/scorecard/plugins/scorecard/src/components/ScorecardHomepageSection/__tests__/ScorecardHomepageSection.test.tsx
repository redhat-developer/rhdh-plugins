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

import {
  DEFAULT_NUMBER_THRESHOLDS,
  type AggregatedMetricResult,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

jest.mock('@backstage/core-components', () => ({
  ResponseErrorPanel: ({ error }: { error: Error }) => (
    <div data-testid="response-error-panel">{error.message}</div>
  ),
}));

jest.mock('../../../hooks/useAggregatedScorecard', () => ({
  useAggregatedScorecard: jest.fn(),
}));

jest.mock('../../../hooks/useAggregationMetadata', () => ({
  useAggregationMetadata: jest.fn(),
}));

jest.mock('../../../hooks/useAggregationTimeSeries', () => ({
  useAggregationTimeSeries: jest.fn(),
}));

jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('../../AggregatedMetricCards/AggregatedMetricCard', () => ({
  AggregatedMetricCard: ({
    scorecard,
  }: {
    scorecard: AggregatedMetricResult;
  }) => (
    <div data-testid="scorecard-homepage-card">{scorecard.metadata.title}</div>
  ),
}));

jest.mock('../../AggregatedMetricCards/AggregatedSparklineCard', () => ({
  AggregatedSparklineCard: ({ cardTitle }: { cardTitle: string }) => (
    <div data-testid="aggregated-sparkline-card">{cardTitle}</div>
  ),
}));

jest.mock('../EmptyStatePanel', () => ({
  EmptyStatePanel: ({
    label,
    cardTitle,
    cardDescription,
    tooltipContent,
  }: {
    label: string;
    cardTitle: string;
    cardDescription: string;
    tooltipContent: string;
  }) => (
    <div data-testid="empty-state-panel">
      <div data-testid="empty-state-label">{label}</div>
      <div data-testid="card-title">{cardTitle}</div>
      <div data-testid="card-description">{cardDescription}</div>
      <div data-testid="tooltip-content">{tooltipContent}</div>
    </div>
  ),
}));

const {
  useAggregatedScorecard,
} = require('../../../hooks/useAggregatedScorecard');
const {
  useAggregationMetadata,
} = require('../../../hooks/useAggregationMetadata');
const {
  useAggregationTimeSeries,
} = require('../../../hooks/useAggregationTimeSeries');

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
);

const mockScorecard: AggregatedMetricResult = {
  id: 'github.openPRs',
  status: 'success',
  metadata: {
    title: 'GitHub open PRs',
    description: 'Open PR count',
    type: 'number',
    history: true,
    aggregationType: 'statusGrouped',
  },
  result: {
    total: 8,
    values: [{ name: 'success', count: 8 }],
    timestamp: '2024-01-01T00:00:00Z',
    thresholds: DEFAULT_NUMBER_THRESHOLDS,
    entitiesConsidered: 8,
    calculationErrorCount: 0,
  },
};

describe('ScorecardHomepageCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAggregationMetadata.mockReturnValue({
      data: {
        title: 'Jira Open Issues KPI',
        description: 'KPI description',
        type: 'number',
        history: true,
        aggregationType: 'statusGrouped',
      },
      isLoading: false,
      error: undefined,
    });
    useAggregationTimeSeries.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: undefined,
    });
  });

  it('should render loading spinner when data is loading', () => {
    useAggregatedScorecard.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
    });

    render(
      <ScorecardHomepageCard
        metricId="github.openPRs"
        aggregationId="openPrsKpi"
      />,
      {
        wrapper: TestWrapper,
      },
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should treat empty aggregationId as unset and pass metricId to useAggregatedScorecard', () => {
    useAggregatedScorecard.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
    });

    render(
      <ScorecardHomepageCard metricId="github.openPRs" aggregationId="" />,
      {
        wrapper: TestWrapper,
      },
    );

    expect(useAggregatedScorecard).toHaveBeenCalledWith({
      aggregationId: 'github.openPRs',
      enabled: true,
    });
  });

  it('should prefer non-empty aggregationId over metricId for useAggregatedScorecard', () => {
    useAggregatedScorecard.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
    });

    render(
      <ScorecardHomepageCard
        metricId="metric.fallback"
        aggregationId="agg.primary"
      />,
      {
        wrapper: TestWrapper,
      },
    );

    expect(useAggregatedScorecard).toHaveBeenCalledWith({
      aggregationId: 'agg.primary',
      enabled: true,
    });
  });

  it('should pass only aggregationId to useAggregatedScorecard when metricId is omitted', () => {
    useAggregatedScorecard.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
    });

    render(<ScorecardHomepageCard aggregationId="kpi.only" />, {
      wrapper: TestWrapper,
    });

    expect(useAggregatedScorecard).toHaveBeenCalledWith({
      aggregationId: 'kpi.only',
      enabled: true,
    });
  });

  it('should pass only metricId to useAggregatedScorecard when aggregationId is omitted', () => {
    useAggregatedScorecard.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
    });

    render(<ScorecardHomepageCard metricId="github.openPRs" />, {
      wrapper: TestWrapper,
    });

    expect(useAggregatedScorecard).toHaveBeenCalledWith({
      aggregationId: 'github.openPRs',
      enabled: true,
    });
  });

  it('should render empty state panel when NotAllowedError occurs', () => {
    useAggregatedScorecard.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('NotAllowedError: missing permission'),
    });

    render(
      <ScorecardHomepageCard
        metricId="jira.openIssues"
        aggregationId="openIssuesKpi"
      />,
      {
        wrapper: TestWrapper,
      },
    );

    expect(screen.getByTestId('empty-state-panel')).toBeInTheDocument();
    expect(screen.getByTestId('card-title')).toHaveTextContent(
      'Jira Open Issues KPI',
    );
    expect(screen.getByTestId('empty-state-label')).toHaveTextContent(
      'errors.missingPermission',
    );
    expect(screen.getByTestId('tooltip-content')).toHaveTextContent(
      'errors.missingPermissionMessage',
    );
  });

  it('should render response error panel for non-permission errors', () => {
    useAggregatedScorecard.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Something went wrong'),
    });

    render(
      <ScorecardHomepageCard
        metricId="github.openPRs"
        aggregationId="openPrsKpi"
      />,
      {
        wrapper: TestWrapper,
      },
    );

    expect(screen.getByTestId('response-error-panel')).toBeInTheDocument();
    expect(screen.getByTestId('response-error-panel')).toHaveTextContent(
      'Something went wrong',
    );
  });

  it('should render empty state panel when authentication error occurs', () => {
    useAggregatedScorecard.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('AuthenticationError: User entity reference not found'),
    });

    render(
      <ScorecardHomepageCard
        metricId="github.openPRs"
        aggregationId="openPrsKpi"
      />,
      {
        wrapper: TestWrapper,
      },
    );

    expect(screen.getByTestId('empty-state-panel')).toBeInTheDocument();
    expect(screen.getByTestId('empty-state-label')).toHaveTextContent(
      'errors.authenticationError',
    );
    expect(screen.getByTestId('tooltip-content')).toHaveTextContent(
      'errors.authenticationErrorMessage',
    );
  });

  it('should render empty state panel when user entity is not found in catalog', () => {
    useAggregatedScorecard.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('NotFoundError: User entity not found in catalog'),
    });

    render(
      <ScorecardHomepageCard
        metricId="github.openPRs"
        aggregationId="openPrsKpi"
      />,
      {
        wrapper: TestWrapper,
      },
    );

    expect(screen.getByTestId('empty-state-panel')).toBeInTheDocument();
    expect(screen.getByTestId('empty-state-label')).toHaveTextContent(
      'errors.metricDataUnavailable',
    );
    expect(screen.getByTestId('tooltip-content')).toHaveTextContent(
      'errors.userNotFoundInCatalogMessage',
    );
  });

  it('should render empty state panel when aggregation total is zero', () => {
    useAggregatedScorecard.mockReturnValue({
      data: {
        ...mockScorecard,
        result: {
          total: 0,
          values: [],
          timestamp: '2024-01-01T00:00:00Z',
          thresholds: DEFAULT_NUMBER_THRESHOLDS,
          entitiesConsidered: 0,
          calculationErrorCount: 0,
        },
      },
      isLoading: false,
      error: undefined,
    });

    render(
      <ScorecardHomepageCard
        metricId="github.openPRs"
        aggregationId="openPrsKpi"
      />,
      {
        wrapper: TestWrapper,
      },
    );

    expect(screen.getByTestId('empty-state-panel')).toBeInTheDocument();
    expect(screen.getByTestId('card-title')).toHaveTextContent(
      'GitHub open PRs',
    );
    expect(screen.getByTestId('empty-state-label')).toHaveTextContent(
      'errors.noDataFound',
    );
    expect(screen.getByTestId('tooltip-content')).toHaveTextContent(
      'errors.noDataFoundMessage',
    );
  });

  it('should render scorecard homepage card when data loads successfully', () => {
    useAggregatedScorecard.mockReturnValue({
      data: mockScorecard,
      isLoading: false,
      error: undefined,
    });

    render(
      <ScorecardHomepageCard
        metricId="github.openPRs"
        aggregationId="openPrsKpi"
      />,
      {
        wrapper: TestWrapper,
      },
    );

    expect(screen.getByTestId('scorecard-homepage-card')).toBeInTheDocument();
    expect(screen.getByText('GitHub open PRs')).toBeInTheDocument();
  });

  it('should keep snapshot fetch disabled until aggregation metadata has loaded', () => {
    useAggregationMetadata.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
    });
    useAggregatedScorecard.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: undefined,
    });

    render(<ScorecardHomepageCard aggregationId="avgDeploymentFrequency" />, {
      wrapper: TestWrapper,
    });

    expect(useAggregatedScorecard).toHaveBeenCalledWith({
      aggregationId: 'avgDeploymentFrequency',
      enabled: false,
    });
    expect(useAggregationTimeSeries).toHaveBeenCalledWith({
      aggregationId: 'avgDeploymentFrequency',
      enabled: false,
    });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render a sparkline card from time-series when metadata visualization is sparkline', () => {
    useAggregationMetadata.mockReturnValue({
      data: {
        title: 'Average Deployment Frequency',
        description: 'Average weekly production deploys',
        type: 'number',
        history: true,
        visualization: 'sparkline',
        aggregationType: 'average',
      },
      isLoading: false,
      error: undefined,
    });
    useAggregatedScorecard.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: undefined,
    });
    useAggregationTimeSeries.mockReturnValue({
      data: {
        id: 'avgDeploymentFrequency',
        metricId: 'dora.deploymentFrequency',
        metadata: {
          title: 'Average Deployment Frequency',
          description: 'Average weekly production deploys',
          type: 'number',
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
        ],
        thresholds: DEFAULT_NUMBER_THRESHOLDS,
        aggregationChartDisplayColor: 'success.main',
      },
      isLoading: false,
      error: undefined,
    });

    render(<ScorecardHomepageCard aggregationId="avgDeploymentFrequency" />, {
      wrapper: TestWrapper,
    });

    expect(useAggregatedScorecard).toHaveBeenCalledWith({
      aggregationId: 'avgDeploymentFrequency',
      enabled: false,
    });
    expect(useAggregationTimeSeries).toHaveBeenCalledWith({
      aggregationId: 'avgDeploymentFrequency',
      enabled: true,
    });
    expect(screen.getByTestId('aggregated-sparkline-card')).toBeInTheDocument();
    expect(
      screen.getByText('Average Deployment Frequency'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('scorecard-homepage-card'),
    ).not.toBeInTheDocument();
  });

  it('should render empty state when sparkline time-series has no points', () => {
    useAggregationMetadata.mockReturnValue({
      data: {
        title: 'Average Deployment Frequency',
        description: 'Average weekly production deploys',
        type: 'number',
        history: true,
        visualization: 'sparkline',
        aggregationType: 'average',
      },
      isLoading: false,
      error: undefined,
    });
    useAggregatedScorecard.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: undefined,
    });
    useAggregationTimeSeries.mockReturnValue({
      data: {
        id: 'avgDeploymentFrequency',
        metricId: 'dora.deploymentFrequency',
        metadata: {
          title: 'Average Deployment Frequency',
          description: 'Average weekly production deploys',
          type: 'number',
          history: true,
          visualization: 'sparkline',
          aggregationType: 'average',
        },
        points: [],
        thresholds: DEFAULT_NUMBER_THRESHOLDS,
        aggregationChartDisplayColor: null,
      },
      isLoading: false,
      error: undefined,
    });

    render(<ScorecardHomepageCard aggregationId="avgDeploymentFrequency" />, {
      wrapper: TestWrapper,
    });

    expect(screen.getByTestId('empty-state-panel')).toBeInTheDocument();
    expect(screen.getByTestId('card-title')).toHaveTextContent(
      'Average Deployment Frequency',
    );
    expect(screen.getByTestId('empty-state-label')).toHaveTextContent(
      'errors.noDataFound',
    );
  });

  it('should render empty state when sparkline time-series is missing after load', () => {
    useAggregationMetadata.mockReturnValue({
      data: {
        title: 'Average Deployment Frequency',
        description: 'Average weekly production deploys',
        type: 'number',
        history: true,
        visualization: 'sparkline',
        aggregationType: 'average',
      },
      isLoading: false,
      error: undefined,
    });
    useAggregatedScorecard.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: undefined,
    });
    useAggregationTimeSeries.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: undefined,
    });

    render(<ScorecardHomepageCard aggregationId="avgDeploymentFrequency" />, {
      wrapper: TestWrapper,
    });

    expect(screen.getByTestId('empty-state-panel')).toBeInTheDocument();
    expect(screen.getByTestId('card-title')).toHaveTextContent(
      'Average Deployment Frequency',
    );
    expect(
      screen.queryByTestId('aggregated-sparkline-card'),
    ).not.toBeInTheDocument();
  });
});
