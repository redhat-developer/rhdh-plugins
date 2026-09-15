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

import { render, screen } from '@testing-library/react';

import { ProcessInstanceStatusDTO } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { WorkflowRunDetail } from '../types/WorkflowRunDetail';
import { WorkflowRunDetails } from './WorkflowRunDetails';

const mockGetWorkflowOverview = jest.fn();

jest.mock('@backstage/core-components', () => {
  const React = require('react');
  return {
    Link: ({ children, to }: { children?: unknown; to: string }) =>
      React.createElement('a', { href: to }, children),
  };
});

jest.mock('@backstage/core-plugin-api', () => ({
  useApi: () => ({ getWorkflowOverview: mockGetWorkflowOverview }),
  useRouteRef: () => () => '/orchestrator/workflows/greeting',
}));

jest.mock('@backstage/plugin-catalog', () => ({
  AboutField: ({ children }: { children?: unknown }) => children,
}));

jest.mock('@backstage/plugin-catalog-react', () => ({
  EntityRefLink: ({ entityRef }: { entityRef: string }) => {
    const React = require('react');
    return React.createElement('a', { href: '#' }, entityRef);
  },
}));

jest.mock('@mui/icons-material/ContentCopy', () => () => null);
jest.mock('../../api', () => ({
  orchestratorApiRef: {},
}));

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('react-use', () => ({
  useAsync: (asyncFn: () => Promise<unknown>) => {
    void asyncFn();
    return {
      value: { version: '2.1.0', isAvailable: true },
      loading: false,
      error: undefined,
    };
  },
}));

jest.mock('../../routes', () => ({
  workflowRouteRef: 'workflowRouteRef',
}));

jest.mock('../ui/WorkflowInstanceStatusIndicator', () => ({
  WorkflowInstanceStatusIndicator: ({ status }: { status: string }) => {
    const React = require('react');
    return React.createElement('span', null, status);
  },
}));

jest.mock('../ui/WorkflowStatus', () => ({
  WorkflowStatus: ({ availability }: { availability?: boolean }) => {
    const React = require('react');
    return React.createElement(
      'span',
      null,
      availability ? 'Available' : 'Unavailable',
    );
  },
}));

jest.mock('tss-react/mui', () => ({
  makeStyles: () => () => () => ({ classes: { workflowId: 'workflow-id' } }),
}));

describe('WorkflowRunDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetWorkflowOverview.mockResolvedValue({
      data: { version: '2.1.0', isAvailable: true },
    });
  });

  it('renders the initiating entity and loads workflow details', () => {
    const details: WorkflowRunDetail = {
      id: 'run-1',
      processName: 'Greeting',
      workflowId: 'greeting',
      state: ProcessInstanceStatusDTO.Completed,
      start: 'Jun 1, 2024',
      duration: '1 minute',
      initiatorEntity: 'user:default/alice',
      hasVariables: false,
    };

    render(<WorkflowRunDetails details={details} />);

    expect(screen.getByText('user:default/alice')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Greeting' })).toHaveAttribute(
      'href',
      '/orchestrator/workflows/greeting',
    );
    expect(mockGetWorkflowOverview).toHaveBeenCalledWith('greeting');
  });
});
