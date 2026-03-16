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
import {
  LoggerService,
  RootConfigService,
  DatabaseService,
} from '@backstage/backend-plugin-api';
import {
  ChatRequest,
  ChatResponse,
  AugmentStatus,
  MCPServerConfig,
  SecurityConfig,
} from '../../types';

import { ConfigLoader } from './ConfigLoader';
import { ClientManager } from './ClientManager';
import { ConfigResolutionService } from './ConfigResolutionService';
import { ResponsesApiService } from './ResponsesApiService';
import { ChatDepsBuilder } from './ChatDepsBuilder';
import { StatusService } from './StatusService';
import { aggregateStatus } from './StatusAggregator';
import { McpAuthService } from './McpAuthService';
import type { ConversationService } from './ConversationService';
import {
  VectorStoreFacade,
  VectorStoreFacadeContext,
} from './VectorStoreFacade';
import {
  ConversationFacade,
  ConversationFacadeContext,
} from './ConversationFacade';
import { initializeOrchestrator } from './OrchestratorInitializer';
import { AdkOrchestrator } from './adk-adapters/AdkOrchestrator';
import { AgentGraphManager } from './AgentGraphManager';
import { BackendApprovalStore } from './BackendApprovalStore';
import { BackendToolExecutor } from './BackendToolExecutor';
import { BackendApprovalHandler } from './BackendApprovalHandler';
import type { RuntimeConfigResolver } from '../../services/RuntimeConfigResolver';
import type { AdminConfigService } from '../../services/AdminConfigService';
import type { ToolScopeService } from '../../services/toolscope';
import { toErrorMessage } from '../../services/utils';
import { resolveCapabilities } from './ServerCapabilities';

/**
 * Responses API Coordinator
 *
 * Coordinates all sub-services to provide agentic chat via the Responses API
 * (OpenAI-compatible). Acts as the service coordinator between the provider
 * layer and individual domain services.
 */
export class ResponsesApiCoordinator {
  private readonly logger: LoggerService;
  private readonly database?: DatabaseService;
  private readonly adminConfig?: AdminConfigService;

  private configLoader: ConfigLoader;
  private chatService: ResponsesApiService;
  private statusService: StatusService;
  private clientManager: ClientManager;
  private readonly configResolution: ConfigResolutionService;
  private mcpAuth: McpAuthService | null = null;
  private conversations: ConversationService | null = null;

  private readonly vectorStoreFacade: VectorStoreFacade;
  private readonly conversationFacade: ConversationFacade;

  private mcpServers: MCPServerConfig[] = [];
  private securityConfig: SecurityConfig = { mode: 'plugin-only' };

  private readonly chatDepsBuilder: ChatDepsBuilder;
  private adkOrchestrator: AdkOrchestrator | null = null;
  private agentGraphManager: AgentGraphManager | null = null;
  private backendToolExecutor: BackendToolExecutor | null = null;
  private readonly backendApprovalStore = new BackendApprovalStore();
  private toolScopeService: ToolScopeService | null = null;

  private initialized = false;
  private vectorStoreReady = false;

  constructor(options: {
    logger: LoggerService;
    config: RootConfigService;
    database?: DatabaseService;
    adminConfig?: AdminConfigService;
  }) {
    this.logger = options.logger;
    this.database = options.database;
    this.adminConfig = options.adminConfig;

    this.configLoader = new ConfigLoader(options.config, options.logger);
    this.clientManager = new ClientManager(options.logger);
    this.chatService = new ResponsesApiService(options.logger);
    this.statusService = new StatusService();

    this.configResolution = new ConfigResolutionService(this.clientManager);
    this.configResolution.setSystemPrompt(this.configLoader.loadSystemPrompt());
    this.configResolution.setPostToolInstructions(
      this.configLoader.loadPostToolInstructions(),
    );

    this.chatDepsBuilder = new ChatDepsBuilder({
      logger: this.logger,
      configResolution: this.configResolution,
      clientManager: this.clientManager,
      getMcpAuth: () => this.mcpAuth,
      getConversations: () => this.conversations,
      getMcpServers: () => this.mcpServers,
      ensureInitialized: () => this.ensureInitialized(),
      getBackendToolExecutor: () => this.backendToolExecutor,
    });

    const vectorStoreContext: VectorStoreFacadeContext = {
      ensureInitialized: () => this.ensureInitialized(),
      configResolution: this.configResolution,
      getVectorStoreReady: () => this.vectorStoreReady,
      setVectorStoreReady: ready => {
        this.vectorStoreReady = ready;
      },
      getInitialized: () => this.initialized,
    };
    this.vectorStoreFacade = new VectorStoreFacade({
      vectorStore: null,
      docSync: null,
      logger: options.logger,
      context: vectorStoreContext,
    });

    const conversationContext: ConversationFacadeContext = {
      ensureInitialized: () => this.ensureInitialized(),
    };
    this.conversationFacade = new ConversationFacade({
      conversations: null,
      context: conversationContext,
      logger: options.logger,
    });
  }

