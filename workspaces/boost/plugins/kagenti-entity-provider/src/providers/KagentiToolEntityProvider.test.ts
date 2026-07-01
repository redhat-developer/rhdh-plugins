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

import { KagentiToolEntityProvider } from './KagentiToolEntityProvider';
import type { KagentiEntityProviderConfig, KagentiTool } from '../types';

// Mock fetch globally
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

const defaultConfig: KagentiEntityProviderConfig = {
  baseUrl: 'http://localhost:8080',
  namespaces: ['default'],
};

describe('KagentiToolEntityProvider', () => {
  let taskRunner: TaskRunnerMock;

  beforeEach(() => {
    jest.clearAllMocks();
    taskRunner = new TaskRunnerMock();
  });

  it('should return the correct provider name', () => {
    const provider = new KagentiToolEntityProvider({
      config: defaultConfig,
      logger: mockServices.logger.mock(),
      taskRunner,
    });

    expect(provider.getProviderName()).toBe('kagenti-tool-entity-provider');
  });

  it('should emit Resource entities with spec.type ai-tool', async () => {
    const tools: KagentiTool[] = [
      {
        id: 'tool-1',
        name: 'Code Search',
        description: 'Search code repositories',
        namespace: 'default',
        createdBy: 'admin',
        lifecycleStage: 'published',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => tools,
    } as Response);

    const provider = new KagentiToolEntityProvider({
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
    expect(entity.kind).toBe('Resource');
    expect(entity.spec.type).toBe('ai-tool');
    expect(entity.spec.lifecycle).toBe('production');
    expect(entity.spec.owner).toBe('user:default/admin');
    expect(entity.metadata.title).toBe('Code Search');
  });

  it('should fetch from /api/v1/tools URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);

    const provider = new KagentiToolEntityProvider({
      config: defaultConfig,
      logger: mockServices.logger.mock(),
      taskRunner,
    });

    await provider.connect(mockConnection);
    await taskRunner.runAll();

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/tools?namespace=default',
      expect.objectContaining({ headers: expect.any(Object) }),
    );
  });

  it('should handle { items: [...] } response shape', async () => {
    const tools: KagentiTool[] = [
      {
        id: 'wrapped-tool',
        name: 'Wrapped Tool',
        description: 'A wrapped tool',
        namespace: 'default',
        lifecycleStage: 'published',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: tools }),
    } as Response);

    const provider = new KagentiToolEntityProvider({
      config: defaultConfig,
      logger: mockServices.logger.mock(),
      taskRunner,
    });

    await provider.connect(mockConnection);
    await taskRunner.runAll();

    const mutation = (mockConnection.applyMutation as jest.Mock).mock
      .calls[0][0];
    expect(mutation.entities).toHaveLength(1);
    expect(mutation.entities[0].entity.metadata.title).toBe('Wrapped Tool');
  });

  it('should handle empty tool list', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);

    const provider = new KagentiToolEntityProvider({
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

  it('should handle API errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
    } as Response);

    const provider = new KagentiToolEntityProvider({
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
});
