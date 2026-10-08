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
  let conditionalBackend: McpTestBackend;

  beforeAll(async () => {
    allowedBackend = await startMcpBackend({ permissionMode: 'allow-all' });
    deniedBackend = await startMcpBackend({ permissionMode: 'deny-all' });
    conditionalBackend = await startMcpBackend({
      permissionMode: 'conditional-workflow1-only',
    });
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

  it('marks read tools read-only and execute-workflow destructive', async () => {
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
        expect(typeof toolsByName[toolName]?.annotations?.destructiveHint).toBe(
          'boolean',
        );
      }

      expect(
        toolsByName['orchestrator.execute-workflow']?.annotations?.readOnlyHint,
      ).toBe(false);
      expect(
        toolsByName['orchestrator.execute-workflow']?.annotations
          ?.destructiveHint,
      ).toBe(true);
    });
  });

  it('hides orchestrator tools when orchestrator is not in pluginSources', async () => {
    const filteredBackend = await startMcpBackend({ pluginSources: [] });

    await withMcpClient(filteredBackend.server, async client => {
      const result = await client.request(
        { method: 'tools/list' },
        ListToolsResultSchema,
      );

      const toolNames = result.tools.map(tool => tool.name);
      for (const toolName of ORCHESTRATOR_TOOL_NAMES) {
        expect(toolNames).not.toContain(toolName);
      }
    });
  });

  it('calls orchestrator.list-workflows and returns configured workflows', async () => {
    mockOrchestratorService.fetchWorkflowOverviews.mockResolvedValue([
      { workflowId: 'workflow1', name: 'Onboard Employee' },
      { workflowId: 'workflow2', name: 'Offboard Employee' },
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
      expect(output.workflows.map(w => w.workflowId)).toEqual(
        expect.arrayContaining(['workflow1', 'workflow2']),
      );
    });
  });

  it('filters orchestrator.list-workflows for conditional workflow permissions', async () => {
    mockOrchestratorService.fetchWorkflowOverviews.mockResolvedValue([
      { workflowId: 'workflow1', name: 'Onboard Employee' },
      { workflowId: 'workflow2', name: 'Offboard Employee' },
    ]);

    await withMcpClient(conditionalBackend.server, async client => {
      const result = await client.callTool(
        { name: 'orchestrator.list-workflows', arguments: {} },
        CallToolResultSchema,
      );

      const output = parseCallToolOutput(result) as {
        workflows: Array<{ workflowId: string }>;
      };

      expect(result.isError).not.toBe(true);
      expect(output.workflows.map(w => w.workflowId)).toEqual(['workflow1']);
    });
  });

  it('returns a tool error when orchestrator.list-workflows access is denied', async () => {
    await withMcpClient(deniedBackend.server, async client => {
      const result = await client.callTool(
        { name: 'orchestrator.list-workflows', arguments: {} },
        CallToolResultSchema,
      );

      expect(result.isError).toBe(true);
      expect(parseCallToolError(result)).toContain('denied');
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

  it('returns validation error when get-workflow-schema workflowId is missing', async () => {
    await withMcpClient(allowedBackend.server, async client => {
      const result = await client.callTool(
        {
          name: 'orchestrator.get-workflow-schema',
          arguments: {},
        },
        CallToolResultSchema,
      );

      expect(result.isError).toBe(true);
      expect(parseCallToolError(result)).toContain('workflowId');
    });
  });

  it('returns validation error when get-workflow-schema workflowId has invalid type', async () => {
    await withMcpClient(allowedBackend.server, async client => {
      const result = await client.callTool(
        {
          name: 'orchestrator.get-workflow-schema',
          arguments: { workflowId: 12345 },
        },
        CallToolResultSchema,
      );

      expect(result.isError).toBe(true);
      expect(parseCallToolError(result)).toContain('workflowId');
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

  it('returns a tool error when execute-workflow inputs fail schema validation', async () => {
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
          name: 'orchestrator.execute-workflow',
          arguments: { workflowId: 'workflow1', inputs: {} },
        },
        CallToolResultSchema,
      );

      expect(result.isError).toBe(true);
      expect(parseCallToolError(result)).toContain('Invalid inputs');
      expect(parseCallToolError(result)).toContain('workflow1');
    });
  });

  it('returns a tool error when orchestrator.execute-workflow access is denied', async () => {
    await withMcpClient(deniedBackend.server, async client => {
      const result = await client.callTool(
        {
          name: 'orchestrator.execute-workflow',
          arguments: { workflowId: 'workflow1', inputs: {} },
        },
        CallToolResultSchema,
      );

      expect(result.isError).toBe(true);
      expect(parseCallToolError(result)).toContain('denied');
    });
  });

  it('returns validation error when execute-workflow workflowId is missing', async () => {
    await withMcpClient(allowedBackend.server, async client => {
      const result = await client.callTool(
        {
          name: 'orchestrator.execute-workflow',
          arguments: { inputs: {} },
        },
        CallToolResultSchema,
      );

      expect(result.isError).toBe(true);
      expect(parseCallToolError(result)).toContain('workflowId');
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

  it('returns a tool error when orchestrator.get-instance targets a missing instance', async () => {
    mockOrchestratorService.fetchInstance.mockResolvedValue(undefined);

    await withMcpClient(allowedBackend.server, async client => {
      const result = await client.callTool(
        {
          name: 'orchestrator.get-instance',
          arguments: { instanceId: 'missing-instance' },
        },
        CallToolResultSchema,
      );

      expect(result.isError).toBe(true);
      expect(parseCallToolError(result)).toContain('missing-instance');
    });
  });

  it('returns validation error when get-instance instanceId is missing', async () => {
    await withMcpClient(allowedBackend.server, async client => {
      const result = await client.callTool(
        {
          name: 'orchestrator.get-instance',
          arguments: {},
        },
        CallToolResultSchema,
      );

      expect(result.isError).toBe(true);
      expect(parseCallToolError(result)).toContain('instanceId');
    });
  });

  it('returns validation error when get-instance instanceId has invalid type', async () => {
    await withMcpClient(allowedBackend.server, async client => {
      const result = await client.callTool(
        {
          name: 'orchestrator.get-instance',
          arguments: { instanceId: 12345 },
        },
        CallToolResultSchema,
      );

      expect(result.isError).toBe(true);
      expect(parseCallToolError(result)).toContain('instanceId');
    });
  });
});
