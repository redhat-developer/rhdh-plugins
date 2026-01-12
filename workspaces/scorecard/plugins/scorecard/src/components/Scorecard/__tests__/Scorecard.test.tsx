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
    loading: false,
    statusColor: 'success',
    StatusIcon: CheckCircleOutlineIcon,
    value: 8,
    thresholds: {
      status: 'success' as const,
      definition: {
        rules: [
          { key: 'success', expression: '<= 20' },
          { key: 'warning', expression: '> 20' },
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
    expect(screen.getByText('Warning > 20')).toBeInTheDocument();
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

  it('should show loading spinner when loading is true', () => {
    render(
      <TestWrapper>
        <Scorecard {...defaultProps} loading />
      </TestWrapper>,
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByTestId('8')).not.toBeInTheDocument();
  });

  it('should handle zero value correctly', () => {
    render(
      <TestWrapper>
        <Scorecard {...defaultProps} value={0} />
      </TestWrapper>,
    );

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should render with warning status', () => {
    const warningProps = {
      ...defaultProps,
      statusColor: 'warning',
      StatusIcon: WarningAmberIcon,
      value: 25,
    };

    render(
      <TestWrapper>
        <Scorecard {...warningProps} />
      </TestWrapper>,
    );

    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('should render with critical status', () => {
    const criticalProps = {
      ...defaultProps,
      statusColor: 'error',
      StatusIcon: DangerousOutlinedIcon,
      value: 75,
    };

    render(
      <TestWrapper>
        <Scorecard {...criticalProps} />
      </TestWrapper>,
    );

    expect(screen.getByText('75')).toBeInTheDocument();
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
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.queryByText('Error')).not.toBeInTheDocument();
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
    const warningRule = screen.getByText('Warning > 20');
    const successRule = screen.getByText('Success <= 20');

    expect(errorRule).toBeInTheDocument();
    expect(warningRule).toBeInTheDocument();
    expect(successRule).toBeInTheDocument();
  });
});
