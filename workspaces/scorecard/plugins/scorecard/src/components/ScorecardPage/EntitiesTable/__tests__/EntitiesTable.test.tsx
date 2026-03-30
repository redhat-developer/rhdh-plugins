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

import { EntitiesTable } from '../EntitiesTable';

const mockT = jest.fn((key: string, params?: { count?: number }) => {
  if (
    key === 'entitiesPage.entitiesTable.titleWithCount' &&
    params?.count !== undefined
  ) {
    return `Entities (${params.count})`;
  }
  if (key === 'entitiesPage.entitiesTable.title') return 'Entities';
  return key;
});

jest.mock('../../../../hooks/useTranslation', () => ({
  useTranslation: () => ({ t: mockT }),
}));

const mockUseOwnershipEntityRefs = jest.fn();
jest.mock('../../../../hooks/useOwnershipEntityRefs', () => ({
  useOwnershipEntityRefs: () => mockUseOwnershipEntityRefs(),
}));

const mockUseAggregatedScorecardEntities = jest.fn();
jest.mock('../../../../hooks/useAggregatedScorecardEntities', () => ({
  useAggregatedScorecardEntities: (opts: any) =>
    mockUseAggregatedScorecardEntities(opts),
}));

const mockUseAggregatedScorecard = jest.fn();
jest.mock('../../../../hooks/useAggregatedScorecard', () => ({
  useAggregatedScorecard: (opts: { metricId: string }) =>
    mockUseAggregatedScorecard(opts),
}));

const mockUseEntityMetadataMap = jest.fn();
jest.mock('../../../../hooks/useEntityMetadataMap', () => ({
  useEntityMetadataMap: (entityRefs: string[]) =>
    mockUseEntityMetadataMap(entityRefs),
}));

jest.mock('../../../../utils', () => ({
  SCORECARD_ENTITIES_TABLE_HEADERS: [
    { id: 'status', label: 'Status', width: '12%', sortable: true },
    { id: 'metricValue', label: 'Value', width: '8%', sortable: false },
    { id: 'entityName', label: 'Entity', width: '28%', sortable: false },
    { id: 'owner', label: 'Owner', width: '20%', sortable: false },
    { id: 'entityKind', label: 'Kind', width: '12%', sortable: false },
    { id: 'timestamp', label: 'Updated', width: '20%', sortable: false },
  ],
}));

jest.mock('../EntitiesTableStateRow', () => ({
  EntitiesTableStateRow: (props: any) => (
    <tr
      data-testid="entities-table-state-row"
      data-loading={props.loading}
      data-error={!!props.error}
      data-no-entities={props.noEntities}
    />
  ),
}));

jest.mock('../EntitiesTableWrapper', () => ({
  EntitiesTableWrapper: ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div data-testid="entities-table-wrapper">
      <span data-testid="wrapper-title">{title}</span>
      {children}
    </div>
  ),
}));

jest.mock('../EntitiesTableHeader', () => ({
  EntitiesTableHeader: (props: any) => (
    <thead
      data-testid="entities-table-header"
      data-orderby={props.orderBy}
      data-order={props.order}
    />
  ),
}));

jest.mock('../EntitiesTableFooter', () => ({
  EntitiesTableFooter: () => <div data-testid="entities-table-footer" />,
}));

