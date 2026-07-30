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

import { LlamaStackModelEntityProvider } from './LlamaStackModelEntityProvider';
import type { LlamaStackEntityProviderConfig } from '../types';

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

const defaultConfig: LlamaStackEntityProviderConfig = {
  baseUrl: 'http://localhost:8321',
};

describe('LlamaStackModelEntityProvider', () => {
  let taskRunner: TaskRunnerMock;

  beforeEach(() => {
    jest.clearAllMocks();
    taskRunner = new TaskRunnerMock();
  });

  it('should return the correct provider name', () => {
    const provider = new LlamaStackModelEntityProvider({
      config: defaultConfig,
      logger: mockServices.logger.mock(),
      taskRunner,
    });

    expect(provider.getProviderName()).toBe('llamastack-model-entity-provider');
  });

  it('should emit Resource entities for models', async () => {
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

    const provider = new LlamaStackModelEntityProvider({
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
    expect(mutation.entities).toHaveLength(2);

    const entity = mutation.entities[0].entity;
    expect(entity.kind).toBe('Resource');
    expect(entity.spec.type).toBe('ai-model');
    expect(entity.spec.lifecycle).toBe('production');
    expect(entity.spec.owner).toBe('user:default/meta');
    expect(entity.metadata.annotations['boost.redhat.com/model-id']).toBe(
      'meta-llama/Llama-3.1-8B-Instruct',
    );
  });

  it('should send Authorization header when apiKey is configured', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);

    const provider = new LlamaStackModelEntityProvider({
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

    const provider = new LlamaStackModelEntityProvider({
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

    const provider = new LlamaStackModelEntityProvider({
      config: defaultConfig,
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
