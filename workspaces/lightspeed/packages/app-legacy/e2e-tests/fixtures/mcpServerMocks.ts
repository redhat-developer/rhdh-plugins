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

import type { LightspeedMessages } from '../utils/translations';
import { formatMcpToolCountStatus } from '../utils/translations';

/**
 * GET /api/lightspeed/mcp-servers body shape (see McpServersSettings McpServerResponse).
 * Use {@link mcpServer} for defaults; override fields per scenario.
 */
export type McpServerMockEntry = {
  name: string;
  /** Optional — some backends send it; not shown in the MCP table name/status cells. */
  url?: string;
  enabled: boolean;
  status: 'connected' | 'error' | 'unknown';
  toolCount: number;
  hasToken: boolean;
  hasUserToken: boolean;
};

export type McpServersListMock = {
  servers: McpServerMockEntry[];
};

/** Build one entry; defaults match a healthy connected server. */
export function mcpServer(
  name: string,
  overrides: Partial<Omit<McpServerMockEntry, 'name'>> = {},
): McpServerMockEntry {
  return {
    name,
    enabled: true,
    status: 'connected',
    toolCount: 0,
    hasToken: true,
    hasUserToken: false,
    ...overrides,
  };
}

/**
 * Expected MCP header “selected” line — mirrors McpServersSettings `selectedCount` useMemo
 * (`enabled && !failed && !tokenRequired`).
 */
export function getExpectedMcpSelectedCountForMock(
  mcpList: McpServersListMock,
): { selectedCount: number; totalCount: number } {
  const totalCount = mcpList.servers.length;
  const selectedCount = mcpList.servers.filter(
    server => server.enabled && server.hasToken && server.status !== 'error',
  ).length;
  return { selectedCount, totalCount };
}

/**
 * Expected Status column text for a mock row — mirrors McpServersSettings getDisplayStatus +
 * getDisplayDetail.
 */
export function getExpectedMcpStatusDetailForMock(
  server: McpServerMockEntry,
  t: LightspeedMessages,
): string {
  if (!server.hasToken) return t['mcp.settings.status.tokenRequired'];
  if (!server.enabled) return t['mcp.settings.status.disabled'];
  if (server.status === 'error') return t['mcp.settings.status.failed'];
  if (server.status === 'unknown') return t['mcp.settings.status.unknown'];
  return formatMcpToolCountStatus(t, server.toolCount);
}

/** Named presets for Playwright `mockMcpServers(page, scenario)` and panel assertions. */
export const mcpServerScenarios = {
  /** Default e2e: connected + tools + second row token-required. */
  default: {
    servers: [
      {
        name: 'mcp-integration-tools',
        url: 'http://localhost:7008/api/mcp-actions/v1',
        enabled: true,
        status: 'connected' as const,
        toolCount: 14,
        hasToken: true,
        hasUserToken: false,
      },
      {
        name: 'test-mcp-server',
        url: 'http://localhost:8888/mcp',
        enabled: true,
        status: 'unknown' as const,
        toolCount: 0,
        hasToken: false,
        hasUserToken: false,
      },
    ],
  } satisfies McpServersListMock,

  empty: { servers: [] } satisfies McpServersListMock,

  allHealthy: {
    servers: [
      mcpServer('alpha-mcp', { toolCount: 3 }),
      mcpServer('beta-mcp', { toolCount: 27 }),
    ],
  } satisfies McpServersListMock,

  /** Single row — exercises "1 tool" (singular) copy. */
  singularTool: {
    servers: [mcpServer('single-tool-server', { toolCount: 1 })],
  } satisfies McpServersListMock,

  /** One failed row + one ok row. */
  errorAndOk: {
    servers: [
      mcpServer('failing-mcp', { status: 'error', toolCount: 0 }),
      mcpServer('ok-mcp', { toolCount: 5 }),
    ],
  } satisfies McpServersListMock,

  /** Disabled row still lists toolCount in model but UI shows "Disabled". */
  disabledAndOk: {
    servers: [
      mcpServer('disabled-mcp', { enabled: false, toolCount: 12 }),
      mcpServer('active-mcp', { toolCount: 2 }),
    ],
  } satisfies McpServersListMock,

  /** Both rows require a token — header shows "0 of 2 selected". */
  twoTokenRequired: {
    servers: [
      mcpServer('needs-token-a', {
        hasToken: false,
        toolCount: 0,
        status: 'unknown',
      }),
      mcpServer('needs-token-b', {
        hasToken: false,
        toolCount: 0,
        status: 'unknown',
      }),
    ],
  } satisfies McpServersListMock,

  /** Connected + token + unknown API status → "Unknown" in Status column. */
  unknownStatus: {
    servers: [mcpServer('ambiguous-mcp', { status: 'unknown', toolCount: 99 })],
  } satisfies McpServersListMock,

  onlyTokenRequired: {
    servers: [
      mcpServer('needs-token', {
        hasToken: false,
        toolCount: 0,
        status: 'unknown',
      }),
    ],
  } satisfies McpServersListMock,
};

export const mockedMcpServersResponse: McpServersListMock =
  mcpServerScenarios.default;

/**
 * Token accepted by e2e route mocks for `POST .../mcp-servers/validate`
 * (credential check before PATCH).
 */
export const E2E_MCP_VALID_TOKEN = 'e2e-mcp-valid-token';

/** One row with `url` set so the configure modal runs credential + server validation. */
export const tokenCredentialValidationScenario = {
  servers: [
    mcpServer('credential-test-mcp', {
      hasToken: false,
      toolCount: 0,
      status: 'unknown',
      url: 'http://127.0.0.1:7777/mcp',
    }),
  ],
} satisfies McpServersListMock;

/** Token required but no `url` — UI must not call credential validate (shows URL error). */
export const tokenCredentialNoUrlScenario = {
  servers: [
    mcpServer('no-url-mcp', {
      hasToken: false,
      toolCount: 0,
      status: 'unknown',
    }),
  ],
} satisfies McpServersListMock;
