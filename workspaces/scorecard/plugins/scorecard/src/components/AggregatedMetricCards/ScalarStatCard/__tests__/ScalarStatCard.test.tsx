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
  DEFAULT_NUMBER_THRESHOLDS,
  type AggregatedMetricResult,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import { ScalarStatCard } from '../ScalarStatCard';
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
    <div data-testid="scalar-menu">
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
      metricDescription?: string;
      value?: string;
      statusLabel?: string;
    }>;
  }) => (
    <div data-testid="data-sources-dialog">
      <span data-testid="dialog-check">{rows[0]?.metricDescription ?? ''}</span>
      <span data-testid="dialog-value">{rows[0]?.value ?? ''}</span>
      <span data-testid="dialog-status">{rows[0]?.statusLabel ?? ''}</span>
    </div>
  ),
}));

const useMetricCollectorsMock = useMetricCollectors as jest.Mock;

const scorecard: AggregatedMetricResult = {
  id: 'github.openPRs',
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
    aggregationChartDisplayColor: 'warning.main',
  },
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
  </BrowserRouter>
);

describe('ScalarStatCard data sources', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useMetricCollectorsMock.mockReturnValue({
      data: [],
      isLoading: false,
      error: undefined,
    });
  });

  it('shows the metric check description and the aggregated value', () => {
    render(
      <ScalarStatCard
        scorecard={scorecard as any}
        aggregationId="totalCriticalPRs"
        cardTitle="Total Critical PRs"
        description="Sum of open PRs for entities in error status."
      />,
      { wrapper: TestWrapper },
    );

    fireEvent.click(screen.getByTestId('menu-action-view-data-sources'));

    expect(screen.getByTestId('dialog-check')).toHaveTextContent(
      'Current count of open Pull Requests for a given GitHub repository.',
    );
    expect(screen.getByTestId('dialog-check')).not.toHaveTextContent(
      'Sum of open PRs for entities in error status.',
    );
    expect(screen.getByTestId('dialog-value')).toHaveTextContent('12');
    expect(screen.getByTestId('dialog-status')).toHaveTextContent('Warning');
  });
});
