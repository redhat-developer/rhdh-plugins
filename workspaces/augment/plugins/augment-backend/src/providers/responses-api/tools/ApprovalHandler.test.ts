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
import { buildApprovalRequest, parseApprovalResponse } from './ApprovalHandler';
import { createMockLogger } from '../../../test-utils/mocks';

const mockLogger = createMockLogger();

const BASE_OPTS = {
  model: 'test-model',
  responseId: 'resp-1',
  approvalRequestId: 'apr-1',
  tools: [
    { type: 'mcp', server_url: 'http://mcp', require_approval: 'always' },
  ],
};

describe('buildApprovalRequest', () => {
  it('sends native mcp_approval_response with approve: true when approved', () => {
    const result = buildApprovalRequest({ ...BASE_OPTS, approved: true });

    expect(result.input).toEqual([
      {
        type: 'mcp_approval_response',
        approval_request_id: 'apr-1',
        approve: true,
      },
    ]);
    expect(result.model).toBe('test-model');
    expect(result.store).toBe(true);
    expect(result.previous_response_id).toBe('resp-1');
  });

  it('sends native mcp_approval_response with approve: false when rejected', () => {
    const result = buildApprovalRequest({ ...BASE_OPTS, approved: false });

    expect(result.input).toEqual([
      {
        type: 'mcp_approval_response',
        approval_request_id: 'apr-1',
        approve: false,
      },
    ]);
    expect(result.store).toBe(true);
    expect(result.previous_response_id).toBe('resp-1');
  });

  it('overrides require_approval to "never" on MCP tools', () => {
    const tools = [
      { type: 'mcp', server_url: 'http://mcp-a', require_approval: 'always' },
      { type: 'mcp', server_url: 'http://mcp-b', require_approval: 'always' },
    ];
    const result = buildApprovalRequest({
      ...BASE_OPTS,
      approved: true,
      tools,
    });

    const resultTools = result.tools as Array<Record<string, unknown>>;
    expect(resultTools).toHaveLength(2);
    for (const t of resultTools) {
      expect(t.require_approval).toBe('never');
      expect(t.type).toBe('mcp');
    }
  });

  it('preserves non-MCP tools unchanged', () => {
    const tools = [
      { type: 'mcp', server_url: 'http://mcp', require_approval: 'always' },
      { type: 'function', name: 'myFunc' },
    ];
    const result = buildApprovalRequest({
      ...BASE_OPTS,
      approved: true,
      tools,
    });

    const resultTools = result.tools as Array<Record<string, unknown>>;
    expect(resultTools[0].require_approval).toBe('never');
    expect(resultTools[1]).toEqual({ type: 'function', name: 'myFunc' });
  });

  it('includes instructions when approved to guide re-execution', () => {
    const result = buildApprovalRequest({ ...BASE_OPTS, approved: true });
    expect(result).toHaveProperty('instructions');
    expect(typeof result.instructions).toBe('string');
  });

  it('does not include instructions when rejected', () => {
    const result = buildApprovalRequest({ ...BASE_OPTS, approved: false });
    expect(result).not.toHaveProperty('instructions');
  });

  it('includes tool_choice "required" when approved', () => {
    const result = buildApprovalRequest({ ...BASE_OPTS, approved: true });
    expect(result.tool_choice).toBe('required');
  });

  it('does not include tool_choice when rejected', () => {
    const result = buildApprovalRequest({ ...BASE_OPTS, approved: false });
    expect(result).not.toHaveProperty('tool_choice');
  });

  it('does not include guardrails, temperature, or other production params', () => {
    const result = buildApprovalRequest({ ...BASE_OPTS, approved: true });

    expect(result).not.toHaveProperty('guardrails');
    expect(result).not.toHaveProperty('temperature');
    expect(result).not.toHaveProperty('max_output_tokens');
    expect(result).not.toHaveProperty('max_tool_calls');
    expect(result).not.toHaveProperty('safety_identifier');
    expect(result).not.toHaveProperty('conversation');
  });
});

describe('parseApprovalResponse', () => {
  it('returns rejection message when not approved', () => {
    const result = parseApprovalResponse(
      { id: 'resp-2', output: [] },
      false,
      'projects_list',
      mockLogger,
    );

    expect(result.content).toContain('Tool Rejected');
    expect(result.content).toContain('projects_list');
    expect(result.toolExecuted).toBe(false);
  });

  it('extracts successful tool execution from mcp_call output', () => {
    const result = parseApprovalResponse(
      {
        id: 'resp-2',
        output: [
          {
            type: 'mcp_call',
            name: 'projects_list',
            output: '{"projects":["alpha"]}',
          },
          {
            type: 'message',
            content: [{ type: 'output_text', text: 'Here are your projects.' }],
          },
        ],
      },
      true,
      'projects_list',
      mockLogger,
    );

    expect(result.toolExecuted).toBe(true);
    expect(result.toolOutput).toBe('{"projects":["alpha"]}');
    expect(result.content).toBe('Here are your projects.');
    expect(result.responseId).toBe('resp-2');
  });

  it('uses default success message when LLM message is trivial', () => {
    const result = parseApprovalResponse(
      {
        id: 'resp-2',
        output: [
          { type: 'mcp_call', name: 'run_query', output: '42' },
          { type: 'message', content: [{ type: 'output_text', text: 'Ok' }] },
        ],
      },
      true,
      'run_query',
      mockLogger,
    );

    expect(result.content).toContain('executed successfully');
  });

  it('reports tool error when mcp_call has error field', () => {
    const result = parseApprovalResponse(
      {
        id: 'resp-2',
        output: [
          { type: 'mcp_call', name: 'deploy', error: 'permission denied' },
        ],
      },
      true,
      'deploy',
      mockLogger,
    );

    expect(result.content).toContain('Tool Failed');
    expect(result.content).toContain('permission denied');
    expect(result.toolExecuted).toBe(true);
  });

  it('handles approved with no tool output', () => {
    const result = parseApprovalResponse(
      { id: 'resp-2', output: [] },
      true,
      'some_tool',
      mockLogger,
    );

    expect(result.content).toContain('approved but no output received');
    expect(result.toolExecuted).toBe(false);
  });

  it('uses "unknown" when toolName is undefined', () => {
    const result = parseApprovalResponse(
      { id: 'resp-2', output: [] },
      false,
      undefined,
      mockLogger,
    );

    expect(result.content).toContain('unknown');
  });

  it('strips proxy prefix from tool name in user-facing content', () => {
    const result = parseApprovalResponse(
      {
        id: 'resp-2',
        output: [
          {
            type: 'mcp_call',
            name: 'ocp_mcp__projects_list',
            server_label: 'ocp-mcp',
            output: '{"projects":["ns1"]}',
          },
          {
            type: 'message',
            content: [{ type: 'output_text', text: 'Ok' }],
          },
        ],
      },
      true,
      'ocp_mcp__projects_list',
      mockLogger,
    );

    expect(result.content).toContain('projects_list');
    expect(result.content).not.toContain('ocp_mcp__');
    expect(result.toolExecuted).toBe(true);
  });

  it('preserves prefixed name in rejection when no server_label available', () => {
    const result = parseApprovalResponse(
      { id: 'resp-2', output: [] },
      false,
      'aap_mcp__job_templates_list',
      mockLogger,
    );

    expect(result.content).toContain('Tool Rejected');
    expect(result.content).toContain('aap_mcp__job_templates_list');
  });
});
