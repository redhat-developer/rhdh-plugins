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

import { ScorecardHomepageSection } from '../ScorecardHomepageSection';
import { mockAggregatedScorecardSuccessData } from '../../../../__fixtures__/aggregatedScorecardData';

// Mock the child components
jest.mock('../../Common/PermissionRequiredState', () => {
  return function MockPermissionRequiredState() {
    return (
      <div data-testid="permission-required-state">Permission Required</div>
    );
  };
});

jest.mock('../ScorecardHomepageCard', () => ({
  ScorecardHomepageCard: function MockScorecardHomepageCard({
    scorecard,
  }: {
    scorecard: { id: string; metadata: { title: string } };
  }) {
    return (
      <div data-testid="scorecard-homepage-card" data-id={scorecard.id}>
        {scorecard.metadata.title}
      </div>
    );
  },
}));

jest.mock('@backstage/core-components', () => ({
  ResponseErrorPanel: ({ error }: { error: Error }) => (
    <div data-testid="response-error-panel">{error?.message ?? 'Error'}</div>
  ),
}));

jest.mock('../../../hooks/useAggregatedScorecards', () => ({
  useAggregatedScorecards: jest.fn(),
}));

// Get the mocked function
const {
  useAggregatedScorecards,
} = require('../../../hooks/useAggregatedScorecards');

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const theme = createTheme();
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

describe('ScorecardHomepageSection Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading spinner when data is loading', () => {
    useAggregatedScorecards.mockReturnValue({
      aggregatedScorecards: undefined,
      loadingData: true,
      error: undefined,
    });

    render(<ScorecardHomepageSection />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render permission required state when error contains NotAllowedError', () => {
    useAggregatedScorecards.mockReturnValue({
      aggregatedScorecards: [],
      loadingData: false,
      error: new Error('NotAllowedError: missing permission'),
    });

    render(<ScorecardHomepageSection />);
    expect(screen.getByTestId('permission-required-state')).toBeInTheDocument();
  });

  it('should render error panel for non-permission errors', () => {
    const error = new Error('Something went wrong');

    useAggregatedScorecards.mockReturnValue({
      aggregatedScorecards: [],
      loadingData: false,
      error,
    });

    render(<ScorecardHomepageSection />);

    expect(screen.getByTestId('response-error-panel')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should render scorecard cards when data is loaded successfully', () => {
    useAggregatedScorecards.mockReturnValue({
      aggregatedScorecards: mockAggregatedScorecardSuccessData,
      loadingData: false,
      error: undefined,
    });

    render(<ScorecardHomepageSection />, { wrapper: TestWrapper });

    const cards = screen.getAllByTestId('scorecard-homepage-card');
    expect(cards).toHaveLength(2);
    expect(screen.getByText('GitHub open PRs')).toBeInTheDocument();
    expect(screen.getByText('Open Jira Issues')).toBeInTheDocument();
  });

  it('should render only first two scorecards when more than two are available', () => {
    const threeScorecards = [
      ...mockAggregatedScorecardSuccessData,
      {
        id: 'third.scorecard',
        status: 'success',
        metadata: {
          title: 'Third Scorecard',
          description: 'Third description',
          type: 'object',
        },
        result: {
          value: {
            success: { value: 5 },
          },
          timestamp: '2024-01-15T10:30:00Z',
        },
      },
    ];

    useAggregatedScorecards.mockReturnValue({
      aggregatedScorecards: threeScorecards,
      loadingData: false,
      error: undefined,
    });

    render(<ScorecardHomepageSection />, { wrapper: TestWrapper });

    const cards = screen.getAllByTestId('scorecard-homepage-card');
    expect(cards).toHaveLength(2);
    expect(screen.getByText('GitHub open PRs')).toBeInTheDocument();
    expect(screen.getByText('Open Jira Issues')).toBeInTheDocument();
    expect(screen.queryByText('Third Scorecard')).not.toBeInTheDocument();
  });

  it('should render empty state when there are no scorecards', () => {
    useAggregatedScorecards.mockReturnValue({
      aggregatedScorecards: [],
      loadingData: false,
      error: undefined,
    });

    render(<ScorecardHomepageSection />);

    expect(
      screen.queryByTestId('permission-required-state'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('response-error-panel'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('scorecard-homepage-card'),
    ).not.toBeInTheDocument();
  });
});
