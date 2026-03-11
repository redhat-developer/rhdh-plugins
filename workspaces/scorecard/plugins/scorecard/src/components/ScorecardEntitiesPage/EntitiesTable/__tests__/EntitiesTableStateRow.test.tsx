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

import { EntitiesTableStateRow } from '../EntitiesTableStateRow';

const mockT = jest.fn((key: string, params?: { metricId?: string }) => {
  if (key === 'entitiesPage.missingPermission') return 'Missing permission';
  if (key === 'entitiesPage.noDataFound') return 'No data found';
  if (key === 'entitiesPage.metricProviderNotRegistered' && params?.metricId)
    return `Metric provider ${params.metricId} not registered`;
  return key;
});

jest.mock('../../../../hooks/useTranslation', () => ({
  useTranslation: () => ({ t: mockT }),
}));

const mockUseMetric = jest.fn();
jest.mock('../../../../hooks/useMetric', () => ({
  useMetric: (opts: { metricId: string }) => mockUseMetric(opts),
}));

const mockUseMetricDisplayLabels = jest.fn();
jest.mock('../../../../hooks/useMetricDisplayLabels', () => ({
  useMetricDisplayLabels: (metric: any) => mockUseMetricDisplayLabels(metric),
}));

jest.mock('@backstage/core-components', () => ({
  WarningPanel: ({ title, message }: { title: string; message?: string }) => (
    <div data-testid="warning-panel">
      <span data-testid="warning-title">{title}</span>
      {message && <span data-testid="warning-message">{message}</span>}
    </div>
  ),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={createTheme()}>
    <table>
      <tbody>{children}</tbody>
    </table>
  </ThemeProvider>
);

describe('EntitiesTableStateRow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMetric.mockReturnValue({
      metric: { id: 'github.open_prs', title: 'Open PRs' },
    });
    mockUseMetricDisplayLabels.mockReturnValue({
      title: 'Open PRs',
      description: '',
    });
  });

  it('should render missing permission text when error contains NotAllowedError', () => {
    render(
      <TestWrapper>
        <EntitiesTableStateRow
          colSpan={6}
          error={new Error('NotAllowedError: missing permission')}
        />
      </TestWrapper>,
    );

    expect(screen.getByText('Missing permission')).toBeInTheDocument();
  });

  it('should render no data found when noEntities is true and no error', () => {
    render(
      <TestWrapper>
        <EntitiesTableStateRow colSpan={6} noEntities />
      </TestWrapper>,
    );

    expect(screen.getByText('No data found')).toBeInTheDocument();
  });

  it('should render WarningPanel when error contains NotFoundError', () => {
    render(
      <TestWrapper>
        <EntitiesTableStateRow
          colSpan={6}
          error={new Error('NotFoundError: Metric not found')}
          metricId="unknown.metric"
        />
      </TestWrapper>,
    );

    expect(screen.getByTestId('warning-panel')).toBeInTheDocument();
    expect(screen.getByTestId('warning-title')).toHaveTextContent(
      'Metric provider unknown.metric not registered',
    );
    expect(screen.getByTestId('warning-message')).toHaveTextContent(
      'NotFoundError: Metric not found',
    );
  });

  it('should call setMetricTitle when metric title is resolved', () => {
    const setMetricTitle = jest.fn();
    mockUseMetricDisplayLabels.mockReturnValue({
      title: 'Resolved Metric Title',
      description: '',
    });

    render(
      <TestWrapper>
        <EntitiesTableStateRow
          colSpan={6}
          metricId="github.open_prs"
          setMetricTitle={setMetricTitle}
        />
      </TestWrapper>,
    );

    expect(setMetricTitle).toHaveBeenCalledWith('Resolved Metric Title');
  });

  it('should render single cell with colSpan', () => {
    const { container } = render(
      <TestWrapper>
        <EntitiesTableStateRow colSpan={6} />
      </TestWrapper>,
    );

    const cell = container.querySelector('td[colspan="6"]');
    expect(cell).toBeInTheDocument();
  });
});
