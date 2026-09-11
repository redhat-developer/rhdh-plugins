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

import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { DataSourcesDialog } from '../DataSourcesDialog';
import type { SourceRow } from '../DataSourcesDialogColumns';
import type { ThresholdBucket } from '../types';

const mockTableProps = {
  'aria-label': 'table',
};

jest.mock('@backstage/ui', () => ({
  Dialog: ({
    isOpen,
    children,
  }: {
    isOpen: boolean;
    children: React.ReactNode;
    onOpenChange?: (open: boolean) => void;
    width?: number;
  }) =>
    isOpen ? (
      <div data-testid="dialog">{children}</div>
    ) : (
      <div data-testid="dialog-closed" />
    ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogBody: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-body">{children}</div>
  ),
  DialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-footer">{children}</div>
  ),
  Table: ({ columnConfig, ...props }: any) => (
    <div data-testid="table" data-columns={columnConfig?.length} {...props}>
      {columnConfig?.map((col: any) => (
        <span key={col.id} data-testid={`col-${col.id}`}>
          {col.label}
        </span>
      ))}
      <span data-testid="table-row-count">{props['aria-rowcount'] ?? 0}</span>
    </div>
  ),
  useTable: jest.fn(() => ({ tableProps: mockTableProps })),
  Cell: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
  CellText: ({ title }: { title: string }) => <span>{title}</span>,
  Text: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
  Flex: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Column: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Button: ({
    children,
    onPress,
  }: {
    children: React.ReactNode;
    onPress?: () => void;
    variant?: string;
  }) => (
    <button data-testid="close-button" onClick={onPress}>
      {children}
    </button>
  ),
}));

jest.mock('@mui/material/Box', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

jest.mock('@mui/material/Tooltip', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../../../hooks/useLanguage', () => ({
  useLanguage: () => 'en',
}));

jest.mock('../../../utils', () => ({
  getStatusConfig: () => ({
    color: 'success.main',
    icon: 'scorecardSuccessStatusIcon',
  }),
  getTranslatedStatus: (key: string) => key,
  getLastUpdatedLabel: () => '1 hour ago',
  extractPluginName: () => 'Sonarqube',
  resolveMetricTranslation: (
    _t: any,
    _id: string,
    _field: string,
    fallback?: string,
  ) => fallback ?? '',
}));

jest.mock('../thresholdBucketUtils', () => ({
  buildThresholdBuckets: () => [],
  MISSING_EVALUATION_BUCKET_KEY: 'noEvaluation',
  MISSING_EVALUATION_LABEL: '—',
  getMetricBucketKey: (metric: {
    result?: { thresholdResult?: { evaluation?: string | null } };
  }) => metric.result?.thresholdResult?.evaluation ?? 'noEvaluation',
  hasMetricEvaluation: (metric: {
    result?: { thresholdResult?: { evaluation?: string | null } };
  }) => Boolean(metric.result?.thresholdResult?.evaluation),
  getMetricBucketLabel: (bucketKey: string) =>
    bucketKey === 'noEvaluation' ? '—' : bucketKey,
}));

jest.mock('../StatusIcon', () => ({
  StatusIcon: ({ icon, color }: { icon: string; color: string }) => (
    <span data-testid="status-icon" data-icon={icon} data-color={color} />
  ),
}));

jest.mock('../ThresholdLegend', () => ({
  ThresholdLegend: () => <div data-testid="threshold-legend" />,
}));

jest.mock('../../Common/CardLoading', () => ({
  CardLoading: ({ dataTestId }: { dataTestId?: string }) => (
    <div data-testid={dataTestId ?? 'card-loading'} />
  ),
}));

