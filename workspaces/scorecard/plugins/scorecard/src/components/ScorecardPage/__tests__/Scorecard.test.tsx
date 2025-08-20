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
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DangerousOutlinedIcon from '@mui/icons-material/DangerousOutlined';

import Scorecard from '../Scorecard';

// Mock the PatternFly ChartDonut component
jest.mock('@patternfly/react-charts/victory', () => ({
  ChartDonut: ({ data, colorScale, height, width }: any) => (
    <div
      data-testid="chart-donut"
      data-value={data[0]?.y}
      data-color={colorScale[0]}
      data-height={height}
      data-width={width}
    >
      Mocked ChartDonut
    </div>
  ),
}));

describe('Scorecard Component', () => {
  const defaultProps = {
    key: 'github.pull_requests_open',
    cardTitle: 'GitHub open PRs',
    description:
      'Current count of open Pull Requests for a given GitHub repository.',
    loading: false,
    statusColor: 'green',
    StatusIcon: CheckCircleOutlineIcon,
    value: 8,
    thresholds: [
      { key: 'error', expression: '> 40' },
      { key: 'warning', expression: '> 20' },
      { key: 'success', expression: '<= 20' },
    ],
  };

  it('should render the card title and description', () => {
    render(<Scorecard {...defaultProps} />);

    expect(screen.getByText('GitHub open PRs')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Current count of open Pull Requests for a given GitHub repository.',
      ),
    ).toBeInTheDocument();
  });

  it('should display the value correctly', () => {
    render(<Scorecard {...defaultProps} />);

    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('should render all threshold labels', () => {
    render(<Scorecard {...defaultProps} />);

    expect(screen.getByText('success <= 20')).toBeInTheDocument();
    expect(screen.getByText('warning > 20')).toBeInTheDocument();
    expect(screen.getByText('error > 40')).toBeInTheDocument();
  });

  it('should render the status icon with correct color', () => {
    const { container } = render(<Scorecard {...defaultProps} />);

    const iconElement = container.querySelector(
      '[data-testid="CheckCircleOutlineIcon"]',
    );
    expect(iconElement).toBeInTheDocument();
  });

  it('should show loading spinner when loading is true', () => {
    render(<Scorecard {...defaultProps} loading />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByTestId('chart-donut')).not.toBeInTheDocument();
  });

  it('should render chart donut when not loading', () => {
    render(<Scorecard {...defaultProps} />);

    const chartDonut = screen.getByTestId('chart-donut');
    expect(chartDonut).toBeInTheDocument();
    expect(chartDonut).toHaveAttribute('data-value', '8');
    expect(chartDonut).toHaveAttribute('data-color', 'green');
    expect(chartDonut).toHaveAttribute('data-height', '200');
    expect(chartDonut).toHaveAttribute('data-width', '200');
  });

  it('should handle zero value correctly in chart data', () => {
    render(<Scorecard {...defaultProps} value={0} />);

    const chartDonut = screen.getByTestId('chart-donut');
    expect(chartDonut).toHaveAttribute('data-value', '1');
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should render with warning status', () => {
    const warningProps = {
      ...defaultProps,
      statusColor: '#F0AB00',
      StatusIcon: WarningAmberIcon,
      value: 25,
    };

    render(<Scorecard {...warningProps} />);

    expect(screen.getByText('25')).toBeInTheDocument();
    const chartDonut = screen.getByTestId('chart-donut');
    expect(chartDonut).toHaveAttribute('data-color', '#F0AB00');
  });

  it('should render with critical status', () => {
    const criticalProps = {
      ...defaultProps,
      statusColor: '#C9190B',
      StatusIcon: DangerousOutlinedIcon,
      value: 75,
    };

    render(<Scorecard {...criticalProps} />);

    expect(screen.getByText('75')).toBeInTheDocument();
    const chartDonut = screen.getByTestId('chart-donut');
    expect(chartDonut).toHaveAttribute('data-color', '#C9190B');
  });

  it('should render with large values', () => {
    const largeValueProps = {
      ...defaultProps,
      value: 9999,
    };

    render(<Scorecard {...largeValueProps} />);

    expect(screen.getByText('9999')).toBeInTheDocument();
    const chartDonut = screen.getByTestId('chart-donut');
    expect(chartDonut).toHaveAttribute('data-value', '9999');
  });

  it('should handle empty thresholds array', () => {
    const emptyThresholdsProps = {
      ...defaultProps,
      thresholds: [],
    };

    render(<Scorecard {...emptyThresholdsProps} />);

    expect(screen.getByText('GitHub open PRs')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.queryByText('error')).not.toBeInTheDocument();
  });

  it('should render correctly with different card titles', () => {
    const jiraProps = {
      ...defaultProps,
      cardTitle: 'Jira open blocking tickets',
      description:
        'Highlights the number of critical, blocking issues that are currently open in Jira.',
    };

    render(<Scorecard {...jiraProps} />);

    expect(screen.getByText('Jira open blocking tickets')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Highlights the number of critical, blocking issues that are currently open in Jira.',
      ),
    ).toBeInTheDocument();
  });
});
