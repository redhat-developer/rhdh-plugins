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

import { render, screen, waitFor } from '@testing-library/react';
import { ScorecardPage } from '../ScorecardPage';

// Mock the child components
jest.mock('../ScorecardEmptyState', () => {
  return function MockScorecardEmptyState() {
    return <div data-testid="scorecard-empty-state">Empty State</div>;
  };
});

jest.mock('../Scorecard', () => {
  return function MockScorecard({
    cardTitle,
    description,
    value,
    loading,
  }: any) {
    if (loading) {
      return <div data-testid="scorecard-loading">Loading...</div>;
    }
    return (
      <div
        data-testid="scorecard-card"
        data-title={cardTitle}
        data-value={value}
      >
        <h3>{cardTitle}</h3>
        <p>{description}</p>
        <span>Value: {value}</span>
      </div>
    );
  };
});

// Mock the fetchMockData function
jest.mock('../mockData', () => ({
  fetchMockData: jest.fn(),
}));

const mockDataWithMetrics = {
  title: 'Scorecard for component:default/my_service',
  metrics: [
    {
      id: 'github.pull_requests_open_1',
      status: 'success',
      metadata: {
        title: 'GitHub open PRs',
        description:
          'Current count of open Pull Requests for a given GitHub repository.',
        type: 'number',
        history: true,
      },
      result: {
        value: 8,
        timestamp: '2025-08-08T10:00:00Z',
        thresholdResult: {
          definition: {
            type: 'DecisionTable',
            inputs: ['value'],
            rules: [
              { condition: '< 10', status: 'green', label: 'Ideal' },
              { condition: '10-50', status: 'orange', label: 'Warning' },
              { condition: '> 50', status: 'red', label: 'Critical' },
            ],
          },
          evaluation: {
            status: 'green',
            matchedRule: '< 10',
            label: 'Ideal',
          },
        },
      },
    },
    {
      id: 'jira.issues_open_1',
      status: 'success',
      metadata: {
        title: 'Jira open blocking tickets',
        description:
          'Highlights the number of critical, blocking issues that are currently open in Jira.',
        type: 'number',
        history: true,
      },
      result: {
        value: 22,
        timestamp: '2025-08-08T10:00:00Z',
        thresholdResult: {
          definition: {
            type: 'DecisionTable',
            inputs: ['value'],
            rules: [
              { condition: '< 10', status: 'green', label: 'Ideal' },
              { condition: '10-50', status: 'orange', label: 'Warning' },
              { condition: '> 50', status: 'red', label: 'Critical' },
            ],
          },
          evaluation: {
            status: 'orange',
            matchedRule: '10-50',
            label: 'Warning',
          },
        },
      },
    },
  ],
};

const mockDataEmpty = {
  title: 'Scorecard for component:default/my_service',
  metrics: [],
};

// Get the mocked function
const { fetchMockData } = require('../mockData');

describe('ScorecardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render empty state when data has no metrics', async () => {
    fetchMockData.mockResolvedValue(mockDataEmpty);

    render(<ScorecardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('scorecard-empty-state')).toBeInTheDocument();
    });
  });

  it('should render empty state when there is an error', async () => {
    fetchMockData.mockRejectedValue(new Error('Failed to fetch'));

    render(<ScorecardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('scorecard-empty-state')).toBeInTheDocument();
    });
  });

  it('should render scorecards when data is loaded successfully', async () => {
    fetchMockData.mockResolvedValue(mockDataWithMetrics);

    render(<ScorecardPage />);

    await waitFor(() => {
      expect(screen.getByText('GitHub open PRs')).toBeInTheDocument();
      expect(
        screen.getByText('Jira open blocking tickets'),
      ).toBeInTheDocument();
    });

    const scorecards = screen.getAllByTestId('scorecard-card');
    expect(scorecards).toHaveLength(2);

    expect(screen.getByText('Value: 8')).toBeInTheDocument();
    expect(screen.getByText('Value: 22')).toBeInTheDocument();
  });

  it('should render multiple scorecards with different statuses', async () => {
    const mockDataWithDifferentStatuses = {
      ...mockDataWithMetrics,
      metrics: [
        {
          ...mockDataWithMetrics.metrics[0],
          id: 'test_ideal',
          result: {
            ...mockDataWithMetrics.metrics[0].result,
            thresholdResult: {
              ...mockDataWithMetrics.metrics[0].result.thresholdResult,
              evaluation: {
                status: 'green',
                matchedRule: '< 10',
                label: 'Ideal',
              },
            },
          },
        },
        {
          ...mockDataWithMetrics.metrics[1],
          id: 'test_warning',
          result: {
            ...mockDataWithMetrics.metrics[1].result,
            thresholdResult: {
              ...mockDataWithMetrics.metrics[1].result.thresholdResult,
              evaluation: {
                status: 'orange',
                matchedRule: '10-50',
                label: 'Warning',
              },
            },
          },
        },
        {
          ...mockDataWithMetrics.metrics[0],
          id: 'test_critical',
          metadata: {
            ...mockDataWithMetrics.metrics[0].metadata,
            title: 'Critical Test',
          },
          result: {
            ...mockDataWithMetrics.metrics[0].result,
            value: 75,
            thresholdResult: {
              ...mockDataWithMetrics.metrics[0].result.thresholdResult,
              evaluation: {
                status: 'red',
                matchedRule: '> 50',
                label: 'Critical',
              },
            },
          },
        },
      ],
    };

    fetchMockData.mockResolvedValue(mockDataWithDifferentStatuses);

    render(<ScorecardPage />);

    await waitFor(() => {
      const scorecards = screen.getAllByTestId('scorecard-card');
      expect(scorecards).toHaveLength(3);
    });
  });
});
