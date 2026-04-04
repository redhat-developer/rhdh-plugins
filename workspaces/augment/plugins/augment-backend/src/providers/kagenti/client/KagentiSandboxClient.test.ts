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

import { KagentiSandboxClient } from './KagentiSandboxClient';

describe('KagentiSandboxClient', () => {
  const mockApi = {
    request: jest.fn(),
    streamRequest: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createClient() {
    return new KagentiSandboxClient(mockApi as never);
  }

  it('lists sessions', async () => {
    mockApi.request.mockResolvedValue({ items: [], total: 0 });
    const client = createClient();
    const result = await client.listSessions('ns1');
    expect(mockApi.request).toHaveBeenCalledWith(
      'GET',
      '/api/v1/sandbox/ns1/sessions',
    );
    expect(result).toEqual({ items: [], total: 0 });
  });

  it('lists sessions with query params', async () => {
    mockApi.request.mockResolvedValue({ items: [] });
    const client = createClient();
    await client.listSessions('ns1', { limit: 10, offset: 5, search: 'test' });
    expect(mockApi.request).toHaveBeenCalledWith(
      'GET',
      expect.stringContaining('limit=10'),
    );
  });

  it('gets session detail', async () => {
    mockApi.request.mockResolvedValue({ contextId: 'c1' });
    const client = createClient();
    await client.getSession('ns1', 'c1');
    expect(mockApi.request).toHaveBeenCalledWith(
      'GET',
      '/api/v1/sandbox/ns1/sessions/c1',
    );
  });

  it('deletes a session', async () => {
    mockApi.request.mockResolvedValue(undefined);
    const client = createClient();
    await client.deleteSession('ns1', 'c1');
    expect(mockApi.request).toHaveBeenCalledWith(
      'DELETE',
      '/api/v1/sandbox/ns1/sessions/c1',
    );
  });

  it('renames a session', async () => {
    mockApi.request.mockResolvedValue({ title: 'New Title' });
    const client = createClient();
    await client.renameSession('ns1', 'c1', 'New Title');
    expect(mockApi.request).toHaveBeenCalledWith(
      'PUT',
      '/api/v1/sandbox/ns1/sessions/c1/rename',
      { title: 'New Title' },
    );
  });

  it('sends sandbox chat', async () => {
    mockApi.request.mockResolvedValue({
      content: 'reply',
      context_id: 'c1',
      status: 'completed',
    });
    const client = createClient();
    await client.sandboxChat('ns1', 'Hello', { agentName: 'bot' });
    expect(mockApi.request).toHaveBeenCalledWith(
      'POST',
      '/api/v1/sandbox/ns1/chat',
      expect.objectContaining({ message: 'Hello', agent_name: 'bot' }),
    );
  });

  it('streams sandbox chat', async () => {
    mockApi.streamRequest.mockResolvedValue(undefined);
    const client = createClient();
    const onLine = jest.fn();
    await client.sandboxChatStream('ns1', 'Hi', undefined, onLine);
    expect(mockApi.streamRequest).toHaveBeenCalledWith(
      '/api/v1/sandbox/ns1/chat/stream',
      expect.objectContaining({ message: 'Hi' }),
      onLine,
      undefined,
    );
  });

  it('gets sandbox defaults', async () => {
    mockApi.request.mockResolvedValue({ name: 'sandbox-default' });
    const client = createClient();
    await client.getSandboxDefaults();
    expect(mockApi.request).toHaveBeenCalledWith(
      'GET',
      '/api/v1/sandbox/defaults',
    );
  });

  it('creates a sandbox', async () => {
    mockApi.request.mockResolvedValue({ success: true });
    const client = createClient();
    await client.createSandbox('ns1', { key: 'value' });
    expect(mockApi.request).toHaveBeenCalledWith(
      'POST',
      '/api/v1/sandbox/ns1/create',
      { key: 'value' },
    );
  });

  it('lists sidecars', async () => {
    mockApi.request.mockResolvedValue([]);
    const client = createClient();
    await client.listSidecars('ns1', 'ctx1');
    expect(mockApi.request).toHaveBeenCalledWith(
      'GET',
      '/api/v1/sandbox/ns1/sessions/ctx1/sidecars',
    );
  });

  it('enables a sidecar', async () => {
    mockApi.request.mockResolvedValue({
      sidecarType: 'observer',
      enabled: true,
    });
    const client = createClient();
    await client.enableSidecar('ns1', 'ctx1', 'observer', {
      auto_approve: true,
    });
    expect(mockApi.request).toHaveBeenCalledWith(
      'POST',
      '/api/v1/sandbox/ns1/sessions/ctx1/sidecars/observer/enable',
      { auto_approve: true },
    );
  });

  it('gets session token usage', async () => {
    mockApi.request.mockResolvedValue({ totalTokens: 100 });
    const client = createClient();
    await client.getSessionTokenUsage('ctx1');
    expect(mockApi.request).toHaveBeenCalledWith(
      'GET',
      '/api/v1/token-usage/sessions/ctx1',
    );
  });

  it('gets storage stats', async () => {
    mockApi.request.mockResolvedValue({ used: '1G' });
    const client = createClient();
    await client.getStorageStats('ns1', 'agent1');
    expect(mockApi.request).toHaveBeenCalledWith(
      'GET',
      '/api/v1/sandbox/ns1/stats/agent1',
    );
  });
});
