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

import type {
  SchedulerServiceTaskInvocationDefinition,
  SchedulerServiceTaskRunner,
} from '@backstage/backend-plugin-api';
import { mockServices } from '@backstage/backend-test-utils';
import type { EntityProviderConnection } from '@backstage/plugin-catalog-node';

import {
  AI_ASSET_CATEGORY_ANNOTATION,
  AI_ASSET_SOURCE_ANNOTATION,
  AI_ASSET_VERSION_ANNOTATION,
} from '@red-hat-developer-hub/backstage-plugin-boost-entity-provider-sdk';

import { Agent } from 'undici';

import { OgxModelEntityProvider } from './OgxModelEntityProvider';
import type { OgxEntityProviderConfig } from '../types';

jest.mock('undici', () => {
  const mockAgentInstance = { mocked: true };
  return {
    Agent: jest.fn(() => mockAgentInstance),
  };
});

const MockAgent = Agent as jest.MockedClass<typeof Agent>;

const mockFetch = jest.fn() as jest.MockedFunction<typeof global.fetch>;
global.fetch = mockFetch;

class TaskRunnerMock implements SchedulerServiceTaskRunner {
  private tasks: SchedulerServiceTaskInvocationDefinition[] = [];

  async run(task: SchedulerServiceTaskInvocationDefinition) {
    this.tasks.push(task);
  }

  async runAll() {
    const abortSignal = jest.fn() as unknown as AbortSignal;
    for (const task of this.tasks) {
      await task.fn(abortSignal);
    }
  }
}

const mockConnection: EntityProviderConnection = {
  applyMutation: jest.fn(),
  refresh: jest.fn(),
} as unknown as EntityProviderConnection;

const defaultConfig: OgxEntityProviderConfig = {
  baseUrl: 'http://localhost:8321',
};

