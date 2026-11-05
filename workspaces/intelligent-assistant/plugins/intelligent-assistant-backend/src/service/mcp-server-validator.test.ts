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

import { McpServerValidator } from './mcp-server-validator';

describe('McpServerValidator auth header behavior', () => {
  const url = 'https://mcp.example.com';
  const childMock = jest.fn();
  const logger: ConstructorParameters<typeof McpServerValidator>[0] = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    child: childMock,
  };
  childMock.mockImplementation(() => logger);

  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('tries raw token first, then Bearer on 401/403', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(new Response(null, { status: 401 }));
    global.fetch = fetchMock;

    const validator = new McpServerValidator(logger);
    const result = await validator.validate(url, 'raw-token');

    expect(result).toMatchObject({
      valid: false,
      toolCount: 0,
      tools: [],
      error: 'Invalid credentials — server returned 401/403',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({
      Authorization: 'raw-token',
    });
    expect(fetchMock.mock.calls[1][1]?.headers).toMatchObject({
      Authorization: 'Bearer raw-token',
    });
  });

  it('uses token as-is when it already has an auth scheme', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(new Response(null, { status: 401 }));
    global.fetch = fetchMock;

    const validator = new McpServerValidator(logger);
    const result = await validator.validate(url, 'Basic abc123');

    expect(result.valid).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({
      Authorization: 'Basic abc123',
    });
  });

  function jsonResponse(
    body: unknown,
    init?: { status?: number; headers?: Record<string, string> },
  ) {
    return new Response(JSON.stringify(body), {
      status: init?.status ?? 200,
      headers: { 'content-type': 'application/json', ...init?.headers },
    });
  }

  it('reads tools from a JSON tools/list response and forwards the session id', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({}, { headers: { 'mcp-session-id': 'sess-1' } }),
      )
      .mockResolvedValueOnce(jsonResponse({}))
      .mockResolvedValueOnce(
        jsonResponse({
          result: { tools: [{ name: 'search' }] },
        }),
      );
    global.fetch = fetchMock;

    const validator = new McpServerValidator(logger);
    await expect(validator.validate(url, 'raw-token')).resolves.toEqual({
      valid: true,
      toolCount: 1,
      tools: [{ name: 'search', description: '' }],
    });
    expect(fetchMock.mock.calls[1][1]?.headers).toMatchObject({
      'Mcp-Session-Id': 'sess-1',
    });
    expect(fetchMock.mock.calls[2][1]?.headers).toMatchObject({
      'Mcp-Session-Id': 'sess-1',
    });
  });

  it('parses tools from an SSE tools/list body and skips junk data lines', async () => {
    const sse = [
      ': keepalive',
      'data:',
      'data: {not-json',
      'data: {"jsonrpc":"2.0","result":{"tools":[{"name":"list","description":"List items"}]}}',
    ].join('\n');
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 202 }))
      .mockResolvedValueOnce(
        new Response(sse, {
          status: 200,
          headers: { 'content-type': 'text/event-stream' },
        }),
      );
    global.fetch = fetchMock;

    const validator = new McpServerValidator(logger);
    await expect(validator.validate(url, 'raw-token')).resolves.toEqual({
      valid: true,
      toolCount: 1,
      tools: [{ name: 'list', description: 'List items' }],
    });
  });

  it('stays connected with zero tools when SSE has no result object', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 202 }))
      .mockResolvedValueOnce(
        new Response('data: {"jsonrpc":"2.0","id":2}\n', {
          status: 200,
          headers: { 'content-type': 'text/event-stream' },
        }),
      );
    global.fetch = fetchMock;

    const validator = new McpServerValidator(logger);
    await expect(validator.validate(url, 'raw-token')).resolves.toEqual({
      valid: true,
      toolCount: 0,
      tools: [],
    });
  });

  it('stays connected when tools/list fails after initialize succeeds', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 202 }))
      .mockResolvedValueOnce(new Response(null, { status: 500 }));
    global.fetch = fetchMock;

    const validator = new McpServerValidator(logger);
    await expect(validator.validate(url, 'raw-token')).resolves.toEqual({
      valid: true,
      toolCount: 0,
      tools: [],
    });
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('tools/list returned 500'),
    );
  });
});
