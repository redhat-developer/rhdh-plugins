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
import type { MetricResult } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import { mockT } from '../../../test-utils/mockTranslations';
import {
  buildColumnConfig,
  formatMetricValue,
  sortSourceRows,
  type SourceRow,
} from '../DataSourcesDialogColumns';

jest.mock('@backstage/ui', () => ({
  Cell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="cell">{children}</div>
  ),
  CellText: ({ title }: { title: string }) => (
    <span data-testid="cell-text">{title}</span>
  ),
  Text: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
  Flex: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Column: ({
    children,
    id,
    isRowHeader,
  }: {
    children: React.ReactNode;
    id?: string;
    isRowHeader?: boolean;
  }) => (
    <div data-testid={`column-${id}`} data-row-header={String(!!isRowHeader)}>
      {children}
    </div>
  ),
}));

jest.mock('@mui/material/Tooltip', () => ({
  __esModule: true,
  default: ({
    children,
    title,
  }: {
    children: React.ReactNode;
    title?: string;
  }) => (
    <div data-testid="tooltip" data-title={title ?? ''}>
      {children}
    </div>
  ),
}));

jest.mock('../StatusIcon', () => ({
  StatusIcon: ({ icon, color }: { icon: string; color: string }) => (
    <span data-testid="status-icon" data-icon={icon} data-color={color} />
  ),
}));

