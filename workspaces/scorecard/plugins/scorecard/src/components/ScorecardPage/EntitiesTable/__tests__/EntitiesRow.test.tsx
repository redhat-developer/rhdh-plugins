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

import { EntitiesRow } from '../EntitiesRow';

jest.mock('../../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      key === 'entitiesPage.entitiesTable.unavailable' ? 'Unavailable' : key,
  }),
}));

jest.mock('../../../../hooks/useLanguage', () => ({
  useLanguage: () => 'en',
}));

jest.mock('../cells/MetricStatusCell', () => ({
  MetricStatusCell: ({ status }: { status: string }) => (
    <span data-testid="metric-status-cell">{status}</span>
  ),
}));

jest.mock('../cells/OwnerCell', () => ({
  OwnerCell: ({ ownerRef }: { ownerRef?: string }) => (
    <span data-testid="owner-cell">{ownerRef ?? '--'}</span>
  ),
}));

jest.mock('../cells/EntityNameCell', () => ({
  EntityNameCell: ({
    entityRef,
    entityMetadata,
  }: {
    entityRef: string;
    entityMetadata?: any;
  }) => (
    <span data-testid="entity-name-cell" data-entity-ref={entityRef}>
      {entityMetadata?.title ?? entityRef}
    </span>
  ),
}));

jest.mock('../../../../utils', () => ({
  getLastUpdatedLabel: () => 'Last updated label',
  getThresholdRuleColor: () => undefined,
  SCORECARD_ERROR_STATE_COLOR: '#ccc',
}));

jest.mock('../../../../hooks/useAggregatedScorecard', () => ({
  useAggregatedScorecard: jest.fn().mockReturnValue({
    aggregatedScorecard: undefined,
    loadingData: false,
    error: undefined,
  }),
}));

const theme = createTheme();
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>
    <table>
      <tbody>{children}</tbody>
    </table>
  </ThemeProvider>
);

describe('EntitiesRow', () => {
  const defaultEntity = {
    entityRef: 'component:default/my-service',
    status: 'success',
    metricValue: 5,
    owner: 'group:default/team-a',
    entityKind: 'Component',
    timestamp: '2026-03-10T12:00:00Z',
  };

  const defaultEntityMetadataMap = {
    'component:default/my-service': { title: 'My Service', kind: 'Component' },
  };

  it('should render all row cells with entity data', () => {
    render(
      <TestWrapper>
        <EntitiesRow
          entity={defaultEntity}
          entityMetadataMap={defaultEntityMetadataMap}
          thresholdRules={[]}
        />
      </TestWrapper>,
    );

    expect(screen.getByTestId('metric-status-cell')).toHaveTextContent(
      'success',
    );
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByTestId('entity-name-cell')).toHaveAttribute(
      'data-entity-ref',
      'component:default/my-service',
    );
    expect(screen.getByTestId('entity-name-cell')).toHaveTextContent(
      'My Service',
    );
    expect(screen.getByTestId('owner-cell')).toHaveTextContent(
      'group:default/team-a',
    );
    expect(screen.getByText('Component')).toBeInTheDocument();
    expect(screen.getByText('Last updated label')).toBeInTheDocument();
  });

  it('should show Unavailable when metricValue is null/undefined', () => {
    render(
      <TestWrapper>
        <EntitiesRow
          entity={{ ...defaultEntity, metricValue: undefined }}
          entityMetadataMap={{}}
          thresholdRules={[]}
        />
      </TestWrapper>,
    );

    expect(screen.getByText('Unavailable')).toBeInTheDocument();
  });

  it('should show metricValue 0 when entity has metricValue 0', () => {
    render(
      <TestWrapper>
        <EntitiesRow
          entity={{ ...defaultEntity, metricValue: 0 }}
          entityMetadataMap={{}}
          thresholdRules={[]}
        />
      </TestWrapper>,
    );

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should pass entityMetadata from map to EntityNameCell', () => {
    render(
      <TestWrapper>
        <EntitiesRow
          entity={defaultEntity}
          entityMetadataMap={defaultEntityMetadataMap}
          thresholdRules={[]}
        />
      </TestWrapper>,
    );

    expect(screen.getByTestId('entity-name-cell')).toHaveTextContent(
      'My Service',
    );
  });
});
