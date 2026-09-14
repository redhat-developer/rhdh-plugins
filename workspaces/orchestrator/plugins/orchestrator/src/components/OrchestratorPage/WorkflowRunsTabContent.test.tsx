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

import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import {
  ProcessInstanceStatusDTO,
  type ProcessInstanceDTO,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import {
  entityInstanceRouteRef,
  entityWorkflowRouteRef,
  workflowRunsRouteRef,
} from '../../routes';
import { WorkflowRunDetail } from '../types/WorkflowRunDetail';
import { WorkflowRunsTabContent } from './WorkflowRunsTabContent';

const mockT = (key: string) => key;
const mockSetSearchParams = jest.fn();
const mockListInstances = jest.fn();
const mockOrchestratorApi = {
  getInstance: jest.fn(),
  listInstances: mockListInstances,
};
const mockUsePermission = jest.fn();
let mockSearchParams = new URLSearchParams();
let mockInstanceAdminAllowed = false;
let mockWorkflowId: string | undefined;
let mockApiItems: ProcessInstanceDTO[] = [];

const run: WorkflowRunDetail = {
  id: 'run-1',
  processName: 'Greeting',
  workflowId: 'greeting',
  version: '2.1.0',
  targetEntity: 'component:default/app',
  initiatorEntity: 'user:default/alice',
  state: ProcessInstanceStatusDTO.Completed,
  start: 'Jun 1, 2024',
  startIso: '2024-06-01T00:00:00.000Z',
  duration: '1 minute',
  hasVariables: false,
};

const apiRun: ProcessInstanceDTO = {
  id: run.id,
  processId: run.workflowId,
  processName: run.processName,
  version: run.version,
  state: ProcessInstanceStatusDTO.Completed,
  start: run.startIso,
  end: '2024-06-01T00:01:00.000Z',
  targetEntity: run.targetEntity,
  initiatorEntity: run.initiatorEntity,
  nodes: [],
};

jest.mock('@backstage/core-components', () => {
  const React = require('react');

  return {
    ErrorPanel: ({ error }: { error: Error }) =>
      React.createElement('div', { role: 'alert' }, error.message),
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
    useApi: () => mockOrchestratorApi,
    useRouteRef: () => (params: Record<string, string>) =>
      `/stub/${Object.values(params).join('/')}`,
    useRouteRefParams: (routeRef: unknown) => {
      if (routeRef === workflowRunsRouteRef) {
        return { workflowId: mockWorkflowId };
      }
      if (routeRef === entityWorkflowRouteRef) {
        return {};
      }
      if (routeRef === entityInstanceRouteRef) {
        return {};
      }
      return {};
    },
  };
});

jest.mock('@backstage/plugin-catalog-react', () => ({
  EntityRefLink: ({ entityRef }: { entityRef: string }) =>
    createElement('a', { href: '#' }, entityRef),
  entityPresentationSnapshot: (entityRef: string) => ({
    primaryTitle: entityRef,
  }),
}));

jest.mock('@backstage/plugin-permission-react', () => ({
  usePermission: (...args: unknown[]) => mockUsePermission(...args),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
}));

jest.mock('../../api', () => ({
  orchestratorApiRef: {},
}));

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({ t: mockT }),
}));

jest.mock('../../hooks/useEntityFilterItems', () => ({
  useEntityFilterItems: () => ({
    items: [{ label: 'App', value: 'component:default/app' }],
  }),
}));

jest.mock('../../hooks/useLogsEnabled', () => ({
  useLogsEnabled: () => false,
}));

jest.mock('../../hooks/useRunByFilterItems', () => ({
  useRunByFilterItems: () => ({
    items: [{ label: 'Alice', value: 'user:default/alice' }],
  }),
}));

