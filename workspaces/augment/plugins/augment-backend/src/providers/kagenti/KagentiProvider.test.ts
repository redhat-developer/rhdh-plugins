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

import { ConfigReader } from '@backstage/config';
import { createMockLogger } from '../../test-utils/mocks';
import { KagentiProvider } from './KagentiProvider';

jest.mock('./client/KeycloakTokenManager', () => ({
  KeycloakTokenManager: jest.fn().mockImplementation(() => ({
    getToken: jest.fn().mockResolvedValue('mock-token'),
    clearCache: jest.fn(),
  })),
}));

jest.mock('./client/KagentiApiClient', () => ({
  KagentiApiClient: jest.fn().mockImplementation(() => ({
    health: jest.fn().mockResolvedValue({ status: 'healthy' }),
    ready: jest.fn().mockResolvedValue({ status: 'ready' }),
    getFeatureFlags: jest.fn().mockResolvedValue({
      sandbox: false,
      integrations: false,
      triggers: false,
    }),
    listAgents: jest.fn().mockResolvedValue({
      items: [
        {
          name: 'weather-bot',
          namespace: 'team1',
          description: 'Weather agent',
          status: 'Running',
          labels: { protocol: 'a2a' },
          workloadType: 'deployment',
        },
      ],
    }),
    listNamespaces: jest.fn().mockResolvedValue({ namespaces: ['team1'] }),
    getAgentCard: jest.fn().mockResolvedValue({
      name: 'weather-bot',
      description: 'Weather agent',
      version: '1.0',
      url: 'http://weather-bot:8000',
      streaming: true,
      skills: [],
    }),
    chatSend: jest.fn().mockResolvedValue({
      content: 'It is sunny today.',
      session_id: 'session-1',
      is_complete: true,
    }),
    chatStream: jest
      .fn()
      .mockImplementation(
        (
          _ns: string,
          _name: string,
          _msg: string,
          _sid: string | undefined,
          onLine: (l: string) => void,
        ) => {
          onLine(JSON.stringify({ content: 'Streaming...', session_id: 's1' }));
          onLine(JSON.stringify({ done: true }));
          return Promise.resolve();
        },
      ),
    destroy: jest.fn(),
  })),
}));

jest.mock('./client/KagentiSandboxClient');
jest.mock('./client/KagentiAdminClient');

function createProvider() {
  const config = new ConfigReader({
    augment: {
      kagenti: {
        baseUrl: 'https://kagenti.example.com',
        namespace: 'team1',
        agentName: 'weather-bot',
        auth: {
          tokenEndpoint: 'https://kc.example.com/token',
          clientId: 'client',
          clientSecret: 'secret',
        },
      },
    },
  });

  return new KagentiProvider({
    logger: createMockLogger(),
    config,
  });
}

describe('KagentiProvider', () => {
  it('has correct id and displayName', () => {
    const p = createProvider();
    expect(p.id).toBe('kagenti');
    expect(p.displayName).toBe('Kagenti');
  });

  it('has conversations but no other optional capabilities', () => {
    const p = createProvider();
    expect(p.conversations).toBeDefined();
    expect(p.rag).toBeUndefined();
    expect(p.safety).toBeUndefined();
    expect(p.evaluation).toBeUndefined();
  });

  it('initializes and reports healthy status', async () => {
    const p = createProvider();
    await p.initialize();
    await p.postInitialize();

    const status = await p.getStatus();
    expect(status.ready).toBe(true);
    expect(status.provider.connected).toBe(true);
    expect(status.capabilities?.chat).toBe(true);
    expect(status.capabilities?.rag?.available).toBe(false);
  });

  it('returns empty models when no LlamaStack baseUrl is configured', async () => {
    const p = createProvider();
    await p.initialize();

    const models = await p.listModels!();
    expect(models).toHaveLength(0);
  });

  it('tests model by fetching agent card', async () => {
    const p = createProvider();
    await p.initialize();

    const result = await p.testModel!('team1/weather-bot');
    expect(result.connected).toBe(true);
    expect(result.modelFound).toBe(true);
  });

  it('sends a chat message and returns response', async () => {
    const p = createProvider();
    await p.initialize();

    const response = await p.chat({
      messages: [{ role: 'user', content: 'What is the weather?' }],
    });
    expect(response.role).toBe('assistant');
    expect(response.content).toBe('It is sunny today.');
  });

  it('streams a chat response', async () => {
    const p = createProvider();
    await p.initialize();

    const events: Array<Record<string, unknown>> = [];
    await p.chatStream({ messages: [{ role: 'user', content: 'Hello' }] }, e =>
      events.push(e as unknown as Record<string, unknown>),
    );

    expect(events.length).toBeGreaterThan(0);
    expect(events[0].type).toBe('stream.started');
  });

  it('shuts down cleanly and clears caches', async () => {
    const p = createProvider();
    await p.initialize();
    await expect(p.shutdown!()).resolves.toBeUndefined();
  });
});

