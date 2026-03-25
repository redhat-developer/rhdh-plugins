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
import type { ConversationFacade } from './ConversationFacade';
import type { ResponsesApiService } from './ResponsesApiService';
import type { ClientManager } from './ClientManager';
import type { ConfigResolutionService } from './ConfigResolutionService';
import type { ConversationService } from './ConversationService';
import type { ApprovalResult } from './conversationTypes';
import type { AgentGraphManager } from './AgentGraphManager';
import type { MCPServerConfig } from '../../types';
import { toErrorMessage } from '../../services/utils';

interface ToolCallInfo {
  callId: string;
  name: string;
  arguments: string;
}

/**
 * Wires backend tool approval into the ConversationFacade.
 *
 * When a user approves or rejects a backend-executed tool, this handler
 * executes the tool via BackendToolExecutor and feeds the result back
 * to the Responses API as a function_call_output continuation.
 *
 * After the initial continuation, the handler implements a loop modeled
 * after the OpenAI Agents SDK's RunState pattern: if the LLM response
 * contains new function_call items, they are either auto-executed (when
 * the MCP server's requireApproval is 'never') or surfaced as a chained
 * pendingApproval for the frontend to present to the user.
 *
 * The loop exits naturally when the model returns a text response (no
 * more function calls) or when a tool call requires user approval.
 */
export class BackendApprovalHandler {
  constructor(
    private readonly deps: {
      conversationFacade: ConversationFacade;
      backendApprovalStore: BackendApprovalStore;
      backendToolExecutor: BackendToolExecutor;
      chatService: ResponsesApiService;
      clientManager: ClientManager;
      configResolution: ConfigResolutionService;
      getConversations: () => ConversationService | null;
      getAgentGraphManager?: () => AgentGraphManager | null;
      getMcpServers: () => MCPServerConfig[];
      logger: LoggerService;
    },
  ) {}

  initialize(): void {
    const {
      conversationFacade,
      backendApprovalStore,
      backendToolExecutor,
      logger,
    } = this.deps;

    conversationFacade.setBackendApprovalHandler(
      backendApprovalStore,
      async approval => {
        const pending = backendApprovalStore.get(
          approval.responseId,
          approval.callId,
        );
        const functionName = pending?.functionName ?? approval.toolName ?? '';
        const argsJson =
          pending?.argumentsJson ?? approval.toolArguments ?? '{}';

        const functionCall = { name: functionName, arguments: argsJson };

        if (!approval.approved) {
          const rejectionOutput = JSON.stringify({
            error: `Tool "${approval.toolName}" was rejected by the user.`,
          });
          return this.continueWithFunctionCallOutput(
            approval.responseId,
            approval.callId,
            rejectionOutput,
            pending?.conversationId,
            functionCall,
            pending?.agentKey,
          );
        }

        let output: string;
        try {
          output = await backendToolExecutor.executeTool(
            functionName,
            argsJson,
          );
        } catch (error) {
          output = JSON.stringify({
            error: `Tool execution failed: ${toErrorMessage(error)}`,
          });
        }

        return this.continueWithFunctionCallOutput(
          approval.responseId,
          approval.callId,
          output,
          pending?.conversationId,
          functionCall,
          pending?.agentKey,
        );
      },
    );

    logger.info('[BackendApproval] Backend tool approval handler initialized');
  }

  /**
   * Partition tool calls into auto-executable and approval-required,
   * based on each MCP server's `requireApproval` config.
   */
  private partitionByApproval(
    calls: ToolCallInfo[],
    mcpServers: MCPServerConfig[],
  ): { autoExec: ToolCallInfo[]; needsApproval: ToolCallInfo[] } {
    const autoExec: ToolCallInfo[] = [];
    const needsApproval: ToolCallInfo[] = [];

    for (const call of calls) {
      const info = this.deps.backendToolExecutor.getToolServerInfo(call.name);
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

  /**
   * Continuation loop: send tool output to the LLM and handle any
   * chained tool calls the model produces. Auto-executable tools are
   * run immediately; approval-required tools are surfaced via
   * `pendingApproval` in the result.
   */
  private async continueWithFunctionCallOutput(
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
      logger,
    } = this.deps;

    const client = clientManager.getExistingClient();
    const lsCfg = configResolution.getLlamaStackConfig();
    const effectiveCfg = configResolution.getResolver()?.getCachedConfig();

    let model = effectiveCfg?.model ?? lsCfg?.model ?? 'default';
    let maxOutputTokens =
      effectiveCfg?.maxOutputTokens ?? lsCfg?.maxOutputTokens;
    let temperature = effectiveCfg?.temperature ?? lsCfg?.temperature;
    let instructions = effectiveCfg?.postToolInstructions;
    let guardrails = effectiveCfg?.guardrails;
    const truncation = effectiveCfg?.truncation ?? 'auto';
    const safetyIdentifier =
      effectiveCfg?.safetyIdentifier ?? lsCfg?.safetyIdentifier;
    if (agentKey) {
      try {
        const graphManager = this.deps.getAgentGraphManager?.();
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

    const mcpServers = this.deps.getMcpServers();
    const toolDefs =
      await backendToolExecutor.ensureToolsDiscovered(mcpServers);

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

      // Reset additional outputs after first use
      currentAdditionalOutputs = undefined;

      if (conversationId && result.responseId) {
        const conversations = this.deps.getConversations();
        await conversations?.registerResponse(
          conversationId,
          result.responseId,
        );
      }

      accumulatedText = result.text;
      currentResponseId = result.responseId;

      if (result.functionCalls.length === 0) {
        logger.info(
          `[BackendApproval] Continuation complete — final text response (iteration ${iteration + 1})`,
        );
        break;
      }

      const { autoExec, needsApproval } = this.partitionByApproval(
        result.functionCalls,
        mcpServers,
      );

      if (needsApproval.length > 0) {
        const call = needsApproval[0];
        const info = backendToolExecutor.getToolServerInfo(call.name);

        this.deps.backendApprovalStore.store({
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

          logger.info(
            `[BackendApproval] Executing chained tool: ${displayName}`,
          );

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

      // Set up the primary tool output (first result)
      const primary = toolResults[0];
      currentCallId = primary.callId;
      currentOutput = primary.output;
      currentFunctionCall = {
        name: primary.name,
        arguments:
          autoExec.find(c => c.callId === primary.callId)?.arguments ?? '{}',
      };

      // Additional parallel tool outputs (sent in the same API request)
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
}
