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
import type { ChatRequest, ChatResponse } from '../../types';
import { WorkflowHydrator } from './workflow/WorkflowHydrator';
import { LlamaStackProvider } from './openai-agents-adapters/LlamaStackProvider';
import { toChatResponse } from './openai-agents-adapters/responseMapper';
import { mapRunStreamEventToFrontend } from './openai-agents-adapters/streamMapper';
import { requireLastUserMessage } from '../responses-api/chat/chatUtils';
import { migrateAgentConfigsToWorkflow } from '../../services/WorkflowMigration';
import type { ResponsesApiService } from './ResponsesApiService';
import type { ChatDepsBuilder } from './ChatDepsBuilder';
import type { AgentGraphManager } from './AgentGraphManager';
import type { OpenAIAgentsOrchestrator } from './openai-agents-adapters/OpenAIAgentsOrchestrator';

export interface ChatOpsContext {
  logger: LoggerService;
  chatService: ResponsesApiService;
  chatDepsBuilder: ChatDepsBuilder;
  getOrchestrator: () => OpenAIAgentsOrchestrator;
  requireAgentGraphManager: () => AgentGraphManager;
  ensureInitialized: () => void;
}

export async function coordinatorChat(
  ctx: ChatOpsContext,
  request: ChatRequest,
): Promise<ChatResponse> {
  ctx.ensureInitialized();

  const snapshot = await ctx.requireAgentGraphManager().getSnapshot();
  const deps = await ctx.chatDepsBuilder.buildChatDeps();
  const orchestrator = ctx.getOrchestrator();
  const backendTools = await (orchestrator as any).discoverBackendTools(deps);

  const agentConfigs: Record<string, any> = {};
  for (const [key, resolved] of snapshot.agents) {
    agentConfigs[key] = resolved.config;
  }

  const workflowDef = migrateAgentConfigsToWorkflow(
    agentConfigs,
    snapshot.defaultAgentKey,
  );
  workflowDef.settings.maxTurns = snapshot.maxTurns;

  const provider = new LlamaStackProvider(
    ctx.chatService,
    deps.client,
    () => deps.config,
  );

  const hydrator = new WorkflowHydrator(ctx.logger);
  const { runner, entryAgent, maxTurns } = hydrator.hydrate(
    workflowDef,
    provider,
    backendTools,
  );

  const userInput = requireLastUserMessage(request, '[Chat] ');
  const result = await runner.run(entryAgent, userInput, { maxTurns });

  return toChatResponse(result);
}

export async function coordinatorChatStream(
  ctx: ChatOpsContext,
  request: ChatRequest,
  onEvent: (event: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  ctx.ensureInitialized();

  const snapshot = await ctx.requireAgentGraphManager().getSnapshot();
  const deps = await ctx.chatDepsBuilder.buildChatDeps();
  const orchestrator = ctx.getOrchestrator();
  const backendTools = await (orchestrator as any).discoverBackendTools(deps);

  const agentConfigs: Record<string, any> = {};
  for (const [key, resolved] of snapshot.agents) {
    agentConfigs[key] = resolved.config;
  }

  const workflowDef = migrateAgentConfigsToWorkflow(
    agentConfigs,
    snapshot.defaultAgentKey,
  );
  workflowDef.settings.maxTurns = snapshot.maxTurns;

  const provider = new LlamaStackProvider(
    ctx.chatService,
    deps.client,
    () => deps.config,
  );

  const hydrator = new WorkflowHydrator(ctx.logger);
  const { runner, entryAgent, maxTurns } = hydrator.hydrate(
    workflowDef,
    provider,
    backendTools,
  );

  const userInput = requireLastUserMessage(request, '[ChatStream] ');

  try {
    const streamed = await runner.run(entryAgent, userInput, {
      stream: true,
      maxTurns,
      signal,
    });

    for await (const event of streamed) {
      for (const fe of mapRunStreamEventToFrontend(event)) {
        onEvent(fe);
      }
    }

    onEvent(
      JSON.stringify({
        type: 'stream.completed',
        agentName: streamed.lastAgent?.name,
      }),
    );
  } catch (error) {
    if (signal?.aborted) return;
    const message = error instanceof Error ? error.message : String(error);
    ctx.logger.error('[ChatStream] Stream error', { error: message });
    onEvent(
      JSON.stringify({
        type: 'stream.error',
        error: message,
        code: 'execution_error',
      }),
    );
  }
}
