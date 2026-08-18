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
import { coordinatorChat, coordinatorChatStream } from './CoordinatorChatOps';
import type { ChatOpsContext } from './CoordinatorChatOps';
import {
  getCoordinatorStatus,
  postInitialize as doPostInitialize,
  initializeBackendApprovalHandler as doInitApprovalHandler,
} from './CoordinatorLifecycleOps';
import { ResponsesApiService } from './ResponsesApiService';
import { ChatDepsBuilder } from './ChatDepsBuilder';
import { StatusService } from './StatusService';
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
import { OpenAIAgentsOrchestrator } from './openai-agents-adapters/OpenAIAgentsOrchestrator';
import { AgentGraphManager } from './AgentGraphManager';
import { BackendApprovalStore } from './BackendApprovalStore';
import { BackendToolExecutor } from './BackendToolExecutor';
import type { RuntimeConfigResolver } from '../../services/RuntimeConfigResolver';
import type { AdminConfigService } from '../../services/AdminConfigService';
import type { ToolScopeService } from '../../services/toolscope';
import { toErrorMessage } from '../../services/utils';
import { resolveCapabilities } from './ServerCapabilities';

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
  private orchestrator: OpenAIAgentsOrchestrator | null = null;
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

  getClientManager(): ClientManager {
    return this.clientManager;
  }
  getResolver(): RuntimeConfigResolver | null {
    return this.configResolution.getResolver();
  }
  getVectorStoreFacade(): VectorStoreFacade {
    return this.vectorStoreFacade;
  }
  getConversationFacade(): ConversationFacade {
    return this.conversationFacade;
  }
  getConfiguredModel(): string {
    return (
      this.configResolution.getLastResolvedModel() ??
      this.configResolution.getLlamaStackConfig()?.model ??
      'default'
    );
  }

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
      this.orchestrator = new OpenAIAgentsOrchestrator({
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

  private ensureInitialized(): void {
    if (!this.initialized)
      throw new Error('ResponsesApiCoordinator not initialized');
  }

  async postInitialize(): Promise<void> {
    return doPostInitialize({
      configResolution: this.configResolution,
      mcpServers: this.mcpServers,
      orchestrator: this.orchestrator,
      chatDepsBuilder: this.chatDepsBuilder,
      logger: this.logger,
      getStatus: () => this.getStatus(),
    });
  }

  getSecurityConfig(): SecurityConfig {
    return this.securityConfig;
  }

  invalidateRuntimeConfig(): void {
    this.configResolution.invalidateCache();
    this.agentGraphManager?.invalidate();
    this.orchestrator?.invalidateToolCache();

    if (this.orchestrator && this.mcpServers.length > 0) {
      this.chatDepsBuilder
        .buildChatDeps()
        .then(deps => this.orchestrator!.warmUpToolCache(deps))
        .catch(err =>
          this.logger.warn(
            `Background tool re-warm after config invalidation failed: ${toErrorMessage(err)}`,
          ),
        );
    }
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    return coordinatorChat(this.buildChatOpsContext(), request);
  }

  async chatStream(
    request: ChatRequest,
    onEvent: (event: string) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    return coordinatorChatStream(
      this.buildChatOpsContext(),
      request,
      onEvent,
      signal,
    );
  }

  private buildChatOpsContext(): ChatOpsContext {
    return {
      logger: this.logger,
      chatService: this.chatService,
      chatDepsBuilder: this.chatDepsBuilder,
      getOrchestrator: () => this.getOrchestrator(),
      requireAgentGraphManager: () => this.requireAgentGraphManager(),
      ensureInitialized: () => this.ensureInitialized(),
    };
  }

  private getOrchestrator(): OpenAIAgentsOrchestrator {
    if (!this.orchestrator)
      throw new Error('OpenAIAgentsOrchestrator not initialized');
    return this.orchestrator;
  }

  getAgentGraphManager(): AgentGraphManager | null {
    return this.agentGraphManager;
  }

  private requireAgentGraphManager(): AgentGraphManager {
    if (!this.agentGraphManager)
      throw new Error('AgentGraphManager not initialized');
    return this.agentGraphManager;
  }

  private initializeBackendApprovalHandler(): void {
    if (this.configLoader.loadToolExecutionMode() !== 'backend') return;
    if (!this.backendToolExecutor) return;
    doInitApprovalHandler({
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
  }

  isVerboseStreamLoggingEnabled(): boolean {
    return this.configResolution.isVerboseStreamLoggingEnabled();
  }

  async getStatus(): Promise<AugmentStatus> {
    return getCoordinatorStatus({
      configResolution: this.configResolution,
      clientManager: this.clientManager,
      configLoader: this.configLoader,
      mcpAuth: this.mcpAuth,
      mcpServers: this.mcpServers,
      securityConfig: this.securityConfig,
      vectorStoreReady: this.vectorStoreReady,
      statusService: this.statusService,
      agentGraphManager: this.agentGraphManager,
      logger: this.logger,
      ensureInitialized: () => this.ensureInitialized(),
    });
  }

  async shutdown(): Promise<void> {
    if (this.backendToolExecutor) {
      this.logger.info(
        '[ResponsesApiCoordinator] Shutting down — closing MCP clients',
      );
      await this.backendToolExecutor.closeAllClients();
    }
  }
}
