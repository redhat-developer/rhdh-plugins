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
import { AgentGraphManager } from './AgentGraphManager';
import type { ConfigResolutionService } from './ConfigResolutionService';
import type { ConfigLoader } from './ConfigLoader';
import type { EffectiveConfig } from '../../types';
import type { LoggerService } from '@backstage/backend-plugin-api';

function mockLogger(): LoggerService {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  } as unknown as LoggerService;
}

function baseEffectiveConfig(
  overrides: Partial<EffectiveConfig> = {},
): EffectiveConfig {
  return {
    model: 'test-model',
    baseUrl: 'http://localhost:8321',
    systemPrompt: 'You are helpful.',
    enableWebSearch: false,
    enableCodeInterpreter: false,
    vectorStoreIds: [],
    vectorStoreName: 'test',
    embeddingModel: 'test-embed',
    embeddingDimension: 384,
    chunkingStrategy: 'auto' as const,
    maxChunkSizeTokens: 800,
    chunkOverlapTokens: 400,
    skipTlsVerify: false,
    zdrMode: false,
    verboseStreamLogging: false,
    ...overrides,
  };
}

function mockConfigResolution(
  config: EffectiveConfig,
): ConfigResolutionService {
  return {
    resolve: jest.fn().mockResolvedValue(config),
    invalidateCache: jest.fn(),
  } as unknown as ConfigResolutionService;
}

function mockConfigLoader(
  agentConfigs?: ReturnType<ConfigLoader['loadAgentConfigs']>,
): ConfigLoader {
  return {
    loadAgentConfigs: jest.fn().mockReturnValue(agentConfigs ?? null),
  } as unknown as ConfigLoader;
}

describe('AgentGraphManager', () => {
  it('returns single-agent fallback when no agents configured', async () => {
    const config = baseEffectiveConfig();
    const manager = new AgentGraphManager(
      mockConfigResolution(config),
      mockConfigLoader(),
      mockLogger(),
    );

    const snapshot = await manager.getSnapshot();

    expect(snapshot.agents.size).toBe(1);
    expect(snapshot.agents.has('default')).toBe(true);
    expect(snapshot.defaultAgentKey).toBe('default');
    expect(snapshot.agents.get('default')!.config.name).toBe('Assistant');
  });

  it('resolves multi-agent config from EffectiveConfig', async () => {
    const config = baseEffectiveConfig({
      agents: {
        router: {
          name: 'Router',
          instructions: 'Route messages.',
          handoffs: ['specialist'],
        },
        specialist: {
          name: 'Specialist',
          instructions: 'Handle domain queries.',
          handoffDescription: 'Domain expert.',
        },
      },
      defaultAgent: 'router',
      maxAgentTurns: 5,
    });

    const manager = new AgentGraphManager(
      mockConfigResolution(config),
      mockConfigLoader(),
      mockLogger(),
    );

    const snapshot = await manager.getSnapshot();

    expect(snapshot.agents.size).toBe(2);
    expect(snapshot.defaultAgentKey).toBe('router');
    expect(snapshot.maxTurns).toBe(5);
  });

  it('caches snapshot across calls', async () => {
    const configResolution = mockConfigResolution(baseEffectiveConfig());
    const manager = new AgentGraphManager(
      configResolution,
      mockConfigLoader(),
      mockLogger(),
    );

    const snapshot1 = await manager.getSnapshot();
    const snapshot2 = await manager.getSnapshot();

    expect(snapshot1).toBe(snapshot2);
    expect(configResolution.resolve).toHaveBeenCalledTimes(1);
  });

  it('re-resolves after invalidation', async () => {
    const config1 = baseEffectiveConfig({ systemPrompt: 'Prompt v1' });
    const config2 = baseEffectiveConfig({
      agents: {
        agent1: { name: 'Agent 1', instructions: 'First agent.' },
      },
      defaultAgent: 'agent1',
    });

    const resolve = jest
      .fn()
      .mockResolvedValueOnce(config1)
      .mockResolvedValueOnce(config2);

    const configResolution = {
      resolve,
      invalidateCache: jest.fn(),
    } as unknown as ConfigResolutionService;
    const manager = new AgentGraphManager(
      configResolution,
      mockConfigLoader(),
      mockLogger(),
    );

    const snapshot1 = await manager.getSnapshot();
    expect(snapshot1.agents.has('default')).toBe(true);

    // Advance past the debounce window so invalidation triggers re-resolve
    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 1000);

    manager.invalidate();
    const snapshot2 = await manager.getSnapshot();
    expect(snapshot2.agents.has('agent1')).toBe(true);
    expect(snapshot2).not.toBe(snapshot1);
    expect(resolve).toHaveBeenCalledTimes(2);

    jest.restoreAllMocks();
  });

  it('falls back to single agent in ZDR mode with multi-agent config', async () => {
    const logger = mockLogger();
    const config = baseEffectiveConfig({
      zdrMode: true,
      agents: {
        router: { name: 'Router', instructions: 'Route.' },
      },
      defaultAgent: 'router',
    });

    const manager = new AgentGraphManager(
      mockConfigResolution(config),
      mockConfigLoader(),
      logger,
    );

    const snapshot = await manager.getSnapshot();

    expect(snapshot.agents.has('default')).toBe(true);
    expect(snapshot.maxTurns).toBe(1);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Cannot use multi-agent mode with zdrMode=true'),
    );
  });

  it('falls back to single agent on invalid graph (missing default)', async () => {
    const logger = mockLogger();
    const config = baseEffectiveConfig({
      agents: {
        agent1: { name: 'Agent 1', instructions: 'Hello.' },
      },
      defaultAgent: 'nonexistent',
    });

    const manager = new AgentGraphManager(
      mockConfigResolution(config),
      mockConfigLoader(),
      logger,
    );

    const snapshot = await manager.getSnapshot();

    expect(snapshot.agents.has('default')).toBe(true);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to resolve agent graph'),
    );
  });

  it('shares in-flight resolution across concurrent calls', async () => {
    let resolveCount = 0;
    const resolve = jest.fn().mockImplementation(() => {
      resolveCount++;
      return Promise.resolve(baseEffectiveConfig());
    });

    const configResolution = {
      resolve,
      invalidateCache: jest.fn(),
    } as unknown as ConfigResolutionService;
    const manager = new AgentGraphManager(
      configResolution,
      mockConfigLoader(),
      mockLogger(),
    );

    const [s1, s2, s3] = await Promise.all([
      manager.getSnapshot(),
      manager.getSnapshot(),
      manager.getSnapshot(),
    ]);

    expect(s1).toBe(s2);
    expect(s2).toBe(s3);
    expect(resolveCount).toBe(1);
  });

  it('does not cache stale snapshot if invalidated during resolution', async () => {
    const config1 = baseEffectiveConfig({ systemPrompt: 'v1' });
    const config2 = baseEffectiveConfig({
      agents: { a: { name: 'A', instructions: 'Agent A.' } },
      defaultAgent: 'a',
    });

    let callCount = 0;
    const manager = new AgentGraphManager(
      {
        resolve: jest.fn().mockImplementation(async () => {
          callCount++;
          if (callCount === 1) {
            manager.invalidate();
            return config1;
          }
          return config2;
        }),
        invalidateCache: jest.fn(),
      } as unknown as ConfigResolutionService,
      mockConfigLoader(),
      mockLogger(),
    );

    const snapshot1 = await manager.getSnapshot();
    expect(snapshot1.agents.has('default')).toBe(true);

    const snapshot2 = await manager.getSnapshot();
    expect(snapshot2.agents.has('a')).toBe(true);
  });
});
