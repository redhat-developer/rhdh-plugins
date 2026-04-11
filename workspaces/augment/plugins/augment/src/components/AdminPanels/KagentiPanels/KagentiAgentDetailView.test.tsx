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

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import type { ApiRef } from '@backstage/core-plugin-api';
import { useApi } from '@backstage/core-plugin-api';
import { augmentApiRef } from '../../../api';
import { KagentiAgentDetailView } from './KagentiAgentDetailView';
import {
  makeKagentiAgentCard,
  makeKagentiAgentSummary,
} from './kagentiTestFixtures';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));

const mockedUseApi = jest.mocked(useApi);

const theme = createTheme();

function createDetailMockApi(overrides = {}) {
  const agentCard = makeKagentiAgentCard({
    name: 'Card Display Name',
    streaming: true,
  });
  return {
    getKagentiAgent: jest.fn().mockResolvedValue({
      metadata: { uid: 'uid-1' },
      spec: {},
      status: {},
      agentCard,
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
    ...overrides,
  };
}

function renderDetail(props = {}, apiOverrides = {}) {
  const onBack = jest.fn();
  const onChatWithAgent = jest.fn();
  const agent = makeKagentiAgentSummary({ name: 'my-agent', status: 'ready' });
  const api = createDetailMockApi(apiOverrides);
  mockedUseApi.mockImplementation((ref: ApiRef<unknown>) => {
    if (ref === augmentApiRef) {
      return api;
    }
    return jest.requireActual('@backstage/core-plugin-api').useApi(ref);
  });
  const view = render(
    <ThemeProvider theme={theme}>
      <KagentiAgentDetailView
        agent={agent}
        onBack={onBack}
        onChatWithAgent={onChatWithAgent}
        {...props}
      />
    </ThemeProvider>,
  );
  return { ...view, onBack, onChatWithAgent, api, agent };
}

describe('KagentiAgentDetailView', () => {
  beforeEach(() => {
    mockedUseApi.mockReset();
  });

  it('shows loading skeletons in Details tab while agent detail loads', async () => {
    renderDetail(
      {},
      {
        getKagentiAgent: jest.fn(() => new Promise(() => {})),
      },
    );
    expect(
      document.querySelectorAll('.MuiSkeleton-root').length,
    ).toBeGreaterThan(0);
  });

  it('shows error alert when getKagentiAgent fails', async () => {
    renderDetail(
      {},
      {
        getKagentiAgent: jest.fn().mockRejectedValue(new Error('load failed')),
      },
    );
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('load failed');
    });
  });

  it('renders header with agent name from card when present', async () => {
    renderDetail();
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Card Display Name/i }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText('ready').closest('.MuiChip-root')).toHaveClass(
      'MuiChip-colorSuccess',
    );
  });

  it('renders Agent Card section when agent card data is available', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText('Agent Card')).toBeInTheDocument();
    });
    expect(
      screen.getAllByText('Card Display Name').length,
    ).toBeGreaterThanOrEqual(1);
  });

  it('falls back to summary name when agent card is absent', async () => {
    renderDetail(
      {},
      {
        getKagentiAgent: jest.fn().mockResolvedValue({
          metadata: {},
          spec: {},
          status: {},
        }),
      },
    );
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /my-agent/i }),
      ).toBeInTheDocument();
    });
  });

  it('switches between Details, Status, and Resource tabs', async () => {
    const user = userEvent.setup();
    renderDetail();
    await waitFor(() =>
      expect(screen.getByText('Agent Information')).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('tab', { name: /^Status$/i }));
    await waitFor(() =>
      expect(screen.getByText('Shipwright Build Status')).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('tab', { name: /^Resource$/i }));
    await waitFor(() => {
      expect(screen.getByText(/"metadata"/)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: /^Details$/i }));
    await waitFor(() =>
      expect(screen.getByText('Agent Information')).toBeInTheDocument(),
    );
  });

  it('calls onBack when back button is clicked', async () => {
    const user = userEvent.setup();
    const { onBack } = renderDetail();
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /Card Display Name/i }),
      ).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: /Agents/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('triggers build via triggerKagentiBuild when Rebuild is clicked', async () => {
    const user = userEvent.setup();
    const { api } = renderDetail();
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /^Rebuild$/ }),
      ).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: /^Rebuild$/ }));

    await waitFor(() => {
      expect(api.triggerKagentiBuild).toHaveBeenCalledWith(
        'team-a',
        'my-agent',
      );
    });
  });

  it('shows Building... while triggerKagentiBuild is in flight', async () => {
    const user = userEvent.setup();
    let resolveBuild: () => void = () => {};
    const buildPromise = new Promise<void>(r => {
      resolveBuild = r;
    });
    renderDetail(
      {},
      {
        triggerKagentiBuild: jest.fn().mockReturnValue(buildPromise),
      },
    );
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /^Rebuild$/ }),
      ).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: /^Rebuild$/ }));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /^Building\.\.\.$/ }),
      ).toBeDisabled(),
    );
    resolveBuild();
  });

  it('calls onChatWithAgent with namespace/name when Chat is clicked', async () => {
    const user = userEvent.setup();
    const { onChatWithAgent } = renderDetail();
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /^Chat$/ }),
      ).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: /^Chat$/ }));
    expect(onChatWithAgent).toHaveBeenCalledWith('team-a/my-agent');
  });

  it('does not render Chat when onChatWithAgent is omitted', async () => {
    const api = createDetailMockApi({
      getKagentiAgent: jest.fn().mockResolvedValue({
        metadata: {},
        spec: {},
        status: {},
      }),
    });
    mockedUseApi.mockImplementation((ref: ApiRef<unknown>) => {
      if (ref === augmentApiRef) {
        return api;
      }
      return jest.requireActual('@backstage/core-plugin-api').useApi(ref);
    });
    const agent = makeKagentiAgentSummary({ name: 'solo' });
    render(
      <ThemeProvider theme={theme}>
        <KagentiAgentDetailView agent={agent} onBack={jest.fn()} />
      </ThemeProvider>,
    );
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /solo/i }),
      ).toBeInTheDocument(),
    );
    expect(
      screen.queryByRole('button', { name: /^Chat$/ }),
    ).not.toBeInTheDocument();
  });

  it('shows error when build fails and dismisses alert', async () => {
    const user = userEvent.setup();
    renderDetail(
      {},
      {
        triggerKagentiBuild: jest
          .fn()
          .mockRejectedValue(new Error('build broke')),
      },
    );
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /^Rebuild$/ }),
      ).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: /^Rebuild$/ }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('build broke');
    });

    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByText('build broke')).not.toBeInTheDocument();
  });

  it('renders protocol and framework chips from agent labels', async () => {
    const agent = makeKagentiAgentSummary({
      name: 'labeled',
      labels: { protocol: 'http', framework: 'Python' },
    });
    const api = createDetailMockApi();
    mockedUseApi.mockImplementation((ref: ApiRef<unknown>) => {
      if (ref === augmentApiRef) {
        return api;
      }
      return jest.requireActual('@backstage/core-plugin-api').useApi(ref);
    });
    render(
      <ThemeProvider theme={theme}>
        <KagentiAgentDetailView
          agent={agent}
          onBack={jest.fn()}
          onChatWithAgent={jest.fn()}
        />
      </ThemeProvider>,
    );
    await waitFor(() => expect(screen.getByText('HTTP')).toBeInTheDocument());
    expect(screen.getByText('Python')).toBeInTheDocument();
  });

  it('uses error chip color for failed status in header', async () => {
    const agent = makeKagentiAgentSummary({ name: 'bad', status: 'failed' });
    const api = createDetailMockApi();
    mockedUseApi.mockImplementation((ref: ApiRef<unknown>) => {
      if (ref === augmentApiRef) {
        return api;
      }
      return jest.requireActual('@backstage/core-plugin-api').useApi(ref);
    });
    render(
      <ThemeProvider theme={theme}>
        <KagentiAgentDetailView
          agent={agent}
          onBack={jest.fn()}
          onChatWithAgent={jest.fn()}
        />
      </ThemeProvider>,
    );
    await waitFor(() => expect(screen.getByText('failed')).toBeInTheDocument());
    expect(screen.getByText('failed').closest('.MuiChip-root')).toHaveClass(
      'MuiChip-colorError',
    );
  });

  it('refetches build info after successful build trigger', async () => {
    const user = userEvent.setup();
    const getKagentiBuildInfo = jest.fn().mockResolvedValue({
      name: 'my-agent',
      namespace: 'team-a',
      buildRegistered: true,
      outputImage: 'img:v1',
      strategy: 's',
      gitUrl: '',
      gitRevision: '',
      contextDir: '',
      hasBuildRun: true,
    });
    const { api } = renderDetail({}, { getKagentiBuildInfo });
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /^Rebuild$/ }),
      ).toBeInTheDocument(),
    );
    const initialCalls = getKagentiBuildInfo.mock.calls.length;

    await user.click(screen.getByRole('button', { name: /^Rebuild$/ }));

    await waitFor(() => {
      expect(getKagentiBuildInfo.mock.calls.length).toBeGreaterThan(
        initialCalls,
      );
    });
    expect(api.triggerKagentiBuild).toHaveBeenCalled();
  });
});