jest.mock('../thresholdBucketUtils', () => ({
  MISSING_EVALUATION_LABEL: '—',
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
);

function createRow(overrides: Partial<SourceRow> = {}): SourceRow {
  return {
    id: '0',
    plugin: 'Sonarqube',
    metricId: 'sonarqube.codeCoverage',
    metricDescription: 'Overall code coverage percentage in SonarQube.',
    value: '10',
    evaluationKey: 'success',
    statusLabel: 'Success',
    statusIcon: 'scorecardSuccessStatusIcon',
    statusColor: 'success.main',
    lastSynced: '1 hour ago',
    thresholdExpression: '<1',
    ...overrides,
  };
}

describe('formatMetricValue', () => {
  const createResult = (
    value: MetricResult['result']['value'],
  ): MetricResult['result'] => ({
    value,
    timestamp: '2026-07-01T00:00:00.000Z',
    thresholdResult: {
      status: 'success',
      definition: { rules: [] },
      evaluation: null,
    },
  });

  it('should return dash for null value', () => {
    expect(formatMetricValue(createResult(null))).toBe('—');
  });

  it('should return dash for undefined result', () => {
    expect(formatMetricValue(undefined)).toBe('—');
  });

  it('should stringify numeric values', () => {
    expect(formatMetricValue(createResult(12.5))).toBe('12.5');
  });

  it('should stringify boolean values', () => {
    expect(formatMetricValue(createResult(true))).toBe('true');
  });
});

describe('sortSourceRows', () => {
  const rows = [
    createRow({ id: '1', plugin: 'Jira', value: '5', metricId: 'b.check' }),
    createRow({
      id: '2',
      plugin: 'Github',
      value: '20',
      metricId: 'a.check',
    }),
    createRow({
      id: '3',
      plugin: 'Sonarqube',
      value: '—',
      metricId: 'c.check',
    }),
  ];

  it('should sort by plugin ascending', () => {
    const result = sortSourceRows(rows, {
      column: 'plugin',
      direction: 'ascending',
    });
    expect(result.map(r => r.plugin)).toEqual(['Github', 'Jira', 'Sonarqube']);
  });

  it('should sort by plugin descending', () => {
    const result = sortSourceRows(rows, {
      column: 'plugin',
      direction: 'descending',
    });
    expect(result.map(r => r.plugin)).toEqual(['Sonarqube', 'Jira', 'Github']);
  });

  it('should sort numeric values ascending and keep non-numeric last', () => {
    const result = sortSourceRows(rows, {
      column: 'value',
      direction: 'ascending',
    });
    expect(result.map(r => r.value)).toEqual(['5', '20', '—']);
  });

  it('should sort numeric values descending with non-numeric first', () => {
    const result = sortSourceRows(rows, {
      column: 'value',
      direction: 'descending',
    });
    // Non-numeric values sort ahead of numbers when direction is descending.
    expect(result.map(r => r.value)).toEqual(['—', '20', '5']);
  });

  it('should sort by check title via check column id', () => {
    const result = sortSourceRows(rows, {
      column: 'check',
      direction: 'ascending',
    });
    expect(result.map(r => r.metricId)).toEqual([
      'a.check',
      'b.check',
      'c.check',
    ]);
  });

  it('should not mutate the original array', () => {
    const original = [...rows];
    sortSourceRows(rows, { column: 'plugin', direction: 'ascending' });
    expect(rows).toEqual(original);
  });

  it('should fall back to plugin when column is unknown', () => {
    const result = sortSourceRows(rows, {
      column: 'unknown',
      direction: 'ascending',
    });
    expect(result.map(r => r.plugin)).toEqual(['Github', 'Jira', 'Sonarqube']);
  });
});

describe('buildColumnConfig', () => {
  it('should build all expected columns', () => {
    const columns = buildColumnConfig(mockT as any);
    expect(columns.map(c => c.id)).toEqual([
      'plugin',
      'check',
      'value',
      'status',
      'lastSynced',
    ]);
  });

  it('should mark check as row header and all columns sortable', () => {
    const columns = buildColumnConfig(mockT as any);
    expect(columns.find(c => c.id === 'check')?.isRowHeader).toBe(true);
    expect(columns.every(c => c.isSortable)).toBe(true);
  });

  it('should render sortable column headers', () => {
    const columns = buildColumnConfig(mockT as any);
    const pluginHeader = columns.find(c => c.id === 'plugin')?.header;
    expect(pluginHeader).toBeDefined();

    render(<>{pluginHeader!()}</>, { wrapper: TestWrapper });
    expect(screen.getByTestId('column-plugin')).toBeInTheDocument();
    expect(screen.getByText('PLUGIN')).toBeInTheDocument();
  });

  it('should render metric cell with id and description', () => {
    const columns = buildColumnConfig(mockT as any);
    const checkCell = columns.find(c => c.id === 'check')?.cell;
    const row = createRow();

    render(<>{checkCell!(row)}</>, { wrapper: TestWrapper });
    expect(screen.getByText(row.metricId)).toBeInTheDocument();
    expect(screen.getByText(row.metricDescription)).toBeInTheDocument();
  });

  it('should render plugin/value/lastSynced cells via CellText', () => {
    const columns = buildColumnConfig(mockT as any);
    const row = createRow();

    render(
      <>
        {columns.find(c => c.id === 'plugin')!.cell!(row)}
        {columns.find(c => c.id === 'value')!.cell!(row)}
        {columns.find(c => c.id === 'lastSynced')!.cell!(row)}
      </>,
      { wrapper: TestWrapper },
    );

    expect(screen.getByText('Sonarqube')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('1 hour ago')).toBeInTheDocument();
  });

  it('should render status cell with icon, label, and tooltip', () => {
    const columns = buildColumnConfig(mockT as any);
    const statusCell = columns.find(c => c.id === 'status')?.cell;
    const row = createRow({
      thresholdExpression: '>7',
      evaluationKey: 'error',
      statusLabel: 'Error',
      statusIcon: 'scorecardErrorStatusIcon',
      statusColor: 'error.main',
      value: '12',
      unit: undefined,
    });

    render(<>{statusCell!(row)}</>, { wrapper: TestWrapper });

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByTestId('status-icon')).toHaveAttribute(
      'data-icon',
      'scorecardErrorStatusIcon',
    );
    expect(screen.getByTestId('tooltip').getAttribute('data-title')).toBe(
      'Value 12 matches threshold Error >7',
    );
  });

  it('should append unit to threshold expressions in the status tooltip', () => {
    const columns = buildColumnConfig(mockT as any);
    const statusCell = columns.find(c => c.id === 'status')?.cell;
    const row = createRow({
      thresholdExpression: '<=10',
      evaluationKey: 'success',
      statusLabel: 'Success',
      value: '5',
      unit: 'h',
    });

    render(<>{statusCell!(row)}</>, { wrapper: TestWrapper });

    expect(screen.getByTestId('tooltip').getAttribute('data-title')).toBe(
      'Value 5 matches threshold Success <=10 h',
    );
  });

  it('should render status cell without tooltip when expression is missing', () => {
    const columns = buildColumnConfig(mockT as any);
    const statusCell = columns.find(c => c.id === 'status')?.cell;
    const row = createRow({
      thresholdExpression: null,
      evaluationKey: 'noEvaluation',
      statusLabel: '—',
    });

    render(<>{statusCell!(row)}</>, { wrapper: TestWrapper });

    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toHaveAttribute('data-title', '');
  });
});
