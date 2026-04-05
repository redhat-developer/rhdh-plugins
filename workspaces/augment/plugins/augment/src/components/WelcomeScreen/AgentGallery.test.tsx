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
// eslint-disable-next-line @backstage/no-undeclared-imports
import { TestApiProvider } from '@backstage/test-utils';
import { augmentApiRef, type AugmentApi } from '../../api';
import { AgentGallery } from './AgentGallery';

const theme = createTheme();

const MOCK_AGENTS = [
  {
    name: 'weather-bot',
    namespace: 'prod',
    description: 'Weather forecaster',
    status: 'Running',
    labels: { protocol: ['a2a'], framework: 'LangGraph' },
    createdAt: '2024-06-01T00:00:00Z',
    agentCard: {
      name: 'Weather Bot',
      version: '1.0',
      url: 'http://example.com',
      streaming: true,
      skills: [
        { id: 'forecast', name: 'Forecast', description: 'Gets weather' },
      ],
    },
  },
  {
    name: 'code-helper',
    namespace: 'dev',
    description: 'Code assistant',
    status: 'Pending',
    labels: { protocol: ['a2a'], framework: 'CrewAI' },
    createdAt: '2024-05-01T00:00:00Z',
    agentCard: {
      name: 'Code Helper',
      version: '2.0',
      url: '',
      skills: [],
    },
  },
];

function createMockApi(overrides: Partial<Record<string, jest.Mock>> = {}) {
  return {
    listKagentiAgents: jest.fn().mockResolvedValue({ agents: MOCK_AGENTS }),
    getKagentiAgent: jest.fn().mockResolvedValue({}),
    ...overrides,
  } as unknown as AugmentApi;
}

function renderGallery(
  api?: AugmentApi,
  props: Partial<React.ComponentProps<typeof AgentGallery>> = {},
) {
  const mockApi = api ?? createMockApi();
  return render(
    <ThemeProvider theme={theme}>
      <TestApiProvider apis={[[augmentApiRef, mockApi]]}>
        <AgentGallery onAgentSelect={jest.fn()} {...props} />
      </TestApiProvider>
    </ThemeProvider>,
  );
}

describe('AgentGallery', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders loading skeleton initially', () => {
    const api = createMockApi({
      listKagentiAgents: jest.fn().mockReturnValue(new Promise(() => {})),
    });
    renderGallery(api);
    expect(screen.getByText('Agents')).toBeInTheDocument();
  });

  it('renders agent cards after loading', async () => {
    renderGallery();
    await waitFor(() => {
      expect(screen.getByText('Weather Bot')).toBeInTheDocument();
    });
    expect(screen.getByText('Code Helper')).toBeInTheDocument();
  });

  it('renders error state on API failure', async () => {
    const api = createMockApi({
      listKagentiAgents: jest
        .fn()
        .mockRejectedValue(new Error('Network error')),
    });
    renderGallery(api);
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('renders empty state when no agents', async () => {
    const api = createMockApi({
      listKagentiAgents: jest.fn().mockResolvedValue({ agents: [] }),
    });
    renderGallery(api);
    await waitFor(() => {
      expect(screen.getByText(/no agents available/i)).toBeInTheDocument();
    });
  });

  it('filters agents by search query', async () => {
    renderGallery();
    await waitFor(() => {
      expect(screen.getByText('Weather Bot')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText(/search agents/i);
    await user.type(searchInput, 'weather');

    expect(screen.getByText('Weather Bot')).toBeInTheDocument();
    expect(screen.queryByText('Code Helper')).not.toBeInTheDocument();
  });

  it('shows "no match" message when search has no results', async () => {
    renderGallery();
    await waitFor(() => {
      expect(screen.getByText('Weather Bot')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText(/search agents/i);
    await user.type(searchInput, 'zzzzzzz');

    expect(screen.getByText(/no agents match/i)).toBeInTheDocument();
  });

  it('calls onAgentSelect when an agent card is clicked', async () => {
    const onAgentSelect = jest.fn();
    renderGallery(undefined, { onAgentSelect });
    await waitFor(() => {
      expect(screen.getByText('Weather Bot')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('Weather Bot'));
    expect(onAgentSelect).toHaveBeenCalledWith(
      'prod/weather-bot',
      'Weather Bot',
    );
  });

  it('renders the agent list with role="list"', async () => {
    renderGallery();
    await waitFor(() => {
      expect(
        screen.getByRole('list', { name: /available agents/i }),
      ).toBeInTheDocument();
    });
  });
});
