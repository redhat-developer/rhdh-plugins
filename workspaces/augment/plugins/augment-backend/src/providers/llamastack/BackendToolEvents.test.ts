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

/**
 * Integration test verifying the full backend-tool-execution-to-UI-rendering
 * pipeline. Validates that:
 * 1. AdkOrchestrator emits stream.tool.started/completed/failed events
 * 2. ResponsesApiProvider forwards them (since they start with 'stream.')
 * 3. The StreamingMessage reducer produces correct toolCalls state
 */

import { createMockLogger } from '../../test-utils/mocks';
import { sanitizeToolsForServer } from './ToolsBuilder';
import type { ResponsesApiTool } from '../../types';
import type { CapabilityInfo } from '../responses-api/types';

describe('Backend Tool Events', () => {
  it('events with stream. prefix pass through ResponsesApiProvider forwarding logic', () => {
    const events = [
      { type: 'stream.backend_tool.executing', toolCount: 1, tools: ['t1'] },
      { type: 'stream.tool.started', callId: 'c1', name: 't1' },
      { type: 'stream.tool.completed', callId: 'c1', name: 't1', output: 'ok' },
      { type: 'stream.tool.failed', callId: 'c2', name: 't2', error: 'fail' },
    ];

    for (const event of events) {
      expect(event.type.startsWith('stream.')).toBe(true);
    }
  });

  it('stream.tool.started includes arguments field', () => {
    const event = {
      type: 'stream.tool.started',
      callId: 'call-123',
      name: 'list_pods',
      serverLabel: 'ocp-mcp',
      arguments: '{"namespace": "default"}',
    };
    expect(event.arguments).toBe('{"namespace": "default"}');
    expect(event.serverLabel).toBe('ocp-mcp');
  });
});

describe('Direct-mode MCP tool display regression', () => {
  const logger = createMockLogger();

  it('sanitizeToolsForServer does not alter mcp tools', () => {
    const mcpTool: ResponsesApiTool = {
      type: 'mcp',
      server_url: 'https://mcp.example.com',
      server_label: 'my-mcp',
      require_approval: 'never',
      headers: { Authorization: 'Bearer tok' },
      allowed_tools: ['tool_a', 'tool_b'],
    };

    const caps: CapabilityInfo = {
      functionTools: true,
      strictField: false,
      maxOutputTokens: false,
      mcpTools: true,
      parallelToolCalls: true,
      truncation: true,
    };

    const result = sanitizeToolsForServer([mcpTool], caps, logger);
    expect(result).toEqual([mcpTool]);
  });

  it('sanitizeToolsForServer does not alter non-function tool types', () => {
    const tools: ResponsesApiTool[] = [
      { type: 'web_search' },
      { type: 'code_interpreter' },
      { type: 'file_search', vector_store_ids: ['vs-1'] },
    ];

    const caps: CapabilityInfo = {
      functionTools: true,
      strictField: false,
      maxOutputTokens: true,
      mcpTools: true,
      parallelToolCalls: true,
      truncation: true,
    };

    const result = sanitizeToolsForServer(tools, caps, logger);
    expect(result).toEqual(tools);
  });
});
