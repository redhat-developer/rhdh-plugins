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
import { EntityScorecardContent } from '../EntityScorecardContent';

// Mock the child components
jest.mock('../NoScorecardsState', () => {
  return function MockNoScorecardsState() {
    return <div data-testid="no-scorecards-state">Empty State</div>;
  };
});

jest.mock('../Scorecard', () => {
  return function MockScorecard({
    cardTitle,
    description,
    value,
    loading,
    statusColor,
    StatusIcon,
    thresholds,
  }: any) {
    if (loading) {
      return <div data-testid="scorecard-loading">Loading...</div>;
    }
    return (
      <div
        data-testid="scorecard-card"
        data-title={cardTitle}
        data-value={value}
        data-status-color={statusColor}
      >
        <h3>{cardTitle}</h3>
        <p>{description}</p>
        <span>Value: {value}</span>
        <span>Status: {statusColor}</span>
        {StatusIcon && <span data-testid="status-icon">Status Icon</span>}
        {thresholds && <span data-testid="thresholds">Thresholds</span>}
      </div>
    );
  };
});

jest.mock('../../../hooks/useScorecards', () => ({
  useScorecards: jest.fn(),
}));

jest.mock('../../../utils/utils', () => ({
  getStatusConfig: jest.fn(),
}));

const mockDataWithMetrics = [
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
];

// Get the mocked functions
const { useScorecards } = require('../../../hooks/useScorecards');
const { getStatusConfig } = require('../../../utils/utils');

describe('EntityScorecardContent Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    getStatusConfig.mockReturnValue({
      color: 'green',
      icon: 'CheckCircleIcon',
    });
  });

  it('should render loading state when data is loading', () => {
    useScorecards.mockReturnValue({
      scorecards: undefined,
      loadingData: true,
      error: undefined,
    });

    render(<EntityScorecardContent />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render empty state when data has no metrics', async () => {
    useScorecards.mockReturnValue({
      scorecards: [],
      loadingData: false,
      error: undefined,
    });

    render(<EntityScorecardContent />);

    await waitFor(() => {
      expect(screen.getByTestId('no-scorecards-state')).toBeInTheDocument();
    });
  });

  it('should render scorecards when data is loaded successfully', async () => {
    useScorecards.mockReturnValue({
      scorecards: mockDataWithMetrics,
      loadingData: false,
      error: undefined,
    });

    render(<EntityScorecardContent />);

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

  it('should call getStatusConfig for each metric', () => {
    useScorecards.mockReturnValue({
      scorecards: mockDataWithMetrics,
      loadingData: false,
      error: undefined,
    });

    render(<EntityScorecardContent />);

    expect(getStatusConfig).toHaveBeenCalledTimes(2);
    expect(getStatusConfig).toHaveBeenCalledWith(
      mockDataWithMetrics[0].result.thresholdResult.evaluation,
    );
    expect(getStatusConfig).toHaveBeenCalledWith(
      mockDataWithMetrics[1].result.thresholdResult.evaluation,
    );
  });

  it('should render multiple scorecards with different statuses', async () => {
    const mockDataWithDifferentStatuses = [
      {
        ...mockDataWithMetrics[0],
        id: 'test_ideal',
        result: {
          ...mockDataWithMetrics[0].result,
          thresholdResult: {
            ...mockDataWithMetrics[0].result.thresholdResult,
            evaluation: {
              status: 'green',
              matchedRule: '< 10',
              label: 'Ideal',
            },
          },
        },
      },
      {
        ...mockDataWithMetrics[1],
        id: 'test_warning',
        result: {
          ...mockDataWithMetrics[1].result,
          thresholdResult: {
            ...mockDataWithMetrics[1].result.thresholdResult,
            evaluation: {
              status: 'orange',
              matchedRule: '10-50',
              label: 'Warning',
            },
          },
        },
      },
      {
        ...mockDataWithMetrics[0],
        id: 'test_critical',
        metadata: {
          ...mockDataWithMetrics[0].metadata,
          title: 'Critical Test',
        },
        result: {
          ...mockDataWithMetrics[0].result,
          value: 75,
          thresholdResult: {
            ...mockDataWithMetrics[0].result.thresholdResult,
            evaluation: {
              status: 'red',
              matchedRule: '> 50',
              label: 'Critical',
            },
          },
        },
      },
    ];

    useScorecards.mockReturnValue({
      scorecards: mockDataWithDifferentStatuses,
      loadingData: false,
      error: undefined,
    });

    render(<EntityScorecardContent />);

    await waitFor(() => {
      const scorecards = screen.getAllByTestId('scorecard-card');
      expect(scorecards).toHaveLength(3);
    });
  });

  it('should pass correct props to Scorecard component', () => {
    useScorecards.mockReturnValue({
      scorecards: [mockDataWithMetrics[0]],
      loadingData: false,
      error: undefined,
    });

    getStatusConfig.mockReturnValue({
      color: 'red',
      icon: 'ErrorIcon',
    });

    render(<EntityScorecardContent />);

    const scorecard = screen.getByTestId('scorecard-card');
    expect(scorecard).toHaveAttribute('data-title', 'GitHub open PRs');
    expect(scorecard).toHaveAttribute('data-value', '8');
    expect(scorecard).toHaveAttribute('data-status-color', 'red');
    expect(screen.getByTestId('status-icon')).toBeInTheDocument();
    expect(screen.getByTestId('thresholds')).toBeInTheDocument();
  });
});
