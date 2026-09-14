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

import { WorkflowOverviewDTO } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { WorkflowDetailsTabContent } from './WorkflowDetailsTabContent';

const mockGetWorkflowSource = jest.fn();

jest.mock('@backstage/core-components', () => ({
  InfoCard: () => null,
  ResponseErrorPanel: () => null,
}));

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: () => ({ getWorkflowSource: mockGetWorkflowSource }),
  useRouteRefParams: (routeRef: string) =>
    routeRef === 'workflowRouteRef' ? { workflowId: 'greeting' } : {},
}));

jest.mock('@backstage/plugin-permission-react', () => ({
  usePermission: () => ({ allowed: false, loading: false }),
}));

jest.mock('@mui/material/Grid', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children }: { children?: unknown }) =>
      React.createElement('div', null, children),
  };
});

jest.mock('../../api', () => ({
  orchestratorApiRef: {},
}));

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../routes', () => ({
  entityWorkflowRouteRef: 'entityWorkflowRouteRef',
  workflowRouteRef: 'workflowRouteRef',
}));

jest.mock('react-use', () => ({
  useAsync: (asyncFn: () => Promise<unknown>) => {
    void asyncFn();
    return {
      value: { data: 'states: []' },
      loading: false,
      error: undefined,
    };
  },
}));

jest.mock('./InputSchemaCard', () => {
  const React = require('react');
  return {
    InputSchemaCard: ({ workflowId }: { workflowId: string }) =>
      React.createElement(
        'div',
        { 'data-testid': 'input-schema-card' },
        workflowId,
      ),
  };
});

jest.mock('./ServerlessWorkflowEditor', () => () => null);

jest.mock('./WorkflowDetailsCard', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({
      workflowOverview,
    }: {
      workflowOverview?: WorkflowOverviewDTO;
    }) =>
      React.createElement(
        'div',
        { 'data-testid': 'workflow-details-card' },
        workflowOverview?.name,
      ),
  };
});

jest.mock('./WorkflowSuccessRatioCard', () => {
  const React = require('react');
  return {
    WorkflowSuccessRatioCard: ({
      workflowOverview,
    }: {
      workflowOverview?: WorkflowOverviewDTO;
    }) =>
      React.createElement(
        'div',
        { 'data-testid': 'success-ratio-card' },
        workflowOverview?.workflowRunStats?.successRatio,
      ),
  };
});

describe('WorkflowDetailsTabContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetWorkflowSource.mockResolvedValue({ data: 'states: []' });
  });

  it('wires the input schema and success-ratio cards into workflow details', () => {
    const workflowOverview = {
      workflowId: 'greeting',
      name: 'Greeting',
      format: 'yaml',
      workflowRunStats: {
        successRatio: 0.75,
        successCount: 3,
        errorCount: 1,
        totalCount: 4,
      },
    } as WorkflowOverviewDTO;

    render(
      <WorkflowDetailsTabContent
        loadingWorkflowOverview={false}
        workflowOverviewDTO={workflowOverview}
        errorWorkflowOverview={undefined}
      />,
    );

    expect(screen.getByTestId('workflow-details-card')).toHaveTextContent(
      'Greeting',
    );
    expect(screen.getByTestId('input-schema-card')).toHaveTextContent(
      'greeting',
    );
    expect(screen.getByTestId('success-ratio-card')).toHaveTextContent('0.75');
    expect(mockGetWorkflowSource).toHaveBeenCalledWith('greeting');
  });
});
