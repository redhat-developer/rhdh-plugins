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

import type {
  LoggerService,
  RootConfigService,
  DatabaseService,
} from '@backstage/backend-plugin-api';
import type { AdminConfigService } from '../../services/AdminConfigService';
import type {
  AgenticProvider,
  AgenticProviderStatus,
  NormalizedStreamEvent,
  ConversationCapability,
  RAGCapability,
  SafetyCapability,
  EvaluationCapability,
  ChatRequest,
  ChatResponse,
} from '../types';
import { ResponsesApiCoordinator } from './ResponsesApiCoordinator';
import { SafetyService } from './SafetyService';
import { EvaluationService } from './EvaluationService';
import { normalizeLlamaStackEvent } from './StreamEventNormalizer';
import {
  type PromptCapabilities,
  type ChatAgent,
  deriveRoleFromTopology,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import {
  buildConversationsCapability,
  buildRagCapability,
  buildSafetyCapability,
  buildEvaluationCapability,
} from './CapabilityBuilders';
import {
  listModels as modelOpsListModels,
  testModel as modelOpsTestModel,
  generateSystemPrompt as modelOpsGenPrompt,
} from './ProviderModelOps';
import type { ModelsCache } from './ProviderModelOps';

export class ResponsesApiProvider implements AgenticProvider {
  readonly id = 'llamastack';
  readonly displayName = 'Responses API (LlamaStack)';

  private readonly orchestrator: ResponsesApiCoordinator;
  private readonly safetyService: SafetyService;
  private readonly evaluationService: EvaluationService;
  private readonly logger: LoggerService;

  private _conversations?: ConversationCapability;
  private _rag?: RAGCapability;
  private _safety?: SafetyCapability;
  private _evaluation?: EvaluationCapability;

  private _modelsCache: { current: ModelsCache | null } = { current: null };

  constructor(options: {
    logger: LoggerService;
    config: RootConfigService;
    database?: DatabaseService;
    adminConfig?: AdminConfigService;
  }) {
    this.logger = options.logger;
    this.orchestrator = new ResponsesApiCoordinator(options);

    const clientAccessor = () =>
      this.orchestrator.getClientManager().getExistingClient();

    this.safetyService = new SafetyService({
      ...options,
      getClient: clientAccessor,
    });
    this.evaluationService = new EvaluationService({
      ...options,
      getClient: clientAccessor,
    });
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Responses API provider');
    await this.orchestrator.shutdown();
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Responses API provider');
    await this.orchestrator.initialize();
    await this.safetyService.initialize();
    await this.evaluationService.initialize();
    this.logger.info('Responses API provider initialized');
  }

  async postInitialize(): Promise<void> {
    await this.orchestrator.postInitialize();
  }

  invalidateRuntimeConfig(): void {
    this.orchestrator.invalidateRuntimeConfig();
  }

  async getEffectiveConfig(): Promise<Record<string, unknown>> {
    const resolver = this.orchestrator.getResolver();
    if (!resolver) return {};
    const config = await resolver.resolve();
    return { ...config };
  }

  async listModels(): Promise<
    Array<{ id: string; owned_by?: string; model_type?: string }>
  > {
    return modelOpsListModels(this.orchestrator, this._modelsCache);
  }

  async testModel(
    modelOverride?: string,
    _baseUrl?: string,
  ): Promise<{
    connected: boolean;
    modelFound: boolean;
    canGenerate: boolean;
    error?: string;
  }> {
    return modelOpsTestModel(this.orchestrator, modelOverride);
  }

  async generateSystemPrompt(
    description: string,
    modelOverride?: string,
    capabilities?: PromptCapabilities,
  ): Promise<string> {
    return modelOpsGenPrompt(
      this.orchestrator,
      description,
      modelOverride,
      capabilities,
      this.logger,
    );
  }

  async refreshDynamicConfig(): Promise<void> {
    const resolver = this.orchestrator.getResolver();
    if (!resolver) return;

    try {
      const config = await resolver.resolve();
      this.safetyService.applyDynamicOverrides({
        safetyEnabled: config.safetyEnabled,
        inputShields: config.inputShields,
        outputShields: config.outputShields,
        safetyOnError: config.safetyOnError,
      });
      this.evaluationService.applyDynamicOverrides({
        evaluationEnabled: config.evaluationEnabled,
        scoringFunctions: config.scoringFunctions,
        minScoreThreshold: config.minScoreThreshold,
        evaluationOnError: config.evaluationOnError,
      });
    } catch (err) {
      this.logger.warn(
        `Failed to refresh dynamic config for safety/eval: ${
          err instanceof Error ? err.message : 'Unknown error'
        }`,
      );
    }
  }

  async getStatus(): Promise<AgenticProviderStatus> {
    return this.orchestrator.getStatus();
  }

  async listAgents(): Promise<ChatAgent[]> {
    const snapshot = await this.orchestrator
      .getAgentGraphManager()
      ?.getSnapshot();
    if (!snapshot?.agents?.size) return [];

    const topologyMap: Record<
      string,
      { handoffs?: string[]; asTools?: string[] }
    > = {};
    for (const [key, resolved] of snapshot.agents) {
      topologyMap[key] = {
        handoffs: resolved.config.handoffs,
        asTools: resolved.config.asTools,
      };
    }

    const agents: ChatAgent[] = [];
    for (const [key, resolved] of snapshot.agents) {
      const role = deriveRoleFromTopology(key, topologyMap);
      if (role === 'specialist') continue;
      agents.push({
        id: key,
        name: resolved.config.name ?? key,
        description: resolved.config.instructions?.slice(0, 200),
        status: 'config',
        isDefault: key === snapshot.defaultAgentKey,
        providerType: 'llamastack',
        framework: 'llamastack',
        source: 'orchestration',
        agentRole: role,
      });
    }
    return agents;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.orchestrator.chat(request);
  }

  async chatStream(
    request: ChatRequest,
    onEvent: (event: NormalizedStreamEvent) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    let streamResponseId: string | undefined;
    let currentAgentName: string | undefined;

    await this.orchestrator.chatStream(
      request,
      (rawEventJson: string) => {
        let parsed: Record<string, unknown> | undefined;
        try {
          parsed = JSON.parse(rawEventJson);
        } catch {
          /* non-JSON */
        }

        if (parsed?.type === 'stream.agent.handoff') {
          currentAgentName = parsed.toAgent as string;
          onEvent({
            type: 'stream.agent.handoff',
            fromAgent: parsed.fromAgent as string | undefined,
            toAgent: currentAgentName,
            reason: parsed.reason as string | undefined,
          } as NormalizedStreamEvent);
          return;
        }

        if (parsed?.type === '__agent.responding') {
          currentAgentName = parsed.agentName as string;
          return;
        }

        if (
          parsed &&
          typeof parsed.type === 'string' &&
          parsed.type.startsWith('stream.')
        ) {
          const event = parsed as { type: string } & Record<string, unknown>;
          if (event.type === 'stream.started' && event.responseId) {
            streamResponseId = event.responseId as string;
          }
          if (event.type === 'stream.completed' && currentAgentName) {
            event.agentName = currentAgentName;
          }
          if (event.type === 'stream.tool.approval') {
            if (!event.responseId && streamResponseId)
              event.responseId = streamResponseId;
            this.logger.info(
              `[HITL] Emitting stream.tool.approval: callId=${event.callId}, name=${event.name}, serverLabel=${event.serverLabel}, responseId=${event.responseId}`,
            );
          }
          onEvent(event as NormalizedStreamEvent);
          return;
        }

        const normalized = normalizeLlamaStackEvent(rawEventJson, type => {
          this.logger.debug(`[Stream] Unknown event type: ${type}`);
        });
        for (const event of normalized) {
          if (event.type === 'stream.started' && event.responseId) {
            streamResponseId = event.responseId;
          }
          if (event.type === 'stream.tool.approval') {
            if (!event.responseId && streamResponseId)
              event.responseId = streamResponseId;
            this.logger.info(
              `[HITL] Emitting stream.tool.approval: callId=${event.callId}, name=${event.name}, serverLabel=${event.serverLabel}, responseId=${event.responseId}`,
            );
          }
          if (event.type === 'stream.completed' && currentAgentName) {
            event.agentName = currentAgentName;
          }
          onEvent(event);
        }
      },
      signal,
    );
  }

  get conversations(): ConversationCapability {
    if (this._conversations) return this._conversations;
    this._conversations = buildConversationsCapability(
      this.orchestrator.getConversationFacade(),
    );
    return this._conversations;
  }

  get rag(): RAGCapability {
    if (this._rag) return this._rag;
    const orch = this.orchestrator;
    this._rag = buildRagCapability(orch.getVectorStoreFacade(), {
      getClient: () => orch.getClientManager().getExistingClient(),
      getModel: () => orch.getConfiguredModel(),
    });
    return this._rag;
  }

  get safety(): SafetyCapability {
    if (this._safety) return this._safety;
    this._safety = buildSafetyCapability(this.safetyService);
    return this._safety;
  }

  get evaluation(): EvaluationCapability {
    if (this._evaluation) return this._evaluation;
    this._evaluation = buildEvaluationCapability(this.evaluationService);
    return this._evaluation;
  }
}
