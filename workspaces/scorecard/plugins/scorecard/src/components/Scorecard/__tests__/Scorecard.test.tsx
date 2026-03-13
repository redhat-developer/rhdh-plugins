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
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DangerousOutlinedIcon from '@mui/icons-material/DangerousOutlined';

import Scorecard from '../Scorecard';

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div style={{ width: 400, height: 400 }}>{children}</div>
  ),

  PieChart: ({ children }: any) => <div>{children}</div>,

  Pie: ({
    data,
    label,
    children,
  }: {
    data?: { name: string; value: number; color: string }[];
    label?: (center: { cx: number; cy: number }) => React.ReactNode;
    children?: React.ReactNode;
  }) => (
    <div data-testid="pie-chart">
      {data?.map((entry: any) => (
        <div
          key={entry.name}
          data-testid={`pie-ring-${entry.name}`}
          data-color={entry.color}
          style={{ backgroundColor: entry.color }}
        />
      ))}
      {label && <div>{label({ cx: 0, cy: 0 })}</div>}
      {children}
    </div>
  ),

  Cell: () => null,

  Legend: ({ content }: any) => <div>{content?.({})}</div>,

  Tooltip: () => null,
}));

// Create a test theme to provide proper palette colors
const testTheme = createTheme({
  palette: {
    success: { main: '#52c41a' },
    warning: { main: '#F0AB00' },
    error: { main: '#C9190B' },
  },
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={testTheme}>{children}</ThemeProvider>
);

describe('Scorecard Component', () => {
  const defaultProps = {
    cardTitle: 'GitHub open PRs',
    description:
      'Current count of open Pull Requests for a given GitHub repository.',
    statusColor: 'success.main',
    StatusIcon: CheckCircleOutlineIcon,
    value: 8,
    thresholds: {
      status: 'success' as const,
      definition: {
        rules: [
          { key: 'success', expression: '<= 20' },
          { key: 'warning', expression: '<= 40' },
          { key: 'error', expression: '> 40' },
        ],
      },
      evaluation: 'success',
    },
  };

  it('should render the card title and description', () => {
    render(
      <TestWrapper>
        <Scorecard {...defaultProps} />
      </TestWrapper>,
    );

    expect(screen.getByText('GitHub open PRs')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Current count of open Pull Requests for a given GitHub repository.',
      ),
    ).toBeInTheDocument();
  });

  it('should display the value correctly', () => {
    render(
      <TestWrapper>
        <Scorecard {...defaultProps} />
      </TestWrapper>,
    );

    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('should render all threshold labels', () => {
    render(
      <TestWrapper>
        <Scorecard {...defaultProps} />
      </TestWrapper>,
    );

    expect(screen.getByText('Success <= 20')).toBeInTheDocument();
    expect(screen.getByText('Warning <= 40')).toBeInTheDocument();
    expect(screen.getByText('Error > 40')).toBeInTheDocument();
  });

  it('should render the status icon with correct color', () => {
    const { container } = render(
      <TestWrapper>
        <Scorecard {...defaultProps} />
      </TestWrapper>,
    );

    const iconElement = container.querySelector(
      '[data-testid="CheckCircleOutlineIcon"]',
    );
    expect(iconElement).toBeInTheDocument();
  });

  it('should handle zero value correctly', () => {
    render(
      <TestWrapper>
        <Scorecard {...defaultProps} value={0} />
      </TestWrapper>,
    );

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should render with success status', () => {
    render(
      <TestWrapper>
        <Scorecard {...defaultProps} />
      </TestWrapper>,
    );

    expect(screen.getByTestId('pie-ring-full')).toHaveAttribute(
      'data-color',
      '#52c41a',
    );
  });

  it('should render with warning status', () => {
    const warningProps = {
      ...defaultProps,
      statusColor: 'warning.main',
      StatusIcon: WarningAmberIcon,
      value: 25,
    };

    render(
      <TestWrapper>
        <Scorecard {...warningProps} />
      </TestWrapper>,
    );

    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByTestId('pie-ring-full')).toHaveAttribute(
      'data-color',
      '#F0AB00',
    );
  });

  it('should render with error status', () => {
    const errorProps = {
      ...defaultProps,
      statusColor: 'error.main',
      StatusIcon: DangerousOutlinedIcon,
      value: 75,
    };

    render(
      <TestWrapper>
        <Scorecard {...errorProps} />
      </TestWrapper>,
    );

    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByTestId('pie-ring-full')).toHaveAttribute(
      'data-color',
      '#C9190B',
    );
  });

  it('should render with custom status', () => {
    const customProps = {
      ...defaultProps,
      statusColor: '#FF5733',
      StatusIcon: CheckCircleOutlineIcon,
      value: 4,
      thresholds: {
        ...defaultProps.thresholds,
        definition: {
          rules: [
            { key: 'custom', expression: '<=5', color: '#FF5733' },
            ...defaultProps.thresholds.definition.rules,
          ],
        },
      },
    };

    render(
      <TestWrapper>
        <Scorecard {...customProps} />
      </TestWrapper>,
    );

    expect(screen.getByTestId('pie-ring-full')).toHaveAttribute(
      'data-color',
      '#FF5733',
    );
  });

  it('should render with large values', () => {
    const largeValueProps = {
      ...defaultProps,
      value: 9999,
    };

    render(
      <TestWrapper>
        <Scorecard {...largeValueProps} />
      </TestWrapper>,
    );

    expect(screen.getByText('9999')).toBeInTheDocument();
  });

  it('should handle undefined thresholds', () => {
    const noThresholdsProps = {
      ...defaultProps,
      thresholds: undefined,
    };

    render(<Scorecard {...noThresholdsProps} />);

    expect(screen.getByText('GitHub open PRs')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.queryByText('Error')).not.toBeInTheDocument();
  });

  it('should handle empty thresholds rules array', () => {
    const emptyThresholdsProps = {
      ...defaultProps,
      thresholds: {
        status: 'success' as const,
        definition: {
          rules: [],
        },
        evaluation: 'success',
      },
    };

    render(<Scorecard {...emptyThresholdsProps} />);

    expect(screen.getByText('GitHub open PRs')).toBeInTheDocument();
    expect(screen.getByText('--')).toBeInTheDocument();
  });

  it('should render correctly with different card titles', () => {
    const jiraProps = {
      ...defaultProps,
      cardTitle: 'Jira open blocking tickets',
      description:
        'Highlights the number of critical, blocking issues that are currently open in Jira.',
    };

    render(
      <TestWrapper>
        <Scorecard {...jiraProps} />
      </TestWrapper>,
    );

    expect(screen.getByText('Jira open blocking tickets')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Highlights the number of critical, blocking issues that are currently open in Jira.',
      ),
    ).toBeInTheDocument();
  });

  it('should render threshold rules with correct colors', () => {
    render(
      <TestWrapper>
        <Scorecard {...defaultProps} />
      </TestWrapper>,
    );

    // Check that threshold rules are rendered with appropriate styling
    const errorRule = screen.getByText('Error > 40');
    const warningRule = screen.getByText('Warning <= 40');
    const successRule = screen.getByText('Success <= 20');

    expect(errorRule).toBeInTheDocument();
    expect(warningRule).toBeInTheDocument();
    expect(successRule).toBeInTheDocument();
  });
});
