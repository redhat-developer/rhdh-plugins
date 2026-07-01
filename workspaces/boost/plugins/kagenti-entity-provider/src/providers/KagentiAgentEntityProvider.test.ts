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

import { KagentiAgentEntityProvider } from './KagentiAgentEntityProvider';
import type { AgentCard, KagentiEntityProviderConfig } from '../types';

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

describe('KagentiAgentEntityProvider', () => {
  let taskRunner: TaskRunnerMock;

  beforeEach(() => {
    jest.clearAllMocks();
    taskRunner = new TaskRunnerMock();
  });

  it('should return the correct provider name', () => {
    const provider = new KagentiAgentEntityProvider({
      config: defaultConfig,
      logger: mockServices.logger.mock(),
      taskRunner,
    });

    expect(provider.getProviderName()).toBe('kagenti-agent-entity-provider');
  });

  it('should connect and run successfully', async () => {
    const agents: AgentCard[] = [
      {
        id: 'agent-1',
        name: 'Test Agent',
        description: 'A test agent',
        url: 'http://localhost:8080/a2a/agents/agent-1',
        namespace: 'default',
        createdBy: 'user:default/admin',
        lifecycleStage: 'published',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => agents,
    } as Response);

    const provider = new KagentiAgentEntityProvider({
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
    expect(entity.kind).toBe('Component');
    expect(entity.spec.type).toBe('ai-agent');
    expect(entity.spec.lifecycle).toBe('production');
    expect(entity.spec.owner).toBe('user:default/admin');
    expect(entity.metadata.title).toBe('Test Agent');
    expect(
      entity.metadata.annotations['boost.redhat.com/lifecycle-stage'],
    ).toBe('published');
  });

  it('should map lifecycle stages correctly', async () => {
    const agents: AgentCard[] = [
      {
        id: 'draft-agent',
        name: 'Draft',
        url: 'http://example.com',
        lifecycleStage: 'draft',
      },
      {
        id: 'pending-agent',
        name: 'Pending',
        url: 'http://example.com',
        lifecycleStage: 'pending',
      },
      {
        id: 'published-agent',
        name: 'Published',
        url: 'http://example.com',
        lifecycleStage: 'published',
      },
      {
        id: 'archived-agent',
        name: 'Archived',
        url: 'http://example.com',
        lifecycleStage: 'archived',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => agents,
    } as Response);

    const provider = new KagentiAgentEntityProvider({
      config: defaultConfig,
      logger: mockServices.logger.mock(),
      taskRunner,
    });

    await provider.connect(mockConnection);
    await taskRunner.runAll();

    const mutation = (mockConnection.applyMutation as jest.Mock).mock
      .calls[0][0];
    expect(mutation.entities).toHaveLength(4);

    const lifecycles = mutation.entities.map(
      (e: { entity: { spec: { lifecycle: string } } }) =>
        e.entity.spec.lifecycle,
    );
    expect(lifecycles).toEqual([
      'experimental',
      'experimental',
      'production',
      'deprecated',
    ]);
  });

  it('should handle API errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const provider = new KagentiAgentEntityProvider({
      config: defaultConfig,
      logger: mockServices.logger.mock(),
      taskRunner,
    });

    await provider.connect(mockConnection);
    await taskRunner.runAll();

    // Should still call applyMutation with empty entities
    expect(mockConnection.applyMutation).toHaveBeenCalledTimes(1);
    const mutation = (mockConnection.applyMutation as jest.Mock).mock
      .calls[0][0];
    expect(mutation.entities).toHaveLength(0);
  });

  it('should handle fetch failures gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const provider = new KagentiAgentEntityProvider({
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

  it('should use correct API URL pattern /api/v1/agents', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);

    const provider = new KagentiAgentEntityProvider({
      config: defaultConfig,
      logger: mockServices.logger.mock(),
      taskRunner,
    });

    await provider.connect(mockConnection);
    await taskRunner.runAll();

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/agents?namespace=default',
      expect.objectContaining({ headers: expect.any(Object) }),
    );
  });

  it('should handle { items: AgentCard[] } response shape', async () => {
    const agents: AgentCard[] = [
      {
        id: 'agent-1',
        name: 'Test Agent',
        url: 'http://example.com',
        namespace: 'default',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: agents }),
    } as Response);

    const provider = new KagentiAgentEntityProvider({
      config: defaultConfig,
      logger: mockServices.logger.mock(),
      taskRunner,
    });

    await provider.connect(mockConnection);
    await taskRunner.runAll();

    const mutation = (mockConnection.applyMutation as jest.Mock).mock
      .calls[0][0];
    expect(mutation.entities).toHaveLength(1);
    expect(mutation.entities[0].entity.metadata.title).toBe('Test Agent');
  });

  it('should include bearer token header when authClient is provided', async () => {
    const mockAuthClient = {
      getBearerToken: jest.fn().mockResolvedValue('test-token-123'),
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);

    const provider = new KagentiAgentEntityProvider({
      config: defaultConfig,
      logger: mockServices.logger.mock(),
      taskRunner,
      authClient: mockAuthClient as any,
    });

    await provider.connect(mockConnection);
    await taskRunner.runAll();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token-123',
        }),
      }),
    );
  });

  it('should handle auth failure gracefully', async () => {
    const mockAuthClient = {
      getBearerToken: jest
        .fn()
        .mockRejectedValue(new Error('Keycloak unavailable')),
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);

    const provider = new KagentiAgentEntityProvider({
      config: defaultConfig,
      logger: mockServices.logger.mock(),
      taskRunner,
      authClient: mockAuthClient as any,
    });

    await provider.connect(mockConnection);
    await taskRunner.runAll();

    // Should still call fetch (without auth header) and applyMutation
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockConnection.applyMutation).toHaveBeenCalledTimes(1);
  });

  it('should scan multiple namespaces', async () => {
    const ns1Agents: AgentCard[] = [
      { id: 'agent-1', name: 'Agent 1', url: 'http://example.com' },
    ];
    const ns2Agents: AgentCard[] = [
      { id: 'agent-2', name: 'Agent 2', url: 'http://example.com' },
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ns1Agents,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ns2Agents,
      } as Response);

    const provider = new KagentiAgentEntityProvider({
      config: {
        ...defaultConfig,
        namespaces: ['ns1', 'ns2'],
      },
      logger: mockServices.logger.mock(),
      taskRunner,
    });

    await provider.connect(mockConnection);
    await taskRunner.runAll();

    const mutation = (mockConnection.applyMutation as jest.Mock).mock
      .calls[0][0];
    expect(mutation.entities).toHaveLength(2);
  });
});
