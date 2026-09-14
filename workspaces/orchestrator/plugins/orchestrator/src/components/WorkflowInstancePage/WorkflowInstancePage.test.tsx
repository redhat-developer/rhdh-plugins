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

import {
  ProcessInstanceStatusDTO,
  type ProcessInstanceDTO,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { WorkflowInstancePage } from './WorkflowInstancePage';

const mockInstance: ProcessInstanceDTO = {
  id: 'run-1',
  processId: 'greeting',
  processName: 'greeting',
  state: ProcessInstanceStatusDTO.Completed,
  nodes: [],
};
let mockEntityContext = false;

jest.mock('@backstage/core-components', () => {
  const React = require('react');
  return {
    ContentHeader: ({ children }: { children?: unknown }) =>
      React.createElement('div', null, children),
    Content: ({ children }: { children?: unknown }) =>
      React.createElement('main', null, children),
    Header: ({
      title,
      type,
      typeLink,
    }: {
      title?: string;
      type?: string;
      typeLink?: string;
    }) =>
      React.createElement(
        'header',
        null,
        React.createElement('h1', null, title),
        React.createElement('a', { href: typeLink }, type),
      ),
    Page: ({ children }: { children?: unknown }) =>
      React.createElement('div', null, children),
    Progress: () => React.createElement('div', null, 'loading'),
    ResponseErrorPanel: ({ error }: { error: Error }) =>
      React.createElement('div', null, error.message),
  };
});

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: () => ({
    getWorkflowDataInputSchema: jest.fn(),
    getInstance: jest.fn(),
  }),
  useRouteRef:
    (routeRef: string) => (params: Record<string, string | undefined>) => {
      if (routeRef === 'workflowRouteRef') {
        return `/orchestrator/workflows/${params.workflowId}`;
      }
      if (routeRef === 'entityWorkflowRouteRef') {
        return `/catalog/${params.namespace}/${params.kind}/${params.name}/workflows/${params.workflowId}`;
      }
      if (routeRef === 'executeWorkflowRouteRef') {
        return `/orchestrator/workflows/${params.workflowId}/run`;
      }
      return '/orchestrator/instances/run-1';
    },
  useRouteRefParams: (routeRef: string) => {
    if (routeRef === 'workflowInstanceRouteRef' && !mockEntityContext) {
      return { instanceId: 'run-1' };
    }
    if (routeRef === 'entityInstanceRouteRef' && mockEntityContext) {
      return {
        instanceId: 'run-1',
        kind: 'component',
        name: 'app',
        namespace: 'default',
        workflowId: 'greeting',
      };
    }
    return {};
  },
}));

jest.mock('@backstage/plugin-permission-react', () => ({
  usePermission: () => ({ allowed: true, loading: false }),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

jest.mock('react-use', () => ({
  useAsync: () => ({
    value: { inputSchema: { type: 'object' } },
    loading: false,
    error: undefined,
  }),
}));

jest.mock('../../api', () => ({
  orchestratorApiRef: {},
}));

jest.mock('../../hooks/useOrchestratorAuth', () => ({
  useOrchestratorAuth: () => ({ authenticate: jest.fn() }),
}));

jest.mock('../../hooks/usePolling', () => ({
  __esModule: true,
  default: () => ({
    loading: false,
    error: undefined,
    value: mockInstance,
    restart: jest.fn(),
  }),
}));

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('../../routes', () => ({
  entityInstanceRouteRef: 'entityInstanceRouteRef',
  entityWorkflowRouteRef: 'entityWorkflowRouteRef',
  executeWorkflowRouteRef: 'executeWorkflowRouteRef',
  workflowInstanceRouteRef: 'workflowInstanceRouteRef',
  workflowRouteRef: 'workflowRouteRef',
}));

jest.mock('../ui/BaseOrchestratorPage', () => {
  return jest.requireActual('../ui/BaseOrchestratorPage');
});

jest.mock('../ui/InfoDialog', () => ({
  InfoDialog: () => null,
}));

jest.mock('../ui/PermissionDeniedPanel', () => ({
  PermissionDeniedPanel: () => null,
  extractRequiredPermission: () => undefined,
  isAccessDeniedError: () => false,
}));

jest.mock('../ui/SamlSsoExpiredDialog', () => ({
  SamlSsoExpiredDialog: () => null,
}));

jest.mock('./WorkflowInstancePageContent', () => {
  const React = require('react');
  return {
    WorkflowInstancePageContent: ({
      instance,
    }: {
      instance: ProcessInstanceDTO;
    }) =>
      React.createElement(
        'div',
        { 'data-testid': 'instance-content' },
        instance.id,
      ),
  };
});

jest.mock('tss-react/mui', () => ({
  makeStyles: () => () => () => ({
    classes: {
      abortButton: 'abort-button',
      modalText: 'modal-text',
      errorColor: 'error-color',
      menu: 'menu',
    },
  }),
}));

describe('WorkflowInstancePage', () => {
  beforeEach(() => {
    mockEntityContext = false;
  });

  it('links the run breadcrumb to its workflow details page', () => {
    render(<WorkflowInstancePage />);

    expect(screen.getByRole('heading', { name: 'run-1' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Greeting' })).toHaveAttribute(
      'href',
      '/orchestrator/workflows/greeting',
    );
    expect(screen.getByTestId('instance-content')).toHaveTextContent('run-1');
  });

  it('links the entity run breadcrumb to the catalog workflow details page', () => {
    mockEntityContext = true;

    render(<WorkflowInstancePage />);

    expect(screen.getByRole('link', { name: 'Greeting' })).toHaveAttribute(
      'href',
      '/catalog/default/component/app/workflows/greeting',
    );
  });
});
