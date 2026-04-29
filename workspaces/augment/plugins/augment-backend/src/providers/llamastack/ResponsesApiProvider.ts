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
 * Responses API Provider
 *
 * Implements AgenticProvider by composing the existing service classes.
 * This is a composition wrapper — no business logic is duplicated.
 * All provider-specific logic lives in the existing services.
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
import {
  DEFAULT_EMBEDDING_DIMENSION,
  DEFAULT_EMBEDDING_MODEL,
  DEFAULT_CHUNK_SIZE,
  DEFAULT_MODEL,
} from '../../constants';
import { ResponsesApiCoordinator } from './ResponsesApiCoordinator';
import { SafetyService } from './SafetyService';
import { EvaluationService } from './EvaluationService';
import { normalizeLlamaStackEvent } from './StreamEventNormalizer';
import {
  type PromptCapabilities,
  type ChatAgent,
  deriveRoleFromTopology,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { buildMetaPrompt } from './promptGeneration';
import {
  buildConversationsCapability,
  buildRagCapability,
  buildSafetyCapability,
  buildEvaluationCapability,
} from './CapabilityBuilders';

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

  private _modelsCache: {
    data: Array<{ id: string; owned_by?: string; model_type?: string }>;
    expiresAt: number;
  } | null = null;
  private static readonly MODELS_CACHE_TTL_MS = 60_000;

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

  // ===========================================================================
  // Lifecycle
  // ===========================================================================

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

  /**
   * Invalidate the runtime config cache so admin changes take
   * effect immediately on the next request.
   */
  invalidateRuntimeConfig(): void {
    this.orchestrator.invalidateRuntimeConfig();
  }

  async getEffectiveConfig(): Promise<Record<string, unknown>> {
    const resolver = this.orchestrator.getResolver();
    if (!resolver) {
      return {};
    }
    const config = await resolver.resolve();
    const result: Record<string, unknown> = { ...config };
    return result;
  }

  async listModels(): Promise<
    Array<{ id: string; owned_by?: string; model_type?: string }>
  > {
    if (this._modelsCache && Date.now() < this._modelsCache.expiresAt) {
      return this._modelsCache.data;
    }

    const client = this.orchestrator.getClientManager().getExistingClient();
    const response = await client.request<{
      data: Array<{
        id: string;
        object?: string;
        owned_by?: string;
        model_type?: string;
        custom_metadata?: Record<string, unknown>;
      }>;
    }>('/v1/models', { method: 'GET' });

    const models = (response.data || [])
      .filter(m => typeof m.id === 'string' && m.id.length > 0)
      .map(m => {
        const modelType =
          m.model_type ?? (m.custom_metadata?.model_type as string | undefined);
        return {
          id: m.id,
          ...(m.owned_by ? { owned_by: m.owned_by } : {}),
          ...(modelType ? { model_type: modelType } : {}),
        };
      });

    this._modelsCache = {
      data: models,
      expiresAt: Date.now() + ResponsesApiProvider.MODELS_CACHE_TTL_MS,
    };

    return models;
  }

  async testModel(modelOverride?: string, _baseUrl?: string): Promise<{
    connected: boolean;
    modelFound: boolean;
    canGenerate: boolean;
    error?: string;
  }> {
    let models: Array<{ id: string }>;
    try {
      models = await this.listAvailableModels();
    } catch (err) {
      return {
        connected: false,
        modelFound: false,
        canGenerate: false,
        error: err instanceof Error ? err.message : 'Connection failed',
      };
    }

    const resolver = this.orchestrator.getResolver();
    const config = resolver ? await resolver.resolve() : null;
    const targetModel = modelOverride || config?.model;

    if (!targetModel) {
      return {
        connected: true,
        modelFound: false,
        canGenerate: false,
        error: 'No model configured',
      };
    }

    const modelFound = models.some(m => m.id === targetModel);
    if (!modelFound) {
      return {
        connected: true,
        modelFound: false,
        canGenerate: false,
        error: `Model "${targetModel}" not found on server`,
      };
    }

    const inferenceResult = await this.runMinimalInference(targetModel);
    return {
      connected: true,
      modelFound: true,
      canGenerate: inferenceResult.canGenerate,
      ...(inferenceResult.error ? { error: inferenceResult.error } : {}),
    };
  }

  private async listAvailableModels(): Promise<Array<{ id: string }>> {
    const client = this.orchestrator.getClientManager().getExistingClient();
    const response = await client.request<{
      data: Array<{ id: string }>;
    }>('/v1/models', { method: 'GET' });
    return response.data || [];
  }

  private async runMinimalInference(model: string): Promise<{
    canGenerate: boolean;
    error?: string;
  }> {
    const client = this.orchestrator.getClientManager().getExistingClient();
    try {
      const response = await client.request<{
        output: Array<{
          type: string;
          content?: Array<{ type: string; text?: string }>;
        }>;
        usage?: { output_tokens?: number };
      }>('/v1/responses', {
        method: 'POST',
        body: JSON.stringify({ input: 'Hi', model, store: false }),
      });

      const outputTokens = response.usage?.output_tokens ?? 0;
      const hasText = response.output?.some(
        item =>
          item.type === 'message' &&
          item.content?.some(b => b.type === 'output_text' && b.text),
      );

      return {
        canGenerate: hasText || outputTokens > 0,
        ...(!hasText && outputTokens === 0
          ? { error: 'Model returned 0 output tokens' }
          : {}),
      };
    } catch (err) {
      return {
        canGenerate: false,
        error: err instanceof Error ? err.message : 'Inference failed',
      };
    }
  }

  async generateSystemPrompt(
    description: string,
    modelOverride?: string,
    capabilities?: PromptCapabilities,
  ): Promise<string> {
    const resolver = this.orchestrator.getResolver();
    const config = resolver ? await resolver.resolve() : null;

    const { instructions, input } = buildMetaPrompt(
      description,
      config ?? {
        model: 'unknown',
        baseUrl: '',
        systemPrompt: '',
        vectorStoreIds: [],
        vectorStoreName: 'default-vector-store',
        embeddingModel: DEFAULT_EMBEDDING_MODEL,
        embeddingDimension: DEFAULT_EMBEDDING_DIMENSION,
        chunkingStrategy: 'auto',
        maxChunkSizeTokens: DEFAULT_CHUNK_SIZE,
        chunkOverlapTokens: 50,
        enableWebSearch: false,
        enableCodeInterpreter: false,
        skipTlsVerify: false,
        zdrMode: false,
        verboseStreamLogging: false,
      },
      capabilities,
    );

    const client = this.orchestrator.getClientManager().getExistingClient();
    const model = modelOverride || config?.model || DEFAULT_MODEL;

    const response = await client.request<{
      output: Array<{
        type: string;
        content?: Array<{ type: string; text?: string }>;
      }>;
    }>('/v1/responses', {
      method: 'POST',
      body: JSON.stringify({
        input,
        instructions,
        model,
        store: false,
      }),
    });

    for (const item of response.output) {
      if (item.type === 'message' && item.content) {
        for (const block of item.content) {
          if (block.type === 'output_text' && block.text) {
            return block.text.trim();
          }
        }
      }
    }

    throw new Error('LLM returned no text in the response');
  }

  /**
   * Refresh safety/evaluation dynamic overrides from the current EffectiveConfig.
   * Call this once per request (before safety/eval checks) so admin panel
   * changes take effect without a restart.
   */
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

  // ===========================================================================
  // Status
  // ===========================================================================

  async getStatus(): Promise<AgenticProviderStatus> {
    return this.orchestrator.getStatus();
  }

  async listAgents(): Promise<ChatAgent[]> {
    const snapshot = await this.orchestrator
      .getAgentGraphManager()
      ?.getSnapshot();
    if (!snapshot?.agents?.size) {
      return [];
    }

    // Build topology map from the snapshot for deriveRoleFromTopology
    const topologyMap: Record<string, { handoffs?: string[]; asTools?: string[] }> = {};
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
        description: resolved.config.instructions
          ? resolved.config.instructions.slice(0, 200)
          : undefined,
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

  // ===========================================================================
  // Chat
  // ===========================================================================

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
          /* non-JSON event */
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

        // Runner-emitted events are already normalized (stream.* namespace).
        // Pass them through directly — the normalizer only handles
        // LlamaStack-native events (response.*) and would drop these.
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
            if (!event.responseId && streamResponseId) {
              event.responseId = streamResponseId;
            }
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
            if (!event.responseId && streamResponseId) {
              event.responseId = streamResponseId;
            }
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

  // ===========================================================================
  // Optional Capabilities
  // ===========================================================================

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
