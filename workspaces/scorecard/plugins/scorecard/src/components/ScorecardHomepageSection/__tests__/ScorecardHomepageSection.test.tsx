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

import type { AggregatedMetricResult } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

jest.mock('@backstage/core-components', () => ({
  ResponseErrorPanel: ({ error }: { error: Error }) => (
    <div data-testid="response-error-panel">{error.message}</div>
  ),
}));

// Mock the child components
jest.mock('../../../hooks/useAggregatedScorecard', () => ({
  useAggregatedScorecard: jest.fn(),
}));

jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('../ScorecardHomepageCardComponent', () => ({
  ScorecardHomepageCardComponent: ({
    scorecard,
  }: {
    scorecard: AggregatedMetricResult;
  }) => (
    <div data-testid="scorecard-homepage-card">{scorecard.metadata.title}</div>
  ),
}));

jest.mock('../EmptyStatePanel', () => ({
  EmptyStatePanel: ({
    label,
    metricId,
    tooltipContent,
  }: {
    label: string;
    metricId: string;
    tooltipContent: string;
  }) => (
    <div data-testid="empty-state-panel">
      <div data-testid="empty-state-label">{label}</div>
      <div data-testid="metric-id">{metricId}</div>
      <div data-testid="tooltip-content">{tooltipContent}</div>
    </div>
  ),
}));

const {
  useAggregatedScorecard,
} = require('../../../hooks/useAggregatedScorecard');

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
);

const mockScorecard: AggregatedMetricResult = {
  id: 'github.open_prs',
  status: 'success',
  metadata: {
    title: 'GitHub open PRs',
    description: 'Open PR count',
    type: 'number',
    history: true,
  },
  result: {
    total: 8,
    values: [{ name: 'success', count: 8 }],
    timestamp: '2024-01-01T00:00:00Z',
  },
};

describe('ScorecardHomepageCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading spinner when data is loading', () => {
    useAggregatedScorecard.mockReturnValue({
      aggregatedScorecard: undefined,
      loadingData: true,
      error: undefined,
    });

    render(<ScorecardHomepageCard metricId="github.open_prs" />, {
      wrapper: TestWrapper,
    });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render empty state panel when NotAllowedError occurs', () => {
    useAggregatedScorecard.mockReturnValue({
      aggregatedScorecard: undefined,
      loadingData: false,
      error: new Error('NotAllowedError: missing permission'),
    });

    render(<ScorecardHomepageCard metricId="jira.open_issues" />, {
      wrapper: TestWrapper,
    });

    expect(screen.getByTestId('empty-state-panel')).toBeInTheDocument();
    expect(screen.getByTestId('metric-id')).toHaveTextContent(
      'jira.open_issues',
    );
    expect(screen.getByTestId('empty-state-label')).toHaveTextContent(
      'errors.missingPermission',
    );
    expect(screen.getByTestId('tooltip-content')).toHaveTextContent(
      'errors.missingPermissionMessage',
    );
  });

  it('should render empty state panel for non-permission errors', () => {
    useAggregatedScorecard.mockReturnValue({
      aggregatedScorecard: undefined,
      loadingData: false,
      error: new Error('Something went wrong'),
    });

    render(<ScorecardHomepageCard metricId="github.open_prs" />, {
      wrapper: TestWrapper,
    });

    expect(screen.getByTestId('response-error-panel')).toBeInTheDocument();
    expect(screen.getByTestId('response-error-panel')).toHaveTextContent(
      'Something went wrong',
    );
  });

  it('should render empty state panel when authentication error occurs', () => {
    useAggregatedScorecard.mockReturnValue({
      aggregatedScorecard: undefined,
      loadingData: false,
      error: new Error('AuthenticationError: User entity reference not found'),
    });

    render(<ScorecardHomepageCard metricId="github.open_prs" />, {
      wrapper: TestWrapper,
    });

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
      aggregatedScorecard: undefined,
      loadingData: false,
      error: new Error('NotFoundError: User entity not found in catalog'),
    });

    render(<ScorecardHomepageCard metricId="github.open_prs" />, {
      wrapper: TestWrapper,
    });

    expect(screen.getByTestId('empty-state-panel')).toBeInTheDocument();
    expect(screen.getByTestId('empty-state-label')).toHaveTextContent(
      'errors.metricDataUnavailable',
    );
    expect(screen.getByTestId('tooltip-content')).toHaveTextContent(
      'errors.userNotFoundInCatalogMessage',
    );
  });

  it('should render empty state panel when aggregation data is found', () => {
    useAggregatedScorecard.mockReturnValue({
      aggregatedScorecard: {
        ...mockScorecard,
        result: {
          total: 0,
          values: [],
          timestamp: '2024-01-01T00:00:00Z',
        },
      },
      loadingData: false,
      error: undefined,
    });

    render(<ScorecardHomepageCard metricId="github.open_prs" />, {
      wrapper: TestWrapper,
    });

    expect(screen.getByTestId('empty-state-panel')).toBeInTheDocument();
    expect(screen.getByTestId('metric-id')).toHaveTextContent(
      'github.open_prs',
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
      aggregatedScorecard: mockScorecard,
      loadingData: false,
      error: undefined,
    });

    render(<ScorecardHomepageCard metricId="github.open_prs" />, {
      wrapper: TestWrapper,
    });

    expect(screen.getByTestId('scorecard-homepage-card')).toBeInTheDocument();
    expect(screen.getByText('GitHub open PRs')).toBeInTheDocument();
  });
});
