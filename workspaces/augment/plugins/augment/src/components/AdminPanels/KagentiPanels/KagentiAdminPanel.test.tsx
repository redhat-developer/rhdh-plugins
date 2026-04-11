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

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import type { ApiRef } from '@backstage/core-plugin-api';
import { useApi } from '@backstage/core-plugin-api';
import { augmentApiRef } from '../../../api';
import { KagentiAdminPanel } from './KagentiAdminPanel';
import { makeMigratableAgent } from './kagentiTestFixtures';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));

const mockedUseApi = jest.mocked(useApi);

const theme = createTheme();

const strategy = {
  name: 'buildah',
  description: 'Build with buildah',
};

function createAdminMockApi(overrides = {}) {
  return {
    fetchJson: jest.fn().mockResolvedValue({}),
    getAdminConfig: jest
      .fn()
      .mockResolvedValue({ entry: null, source: 'default' }),
    setAdminConfig: jest.fn().mockResolvedValue({}),
    deleteAdminConfig: jest.fn().mockResolvedValue({}),
    getKagentiDashboards: jest.fn().mockResolvedValue({
      keycloakConsole: 'https://keycloak.example/admin',
    }),
    listKagentiNamespaces: jest.fn().mockResolvedValue({
      namespaces: ['team-a', 'team-b'],
    }),
    listKagentiMigratableAgents: jest.fn().mockResolvedValue({
      agents: [
        makeMigratableAgent({ name: 'legacy-one', namespace: 'team-a' }),
      ],
    }),
    listKagentiBuildStrategies: jest.fn().mockResolvedValue({
      strategies: [strategy],
    }),
    migrateKagentiAgent: jest.fn().mockResolvedValue({}),
    migrateAllKagentiAgents: jest.fn().mockResolvedValue({}),
    ...overrides,
  };
}

function renderAdmin(apiOverrides = {}) {
  const api = createAdminMockApi(apiOverrides);
  mockedUseApi.mockImplementation((ref: ApiRef<unknown>) => {
    if (ref === augmentApiRef) {
      return api;
    }
    return jest.requireActual('@backstage/core-plugin-api').useApi(ref);
  });
  return {
    ...render(
      <ThemeProvider theme={theme}>
        <KagentiAdminPanel />
      </ThemeProvider>,
    ),
    api,
  };
}

