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

import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import type { KagentiMcpToolSchema } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { McpToolCatalog } from './McpToolCatalog';

const theme = createTheme();

function renderCatalog(
  tools: KagentiMcpToolSchema[],
  onInvoke?: (name: string) => void,
) {
  return render(
    <ThemeProvider theme={theme}>
      <McpToolCatalog tools={tools} onInvoke={onInvoke} />
    </ThemeProvider>,
  );
}

describe('McpToolCatalog — empty', () => {
  it('shows empty state when no tools', () => {
    renderCatalog([]);
    expect(screen.getByText(/No MCP tools discovered/i)).toBeInTheDocument();
  });
});

describe('McpToolCatalog — rendering tools', () => {
  const tools: KagentiMcpToolSchema[] = [
    {
      name: 'get_weather',
      description: 'Fetches weather data for a location',
      input_schema: {
        type: 'object',
        properties: {
          city: { type: 'string', description: 'City name' },
          unit: { type: 'string', description: 'Temperature unit' },
        },
        required: ['city'],
      },
    },
    {
      name: 'simple_tool',
    },
  ];

  it('renders tool names', () => {
    renderCatalog(tools);
    expect(screen.getByText('get_weather')).toBeInTheDocument();
    expect(screen.getByText('simple_tool')).toBeInTheDocument();
  });

  it('shows Invoke buttons when onInvoke provided', () => {
    renderCatalog(tools, jest.fn());
    const invokeButtons = screen.getAllByRole('button', { name: /invoke/i });
    expect(invokeButtons.length).toBeGreaterThanOrEqual(2);
  });

  it('passes onInvoke callback for invoke buttons', () => {
    const onInvoke = jest.fn();
    renderCatalog(tools, onInvoke);
    const invokeButtons = screen.getAllByRole('button', { name: /invoke/i });
    expect(invokeButtons.length).toBeGreaterThanOrEqual(2);
  });

  it('does not show Invoke button when onInvoke omitted', () => {
    renderCatalog(tools);
    expect(
      screen.queryByRole('button', { name: /invoke/i }),
    ).not.toBeInTheDocument();
  });
});

describe('McpToolCatalog — schema without properties', () => {
  it('shows "No input parameters" for schema with no properties', () => {
    const tools: KagentiMcpToolSchema[] = [
      { name: 'noop', input_schema: { type: 'object' } },
    ];
    renderCatalog(tools);
    expect(screen.getByText('noop')).toBeInTheDocument();
  });

  it('shows "No input schema" for tool without schema', () => {
    const tools: KagentiMcpToolSchema[] = [{ name: 'bare_tool' }];
    renderCatalog(tools);
    expect(screen.getByText('bare_tool')).toBeInTheDocument();
  });
});
