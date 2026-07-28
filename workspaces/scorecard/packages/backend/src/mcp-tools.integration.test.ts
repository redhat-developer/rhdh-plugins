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
  createTestComponentEntity,
  parseCallToolError,
  parseCallToolOutput,
  startMcpBackend,
  withMcpClient,
} from './__fixtures__/mcpTestUtils';

type McpTestBackend = Awaited<ReturnType<typeof startMcpBackend>>;

const SCORECARD_TOOL_NAMES = [
  'scorecard.get-entity-metrics',
  'scorecard.list-metrics',
] as const;
const EXISTING_ENTITY_REF = 'component:default/test-service';
const TEST_SERVICE_ENTITY = createTestComponentEntity('test-service');

describe('Scorecard MCP tools integration', () => {
  let backend: McpTestBackend;
  let backendWithEntity: McpTestBackend;
  let deniedBackend: McpTestBackend;
  let conditionalBackend: McpTestBackend;

  beforeAll(async () => {
    backend = await startMcpBackend({
      pluginSources: ['scorecard'],
    });
    backendWithEntity = await startMcpBackend({
      pluginSources: ['scorecard'],
      entities: [TEST_SERVICE_ENTITY],
    });
    deniedBackend = await startMcpBackend({
      pluginSources: ['scorecard'],
      entities: [TEST_SERVICE_ENTITY],
      permissionMode: 'deny-entity-read',
    });
    conditionalBackend = await startMcpBackend({
      pluginSources: ['scorecard'],
      permissionMode: 'conditional-license-only',
    });
  });

  it('exposes scorecard tools through MCP tools/list', async () => {
    await withMcpClient(backend.server, async client => {
      const result = await client.request(
        { method: 'tools/list' },
        ListToolsResultSchema,
      );

      const toolNames = result.tools.map(tool => tool.name);
      expect(toolNames).toEqual(expect.arrayContaining(SCORECARD_TOOL_NAMES));
    });
  });

  it('marks scorecard tools as read-only in MCP metadata', async () => {
    await withMcpClient(backend.server, async client => {
      const result = await client.request(
        { method: 'tools/list' },
        ListToolsResultSchema,
      );

      const toolsByName = Object.fromEntries(
        result.tools.map(tool => [tool.name, tool]),
      );

      for (const toolName of SCORECARD_TOOL_NAMES) {
        expect(toolsByName[toolName]?.annotations?.readOnlyHint).toBe(true);
        expect(typeof toolsByName[toolName]?.annotations?.destructiveHint).toBe(
          'boolean',
        );
      }
    });
  });

  it('calls scorecard.list-metrics and returns configured metrics', async () => {
    await withMcpClient(backend.server, async client => {
      const result = await client.callTool(
        { name: 'scorecard.list-metrics', arguments: {} },
        CallToolResultSchema,
      );

      const output = parseCallToolOutput(result) as {
        metrics: Array<{ id: string }>;
      };
      const metricIds = output.metrics.map(metric => metric.id);

      expect(metricIds).toEqual(
        expect.arrayContaining(['filecheck.license', 'filecheck.codeowners']),
      );
    });
  });

  it('filters scorecard.list-metrics for conditional metric permissions', async () => {
    await withMcpClient(conditionalBackend.server, async client => {
      const result = await client.callTool(
        { name: 'scorecard.list-metrics', arguments: {} },
        CallToolResultSchema,
      );

      const output = parseCallToolOutput(result) as {
        metrics: Array<{ id: string }>;
      };
      const metricIds = output.metrics.map(metric => metric.id);

      expect(result.isError).not.toBe(true);
      expect(metricIds).toEqual(['filecheck.license']);
    });
  });

  it('hides scorecard tools when scorecard is not in pluginSources', async () => {
    const filteredBackend = await startMcpBackend({ pluginSources: [] });

    await withMcpClient(filteredBackend.server, async client => {
      const result = await client.request(
        { method: 'tools/list' },
        ListToolsResultSchema,
      );

      const toolNames = result.tools.map(tool => tool.name);
      for (const scorecardToolName of SCORECARD_TOOL_NAMES) {
        expect(toolNames).not.toContain(scorecardToolName);
      }
    });
  });

  it('calls scorecard.get-entity-metrics and returns metrics for existing entity', async () => {
    await withMcpClient(backendWithEntity.server, async client => {
      const result = await client.callTool(
        {
          name: 'scorecard.get-entity-metrics',
          arguments: { entityRef: EXISTING_ENTITY_REF },
        },
        CallToolResultSchema,
      );

      const output = parseCallToolOutput(result) as { metrics: unknown[] };

      expect(result.isError).not.toBe(true);
      expect(output).toEqual({ metrics: [] });
    });
  });

  it('returns tool error when scorecard.get-entity-metrics entity does not exist', async () => {
    await withMcpClient(backend.server, async client => {
      const result = await client.callTool(
        {
          name: 'scorecard.get-entity-metrics',
          arguments: { entityRef: 'component:default/non-existent' },
        },
        CallToolResultSchema,
      );

      const errorText = parseCallToolError(result);

      expect(result.isError).toBe(true);
      expect(errorText).toContain('Entity not found');
      expect(errorText).toContain('component:default/non-existent');
    });
  });

  it('returns tool error when scorecard.get-entity-metrics access is denied', async () => {
    await withMcpClient(deniedBackend.server, async client => {
      const result = await client.callTool(
        {
          name: 'scorecard.get-entity-metrics',
          arguments: { entityRef: EXISTING_ENTITY_REF },
        },
        CallToolResultSchema,
      );

      const errorText = parseCallToolError(result);

      expect(result.isError).toBe(true);
      expect(errorText).toContain('entity metrics denied');
      expect(errorText).toContain(EXISTING_ENTITY_REF);
    });
  });

  it('returns validation error when entityRef is missing', async () => {
    await withMcpClient(backendWithEntity.server, async client => {
      const result = await client.callTool(
        {
          name: 'scorecard.get-entity-metrics',
          arguments: {},
        },
        CallToolResultSchema,
      );

      const errorText = parseCallToolError(result);

      expect(result.isError).toBe(true);
      expect(errorText).toContain('entityRef');
    });
  });

  it('returns validation error when entityRef has invalid type', async () => {
    await withMcpClient(backend.server, async client => {
      const result = await client.callTool(
        {
          name: 'scorecard.get-entity-metrics',
          arguments: { entityRef: 12345 },
        },
        CallToolResultSchema,
      );

      const errorText = parseCallToolError(result);

      expect(result.isError).toBe(true);
      expect(errorText).toContain('entityRef');
    });
  });
});
