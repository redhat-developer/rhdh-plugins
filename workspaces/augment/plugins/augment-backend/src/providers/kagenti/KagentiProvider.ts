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
} from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';
import type { NormalizedStreamEvent } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type {
  AgenticProvider,
  AgenticProviderStatus,
  ConversationCapability,
  ChatRequest as AugmentChatRequest,
} from '../types';
import type { ChatResponse as AugmentChatResponse } from '../../types';
import type { FeatureFlagsResponse } from './client/types';
import { loadKagentiConfig } from './config/KagentiConfigLoader';
import type { KagentiConfig } from './config/KagentiConfigLoader';
import { KeycloakTokenManager } from './client/KeycloakTokenManager';
import { KagentiApiClient } from './client/KagentiApiClient';
import { KagentiSandboxClient } from './client/KagentiSandboxClient';
import { KagentiAdminClient } from './client/KagentiAdminClient';
import { KagentiStreamNormalizer } from './stream/KagentiStreamNormalizer';
import { KagentiAgentCardCache } from './KagentiAgentCardCache';
import type { AgentCardCacheEntry } from './KagentiAgentCardCache';
import { submitApproval as submitApprovalImpl } from './kagentiApprovalHandler';
import type { ApprovalRequest, ApprovalResult } from './kagentiApprovalHandler';
import { buildKagentiConversationCapability } from './kagentiConversationCapability';

export interface KagentiProviderOptions {
  logger: LoggerService;
  config: RootConfigService;
}

export class KagentiProvider implements AgenticProvider {
  readonly id = 'kagenti';
  readonly displayName = 'Kagenti';

  private readonly logger: LoggerService;
  private readonly rootConfig: RootConfigService;
  private kagentiConfig: KagentiConfig | undefined;
  private tokenManager: KeycloakTokenManager | undefined;
  private apiClient: KagentiApiClient | undefined;
  private sandboxClient: KagentiSandboxClient | undefined;
  private adminClient: KagentiAdminClient | undefined;
  private featureFlags: FeatureFlagsResponse = {
    sandbox: false,
    integrations: false,
    triggers: false,
  };

  private static readonly MAX_SESSION_ENTRIES = 10_000;
  private static readonly MODELS_CACHE_TTL_MS = 60_000;
  private _modelsCache: {
    data: Array<{ id: string; owned_by?: string; model_type?: string }>;
    expiresAt: number;
  } | null = null;
  private readonly cardCache: KagentiAgentCardCache;
  private readonly sessionAgentMap = new Map<string, string>();
  private readonly kagentiSessionMap = new Map<string, string>();

  /**
   * Set a value in a bounded Map with LRU eviction.
   * Re-inserting on set moves the key to the end of iteration order.
   */
  private boundedMapSet(
    map: Map<string, string>,
    key: string,
    value: string,
  ): void {
    if (map.has(key)) {
      map.delete(key);
    } else if (map.size >= KagentiProvider.MAX_SESSION_ENTRIES) {
      const evictCount = Math.ceil(KagentiProvider.MAX_SESSION_ENTRIES * 0.1);
      const iter = map.keys();
      for (let i = 0; i < evictCount; i++) {
        const next = iter.next();
        if (next.done) break;
        map.delete(next.value);
      }
      this.logger.warn(
        `Session map hit ${KagentiProvider.MAX_SESSION_ENTRIES} cap, evicted ${evictCount} least-recently-used entries`,
      );
    }
    map.set(key, value);
  }

  /**
   * Get a value from a bounded Map, promoting the key to most-recently-used.
   */
  private boundedMapGet(
    map: Map<string, string>,
    key: string,
  ): string | undefined {
    const value = map.get(key);
    if (value !== undefined) {
      map.delete(key);
      map.set(key, value);
    }
    return value;
  }

  readonly conversations: ConversationCapability;
  readonly rag = undefined;
  readonly safety = undefined;
  readonly evaluation = undefined;

  constructor(options: KagentiProviderOptions) {
    this.logger = options.logger.child({ label: 'kagenti-provider' });
    this.rootConfig = options.config;
    this.cardCache = new KagentiAgentCardCache(this.logger);
    this.conversations = buildKagentiConversationCapability(
      () => this.requireInitialized().apiClient,
      this.logger,
    );
  }

