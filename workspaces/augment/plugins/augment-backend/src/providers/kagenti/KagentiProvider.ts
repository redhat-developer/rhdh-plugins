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
  CacheService,
} from '@backstage/backend-plugin-api';
import pLimit from 'p-limit';
import type {
  NormalizedStreamEvent,
  ChatAgent,
  KagentiAgentSummary,
  PromptCapabilities,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import {
  isProviderScopedKey,
  type AdminConfigKey,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
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
import { buildMetaPrompt } from '../../services';
import { getVisibleNamespaces } from './kagentiNamespaceUtils';
import {
  stripTrailingSlashes,
  createNoopCache,
  resolveAgent,
  parseAgentId,
  extractLastUserMessage,
  buildA2AMetadata,
  validateNamespace,
} from './kagentiHelpers';
import type { KagentiProviderOptions } from './kagentiHelpers';

export type { KagentiProviderOptions };

export class KagentiProvider implements AgenticProvider {
  readonly id = 'kagenti';
  readonly displayName = 'Kagenti';

  private readonly logger: LoggerService;
  private readonly rootConfig: RootConfigService;
  private readonly adminConfig?: import('../../services/AdminConfigService').AdminConfigService;
  private kagentiConfig: KagentiConfig | undefined;
  private tokenManager: KeycloakTokenManager | undefined;
  private apiClient: KagentiApiClient | undefined;
  private activeBaseUrl: string | undefined;
  private sandboxClient: KagentiSandboxClient | undefined;
  private adminClient: KagentiAdminClient | undefined;
  private featureFlags: FeatureFlagsResponse = {
    sandbox: false,
    integrations: false,
    triggers: false,
  };
  private static readonly MODELS_CACHE_TTL_MS = 60_000;
  private static readonly SESSION_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
  private readonly cardCache: KagentiAgentCardCache;
  private readonly sessionAgentCache: CacheService;
  private readonly kagentiSessionCache: CacheService;
  private readonly modelsCache: CacheService;
  readonly conversations: ConversationCapability;
  readonly rag = undefined;
  readonly safety = undefined;
  readonly evaluation = undefined;

  constructor(options: KagentiProviderOptions) {
    this.logger = options.logger.child({ label: 'kagenti-provider' });
    this.rootConfig = options.config;
    this.adminConfig = options.adminConfig;
    const bc = options.cache;
    this.sessionAgentCache = bc
      ? bc.withOptions({ defaultTtl: KagentiProvider.SESSION_CACHE_TTL_MS })
      : createNoopCache();
    this.kagentiSessionCache = bc
      ? bc.withOptions({ defaultTtl: KagentiProvider.SESSION_CACHE_TTL_MS })
      : createNoopCache();
    this.modelsCache = bc
      ? bc.withOptions({ defaultTtl: KagentiProvider.MODELS_CACHE_TTL_MS })
      : createNoopCache();
    this.cardCache = new KagentiAgentCardCache(
      this.logger,
      bc ? bc.withOptions({ defaultTtl: 5 * 60 * 1000 }) : createNoopCache(),
    );
    this.conversations = buildKagentiConversationCapability(
      () => this.requireInitialized().apiClient,
      this.logger,
    );
  }

  private requireInitialized() {
    if (!this.kagentiConfig || !this.tokenManager || !this.apiClient)
      throw new Error('KagentiProvider.initialize() must be called before use');
    return {
      config: this.kagentiConfig,
      tokenManager: this.tokenManager,
      apiClient: this.apiClient,
    };
  }

  private async resolveKagentiBaseUrl(): Promise<string> {
    if (this.adminConfig) {
      try {
        const dbUrl = await this.adminConfig.getScopedValue(
          'kagentiBaseUrl',
          'kagenti',
        );
        if (typeof dbUrl === 'string' && dbUrl) return dbUrl;
      } catch {
        /* fall through */
      }
    }
    return this.kagentiConfig?.baseUrl ?? '';
  }

  private async ensureClientUrl(): Promise<void> {
    const resolved = await this.resolveKagentiBaseUrl();
    if (!resolved || resolved === this.activeBaseUrl) return;
    const { tokenManager } = this.requireInitialized();
    this.logger.info(
      `Kagenti baseUrl changed to ${resolved}, rebuilding client`,
    );
    this.activeBaseUrl = resolved;
    this.apiClient = new KagentiApiClient({
      baseUrl: resolved,
      tokenManager,
      skipTlsVerify: this.kagentiConfig!.skipTlsVerify,
      logger: this.logger,
      requestTimeoutMs: this.kagentiConfig!.requestTimeoutMs,
      streamTimeoutMs: this.kagentiConfig!.streamTimeoutMs,
      maxRetries: this.kagentiConfig!.maxRetries,
      retryBaseDelayMs: this.kagentiConfig!.retryBaseDelayMs,
    });
    this.adminClient = new KagentiAdminClient(this.apiClient);
    if (this.featureFlags.sandbox)
      this.sandboxClient = new KagentiSandboxClient(this.apiClient);
  }

  async initialize(): Promise<void> {
    this.kagentiConfig = loadKagentiConfig(this.rootConfig);
    this.logger.info(
      `Initializing Kagenti provider: ${this.kagentiConfig.baseUrl}`,
    );
    if (
      this.kagentiConfig.showAllNamespaces &&
      !this.kagentiConfig.namespaces?.length
    )
      this.logger.warn(
        'showAllNamespaces is enabled with no namespace allowlist',
      );
    this.tokenManager = new KeycloakTokenManager({
      tokenEndpoint: this.kagentiConfig.auth.tokenEndpoint,
      clientId: this.kagentiConfig.auth.clientId,
      clientSecret: this.kagentiConfig.auth.clientSecret,
      logger: this.logger,
      skipTlsVerify: this.kagentiConfig.skipTlsVerify,
      tokenExpiryBufferSeconds: this.kagentiConfig.tokenExpiryBufferSeconds,
    });
    this.activeBaseUrl = this.kagentiConfig.baseUrl;
    this.apiClient = new KagentiApiClient({
      baseUrl: this.activeBaseUrl,
      tokenManager: this.tokenManager,
      skipTlsVerify: this.kagentiConfig.skipTlsVerify,
      logger: this.logger,
      requestTimeoutMs: this.kagentiConfig.requestTimeoutMs,
      streamTimeoutMs: this.kagentiConfig.streamTimeoutMs,
      maxRetries: this.kagentiConfig.maxRetries,
      retryBaseDelayMs: this.kagentiConfig.retryBaseDelayMs,
    });
    try {
      await this.tokenManager.getToken();
      this.logger.info('Keycloak token acquired successfully');
    } catch (e) {
      this.logger.error(
        `Failed to acquire Keycloak token: ${e instanceof Error ? e.message : e}`,
      );
    }
    try {
      const h = await this.apiClient.health();
      this.logger.info(`Kagenti health: ${h.status}`);
    } catch (e) {
      this.logger.error(
        `Cannot reach Kagenti at ${this.activeBaseUrl}: ${e instanceof Error ? e.message : e}`,
      );
    }
    try {
      this.featureFlags = await this.apiClient.getFeatureFlags();
    } catch (e) {
      this.logger.warn(`Could not fetch Kagenti feature flags: ${e}`);
    }
    const ov = this.kagentiConfig.featureOverrides;
    if (ov.sandbox !== undefined) this.featureFlags.sandbox = ov.sandbox;
    if (ov.integrations !== undefined)
      this.featureFlags.integrations = ov.integrations;
    if (ov.triggers !== undefined) this.featureFlags.triggers = ov.triggers;
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
      this.logger.info(`Discovered ${agents.items.length} Kagenti agents`);
    } catch (err) {
      this.logger.warn(`Failed to warm agent cache: ${err}`);
    }
  }

  async getStatus(): Promise<AgenticProviderStatus> {
    const { config, apiClient } = this.requireInitialized();
    let connected = false;
    let error: string | undefined;
    try {
      const h = await apiClient.health();
      const r = await apiClient.ready();
      connected = h.status === 'healthy' && r.status === 'ready';
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }
    const securityMode =
      (this.rootConfig.getOptionalString('augment.security.mode') as
        | 'none'
        | 'plugin-only'
        | 'full'
        | undefined) ?? 'plugin-only';
    return {
      provider: {
        id: 'kagenti',
        model: config.agentName ?? `${config.namespace}/default`,
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
        agentCatalog: true,
        agentSelection: true,
        agentCards: true,
      },
    };
  }

  async getEffectiveConfig(): Promise<Record<string, unknown>> {
    await this.ensureClientUrl();
    const { config } = this.requireInitialized();
    const ls = this.rootConfig.getOptionalConfig('augment.llamaStack');
    let model = ls?.getOptionalString('model') ?? '';
    if (model === 'unused') model = '';
    if (!model) {
      try {
        const available = await this.listModels();
        model =
          available.find(
            m => m.id.includes('inference') && !m.id.includes('embed'),
          )?.id ??
          available[0]?.id ??
          '';
      } catch {
        /* */
      }
    }
    const result: Record<string, unknown> = {
      model,
      baseUrl: ls?.getOptionalString('baseUrl') || config.baseUrl,
      kagentiBaseUrl: this.activeBaseUrl || config.baseUrl,
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
    if (this.adminConfig) {
      const dbKeys: AdminConfigKey[] = [
        'model',
        'baseUrl',
        'kagentiBaseUrl',
        'systemPrompt',
        'toolChoice',
        'enableWebSearch',
        'enableCodeInterpreter',
        'mcpServers',
        'disabledMcpServerIds',
        'safetyEnabled',
        'inputShields',
        'outputShields',
        'evaluationEnabled',
        'scoringFunctions',
        'agents',
        'defaultAgent',
        'maxAgentTurns',
      ];
      const values = await Promise.all(
        dbKeys.map(k =>
          isProviderScopedKey(k)
            ? this.adminConfig!.getScopedValue(k, 'kagenti')
            : this.adminConfig!.get(k),
        ),
      );
      for (let i = 0; i < dbKeys.length; i++) {
        if (values[i] !== undefined) result[dbKeys[i]] = values[i];
      }
    }
    return result;
  }

  async chat(request: AugmentChatRequest): Promise<AugmentChatResponse> {
    await this.ensureClientUrl();
    const { apiClient } = this.requireInitialized();
    const { namespace, name } = this.doResolveAgent(request);
    const userMessage = extractLastUserMessage(request);
    const backstageSessionId = request.sessionId;
    const storedSessionId = backstageSessionId
      ? await this.kagentiSessionCache.get<string>(backstageSessionId)
      : undefined;
    const a2a = await buildA2AMetadata(
      namespace,
      name,
      (ns, n) => this.getAgentCardCached(ns, n),
      this.logger,
    );
    const merged = {
      ...a2a,
      ...(storedSessionId ? { contextId: storedSessionId } : {}),
    };
    const response = await apiClient.chatSend(
      namespace,
      name,
      userMessage,
      storedSessionId,
      Object.keys(merged).length > 0 ? merged : undefined,
    );
    if (backstageSessionId && response.session_id) {
      await this.kagentiSessionCache.set(
        backstageSessionId,
        response.session_id,
      );
      await this.sessionAgentCache.set(
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
    await this.ensureClientUrl();
    const { config, apiClient } = this.requireInitialized();
    const { namespace, name } = this.doResolveAgent(request);
    const userMessage = extractLastUserMessage(request);
    const normalizer = new KagentiStreamNormalizer(
      config.verboseStreamLogging ? this.logger : undefined,
    );
    const backstageSessionId = request.sessionId;
    const agentId = `${namespace}/${name}`;
    const storedContextId = backstageSessionId
      ? await this.kagentiSessionCache.get<string>(backstageSessionId)
      : undefined;
    const a2a = await buildA2AMetadata(
      namespace,
      name,
      (ns, n) => this.getAgentCardCached(ns, n),
      this.logger,
    );
    const merged = {
      ...a2a,
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
          const events = normalizer.normalize(line);
          for (const event of events) {
            if (normalizer.hasJsonRpcStreamingError) continue;
            if (event.type === 'stream.started' && backstageSessionId) {
              const ctxId = (event as { responseId?: string }).responseId;
              if (ctxId) {
                void this.kagentiSessionCache.set(backstageSessionId, ctxId);
                void this.sessionAgentCache.set(ctxId, agentId);
              }
            }
            if (
              event.type === 'stream.text.delta' ||
              event.type === 'stream.artifact'
            )
              contentEventCount++;
            onEvent(event);
          }
        },
        signal,
        Object.keys(merged).length > 0 ? merged : undefined,
      );
    } catch (err) {
      if (signal?.aborted) return;
      const errMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Kagenti chatStream failed for ${agentId}: ${errMsg}`);
      if (/ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i.test(errMsg))
        throw new Error(
          `Cannot connect to Kagenti at ${this.activeBaseUrl}: ${errMsg}`,
        );
      if (/status 401/i.test(errMsg))
        throw new Error(
          `Kagenti rejected the request (401 Unauthorized): ${errMsg}`,
        );
      throw err;
    }
    if (contentEventCount === 0 && !signal?.aborted) {
      this.logger.info(
        `Agent ${agentId} stream produced no content, falling back to non-streaming`,
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
      onEvent({ type: 'stream.completed' });
    }
  }

  async listModels(): Promise<
    Array<{ id: string; owned_by?: string; model_type?: string }>
  > {
    const cached =
      await this.modelsCache.get<
        Array<{ id: string; owned_by?: string; model_type?: string }>
      >('kagenti:models');
    if (cached) return cached;
    const llamaStackUrl = this.rootConfig.getOptionalString(
      'augment.llamaStack.baseUrl',
    );
    if (!llamaStackUrl) return [];
    try {
      const res = await fetch(
        `${stripTrailingSlashes(llamaStackUrl)}/v1/models`,
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(10_000),
        },
      );
      if (!res.ok) return [];
      const json = (await res.json()) as {
        data?: Array<{
          id: string;
          owned_by?: string;
          model_type?: string;
          custom_metadata?: Record<string, unknown>;
        }>;
      };
      const models = (json.data ?? [])
        .filter(m => typeof m.id === 'string' && m.id.length > 0)
        .map(m => ({
          id: m.id,
          ...(m.owned_by ? { owned_by: m.owned_by } : {}),
          ...((m.model_type ?? m.custom_metadata?.model_type)
            ? {
                model_type: (m.model_type ??
                  m.custom_metadata?.model_type) as string,
              }
            : {}),
        }));
      await this.modelsCache.set('kagenti:models', models);
      return models;
    } catch {
      return [];
    }
  }

  async listAgents(): Promise<ChatAgent[]> {
    await this.ensureClientUrl();
    const { config, apiClient } = this.requireInitialized();
    const namespaces = await getVisibleNamespaces(
      apiClient,
      config,
      this.logger,
    );
    const allItems: KagentiAgentSummary[] = [];
    const limit = pLimit(5);
    const nsResults = await Promise.allSettled(
      namespaces.map(ns => limit(() => apiClient.listAgents(ns))),
    );
    for (let i = 0; i < nsResults.length; i++) {
      const r = nsResults[i];
      if (r.status === 'fulfilled') {
        for (const agent of r.value.items ?? []) allItems.push(agent);
      } else {
        this.logger.warn(
          `Failed to list agents in namespace ${namespaces[i]}: ${r.reason instanceof Error ? r.reason.message : r.reason}`,
        );
      }
    }
    if (allItems.length === 0 && config.agents?.length) {
      for (const ref of config.agents) {
        const { namespace: ns, name: n } = ref.includes('/')
          ? { namespace: ref.split('/')[0], name: ref.split('/')[1] }
          : { namespace: config.namespace, name: ref };
        try {
          const card = await this.getAgentCardCached(ns, n);
          allItems.push({
            name: n,
            namespace: ns,
            description: card.card?.description,
            status: 'ready',
            createdAt: new Date().toISOString(),
            labels: {},
          });
        } catch {
          /* skip */
        }
      }
    }
    return allItems.map(agent => ({
      id: `${agent.namespace}/${agent.name}`,
      name: agent.name,
      description: agent.description,
      status: agent.status,
      isDefault: false,
      providerType: 'kagenti',
      createdAt: agent.createdAt,
      framework: agent.labels?.framework,
      protocols: (() => {
        const p = agent.labels?.protocol;
        if (!p) return undefined;
        return Array.isArray(p) ? p : [p];
      })(),
      source: 'kagenti',
      namespace: agent.namespace,
    }));
  }

  async generateSystemPrompt(
    description: string,
    modelOverride?: string,
    capabilities?: PromptCapabilities,
  ): Promise<string> {
    const llamaStackUrl = this.rootConfig.getOptionalString(
      'augment.llamaStack.baseUrl',
    );
    if (!llamaStackUrl)
      throw new Error('augment.llamaStack.baseUrl is not configured');
    const ec = await this.getEffectiveConfig();
    const model = modelOverride || (ec.model as string) || 'default';
    const { instructions, input } = buildMetaPrompt(
      description,
      {
        model,
        baseUrl: llamaStackUrl,
        systemPrompt: (ec.systemPrompt as string) || '',
        vectorStoreIds: [],
        vectorStoreName: 'default-vector-store',
        embeddingModel: 'all-MiniLM-L6-v2',
        embeddingDimension: 384,
        chunkingStrategy: 'auto' as const,
        maxChunkSizeTokens: 800,
        chunkOverlapTokens: 50,
        enableWebSearch: (ec.enableWebSearch as boolean) || false,
        enableCodeInterpreter: (ec.enableCodeInterpreter as boolean) || false,
        skipTlsVerify: false,
        zdrMode: false,
        verboseStreamLogging: false,
      },
      capabilities,
    );
    const res = await fetch(
      `${stripTrailingSlashes(llamaStackUrl)}/v1/responses`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ input, instructions, model, store: false }),
        signal: AbortSignal.timeout(60_000),
      },
    );
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(
        `Inference server returned ${res.status}: ${body.slice(0, 200)}`,
      );
    }
    const response = (await res.json()) as {
      output: Array<{
        type: string;
        content?: Array<{ type: string; text?: string }>;
      }>;
    };
    for (const item of response.output) {
      if (item.type === 'message' && item.content) {
        for (const block of item.content) {
          if (block.type === 'output_text' && block.text)
            return block.text.trim();
        }
      }
    }
    throw new Error('LLM returned no text in the response');
  }

  async testModel(
    model?: string,
    overrideBaseUrl?: string,
  ): Promise<{
    connected: boolean;
    modelFound: boolean;
    canGenerate: boolean;
    error?: string;
  }> {
    const llamaStackUrl =
      overrideBaseUrl ||
      this.rootConfig.getOptionalString('augment.llamaStack.baseUrl');
    if (llamaStackUrl && model) {
      try {
        const res = await fetch(
          `${stripTrailingSlashes(llamaStackUrl)}/v1/models`,
          {
            method: 'GET',
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(10_000),
          },
        );
        if (!res.ok)
          return {
            connected: false,
            modelFound: false,
            canGenerate: false,
            error: `LlamaStack returned ${res.status}`,
          };
        const json = (await res.json()) as { data?: Array<{ id: string }> };
        const found = json.data?.some(m => m.id === model) ?? false;
        return {
          connected: true,
          modelFound: found,
          canGenerate: found,
          error: found ? undefined : `Model "${model}" not found`,
        };
      } catch (err) {
        return {
          connected: false,
          modelFound: false,
          canGenerate: false,
          error: `LlamaStack connection failed: ${err instanceof Error ? err.message : err}`,
        };
      }
    }
    const { config, apiClient } = this.requireInitialized();
    try {
      const { namespace, name } = model
        ? parseAgentId(model, config.namespace)
        : { namespace: config.namespace, name: config.agentName ?? 'default' };
      await apiClient.getAgentCard(namespace, name);
      return { connected: true, modelFound: true, canGenerate: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        connected: !/ECONNREFUSED|ENOTFOUND|ETIMEDOUT|timeout/i.test(msg),
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
    this.logger.info('Kagenti provider shut down');
  }
  async getAgentCardCached(
    ns: string,
    name: string,
    opts?: { retries?: number },
  ): Promise<AgentCardCacheEntry> {
    const { config, apiClient } = this.requireInitialized();
    return this.cardCache.getAgentCardCached(apiClient, config, ns, name, opts);
  }
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
  setUserContext(userRef: string): void {
    this.apiClient?.setRequestContext({ userRef });
  }
  getConfig(): KagentiConfig {
    return this.requireInitialized().config;
  }
  getTokenManager(): KeycloakTokenManager {
    return this.requireInitialized().tokenManager;
  }
  async getAuthToken(): Promise<string> {
    return this.requireInitialized().tokenManager.getToken();
  }
  async hydrateSessionContext(
    bsId: string,
    ctxId: string,
    agentId?: string,
  ): Promise<void> {
    await this.kagentiSessionCache.set(bsId, ctxId);
    if (agentId) await this.sessionAgentCache.set(ctxId, agentId);
  }
  async getSessionContextId(bsId: string): Promise<string | undefined> {
    return this.kagentiSessionCache.get<string>(bsId);
  }
  async submitApproval(approval: ApprovalRequest): Promise<ApprovalResult> {
    const { config, apiClient } = this.requireInitialized();
    const agentId = await this.sessionAgentCache.get<string>(
      approval.responseId,
    );
    const { namespace, name } = agentId
      ? parseAgentId(agentId, config.namespace)
      : this.doResolveAgent({ messages: [] });
    return submitApprovalImpl(
      apiClient,
      namespace,
      name,
      approval,
      config.extensionBaseUrl,
    );
  }
  validateNamespace(namespace: string): void {
    validateNamespace(namespace, this.requireInitialized().config);
  }

  private doResolveAgent(request: AugmentChatRequest) {
    const { config } = this.requireInitialized();
    return resolveAgent(
      request,
      config,
      ns => this.validateNamespace(ns),
      id => parseAgentId(id, config.namespace),
    );
  }
}
