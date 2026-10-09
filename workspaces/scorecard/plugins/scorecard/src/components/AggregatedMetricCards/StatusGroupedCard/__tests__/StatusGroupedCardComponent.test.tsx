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
import { aggregationTypes } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import { mockAggregatedScorecardData } from '../../../../../__fixtures__/scorecardData';
import { StatusGroupedCardComponent } from '../StatusGroupedCardComponent';
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
    <div data-testid="status-grouped-menu">
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
    buckets,
  }: {
    rows: Array<{
      plugin?: string;
      metricDescription?: string;
      value?: string;
      statusLabel?: string;
    }>;
    buckets?: unknown[];
  }) => (
    <div data-testid="data-sources-dialog">
      <span data-testid="dialog-check">{rows[0]?.metricDescription ?? ''}</span>
      <span data-testid="dialog-value">{rows[0]?.value ?? ''}</span>
      <span data-testid="dialog-status">{rows[0]?.statusLabel ?? ''}</span>
      <span data-testid="dialog-legend">{String(Boolean(buckets))}</span>
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

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
  </BrowserRouter>
);

describe('StatusGroupedCardComponent data sources', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useMetricCollectorsMock.mockReturnValue({
      data: [],
      isLoading: false,
      error: undefined,
    });
  });

  it('shows the metric check description and N/A for value and status', () => {
    const scorecard =
      mockAggregatedScorecardData[aggregationTypes.statusGrouped];

    render(
      <StatusGroupedCardComponent
        scorecard={scorecard as any}
        aggregationId="openPrsKpi"
        cardTitle="GitHub Open PRs KPI"
        description="Distribution of open PRs across owned repositories."
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
      'Distribution of open PRs across owned repositories.',
    );
    expect(screen.getByTestId('dialog-value')).toHaveTextContent('N/A');
    expect(screen.getByTestId('dialog-status')).toHaveTextContent('N/A');
    expect(screen.getByTestId('dialog-legend')).toHaveTextContent('false');
    expect(useMetricCollectorsMock).toHaveBeenCalledWith(
      'github.openPRs',
      true,
    );
  });

  it('lists collectors for composite metrics that are not sparklines', () => {
    useMetricCollectorsMock.mockReturnValue({
      data: doraCollectors,
      isLoading: false,
      error: undefined,
    });

    const scorecard = {
      ...mockAggregatedScorecardData[aggregationTypes.statusGrouped],
      id: 'dora.changeFailureRate',
    };

    render(
      <StatusGroupedCardComponent
        scorecard={scorecard as any}
        aggregationId="doraCfrKpi"
        cardTitle="DORA Change Failure Rate"
        description="Distribution of change failure rate across owned services."
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