jest.mock('../../hooks/usePolling', () => {
  const React = require('react');

  const usePollingMock = (fetcher: () => Promise<unknown>) => {
    const [state, setState] = React.useState({
      loading: true,
      error: undefined,
      value: undefined,
    });

    React.useEffect(() => {
      let active = true;
      void fetcher().then(
        value => {
          if (active) {
            setState({ loading: false, error: undefined, value });
          }
        },
        error => {
          if (active) {
            setState({ loading: false, error, value: undefined });
          }
        },
      );

      return () => {
        active = false;
      };
    }, [fetcher]);

    return state;
  };

  return {
    __esModule: true,
    default: usePollingMock,
  };
});

jest.mock('../Trans', () => ({
  Trans: ({ message }: { message: string }) => message,
}));

jest.mock('../ui/OrchestratorEmptyState', () => ({
  OrchestratorEmptyState: ({ variant }: { variant: string }) =>
    createElement('div', { 'data-testid': `empty-${variant}` }, variant),
}));

jest.mock('../ui/OverrideBackstageTable', () => {
  const React = require('react');

  return {
    __esModule: true,
    default: ({ columns, data }: { columns: any[]; data: any[] }) =>
      React.createElement(
        'table',
        null,
        React.createElement(
          'thead',
          null,
          React.createElement(
            'tr',
            null,
            columns.map(column =>
              React.createElement('th', { key: column.field }, column.title),
            ),
          ),
        ),
        React.createElement(
          'tbody',
          null,
          data.map(row =>
            React.createElement(
              'tr',
              { key: row.id },
              columns.map(column =>
                React.createElement(
                  'td',
                  { key: column.field },
                  column.render
                    ? column.render(row)
                    : row[column.field as keyof typeof row],
                ),
              ),
            ),
          ),
        ),
      ),
  };
});

jest.mock('../ui/Selector', () => {
  const React = require('react');

  return {
    Selector: ({
      items,
      label,
      onChange,
      selected,
    }: {
      items: Array<{ label: string; value: string }>;
      label: string;
      onChange: (value: string) => void;
      selected: string;
    }) =>
      React.createElement(
        'label',
        null,
        label,
        React.createElement(
          'select',
          {
            'aria-label': label,
            value: selected,
            onChange: (event: { target: { value: string } }) =>
              onChange(event.target.value),
          },
          React.createElement('option', { value: '___all___' }, 'All'),
          ...items.map(item =>
            React.createElement(
              'option',
              { key: item.value, value: item.value },
              item.label,
            ),
          ),
        ),
      ),
  };
});

jest.mock('../ui/TableTextFilter', () => ({
  TableTextFilter: () => null,
}));

jest.mock('../ui/WorkflowInstanceStatusIndicator', () => ({
  WorkflowInstanceStatusIndicator: ({ status }: { status: string }) =>
    createElement('span', null, status),
}));

jest.mock('../WorkflowInstancePage/WorkflowInputs', () => ({
  WorkflowInputs: () => null,
}));

jest.mock('../WorkflowInstancePage/WorkflowInstanceProgressReactFlow', () => ({
  WorkflowInstanceProgressReactFlow: () => null,
}));

jest.mock('../WorkflowInstancePage/WorkflowResult', () => ({
  WorkflowResult: () => null,
}));

jest.mock('../WorkflowInstancePage/WorkflowRunDetails', () => ({
  WorkflowRunDetails: () => null,
}));

jest.mock('../WorkflowInstancePage/VariablesDialog', () => ({
  VariablesDialog: () => null,
}));

jest.mock('../WorkflowInstancePage/WorkflowLogsDialog', () => ({
  WorkflowLogsDialog: () => null,
}));

jest.mock('@mui/material/Alert', () => {
  const React = require('react');

  return {
    __esModule: true,
    default: ({ children, onClose }: any) =>
      React.createElement(
        'div',
        { role: 'alert' },
        children,
        onClose
          ? React.createElement(
              'button',
              { type: 'button', onClick: onClose },
              'close',
            )
          : null,
      ),
  };
});

