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

import '@testing-library/jest-dom';

import { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';

import { ProcessInstanceStatusDTO } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { VALUE_UNAVAILABLE } from '../../constants';
import { useWorkflowInstanceStateColors } from '../../hooks/useWorkflowInstanceStatusColors';
import { WorkflowInstanceStatusIndicator } from './WorkflowInstanceStatusIndicator';

jest.mock('@backstage/core-components', () => ({
  Link: ({ to, children }: { to: string; children: ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        'table.status.running': 'Running',
        'table.status.completed': 'Completed',
        'tooltips.suspended': 'Suspended',
        'table.status.aborted': 'Aborted',
        'table.status.failed': 'Failed',
        'table.status.pending': 'Pending',
      })[key] ?? key,
  }),
}));

jest.mock('../../hooks/useWorkflowInstanceStatusColors', () => ({
  useWorkflowInstanceStateColors: jest.fn(() => 'status-icon'),
}));

describe('WorkflowInstanceStatusIndicator', () => {
  it('renders unavailable value when status is missing', () => {
    render(<WorkflowInstanceStatusIndicator />);

    expect(screen.getByText(VALUE_UNAVAILABLE)).toBeInTheDocument();
  });

  it('renders completed status text without link when instanceLink is not provided', () => {
    render(
      <WorkflowInstanceStatusIndicator
        status={ProcessInstanceStatusDTO.Completed}
      />,
    );

    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Completed' })).toBeNull();
  });

  it('renders status title as a link when instanceLink is provided', () => {
    render(
      <WorkflowInstanceStatusIndicator
        status={ProcessInstanceStatusDTO.Error}
        instanceLink="/orchestrator/instances/1"
      />,
    );

    const link = screen.getByRole('link', { name: 'Failed' });
    expect(link).toHaveAttribute('href', '/orchestrator/instances/1');
  });

  it('renders pending title for pending status', () => {
    render(
      <WorkflowInstanceStatusIndicator
        status={ProcessInstanceStatusDTO.Pending}
      />,
    );

    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders running title for active status', () => {
    render(
      <WorkflowInstanceStatusIndicator
        status={ProcessInstanceStatusDTO.Active}
      />,
    );

    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('renders suspended title for suspended status', () => {
    render(
      <WorkflowInstanceStatusIndicator
        status={ProcessInstanceStatusDTO.Suspended}
      />,
    );

    expect(screen.getByText('Suspended')).toBeInTheDocument();
  });

  it('aborted title for aborted status', () => {
    render(
      <WorkflowInstanceStatusIndicator
        status={ProcessInstanceStatusDTO.Aborted}
      />,
    );

    expect(screen.getByText('Aborted')).toBeInTheDocument();
  });

  it('renders unavailable for unknown status', () => {
    render(
      <WorkflowInstanceStatusIndicator
        status={'UnknownStatus' as ProcessInstanceStatusDTO}
      />,
    );

    expect(screen.getByText(VALUE_UNAVAILABLE)).toBeInTheDocument();
  });

  it('calls useWorkflowInstanceStateColors with correct status', () => {
    render(
      <WorkflowInstanceStatusIndicator
        status={ProcessInstanceStatusDTO.Completed}
      />,
    );

    expect(useWorkflowInstanceStateColors).toHaveBeenCalledWith(
      ProcessInstanceStatusDTO.Completed,
    );
  });

  it('applies color class to the rendered icon element', () => {
    const { container } = render(
      <WorkflowInstanceStatusIndicator
        status={ProcessInstanceStatusDTO.Completed}
      />,
    );

    expect(useWorkflowInstanceStateColors).toHaveBeenCalledWith(
      ProcessInstanceStatusDTO.Completed,
    );
    expect(container.querySelector('svg.status-icon')).toBeInTheDocument();
  });
});
