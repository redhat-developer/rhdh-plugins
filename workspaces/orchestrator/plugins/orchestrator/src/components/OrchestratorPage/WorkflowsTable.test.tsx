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

import { type ReactNode } from 'react';

import { render, screen } from '@testing-library/react';

import {
  ProcessInstanceStatusDTO,
  type WorkflowOverviewDTO,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { WorkflowsTable } from './WorkflowsTable';

const mockUseWorkflowPermissionBatch = jest.fn();

jest.mock('@backstage/core-components', () => {
  const React = require('react');

  return {
    InfoCard: ({
      action,
      children,
      title,
    }: {
      action?: ReactNode;
      children?: ReactNode;
      title?: ReactNode;
    }) =>
      React.createElement(
        'section',
        null,
        React.createElement('h2', null, title),
        action,
        children,
      ),
    Link: ({ children, to }: { children?: ReactNode; to: string }) =>
      React.createElement('a', { href: to }, children),
  };
});

jest.mock('@backstage/core-plugin-api', () => {
  const actual = jest.requireActual('@backstage/core-plugin-api');

  return {
    ...actual,
    useRouteRef: () => (params: Record<string, string>) =>
      `/stub/${Object.values(params).join('/')}`,
    useRouteRefParams: () => ({}),
  };
});

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        'workflow.status.available': 'Available',
      })[key] ?? key,
  }),
}));

jest.mock('../../hooks/useWorkflowPermissionBatch', () => ({
  useWorkflowPermissionBatch: (...args: unknown[]) =>
    mockUseWorkflowPermissionBatch(...args),
}));

jest.mock('../Trans', () => ({
  Trans: ({ message }: { message: string }) => message,
}));

jest.mock('../ui/OverrideBackstageTable', () => {
  return {
    __esModule: true,
    default: jest.requireActual('./testUtils').renderMockTable,
  };
});

jest.mock('../ui/TableTextFilter', () => ({
  TableTextFilter: () => null,
}));

const workflow: WorkflowOverviewDTO = {
  workflowId: 'greeting',
  name: 'Greeting',
  format: 'yaml',
  version: '2.1.0',
  description: 'A greeting workflow',
  lastRunId: 'run-1',
  lastRunStatus: ProcessInstanceStatusDTO.Completed,
  isAvailable: true,
  workflowRunStats: {
    runsLastMonth: 1234,
    successRatio: 0.875,
  },
};

describe('WorkflowsTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWorkflowPermissionBatch.mockReturnValue({ allowed: [true] });
  });

  it('renders the current workflow columns and their values', () => {
    render(<WorkflowsTable items={[workflow]} />);

    expect(
      screen.getByRole('columnheader', { name: 'table.headers.name' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', {
        name: 'table.headers.workflowStatus',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'table.headers.version' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'table.headers.runsLastMonth' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: 'table.headers.successRatio' }),
    ).toBeInTheDocument();

    expect(screen.getByText('Greeting')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText('2.1.0')).toBeInTheDocument();
    expect(screen.getByText('1.2 k')).toBeInTheDocument();
    expect(screen.getByLabelText('88% success ratio')).toBeInTheDocument();
  });

  it('does not render the removed last-run or description columns', () => {
    render(<WorkflowsTable items={[workflow]} />);

    expect(
      screen.queryByRole('columnheader', { name: 'table.headers.description' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('columnheader', { name: 'table.headers.lastRun' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('columnheader', {
        name: 'table.headers.lastRunStatus',
      }),
    ).not.toBeInTheDocument();
  });
});
