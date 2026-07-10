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
  hasOrgToken: boolean;
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
  hasOrgToken: true,
  ...overrides,
});

const resolveTokenFieldAfterPatch = (
  token: string | null | undefined,
  currentValue: boolean,
): boolean => {
  if (token === null) {
    return currentValue;
  }
  if (token) {
    return true;
  }
  return currentValue;
};

const resolveStatusAfterPatch = (
  token: string | null | undefined,
  enabled: boolean | undefined,
  currentStatus: McpServerResponse['status'],
): McpServerResponse['status'] => {
  if (token === null) {
    return 'unknown';
  }
  if (enabled === true) {
    return 'connected';
  }
  return currentStatus;
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
        hasOrgToken: true,
        toolCount: 3,
      }),
      connectedServer('test-mcp-server', {
        url: 'http://localhost:8888/mcp',
        enabled: true,
        hasToken: false,
        hasUserToken: false,
        hasOrgToken: false,
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
          hasUserToken:
            body.token === null
              ? false
              : resolveTokenFieldAfterPatch(body.token, current.hasUserToken),
          status: resolveStatusAfterPatch(
            body.token,
            body.enabled,
            current.status,
          ),
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

  it('shows credential radios for servers with organization default token', async () => {
    renderSettings();
    await waitForServersLoaded();
    await openConfigureModal('personal-server');

    const dialog = getModalDialog();
    expect(
      within(dialog).getByRole('radio', {
        name: 'Use organization default token',
      }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('radio', { name: 'Use personal token' }),
    ).toBeChecked();
  });

  it('does not show credential radios when no organization default token', async () => {
    renderSettings();
    await waitForServersLoaded();
    await openConfigureModal('test-mcp-server');

    const dialog = getModalDialog();
    expect(
      within(dialog).queryByRole('radio', {
        name: 'Use organization default token',
      }),
    ).not.toBeInTheDocument();
  });

  it('updates modal status locally when enabled is toggled off without PATCH', async () => {
    renderSettings();
    await waitForServersLoaded();
    await openConfigureModal('personal-server');

    const dialog = getModalDialog();
    await waitFor(() => {
      expect(within(dialog).getByText('2 tools')).toBeInTheDocument();
    });

    const patchCallsBefore = mockFetch.mock.calls.filter(
      ([, init]) => init?.method === 'PATCH',
    ).length;

    fireEvent.click(
      within(dialog).getByRole('switch', {
        name: 'Toggle personal-server',
      }),
    );

    expect(within(dialog).getByText('Disabled')).toBeInTheDocument();
    expect(within(dialog).queryByText('Tools (2)')).not.toBeInTheDocument();
    expect(
      within(dialog).getByText(
        'This server is disabled and unavailable in chat.',
      ),
    ).toBeInTheDocument();

    const patchCallsAfter = mockFetch.mock.calls.filter(
      ([, init]) => init?.method === 'PATCH',
    ).length;
    expect(patchCallsAfter).toBe(patchCallsBefore);

    expect(within(dialog).getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('persists enabled change when saving with unchanged masked token', async () => {
    renderSettings();
    await waitForServersLoaded();
    await openConfigureModal('personal-server');

    const dialog = getModalDialog();
    await waitFor(() => {
      expect(within(dialog).getByText('2 tools')).toBeInTheDocument();
    });

    fireEvent.click(
      within(dialog).getByRole('switch', {
        name: 'Toggle personal-server',
      }),
    );

    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/mcp-servers/personal-server`,
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ enabled: false }),
        }),
      );
    });
  });

  it('enables Save when token input is edited', async () => {
    renderSettings();
    await waitForServersLoaded();
    await openConfigureModal('personal-server');

    const dialog = getModalDialog();
    expect(within(dialog).getByRole('button', { name: 'Save' })).toBeDisabled();

    fireEvent.change(within(dialog).getByLabelText('Type to filter'), {
      target: { value: 'edited-token' },
    });

    expect(within(dialog).getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('enables Save when enabled toggle changes with unchanged masked token', async () => {
    renderSettings();
    await waitForServersLoaded();
    await openConfigureModal('personal-server');

    const dialog = getModalDialog();
    expect(within(dialog).getByRole('button', { name: 'Save' })).toBeDisabled();

    fireEvent.click(
      within(dialog).getByRole('switch', {
        name: 'Toggle personal-server',
      }),
    );

    expect(within(dialog).getByRole('button', { name: 'Save' })).toBeEnabled();
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
    expect(
      within(dialog).getByText(
        'This server is currently disabled. Provide a token to enable.',
      ),
    ).toBeInTheDocument();
  });

  it('keeps status Disabled when switching to personal token with enabled off', async () => {
    servers = [
      connectedServer('org-disabled-server', {
        enabled: false,
        hasUserToken: false,
        hasOrgToken: true,
        hasToken: true,
        toolCount: 2,
      }),
    ];

    renderSettings();
    await waitFor(() => {
      expect(screen.getByText('org-disabled-server')).toBeInTheDocument();
    });
    await openConfigureModal('org-disabled-server');

    const dialog = getModalDialog();
    await waitFor(() => {
      expect(within(dialog).getByText('Disabled')).toBeInTheDocument();
    });

    fireEvent.click(
      within(dialog).getByRole('radio', { name: 'Use personal token' }),
    );

    expect(within(dialog).getByText('Disabled')).toBeInTheDocument();
    expect(within(dialog).queryByText('2 tools')).not.toBeInTheDocument();

    fireEvent.change(within(dialog).getByLabelText('Type to filter'), {
      target: { value: 'draft-token' },
    });

    expect(within(dialog).getByText('Disabled')).toBeInTheDocument();
    expect(within(dialog).queryByText('2 tools')).not.toBeInTheDocument();
    expect(within(dialog).queryByText('Tools (2)')).not.toBeInTheDocument();
    expect(
      within(dialog).getByRole('switch', {
        name: 'Toggle org-disabled-server',
      }),
    ).not.toBeChecked();
  });

  it('does not show connected status while drafting a personal token', async () => {
    servers = [
      connectedServer('org-enabled-server', {
        enabled: true,
        hasUserToken: false,
        hasOrgToken: true,
        hasToken: true,
        toolCount: 2,
      }),
    ];

    renderSettings();
    await waitFor(() => {
      expect(screen.getByText('org-enabled-server')).toBeInTheDocument();
    });
    await openConfigureModal('org-enabled-server');

    const dialog = getModalDialog();
    await waitFor(() => {
      expect(within(dialog).getByText('2 tools')).toBeInTheDocument();
    });

    fireEvent.click(
      within(dialog).getByRole('radio', { name: 'Use personal token' }),
    );
    fireEvent.change(within(dialog).getByLabelText('Type to filter'), {
      target: { value: 'draft-token' },
    });

    expect(within(dialog).queryByText('2 tools')).not.toBeInTheDocument();
    expect(within(dialog).queryByText('Tools (2)')).not.toBeInTheDocument();
    expect(within(dialog).getByText('Token required')).toBeInTheDocument();
    expect(
      within(dialog).getByRole('switch', {
        name: 'Toggle org-enabled-server',
      }),
    ).not.toBeChecked();
    expect(within(dialog).getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('disables Save after failed token save with credential mode change until input is edited', async () => {
    servers = [
      connectedServer('org-enabled-server', {
        enabled: true,
        hasUserToken: false,
        hasOrgToken: true,
        hasToken: true,
        toolCount: 2,
      }),
    ];

    renderSettings();
    await waitFor(() => {
      expect(screen.getByText('org-enabled-server')).toBeInTheDocument();
    });
    await openConfigureModal('org-enabled-server');

    const dialog = getModalDialog();
    fireEvent.click(
      within(dialog).getByRole('radio', { name: 'Use personal token' }),
    );
    fireEvent.change(within(dialog).getByLabelText('Type to filter'), {
      target: { value: 'bad-token' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(
        within(dialog).getByText(
          'Invalid credentials. Check server URL and token.',
        ),
      ).toBeInTheDocument();
    });
    expect(within(dialog).getByRole('button', { name: 'Save' })).toBeDisabled();

    fireEvent.change(within(dialog).getByLabelText('Type to filter'), {
      target: { value: 'bad-token!' },
    });
    expect(within(dialog).getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('hides token field when organization default token is selected', async () => {
    renderSettings();
    await waitForServersLoaded();
    await openConfigureModal('personal-server');

    const dialog = getModalDialog();
    fireEvent.click(
      within(dialog).getByRole('radio', {
        name: 'Use organization default token',
      }),
    );

    expect(
      within(dialog).queryByLabelText('Type to filter'),
    ).not.toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('saves organization credential mode by clearing personal token', async () => {
    renderSettings();
    await waitForServersLoaded();
    await openConfigureModal('personal-server');

    const dialog = getModalDialog();
    fireEvent.click(
      within(dialog).getByRole('radio', {
        name: 'Use organization default token',
      }),
    );
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/mcp-servers/personal-server`,
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ token: null, enabled: true }),
        }),
      );
    });
  });

  it('enables Save after switching to organization token and re-enabling', async () => {
    renderSettings();
    await waitForServersLoaded();
    await openConfigureModal('personal-server');

    const dialog = getModalDialog();
    fireEvent.click(
      within(dialog).getByRole('radio', {
        name: 'Use organization default token',
      }),
    );
    fireEvent.click(
      within(dialog).getByRole('switch', {
        name: 'Toggle personal-server',
      }),
    );

    expect(within(dialog).getByRole('button', { name: 'Save' })).toBeEnabled();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/mcp-servers/personal-server`,
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ token: null, enabled: false }),
        }),
      );
    });
  });

  it('disables Save after failed token save until input is edited', async () => {
    servers = [
      connectedServer('credential-test-mcp', {
        url: 'http://127.0.0.1:7777/mcp',
        enabled: false,
        hasToken: false,
        hasUserToken: false,
        hasOrgToken: false,
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
    const tokenField = within(dialog).getByLabelText('Type to filter');
    fireEvent.change(tokenField, { target: { value: 'bad-token' } });
    expect(within(dialog).getByRole('button', { name: 'Save' })).toBeEnabled();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(
        within(dialog).getByText(
          'Invalid credentials. Check server URL and token.',
        ),
      ).toBeInTheDocument();
    });
    expect(within(dialog).getByRole('button', { name: 'Save' })).toBeDisabled();

    fireEvent.change(tokenField, { target: { value: 'bad-token!' } });
    expect(within(dialog).getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('auto-enables server after saving a valid token', async () => {
    servers = [
      connectedServer('credential-test-mcp', {
        url: 'http://127.0.0.1:7777/mcp',
        enabled: false,
        hasToken: false,
        hasUserToken: false,
        hasOrgToken: false,
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
