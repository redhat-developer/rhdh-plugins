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

import {
  CallToolResultSchema,
  ListToolsResultSchema,
} from '@modelcontextprotocol/sdk/types.js';

import {
  mockOrchestratorService,
  parseCallToolError,
  parseCallToolOutput,
  startMcpBackend,
  withMcpClient,
} from './__testUtils__/mcpTestUtils';

/**
 * Pyramid invariant (RHIDP-14041): the per-action unit tests
 * (`actions/*.test.ts`) already prove each action's branching/mapping logic
 * against mocked services. This suite proves the remaining, un-mocked
 * concern - that all 5 actions are actually *wired*: registered by the real
 * `orchestratorPlugin`, reachable through the real `@backstage/plugin-mcp-actions-backend`
 * plugin, and callable end-to-end by a real `@modelcontextprotocol/sdk`
 * client - not just invokable directly against `ActionsRegistryService`
 * mocks. Mirrors Scorecard PR #3332's `mcp-tools.integration.test.ts`.
 */

type McpTestBackend = Awaited<ReturnType<typeof startMcpBackend>>;

const ORCHESTRATOR_TOOL_NAMES = [
  'orchestrator.list-workflows',
  'orchestrator.get-workflow-schema',
  'orchestrator.execute-workflow',
  'orchestrator.list-instances',
  'orchestrator.get-instance',
] as const;

const READ_ONLY_TOOL_NAMES = [
  'orchestrator.list-workflows',
  'orchestrator.get-workflow-schema',
  'orchestrator.list-instances',
  'orchestrator.get-instance',
] as const;

function rawInstance(overrides: Record<string, unknown> = {}) {
  return {
    id: 'instance1',
    processId: 'workflow1',
    processName: 'Onboard Employee',
    nodes: [],
    state: 'ACTIVE',
    start: '2024-01-01T00:00:00.000Z',
    variables: {
      workflowdata: { foo: 'bar' },
      initiatorEntity: 'user:default/test',
    },
    ...overrides,
  };
}

