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
import { ThemeProvider, createTheme } from '@mui/material/styles';
// eslint-disable-next-line @backstage/no-undeclared-imports
import { TestApiProvider } from '@backstage/test-utils';
import { augmentApiRef, type AugmentApi } from '../../../api';
import { KagentiToolDetailDrawer } from './KagentiToolDetailDrawer';
import type { KagentiToolSummary } from '@red-hat-developer-hub/backstage-plugin-augment-common';

const theme = createTheme();

const MOCK_TOOL: KagentiToolSummary = {
  name: 'weather-tool',
  namespace: 'team-a',
  description: 'Fetches weather data',
  status: 'Running',
  labels: { protocol: ['mcp'], framework: 'Python' },
  workloadType: 'deployment',
  createdAt: '2025-01-15T10:00:00Z',
};

function createMockApi(overrides: Partial<Record<string, jest.Mock>> = {}) {
  return {
    getKagentiTool: jest.fn().mockResolvedValue({
      metadata: {},
      spec: {
        protocol: 'mcp',
        framework: 'Python',
        containerImage: 'quay.io/weather:v1',
        envVars: [
          { name: 'API_KEY', value: 'test-key' },
          {
            name: 'DB_PASS',
            valueFrom: { secretKeyRef: { name: 'db-secret', key: 'pass' } },
          },
        ],
        servicePorts: [
          { name: 'http', port: 8080, targetPort: 8080, protocol: 'TCP' },
        ],
      },
      status: {},
    }),
    getToolRouteStatus: jest.fn().mockResolvedValue({
      ready: true,
      status: 'active',
    }),
    getToolBuildInfo: jest.fn().mockRejectedValue(new Error('not found')),
    connectKagentiTool: jest.fn().mockResolvedValue({ tools: [] }),
    invokeKagentiTool: jest.fn().mockResolvedValue({ result: 'ok' }),
    triggerToolBuild: jest.fn().mockResolvedValue({}),
    finalizeToolBuild: jest.fn().mockResolvedValue({}),
    ...overrides,
  };
}

function renderDrawer(
  tool: KagentiToolSummary | null = MOCK_TOOL,
  open = true,
  apiOverrides: Partial<Record<string, jest.Mock>> = {},
) {
  const onClose = jest.fn();
  const api = createMockApi(apiOverrides);
  const result = render(
    <ThemeProvider theme={theme}>
      <TestApiProvider apis={[[augmentApiRef, api as unknown as AugmentApi]]}>
        <KagentiToolDetailDrawer open={open} tool={tool} onClose={onClose} />
      </TestApiProvider>
    </ThemeProvider>,
  );
  return { ...result, onClose, api };
}

describe('KagentiToolDetailDrawer — rendering', () => {
  it('renders tool name and namespace', async () => {
    renderDrawer();
    expect(screen.getByText('weather-tool')).toBeInTheDocument();
    expect(screen.getByText('team-a')).toBeInTheDocument();
  });

  it('renders status chip', () => {
    renderDrawer();
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('renders protocol and framework badges', () => {
    renderDrawer();
    expect(screen.getByText('MCP')).toBeInTheDocument();
    expect(screen.getByText('Python')).toBeInTheDocument();
  });

  it('renders nothing when tool is null', () => {
    const { container } = renderDrawer(null);
    expect(container.querySelector('.MuiDrawer-root')).toBeNull();
  });

  it('renders nothing when closed', () => {
    renderDrawer(MOCK_TOOL, false);
    expect(screen.queryByText('weather-tool')).not.toBeInTheDocument();
  });
});

describe('KagentiToolDetailDrawer — detail loading', () => {
  it('loads tool detail from API', async () => {
    const { api } = renderDrawer();
    await waitFor(() => {
      expect(api.getKagentiTool).toHaveBeenCalledWith('team-a', 'weather-tool');
    });
  });

  it('loads route status from API', async () => {
    const { api } = renderDrawer();
    await waitFor(() => {
      expect(api.getToolRouteStatus).toHaveBeenCalledWith(
        'team-a',
        'weather-tool',
      );
    });
  });
});

describe('KagentiToolDetailDrawer — spec display', () => {
  it('shows spec fields after loading', async () => {
    renderDrawer();
    await waitFor(() => {
      expect(screen.getByText('quay.io/weather:v1')).toBeInTheDocument();
    });
  });

  it('shows env vars as expanded list', async () => {
    renderDrawer();
    await waitFor(() => {
      expect(screen.getByText(/API_KEY/)).toBeInTheDocument();
      expect(screen.getByText(/test-key/)).toBeInTheDocument();
      expect(screen.getByText(/DB_PASS/)).toBeInTheDocument();
    });
  });

  it('shows service ports as expanded list', async () => {
    renderDrawer();
    await waitFor(() => {
      expect(screen.getByText(/http: 8080/)).toBeInTheDocument();
    });
  });
});

describe('KagentiToolDetailDrawer — overview', () => {
  it('shows description', () => {
    renderDrawer();
    expect(screen.getByText('Fetches weather data')).toBeInTheDocument();
  });

  it('shows workload type', () => {
    renderDrawer();
    expect(screen.getByText('deployment')).toBeInTheDocument();
  });
});

describe('KagentiToolDetailDrawer — route status', () => {
  it('shows route status chips', async () => {
    renderDrawer();
    await waitFor(() => {
      expect(screen.getByText(/ready: true/)).toBeInTheDocument();
    });
  });
});

describe('KagentiToolDetailDrawer — error handling', () => {
  it('shows error when detail load fails', async () => {
    renderDrawer(MOCK_TOOL, true, {
      getKagentiTool: jest.fn().mockRejectedValue(new Error('Load failed')),
    });
    await waitFor(() => {
      expect(screen.getByText(/Load failed/i)).toBeInTheDocument();
    });
  });
});
