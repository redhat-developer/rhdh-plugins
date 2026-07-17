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
import type { BackendApprovalStore } from './BackendApprovalStore';
import type { BackendToolExecutor } from './BackendToolExecutor';
import type { ResponsesApiService } from './ResponsesApiService';
import type { ClientManager } from './ClientManager';
import type { ConfigResolutionService } from './ConfigResolutionService';
import type { ConversationService } from './ConversationService';
import type { ApprovalResult } from './conversationTypes';
import type { AgentGraphManager } from './AgentGraphManager';
import type { MCPServerConfig } from '../../types';
import { toErrorMessage } from '../../services/utils';

export interface ToolCallInfo {
  callId: string;
  name: string;
  arguments: string;
}

export interface ContinuationDeps {
  backendApprovalStore: BackendApprovalStore;
  backendToolExecutor: BackendToolExecutor;
  chatService: ResponsesApiService;
  clientManager: ClientManager;
  configResolution: ConfigResolutionService;
  getConversations: () => ConversationService | null;
  getAgentGraphManager?: () => AgentGraphManager | null;
  getMcpServers: () => MCPServerConfig[];
  logger: LoggerService;
}

export function partitionByApproval(
  calls: ToolCallInfo[],
  mcpServers: MCPServerConfig[],
  backendToolExecutor: BackendToolExecutor,
): { autoExec: ToolCallInfo[]; needsApproval: ToolCallInfo[] } {
  const autoExec: ToolCallInfo[] = [];
  const needsApproval: ToolCallInfo[] = [];

  for (const call of calls) {
    const info = backendToolExecutor.getToolServerInfo(call.name);
    if (!info) {
      autoExec.push(call);
      continue;
    }
    const server = mcpServers.find(s => s.id === info.serverId);
    if (!server?.requireApproval || server.requireApproval === 'never') {
      autoExec.push(call);
    } else {
      needsApproval.push(call);
    }
  }
  return { autoExec, needsApproval };
}

