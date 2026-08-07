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
import { ScorecardEntityContentGridView } from '../ScorecardEntityContentGridView';
import { mockScorecardSuccessData } from '../../../../__fixtures__/scorecardData';
import { useScorecards } from '../../../hooks/useScorecards';
import { getStatusConfig } from '../../../utils';

jest.mock('@backstage/core-components', () => ({
  ResponseErrorPanel: ({ error }: { error: Error }) => (
    <div data-testid="error-panel">{error.message}</div>
  ),
}));

jest.mock('../../Common/NoScorecardsState', () => {
  return function MockNoScorecardsState() {
    return <div data-testid="no-scorecards-state">Empty State</div>;
  };
});

jest.mock('../../Common/PermissionRequiredState', () => {
  return function MockPermissionRequiredState() {
    return (
      <div data-testid="permission-required-state">Permission Required</div>
    );
  };
});

jest.mock('../Scorecard', () => {
  return function MockScorecard({
    cardTitle,
    description,
    value,
    statusColor,
    statusIcon,
    thresholds,
    isThresholdError,
    thresholdError,
    isMetricDataError,
    metricDataError,
  }: any) {
    return (
      <div
        data-testid="scorecard-card"
        data-title={cardTitle}
        data-value={value}
        data-status-color={statusColor}
        data-threshold-error={isThresholdError}
        data-metric-error={isMetricDataError}
      >
        <h3>{cardTitle}</h3>
        <p>{description}</p>
        <span>Value: {value}</span>
        <span>Status: {statusColor}</span>
        {statusIcon && <span data-testid="status-icon">Status Icon</span>}
        {thresholds && <span data-testid="thresholds">Thresholds</span>}
        {isThresholdError && (
          <span data-testid="threshold-error">
            Threshold Error: {thresholdError}
          </span>
        )}
        {isMetricDataError && (
          <span data-testid="metric-error">
            Metric Error: {metricDataError}
          </span>
        )}
      </div>
    );
  };
});

jest.mock('../EntityScorecardContent', () => ({
  EntityScorecardContent: () => (
    <div data-testid="entity-scorecard-content">EntityScorecardContent</div>
  ),
}));

jest.mock('../../MetricGroupCard', () => ({
  MetricGroupCard: ({
    title,
    description,
    metrics,
  }: {
    title: string;
    description?: string;
    metrics: any[];
  }) => (
    <div data-testid="metric-group-card" data-title={title}>
      <span data-testid="group-title">{title}</span>
      {description && (
        <span data-testid="group-description">{description}</span>
      )}
      <span data-testid="group-metric-count">{metrics.length}</span>
      {metrics.map((m: any) => (
        <span key={m.id} data-testid={`group-metric-${m.id}`}>
          {m.id}
        </span>
      ))}
    </div>
  ),
}));

jest.mock('../../../hooks/useScorecards', () => ({
  useScorecards: jest.fn(),
}));

jest.mock('../../../utils', () => ({
  getStatusConfig: jest.fn(),
  resolveMetricTranslation: jest.fn(
    (_t: any, _metricId: string, _field: string, fallback?: string) =>
      fallback ?? `metric.${_metricId}.${_field}`,
  ),
}));

jest.mock('../../../utils/statusUtils', () => ({
  hasMetricDataError: jest.fn(() => false),
  hasThresholdError: jest.fn(() => false),
}));

const useScorecardsMock = useScorecards as jest.Mock;
const getStatusConfigMock = getStatusConfig as jest.Mock;

