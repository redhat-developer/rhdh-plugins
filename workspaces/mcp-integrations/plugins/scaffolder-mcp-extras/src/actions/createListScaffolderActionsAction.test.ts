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
import { createListScaffolderActionsAction } from './createListScaffolderActionsAction';
import { actionsRegistryServiceMock } from '@backstage/backend-test-utils/alpha';

/** Shape returned by scaffolderClient.listActions() (ListActionsResponse) */
type ListAction = {
  id: string;
  description?: string;
  schema?: { input?: object; output?: object };
  examples?: unknown[];
};

type ListActionsOutput = { actions: ListAction[] };

describe('createListScaffolderActionsAction', () => {
  it('should list all scaffolder actions successfully', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockActions: ListAction[] = [
      {
        id: 'fetch:template',
        description: 'Fetches a template',
        schema: { input: { type: 'object' }, output: { type: 'object' } },
      },
      {
        id: 'catalog:register',
        description: 'Registers entities in the catalog',
        schema: { input: { type: 'object' }, output: { type: 'object' } },
        examples: [{ description: 'Basic usage', example: 'register entity' }],
      },
      {
        id: 'debug:log',
        description: 'Logs debug information',
        schema: { input: { type: 'object' }, output: { type: 'object' } },
      },
    ];
    const mockScaffolderClient = {
      listActions: jest.fn().mockResolvedValue(mockActions),
    };

    createListScaffolderActionsAction({
      actionsRegistry: mockActionsRegistry,
      scaffolderClient: mockScaffolderClient as any,
    });

    const result = await mockActionsRegistry.invoke({
      id: 'test:list-scaffolder-actions',
      input: {},
    });

    // Verify output structure
    expect(result.output).toHaveProperty('actions');
    const output = result.output as ListActionsOutput;
    expect(Array.isArray(output.actions)).toBe(true);
    expect(output.actions).toHaveLength(3);

    // Verify actions are sorted by id
    const actionIds = output.actions.map(a => a.id);
    expect(actionIds).toEqual([
      'catalog:register',
      'debug:log',
      'fetch:template',
    ]);

    // Verify action structure and examples from listActions
    const firstAction = output.actions[0];
    expect(firstAction).toEqual({
      id: 'catalog:register',
      description: 'Registers entities in the catalog',
      schema: {
        input: { type: 'object' },
        output: { type: 'object' },
      },
      examples: [{ description: 'Basic usage', example: 'register entity' }],
    });
  });

  it('should handle actions without descriptions or schemas', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockActions: ListAction[] = [
      {
        id: 'minimal-action',
        description: '',
        schema: { input: {}, output: {} },
      },
    ];
    const mockScaffolderClient = {
      listActions: jest.fn().mockResolvedValue(mockActions),
    };

    createListScaffolderActionsAction({
      actionsRegistry: mockActionsRegistry,
      scaffolderClient: mockScaffolderClient as any,
    });

    const result = await mockActionsRegistry.invoke({
      id: 'test:list-scaffolder-actions',
      input: {},
    });

    const output = result.output as ListActionsOutput;
    expect(output.actions).toHaveLength(1);
    expect(output.actions[0]).toEqual({
      id: 'minimal-action',
      description: '',
      schema: { input: {}, output: {} },
      examples: [],
    });
  });

  it('should return empty array when no actions are registered', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockScaffolderClient = {
      listActions: jest.fn().mockResolvedValue([]),
    };

    createListScaffolderActionsAction({
      actionsRegistry: mockActionsRegistry,
      scaffolderClient: mockScaffolderClient as any,
    });

    const result = await mockActionsRegistry.invoke({
      id: 'test:list-scaffolder-actions',
      input: {},
    });

    const output = result.output as ListActionsOutput;
    expect(output.actions).toEqual([]);
  });

  it('should maintain consistent sorting across multiple calls', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const mockActions: ListAction[] = [
      { id: 'z-action', description: 'Last alphabetically', schema: {} },
      { id: 'a-action', description: 'First alphabetically', schema: {} },
      { id: 'middle-action', description: 'Middle alphabetically', schema: {} },
    ];
    const mockScaffolderClient = {
      listActions: jest.fn().mockResolvedValue(mockActions),
    };

    createListScaffolderActionsAction({
      actionsRegistry: mockActionsRegistry,
      scaffolderClient: mockScaffolderClient as any,
    });

    const result1 = await mockActionsRegistry.invoke({
      id: 'test:list-scaffolder-actions',
      input: {},
    });
    const result2 = await mockActionsRegistry.invoke({
      id: 'test:list-scaffolder-actions',
      input: {},
    });

    const output1 = result1.output as ListActionsOutput;
    const output2 = result2.output as ListActionsOutput;
    const ids1 = output1.actions.map(a => a.id);
    const ids2 = output2.actions.map(a => a.id);

    expect(ids1).toEqual(['a-action', 'middle-action', 'z-action']);
    expect(ids1).toEqual(ids2);
  });

  it('should include all action properties in the output', async () => {
    const mockActionsRegistry = actionsRegistryServiceMock();
    const complexAction: ListAction = {
      id: 'complex-action',
      description: 'A complex action with all properties',
      schema: {
        input: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            count: { type: 'number' },
          },
        },
        output: {
          type: 'object',
          properties: {
            result: { type: 'string' },
          },
        },
      },
      examples: [
        { description: 'Example 1', example: 'example content 1' },
        { description: 'Example 2', example: 'example content 2' },
      ],
    };
    const mockScaffolderClient = {
      listActions: jest.fn().mockResolvedValue([complexAction]),
    };

    createListScaffolderActionsAction({
      actionsRegistry: mockActionsRegistry,
      scaffolderClient: mockScaffolderClient as any,
    });

    const result = await mockActionsRegistry.invoke({
      id: 'test:list-scaffolder-actions',
      input: {},
    });

    const output = result.output as ListActionsOutput;
    expect(output.actions[0]).toEqual({
      id: 'complex-action',
      description: 'A complex action with all properties',
      schema: {
        input: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            count: { type: 'number' },
          },
        },
        output: {
          type: 'object',
          properties: {
            result: { type: 'string' },
          },
        },
      },
      examples: [
        { description: 'Example 1', example: 'example content 1' },
        { description: 'Example 2', example: 'example content 2' },
      ],
    });
  });
});
