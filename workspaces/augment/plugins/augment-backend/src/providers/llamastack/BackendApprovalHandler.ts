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
import type { AgentGraphManager } from './AgentGraphManager';
import type { MCPServerConfig } from '../../types';
import { toErrorMessage } from '../../services/utils';
import { continueWithFunctionCallOutput } from './approvalContinuation';
import type { ContinuationDeps } from './approvalContinuation';

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

    const continuationDeps: ContinuationDeps = {
      backendApprovalStore,
      backendToolExecutor,
      chatService: this.deps.chatService,
      clientManager: this.deps.clientManager,
      configResolution: this.deps.configResolution,
      getConversations: this.deps.getConversations,
      getAgentGraphManager: this.deps.getAgentGraphManager,
      getMcpServers: this.deps.getMcpServers,
      logger,
    };

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
          return continueWithFunctionCallOutput(
            continuationDeps,
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

        return continueWithFunctionCallOutput(
          continuationDeps,
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
}
