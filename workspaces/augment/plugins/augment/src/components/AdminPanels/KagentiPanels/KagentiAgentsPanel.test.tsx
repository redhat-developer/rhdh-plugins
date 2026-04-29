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

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import type { ApiRef } from '@backstage/core-plugin-api';
import { useApi } from '@backstage/core-plugin-api';
import { augmentApiRef } from '../../../api';
import { KagentiAgentsPanel } from './KagentiAgentsPanel';
import { makeKagentiAgentSummary } from './kagentiTestFixtures';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));

const mockedUseApi = jest.mocked(useApi);

const theme = createTheme();

function createPanelMockApi(overrides = {}) {
  return {
    listKagentiAgents: jest.fn().mockResolvedValue({ agents: [] }),
    deleteKagentiAgent: jest.fn().mockResolvedValue(undefined),
    listKagentiBuildStrategies: jest.fn().mockResolvedValue({ strategies: [] }),
    listKagentiNamespaces: jest.fn().mockResolvedValue({ namespaces: [] }),
    createKagentiAgent: jest.fn().mockResolvedValue({ success: true }),
    getKagentiAgent: jest.fn().mockResolvedValue({
      metadata: {},
      spec: {},
      status: {},
    }),
    getKagentiBuildInfo: jest.fn().mockResolvedValue({
      name: 'x',
      namespace: 'y',
      buildRegistered: false,
      outputImage: '',
      strategy: '',
      gitUrl: '',
      gitRevision: '',
      contextDir: '',
      hasBuildRun: false,
    }),
    getKagentiAgentRouteStatus: jest.fn().mockResolvedValue({}),
    triggerKagentiBuild: jest.fn().mockResolvedValue({}),
    fetchJson: jest.fn().mockResolvedValue({}),
    ...overrides,
  };
}

function renderPanel(props = {}, apiOverrides = {}) {
  const api = createPanelMockApi(apiOverrides);
  mockedUseApi.mockImplementation((ref: ApiRef<unknown>) => {
    if (ref === augmentApiRef) {
      return api;
    }
    return jest.requireActual('@backstage/core-plugin-api').useApi(ref);
  });
  const view = render(
    <ThemeProvider theme={theme}>
      <KagentiAgentsPanel {...props} />
    </ThemeProvider>,
  );
  return { ...view, api };
}

