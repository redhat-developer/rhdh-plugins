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

import { act, render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { ScorecardPage } from '../ScorecardPage';

const mockUseParams = jest.fn();
jest.mock('react-router-dom', () => ({
  useParams: () => mockUseParams(),
}));

jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === 'entitiesPage.unknownMetric') return 'Unknown metric';
      return key;
    },
  }),
}));

jest.mock('@backstage/core-components', () => ({
  Page: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page">{children}</div>
  ),
  Content: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="content">{children}</div>
  ),
}));

const mockScorecardPageHeader = jest.fn();
jest.mock('../ScorecardPageHeader', () => ({
  ScorecardPageHeader: (props: { title: string }) => {
    mockScorecardPageHeader(props);
    return <div data-testid="scorecard-page-header">{props.title}</div>;
  },
}));

const mockEntitiesTable = jest.fn();
jest.mock('../EntitiesTable/EntitiesTable', () => ({
  EntitiesTable: (props: {
    metricId?: string;
    setMetricTitle: (title: string) => void;
  }) => {
    mockEntitiesTable(props);
    return (
      <div data-testid="entities-table" data-metric-id={props.metricId}>
        <button
          type="button"
          onClick={() => props.setMetricTitle('Metric Title from Table')}
        >
          Set title
        </button>
      </div>
    );
  },
}));

const mockScorecardHomepageCard = jest.fn();
jest.mock('../../ScorecardHomepageSection/ScorecardHomepageCard', () => ({
  ScorecardHomepageCard: (props: {
    metricId: string;
    showSubheader: boolean;
    showInfo: boolean;
  }) => {
    mockScorecardHomepageCard(props);
    return (
      <div
        data-testid="scorecard-homepage-card"
        data-show-subheader={props.showSubheader}
        data-show-info={props.showInfo}
      >
        {props.metricId}
      </div>
    );
  },
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
);

describe('ScorecardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render page structure with header, content, table and scorecard card', () => {
    mockUseParams.mockReturnValue({ metricId: 'github.open_prs' });

    render(<ScorecardPage />, { wrapper: TestWrapper });

    expect(screen.getByTestId('page')).toBeInTheDocument();
    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(screen.getByTestId('scorecard-page-header')).toBeInTheDocument();
    expect(screen.getByTestId('entities-table')).toBeInTheDocument();
    expect(screen.getByTestId('scorecard-homepage-card')).toBeInTheDocument();
  });

  it('should pass metricId to header when metricTitle is empty', () => {
    mockUseParams.mockReturnValue({ metricId: 'github.open_prs' });

    render(<ScorecardPage />, { wrapper: TestWrapper });

    expect(mockScorecardPageHeader).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'github.open_prs' }),
    );
  });

  it('should show Unknown metric in header when metricId is undefined', () => {
    mockUseParams.mockReturnValue({ metricId: undefined });

    render(<ScorecardPage />, { wrapper: TestWrapper });

    expect(mockScorecardPageHeader).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Unknown metric' }),
    );
  });

  it('should pass metricId and setMetricTitle to EntitiesTable', () => {
    mockUseParams.mockReturnValue({ metricId: 'jira.blocking_tickets' });

    render(<ScorecardPage />, { wrapper: TestWrapper });

    expect(mockEntitiesTable).toHaveBeenCalledWith(
      expect.objectContaining({
        metricId: 'jira.blocking_tickets',
        setMetricTitle: expect.any(Function),
      }),
    );
  });

  it('should pass metricId, showSubheader false, and showInfo false to ScorecardHomepageCard', () => {
    mockUseParams.mockReturnValue({ metricId: 'github.open_prs' });

    render(<ScorecardPage />, { wrapper: TestWrapper });

    expect(mockScorecardHomepageCard).toHaveBeenCalledWith({
      metricId: 'github.open_prs',
      showSubheader: false,
      showInfo: false,
    });
  });

  it('should update header title when setMetricTitle is called from EntitiesTable', () => {
    mockUseParams.mockReturnValue({ metricId: 'github.open_prs' });

    render(<ScorecardPage />, { wrapper: TestWrapper });

    expect(mockScorecardPageHeader).toHaveBeenLastCalledWith(
      expect.objectContaining({ title: 'github.open_prs' }),
    );

    act(() => {
      screen.getByRole('button', { name: 'Set title' }).click();
    });

    expect(mockScorecardPageHeader).toHaveBeenLastCalledWith(
      expect.objectContaining({ title: 'Metric Title from Table' }),
    );
  });
});