describe('OgxModelEntityProvider', () => {
  let taskRunner: TaskRunnerMock;

  beforeEach(() => {
    jest.clearAllMocks();
    MockAgent.mockClear();
    taskRunner = new TaskRunnerMock();
  });

  it('should return the correct provider name', () => {
    const provider = new OgxModelEntityProvider({
      config: defaultConfig,
      logger: mockServices.logger.mock(),
      taskRunner,
    });

    expect(provider.getProviderName()).toBe('ogx-model-entity-provider');
  });

  it('should emit a single AiModelServerAPI entity with all models', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        object: 'list',
        data: [
          {
            id: 'meta-llama/Llama-3.1-8B-Instruct',
            object: 'model',
            created: 1700000000,
            owned_by: 'meta',
          },
          {
            id: 'ibm/granite-3.0',
            object: 'model',
            created: 1700000001,
            owned_by: 'ibm',
          },
        ],
      }),
    } as Response);

    const provider = new OgxModelEntityProvider({
      config: defaultConfig,
      logger: mockServices.logger.mock(),
      taskRunner,
    });

    await provider.connect(mockConnection);
    await taskRunner.runAll();

    expect(mockConnection.applyMutation).toHaveBeenCalledTimes(1);

    const mutation = (mockConnection.applyMutation as jest.Mock).mock
      .calls[0][0];
    expect(mutation.type).toBe('full');
    expect(mutation.entities).toHaveLength(1);

    const entity = mutation.entities[0].entity;
    expect(entity.kind).toBe('AiModelServerAPI');
    expect(entity.spec.type).toBe('ai-model-server');
    expect(entity.spec.lifecycle).toBe('production');
    expect(entity.spec.serverType).toBe('openai-v1');
    expect(entity.spec.serverUrl).toBe('http://localhost:8321');
    expect(entity.spec.models.discoverable).toBe(true);
    expect(entity.spec.models.available).toEqual([
      'meta-llama/Llama-3.1-8B-Instruct',
      'ibm/granite-3.0',
    ]);
  });

  it('should include all three required AI asset annotations', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [{ id: 'model-1', object: 'model', owned_by: 'test' }],
      }),
    } as Response);

    const provider = new OgxModelEntityProvider({
      config: { ...defaultConfig, serverVersion: '2.1.0' },
      logger: mockServices.logger.mock(),
      taskRunner,
    });

    await provider.connect(mockConnection);
    await taskRunner.runAll();

    const mutation = (mockConnection.applyMutation as jest.Mock).mock
      .calls[0][0];
    const entity = mutation.entities[0].entity;

    expect(entity.metadata.annotations[AI_ASSET_CATEGORY_ANNOTATION]).toBe(
      'model-server',
    );
    expect(entity.metadata.annotations[AI_ASSET_SOURCE_ANNOTATION]).toBe('ogx');
    expect(entity.metadata.annotations[AI_ASSET_VERSION_ANNOTATION]).toBe(
      '2.1.0',
    );
  });

  it('should normalize version when no serverVersion is configured', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [{ id: 'model-1' }] }),
    } as Response);

    const provider = new OgxModelEntityProvider({
      config: defaultConfig,
      logger: mockServices.logger.mock(),
      taskRunner,
    });

    await provider.connect(mockConnection);
    await taskRunner.runAll();

    const mutation = (mockConnection.applyMutation as jest.Mock).mock
      .calls[0][0];
    const entity = mutation.entities[0].entity;

    expect(entity.metadata.annotations[AI_ASSET_VERSION_ANNOTATION]).toBe(
      '0.0.0-unknown',
    );
  });

  it('should send Authorization header when apiKey is configured', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);

    const provider = new OgxModelEntityProvider({
      config: { ...defaultConfig, apiKey: 'test-key' },
      logger: mockServices.logger.mock(),
      taskRunner,
    });

    await provider.connect(mockConnection);
    await taskRunner.runAll();

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8321/v1/models',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
        }),
      }),
    );
  });

  it('should handle API errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const provider = new OgxModelEntityProvider({
      config: defaultConfig,
      logger: mockServices.logger.mock(),
      taskRunner,
    });

    await provider.connect(mockConnection);
    await taskRunner.runAll();

    expect(mockConnection.applyMutation).toHaveBeenCalledTimes(1);
    const mutation = (mockConnection.applyMutation as jest.Mock).mock
      .calls[0][0];
    expect(mutation.entities).toHaveLength(0);
  });

  it('should handle empty model list', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);

    const provider = new OgxModelEntityProvider({
      config: defaultConfig,
      logger: mockServices.logger.mock(),
      taskRunner,
    });

    await provider.connect(mockConnection);
    await taskRunner.runAll();

    const mutation = (mockConnection.applyMutation as jest.Mock).mock
      .calls[0][0];
    expect(mutation.entities).toHaveLength(1);
    expect(mutation.entities[0].entity.spec.models.available).toEqual([]);
  });

  describe('TLS configuration', () => {
    it('should not create a dispatcher when neither caData nor skipTLSVerify is set', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      } as Response);

      const provider = new OgxModelEntityProvider({
        config: defaultConfig,
        logger: mockServices.logger.mock(),
        taskRunner,
      });

      await provider.connect(mockConnection);
      await taskRunner.runAll();

      expect(MockAgent).not.toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8321/v1/models',
        expect.not.objectContaining({ dispatcher: expect.anything() }),
      );
    });

    it('should configure HTTPS request with custom CA when caData is set', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ id: 'model-1' }] }),
      } as Response);

      const provider = new OgxModelEntityProvider({
        config: {
          ...defaultConfig,
          baseUrl: 'https://ogx.example.com',
          caData:
            '-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----',
        },
        logger: mockServices.logger.mock(),
        taskRunner,
      });

      await provider.connect(mockConnection);
      await taskRunner.runAll();

      expect(MockAgent).toHaveBeenCalledWith({
        connect: {
          ca: '-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----',
          rejectUnauthorized: true,
        },
      });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://ogx.example.com/v1/models',
        expect.objectContaining({
          dispatcher: expect.anything(),
        }),
      );
    });

    it('should disable certificate verification when skipTLSVerify is true and logs a warning', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ id: 'model-1' }] }),
      } as Response);

      const childWarn = jest.fn();
      const mockLogger = {
        ...mockServices.logger.mock(),
        child: jest.fn().mockReturnValue({
          info: jest.fn(),
          warn: childWarn,
          error: jest.fn(),
          debug: jest.fn(),
          child: jest.fn(),
        }),
      };

      const provider = new OgxModelEntityProvider({
        config: { ...defaultConfig, skipTLSVerify: true },
        logger: mockLogger,
        taskRunner,
      });

      await provider.connect(mockConnection);
      await taskRunner.runAll();

      expect(MockAgent).toHaveBeenCalledWith({
        connect: { rejectUnauthorized: false },
      });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          dispatcher: expect.anything(),
        }),
      );
      expect(childWarn).toHaveBeenCalledWith(
        expect.stringContaining('TLS certificate verification is disabled'),
      );
    });

    it('should give skipTLSVerify precedence when both fields are set', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      } as Response);

      const childWarn = jest.fn();
      const mockLogger = {
        ...mockServices.logger.mock(),
        child: jest.fn().mockReturnValue({
          info: jest.fn(),
          warn: childWarn,
          error: jest.fn(),
          debug: jest.fn(),
          child: jest.fn(),
        }),
      };

      const provider = new OgxModelEntityProvider({
        config: {
          ...defaultConfig,
          caData: '-----BEGIN CERTIFICATE-----\nCA\n-----END CERTIFICATE-----',
          skipTLSVerify: true,
        },
        logger: mockLogger,
        taskRunner,
      });

      await provider.connect(mockConnection);
      await taskRunner.runAll();

      expect(MockAgent).toHaveBeenCalledWith({
        connect: { rejectUnauthorized: false },
      });
      expect(childWarn).toHaveBeenCalledWith(
        expect.stringContaining('TLS certificate verification is disabled'),
      );
    });

    it('should preserve Authorization header when TLS settings are used', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      } as Response);

      const provider = new OgxModelEntityProvider({
        config: {
          ...defaultConfig,
          apiKey: 'secret-key',
          caData: 'PEM-CERT',
        },
        logger: mockServices.logger.mock(),
        taskRunner,
      });

      await provider.connect(mockConnection);
      await taskRunner.runAll();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer secret-key',
          }),
          dispatcher: expect.anything(),
        }),
      );
    });

    it('should retain non-2xx error handling with TLS settings', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
      } as Response);

      const provider = new OgxModelEntityProvider({
        config: { ...defaultConfig, skipTLSVerify: true },
        logger: mockServices.logger.mock(),
        taskRunner,
      });

      await provider.connect(mockConnection);
      await taskRunner.runAll();

      const mutation = (mockConnection.applyMutation as jest.Mock).mock
        .calls[0][0];
      expect(mutation.entities).toHaveLength(0);
    });
  });
});
