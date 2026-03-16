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

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

/**
 * Creates a custom fetch function that skips TLS certificate verification.
 * Uses Node.js built-in undici Agent to scope the TLS override to this
 * fetch instance only, keeping the rest of the process secure.
 *
 * Only called when `augment.llamaStack.skipTlsVerify` is explicitly set
 * to `true` in app-config.yaml (for self-signed certificates in
 * dev/enterprise environments).
 */
export function createTlsSkipFetch(): typeof globalThis.fetch {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @backstage/no-undeclared-imports
  const { Agent } = require('undici') as {
    Agent: new (opts: Record<string, unknown>) => unknown;
  };
  const verifyTls = false; // NOSONAR — intentional: only invoked when skipTlsVerify config is true
  const dispatcher = new Agent({
    connect: { rejectUnauthorized: verifyTls },
  });
  return ((input: RequestInfo | URL, init?: RequestInit) => {
    return globalThis.fetch(input, {
      ...init,
      dispatcher,
    } as RequestInit);
  }) as typeof globalThis.fetch;
}

export interface McpConnectionOptions {
  headers?: Record<string, string>;
  skipTlsVerify?: boolean;
  clientName?: string;
}

export interface McpToolInfo {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

export interface McpConnectionResult {
  client: Client;
  tools: McpToolInfo[];
}

/**
 * Connect to an MCP server using the official SDK and list its tools.
 * The caller is responsible for closing the client when done.
 */
export async function connectToMcpServer(
  url: string,
  opts: McpConnectionOptions = {},
): Promise<McpConnectionResult> {
  const requestInit: RequestInit = {};
  if (opts.headers && Object.keys(opts.headers).length > 0) {
    requestInit.headers = opts.headers;
  }

  const transport = new StreamableHTTPClientTransport(new URL(url), {
    requestInit,
    fetch: opts.skipTlsVerify ? createTlsSkipFetch() : undefined,
  });

  const client = new Client({
    name: opts.clientName ?? 'augment',
    version: '1.0.0',
  });

  await client.connect(transport);
  const { tools } = await client.listTools();

  return {
    client,
    tools: tools.map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema as Record<string, unknown> | undefined,
    })),
  };
}

/**
 * Connect to an MCP server, list its tools, and immediately close the connection.
 * Used for health checks and test connections where we don't need to keep the client open.
 */
export async function listMcpServerTools(
  url: string,
  opts: McpConnectionOptions = {},
): Promise<McpToolInfo[]> {
  const { client, tools } = await connectToMcpServer(url, opts);
  try {
    await client.close();
  } catch {
    // Best-effort close
  }
  return tools;
}