  private requireInitialized(): {
    config: KagentiConfig;
    tokenManager: KeycloakTokenManager;
    apiClient: KagentiApiClient;
  } {
    if (!this.kagentiConfig || !this.tokenManager || !this.apiClient) {
      throw new Error('KagentiProvider.initialize() must be called before use');
    }
    return {
      config: this.kagentiConfig,
      tokenManager: this.tokenManager,
      apiClient: this.apiClient,
    };
  }

  async initialize(): Promise<void> {
    this.kagentiConfig = loadKagentiConfig(this.rootConfig);
    this.logger.info(
      `Initializing Kagenti provider: ${this.kagentiConfig.baseUrl}`,
    );

    if (
      this.kagentiConfig.showAllNamespaces &&
      !this.kagentiConfig.namespaces?.length
    ) {
      this.logger.warn(
        'showAllNamespaces is enabled with no namespace allowlist — all Kagenti namespaces are accessible. ' +
          'Consider setting augment.kagenti.namespaces for production.',
      );
    }

    this.tokenManager = new KeycloakTokenManager({
      tokenEndpoint: this.kagentiConfig.auth.tokenEndpoint,
      clientId: this.kagentiConfig.auth.clientId,
      clientSecret: this.kagentiConfig.auth.clientSecret,
      logger: this.logger,
      skipTlsVerify: this.kagentiConfig.skipTlsVerify,
      tokenExpiryBufferSeconds: this.kagentiConfig.tokenExpiryBufferSeconds,
    });

    this.apiClient = new KagentiApiClient({
      baseUrl: this.kagentiConfig.baseUrl,
      tokenManager: this.tokenManager,
      skipTlsVerify: this.kagentiConfig.skipTlsVerify,
      logger: this.logger,
      requestTimeoutMs: this.kagentiConfig.requestTimeoutMs,
      streamTimeoutMs: this.kagentiConfig.streamTimeoutMs,
      maxRetries: this.kagentiConfig.maxRetries,
      retryBaseDelayMs: this.kagentiConfig.retryBaseDelayMs,
    });

    const health = await this.apiClient.health();
    this.logger.info(`Kagenti health: ${health.status}`);

    try {
      this.featureFlags = await this.apiClient.getFeatureFlags();
    } catch (err) {
      this.logger.warn(
        `Could not fetch Kagenti feature flags, assuming all disabled: ${err}`,
      );
    }

    const overrides = this.kagentiConfig.featureOverrides;
    if (overrides.sandbox !== undefined) {
      this.featureFlags.sandbox = overrides.sandbox;
    }
    if (overrides.integrations !== undefined) {
      this.featureFlags.integrations = overrides.integrations;
    }
    if (overrides.triggers !== undefined) {
      this.featureFlags.triggers = overrides.triggers;
    }
    this.logger.info(
      `Kagenti features: sandbox=${this.featureFlags.sandbox}, integrations=${this.featureFlags.integrations}, triggers=${this.featureFlags.triggers}${
        overrides.sandbox !== undefined ||
        overrides.integrations !== undefined ||
        overrides.triggers !== undefined
          ? ' (with local overrides applied)'
          : ''
      }`,
    );

    // Admin client is used for team/key management and other admin operations
    this.adminClient = new KagentiAdminClient(this.apiClient);

    if (this.featureFlags.sandbox) {
      this.sandboxClient = new KagentiSandboxClient(this.apiClient);
      this.logger.info('Sandbox client initialized');
    }
  }

  async postInitialize(): Promise<void> {
    const { config, apiClient } = this.requireInitialized();
    try {
      const agents = await apiClient.listAgents(config.namespace);
      this.logger.info(
        `Discovered ${agents.items.length} Kagenti agents in namespace "${config.namespace}"`,
      );
    } catch (err) {
      this.logger.warn(`Failed to warm agent cache: ${err}`);
    }
  }