jest.mock('../EntitiesRow', () => ({
  EntitiesRow: ({ entity }: { entity: any }) => (
    <tr data-testid="entities-row" data-entity-ref={entity.entityRef} />
  ),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
);

describe('EntitiesTable', () => {
  const defaultAggregatedData = {
    metricMetadata: { title: 'Open PRs' },
    entities: [
      {
        entityRef: 'component:default/service-a',
        status: 'success',
        metricValue: 5,
      },
      {
        entityRef: 'component:default/service-b',
        status: 'warning',
        metricValue: 12,
      },
    ],
    pagination: { total: 2 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOwnershipEntityRefs.mockReturnValue({
      ownershipEntityRefs: [],
      loading: false,
    });
    mockUseEntityMetadataMap.mockReturnValue({ entityMetadataMap: {} });
    mockUseAggregatedScorecardEntities.mockReturnValue({
      aggregatedScorecardEntities: defaultAggregatedData,
      loadingData: false,
      error: undefined,
    });
    mockUseAggregatedScorecard.mockReturnValue({
      aggregatedScorecard: { metadata: { title: 'Open PRs' } },
      loadingData: false,
      error: undefined,
    });
  });

  it('should render wrapper, header, table body, and footer', () => {
    const setMetricTitle = jest.fn();

    render(
      <TestWrapper>
        <EntitiesTable
          metricId="github.open_prs"
          setMetricTitle={setMetricTitle}
        />
      </TestWrapper>,
    );

    expect(screen.getByTestId('entities-table-wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('entities-table-header')).toBeInTheDocument();
    expect(screen.getByTestId('entities-table-footer')).toBeInTheDocument();
  });

  it('should show title with count when total > 0', () => {
    render(
      <TestWrapper>
        <EntitiesTable metricId="github.open_prs" setMetricTitle={jest.fn()} />
      </TestWrapper>,
    );

    expect(screen.getByTestId('wrapper-title')).toHaveTextContent(
      'Entities (2)',
    );
  });

  it('should show title without count when total is 0', () => {
    mockUseAggregatedScorecardEntities.mockReturnValue({
      aggregatedScorecardEntities: {
        metricMetadata: {},
        entities: [],
        pagination: { total: 0 },
      },
      loadingData: false,
      error: undefined,
    });

    render(
      <TestWrapper>
        <EntitiesTable metricId="github.open_prs" setMetricTitle={jest.fn()} />
      </TestWrapper>,
    );

    expect(screen.getByTestId('wrapper-title')).toHaveTextContent('Entities');
  });

  it('should render loading spinner when loadingDataEntities is true', () => {
    mockUseAggregatedScorecardEntities.mockReturnValue({
      aggregatedScorecardEntities: undefined,
      loadingData: true,
      error: undefined,
    });

    render(
      <TestWrapper>
        <EntitiesTable metricId="github.open_prs" setMetricTitle={jest.fn()} />
      </TestWrapper>,
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render EntitiesTableStateRow with error when entitiesError is set', () => {
    mockUseAggregatedScorecardEntities.mockReturnValue({
      aggregatedScorecardEntities: undefined,
      loadingData: false,
      error: new Error('Failed to fetch'),
    });

    render(
      <TestWrapper>
        <EntitiesTable metricId="github.open_prs" setMetricTitle={jest.fn()} />
      </TestWrapper>,
    );

    const stateRow = screen.getByTestId('entities-table-state-row');
    expect(stateRow).toHaveAttribute('data-error', 'true');
  });

  it('should render EntitiesTableStateRow with noEntities when entities array is empty', () => {
    mockUseAggregatedScorecardEntities.mockReturnValue({
      aggregatedScorecardEntities: {
        metricMetadata: {},
        entities: [],
        pagination: { total: 0 },
      },
      loadingData: false,
      error: undefined,
    });

    render(
      <TestWrapper>
        <EntitiesTable metricId="github.open_prs" setMetricTitle={jest.fn()} />
      </TestWrapper>,
    );

    const stateRow = screen.getByTestId('entities-table-state-row');
    expect(stateRow).toHaveAttribute('data-no-entities', 'true');
  });

  it('should render EntitiesRow for each entity when data is loaded', () => {
    render(
      <TestWrapper>
        <EntitiesTable metricId="github.open_prs" setMetricTitle={jest.fn()} />
      </TestWrapper>,
    );

    const rows = screen.getAllByTestId('entities-row');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveAttribute(
      'data-entity-ref',
      'component:default/service-a',
    );
    expect(rows[1]).toHaveAttribute(
      'data-entity-ref',
      'component:default/service-b',
    );
  });

  it('should call useAggregatedScorecardEntities with metricId, page, pageSize, and sort state', () => {
    render(
      <TestWrapper>
        <EntitiesTable
          metricId="jira.blocking_tickets"
          setMetricTitle={jest.fn()}
        />
      </TestWrapper>,
    );

    expect(mockUseAggregatedScorecardEntities).toHaveBeenCalledWith(
      expect.objectContaining({
        metricId: 'jira.blocking_tickets',
        page: 1,
        pageSize: 5,
        ownershipEntityRefs: [],
        orderBy: null,
        order: 'asc',
        enabled: true,
      }),
    );
  });

  it('should call setMetricTitle with metric metadata title when data loads', () => {
    const setMetricTitle = jest.fn();

    render(
      <TestWrapper>
        <EntitiesTable
          metricId="github.open_prs"
          setMetricTitle={setMetricTitle}
        />
      </TestWrapper>,
    );

    expect(setMetricTitle).toHaveBeenCalledWith('Open PRs');
  });
});
