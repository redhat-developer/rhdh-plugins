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

import { configApiRef, fetchApiRef } from '@backstage/core-plugin-api';
import { TestApiProvider } from '@backstage/test-utils';

import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';

import { mockUseTranslation } from '../../test-utils/mockTranslations';
import { McpServersSettings } from '../McpServersSettings';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => mockUseTranslation()),
}));

jest.mock('@backstage/plugin-permission-react', () => ({
  usePermission: jest.fn(() => ({ loading: false, allowed: true })),
}));

type McpServerResponse = {
  name: string;
  url?: string;
  enabled: boolean;
  status: 'connected' | 'error' | 'unknown';
  toolCount: number;
  hasToken: boolean;
  hasUserToken: boolean;
};

const BASE_URL = 'http://localhost:7007/api/lightspeed';

const jsonResponse = (body: unknown, ok = true) => ({
  ok,
  status: ok ? 200 : 500,
  statusText: ok ? 'OK' : 'Error',
  text: async () => JSON.stringify(body),
});

const connectedServer = (
  name: string,
  overrides: Partial<McpServerResponse> = {},
): McpServerResponse => ({
  name,
  url: `http://localhost/${name}`,
  enabled: true,
  status: 'connected',
  toolCount: 2,
  hasToken: true,
  hasUserToken: false,
  ...overrides,
});

const resolveTokenFieldAfterPatch = (
  token: string | null | undefined,
  currentValue: boolean,
): boolean => {
  if (token === null) {
    return false;
  }
  if (token) {
    return true;
  }
  return currentValue;
};

describe('McpServersSettings', () => {
  const onClose = jest.fn();
  let servers: McpServerResponse[];
  const mockFetch = jest.fn();

  const renderSettings = () =>
    render(
      <TestApiProvider
        apis={[
          [
            configApiRef,
            {
              getString: (key: string) => {
                if (key === 'backend.baseUrl') {
                  return 'http://localhost:7007';
                }
                throw new Error(`Unexpected config key: ${key}`);
              },
            },
          ],
          [fetchApiRef, { fetch: mockFetch }],
        ]}
      >
        <McpServersSettings onClose={onClose} />
      </TestApiProvider>,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    servers = [
      connectedServer('personal-server', {
        hasUserToken: true,
        toolCount: 3,
      }),
      connectedServer('test-mcp-server', {
        url: 'http://localhost:8888/mcp',
        enabled: true,
        hasToken: false,
        hasUserToken: false,
        status: 'unknown',
        toolCount: 0,
      }),
    ];

    mockFetch.mockImplementation(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';

      if (url === `${BASE_URL}/mcp-servers` && method === 'GET') {
        return jsonResponse({ servers });
      }

      if (method === 'POST' && url === `${BASE_URL}/mcp-servers/validate`) {
        const body = JSON.parse(String(init?.body ?? '{}')) as {
          url: string;
          token: string;
        };
        return jsonResponse({
          valid: body.token === 'valid-token',
          toolCount: 2,
          tools: [{ name: 'tool.one' }, { name: 'tool.two' }],
        });
      }

      if (method === 'POST' && url.endsWith('/validate')) {
        return jsonResponse({
          name: url.split('/').slice(-2, -1)[0],
          status: 'connected',
          toolCount: 2,
          validation: {
            tools: [{ name: 'tool.one' }, { name: 'tool.two' }],
          },
        });
      }

      if (method === 'PATCH') {
        const serverName = decodeURIComponent(url.split('/').pop() ?? '');
        const body = JSON.parse(String(init?.body ?? '{}')) as {
          enabled?: boolean;
          token?: string | null;
        };
        const current = servers.find(server => server.name === serverName);
        if (!current) {
          return jsonResponse({ error: 'Not found' }, false);
        }

        const updated: McpServerResponse = {
          ...current,
          enabled: body.enabled ?? current.enabled,
          hasToken: resolveTokenFieldAfterPatch(body.token, current.hasToken),
          hasUserToken: resolveTokenFieldAfterPatch(
            body.token,
            current.hasUserToken,
          ),
          status:
            body.token === null
              ? 'unknown'
              : body.enabled === true || current.status,
          toolCount: body.token === null ? 0 : current.toolCount,
        };
        servers = servers.map(server =>
          server.name === serverName ? updated : server,
        );
        return jsonResponse({ server: updated });
      }

      throw new Error(`Unhandled fetch: ${method} ${url}`);
    });
  });

  const waitForServersLoaded = async () => {
    await waitFor(() => {
      expect(screen.getByText('personal-server')).toBeInTheDocument();
    });
  };

  const openConfigureModal = async (serverName: string) => {
    fireEvent.click(screen.getByRole('button', { name: `Edit ${serverName}` }));
    await waitFor(() => {
      expect(
        screen.getByRole('heading', {
          name: `${serverName} MCP server settings`,
        }),
      ).toBeInTheDocument();
    });
  };

  const getModalDialog = () => screen.getByRole('dialog');

  it('shows enabled toggle off in table when token is required', async () => {
    renderSettings();
    await waitForServersLoaded();

    const tableToggle = screen.getByRole('switch', {
      name: 'Toggle test-mcp-server',
    });
    expect(tableToggle).not.toBeChecked();
  });

  it('disables Save when opening modal with unchanged personal token', async () => {
    renderSettings();
    await waitForServersLoaded();
    await openConfigureModal('personal-server');

    const dialog = getModalDialog();
    expect(within(dialog).getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('shows modal enabled toggle off when token is required', async () => {
    renderSettings();
    await waitForServersLoaded();
    await openConfigureModal('test-mcp-server');

    const dialog = getModalDialog();
    expect(
      within(dialog).getByRole('switch', {
        name: 'Toggle test-mcp-server',
      }),
    ).not.toBeChecked();
  });

  it('removes personal token, shows disconnecting state, warning, and disables actions', async () => {
    renderSettings();
    await waitForServersLoaded();
    await openConfigureModal('personal-server');

    const dialog = getModalDialog();
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Remove personal token' }),
    );

    expect(within(dialog).getByText('Disconnecting...')).toBeInTheDocument();

    await waitFor(() => {
      expect(within(dialog).getByText('Token required')).toBeInTheDocument();
    });

    expect(
      within(dialog).getByText(
        'Token has been removed. To use this MCP server again, provide a new token.',
      ),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(
      within(dialog).getByRole('button', { name: 'Remove personal token' }),
    ).toBeDisabled();
    expect(
      within(dialog).getByRole('switch', {
        name: 'Toggle personal-server',
      }),
    ).not.toBeChecked();
  });

  it('auto-enables server after saving a valid token', async () => {
    servers = [
      connectedServer('credential-test-mcp', {
        url: 'http://127.0.0.1:7777/mcp',
        enabled: false,
        hasToken: false,
        hasUserToken: false,
        status: 'unknown',
        toolCount: 0,
      }),
    ];

    renderSettings();
    await waitFor(() => {
      expect(screen.getByText('credential-test-mcp')).toBeInTheDocument();
    });
    await openConfigureModal('credential-test-mcp');

    const dialog = getModalDialog();
    fireEvent.change(within(dialog).getByLabelText('Type to filter'), {
      target: { value: 'valid-token' },
    });

    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/mcp-servers/credential-test-mcp`,
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ enabled: true }),
        }),
      );
    });
  });
});