  /**
   * Expose ClientManager so peer services (SafetyService, EvaluationService)
   * can obtain the current ResponsesApiClient without duplicating HTTP code.
   */
  getClientManager(): ClientManager {
    return this.clientManager;
  }

  /**
   * Expose the RuntimeConfigResolver so the provider layer can
   * push dynamic overrides to safety/evaluation services per-request.
   */
  getResolver(): RuntimeConfigResolver | null {
    return this.configResolution.getResolver();
  }

  /**
   * Expose the VectorStoreFacade so callers (ResponsesApiProvider) can
   * invoke document / vector-store operations directly.
   */
  getVectorStoreFacade(): VectorStoreFacade {
    return this.vectorStoreFacade;
  }

  /**
   * Expose the ConversationFacade so callers (ResponsesApiProvider) can
   * invoke conversation operations directly.
   */
  getConversationFacade(): ConversationFacade {
    return this.conversationFacade;
  }

  /**
   * Return the currently configured model identifier.
   * Prefers the last runtime-resolved model, falls back to static config.
   */
  getConfiguredModel(): string {
    return (
      this.configResolution.getLastResolvedModel() ??
      this.configResolution.getLlamaStackConfig()?.model ??
      'default'
    );
  }

  /**
   * Initialize the service by loading config and testing connection.
   * Delegates all wiring to initializeOrchestrator() and stores the result.
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      const state = await initializeOrchestrator({
        configLoader: this.configLoader,
        configResolution: this.configResolution,
        clientManager: this.clientManager,
        logger: this.logger,
        database: this.database,
        adminConfig: this.adminConfig,
        vectorStoreFacade: this.vectorStoreFacade,
        conversationFacade: this.conversationFacade,
      });

      const capOverrides = this.configLoader.loadServerCapabilities();
      this.chatService.setCapabilityProvider(() =>
        resolveCapabilities(
          this.clientManager.serverVersion,
          capOverrides,
          this.logger,
        ),
      );

      this.securityConfig = state.securityConfig;
      this.mcpAuth = state.mcpAuth;
      this.conversations = state.conversations;
      this.mcpServers = state.mcpServers;
      this.backendToolExecutor = state.backendToolExecutor;
      this.toolScopeService = state.toolScopeService;

      this.agentGraphManager = new AgentGraphManager(
        this.configResolution,
        this.configLoader,
        this.logger,
      );
      this.adkOrchestrator = new AdkOrchestrator({
        chatService: this.chatService,
        logger: this.logger,
        backendApprovalStore: this.backendApprovalStore,
        toolScopeService: this.toolScopeService,
      });
      this.initializeBackendApprovalHandler();

      this.initialized = true;
      this.logger.info(
        'Augment service initialization complete ' +
          '(vector store and document sync deferred to first use)',
      );
    } catch (error) {
      this.logger.error(
        `Failed to initialize Augment: ${toErrorMessage(error)}`,
      );
      throw error;
    }
  }

  /**
   * Ensures the service is initialized before use
   * @throws Error if the service has not been initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(
        'ResponsesApiCoordinator not initialized. Call initialize() first.',
      );
    }
  }

  /**
   * Post-initialization hook.
   *
   * Warms caches so the first user request is fast:
   * - Resolves config (populates RuntimeConfigResolver cache)
   * - Runs a status check (populates MCP tools cache and detects proxy conflicts)
   *
   * Uses Promise.allSettled so individual failures do not block startup.
   * Vector store creation and document sync are still deferred to first use.
   */
  async postInitialize(): Promise<void> {
    const warmupTasks: Array<{ name: string; task: Promise<unknown> }> = [];

    warmupTasks.push({
      name: 'config',
      task: this.configResolution.resolve(),
    });

    if (this.mcpServers.length > 0) {
      warmupTasks.push({
        name: 'mcp-status-warmup',
        task: this.getStatus(),
      });
    }

    const results = await Promise.allSettled(warmupTasks.map(w => w.task));

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'rejected') {
        this.logger.warn(
          `Warmup task "${
            warmupTasks[i].name
          }" failed (non-fatal): ${toErrorMessage(result.reason)}`,
        );
      }
    }

    this.logger.info('Post-initialization warmup complete');
  }

  // =============================================================================
  // Security Configuration
  // =============================================================================

  /**
   * Get the current security configuration
   * Used by router to determine access control behavior
   */
  getSecurityConfig(): SecurityConfig {
    return this.securityConfig;
  }

  // =============================================================================
  // Chat Methods
  // =============================================================================

  /**
   * Invalidate the runtime config cache and agent graph so the next
   * request picks up freshly-saved admin overrides immediately.
   */
  invalidateRuntimeConfig(): void {
    this.configResolution.invalidateCache();
    this.agentGraphManager?.invalidate();
    this.adkOrchestrator?.invalidateToolCache();
  }

  /**
   * Send a chat message. All requests go through the AdkOrchestrator,
   * which handles both single-agent (auto-synthesized) and multi-agent
   * (YAML-configured) scenarios through the same code path.
   *
   * The agent graph snapshot is resolved per-request from the effective
   * config (YAML + DB overrides), following the OpenAI SDK pattern where
   * the Runner receives agents at call time.
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const orchestrator = this.getAdkOrchestrator();
    const snapshot = await this.getAgentGraphManager().getSnapshot();
    const userQuery = this.chatDepsBuilder.extractUserQuery(request);

    return orchestrator.chat(
      request,
      snapshot,
      this.chatDepsBuilder.makeBuildDepsForAgent(userQuery),
    );
  }

  /**
   * Stream a chat message with real-time events.
   * Uses AdkOrchestrator.chatStream() for real per-token SSE
   * streaming (thinking, tool calls, handoffs, text deltas).
   */
  async chatStream(
    request: ChatRequest,
    onEvent: (event: string) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const orchestrator = this.getAdkOrchestrator();
    const snapshot = await this.getAgentGraphManager().getSnapshot();
    const userQuery = this.chatDepsBuilder.extractUserQuery(request);

    await orchestrator.chatStream(
      request,
      snapshot,
      onEvent,
      this.chatDepsBuilder.makeBuildDepsForAgent(userQuery),
      signal,
    );
  }

  private getAdkOrchestrator(): AdkOrchestrator {
    if (!this.adkOrchestrator) {
      throw new Error(
        'AdkOrchestrator not initialized. Call initialize() first.',
      );
    }
    return this.adkOrchestrator;
  }

  private getAgentGraphManager(): AgentGraphManager {
    if (!this.agentGraphManager) {
      throw new Error(
        'AgentGraphManager not initialized. Call initialize() first.',
      );
    }
    return this.agentGraphManager;
  }

  private initializeBackendApprovalHandler(): void {
    if (this.configLoader.loadToolExecutionMode() !== 'backend') return;
    if (!this.backendToolExecutor) return;

    const handler = new BackendApprovalHandler({
      conversationFacade: this.conversationFacade,
      backendApprovalStore: this.backendApprovalStore,
      backendToolExecutor: this.backendToolExecutor,
      chatService: this.chatService,
      clientManager: this.clientManager,
      configResolution: this.configResolution,
      getConversations: () => this.conversations,
      getAgentGraphManager: () => this.agentGraphManager,
      getMcpServers: () => this.mcpServers ?? [],
      logger: this.logger,
    });
    handler.initialize();
  }

  /**
   * Check if verbose stream logging is enabled
   */
  isVerboseStreamLoggingEnabled(): boolean {
    return this.configResolution.isVerboseStreamLoggingEnabled();
  }

  // =============================================================================
  // Status Methods — Delegated to StatusService
  // =============================================================================

  async getStatus(): Promise<AugmentStatus> {
    const llamaStackConfig = this.configResolution.getLlamaStackConfig();
    if (!llamaStackConfig) {
      return aggregateStatus({
        llamaStackConfig: null,
        clientManager: this.clientManager,
        mcpAuth: this.mcpAuth,
        mcpServers: this.mcpServers,
        yamlMcpServers: this.mcpServers,
        securityConfig: this.securityConfig,
        vectorStoreReady: this.vectorStoreReady,
        statusService: this.statusService,
        logger: this.logger,
      });
    }

    let resolved;
    try {
      this.ensureInitialized();
      resolved = await this.configResolution.resolve();
    } catch (error) {
      this.logger.debug(
        'Config resolution failed, using YAML fallback config',
        error instanceof Error ? error : undefined,
      );
      resolved = this.configResolution.buildYamlFallback();
    }

    return aggregateStatus({
      llamaStackConfig,
      resolved,
      clientManager: this.clientManager,
      mcpAuth: this.mcpAuth,
      mcpServers: resolved.mcpServers ?? this.mcpServers,
      yamlMcpServers: this.mcpServers,
      securityConfig: this.securityConfig,
      vectorStoreReady: this.vectorStoreReady,
      statusService: this.statusService,
      logger: this.logger,
      toolExecutionMode: this.configLoader.loadToolExecutionMode(),
      agentGraphError: this.agentGraphManager?.getLastResolutionError(),
    });
  }
}
