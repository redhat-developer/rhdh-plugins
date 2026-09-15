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

import { fireEvent, render, screen } from '@testing-library/react';

import {
  ProcessInstanceDTO,
  ProcessInstanceStatusDTO,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { WorkflowResult } from './WorkflowResult';

jest.mock('@backstage/core-components', () => {
  const React = require('react');

  return {
    InfoCard: ({ children, title }: { children?: unknown; title?: unknown }) =>
      React.createElement(
        'section',
        null,
        React.createElement('h2', null, title),
        children,
      ),
  };
});

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: () => ({}),
  useRouteRef: () => () => '/orchestrator/workflows/next/run',
}));

jest.mock('@backstage/plugin-catalog', () => ({
  AboutField: () => null,
}));

jest.mock('@mui/material/Alert', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({
      children,
      severity,
    }: {
      children?: unknown;
      severity: string;
    }) =>
      React.createElement(
        'div',
        { role: 'alert', 'data-severity': severity },
        children,
      ),
  };
});

jest.mock('@mui/material/AlertTitle', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children }: { children?: unknown }) =>
      React.createElement('strong', null, children),
  };
});

jest.mock('@mui/material/Box', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children }: { children?: unknown }) =>
      React.createElement('div', null, children),
  };
});

jest.mock('@mui/material/Button', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({
      children,
      onClick,
    }: {
      children?: unknown;
      onClick?: () => void;
    }) => React.createElement('button', { type: 'button', onClick }, children),
  };
});

jest.mock('@mui/material/CircularProgress', () => () => null);
jest.mock('@mui/material/Divider', () => () => null);

jest.mock('tss-react/mui', () => ({
  makeStyles: () => () => () => ({
    classes: { cardContent: 'card-content' },
  }),
}));

jest.mock('../../api', () => ({
  orchestratorApiRef: {},
}));

jest.mock('../../hooks/useLogsEnabled', () => ({
  useLogsEnabled: () => true,
}));

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('./WorkflowLogsDialog', () => {
  const React = require('react');
  return {
    WorkflowLogsDialog: ({ open }: { open: boolean }) =>
      open
        ? React.createElement('div', { 'data-testid': 'logs-dialog' })
        : null,
  };
});

jest.mock('../ui/SamlSsoExpiredDialog', () => ({
  SamlSsoExpiredDialog: () => null,
}));

describe('WorkflowResult', () => {
  it('exposes the logs action for a failed run and opens its dialog', () => {
    const failedInstance = {
      id: 'run-1',
      processId: 'greeting',
      processName: 'Greeting',
      state: ProcessInstanceStatusDTO.Error,
      error: {
        nodeDefinitionId: 'failed-step',
        message: 'step failed',
      },
      nodes: [],
    } as ProcessInstanceDTO;

    render(
      <WorkflowResult instance={failedInstance} className="result-card" />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('step failed');
    const logsButton = screen.getByRole('button', {
      name: 'run.logs.viewLogs',
    });
    expect(logsButton).toBeInTheDocument();

    fireEvent.click(logsButton);

    expect(screen.getByTestId('logs-dialog')).toBeInTheDocument();
  });
});
