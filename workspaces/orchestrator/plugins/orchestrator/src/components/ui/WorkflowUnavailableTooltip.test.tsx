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

import { WorkflowUnavailableTooltip } from './WorkflowUnavailableTooltip';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (
      key: string,
      params?: { reason?: string; statusCode?: number; url?: string },
    ) => {
      const messages: Record<string, string> = {
        'workflow.unavailable.title': 'Unavailable workflow',
        'workflow.unavailable.requestFailed': `Request failed: ${params?.url}`,
        'workflow.unavailable.statusCodeLine': `Status code: ${params?.statusCode}`,
        'workflow.unavailable.statusTextLine': `Status text: ${params?.reason}`,
        'emptyState.workflows.viewDocumentation': 'View documentation',
      };
      return messages[key] ?? key;
    },
  }),
}));

jest.mock('@mui/material/Box', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children }: { children?: unknown }) =>
      React.createElement('div', null, children),
  };
});

jest.mock('@mui/material/Link', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children, href }: { children?: unknown; href?: string }) =>
      React.createElement('a', { href }, children),
  };
});

jest.mock('@mui/material/Typography', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children }: { children?: unknown }) =>
      React.createElement('span', null, children),
  };
});

jest.mock('@mui/material/Tooltip', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children, title }: { children?: unknown; title?: unknown }) =>
      React.createElement('div', { 'data-testid': 'tooltip' }, title, children),
  };
});

jest.mock('@mui/material/styles', () => ({
  useTheme: () => ({
    shadows: Array(5).fill('none'),
    shape: { borderRadius: 4 },
  }),
}));

jest.mock('@mui/icons-material/OpenInNew', () => () => null);

describe('WorkflowUnavailableTooltip', () => {
  it('shows the availability error details', () => {
    render(
      <WorkflowUnavailableTooltip
        availability={{
          urlToFetch: 'https://sonataflow.example/workflow',
          statusCode: 503,
          reason: 'Service unavailable',
        }}
      >
        <span>Unavailable</span>
      </WorkflowUnavailableTooltip>,
    );

    expect(screen.getByTestId('tooltip')).toHaveTextContent(
      'Unavailable workflow',
    );
    expect(screen.getByTestId('tooltip')).toHaveTextContent(
      'Request failed: https://sonataflow.example/workflow',
    );
    expect(screen.getByTestId('tooltip')).toHaveTextContent('Status code: 503');
    expect(screen.getByTestId('tooltip')).toHaveTextContent(
      'Status text: Service unavailable',
    );
  });
});
