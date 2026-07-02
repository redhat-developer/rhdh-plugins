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
import type { MetricResult } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import { DataSourcesDialog } from '../DataSourcesDialog';

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
}));

jest.mock('../StatusIcon', () => ({
  StatusIcon: ({ icon, color }: { icon: string; color: string }) => (
    <span data-testid="status-icon" data-icon={icon} data-color={color} />
  ),
}));

jest.mock('../ThresholdLegend', () => ({
  ThresholdLegend: () => <div data-testid="threshold-legend" />,
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
);

const mockMetrics: MetricResult[] = [
  {
    id: 'sonarqube.reliability_issues',
    status: 'success',
    metadata: {
      title: 'SonarQube Reliability Issues',
      description: 'Count of open bugs in SonarQube.',
      type: 'number',
      history: true,
    },
    result: {
      value: 8,
      timestamp: '2026-07-01T08:29:09.683Z',
      thresholdResult: {
        definition: {
          rules: [
            { key: 'success', expression: '<1' },
            { key: 'warning', expression: '1-5' },
            { key: 'error', expression: '>5' },
          ],
        },
        status: 'success',
        evaluation: 'error',
      },
    },
  },
  {
    id: 'sonarqube.code_coverage',
    status: 'success',
    metadata: {
      title: 'SonarQube Code Coverage',
      description: 'Code coverage percentage.',
      type: 'number',
      history: true,
    },
    result: {
      value: 72,
      timestamp: '2026-07-01T08:29:09.683Z',
      thresholdResult: {
        definition: {
          rules: [
            { key: 'success', expression: '>=80' },
            { key: 'warning', expression: '60-79' },
            { key: 'error', expression: '<60' },
          ],
        },
        status: 'success',
        evaluation: 'warning',
      },
    },
  },
];

const defaultProps = {
  open: true,
  onClose: jest.fn(),
  title: 'Code Quality',
  metrics: mockMetrics,
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

  it('should render metric rows with plugin name, check title, value, status', () => {
    const { useTable } = jest.requireMock('@backstage/ui');
    let capturedData: any[] = [];
    useTable.mockImplementation(({ data }: any) => {
      capturedData = data;
      return { tableProps: mockTableProps };
    });

    render(<DataSourcesDialog {...defaultProps} />, { wrapper: TestWrapper });

    expect(capturedData).toHaveLength(2);
    expect(capturedData[0].plugin).toBe('Sonarqube');
    expect(capturedData[0].checkTitle).toBe('sonarqube.reliability_issues');
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

  it("should show '—' for null/undefined values", () => {
    const metricsWithNull: MetricResult[] = [
      {
        id: 'sonarqube.null_metric',
        status: 'error',
        metadata: {
          title: 'Null Metric',
          description: 'A metric with no result value.',
          type: 'number',
          history: false,
        },
        result: {
          value: null as unknown as number,
          timestamp: '2026-07-01T08:29:09.683Z',
          thresholdResult: {
            definition: { rules: [{ key: 'success', expression: '<1' }] },
            status: 'success',
            evaluation: null as unknown as string,
          },
        },
      },
    ];

    const { useTable } = jest.requireMock('@backstage/ui');
    let capturedData: any[] = [];
    useTable.mockImplementation(({ data }: any) => {
      capturedData = data;
      return { tableProps: mockTableProps };
    });

    render(<DataSourcesDialog {...defaultProps} metrics={metricsWithNull} />, {
      wrapper: TestWrapper,
    });

    expect(capturedData[0].value).toBe('—');
    expect(capturedData[0].statusLabel).toBe('—');
  });
});