describe('ScorecardEntityContentGridView', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    getStatusConfigMock.mockReturnValue({
      color: 'green',
      icon: 'CheckCircleIcon',
    });
  });

  it('should render loading state when data is loading', () => {
    useScorecardsMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
    });

    render(<ScorecardEntityContentGridView groups={{}} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render permission required state for NotAllowedError', () => {
    useScorecardsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error(
        'Failed to fetch scorecards: 403 Forbidden. {"error":{"name":"NotAllowedError"}}',
      ),
    });

    render(<ScorecardEntityContentGridView groups={{}} />);

    expect(screen.getByTestId('permission-required-state')).toBeInTheDocument();
  });

  it('should render error panel for non-permission errors', () => {
    useScorecardsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
    });

    render(<ScorecardEntityContentGridView groups={{}} />);

    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('should render empty state when scorecards is empty', () => {
    useScorecardsMock.mockReturnValue({
      data: [],
      isLoading: false,
      error: undefined,
    });

    render(<ScorecardEntityContentGridView groups={{}} />);

    expect(screen.getByTestId('no-scorecards-state')).toBeInTheDocument();
  });

  it('should render empty state when scorecards is null', () => {
    useScorecardsMock.mockReturnValue({
      data: null,
      isLoading: false,
      error: undefined,
    });

    render(<ScorecardEntityContentGridView groups={{}} />);

    expect(screen.getByTestId('no-scorecards-state')).toBeInTheDocument();
  });

  it('should fall back to EntityScorecardContent when groups is empty', () => {
    useScorecardsMock.mockReturnValue({
      data: mockScorecardSuccessData,
      isLoading: false,
      error: undefined,
    });

    render(<ScorecardEntityContentGridView groups={{}} />);

    expect(screen.getByTestId('entity-scorecard-content')).toBeInTheDocument();
  });

  it('should fall back to EntityScorecardContent when groups is undefined', () => {
    useScorecardsMock.mockReturnValue({
      data: mockScorecardSuccessData,
      isLoading: false,
      error: undefined,
    });

    render(<ScorecardEntityContentGridView groups={undefined as any} />);

    expect(screen.getByTestId('entity-scorecard-content')).toBeInTheDocument();
  });

  it('should render MetricGroupCard for each non-empty group', async () => {
    useScorecardsMock.mockReturnValue({
      data: mockScorecardSuccessData,
      isLoading: false,
      error: undefined,
    });

    const groups = {
      codeQuality: {
        title: 'Code Quality',
        description: 'Code quality metrics',
        metrics: ['github.openPRs'],
      },
      operations: {
        title: 'Operations',
        metrics: ['jira.openIssues'],
      },
    };

    render(<ScorecardEntityContentGridView groups={groups} />);

    await waitFor(() => {
      const groupCards = screen.getAllByTestId('metric-group-card');
      expect(groupCards).toHaveLength(2);
    });

    expect(screen.getByText('Code Quality')).toBeInTheDocument();
    expect(screen.getByText('Operations')).toBeInTheDocument();
    expect(
      screen.getByTestId('group-metric-github.openPRs'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('group-metric-jira.openIssues'),
    ).toBeInTheDocument();
  });

  it('should skip groups where no metrics match', () => {
    useScorecardsMock.mockReturnValue({
      data: mockScorecardSuccessData,
      isLoading: false,
      error: undefined,
    });

    const groups = {
      codeQuality: {
        title: 'Code Quality',
        metrics: ['github.openPRs'],
      },
      nonExistent: {
        title: 'Non Existent',
        metrics: ['does.not.exist', 'also.missing'],
      },
    };

    render(<ScorecardEntityContentGridView groups={groups} />);

    const groupCards = screen.getAllByTestId('metric-group-card');
    expect(groupCards).toHaveLength(1);
    expect(screen.getByText('Code Quality')).toBeInTheDocument();
    expect(screen.queryByText('Non Existent')).not.toBeInTheDocument();
  });

  it('should render ungrouped metrics as individual Scorecard cards', async () => {
    useScorecardsMock.mockReturnValue({
      data: mockScorecardSuccessData,
      isLoading: false,
      error: undefined,
    });

    const groups = {
      codeQuality: {
        title: 'Code Quality',
        metrics: ['github.openPRs'],
      },
    };

    render(<ScorecardEntityContentGridView groups={groups} />);

    await waitFor(() => {
      expect(screen.getByTestId('metric-group-card')).toBeInTheDocument();
    });

    const scorecardCards = screen.getAllByTestId('scorecard-card');
    expect(scorecardCards).toHaveLength(1);
    expect(scorecardCards[0]).toHaveAttribute(
      'data-title',
      'Jira open blocking tickets',
    );
  });

  it('should render all metrics as ungrouped when no metric IDs match any group', () => {
    useScorecardsMock.mockReturnValue({
      data: mockScorecardSuccessData,
      isLoading: false,
      error: undefined,
    });

    const groups = {
      empty: {
        title: 'Empty Group',
        metrics: ['nonexistent.metric'],
      },
    };

    render(<ScorecardEntityContentGridView groups={groups} />);

    expect(screen.queryByTestId('metric-group-card')).not.toBeInTheDocument();
    const scorecardCards = screen.getAllByTestId('scorecard-card');
    expect(scorecardCards).toHaveLength(2);
  });

  it('should pass group description to MetricGroupCard', () => {
    useScorecardsMock.mockReturnValue({
      data: mockScorecardSuccessData,
      isLoading: false,
      error: undefined,
    });

    const groups = {
      codeQuality: {
        title: 'Code Quality',
        description: 'All code quality metrics',
        metrics: ['github.openPRs'],
      },
    };

    render(<ScorecardEntityContentGridView groups={groups} />);

    expect(screen.getByText('All code quality metrics')).toBeInTheDocument();
  });

  it('should preserve metric order within a group as defined in config', () => {
    const threeMetrics = [
      ...mockScorecardSuccessData,
      {
        id: 'sonar.coverage',
        status: 'success' as const,
        metadata: {
          title: 'Code Coverage',
          description: 'Coverage percentage',
          type: 'number',
          history: true,
        },
        result: {
          value: 85,
          timestamp: '2025-08-08T10:00:00Z',
          thresholdResult: {
            definition: {
              rules: [{ key: 'success', expression: '>= 80' }],
            },
            status: 'success' as const,
            evaluation: 'success',
          },
        },
      },
    ];

    useScorecardsMock.mockReturnValue({
      data: threeMetrics,
      isLoading: false,
      error: undefined,
    });

    const groups = {
      ordered: {
        title: 'Ordered Group',
        metrics: ['sonar.coverage', 'github.openPRs'],
      },
    };

    render(<ScorecardEntityContentGridView groups={groups} />);

    const groupCard = screen.getByTestId('metric-group-card');
    expect(groupCard).toBeInTheDocument();

    const metricIds = Array.from(
      groupCard.querySelectorAll('[data-testid^="group-metric-"]'),
    )
      .map(el => el.getAttribute('data-testid')!)
      .filter(id => id !== 'group-metric-count');
    expect(metricIds).toEqual([
      'group-metric-sonar.coverage',
      'group-metric-github.openPRs',
    ]);
  });

  it('should call getStatusConfig for each ungrouped metric', () => {
    useScorecardsMock.mockReturnValue({
      data: mockScorecardSuccessData,
      isLoading: false,
      error: undefined,
    });

    const groups = {
      codeQuality: {
        title: 'Code Quality',
        metrics: ['github.openPRs'],
      },
    };

    render(<ScorecardEntityContentGridView groups={groups} />);

    expect(getStatusConfigMock).toHaveBeenCalledTimes(1);
    expect(getStatusConfigMock).toHaveBeenCalledWith({
      evaluation: mockScorecardSuccessData[1].result.thresholdResult.evaluation,
      thresholdStatus:
        mockScorecardSuccessData[1].result.thresholdResult.status,
      metricStatus: mockScorecardSuccessData[1].status,
      thresholdRules:
        mockScorecardSuccessData[1].result.thresholdResult.definition?.rules,
    });
  });

  it('should render both group cards and ungrouped cards in Masonry layout', () => {
    useScorecardsMock.mockReturnValue({
      data: mockScorecardSuccessData,
      isLoading: false,
      error: undefined,
    });

    const groups = {
      prs: {
        title: 'Pull Requests',
        metrics: ['github.openPRs'],
      },
    };

    render(<ScorecardEntityContentGridView groups={groups} />);

    expect(screen.getByTestId('metric-group-card')).toBeInTheDocument();
    expect(screen.getAllByTestId('scorecard-card')).toHaveLength(1);
  });
});
