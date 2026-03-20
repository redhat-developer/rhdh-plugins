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
import type { LoggerService } from '@backstage/backend-plugin-api';
import { toErrorMessage } from '../../../services/utils';
import type { ResponsesApiClient } from '../client/ResponsesApiClient';
import { McpAuthService } from '../../llamastack/McpAuthService';
import { MCPServerConfig } from '../../../types';
import { buildMcpTools } from './McpToolBuilder';
import { buildApprovalRequest, parseApprovalResponse } from './ApprovalHandler';
import { createOutputSummaryForLogging } from '../conversations/ConversationHelpers';
import type {
  ApprovalResult,
  ConversationClientAccessor,
} from '../conversations/conversationTypes';

export interface ApprovalSafetyContext {
  guardrails?: string[];
  safetyIdentifier?: string;
  reasoning?: { effort?: string; summary?: string };
}

export interface ApprovalContinuationDeps {
  clientAccessor: ConversationClientAccessor;
  mcpAuth: McpAuthService;
  mcpServers: MCPServerConfig[];
  getConversationForResponse: (
    responseId: string,
  ) => Promise<string | undefined>;
  registerResponse: (
    conversationId: string,
    responseId: string,
  ) => Promise<void>;
  logger: LoggerService;
  safetyContext?: ApprovalSafetyContext;
}

export interface ApprovalContinuationParams {
  responseId: string;
  approvalRequestId: string;
  approved: boolean;
  toolName?: string;
  toolArguments?: string;
  conversationId?: string;
  attempt: number;
  maxAttempts: number;
}

/**
 * Executes HITL approval continuation: sends mcp_approval_response to Llama Stack,
 * parses the response, handles auto-reapproval for chained duplicate requests.
 */
export async function executeApprovalContinuation(
  deps: ApprovalContinuationDeps,
  params: ApprovalContinuationParams,
): Promise<ApprovalResult> {
  const {
    responseId,
    approvalRequestId,
    approved,
    toolName,
    conversationId,
    attempt,
    maxAttempts,
  } = params;

  const {
    clientAccessor,
    mcpAuth,
    mcpServers,
    getConversationForResponse,
    registerResponse,
    logger,
  } = deps;

  const client: ResponsesApiClient = clientAccessor.getClient();

  logger.info(
    `Continuing conversation ${responseId} after ${
      approved ? 'approval' : 'rejection'
    } for approval request ${approvalRequestId}${
      attempt > 0 ? ` (auto-reapproval attempt ${attempt})` : ''
    }`,
  );

  try {
    const tools = (await buildMcpTools({
      mcpAuth,
      mcpServers,
    })) as unknown as Array<Record<string, unknown>>;

    let resolvedConversationId = conversationId;
    if (!resolvedConversationId) {
      resolvedConversationId = await getConversationForResponse(responseId);
      if (resolvedConversationId) {
        logger.info(
          `Resolved conversationId=${resolvedConversationId} from registry for response ${responseId}`,
        );
      }
    }

    const responsesRequest = buildApprovalRequest({
      model: clientAccessor.getModel(),
      approved,
      responseId,
      approvalRequestId,
      tools,
      guardrails: deps.safetyContext?.guardrails,
      safetyIdentifier: deps.safetyContext?.safetyIdentifier,
      reasoning: deps.safetyContext?.reasoning,
    });

    logger.info(
      `[HITL] Approval continuation request body: ${JSON.stringify(responsesRequest, null, 2)}`,
    );

    const response = await client.request<{
      id: string;
      output: Array<{
        type: string;
        id?: string;
        status?: string;
        output?: string;
        error?: string;
        content?: Array<{ type: string; text: string }>;
        name?: string;
        server_label?: string;
        arguments?: string;
      }>;
    }>('/v1/responses', {
      method: 'POST',
      body: JSON.stringify(responsesRequest),
    });

    const outputSummary = createOutputSummaryForLogging(response.output || []);
    logger.info(
      `Approval continuation response: id=${response.id}, outputItems=${
        response.output?.length ?? 0
      }, items=${JSON.stringify(outputSummary)}`,
    );

    if (resolvedConversationId && response.id) {
      await registerResponse(resolvedConversationId, response.id);
    }

    const result = parseApprovalResponse(response, approved, toolName, logger);

    // Auto-reapprove: Llama Stack may return a duplicate approval request
    // for the same tool because it regenerates the tool call with different
    // arguments. If the user originally approved and the chained request
    // targets the same tool, auto-approve it.
    if (
      approved &&
      result.pendingApproval &&
      result.pendingApproval.toolName === toolName &&
      attempt < maxAttempts
    ) {
      const argsChanged =
        result.pendingApproval.arguments !== params.toolArguments;
      const argDetail = argsChanged
        ? `, originalArgs=${(params.toolArguments ?? '').substring(0, 200)}, newArgs=${(result.pendingApproval.arguments ?? '').substring(0, 200)}`
        : '';
      logger.info(
        `[HITL] Auto-reapproving chained approval for same tool "${toolName}" (attempt ${attempt + 1}/${maxAttempts}), argsChanged=${argsChanged}, new approvalId=${result.pendingApproval.approvalRequestId}${argDetail}`,
      );
      return executeApprovalContinuation(deps, {
        responseId: result.responseId,
        approvalRequestId: result.pendingApproval.approvalRequestId,
        approved: true,
        toolName,
        toolArguments: result.pendingApproval.arguments,
        conversationId: resolvedConversationId,
        attempt: attempt + 1,
        maxAttempts,
      });
    }

    return result;
  } catch (error) {
    const msg = toErrorMessage(error);
    logger.error(
      `Approval continuation failed for tool "${
        toolName ?? 'unknown'
      }": ${msg}`,
    );
    const action = approved ? 'execute' : 'reject';
    return {
      content: `Failed to ${action} tool \`${toolName ?? 'unknown'}\`: ${msg}`,
      responseId,
      toolExecuted: false,
    };
  }
}