describe('KagentiProvider -- Agent Card Cache & Demand Resolution', () => {
  it('caches agent card on first call and returns cached on second', async () => {
    const p = createProvider();
    await p.initialize();

    const entry1 = await p.getAgentCardCached('team1', 'weather-bot');
    expect(entry1.card).toBeDefined();
    expect(entry1.demands).toBeDefined();

    const entry2 = await p.getAgentCardCached('team1', 'weather-bot');
    expect(entry2).toBe(entry1);
  });

  it('resolveMetadata returns empty object for agent without extension demands', async () => {
    const p = createProvider();
    await p.initialize();

    const entry = await p.getAgentCardCached('team1', 'weather-bot');
    const metadata = await entry.resolveMetadata({});
    expect(metadata).toEqual({});
  });

  it('demands are all null for simple agent card', async () => {
    const p = createProvider();
    await p.initialize();

    const entry = await p.getAgentCardCached('team1', 'weather-bot');
    expect(entry.demands.llmDemands).toBeNull();
    expect(entry.demands.mcpDemands).toBeNull();
    expect(entry.demands.oauthDemands).toBeNull();
    expect(entry.demands.secretDemands).toBeNull();
  });

  it('chatStream passes undefined metadata when agent has no demands', async () => {
    const p = createProvider();
    await p.initialize();

    const events: Array<Record<string, unknown>> = [];
    await p.chatStream({ messages: [{ role: 'user', content: 'Hi' }] }, e =>
      events.push(e as unknown as Record<string, unknown>),
    );

    expect(events.length).toBeGreaterThan(0);
    expect(events[0].type).toBe('stream.started');
  });
});

// =============================================================================
// Additional coverage: Area 7a gaps
// =============================================================================

describe('KagentiProvider -- lifecycle guards', () => {
  it('throws if methods called before initialize()', async () => {
    const p = createProvider();
    await expect(p.getStatus()).rejects.toThrow(
      'initialize() must be called before use',
    );
    await expect(
      p.chat({ messages: [{ role: 'user', content: 'hi' }] }),
    ).rejects.toThrow('initialize()');
    await expect(p.testModel!()).rejects.toThrow('initialize()');
    expect(() => p.getApiClient()).toThrow('initialize()');
    expect(() => p.getConfig()).toThrow('initialize()');
  });
});

function getLatestMockApiClient() {
  const { KagentiApiClient } = jest.requireMock('./client/KagentiApiClient');
  const results = KagentiApiClient.mock.results;
  return results[results.length - 1].value;
}

describe('KagentiProvider -- testModel failure path', () => {
  it('returns connected:false for connection errors', async () => {
    const p = createProvider();
    await p.initialize();

    getLatestMockApiClient().getAgentCard.mockRejectedValueOnce(
      new Error('ECONNREFUSED: connection refused'),
    );

    const result = await p.testModel!('team1/bad-agent');
    expect(result.connected).toBe(false);
    expect(result.modelFound).toBe(false);
    expect(result.error).toContain('ECONNREFUSED');
  });

  it('returns connected:true for 404 (model not found but server reachable)', async () => {
    const p = createProvider();
    await p.initialize();

    getLatestMockApiClient().getAgentCard.mockRejectedValueOnce(
      new Error(
        'Kagenti API error: GET /api/v1/chat/team1/missing/agent-card status 404 - Not Found',
      ),
    );

    const result = await p.testModel!('team1/missing');
    expect(result.connected).toBe(true);
    expect(result.modelFound).toBe(false);
  });
});