describe('KagentiAgentsPanel', () => {
  beforeEach(() => {
    mockedUseApi.mockReset();
  });

  it('shows loading progress indicator while agents load', () => {
    const api = createPanelMockApi({
      listKagentiAgents: jest.fn(() => new Promise(() => {})),
    });
    mockedUseApi.mockImplementation((ref: ApiRef<unknown>) => {
      if (ref === augmentApiRef) {
        return api;
      }
      return jest.requireActual('@backstage/core-plugin-api').useApi(ref);
    });
    render(
      <ThemeProvider theme={theme}>
        <KagentiAgentsPanel />
      </ThemeProvider>,
    );
    expect(
      document.querySelector('.MuiCircularProgress-root'),
    ).toBeInTheDocument();
  });

  it('shows error alert when listKagentiAgents fails', async () => {
    renderPanel(
      {},
      {
        listKagentiAgents: jest
          .fn()
          .mockRejectedValue(new Error('network down')),
      },
    );
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('network down');
    });
  });

  it('shows empty state with create-first-agent messaging', async () => {
    renderPanel();
    await waitFor(() => {
      expect(screen.getByText('No agents found')).toBeInTheDocument();
    });
    expect(
      screen.getByText(/Create your first agent to get started/i),
    ).toBeInTheDocument();
  });

  it('empty state New Agent button opens create wizard', async () => {
    const user = userEvent.setup();
    renderPanel();
    await waitFor(() =>
      expect(screen.getByText('No agents found')).toBeInTheDocument(),
    );

    const createButtons = screen.getAllByRole('button', {
      name: /New Agent/i,
    });
    expect(createButtons.length).toBeGreaterThanOrEqual(1);
    await user.click(createButtons[createButtons.length - 1]);

    expect(
      screen.getByRole('dialog', { name: /New Agent/i }),
    ).toBeInTheDocument();
  });

  it('renders agent rows when data loads', async () => {
    const agents = [
      makeKagentiAgentSummary({ name: 'one', description: 'desc one' }),
      makeKagentiAgentSummary({
        name: 'two',
        namespace: 'team-b',
        description: 'desc two',
      }),
    ];
    renderPanel(
      {},
      {
        listKagentiAgents: jest.fn().mockResolvedValue({ agents }),
      },
    );
    await waitFor(() => {
      expect(screen.getByText('one')).toBeInTheDocument();
    });
    expect(screen.getByText('two')).toBeInTheDocument();
    expect(screen.getByText('desc one')).toBeInTheDocument();
  });

  it('filters agents by search on name', async () => {
    const agents = [
      makeKagentiAgentSummary({ name: 'apple-bot' }),
      makeKagentiAgentSummary({ name: 'banana-bot' }),
    ];
    renderPanel(
      {},
      {
        listKagentiAgents: jest.fn().mockResolvedValue({ agents }),
      },
    );
    await waitFor(() =>
      expect(screen.getByText('apple-bot')).toBeInTheDocument(),
    );

    const search = screen.getByPlaceholderText(/Search agents/i);
    fireEvent.change(search, { target: { value: 'banana' } });

    expect(screen.queryByText('apple-bot')).not.toBeInTheDocument();
    expect(screen.getByText('banana-bot')).toBeInTheDocument();
  });

  it('filters agents by search on description', async () => {
    const agents = [
      makeKagentiAgentSummary({ name: 'a1', description: 'handles invoices' }),
      makeKagentiAgentSummary({ name: 'a2', description: 'chat helper' }),
    ];
    renderPanel(
      {},
      {
        listKagentiAgents: jest.fn().mockResolvedValue({ agents }),
      },
    );
    await waitFor(() => expect(screen.getByText('a1')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/Search agents/i), {
      target: { value: 'invoice' },
    });

    expect(screen.getByText('a1')).toBeInTheDocument();
    expect(screen.queryByText('a2')).not.toBeInTheDocument();
  });

  it('opens delete confirmation dialog and calls deleteKagentiAgent on confirm', async () => {
    const user = userEvent.setup();
    const agent = makeKagentiAgentSummary({
      name: 'to-delete',
      namespace: 'ns-x',
    });
    const { api } = renderPanel(
      {},
      {
        listKagentiAgents: jest.fn().mockResolvedValue({ agents: [agent] }),
      },
    );

    await waitFor(() =>
      expect(screen.getByText('to-delete')).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: /Delete agent/i }));

    expect(
      screen.getByRole('heading', { name: /Delete agent/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`Delete agent ${agent.namespace}/${agent.name}?`),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Confirm$/i }));

    await waitFor(() => {
      expect(api.deleteKagentiAgent).toHaveBeenCalledWith('ns-x', 'to-delete');
    });
  });

  it('opens create wizard when header New Agent is clicked', async () => {
    const user = userEvent.setup();
    renderPanel(
      {},
      {
        listKagentiAgents: jest
          .fn()
          .mockResolvedValue({ agents: [makeKagentiAgentSummary()] }),
      },
    );
    await waitFor(() =>
      expect(screen.getByText('alpha-agent')).toBeInTheDocument(),
    );

    const createButtons = screen.getAllByRole('button', {
      name: /New Agent/i,
    });
    await user.click(createButtons[0]);

    expect(
      screen.getByRole('dialog', { name: /New Agent/i }),
    ).toBeInTheDocument();
  });

  it('navigates to detail view when a row is clicked', async () => {
    const user = userEvent.setup();
    const agent = makeKagentiAgentSummary({ name: 'detail-me' });
    renderPanel(
      {},
      {
        listKagentiAgents: jest.fn().mockResolvedValue({ agents: [agent] }),
      },
    );

    await waitFor(() =>
      expect(screen.getByText('detail-me')).toBeInTheDocument(),
    );
    await user.click(screen.getByText('detail-me'));

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Agents/i }),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole('heading', { name: /detail-me/i }),
    ).toBeInTheDocument();
  });

  it('refresh button calls listKagentiAgents again', async () => {
    const listKagentiAgents = jest
      .fn()
      .mockResolvedValue({ agents: [makeKagentiAgentSummary()] });
    renderPanel({}, { listKagentiAgents });

    await waitFor(() => expect(listKagentiAgents).toHaveBeenCalledTimes(1));

    const refreshBtn = screen.getByRole('button', { name: /Refresh/i });
    expect(refreshBtn).not.toBeDisabled();
    fireEvent.click(refreshBtn);

    await waitFor(() => expect(listKagentiAgents).toHaveBeenCalledTimes(2));
  });

  it('status chip uses success color for ready', async () => {
    renderPanel(
      {},
      {
        listKagentiAgents: jest.fn().mockResolvedValue({
          agents: [makeKagentiAgentSummary({ status: 'ready' })],
        }),
      },
    );
    await waitFor(() => expect(screen.getByText('ready')).toBeInTheDocument());
    const chip = screen.getByText('ready').closest('.MuiChip-root');
    expect(chip).toHaveClass('MuiChip-colorSuccess');
  });

  it('status chip uses error color for failed', async () => {
    renderPanel(
      {},
      {
        listKagentiAgents: jest.fn().mockResolvedValue({
          agents: [makeKagentiAgentSummary({ status: 'failed' })],
        }),
      },
    );
    await waitFor(() => expect(screen.getByText('failed')).toBeInTheDocument());
    expect(screen.getByText('failed').closest('.MuiChip-root')).toHaveClass(
      'MuiChip-colorError',
    );
  });

  it('status chip uses info color for building', async () => {
    renderPanel(
      {},
      {
        listKagentiAgents: jest.fn().mockResolvedValue({
          agents: [makeKagentiAgentSummary({ status: 'building' })],
        }),
      },
    );
    await waitFor(() =>
      expect(screen.getByText('building')).toBeInTheDocument(),
    );
    expect(screen.getByText('building').closest('.MuiChip-root')).toHaveClass(
      'MuiChip-colorInfo',
    );
  });

  it('status chip uses warning color for degraded', async () => {
    renderPanel(
      {},
      {
        listKagentiAgents: jest.fn().mockResolvedValue({
          agents: [makeKagentiAgentSummary({ status: 'degraded' })],
        }),
      },
    );
    await waitFor(() =>
      expect(screen.getByText('degraded')).toBeInTheDocument(),
    );
    expect(screen.getByText('degraded').closest('.MuiChip-root')).toHaveClass(
      'MuiChip-colorWarning',
    );
  });

  it('invokes onChatWithAgent from detail view when Chat is clicked', async () => {
    const user = userEvent.setup();
    const onChatWithAgent = jest.fn();
    const agent = makeKagentiAgentSummary({ name: 'chatty' });
    renderPanel(
      { onChatWithAgent },
      {
        listKagentiAgents: jest.fn().mockResolvedValue({ agents: [agent] }),
      },
    );

    await waitFor(() => expect(screen.getByText('chatty')).toBeInTheDocument());
    await user.click(screen.getByText('chatty'));

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /^Chat$/ }),
      ).toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', { name: /^Chat$/ }));

    expect(onChatWithAgent).toHaveBeenCalledWith('team-a/chatty');
  });

  it('dismisses list error alert when closed', async () => {
    const user = userEvent.setup();
    renderPanel(
      {},
      {
        listKagentiAgents: jest.fn().mockRejectedValue(new Error('boom')),
      },
    );
    await waitFor(() => expect(screen.getByText('boom')).toBeInTheDocument());

    const closeBtn = screen.getByRole('button', { name: /close/i });
    await user.click(closeBtn);

    expect(screen.queryByText('boom')).not.toBeInTheDocument();
  });
});
