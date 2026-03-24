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
import { toChatResponse } from './responseAdapter';
import type { RunResult } from '@augment-adk/augment-adk';

describe('toChatResponse', () => {
  const minimalResult: RunResult = {
    content: 'Hello!',
  };

  it('sets role to assistant', () => {
    expect(toChatResponse(minimalResult).role).toBe('assistant');
  });

  it('maps content from RunResult', () => {
    expect(toChatResponse(minimalResult).content).toBe('Hello!');
  });

  it('maps optional agentName and handoffPath', () => {
    const result: RunResult = {
      content: 'Done',
      agentName: 'analyst',
      handoffPath: ['router', 'analyst'],
    };
    const response = toChatResponse(result);
    expect(response.agentName).toBe('analyst');
    expect(response.handoffPath).toEqual(['router', 'analyst']);
  });

  it('maps usage data', () => {
    const result: RunResult = {
      content: 'Done',
      usage: {
        input_tokens: 100,
        output_tokens: 50,
        total_tokens: 150,
      },
    };
    const response = toChatResponse(result);
    expect(response.usage).toEqual({
      input_tokens: 100,
      output_tokens: 50,
      total_tokens: 150,
    });
  });

  it('maps single pendingApproval', () => {
    const result: RunResult = {
      content: '',
      pendingApproval: {
        approvalRequestId: 'req-1',
        toolName: 'delete_pod',
        serverLabel: 'k8s',
        arguments: '{"name":"pod-1"}',
      },
    };
    const response = toChatResponse(result);
    expect(response.pendingApproval).toEqual({
      approvalRequestId: 'req-1',
      toolName: 'delete_pod',
      serverLabel: 'k8s',
      arguments: '{"name":"pod-1"}',
    });
  });

  it('defaults approvalRequestId to empty string when missing', () => {
    const result = {
      content: '',
      pendingApproval: {
        toolName: 'delete_pod',
        serverLabel: 'k8s',
        arguments: '{}',
      },
    } as unknown as RunResult;
    const response = toChatResponse(result);
    expect(response.pendingApproval?.approvalRequestId).toBe('');
  });

  it('maps pendingApprovals array', () => {
    const result: RunResult = {
      content: '',
      pendingApprovals: [
        {
          approvalRequestId: 'r1',
          toolName: 'tool1',
          serverLabel: 's1',
          arguments: '{}',
        },
        {
          toolName: 'tool2',
          serverLabel: 's2',
          arguments: '{}',
        } as RunResult['pendingApprovals'] extends (infer U)[] ? U : never,
      ],
    };
    const response = toChatResponse(result);
    expect(response.pendingApprovals).toHaveLength(2);
    expect(response.pendingApprovals![1].approvalRequestId).toBe('');
  });

  it('maps outputValidationError when present', () => {
    const result: RunResult = {
      content: 'invalid',
      outputValidationError: 'Schema mismatch on field "status"',
    };
    const response = toChatResponse(result);
    expect(response.outputValidationError).toBe(
      'Schema mismatch on field "status"',
    );
  });

  it('handles minimal RunResult without optional fields', () => {
    const response = toChatResponse(minimalResult);
    expect(response.agentName).toBeUndefined();
    expect(response.handoffPath).toBeUndefined();
    expect(response.ragSources).toBeUndefined();
    expect(response.toolCalls).toBeUndefined();
    expect(response.usage).toBeUndefined();
    expect(response.pendingApproval).toBeUndefined();
    expect(response.pendingApprovals).toBeUndefined();
    expect(response.outputValidationError).toBeUndefined();
  });
});