describe('KagentiProvider -- listModels via LlamaStack', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  function createProviderWithLlamaStack() {
    const config = new ConfigReader({
      augment: {
        kagenti: {
          baseUrl: 'https://kagenti.example.com',
          namespace: 'team1',
          agentName: 'weather-bot',
          auth: {
            tokenEndpoint: 'https://kc.example.com/token',
            clientId: 'client',
            clientSecret: 'secret',
          },
        },
        llamaStack: {
          baseUrl: 'https://llamastack.example.com',
          model: 'meta-llama/Llama-3.3-8B-Instruct',
        },
      },
    });
    return new KagentiProvider({ logger: createMockLogger(), config });
  }

  it('fetches models from LlamaStack /v1/models', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [
            { id: 'meta-llama/Llama-3.3-8B-Instruct', owned_by: 'meta' },
            { id: 'gpt-120b', model_type: 'llm' },
          ],
        }),
    });

    const p = createProviderWithLlamaStack();
    await p.initialize();

    const models = await p.listModels!();
    expect(models).toHaveLength(2);
    expect(models[0].id).toBe('meta-llama/Llama-3.3-8B-Instruct');
    expect(models[0].owned_by).toBe('meta');
    expect(models[1].id).toBe('gpt-120b');
    expect(models[1].model_type).toBe('llm');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://llamastack.example.com/v1/models',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('returns empty array when LlamaStack is unreachable', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));

    const p = createProviderWithLlamaStack();
    await p.initialize();

    const models = await p.listModels!();
    expect(models).toHaveLength(0);
  });

  it('returns empty array when LlamaStack returns non-ok status', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const p = createProviderWithLlamaStack();
    await p.initialize();

    const models = await p.listModels!();
    expect(models).toHaveLength(0);
  });

  it('caches models for subsequent calls', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [{ id: 'cached-model' }],
        }),
    });

    const p = createProviderWithLlamaStack();
    await p.initialize();

    const first = await p.listModels!();
    const second = await p.listModels!();
    expect(first).toEqual(second);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('returns empty array when no LlamaStack baseUrl is configured', async () => {
    const p = createProvider();
    await p.initialize();

    const models = await p.listModels!();
    expect(models).toHaveLength(0);
  });
});

describe('KagentiProvider -- getEffectiveConfig', () => {
  it('returns Kagenti baseUrl and LlamaStack model from YAML', async () => {
    const config = new ConfigReader({
      augment: {
        kagenti: {
          baseUrl: 'https://kagenti.example.com',
          namespace: 'team1',
          agentName: 'weather-bot',
          auth: {
            tokenEndpoint: 'https://kc.example.com/token',
            clientId: 'client',
            clientSecret: 'secret',
          },
        },
        llamaStack: {
          baseUrl: 'https://llamastack.example.com',
          model: 'meta-llama/Llama-3.3-8B-Instruct',
        },
      },
    });

    const p = new KagentiProvider({ logger: createMockLogger(), config });
    await p.initialize();

    const ec = await p.getEffectiveConfig!();
    expect(ec.baseUrl).toBe('https://kagenti.example.com');
    expect(ec.model).toBe('meta-llama/Llama-3.3-8B-Instruct');
    expect(ec.toolChoice).toBe('auto');
  });

  it('returns empty model when no LlamaStack config is present', async () => {
    const p = createProvider();
    await p.initialize();

    const ec = await p.getEffectiveConfig!();
    expect(ec.baseUrl).toBe('https://kagenti.example.com');
    expect(ec.model).toBe('');
  });
});

describe('KagentiProvider -- resolveAgent', () => {
  it('parses ns/name model format', async () => {
    const p = createProvider();
    await p.initialize();

    const events: Array<Record<string, unknown>> = [];
    await p.chatStream(
      {
        messages: [{ role: 'user', content: 'hello' }],
        model: 'other-ns/other-agent',
      } as any,
      e => events.push(e as unknown as Record<string, unknown>),
    );

    const chatStreamCall = getLatestMockApiClient().chatStream;
    expect(chatStreamCall).toHaveBeenCalledWith(
      'other-ns',
      'other-agent',
      'hello',
      undefined,
      expect.any(Function),
      undefined,
      undefined,
    );
  });
});
