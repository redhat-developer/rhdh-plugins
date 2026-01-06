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

import {
  ScorecardJiraHomepageCard,
  ScorecardGitHubHomepageCard,
} from '../ScorecardHomepageSection';

import type { AggregatedMetricResult } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

// Mock the child components
jest.mock('../../../hooks/useAggregatedScorecard', () => ({
  useAggregatedScorecard: jest.fn(),
}));

jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('../ScorecardHomepageCard', () => ({
  ScorecardHomepageCard: ({
    scorecard,
  }: {
    scorecard: AggregatedMetricResult;
  }) => (
    <div data-testid="scorecard-homepage-card">{scorecard.metadata.title}</div>
  ),
}));

jest.mock('../PermissionRequiredHomepageCard', () => ({
  PermissionRequiredHomepageCard: ({ metricId }: { metricId: string }) => (
    <div data-testid="permission-required">{metricId}</div>
  ),
}));

jest.mock('@backstage/core-components', () => ({
  ResponseErrorPanel: ({ error }: { error: Error }) => (
    <div data-testid="response-error-panel">{error.message}</div>
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

describe('ScorecardHomepageWrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading spinner when data is loading', () => {
    useAggregatedScorecard.mockReturnValue({
      aggregatedScorecard: undefined,
      loadingData: true,
      error: undefined,
    });

    render(<ScorecardGitHubHomepageCard />, { wrapper: TestWrapper });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render permission required card when NotAllowedError occurs', () => {
    useAggregatedScorecard.mockReturnValue({
      aggregatedScorecard: undefined,
      loadingData: false,
      error: new Error('NotAllowedError: missing permission'),
    });

    render(<ScorecardJiraHomepageCard />, { wrapper: TestWrapper });

    expect(screen.getByTestId('permission-required')).toBeInTheDocument();
    expect(screen.getByText('jira.open_issues')).toBeInTheDocument();
  });

  it('should render error panel for non-permission errors', () => {
    useAggregatedScorecard.mockReturnValue({
      aggregatedScorecard: undefined,
      loadingData: false,
      error: new Error('Something went wrong'),
    });

    render(<ScorecardGitHubHomepageCard />, { wrapper: TestWrapper });

    expect(screen.getByTestId('response-error-panel')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should render scorecard homepage card when data loads successfully', () => {
    useAggregatedScorecard.mockReturnValue({
      aggregatedScorecard: [mockScorecard],
      loadingData: false,
      error: undefined,
    });

    render(<ScorecardGitHubHomepageCard />, { wrapper: TestWrapper });

    expect(screen.getByTestId('scorecard-homepage-card')).toBeInTheDocument();
    expect(screen.getByText('GitHub open PRs')).toBeInTheDocument();
  });

  it('should render only the first scorecard when multiple are returned', () => {
    useAggregatedScorecard.mockReturnValue({
      aggregatedScorecard: [
        mockScorecard,
        {
          ...mockScorecard,
          id: 'second.metric',
          metadata: {
            ...mockScorecard.metadata,
            title: 'Second Metric',
          },
        },
      ],
      loadingData: false,
      error: undefined,
    });

    render(<ScorecardGitHubHomepageCard />, { wrapper: TestWrapper });

    expect(screen.getAllByTestId('scorecard-homepage-card')).toHaveLength(1);
    expect(screen.getByText('GitHub open PRs')).toBeInTheDocument();
    expect(screen.queryByText('Second Metric')).not.toBeInTheDocument();
  });

  it('should render nothing when no scorecards are returned', () => {
    useAggregatedScorecard.mockReturnValue({
      aggregatedScorecard: [],
      loadingData: false,
      error: undefined,
    });

    render(<ScorecardGitHubHomepageCard />, { wrapper: TestWrapper });

    expect(
      screen.queryByTestId('scorecard-homepage-card'),
    ).not.toBeInTheDocument();
  });
});
