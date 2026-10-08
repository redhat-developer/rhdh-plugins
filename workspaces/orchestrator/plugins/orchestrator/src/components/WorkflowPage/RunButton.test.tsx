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

import { RunButton } from './RunButton';

const mockNavigate = jest.fn();

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useRouteRef: () => (params: { workflowId: string }) =>
    `/orchestrator/workflows/${params.workflowId}/run`,
  useRouteRefParams: (routeRef: string) =>
    routeRef === 'entityWorkflowRouteRef' ? {} : { workflowId: 'workflow-1' },
}));

jest.mock('@backstage/plugin-permission-react', () => ({
  usePermission: () => ({ allowed: true, loading: false }),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('@mui/material/Button', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({
      children,
      disabled,
      onClick,
    }: {
      children?: unknown;
      disabled?: boolean;
      onClick?: () => void;
    }) =>
      React.createElement(
        'button',
        { type: 'button', disabled, onClick },
        children,
      ),
  };
});

jest.mock('@mui/material/Grid', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children }: { children?: unknown }) =>
      React.createElement('div', null, children),
  };
});

jest.mock('@mui/material/Skeleton', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('span', null, 'loading'),
  };
});

jest.mock('@mui/material/Tooltip', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children, title }: { children?: unknown; title?: string }) =>
      React.createElement(
        'span',
        { 'data-testid': 'tooltip', 'data-title': title },
        children,
      ),
  };
});

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('../../routes', () => ({
  entityWorkflowRouteRef: 'entityWorkflowRouteRef',
  executeWorkflowRouteRef: 'executeWorkflowRouteRef',
  workflowRouteRef: 'workflowRouteRef',
}));

describe('RunButton', () => {
  it('disables unavailable workflows and explains why they cannot run', () => {
    render(<RunButton isAvailable={false} />);

    expect(
      screen.getByRole('button', { name: 'workflow.buttons.run' }),
    ).toBeDisabled();
    expect(screen.getByTestId('tooltip')).toHaveAttribute(
      'data-title',
      'workflow.unavailable.runTooltip',
    );
  });
});
