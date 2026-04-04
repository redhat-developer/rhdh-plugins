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

import { KagentiAdminClient } from './KagentiAdminClient';

describe('KagentiAdminClient', () => {
  const mockApi = {
    request: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createClient() {
    return new KagentiAdminClient(mockApi as never);
  }

  it('lists LLM models', async () => {
    mockApi.request.mockResolvedValue([{ id: 'llama3', name: 'Llama 3' }]);
    const client = createClient();
    const result = await client.listLlmModels();
    expect(mockApi.request).toHaveBeenCalledWith('GET', '/api/v1/models');
    expect(result).toHaveLength(1);
  });

  it('creates a team', async () => {
    mockApi.request.mockResolvedValue({ teamId: 't1', namespace: 'ns1' });
    const client = createClient();
    await client.createTeam({ namespace: 'ns1' });
    expect(mockApi.request).toHaveBeenCalledWith('POST', '/api/v1/llm/teams', {
      namespace: 'ns1',
    });
  });

  it('lists teams', async () => {
    mockApi.request.mockResolvedValue([]);
    const client = createClient();
    await client.listTeams();
    expect(mockApi.request).toHaveBeenCalledWith('GET', '/api/v1/llm/teams');
  });

  it('gets a team by namespace', async () => {
    mockApi.request.mockResolvedValue({ teamId: 't1', namespace: 'team1' });
    const client = createClient();
    await client.getTeam('team1');
    expect(mockApi.request).toHaveBeenCalledWith(
      'GET',
      '/api/v1/llm/teams/team1',
    );
  });

  it('creates a key', async () => {
    mockApi.request.mockResolvedValue({ success: true });
    const client = createClient();
    await client.createKey({ namespace: 'ns1', agentName: 'bot' });
    expect(mockApi.request).toHaveBeenCalledWith(
      'POST',
      '/api/v1/llm/keys',
      expect.objectContaining({ namespace: 'ns1' }),
    );
  });

  it('lists keys', async () => {
    mockApi.request.mockResolvedValue([]);
    const client = createClient();
    await client.listKeys();
    expect(mockApi.request).toHaveBeenCalledWith('GET', '/api/v1/llm/keys');
  });

  it('deletes a key', async () => {
    mockApi.request.mockResolvedValue({ success: true });
    const client = createClient();
    await client.deleteKey('ns1', 'bot');
    expect(mockApi.request).toHaveBeenCalledWith(
      'DELETE',
      '/api/v1/llm/keys/ns1/bot',
    );
  });

  it('gets agent models', async () => {
    mockApi.request.mockResolvedValue([{ model: 'llama3' }]);
    const client = createClient();
    await client.getAgentModels('ns1', 'bot');
    expect(mockApi.request).toHaveBeenCalledWith(
      'GET',
      '/api/v1/llm/agent-models/ns1/bot',
    );
  });

  it('lists integrations', async () => {
    mockApi.request.mockResolvedValue({ items: [] });
    const client = createClient();
    await client.listIntegrations('ns1');
    expect(mockApi.request).toHaveBeenCalledWith(
      'GET',
      '/api/v1/integrations?namespace=ns1',
    );
  });

  it('creates an integration', async () => {
    mockApi.request.mockResolvedValue({ success: true });
    const client = createClient();
    await client.createIntegration({ name: 'int1', namespace: 'ns1' });
    expect(mockApi.request).toHaveBeenCalledWith(
      'POST',
      '/api/v1/integrations',
      expect.objectContaining({ name: 'int1' }),
    );
  });

  it('deletes an integration', async () => {
    mockApi.request.mockResolvedValue({ success: true });
    const client = createClient();
    await client.deleteIntegration('ns1', 'int1');
    expect(mockApi.request).toHaveBeenCalledWith(
      'DELETE',
      '/api/v1/integrations/ns1/int1',
    );
  });

  it('tests an integration', async () => {
    mockApi.request.mockResolvedValue({ success: true });
    const client = createClient();
    await client.testIntegration('ns1', 'int1');
    expect(mockApi.request).toHaveBeenCalledWith(
      'POST',
      '/api/v1/integrations/ns1/int1/test',
    );
  });

  it('creates a trigger', async () => {
    mockApi.request.mockResolvedValue({
      sandbox_claim: 'claim-1',
      namespace: 'ns1',
    });
    const client = createClient();
    await client.createTrigger({
      type: 'cron',
      namespace: 'ns1',
      schedule: '*/5 * * * *',
    });
    expect(mockApi.request).toHaveBeenCalledWith(
      'POST',
      '/api/v1/sandbox/trigger',
      expect.objectContaining({ type: 'cron' }),
    );
  });
});