describe('WorkflowRunsTabContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    mockInstanceAdminAllowed = false;
    mockWorkflowId = undefined;
    mockApiItems = [apiRun];
    mockListInstances.mockImplementation(async () => ({
      data: { items: mockApiItems, totalCount: mockApiItems.length },
    }));
    mockUsePermission.mockImplementation(
      ({ permission }: { permission: { name: string } }) => ({
        allowed:
          permission.name === 'orchestrator.instanceAdminView'
            ? mockInstanceAdminAllowed
            : false,
        loading: false,
      }),
    );
  });

  it('shows the eventTriggered alert when the query param is true', async () => {
    mockSearchParams = new URLSearchParams('eventTriggered=true');
    mockApiItems = [];

    render(<WorkflowRunsTabContent />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'run.messages.eventTriggered',
    );
    expect(await screen.findByTestId('empty-runs')).toBeInTheDocument();
  });

  it('does not show the eventTriggered alert when the query param is missing', async () => {
    mockApiItems = [];

    render(<WorkflowRunsTabContent />);

    expect(screen.queryByRole('alert')).toBeNull();
    expect(await screen.findByTestId('empty-runs')).toBeInTheDocument();
  });

  it('dismisses the alert and strips eventTriggered from the query string', async () => {
    mockSearchParams = new URLSearchParams('eventTriggered=true');
    mockApiItems = [];

    render(<WorkflowRunsTabContent />);
    await screen.findByTestId('empty-runs');

    fireEvent.click(screen.getByRole('button', { name: 'close' }));

    expect(screen.queryByRole('alert')).toBeNull();
    expect(mockSetSearchParams).toHaveBeenCalledWith(
      expect.any(URLSearchParams),
      { replace: true },
    );
    const nextParams = mockSetSearchParams.mock.calls[0][0] as URLSearchParams;
    expect(nextParams.get('eventTriggered')).toBeNull();
  });

  it.each([
    ['all runs', undefined],
    ['workflow runs', 'greeting'],
  ])(
    'renders the Entity column and filter for %s',
    async (_label, workflowId) => {
      mockWorkflowId = workflowId;

      render(<WorkflowRunsTabContent />);

      expect(
        screen.getByRole('columnheader', { name: 'table.headers.entity' }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText('table.filters.entity')).toBeInTheDocument();
      expect(
        await screen.findByText('component:default/app'),
      ).toBeInTheDocument();
    },
  );

  it('renders the Run by column when a run has an initiator entity', async () => {
    render(<WorkflowRunsTabContent />);

    expect(
      screen.getByRole('columnheader', { name: 'table.headers.runBy' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('user:default/alice')).toBeInTheDocument();
  });

  it('hides the Run by filter without instance admin view permission', async () => {
    render(<WorkflowRunsTabContent />);
    await screen.findByText(run.id);
    expect(
      screen.queryByLabelText('table.filters.runBy'),
    ).not.toBeInTheDocument();
  });

  it('shows the Run by filter with instance admin view permission', async () => {
    mockInstanceAdminAllowed = true;
    render(<WorkflowRunsTabContent />);

    await screen.findByText(run.id);
    expect(screen.getByLabelText('table.filters.runBy')).toBeInTheDocument();
  });

  it('renders the empty state when no runs are returned', async () => {
    mockApiItems = [];

    render(<WorkflowRunsTabContent />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-runs')).toBeInTheDocument();
    });
  });

  it('applies a status filter without throwing and sends it to the API', async () => {
    render(<WorkflowRunsTabContent />);

    expect(() =>
      fireEvent.change(screen.getByLabelText('table.filters.status'), {
        target: { value: ProcessInstanceStatusDTO.Error },
      }),
    ).not.toThrow();

    await waitFor(() => {
      expect(mockListInstances).toHaveBeenCalledWith(
        expect.objectContaining({ pageSize: expect.any(Number) }),
        expect.objectContaining({
          operator: 'EQ',
          field: 'state',
          value: ProcessInstanceStatusDTO.Error,
        }),
      );
    });
  });
});
