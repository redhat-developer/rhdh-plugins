/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/License-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import {
  aggregationTypes,
  type AggregatedMetricResult,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import { WeightedStatusScoreCardComponent } from '../WeightedStatusScoreCardComponent';
import { useMetricCollectors } from '../../../../hooks/useMetricCollectors';

jest.mock('../../../../hooks/useLanguage', () => ({
  useLanguage: () => 'en',
}));

jest.mock('../../../../hooks/useMetricCollectors', () => ({
  useMetricCollectors: jest.fn(),
}));

jest.mock('../../../DataSources/CardActionsMenu', () => ({
  CardActionsMenu: ({
    actions,
  }: {
    actions: Array<{ id: string; label: string; onClick: () => void }>;
  }) => (
    <div data-testid="weighted-menu">
      {actions.map(action => (
        <button
          key={action.id}
          data-testid={`menu-action-${action.id}`}
          onClick={action.onClick}
        >
          {action.label}
        </button>
      ))}
    </div>
  ),
}));

jest.mock('../../../DataSources/DataSourcesDialog', () => ({
  DataSourcesDialog: ({
    rows,
  }: {
    rows: Array<{
      plugin?: string;
      metricDescription?: string;
      value?: string;
      statusLabel?: string;
    }>;
  }) => (
    <div data-testid="data-sources-dialog">
      <span data-testid="dialog-check">{rows[0]?.metricDescription ?? ''}</span>
      <span data-testid="dialog-value">{rows[0]?.value ?? ''}</span>
      <span data-testid="dialog-status">{rows[0]?.statusLabel ?? ''}</span>
      <span data-testid="dialog-collectors">
        {rows.map(row => row.plugin).join(',')}
      </span>
    </div>
  ),
}));

const doraCollectors = [
  {
    id: 'github:doraDeploymentWorkflowRuns',
    description: 'Collects deployments from GitHub Actions.',
  },
  {
    id: 'jira:doraIncidents',
    description: 'Collects Jira incidents.',
  },
];

jest.mock('../../../ScorecardHomepageSection/ResponsivePieChart', () => ({
  ResponsivePieChart: () => <div data-testid="responsive-pie-chart" />,
}));

const useMetricCollectorsMock = useMetricCollectors as jest.Mock;

/** Aggregation KPI thresholds (0–100), including custom colors. */
const weightedKpiThresholds = {
  rules: [
    { key: 'success', expression: '>=80', color: '#6bb300' },
    { key: 'warning', expression: '30-80', color: 'rgb(224, 189, 108)' },
    { key: 'error', expression: '<30', color: '#be1ec7' },
  ],
};

const scorecard: AggregatedMetricResult = {
  id: 'github.openPRs',
  status: 'success',
  metadata: {
    title: 'GitHub Open PRs weighted health',
    description: 'Weighted health score for owned repositories.',
    type: 'number',
    history: true,
    aggregationType: aggregationTypes.weightedStatusScore,
  },
  result: {
    values: [
      { count: 5, name: 'success' },
      { count: 2, name: 'warning' },
      { count: 1, name: 'error' },
    ],
    total: 8,
    timestamp: '2024-01-01T00:00:00Z',
    thresholds: weightedKpiThresholds,
    entitiesConsidered: 8,
    calculationErrorCount: 0,
    weightedStatusScore: 75,
    weightedStatusSum: 18,
    weightedStatusMaxPossible: 24,
    aggregationChartDisplayColor: 'rgb(224, 189, 108)',
  },
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
  </BrowserRouter>
);

describe('WeightedStatusScoreCardComponent data sources', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useMetricCollectorsMock.mockReturnValue({
      data: [],
      isLoading: false,
      error: undefined,
    });
  });

  it('shows the metric check description, percent value, and aggregation KPI status', () => {
    render(
      <WeightedStatusScoreCardComponent
        scorecard={scorecard as any}
        aggregationId="openPrsWeightedKpi"
        cardTitle="GitHub Open PRs weighted health"
        description="Weighted health score for owned repositories."
      />,
      { wrapper: TestWrapper },
    );

    expect(useMetricCollectorsMock).toHaveBeenCalledWith(
      'github.openPRs',
      false,
    );

    fireEvent.click(screen.getByTestId('menu-action-view-data-sources'));

    expect(screen.getByTestId('dialog-check')).toHaveTextContent(
      'Current count of open Pull Requests for a given GitHub repository.',
    );
    expect(screen.getByTestId('dialog-check')).not.toHaveTextContent(
      'Weighted health score for owned repositories.',
    );
    expect(screen.getByTestId('dialog-value')).toHaveTextContent('75%');
    expect(screen.getByTestId('dialog-status')).toHaveTextContent('Warning');
    expect(screen.getByTestId('dialog-status')).not.toHaveTextContent('Error');
    expect(screen.getByTestId('dialog-status')).not.toHaveTextContent('N/A');
    expect(useMetricCollectorsMock).toHaveBeenCalledWith(
      'github.openPRs',
      true,
    );
  });

  it('shows aggregation status even when the chart color does not match KPI rule colors', () => {
    render(
      <WeightedStatusScoreCardComponent
        scorecard={
          {
            ...scorecard,
            result: {
              ...scorecard.result,
              aggregationChartDisplayColor: '#FFC0CB',
            },
          } as any
        }
        aggregationId="openPrsWeightedKpi"
        cardTitle="GitHub Open PRs weighted health"
        description="Weighted health score for owned repositories."
      />,
      { wrapper: TestWrapper },
    );

    fireEvent.click(screen.getByTestId('menu-action-view-data-sources'));

    expect(screen.getByTestId('dialog-status')).toHaveTextContent('Warning');
    expect(screen.getByTestId('dialog-status')).not.toHaveTextContent('N/A');
  });

  it('lists collectors for composite metrics that are not sparklines', () => {
    useMetricCollectorsMock.mockReturnValue({
      data: doraCollectors,
      isLoading: false,
      error: undefined,
    });

    render(
      <WeightedStatusScoreCardComponent
        scorecard={
          {
            ...scorecard,
            id: 'dora.changeFailureRate',
          } as any
        }
        aggregationId="doraCfrKpi"
        cardTitle="DORA Change Failure Rate"
        description="Weighted health for change failure rate."
      />,
      { wrapper: TestWrapper },
    );

    fireEvent.click(screen.getByTestId('menu-action-view-data-sources'));

    expect(screen.getByTestId('dialog-collectors')).toHaveTextContent(
      'GitHub,Jira',
    );
    expect(useMetricCollectorsMock).toHaveBeenCalledWith(
      'dora.changeFailureRate',
      true,
    );
  });
});
