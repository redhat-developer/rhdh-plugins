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

import { WorkflowRunsTabContent } from './WorkflowRunsTabContent';

const mockSetSearchParams = jest.fn();
let mockSearchParams = new URLSearchParams('eventTriggered=true');

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
}));

jest.mock('@backstage/core-plugin-api', () => {
  const actual = jest.requireActual('@backstage/core-plugin-api');
  return {
    ...actual,
    useApi: () => ({}),
    useRouteRef: () => () => '/stub',
    useRouteRefParams: () => ({}),
  };
});

jest.mock('@backstage/plugin-permission-react', () => ({
  usePermission: () => ({ allowed: false, loading: false }),
}));

jest.mock('../../hooks/usePolling', () => ({
  __esModule: true,
  default: () => ({
    loading: false,
    error: undefined,
    value: { items: [] },
  }),
}));

jest.mock('../../hooks/useEntityFilterItems', () => ({
  useEntityFilterItems: () => ({ items: [] }),
}));

jest.mock('../../hooks/useRunByFilterItems', () => ({
  useRunByFilterItems: () => ({ items: [] }),
}));

jest.mock('../../hooks/useLogsEnabled', () => ({
  useLogsEnabled: () => false,
}));

jest.mock('../ui/OrchestratorEmptyState', () => {
  const React = require('react');
  return {
    OrchestratorEmptyState: () =>
      React.createElement('div', { 'data-testid': 'empty-state' }),
  };
});

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
    mockSearchParams = new URLSearchParams('eventTriggered=true');
  });

  it('shows the eventTriggered alert when the query param is true', () => {
    render(<WorkflowRunsTabContent />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'run.messages.eventTriggered',
    );
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('does not show the eventTriggered alert when the query param is missing', () => {
    mockSearchParams = new URLSearchParams();

    render(<WorkflowRunsTabContent />);

    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('dismisses the alert and strips eventTriggered from the query string', () => {
    render(<WorkflowRunsTabContent />);

    fireEvent.click(screen.getByRole('button', { name: 'close' }));

    expect(screen.queryByRole('alert')).toBeNull();
    expect(mockSetSearchParams).toHaveBeenCalledWith(
      expect.any(URLSearchParams),
      { replace: true },
    );
    const nextParams = mockSetSearchParams.mock.calls[0][0] as URLSearchParams;
    expect(nextParams.get('eventTriggered')).toBeNull();
  });
});
