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

import { createElement, type ReactNode } from 'react';

import { TestApiProvider } from '@backstage/test-utils';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { orchestratorApiRef } from '../../api';
import { ExecuteWorkflowPage } from './ExecuteWorkflowPage';

const mockNavigate = jest.fn();
const mockExecuteWorkflow = jest.fn();
const mockGetWorkflowDataInputSchema = jest.fn();
const mockGetWorkflowOverview = jest.fn();
const mockAuthenticate = jest.fn();
let mockKafkaEnabled = true;
let mockSearchParams = new URLSearchParams();

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('../../hooks/useKafkaEnabled', () => ({
  useKafkaEnabled: () => mockKafkaEnabled,
}));

jest.mock('../../hooks/useOrchestratorAuth', () => ({
  useOrchestratorAuth: () => ({
    authenticate: (...args: unknown[]) => mockAuthenticate(...args),
  }),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams],
}));

jest.mock('@backstage/core-components', () => {
  const actual = jest.requireActual('@backstage/core-components');
  const React = require('react');
  return {
    ...actual,
    InfoCard: ({ children, title }: { children: ReactNode; title?: string }) =>
      React.createElement(
        'div',
        null,
        React.createElement('h2', null, title),
        children,
      ),
    Progress: () => React.createElement('div', null, 'loading'),
    ResponseErrorPanel: ({ error }: { error: Error }) =>
      React.createElement('div', null, error.message),
    useQueryParamState: () => [undefined],
  };
});

jest.mock('@backstage/core-plugin-api', () => {
  const actual = jest.requireActual('@backstage/core-plugin-api');
  return {
    ...actual,
    useRouteRefParams: () => ({ workflowId: 'wf-1' }),
    useRouteRef: () => (params: Record<string, string>) => {
      if ('instanceId' in params && 'kind' in params) {
        return `/catalog/${params.namespace}/${params.kind}/${params.name}/workflows/${params.workflowId}/runs/${params.instanceId}`;
      }
      if ('instanceId' in params) {
        return `/orchestrator/instances/${params.instanceId}`;
      }
      if ('kind' in params) {
        return `/catalog/${params.namespace}/${params.kind}/${params.name}/workflows/${params.workflowId}`;
      }
      return `/orchestrator/workflows/${params.workflowId}/runs`;
    },
  };
});

jest.mock('../ui/BaseOrchestratorPage', () => {
  const React = require('react');
  return {
    BaseOrchestratorPage: ({ children }: { children: ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

jest.mock('../ui/SamlSsoExpiredDialog', () => ({
  SamlSsoExpiredDialog: () => null,
}));

jest.mock(
  '@red-hat-developer-hub/backstage-plugin-orchestrator-form-react',
  () => {
    const React = require('react');
    return {
      OrchestratorForm: ({
        handleExecute,
        handleExecuteAsEvent,
        executeLabel,
        executeAsEventLabel,
        isExecuting,
      }: {
        handleExecute: (parameters: Record<string, unknown>) => Promise<void>;
        handleExecuteAsEvent?: (
          parameters: Record<string, unknown>,
        ) => Promise<void>;
        executeLabel?: string;
        executeAsEventLabel?: string;
        isExecuting?: boolean;
      }) =>
        React.createElement(
          React.Fragment,
          null,
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: () => handleExecute({}),
              disabled: isExecuting ?? false,
            },
            executeLabel,
          ),
          handleExecuteAsEvent && executeAsEventLabel
            ? React.createElement(
                'button',
                {
                  type: 'button',
                  onClick: () => handleExecuteAsEvent({}),
                  disabled: isExecuting ?? false,
                },
                executeAsEventLabel,
              )
            : null,
        ),
    };
  },
);

describe('ExecuteWorkflowPage', () => {
  const renderPage = () =>
    render(
      createElement(TestApiProvider, {
        apis: [
          [
            orchestratorApiRef,
            {
              getWorkflowDataInputSchema: mockGetWorkflowDataInputSchema,
              getWorkflowOverview: mockGetWorkflowOverview,
              executeWorkflow: mockExecuteWorkflow,
            },
          ],
        ],
        children: createElement(ExecuteWorkflowPage),
      }),
    );

  beforeEach(() => {
    jest.clearAllMocks();
    mockKafkaEnabled = true;
    mockSearchParams = new URLSearchParams();
    mockAuthenticate.mockResolvedValue([]);
    // Minimal schema so the page takes the OrchestratorForm path (primary UX),
    // not MissingSchemaNotice (already covered in MissingSchemaNotice.test.tsx).
    mockGetWorkflowDataInputSchema.mockResolvedValue({
      data: {
        inputSchema: { type: 'object', properties: {} },
        data: {},
      },
    });
    mockGetWorkflowOverview.mockResolvedValue({ data: { name: 'WF' } });
    mockExecuteWorkflow.mockResolvedValue({ data: { id: 'kafkaEvent' } });
  });

  const waitForPage = async () => {
    expect(
      await screen.findByRole('button', { name: 'common.run' }),
    ).toBeInTheDocument();
  };

  it('sends isEvent: true when Run as Event is clicked', async () => {
    renderPage();
    await waitForPage();

    fireEvent.click(
      screen.getByRole('button', { name: 'workflow.buttons.runAsEvent' }),
    );

    await waitFor(() => {
      expect(mockExecuteWorkflow).toHaveBeenCalledWith(
        expect.objectContaining({
          workflowId: 'wf-1',
          parameters: { isEvent: true },
          authTokens: [],
        }),
      );
    });
  });

  it('redirects to workflow runs with eventTriggered when response id is kafkaEvent', async () => {
    renderPage();
    await waitForPage();

    fireEvent.click(
      screen.getByRole('button', { name: 'workflow.buttons.runAsEvent' }),
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        '/orchestrator/workflows/wf-1/runs?eventTriggered=true',
      );
    });
  });

  it('redirects to entity workflow runs with eventTriggered when targetEntity is set', async () => {
    mockSearchParams = new URLSearchParams(
      'targetEntity=component:default/my-comp',
    );

    renderPage();
    await waitForPage();

    fireEvent.click(
      screen.getByRole('button', { name: 'workflow.buttons.runAsEvent' }),
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        '/catalog/default/component/my-comp/workflows/wf-1?eventTriggered=true',
      );
    });
  });

  it('navigates to the instance page for a normal run', async () => {
    mockExecuteWorkflow.mockResolvedValue({ data: { id: 'inst-1' } });

    renderPage();
    await waitForPage();

    fireEvent.click(screen.getByRole('button', { name: 'common.run' }));

    await waitFor(() => {
      expect(mockExecuteWorkflow).toHaveBeenCalledWith(
        expect.objectContaining({
          parameters: {},
        }),
      );
      expect(mockNavigate).toHaveBeenCalledWith(
        '/orchestrator/instances/inst-1',
      );
    });
  });

  it('does not render Run as Event when kafka is disabled', async () => {
    mockKafkaEnabled = false;

    renderPage();
    await waitForPage();

    expect(
      screen.queryByRole('button', { name: 'workflow.buttons.runAsEvent' }),
    ).toBeNull();
  });
});