  async getStatus(): Promise<AgenticProviderStatus> {
    const { config, apiClient } = this.requireInitialized();
    let connected = false;
    let error: string | undefined;

    try {
      const health = await apiClient.health();
      const ready = await apiClient.ready();
      connected = health.status === 'healthy' && ready.status === 'ready';
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }

    const defaultAgent = config.agentName ?? `${config.namespace}/default`;

    const securityMode =
      (this.rootConfig.getOptionalString('augment.security.mode') as
        | 'none'
        | 'plugin-only'
        | 'full'
        | undefined) ?? 'plugin-only';

    return {
      provider: {
        id: 'kagenti',
        model: defaultAgent,
        baseUrl: config.baseUrl,
        connected,
        error,
      },
      vectorStore: { id: 'none', connected: false },
      mcpServers: [],
      securityMode,
      timestamp: new Date().toISOString(),
      ready: connected,
      configurationErrors: error ? [error] : [],
      capabilities: {
        chat: true,
        rag: { available: false, reason: 'Kagenti does not provide RAG' },
        mcpTools: {
          available: true,
          reason: 'Kagenti manages MCP tools natively',
        },
      },
    };
  }

  async getEffectiveConfig(): Promise<Record<string, unknown>> {
    const { config } = this.requireInitialized();
    const ls = this.rootConfig.getOptionalConfig('augment.llamaStack');
    let model = ls?.getOptionalString('model') ?? '';
    if (model === 'unused') model = '';

    if (!model) {
      try {
        const available = await this.listModels();
        const inference = available.find(
          m =>
            m.id.includes('inference') &&
            !m.id.includes('embed') &&
            !m.id.includes('MiniLM'),
        );
        model = inference?.id ?? available[0]?.id ?? '';
      } catch (err) {
        this.logger.warn(
          `Failed to auto-detect model via listModels: ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    return {
      model,
      baseUrl: config.baseUrl,
      systemPrompt:
        this.rootConfig.getOptionalString('augment.systemPrompt') ?? '',
      toolChoice: ls?.getOptionalString('toolChoice') ?? 'auto',
      enableWebSearch: ls?.getOptionalBoolean('enableWebSearch') ?? false,
      enableCodeInterpreter:
        ls?.getOptionalBoolean('enableCodeInterpreter') ?? false,
      safetyEnabled: ls?.getOptionalBoolean('safetyEnabled') ?? false,
      inputShields: ls?.getOptionalStringArray('inputShields') ?? [],
      outputShields: ls?.getOptionalStringArray('outputShields') ?? [],
      evaluationEnabled: ls?.getOptionalBoolean('evaluationEnabled') ?? false,
      scoringFunctions: ls?.getOptionalStringArray('scoringFunctions') ?? [],
    };
  }

  async chat(request: AugmentChatRequest): Promise<AugmentChatResponse> {
    const { apiClient } = this.requireInitialized();
    const { namespace, name } = this.resolveAgent(request);
    const userMessage = this.extractLastUserMessage(request);

    const backstageSessionId = request.sessionId;
    const storedSessionId = backstageSessionId
      ? this.boundedMapGet(this.kagentiSessionMap, backstageSessionId)
      : undefined;

    const a2aMetadata = await this.buildA2AMetadata(namespace, name);
    const mergedMetadata = {
      ...a2aMetadata,
      ...(storedSessionId ? { contextId: storedSessionId } : {}),
    };

    const response = await apiClient.chatSend(
      namespace,
      name,
      userMessage,
      storedSessionId,
      Object.keys(mergedMetadata).length > 0 ? mergedMetadata : undefined,
    );

    if (backstageSessionId && response.session_id) {
      this.boundedMapSet(
        this.kagentiSessionMap,
        backstageSessionId,
        response.session_id,
      );
      this.boundedMapSet(
        this.sessionAgentMap,
        response.session_id,
        `${namespace}/${name}`,
      );
    }

    return {
      role: 'assistant',
      content: response.content,
      responseId: response.session_id,
    };
  }

  async chatStream(
    request: AugmentChatRequest,
    onEvent: (event: NormalizedStreamEvent) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const { config, apiClient } = this.requireInitialized();
    const { namespace, name } = this.resolveAgent(request);
    const userMessage = this.extractLastUserMessage(request);
    const normalizer = new KagentiStreamNormalizer(
      config.verboseStreamLogging ? this.logger : undefined,
    );

    const backstageSessionId = request.sessionId;
    const agentId = `${namespace}/${name}`;

    const storedContextId = backstageSessionId
      ? this.boundedMapGet(this.kagentiSessionMap, backstageSessionId)
      : undefined;

    const a2aMetadata = await this.buildA2AMetadata(namespace, name);
    const mergedMetadata = {
      ...a2aMetadata,
      ...(storedContextId ? { contextId: storedContextId } : {}),
    };

    let contentEventCount = 0;

    try {
      await apiClient.chatStream(
        namespace,
        name,
        userMessage,
        storedContextId,
        (line: string) => {
          if (config.verboseStreamLogging) {
            this.logger.info(
              `KagentiSSE raw (${agentId}): ${line.substring(0, 1000)}`,
            );
          }
          const events = normalizer.normalize(line);
          for (const event of events) {
            if (config.verboseStreamLogging) {
              this.logger.debug(`KagentiSSE normalized: ${event.type}`);
            }

            // When the agent rejects streaming (-32603), suppress the
            // error/started/completed events -- the fallback path will
            // emit clean events with the actual response content.
            if (normalizer.hasJsonRpcStreamingError) {
              continue;
            }

            if (event.type === 'stream.started' && backstageSessionId) {
              const ctxId = (event as { responseId?: string }).responseId;
              if (ctxId) {
                this.boundedMapSet(
                  this.kagentiSessionMap,
                  backstageSessionId,
                  ctxId,
                );
                this.boundedMapSet(this.sessionAgentMap, ctxId, agentId);
              }
            }
            if (
              event.type === 'stream.text.delta' ||
              event.type === 'stream.artifact'
            ) {
              contentEventCount++;
            }
            onEvent(event);
          }
        },
        signal,
        Object.keys(mergedMetadata).length > 0 ? mergedMetadata : undefined,
      );
    } catch (err) {
      if (signal?.aborted) {
        this.logger.debug('Kagenti chat stream aborted by client');
        return;
      }
      throw err;
    }

    if (
      contentEventCount === 0 &&
      normalizer.hasJsonRpcStreamingError &&
      !signal?.aborted
    ) {
      this.logger.info(
        `Agent ${agentId} does not support streaming (JSONRPC -32603), falling back to non-streaming`,
      );
      const response = await this.chat(request);

      onEvent({
        type: 'stream.started',
        responseId: response.responseId ?? `kagenti-fallback-${Date.now()}`,
      });
      if (response.content) {
        onEvent({ type: 'stream.text.delta', delta: response.content });
        onEvent({ type: 'stream.text.done', text: response.content });
      }
      onEvent({
        type: 'stream.completed',
        ...(response.usage && { usage: response.usage }),
      });
    }
  }

  async listModels(): Promise<
    Array<{ id: string; owned_by?: string; model_type?: string }>
  > {
    if (this._modelsCache && Date.now() < this._modelsCache.expiresAt) {
      return this._modelsCache.data;
    }

    const llamaStackUrl = this.rootConfig.getOptionalString(
      'augment.llamaStack.baseUrl',
    );
    if (!llamaStackUrl) {
      this.logger.debug(
        'No augment.llamaStack.baseUrl configured; model list unavailable',
      );
      return [];
    }

    try {
      const url = `${llamaStackUrl.replace(/\/+$/, '')}/v1/models`;
      const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        this.logger.warn(
          `LlamaStack /v1/models returned ${res.status}: ${res.statusText}`,
        );
        return [];
      }
      const json = (await res.json()) as {
        data?: Array<{
          id: string;
          owned_by?: string;
          model_type?: string;
          custom_metadata?: Record<string, unknown>;
        }>;
      };
      const models = (json.data ?? [])
        .filter(
          (m): m is typeof m & { id: string } =>
            typeof m.id === 'string' && m.id.length > 0,
        )
        .map(m => {
          const modelType =
            m.model_type ??
            (m.custom_metadata?.model_type as string | undefined);
          return {
            id: m.id,
            ...(m.owned_by ? { owned_by: m.owned_by } : {}),
            ...(modelType ? { model_type: modelType } : {}),
          };
        });

      this._modelsCache = {
        data: models,
        expiresAt: Date.now() + KagentiProvider.MODELS_CACHE_TTL_MS,
      };
      return models;
    } catch (err) {
      this.logger.warn(
        `Failed to fetch models from LlamaStack at ${llamaStackUrl}: ${err instanceof Error ? err.message : err}`,
      );
      return [];
    }
  }

  async testModel(model?: string): Promise<{
    connected: boolean;
    modelFound: boolean;
    canGenerate: boolean;
    error?: string;
  }> {
    const llamaStackUrl = this.rootConfig.getOptionalString(
      'augment.llamaStack.baseUrl',
    );

    if (llamaStackUrl && model) {
      try {
        const url = `${llamaStackUrl.replace(/\/+$/, '')}/v1/models`;
        const res = await fetch(url, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(10_000),
        });
        if (!res.ok) {
          return {
            connected: false,
            modelFound: false,
            canGenerate: false,
            error: `LlamaStack returned ${res.status}: ${res.statusText}`,
          };
        }
        const json = (await res.json()) as {
          data?: Array<{ id: string }>;
        };
        const found = json.data?.some(m => m.id === model) ?? false;
        return {
          connected: true,
          modelFound: found,
          canGenerate: found,
          error: found ? undefined : `Model "${model}" not found on LlamaStack`,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          connected: false,
          modelFound: false,
          canGenerate: false,
          error: `LlamaStack connection failed: ${msg}`,
        };
      }
    }

    const { config, apiClient } = this.requireInitialized();
    try {
      const { namespace, name } = model
        ? this.parseAgentId(model)
        : {
            namespace: config.namespace,
            name: config.agentName ?? 'default',
          };

      await apiClient.getAgentCard(namespace, name);
      return { connected: true, modelFound: true, canGenerate: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isConnectionError =
        /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|timeout/i.test(msg);
      return {
        connected: !isConnectionError,
        modelFound: false,
        canGenerate: false,
        error: msg,
      };
    }
  }

  async shutdown(): Promise<void> {
    this.tokenManager?.clearCache();
    this.apiClient?.destroy();
    this.cardCache.clear();
    this.kagentiSessionMap.clear();
    this.sessionAgentMap.clear();
    this.logger.info('Kagenti provider shut down');
  }

  // -- Agent Card Cache -------------------------------------------------------

  async getAgentCardCached(
    namespace: string,
    name: string,
  ): Promise<AgentCardCacheEntry> {
    const { config, apiClient } = this.requireInitialized();
    return this.cardCache.getAgentCardCached(
      apiClient,
      config,
      namespace,
      name,
    );
  }

  // -- Accessors for routes ---------------------------------------------------

  getApiClient(): KagentiApiClient {
    return this.requireInitialized().apiClient;
  }

  getSandboxClient(): KagentiSandboxClient | undefined {
    return this.sandboxClient;
  }

  getAdminClient(): KagentiAdminClient | undefined {
    return this.adminClient;
  }

  getFeatureFlags(): FeatureFlagsResponse {
    return this.featureFlags;
  }

  /**
   * Set per-request user context so all subsequent Kagenti API calls
   * include the Backstage user identity as an X-Backstage-User header.
   */
  setUserContext(userRef: string): void {
    if (this.apiClient) {
      this.apiClient.setRequestContext({ userRef });
    }
  }

  getConfig(): KagentiConfig {
    return this.requireInitialized().config;
  }

  getTokenManager(): KeycloakTokenManager {
    return this.requireInitialized().tokenManager;
  }

  /**
   * Pre-populate the in-memory session map so chatStream can resume a
   * Kagenti conversation that was persisted in the DB across restarts.
   */
  hydrateSessionContext(
    backstageSessionId: string,
    contextId: string,
    agentId?: string,
  ): void {
    this.boundedMapSet(this.kagentiSessionMap, backstageSessionId, contextId);
    if (agentId) {
      this.boundedMapSet(this.sessionAgentMap, contextId, agentId);
    }
  }

  /** Return the Kagenti context ID associated with a Backstage session. */
  getSessionContextId(backstageSessionId: string): string | undefined {
    return this.boundedMapGet(this.kagentiSessionMap, backstageSessionId);
  }

  /**
   * Submit a tool-approval response back to Kagenti via the A2A protocol.
   * The contextId (from the original approval request's responseId) identifies
   * the paused conversation. We resume it by sending a follow-up message with
   * the approval metadata attached.
   *
   * For secrets and OAuth responses, uses the proper ADK extension metadata
   * format (secret_fulfillments / oauth redirect_uri) keyed by extension URI.
   */
  async submitApproval(approval: ApprovalRequest): Promise<ApprovalResult> {
    const { config, apiClient } = this.requireInitialized();
    const contextId = approval.responseId;

    const agentId = this.boundedMapGet(this.sessionAgentMap, contextId);
    const { namespace, name } = agentId
      ? this.parseAgentId(agentId)
      : this.resolveAgent({ messages: [] });

    return submitApprovalImpl(
      apiClient,
      namespace,
      name,
      approval,
      config.extensionBaseUrl,
    );
  }

  /**
   * Validate that a namespace is in the configured allow-list.
   * Throws InputError if the namespace is not permitted.
   */
  validateNamespace(namespace: string): void {
    const { config } = this.requireInitialized();

    if (config.namespaces?.length) {
      const allowSet = new Set(config.namespaces);
      if (!allowSet.has(namespace)) {
        throw new InputError(
          `Namespace "${namespace}" is not in the configured allow-list`,
        );
      }
      return;
    }

    if (!config.showAllNamespaces && namespace !== config.namespace) {
      throw new InputError(
        `Namespace "${namespace}" is not accessible (default: "${config.namespace}")`,
      );
    }
  }

  // -- Private helpers --------------------------------------------------------

  private resolveAgent(request: AugmentChatRequest): {
    namespace: string;
    name: string;
  } {
    const { config } = this.requireInitialized();
    const model =
      'model' in request ? (request.model as string | undefined) : undefined;
    if (model && model.includes('/')) {
      const parsed = this.parseAgentId(model);
      this.validateNamespace(parsed.namespace);
      return parsed;
    }
    return {
      namespace: config.namespace,
      name: config.agentName ?? model ?? 'default',
    };
  }

  private parseAgentId(agentId: string): {
    namespace: string;
    name: string;
  } {
    const { config } = this.requireInitialized();
    const slashIdx = agentId.indexOf('/');
    if (slashIdx > 0) {
      return {
        namespace: agentId.substring(0, slashIdx),
        name: agentId.substring(slashIdx + 1),
      };
    }
    return { namespace: config.namespace, name: agentId };
  }

  private extractLastUserMessage(request: AugmentChatRequest): string {
    if (request.messages) {
      for (let i = request.messages.length - 1; i >= 0; i--) {
        if (request.messages[i].role === 'user') {
          return request.messages[i].content || '';
        }
      }
    }
    return '';
  }

  /**
   * Build A2A metadata from the agent card's demand resolution.
   * Returns undefined if the agent has no extension demands.
   */
  private async buildA2AMetadata(
    namespace: string,
    name: string,
  ): Promise<
    | {
        metadata?: Record<string, unknown>;
        parts?: Array<Record<string, unknown>>;
        contextId?: string;
      }
    | undefined
  > {
    try {
      const entry = await this.getAgentCardCached(namespace, name);
      const hasDemands = Object.values(entry.demands).some(d => d !== null);

      if (!hasDemands) {
        return undefined;
      }

      const metadata = await entry.resolveMetadata({});
      if (!metadata || Object.keys(metadata).length === 0) {
        return undefined;
      }

      return { metadata };
    } catch (err) {
      this.logger.debug(
        `Could not build A2A metadata for ${namespace}/${name}: ${err}`,
      );
      return undefined;
    }
  }
}
