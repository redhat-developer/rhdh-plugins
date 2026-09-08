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

import type { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { AgentsClient } from './AgentsClient';
import type {
  Agent,
  AgentRegistrationRequest,
  HeartbeatRequest,
} from '../types/agents';

const BASE_URL = 'http://localhost/api/dcm';

const MOCK_REGISTRATION: AgentRegistrationRequest = {
  name: 'env-agent-west-1',
  environment: 'production',
  service_types: ['vm', 'container'],
  cost: 'medium',
  topic_name: 'dcm.agent.env-agent-west-1',
};

const MOCK_AGENT: Agent = {
  ...MOCK_REGISTRATION,
  agent_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  health_status: 'ready',
};

function makeClient(fetchFn: jest.Mock) {
  const discoveryApi: DiscoveryApi = {
    getBaseUrl: jest.fn().mockResolvedValue(BASE_URL),
  };
  const fetchApi: FetchApi = { fetch: fetchFn };
  return new AgentsClient({ discoveryApi, fetchApi });
}

function okJson(data: unknown): Response {
  return {
    status: 200,
    ok: true,
    json: async () => data,
  } as unknown as Response;
}

describe('AgentsClient', () => {
  it('listAgents calls GET /agents', async () => {
    const fetchFn = jest
      .fn()
      .mockResolvedValue(okJson({ agents: [MOCK_AGENT] }));
    const client = makeClient(fetchFn);

    await client.listAgents();

    expect(fetchFn).toHaveBeenCalledWith(
      `${BASE_URL}/proxy/agents`,
      expect.objectContaining({ headers: expect.any(Object) }),
    );
  });

  it('listAgents appends max_page_size and page_token query params', async () => {
    const fetchFn = jest
      .fn()
      .mockResolvedValue(okJson({ agents: [MOCK_AGENT] }));
    const client = makeClient(fetchFn);

    await client.listAgents({ max_page_size: 10, page_token: 'tok-1' });

    const [url] = fetchFn.mock.calls[0];
    expect(url).toContain('max_page_size=10');
    expect(url).toContain('page_token=tok-1');
  });

  it('listAgents appends health_status query param when provided', async () => {
    const fetchFn = jest
      .fn()
      .mockResolvedValue(okJson({ agents: [MOCK_AGENT] }));
    const client = makeClient(fetchFn);

    await client.listAgents({ health_status: 'ready' });

    const [url] = fetchFn.mock.calls[0];
    expect(url).toContain('health_status=ready');
  });

  it('getAgent calls GET /agents/{id}', async () => {
    const fetchFn = jest.fn().mockResolvedValue(okJson(MOCK_AGENT));
    const client = makeClient(fetchFn);

    await client.getAgent('my-agent-id');

    expect(fetchFn).toHaveBeenCalledWith(
      `${BASE_URL}/proxy/agents/my-agent-id`,
      expect.any(Object),
    );
  });

  it('createAgent calls POST /agents with JSON body', async () => {
    const fetchFn = jest.fn().mockResolvedValue(okJson(MOCK_AGENT));
    const client = makeClient(fetchFn);

    await client.createAgent(MOCK_REGISTRATION);

    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/proxy/agents`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual(MOCK_REGISTRATION);
  });

  it('createAgent returns 201 response body correctly', async () => {
    const fetchFn = jest.fn().mockResolvedValue({
      status: 201,
      ok: true,
      json: async () => MOCK_AGENT,
    } as unknown as Response);
    const client = makeClient(fetchFn);

    const result = await client.createAgent(MOCK_REGISTRATION);

    expect(result).toEqual(MOCK_AGENT);
  });

  it('agentHeartbeat calls PUT /agents/{id}/heartbeat with JSON body', async () => {
    const heartbeat: HeartbeatRequest = {
      consumer_lag: 0,
      timestamp: '2026-08-25T12:00:00Z',
    };
    const fetchFn = jest.fn().mockResolvedValue(okJson(MOCK_AGENT));
    const client = makeClient(fetchFn);

    await client.agentHeartbeat('my-agent-id', heartbeat);

    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/proxy/agents/my-agent-id/heartbeat`);
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual(heartbeat);
  });
});
