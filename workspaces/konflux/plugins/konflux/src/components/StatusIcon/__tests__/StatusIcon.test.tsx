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
import {
  StatusIcon,
  StatusIconWithText,
  runStatusToRunStatus,
} from '../StatusIcon';
import { runStatus } from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { RunStatus } from '@patternfly/react-topology';

jest.mock('@patternfly/react-topology', () => ({
  ...jest.requireActual('@patternfly/react-topology'),
  StatusIcon: jest.fn(({ status, ...props }) => (
    <div data-testid="pf-status-icon" data-status={status} {...props}>
      PF StatusIcon: {status}
    </div>
  )),
  getRunStatusModifier: jest.fn(status => `modifier-${status}`),
}));

jest.mock('@patternfly/react-icons', () => ({
  ExclamationTriangleIcon: jest.fn(props => (
    <svg data-testid="exclamation-triangle-icon" {...props}>
      ExclamationTriangleIcon
    </svg>
  )),
}));

describe('StatusIcon', () => {
  describe('runStatusToRunStatus', () => {
    it('should convert Succeeded to RunStatus.Succeeded', () => {
      expect(runStatusToRunStatus(runStatus.Succeeded)).toBe(
        RunStatus.Succeeded,
      );
    });

    it('should convert Failed to RunStatus.Failed', () => {
      expect(runStatusToRunStatus(runStatus.Failed)).toBe(RunStatus.Failed);
    });

    it('should convert Running to RunStatus.Running', () => {
      expect(runStatusToRunStatus(runStatus.Running)).toBe(RunStatus.Running);
    });

    it('should convert In Progress to RunStatus.InProgress', () => {
      expect(runStatusToRunStatus(runStatus['In Progress'])).toBe(
        RunStatus.InProgress,
      );
    });

    it('should convert FailedToStart to RunStatus.FailedToStart', () => {
      expect(runStatusToRunStatus(runStatus.FailedToStart)).toBe(
        RunStatus.FailedToStart,
      );
    });

    it('should convert PipelineNotStarted to RunStatus.FailedToStart', () => {
      expect(runStatusToRunStatus(runStatus.PipelineNotStarted)).toBe(
        RunStatus.FailedToStart,
      );
    });

    it('should convert Skipped to RunStatus.Skipped', () => {
      expect(runStatusToRunStatus(runStatus.Skipped)).toBe(RunStatus.Skipped);
    });

    it('should convert Cancelled to RunStatus.Cancelled', () => {
      expect(runStatusToRunStatus(runStatus.Cancelled)).toBe(
        RunStatus.Cancelled,
      );
    });

    it('should convert Cancelling to RunStatus.Cancelled', () => {
      expect(runStatusToRunStatus(runStatus.Cancelling)).toBe(
        RunStatus.Cancelled,
      );
    });

    it('should convert TestFailed to RunStatus.Cancelled', () => {
      expect(runStatusToRunStatus(runStatus.TestFailed)).toBe(
        RunStatus.Cancelled,
      );
    });

    it('should convert TestWarning to RunStatus.Cancelled', () => {
      expect(runStatusToRunStatus(runStatus.TestWarning)).toBe(
        RunStatus.Cancelled,
      );
    });

    it('should convert Pending to RunStatus.Pending', () => {
      expect(runStatusToRunStatus(runStatus.Pending)).toBe(RunStatus.Pending);
    });

    it('should convert Idle to RunStatus.Idle', () => {
      expect(runStatusToRunStatus(runStatus.Idle)).toBe(RunStatus.Idle);
    });

    it('should convert Unknown to RunStatus.Pending (default)', () => {
      expect(runStatusToRunStatus(runStatus.Unknown)).toBe(RunStatus.Pending);
    });
  });

  describe('StatusIcon', () => {
    it('should render PfStatusIcon for Succeeded status', () => {
      render(<StatusIcon status={runStatus.Succeeded} />);

      expect(screen.getByTestId('pf-status-icon')).toBeInTheDocument();
      expect(screen.getByTestId('pf-status-icon')).toHaveAttribute(
        'data-status',
        RunStatus.Succeeded,
      );
    });

    it('should render PfStatusIcon for Failed status', () => {
      render(<StatusIcon status={runStatus.Failed} />);

      expect(screen.getByTestId('pf-status-icon')).toBeInTheDocument();
      expect(screen.getByTestId('pf-status-icon')).toHaveAttribute(
        'data-status',
        RunStatus.Failed,
      );
    });

    it('should render ExclamationTriangleIcon for Cancelling status', () => {
      render(<StatusIcon status={runStatus.Cancelling} />);

      expect(
        screen.getByTestId('exclamation-triangle-icon'),
      ).toBeInTheDocument();
      expect(screen.queryByTestId('pf-status-icon')).not.toBeInTheDocument();
    });

    it('should pass props to PfStatusIcon', () => {
      render(
        <StatusIcon status={runStatus.Succeeded} height={20} width={20} />,
      );

      const icon = screen.getByTestId('pf-status-icon');
      expect(icon).toHaveAttribute('height', '20');
      expect(icon).toHaveAttribute('width', '20');
    });

    it('should pass props to ExclamationTriangleIcon for Cancelling status', () => {
      render(
        <StatusIcon status={runStatus.Cancelling} height={20} width={20} />,
      );

      const icon = screen.getByTestId('exclamation-triangle-icon');
      expect(icon).toHaveAttribute('height', '20');
      expect(icon).toHaveAttribute('width', '20');
    });

    it('should render PfStatusIcon for Running status', () => {
      render(<StatusIcon status={runStatus.Running} />);

      expect(screen.getByTestId('pf-status-icon')).toBeInTheDocument();
      expect(screen.getByTestId('pf-status-icon')).toHaveAttribute(
        'data-status',
        RunStatus.Running,
      );
    });

    it('should render PfStatusIcon for Pending status', () => {
      render(<StatusIcon status={runStatus.Pending} />);

      expect(screen.getByTestId('pf-status-icon')).toBeInTheDocument();
      expect(screen.getByTestId('pf-status-icon')).toHaveAttribute(
        'data-status',
        RunStatus.Pending,
      );
    });
  });

  describe('StatusIconWithText', () => {
    it('should render StatusIcon and status text when text is not provided', () => {
      render(<StatusIconWithText status={runStatus.Succeeded} />);

      expect(screen.getByTestId('pf-status-icon')).toBeInTheDocument();
      expect(screen.getByText(runStatus.Succeeded)).toBeInTheDocument();
    });

    it('should render StatusIcon and custom text when text is provided', () => {
      render(
        <StatusIconWithText status={runStatus.Succeeded} text="Custom Text" />,
      );

      expect(screen.getByTestId('pf-status-icon')).toBeInTheDocument();
      expect(screen.getByText('Custom Text')).toBeInTheDocument();
      expect(screen.queryByText(runStatus.Succeeded)).not.toBeInTheDocument();
    });

    it('should render ExclamationTriangleIcon for Cancelling status', () => {
      render(<StatusIconWithText status={runStatus.Cancelling} />);

      expect(
        screen.getByTestId('exclamation-triangle-icon'),
      ).toBeInTheDocument();
      expect(screen.getByText(runStatus.Cancelling)).toBeInTheDocument();
    });

    it('should apply dataTestAttribute to text Typography', () => {
      render(
        <StatusIconWithText
          status={runStatus.Succeeded}
          dataTestAttribute="custom-test-id"
        />,
      );

      const textElement = screen.getByText(runStatus.Succeeded);
      expect(textElement).toHaveAttribute('data-test', 'custom-test-id');
    });

    it('should pass props to StatusIcon', () => {
      render(
        <StatusIconWithText
          status={runStatus.Succeeded}
          height={20}
          width={20}
        />,
      );

      const icon = screen.getByTestId('pf-status-icon');
      expect(icon).toHaveAttribute('height', '20');
      expect(icon).toHaveAttribute('width', '20');
    });

    it('should render with Failed status', () => {
      render(<StatusIconWithText status={runStatus.Failed} text="Failed" />);

      expect(screen.getByTestId('pf-status-icon')).toBeInTheDocument();
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });

    it('should render with Running status', () => {
      render(<StatusIconWithText status={runStatus.Running} text="Running" />);

      expect(screen.getByTestId('pf-status-icon')).toBeInTheDocument();
      expect(screen.getByText('Running')).toBeInTheDocument();
    });
  });
});
