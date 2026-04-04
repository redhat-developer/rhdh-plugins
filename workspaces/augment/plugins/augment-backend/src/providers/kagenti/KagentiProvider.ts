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
import type {
  ProcessedMessage,
} from '../responses-api/conversations/conversationTypes';
import type {
  FeatureFlagsResponse,
  AgentCardResponse,
  ContextHistoryItem,
} from './client/types';
import { loadKagentiConfig } from './config/KagentiConfigLoader';
import type { KagentiConfig } from './config/KagentiConfigLoader';
import { KeycloakTokenManager } from './client/KeycloakTokenManager';
import { KagentiApiClient } from './client/KagentiApiClient';
import { KagentiSandboxClient } from './client/KagentiSandboxClient';
import { KagentiAdminClient } from './client/KagentiAdminClient';
import { KagentiStreamNormalizer } from './stream/KagentiStreamNormalizer';
import { handleAgentCard } from '@kagenti/adk/core';
import { agentCardSchema } from '@kagenti/adk';

interface AgentCardCacheEntry {
  card: AgentCardResponse;
  demands: ReturnType<typeof handleAgentCard>['demands'];
  resolveMetadata: ReturnType<typeof handleAgentCard>['resolveMetadata'];
  fetchedAt: number;
}

const AGENT_CARD_CACHE_TTL_MS = 5 * 60 * 1000;

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

  private readonly agentCardCache = new Map<string, AgentCardCacheEntry>();
  private readonly sessionAgentMap = new Map<string, string>();
  private readonly kagentiSessionMap = new Map<string, string>();

  readonly conversations: ConversationCapability;
  readonly rag = undefined;
  readonly safety = undefined;
  readonly evaluation = undefined;

  constructor(options: KagentiProviderOptions) {
    this.logger = options.logger.child({ label: 'kagenti-provider' });
    this.rootConfig = options.config;

    const notSupported = (method: string) => () => {
      throw new Error(`${method} is not supported by the Kagenti provider`);
    };

    this.conversations = {
      getProcessedMessages: async (
        contextId: string,
      ): Promise<ProcessedMessage[]> => {
        const { apiClient } = this.requireInitialized();
        try {
          const allItems: ContextHistoryItem[] = [];
          let pageToken: string | undefined;
          do {
            const page = await apiClient.listContextHistory(contextId, {
              limit: 100,
              pageToken,
            });
            allItems.push(...page.items);
            pageToken = page.has_more && page.next_page_token
              ? page.next_page_token
              : undefined;
          } while (pageToken);

          return this.convertHistoryToProcessedMessages(allItems);
        } catch (err) {
          this.logger.warn(
            `Failed to fetch context history for ${contextId}: ${err}`,
          );
          return [];
        }
      },
      submitApproval: notSupported('submitApproval') as ConversationCapability['submitApproval'],
      create: notSupported('create') as ConversationCapability['create'],
      list: notSupported('list') as ConversationCapability['list'],
      get: notSupported('get') as ConversationCapability['get'],
      getInputs: notSupported('getInputs') as ConversationCapability['getInputs'],
      getByResponseChain: notSupported('getByResponseChain') as ConversationCapability['getByResponseChain'],
      delete: notSupported('delete') as ConversationCapability['delete'],
    };
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

    if (this.kagentiConfig.showAllNamespaces && !this.kagentiConfig.namespaces?.length) {
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
      `Kagenti features: sandbox=${this.featureFlags.sandbox}, integrations=${this.featureFlags.integrations}, triggers=${this.featureFlags.triggers}` +
        (overrides.sandbox !== undefined || overrides.integrations !== undefined || overrides.triggers !== undefined
          ? ' (with local overrides applied)'
          : ''),
    );

    if (this.featureFlags.sandbox) {
      this.sandboxClient = new KagentiSandboxClient(this.apiClient);
      this.adminClient = new KagentiAdminClient(this.apiClient);
      this.logger.info('Sandbox and admin clients initialized');
    }

    if (this.featureFlags.integrations || this.featureFlags.triggers) {
      if (!this.adminClient) {
        this.adminClient = new KagentiAdminClient(this.apiClient);
      }
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

  async chat(request: AugmentChatRequest): Promise<AugmentChatResponse> {
    const { apiClient } = this.requireInitialized();
    const { namespace, name } = this.resolveAgent(request);
    const userMessage = this.extractLastUserMessage(request);

    const backstageSessionId = request.sessionId;
    const storedSessionId = backstageSessionId
      ? this.kagentiSessionMap.get(backstageSessionId)
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
      this.kagentiSessionMap.set(backstageSessionId, response.session_id);
      this.sessionAgentMap.set(
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
      ? this.kagentiSessionMap.get(backstageSessionId)
      : undefined;

    const a2aMetadata = await this.buildA2AMetadata(namespace, name);
    const mergedMetadata = {
      ...a2aMetadata,
      ...(storedContextId ? { contextId: storedContextId } : {}),
    };

    try {
      await apiClient.chatStream(
        namespace,
        name,
        userMessage,
        storedContextId,
        (line: string) => {
          const events = normalizer.normalize(line);
          for (const event of events) {
            if (
              event.type === 'stream.started' &&
              backstageSessionId
            ) {
              const ctxId = (event as { responseId?: string }).responseId;
              if (ctxId) {
                this.kagentiSessionMap.set(backstageSessionId, ctxId);
                this.sessionAgentMap.set(ctxId, agentId);
              }
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
  }

  async listModels(): Promise<
    Array<{
      id: string;
      owned_by?: string;
      model_type?: string;
      securityDemands?: Record<string, boolean>;
    }>
  > {
    const { config, apiClient } = this.requireInitialized();

    if (config.agents?.length) {
      return config.agents.map(id => ({
        id,
        owned_by: 'kagenti',
        model_type: 'a2a-agent',
      }));
    }

    try {
      const namespaceResp = await apiClient.listNamespaces();
      let visibleNamespaces = namespaceResp.namespaces;

      if (config.namespaces?.length) {
        const allowSet = new Set(config.namespaces);
        visibleNamespaces = visibleNamespaces.filter(ns => allowSet.has(ns));
      } else if (!config.showAllNamespaces) {
        visibleNamespaces = [config.namespace];
      }

      const allAgents: Array<{
        id: string;
        owned_by?: string;
        model_type?: string;
        securityDemands?: Record<string, boolean>;
      }> = [];

      for (const ns of visibleNamespaces) {
        try {
          const agents = await apiClient.listAgents(ns);
          for (const agent of agents.items) {
            let securityDemands: Record<string, boolean> | undefined;
            try {
              const cached = await this.getAgentCardCached(agent.namespace, agent.name);
              const d = cached.demands;
              if (d.oauthDemands || d.secretDemands) {
                securityDemands = {
                  requiresOAuth: !!d.oauthDemands,
                  requiresSecrets: !!d.secretDemands,
                };
              }
            } catch { /* agent card not available */ }
            allAgents.push({
              id: `${agent.namespace}/${agent.name}`,
              owned_by: 'kagenti',
              model_type: 'a2a-agent',
              ...(securityDemands && { securityDemands }),
            });
          }
        } catch (nsErr) {
          this.logger.warn(
            `Failed to list agents in namespace ${ns}: ${nsErr instanceof Error ? nsErr.message : nsErr}`,
          );
        }
      }

      return allAgents;
    } catch (err) {
      this.logger.warn(
        `Failed to list namespaces, falling back to default namespace: ${err instanceof Error ? err.message : err}`,
      );
      const agents = await apiClient.listAgents(config.namespace);
      return agents.items.map(a => ({
        id: `${a.namespace}/${a.name}`,
        owned_by: 'kagenti',
        model_type: 'a2a-agent',
      }));
    }
  }

  async testModel(model?: string): Promise<{
    connected: boolean;
    modelFound: boolean;
    canGenerate: boolean;
    error?: string;
  }> {
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
    this.agentCardCache.clear();
    this.logger.info('Kagenti provider shut down');
  }

  // -- Context History Conversion ---------------------------------------------

  private convertHistoryToProcessedMessages(
    items: ContextHistoryItem[],
  ): ProcessedMessage[] {
    const messages: ProcessedMessage[] = [];
    for (const item of items) {
      if (item.kind === 'artifact') {
        const art = item.data as { parts?: Array<{ text?: string; [k: string]: unknown }> };
        const textParts = (art.parts ?? [])
          .filter(p => typeof p.text === 'string')
          .map(p => p.text as string);
        const text = textParts.join('');
        if (text) {
          messages.push({ role: 'assistant', text, createdAt: item.created_at });
        }
        continue;
      }
      if (item.kind !== 'message') continue;
      const msg = item.data as { role?: string; parts?: Array<{ text?: string; [k: string]: unknown }> };
      if (!msg.role || !msg.parts) continue;

      let role: 'user' | 'assistant' | 'system' = 'assistant';
      if (msg.role === 'user') role = 'user';
      else if (msg.role === 'system') role = 'system';

      const textParts = msg.parts
        .filter(p => typeof p.text === 'string')
        .map(p => p.text as string);
      const text = textParts.join('');
      if (!text) continue;

      messages.push({
        role,
        text,
        createdAt: item.created_at,
      });
    }
    return messages;
  }

  // -- Agent Card Cache -------------------------------------------------------

  async getAgentCardCached(
    namespace: string,
    name: string,
  ): Promise<AgentCardCacheEntry> {
    const { config, apiClient } = this.requireInitialized();
    const key = `${namespace}/${name}`;
    const cached = this.agentCardCache.get(key);

    if (cached && Date.now() - cached.fetchedAt < AGENT_CARD_CACHE_TTL_MS) {
      return cached;
    }

    const card = await apiClient.getAgentCard(namespace, name);

    if (config.validateResponses) {
      const result = agentCardSchema.safeParse(card);
      if (!result.success) {
        this.logger.warn(
          `Agent card validation warning for ${key}: ${JSON.stringify(result.error.issues)}`,
        );
      }
    }

    let demands: AgentCardCacheEntry['demands'] = {
      llmDemands: null,
      embeddingDemands: null,
      mcpDemands: null,
      oauthDemands: null,
      secretDemands: null,
      formDemands: null,
    };
    let resolveMetadata: AgentCardCacheEntry['resolveMetadata'] =
      async () => ({});

    try {
      if (card.capabilities?.extensions?.length) {
        const adkResult = handleAgentCard(
          card as Parameters<typeof handleAgentCard>[0],
        );
        demands = adkResult.demands;
        resolveMetadata = adkResult.resolveMetadata;
        this.logger.debug(
          `Agent card demands for ${key}: llm=${!!demands.llmDemands}, mcp=${!!demands.mcpDemands}, oauth=${!!demands.oauthDemands}, secrets=${!!demands.secretDemands}`,
        );
      }
    } catch (err) {
      this.logger.warn(`Failed to parse agent card demands for ${key}: ${err}`);
    }

    const entry: AgentCardCacheEntry = {
      card,
      demands,
      resolveMetadata,
      fetchedAt: Date.now(),
    };
    this.agentCardCache.set(key, entry);
    return entry;
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

  /**
   * Pre-populate the in-memory session map so chatStream can resume a
   * Kagenti conversation that was persisted in the DB across restarts.
   */
  hydrateSessionContext(backstageSessionId: string, contextId: string, agentId?: string): void {
    this.kagentiSessionMap.set(backstageSessionId, contextId);
    if (agentId) {
      this.sessionAgentMap.set(contextId, agentId);
    }
  }

  /** Return the Kagenti context ID associated with a Backstage session. */
  getSessionContextId(backstageSessionId: string): string | undefined {
    return this.kagentiSessionMap.get(backstageSessionId);
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
  async submitApproval(approval: {
    responseId: string;
    callId: string;
    approved: boolean;
    toolName?: string;
    toolArguments?: string;
    reason?: string;
  }): Promise<{
    content: string;
    responseId: string;
    toolExecuted: boolean;
    toolOutput?: string;
    pendingApproval?: {
      approvalRequestId: string;
      toolName: string;
      serverLabel?: string;
      arguments?: string;
    };
    handoff?: { fromAgent: string; toAgent: string };
  }> {
    const { apiClient } = this.requireInitialized();
    const contextId = approval.responseId;

    const agentId = this.sessionAgentMap.get(contextId);
    const { namespace, name } = agentId
      ? this.parseAgentId(agentId)
      : this.resolveAgent({ messages: [] });

    const approvalMessage = approval.approved
      ? `Approved: ${approval.toolName ?? 'tool call'}`
      : `Rejected: ${approval.toolName ?? 'tool call'}`;

    const normalizer = new KagentiStreamNormalizer();
    let content = '';
    let pendingApproval:
      | {
          approvalRequestId: string;
          toolName: string;
          serverLabel?: string;
          arguments?: string;
        }
      | undefined;
    let handoff: { fromAgent: string; toAgent: string } | undefined;
    let toolExecuted = false;
    let toolOutput: string | undefined;

    const SECRETS_URI = 'https://a2a-extensions.adk.kagenti.dev/auth/secrets/v1';
    const OAUTH_URI = 'https://a2a-extensions.adk.kagenti.dev/auth/oauth/v1';

    let metadata: Record<string, unknown>;

    if (approval.toolName === 'secrets_response' && approval.toolArguments) {
      let secretValues: Record<string, string>;
      try {
        secretValues = JSON.parse(approval.toolArguments) as Record<string, string>;
      } catch {
        throw new Error('Invalid JSON in secrets toolArguments');
      }
      const fulfillments: Record<string, { secret: string }> = {};
      for (const [key, value] of Object.entries(secretValues)) {
        fulfillments[key] = { secret: value };
      }
      metadata = { [SECRETS_URI]: { secret_fulfillments: fulfillments } };
    } else if (approval.toolName === 'oauth_confirm') {
      metadata = { [OAUTH_URI]: { data: { redirect_uri: 'confirmed' } } };
    } else {
      let parsedArgs: unknown;
      if (approval.toolArguments) {
        try {
          parsedArgs = JSON.parse(approval.toolArguments);
        } catch {
          throw new Error('Invalid JSON in approval toolArguments');
        }
      }
      metadata = {
        approval: {
          callId: approval.callId,
          approved: approval.approved,
          toolName: approval.toolName,
          ...(approval.reason && { reason: approval.reason }),
          toolArguments: parsedArgs,
        },
      };
    }

    await apiClient.chatStream(
      namespace,
      name,
      approvalMessage,
      undefined,
      (line: string) => {
        const events = normalizer.normalize(line);
        for (const event of events) {
          if (event.type === 'stream.text.delta') {
            content += event.delta;
          } else if (event.type === 'stream.tool.completed') {
            toolExecuted = true;
            toolOutput = (event as { output?: string }).output;
          } else if (event.type === 'stream.tool.approval') {
            pendingApproval = {
              approvalRequestId: event.callId,
              toolName: event.name,
              arguments: event.arguments,
            };
          } else if (event.type === 'stream.agent.handoff') {
            const he = event as { fromAgent?: string; toAgent?: string };
            handoff = {
              fromAgent: he.fromAgent ?? 'unknown',
              toAgent: he.toAgent ?? 'unknown',
            };
          }
        }
      },
      undefined,
      { contextId, metadata },
    );

    return {
      content,
      responseId: contextId,
      toolExecuted,
      toolOutput,
      pendingApproval,
      handoff,
    };
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
