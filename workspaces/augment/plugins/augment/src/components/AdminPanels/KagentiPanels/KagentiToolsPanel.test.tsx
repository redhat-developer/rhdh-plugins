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
import { augmentApiRef, type AugmentApi } from '../../../api';
import { KagentiToolsPanel } from './KagentiToolsPanel';
import type { KagentiToolSummary } from '@red-hat-developer-hub/backstage-plugin-augment-common';

const theme = createTheme();

const MOCK_TOOLS: KagentiToolSummary[] = [
  {
    name: 'weather-tool',
    namespace: 'team-a',
    description: 'Fetches weather data',
    status: 'Running',
    labels: { protocol: ['mcp'], framework: 'Python' },
    workloadType: 'deployment',
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    name: 'db-tool',
    namespace: 'team-b',
    description: 'Database queries',
    status: 'Pending',
    labels: { protocol: ['http'] },
    workloadType: 'statefulset',
    createdAt: '2025-01-10T08:00:00Z',
  },
];

function createMockApi(overrides: Partial<Record<string, jest.Mock>> = {}) {
  return {
    listKagentiTools: jest.fn().mockResolvedValue({ tools: MOCK_TOOLS }),
    deleteKagentiTool: jest.fn().mockResolvedValue(undefined),
    connectKagentiTool: jest.fn().mockResolvedValue({ tools: [] }),
    invokeKagentiTool: jest.fn().mockResolvedValue({ result: 'ok' }),
    listKagentiBuildStrategies: jest.fn().mockResolvedValue({ strategies: [] }),
    listKagentiNamespaces: jest.fn().mockResolvedValue({ namespaces: [] }),
    createKagentiTool: jest
      .fn()
      .mockResolvedValue({
        success: true,
        name: 'new',
        namespace: 'ns',
        message: 'ok',
      }),
    getKagentiTool: jest
      .fn()
      .mockResolvedValue({ metadata: {}, spec: {}, status: {} }),
    getToolRouteStatus: jest.fn().mockResolvedValue({}),
    getToolBuildInfo: jest.fn().mockRejectedValue(new Error('not found')),
    ...overrides,
  };
}

function renderPanel(apiOverrides: Partial<Record<string, jest.Mock>> = {}) {
  const api = createMockApi(apiOverrides);
  const result = render(
    <ThemeProvider theme={theme}>
      <TestApiProvider apis={[[augmentApiRef, api as unknown as AugmentApi]]}>
        <KagentiToolsPanel />
      </TestApiProvider>
    </ThemeProvider>,
  );
  return { ...result, api };
}

describe('KagentiToolsPanel — rendering', () => {
  it('renders heading and new tool button', async () => {
    renderPanel();
    expect(screen.getByText('Tools')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /New Tool/i }),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('weather-tool')).toBeInTheDocument();
    });
  });

  it('shows tool table with all tools', async () => {
    renderPanel();
    await waitFor(() => {
      expect(screen.getByText('weather-tool')).toBeInTheDocument();
      expect(screen.getByText('db-tool')).toBeInTheDocument();
    });
  });

  it('displays description column', async () => {
    renderPanel();
    await waitFor(() => {
      expect(screen.getByText('Fetches weather data')).toBeInTheDocument();
      expect(screen.getByText('Database queries')).toBeInTheDocument();
    });
  });

  it('displays protocol and framework chips', async () => {
    renderPanel();
    await waitFor(() => {
      expect(screen.getByText('MCP')).toBeInTheDocument();
      expect(screen.getByText('Python')).toBeInTheDocument();
      expect(screen.getByText('HTTP')).toBeInTheDocument();
    });
  });

  it('displays status chips', async () => {
    renderPanel();
    await waitFor(() => {
      expect(screen.getByText('Running')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });
});

describe('KagentiToolsPanel — empty state', () => {
  it('shows empty state when no tools', async () => {
    renderPanel({
      listKagentiTools: jest.fn().mockResolvedValue({ tools: [] }),
    });
    await waitFor(() => {
      expect(screen.getByText('No tools found')).toBeInTheDocument();
      expect(
        screen.getByText(/Create your first MCP tool/i),
      ).toBeInTheDocument();
    });
  });
});

describe('KagentiToolsPanel — search', () => {
  it('filters by name', async () => {
    renderPanel();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('weather-tool')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search tools/i);
    await user.type(searchInput, 'weather');

    expect(screen.getByText('weather-tool')).toBeInTheDocument();
    expect(screen.queryByText('db-tool')).not.toBeInTheDocument();
  });

  it('filters by description', async () => {
    renderPanel();
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('weather-tool')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search tools/i);
    await user.type(searchInput, 'Database');

    expect(screen.getByText('db-tool')).toBeInTheDocument();
    expect(screen.queryByText('weather-tool')).not.toBeInTheDocument();
  });
});

describe('KagentiToolsPanel — error handling', () => {
  it('shows error alert on load failure', async () => {
    renderPanel({
      listKagentiTools: jest.fn().mockRejectedValue(new Error('Network error')),
    });
    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });
});