export async function continueWithFunctionCallOutput(
  deps: ContinuationDeps,
  previousResponseId: string,
  callId: string,
  output: string,
  conversationId?: string,
  functionCall?: { name: string; arguments: string },
  agentKey?: string,
): Promise<ApprovalResult> {
  const {
    chatService,
    clientManager,
    configResolution,
    backendToolExecutor,
    backendApprovalStore,
    logger,
  } = deps;

  const client = clientManager.getExistingClient();
  const lsCfg = configResolution.getLlamaStackConfig();
  const effectiveCfg = configResolution.getResolver()?.getCachedConfig();

  let model = effectiveCfg?.model ?? lsCfg?.model ?? 'default';
  let maxOutputTokens = effectiveCfg?.maxOutputTokens ?? lsCfg?.maxOutputTokens;
  let temperature = effectiveCfg?.temperature ?? lsCfg?.temperature;
  let instructions = effectiveCfg?.postToolInstructions;
  let guardrails = effectiveCfg?.guardrails;
  const truncation = effectiveCfg?.truncation ?? 'auto';
  const safetyIdentifier =
    effectiveCfg?.safetyIdentifier ?? lsCfg?.safetyIdentifier;
  if (agentKey) {
    try {
      const graphManager = deps.getAgentGraphManager?.();
      const snapshot = await graphManager?.getSnapshot();
      const agent = snapshot?.agents.get(agentKey);
      if (agent) {
        model = agent.config.model ?? model;
        maxOutputTokens = agent.config.maxOutputTokens ?? maxOutputTokens;
        temperature = agent.config.temperature ?? temperature;
        guardrails = agent.config.guardrails ?? guardrails;
        instructions = agent.config.instructions;
        logger.info(
          `[BackendApproval] Resolved agent "${agentKey}" config for continuation (model=${model}, maxOutputTokens=${maxOutputTokens})`,
        );
      }
    } catch {
      logger.warn(
        `[BackendApproval] Could not resolve agent "${agentKey}" — using global config`,
      );
    }
  }

  const mcpServers = deps.getMcpServers();
  const toolDefs = await backendToolExecutor.ensureToolsDiscovered(mcpServers);

  let currentCallId = callId;
  let currentOutput = output;
  let currentFunctionCall = functionCall;
  let currentResponseId = previousResponseId;
  let currentAdditionalOutputs:
    | Array<{
        callId: string;
        output: string;
        functionCall?: { name: string; arguments: string };
      }>
    | undefined;
  let accumulatedText = '';
  const firstToolOutput = output;
  const firstOutputTruncated = output.includes('[... OUTPUT TRUNCATED:');

  for (let iteration = 0; ; iteration++) {
    logger.info(
      `[BackendApproval] Continuation iteration ${iteration + 1} (responseId=${currentResponseId})`,
    );

    const result = await chatService.continueFunctionCallOutput({
      client,
      model,
      callId: currentCallId,
      output: currentOutput,
      previousResponseId: currentResponseId,
      guardrails,
      safetyIdentifier,
      functionCall: currentFunctionCall,
      conversationId,
      maxOutputTokens,
      temperature,
      instructions,
      truncation,
      tools: toolDefs,
      additionalToolOutputs: currentAdditionalOutputs,
    });

    currentAdditionalOutputs = undefined;

    if (conversationId && result.responseId) {
      const conversations = deps.getConversations();
      await conversations?.registerResponse(conversationId, result.responseId);
    }

    accumulatedText = result.text;
    currentResponseId = result.responseId;

    if (result.functionCalls.length === 0) {
      logger.info(
        `[BackendApproval] Continuation complete — final text response (iteration ${iteration + 1})`,
      );
      break;
    }

    const { autoExec, needsApproval } = partitionByApproval(
      result.functionCalls,
      mcpServers,
      backendToolExecutor,
    );

    if (needsApproval.length > 0) {
      const call = needsApproval[0];
      const info = backendToolExecutor.getToolServerInfo(call.name);

      backendApprovalStore.store({
        responseId: currentResponseId,
        callId: call.callId,
        functionName: call.name,
        argumentsJson: call.arguments,
        serverId: info?.serverId ?? '',
        serverUrl: mcpServers.find(s => s.id === info?.serverId)?.url ?? '',
        originalToolName: info?.originalName ?? call.name,
        conversationId,
        createdAt: Date.now(),
        agentKey,
      });

      logger.info(
        `[BackendApproval] Chained approval required for tool "${info?.originalName ?? call.name}" (iteration ${iteration + 1})`,
      );

      return {
        content: accumulatedText || 'Tool executed successfully.',
        responseId: currentResponseId,
        toolExecuted: true,
        toolOutput: firstToolOutput,
        outputTruncated: firstOutputTruncated,
        pendingApproval: {
          approvalRequestId: call.callId,
          toolName: info?.originalName ?? call.name,
          serverLabel: info?.serverId,
          arguments: call.arguments,
        },
      };
    }

    logger.info(
      `[BackendApproval] Auto-executing ${autoExec.length} chained tool(s) (iteration ${iteration + 1})`,
    );

    const toolResults = await Promise.all(
      autoExec.map(async call => {
        const info = backendToolExecutor.getToolServerInfo(call.name);
        const displayName = info?.originalName ?? call.name;

        logger.info(`[BackendApproval] Executing chained tool: ${displayName}`);

        try {
          const toolOutput = await backendToolExecutor.executeTool(
            call.name,
            call.arguments,
          );
          return {
            callId: call.callId,
            name: call.name,
            output: toolOutput,
            error: false,
          };
        } catch (err) {
          const errMsg = toErrorMessage(err);
          logger.error(
            `[BackendApproval] Chained tool "${displayName}" failed: ${errMsg}`,
          );
          return {
            callId: call.callId,
            name: call.name,
            output: JSON.stringify({ error: errMsg }),
            error: true,
          };
        }
      }),
    );

    const primary = toolResults[0];
    currentCallId = primary.callId;
    currentOutput = primary.output;
    currentFunctionCall = {
      name: primary.name,
      arguments:
        autoExec.find(c => c.callId === primary.callId)?.arguments ?? '{}',
    };

    if (toolResults.length > 1) {
      currentAdditionalOutputs = toolResults.slice(1).map(r => ({
        callId: r.callId,
        output: r.output,
        functionCall: {
          name: r.name,
          arguments:
            autoExec.find(c => c.callId === r.callId)?.arguments ?? '{}',
        },
      }));
    } else {
      currentAdditionalOutputs = undefined;
    }
  }

  return {
    content: accumulatedText || 'Tool executed successfully.',
    responseId: currentResponseId,
    toolExecuted: true,
    toolOutput: firstToolOutput,
    outputTruncated: firstOutputTruncated,
  };
}
