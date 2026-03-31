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

  it('tries raw token first, then falls back to Bearer on 401/403', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            result: { capabilities: { tools: {} } },
            id: 1,
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            result: { tools: [{ name: 'tool-1' }] },
            id: 2,
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        ),
      );
    global.fetch = fetchMock;

    const validator = new McpServerValidator(logger);
    const result = await validator.validate(url, 'raw-token');

    expect(result.valid).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({
      Authorization: 'raw-token',
    });
    expect(fetchMock.mock.calls[1][1]?.headers).toMatchObject({
      Authorization: 'Bearer raw-token',
    });
  });

  it('does not rewrite tokens that already include an auth scheme', async () => {
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
});