describe('Orchestrator MCP tools integration', () => {
  let allowedBackend: McpTestBackend;
  let deniedBackend: McpTestBackend;

  beforeAll(async () => {
    allowedBackend = await startMcpBackend({ permissionMode: 'allow-all' });
    deniedBackend = await startMcpBackend({ permissionMode: 'deny-all' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exposes all 5 orchestrator tools through MCP tools/list', async () => {
    await withMcpClient(allowedBackend.server, async client => {
      const result = await client.request(
        { method: 'tools/list' },
        ListToolsResultSchema,
      );

      const toolNames = result.tools.map(tool => tool.name);
      expect(toolNames).toEqual(
        expect.arrayContaining(ORCHESTRATOR_TOOL_NAMES),
      );
    });
  });

  it('marks the 4 read actions read-only and execute-workflow not read-only', async () => {
    await withMcpClient(allowedBackend.server, async client => {
      const result = await client.request(
        { method: 'tools/list' },
        ListToolsResultSchema,
      );

      const toolsByName = Object.fromEntries(
        result.tools.map(tool => [tool.name, tool]),
      );

      for (const toolName of READ_ONLY_TOOL_NAMES) {
        expect(toolsByName[toolName]?.annotations?.readOnlyHint).toBe(true);
      }
      expect(
        toolsByName['orchestrator.execute-workflow']?.annotations?.readOnlyHint,
      ).toBe(false);
    });
  });

  it('calls orchestrator.list-workflows and returns configured workflows', async () => {
    mockOrchestratorService.fetchWorkflowOverviews.mockResolvedValue([
      { workflowId: 'workflow1', name: 'Onboard Employee' },
    ]);

    await withMcpClient(allowedBackend.server, async client => {
      const result = await client.callTool(
        { name: 'orchestrator.list-workflows', arguments: {} },
        CallToolResultSchema,
      );

      const output = parseCallToolOutput(result) as {
        workflows: Array<{ workflowId: string }>;
      };

      expect(result.isError).not.toBe(true);
      expect(output.workflows.map(w => w.workflowId)).toContain('workflow1');
    });
  });

  it('calls orchestrator.get-workflow-schema and returns the input schema', async () => {
    mockOrchestratorService.fetchWorkflowInfo.mockResolvedValue({
      id: 'workflow1',
      serviceUrl: 'http://localhost:8080',
    });
    mockOrchestratorService.fetchWorkflowDefinition.mockResolvedValue({
      id: 'workflow1',
      dataInputSchema: 'schema.json',
    });
    mockOrchestratorService.fetchWorkflowInfoOnService.mockResolvedValue({
      id: 'workflow1',
      inputSchema: {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
      },
    });

    await withMcpClient(allowedBackend.server, async client => {
      const result = await client.callTool(
        {
          name: 'orchestrator.get-workflow-schema',
          arguments: { workflowId: 'workflow1' },
        },
        CallToolResultSchema,
      );

      const output = parseCallToolOutput(result) as {
        inputSchema: { required: string[] };
      };

      expect(result.isError).not.toBe(true);
      expect(output.inputSchema.required).toEqual(['name']);
    });
  });

  it('returns a tool error when orchestrator.get-workflow-schema targets a missing workflow', async () => {
    mockOrchestratorService.fetchWorkflowInfo.mockResolvedValue(undefined);

    await withMcpClient(allowedBackend.server, async client => {
      const result = await client.callTool(
        {
          name: 'orchestrator.get-workflow-schema',
          arguments: { workflowId: 'missing-workflow' },
        },
        CallToolResultSchema,
      );

      expect(result.isError).toBe(true);
      expect(parseCallToolError(result)).toContain('missing-workflow');
    });
  });

  it('calls orchestrator.execute-workflow and returns the new instance id and status', async () => {
    mockOrchestratorService.fetchWorkflowInfo.mockResolvedValue({
      id: 'workflow1',
      serviceUrl: 'http://localhost:8080',
    });
    mockOrchestratorService.fetchWorkflowDefinition.mockResolvedValue({
      id: 'workflow1',
    });
    mockOrchestratorService.executeWorkflow.mockResolvedValue({
      id: 'instance1',
    });
    mockOrchestratorService.fetchInstance.mockResolvedValue(rawInstance());

    await withMcpClient(allowedBackend.server, async client => {
      const result = await client.callTool(
        {
          name: 'orchestrator.execute-workflow',
          arguments: { workflowId: 'workflow1', inputs: {} },
        },
        CallToolResultSchema,
      );

      const output = parseCallToolOutput(result) as {
        instanceId: string;
        status: string;
      };

      expect(result.isError).not.toBe(true);
      expect(output).toEqual({ instanceId: 'instance1', status: 'ACTIVE' });
    });
  });

  it('calls orchestrator.list-instances and returns configured instances', async () => {
    mockOrchestratorService.getWorkflowIds.mockReturnValue(['workflow1']);
    mockOrchestratorService.fetchInstances.mockResolvedValue([rawInstance()]);

    await withMcpClient(allowedBackend.server, async client => {
      const result = await client.callTool(
        { name: 'orchestrator.list-instances', arguments: {} },
        CallToolResultSchema,
      );

      const output = parseCallToolOutput(result) as {
        instances: Array<{ instanceId: string }>;
      };

      expect(result.isError).not.toBe(true);
      expect(output.instances.map(i => i.instanceId)).toContain('instance1');
    });
  });

  it('calls orchestrator.get-instance and returns the instance details', async () => {
    mockOrchestratorService.fetchInstance.mockResolvedValue(rawInstance());

    await withMcpClient(allowedBackend.server, async client => {
      const result = await client.callTool(
        {
          name: 'orchestrator.get-instance',
          arguments: { instanceId: 'instance1' },
        },
        CallToolResultSchema,
      );

      const output = parseCallToolOutput(result) as { instanceId: string };

      expect(result.isError).not.toBe(true);
      expect(output.instanceId).toBe('instance1');
    });
  });

  it('returns a tool error when access is denied', async () => {
    await withMcpClient(deniedBackend.server, async client => {
      const result = await client.callTool(
        { name: 'orchestrator.list-workflows', arguments: {} },
        CallToolResultSchema,
      );

      expect(result.isError).toBe(true);
      expect(parseCallToolError(result)).toContain('denied');
    });
  });
});