jest.mock('@backstage/core-components', () => ({
  ResponseErrorPanel: ({ error }: { error: Error }) => (
    <div>{error.message}</div>
  ),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
);

const createSourceRow = (overrides: Partial<SourceRow> = {}): SourceRow => ({
  id: '0',
  plugin: 'Sonarqube',
  metricId: 'sonarqube.reliabilityIssues',
  metricDescription: 'Count of open bugs in SonarQube.',
  value: '8',
  evaluationKey: 'error',
  statusLabel: 'error',
  statusIcon: 'scorecardSuccessStatusIcon',
  statusColor: 'success.main',
  lastSynced: '1 hour ago',
  thresholdExpression: '>5',
  ...overrides,
});

const mockRows: SourceRow[] = [
  createSourceRow(),
  createSourceRow({
    id: '1',
    metricId: 'sonarqube.codeCoverage',
    metricDescription: 'Code coverage percentage.',
    value: '72',
    evaluationKey: 'warning',
    statusLabel: 'warning',
    thresholdExpression: '60-79',
  }),
];

const mockBuckets: ThresholdBucket[] = [
  {
    key: 'error',
    label: 'Error',
    count: 1,
    color: 'error.main',
  },
];

const defaultProps = {
  open: true,
  onClose: jest.fn(),
  title: 'Code Quality',
  rows: mockRows,
  buckets: mockBuckets,
};

describe('DataSourcesDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render dialog content when open is false', () => {
    render(<DataSourcesDialog {...defaultProps} open={false} />, {
      wrapper: TestWrapper,
    });

    expect(screen.getByTestId('dialog-closed')).toBeInTheDocument();
    expect(screen.queryByTestId('dialog-header')).not.toBeInTheDocument();
  });

  it('should render dialog with title when open is true', () => {
    render(<DataSourcesDialog {...defaultProps} />, { wrapper: TestWrapper });

    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-header')).toHaveTextContent(
      'Code Quality sources',
    );
  });

  it('should render table with correct column headers', () => {
    render(<DataSourcesDialog {...defaultProps} />, { wrapper: TestWrapper });

    expect(screen.getByTestId('col-plugin')).toHaveTextContent('PLUGIN');
    expect(screen.getByTestId('col-check')).toHaveTextContent('CHECK');
    expect(screen.getByTestId('col-value')).toHaveTextContent('VALUE');
    expect(screen.getByTestId('col-status')).toHaveTextContent('STATUS');
    expect(screen.getByTestId('col-lastSynced')).toHaveTextContent(
      'LAST SYNCED',
    );
  });

  it('should pass the provided rows through to the table', () => {
    const { useTable } = jest.requireMock('@backstage/ui');
    let capturedData: any[] = [];
    useTable.mockImplementation(({ data }: any) => {
      capturedData = data;
      return { tableProps: mockTableProps };
    });

    render(<DataSourcesDialog {...defaultProps} />, { wrapper: TestWrapper });

    expect(capturedData).toHaveLength(2);
    expect(capturedData[0].plugin).toBe('Sonarqube');
    expect(capturedData[0].metricId).toBe('sonarqube.reliabilityIssues');
    expect(capturedData[0].value).toBe('8');
    expect(capturedData[0].statusLabel).toBe('error');
    expect(capturedData[1].plugin).toBe('Sonarqube');
    expect(capturedData[1].value).toBe('72');
  });

  it('should call onClose when Close button is pressed', () => {
    const onClose = jest.fn();
    render(<DataSourcesDialog {...defaultProps} onClose={onClose} />, {
      wrapper: TestWrapper,
    });

    fireEvent.click(screen.getByTestId('close-button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should hide the threshold legend when buckets are omitted', () => {
    render(<DataSourcesDialog {...defaultProps} buckets={undefined} />, {
      wrapper: TestWrapper,
    });

    expect(screen.queryByTestId('threshold-legend')).not.toBeInTheDocument();
  });

  it('should pass collector-shaped rows through to the table', () => {
    const { useTable } = jest.requireMock('@backstage/ui');
    let capturedData: any[] = [];
    useTable.mockImplementation(({ data }: any) => {
      capturedData = data;
      return { tableProps: mockTableProps };
    });

    const collectorRows: SourceRow[] = [
      createSourceRow({
        plugin: 'GitHub',
        metricId: 'dora.changeFailureRate',
        metricDescription: 'Collects deployments from GitHub Actions.',
        value: '--',
        evaluationKey: 'noEvaluation',
        statusLabel: '-- N/A',
        statusIcon: '',
        thresholdExpression: null,
      }),
      createSourceRow({
        id: '1',
        plugin: 'Jira',
        metricId: 'dora.changeFailureRate',
        metricDescription: 'Collects Jira incidents.',
        value: '--',
        evaluationKey: 'noEvaluation',
        statusLabel: '-- N/A',
        statusIcon: '',
        thresholdExpression: null,
      }),
    ];

    render(
      <DataSourcesDialog
        {...defaultProps}
        buckets={undefined}
        rows={collectorRows}
      />,
      { wrapper: TestWrapper },
    );

    expect(capturedData).toHaveLength(2);
    expect(capturedData[0].plugin).toBe('GitHub');
    expect(capturedData[0].metricId).toBe('dora.changeFailureRate');
    expect(capturedData[0].metricDescription).toBe(
      'Collects deployments from GitHub Actions.',
    );
    expect(capturedData[0].value).toBe('--');
    expect(capturedData[0].statusLabel).toBe('-- N/A');
    expect(capturedData[1].plugin).toBe('Jira');
  });

  it('should show a loading state while rows are fetching', () => {
    render(
      <DataSourcesDialog
        {...defaultProps}
        rows={[]}
        buckets={undefined}
        isLoading
      />,
      { wrapper: TestWrapper },
    );

    expect(screen.getByTestId('data-sources-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('table')).not.toBeInTheDocument();
  });

  it('should show an error panel when rows fail to load', () => {
    render(
      <DataSourcesDialog
        {...defaultProps}
        rows={[]}
        buckets={undefined}
        error={new Error('collectors unavailable')}
      />,
      { wrapper: TestWrapper },
    );

    expect(screen.getByText('collectors unavailable')).toBeInTheDocument();
    expect(screen.queryByTestId('table')).not.toBeInTheDocument();
  });
});
