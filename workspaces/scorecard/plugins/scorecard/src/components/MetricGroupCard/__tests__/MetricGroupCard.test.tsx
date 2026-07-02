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

import { MetricGroupCard } from '../MetricGroupCard';
import type { ThresholdBucket } from '../types';

const mockBuckets: ThresholdBucket[] = [
  {
    key: 'success',
    label: 'Passing',
    expression: '<1',
    count: 3,
    color: 'success.main',
  },
  {
    key: 'warning',
    label: 'Warning',
    expression: '1-5',
    count: 2,
    color: 'warning.main',
  },
  {
    key: 'error',
    label: 'Failing',
    expression: '>5',
    count: 1,
    color: 'error.main',
  },
];

jest.mock('../thresholdBucketUtils', () => ({
  buildThresholdBuckets: jest.fn(() => mockBuckets),
}));

jest.mock('../ThresholdBucketTile', () => ({
  ThresholdBucketTile: ({
    bucket,
    onClick,
  }: {
    bucket: ThresholdBucket;
    onClick?: () => void;
  }) => (
    <div
      data-testid={`tile-${bucket.key}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={onClick}
    >
      {bucket.label} ({bucket.count})
    </div>
  ),
}));

jest.mock('../MetricGroupCardMenu', () => ({
  MetricGroupCardMenu: ({
    actions,
  }: {
    actions: Array<{ id: string; label: string; onClick: () => void }>;
  }) => (
    <div data-testid="metric-group-card-menu">
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

jest.mock('../DataSourcesDialog', () => ({
  DataSourcesDialog: ({
    open,
    title,
    initialFilters,
  }: {
    open: boolean;
    onClose: () => void;
    title: string;
    metrics: MetricResult[];
    initialFilters?: string[];
  }) => (
    <div data-testid="data-sources-dialog">
      <span data-testid="dialog-open">{String(open)}</span>
      <span data-testid="dialog-title">{title}</span>
      <span data-testid="dialog-filters">{JSON.stringify(initialFilters)}</span>
    </div>
  ),
}));

jest.mock('../../Common/CardWrapper', () => ({
  CardWrapper: ({
    title,
    description,
    children,
    info,
  }: {
    title: string;
    description?: string;
    children: React.ReactNode;
    info?: React.ReactNode;
  }) => (
    <div data-testid="card-wrapper">
      <span data-testid="card-title">{title}</span>
      {description && <span data-testid="card-description">{description}</span>}
      <div data-testid="card-info">{info}</div>
      <div data-testid="card-children">{children}</div>
    </div>
  ),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={createTheme()}>{children}</ThemeProvider>
);

const mockMetric: MetricResult = {
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
};

describe('MetricGroupCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render title and description in CardWrapper', () => {
    render(
      <MetricGroupCard
        title="Code Quality"
        description="Overall code health"
        metrics={[mockMetric]}
      />,
      { wrapper: TestWrapper },
    );

    expect(screen.getByTestId('card-title')).toHaveTextContent('Code Quality');
    expect(screen.getByTestId('card-description')).toHaveTextContent(
      'Overall code health',
    );
  });

  it('should render ThresholdBucketTile for each bucket', () => {
    render(<MetricGroupCard title="Code Quality" metrics={[mockMetric]} />, {
      wrapper: TestWrapper,
    });

    expect(screen.getByTestId('tile-success')).toBeInTheDocument();
    expect(screen.getByTestId('tile-warning')).toBeInTheDocument();
    expect(screen.getByTestId('tile-error')).toBeInTheDocument();
  });

  it('should open DataSourcesDialog when menu "View data sources" is clicked', () => {
    render(<MetricGroupCard title="Code Quality" metrics={[mockMetric]} />, {
      wrapper: TestWrapper,
    });

    expect(screen.queryByTestId('data-sources-dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('menu-action-view-data-sources'));

    expect(screen.getByTestId('data-sources-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-filters')).toHaveTextContent('[]');
  });

  it('should open DataSourcesDialog with filter when a tile is clicked', () => {
    render(<MetricGroupCard title="Code Quality" metrics={[mockMetric]} />, {
      wrapper: TestWrapper,
    });

    expect(screen.queryByTestId('data-sources-dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('tile-warning'));

    expect(screen.getByTestId('data-sources-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-filters')).toHaveTextContent(
      '["warning"]',
    );
  });

  it('should adapt grid columns to min(buckets.length, 3)', () => {
    const { container } = render(
      <MetricGroupCard title="Code Quality" metrics={[mockMetric]} />,
      { wrapper: TestWrapper },
    );

    const grid = container.querySelector('[data-testid="card-children"] > div');
    expect(grid).toHaveStyle({ gridTemplateColumns: 'repeat(3, 1fr)' });
  });
});