describe('KagentiAdminPanel', () => {
  beforeEach(() => {
    mockedUseApi.mockReset();
  });

  it('shows centered progress while dashboard config loads', () => {
    const api = createAdminMockApi({
      getKagentiDashboards: jest.fn(() => new Promise(() => {})),
    });
    mockedUseApi.mockImplementation((ref: ApiRef<unknown>) => {
      if (ref === augmentApiRef) {
        return api;
      }
      return jest.requireActual('@backstage/core-plugin-api').useApi(ref);
    });
    render(
      <ThemeProvider theme={theme}>
        <KagentiAdminPanel />
      </ThemeProvider>,
    );
    expect(
      document.querySelector('.MuiCircularProgress-root'),
    ).toBeInTheDocument();
  });

  it('renders main administration sections after load', async () => {
    renderAdmin();
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /^Administration$/i }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText('Identity Management')).toBeInTheDocument();
    expect(screen.getByText('Namespace Management')).toBeInTheDocument();
    expect(screen.getByText('Agent Migration')).toBeInTheDocument();
    expect(screen.getByText('Build Strategies')).toBeInTheDocument();
    expect(screen.getByText('Platform Configuration')).toBeInTheDocument();
  });

  it('reloads namespaces when namespace section refresh is clicked', async () => {
    const user = userEvent.setup();
    const listKagentiNamespaces = jest.fn().mockResolvedValue({
      namespaces: ['unique-ns-refresh-test'],
    });
    renderAdmin({ listKagentiNamespaces });
    await waitFor(() => {
      expect(screen.getByText('Namespace Management')).toBeInTheDocument();
    });
    const nsCard = screen
      .getByText('Namespace Management')
      .closest('.MuiCard-root') as HTMLElement;
    expect(nsCard).toBeTruthy();
    await waitFor(() => {
      expect(
        within(nsCard).getByText('unique-ns-refresh-test'),
      ).toBeInTheDocument();
    });
    const initialCalls = listKagentiNamespaces.mock.calls.length;

    const refreshBtn = within(nsCard).getByRole('button', {
      name: /Refresh namespaces/i,
    });
    await user.click(refreshBtn);

    await waitFor(() => {
      expect(listKagentiNamespaces.mock.calls.length).toBeGreaterThan(
        initialCalls,
      );
    });
  });

  it('shows migration table and Migrate action for migratable agents', async () => {
    renderAdmin();
    await waitFor(() =>
      expect(screen.getByText('legacy-one')).toBeInTheDocument(),
    );
    expect(
      screen.getByRole('columnheader', { name: /^Agent$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: /^Migrate$/i }).length,
    ).toBeGreaterThan(0);
  });

  it('calls migrateKagentiAgent when Migrate is clicked', async () => {
    const user = userEvent.setup();
    const { api } = renderAdmin();
    await waitFor(() =>
      expect(screen.getByText('legacy-one')).toBeInTheDocument(),
    );

    await user.click(screen.getAllByRole('button', { name: /^Migrate$/i })[0]);

    await waitFor(() => {
      expect(api.migrateKagentiAgent).toHaveBeenCalledWith(
        'team-a',
        'legacy-one',
        false,
      );
    });
  });

  it('shows Migrate All when migratable agents exist', async () => {
    renderAdmin();
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Migrate All/i }),
      ).toBeInTheDocument(),
    );
  });

  it('calls migrateAllKagentiAgents when Migrate All is clicked', async () => {
    const user = userEvent.setup();
    const { api } = renderAdmin();
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Migrate All/i }),
      ).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: /Migrate All/i }));

    await waitFor(() => {
      expect(api.migrateAllKagentiAgents).toHaveBeenCalledWith({
        dryRun: false,
      });
    });
  });

  it('displays build strategy name and description', async () => {
    renderAdmin();
    await waitFor(() =>
      expect(screen.getByText('buildah')).toBeInTheDocument(),
    );
    expect(screen.getByText('Build with buildah')).toBeInTheDocument();
  });

  it('falls back gracefully when dashboard config fails to load', async () => {
    renderAdmin({
      getKagentiDashboards: jest.fn().mockRejectedValue(new Error('nope')),
    });
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /^Administration$/i }),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByText('Failed to load dashboard configuration.'),
    ).not.toBeInTheDocument();
  });

  it('shows API error when namespace list fails', async () => {
    renderAdmin({
      listKagentiNamespaces: jest.fn().mockRejectedValue(new Error('ns boom')),
    });
    await waitFor(() => {
      expect(screen.getByText('ns boom')).toBeInTheDocument();
    });
  });

  it('shows API error when migratable agents list fails', async () => {
    renderAdmin({
      listKagentiMigratableAgents: jest
        .fn()
        .mockRejectedValue(new Error('mig fail')),
    });
    await waitFor(() => {
      expect(screen.getByText('mig fail')).toBeInTheDocument();
    });
  });

  it('falls back gracefully when build strategies list fails', async () => {
    renderAdmin({
      listKagentiBuildStrategies: jest
        .fn()
        .mockRejectedValue(new Error('bs fail')),
    });
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /^Administration$/i }),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText('bs fail')).not.toBeInTheDocument();
  });

  it('dismisses error alert when closed', async () => {
    const user = userEvent.setup();
    renderAdmin({
      listKagentiNamespaces: jest.fn().mockRejectedValue(new Error('bad ns')),
    });
    await waitFor(() => expect(screen.getByText('bad ns')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByText('bad ns')).not.toBeInTheDocument();
  });
});
