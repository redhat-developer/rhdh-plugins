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

import { LlamaStackAgentEntityProvider } from './LlamaStackAgentEntityProvider';
import type { LlamaStackEntityProviderConfig } from '../types';

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

describe('LlamaStackAgentEntityProvider', () => {
  let taskRunner: TaskRunnerMock;

  beforeEach(() => {
    jest.clearAllMocks();
    taskRunner = new TaskRunnerMock();
  });

  it('should return the correct provider name', () => {
    const config: LlamaStackEntityProviderConfig = {
      baseUrl: 'http://localhost:8321',
    };

    const provider = new LlamaStackAgentEntityProvider({
      config,
      logger: mockServices.logger.mock(),
      taskRunner,
    });

    expect(provider.getProviderName()).toBe('llamastack-agent-entity-provider');
  });

  it('should emit Component entities for configured agents', async () => {
    const config: LlamaStackEntityProviderConfig = {
      baseUrl: 'http://localhost:8321',
      agents: [
        {
          id: 'code-assistant',
          name: 'Code Assistant',
          description: 'Helps with code',
          model: 'meta-llama/Llama-3.1-8B-Instruct',
          createdBy: 'user:default/admin',
          lifecycleStage: 'published',
        },
      ],
    };

    const provider = new LlamaStackAgentEntityProvider({
      config,
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
    expect(entity.metadata.title).toBe('Code Assistant');
    expect(entity.metadata.annotations['boost.redhat.com/model']).toBe(
      'meta-llama/Llama-3.1-8B-Instruct',
    );
  });

  it('should emit empty entities when no agents configured', async () => {
    const config: LlamaStackEntityProviderConfig = {
      baseUrl: 'http://localhost:8321',
    };

    const provider = new LlamaStackAgentEntityProvider({
      config,
      logger: mockServices.logger.mock(),
      taskRunner,
    });

    await provider.connect(mockConnection);
    await taskRunner.runAll();

    const mutation = (mockConnection.applyMutation as jest.Mock).mock
      .calls[0][0];
    expect(mutation.entities).toHaveLength(0);
  });

  it('should include dependsOn for tools and handoff targets', async () => {
    const config: LlamaStackEntityProviderConfig = {
      baseUrl: 'http://localhost:8321',
      agents: [
        {
          id: 'orchestrator',
          name: 'Orchestrator',
          tools: ['code-search', 'web-browser'],
          handoffTargets: ['code-assistant'],
        },
      ],
    };

    const provider = new LlamaStackAgentEntityProvider({
      config,
      logger: mockServices.logger.mock(),
      taskRunner,
    });

    await provider.connect(mockConnection);
    await taskRunner.runAll();

    const mutation = (mockConnection.applyMutation as jest.Mock).mock
      .calls[0][0];
    const entity = mutation.entities[0].entity;

    expect(entity.spec.dependsOn).toEqual([
      'resource:default/llamastack-tool-code-search',
      'resource:default/llamastack-tool-web-browser',
      'component:default/llamastack-agent-code-assistant',
    ]);
  });

  it('should map lifecycle stages correctly', async () => {
    const config: LlamaStackEntityProviderConfig = {
      baseUrl: 'http://localhost:8321',
      agents: [
        { id: 'draft', name: 'Draft', lifecycleStage: 'draft' },
        { id: 'pending', name: 'Pending', lifecycleStage: 'pending' },
        { id: 'published', name: 'Published', lifecycleStage: 'published' },
        { id: 'archived', name: 'Archived', lifecycleStage: 'archived' },
      ],
    };

    const provider = new LlamaStackAgentEntityProvider({
      config,
      logger: mockServices.logger.mock(),
      taskRunner,
    });

    await provider.connect(mockConnection);
    await taskRunner.runAll();

    const mutation = (mockConnection.applyMutation as jest.Mock).mock
      .calls[0][0];

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
});
