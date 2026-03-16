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
import type { RunResult } from '@augment-adk/augment-adk';
import type { ChatResponse } from '../../../types';

/**
 * Maps an ADK `RunResult` to the plugin's `ChatResponse` format.
 *
 * The primary difference is the `role` field (always 'assistant'
 * in the plugin) and the naming of approval fields.
 */
export function toChatResponse(result: RunResult): ChatResponse {
  return {
    role: 'assistant',
    content: result.content,
    agentName: result.agentName,
    handoffPath: result.handoffPath,
    ragSources: result.ragSources as ChatResponse['ragSources'],
    toolCalls: result.toolCalls as ChatResponse['toolCalls'],
    responseId: result.responseId,
    usage: result.usage as ChatResponse['usage'],
    reasoning: result.reasoning as ChatResponse['reasoning'],
    pendingApproval: result.pendingApproval
      ? {
          approvalRequestId: result.pendingApproval.approvalRequestId ?? '',
          toolName: result.pendingApproval.toolName,
          serverLabel: result.pendingApproval.serverLabel,
          arguments: result.pendingApproval.arguments,
        }
      : undefined,
    pendingApprovals: result.pendingApprovals?.map(a => ({
      approvalRequestId: a.approvalRequestId ?? '',
      toolName: a.toolName,
      serverLabel: a.serverLabel,
      arguments: a.arguments,
    })),
    outputValidationError: result.outputValidationError,
  };
}
