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
  DatabaseService,
} from '@backstage/backend-plugin-api';
import type {
  MCPServerConfig,
  DocumentsConfig,
  SecurityConfig,
} from '../../types';
import type { ConfigLoader } from './ConfigLoader';
import type { ConfigResolutionService } from './ConfigResolutionService';
import type { ClientManager } from './ClientManager';
import { McpAuthService } from './McpAuthService';
import { BackendToolExecutor } from './BackendToolExecutor';
import { VectorStoreService } from './VectorStoreService';
import { DocumentSyncService } from './DocumentSyncService';
import { ConversationService } from './ConversationService';
import type { ConversationClientAccessor } from './conversationTypes';
import type { VectorStoreFacade } from './VectorStoreFacade';
import type { ConversationFacade } from './ConversationFacade';
import { DocumentIngestionService } from '../../services/DocumentIngestionService';
import { RuntimeConfigResolver } from '../../services/RuntimeConfigResolver';
import type { AdminConfigService } from '../../services/AdminConfigService';
import {
  createToolScopeService,
  type ToolScopeService,
} from '../../services/toolscope';

export interface OrchestratorInitDeps {
  configLoader: ConfigLoader;
  configResolution: ConfigResolutionService;
  clientManager: ClientManager;
  logger: LoggerService;
  database?: DatabaseService;
  adminConfig?: AdminConfigService;
  vectorStoreFacade: VectorStoreFacade;
  conversationFacade: ConversationFacade;
}

export interface OrchestratorState {
  securityConfig: SecurityConfig;
  ingestionService: DocumentIngestionService;
  mcpAuth: McpAuthService;
  vectorStore: VectorStoreService;
  docSync: DocumentSyncService;
  documentsConfig: DocumentsConfig | null;
  conversations: ConversationService;
  mcpServers: MCPServerConfig[];
  toolScopeService: ToolScopeService;
  backendToolExecutor: BackendToolExecutor | null;
}

/**
 * Runs all initialization steps in order and returns the assembled state.
 * The orchestrator calls this from initialize() and stores the result.
 *
 * Steps execute sequentially because later steps depend on earlier ones
 * (e.g. clientAndAuth must run before vectorStore/conversations).
 */
export async function initializeOrchestrator(
  deps: OrchestratorInitDeps,
): Promise<OrchestratorState> {
  const { configLoader, configResolution, clientManager, logger } = deps;

  configLoader.validateRequiredConfig();

  const securityConfig = configLoader.loadSecurityConfig();
  logger.info(`Augment security mode: ${securityConfig.mode}`);

  const llamaStackConfig = configLoader.loadLlamaStackConfig();
  configResolution.setLlamaStackConfig(llamaStackConfig);
  logger.info(
    `Augment configured with Llama Stack at ${llamaStackConfig.baseUrl}`,
  );

  const ingestionService = new DocumentIngestionService({
    logger,
    skipTlsVerify: llamaStackConfig.skipTlsVerify,
  });

  // Runtime config resolver (DB admin overrides)
  if (deps.adminConfig) {
    const resolver = new RuntimeConfigResolver({
      configLoader,
      adminConfig: deps.adminConfig,
      logger,
    });
    configResolution.setResolver(resolver);

    try {
      const initial = await resolver.resolve();
      configResolution.setLastResolvedModel(initial.model);
      configResolution.setLastResolvedVerboseLogging(
        initial.verboseStreamLogging,
      );
    } catch (error) {
      logger.debug(
        'Config resolution failed during model test, using last resolved model',
        error as Error,
      );
      configResolution.setLastResolvedModel(llamaStackConfig.model);
      configResolution.setLastResolvedVerboseLogging(
        llamaStackConfig.verboseStreamLogging ?? false,
      );
    }
  }

  // Client & server version probe
  const client = clientManager.getClient(llamaStackConfig);
  await clientManager.probeServerVersion(client);

  const mcpAuthConfigs = configLoader.loadMcpAuthConfigs();
  const mcpAuth = new McpAuthService(
    securityConfig,
    mcpAuthConfigs,
    logger,
    llamaStackConfig.skipTlsVerify,
  );
  if (mcpAuthConfigs.size > 0) {
    logger.info(
      `Augment loaded ${mcpAuthConfigs.size} named MCP auth config(s): ${[
        ...mcpAuthConfigs.keys(),
      ].join(', ')}`,
    );
  }

  // Vector store & documents
  const vectorStore = new VectorStoreService(client, llamaStackConfig, logger);

  const documentsConfig = configLoader.loadDocumentsConfig();
  if (documentsConfig && documentsConfig.sources.length > 0) {
    logger.info(
      `Augment loaded ${documentsConfig.sources.length} document source(s)`,
    );
  }

  const docSync = new DocumentSyncService(
    vectorStore,
    ingestionService,
    documentsConfig,
    logger,
    deps.database,
  );
  await docSync.initialize();
  deps.vectorStoreFacade.setServices(vectorStore, docSync);

  // Conversations
  const mcpServers = configLoader.loadMcpServerConfigs();
  if (mcpServers.length > 0) {
    logger.info(
      `Augment loaded ${mcpServers.length} MCP server(s): ${mcpServers
        .map(s => s.name)
        .join(', ')}`,
    );
  }

  const clientAccessor: ConversationClientAccessor = {
    getClient: () => clientManager.getExistingClient(),
    getModel: () =>
      configResolution.getLastResolvedModel() ?? llamaStackConfig.model,
  };
  const conversations = new ConversationService(
    clientAccessor,
    mcpAuth,
    mcpServers,
    logger,
    deps.database,
  );
  conversations.setSafetyContextProvider(() => {
    const resolver = configResolution.getResolver();
    const cached = resolver?.getCachedConfig?.();
    const lsCfg = configResolution.getLlamaStackConfig();
    return {
      guardrails: cached?.guardrails ?? undefined,
      safetyIdentifier: cached?.safetyIdentifier ?? lsCfg?.safetyIdentifier,
      reasoning: cached?.reasoning ?? lsCfg?.reasoning,
    };
  });
  await conversations.initializeDatabase();
  deps.conversationFacade.setConversations(conversations);

  // Tool scoping
  const toolScopeService = createToolScopeService(logger);

  // Backend tool executor (singleton for 'backend' execution mode)
  const toolExecutionMode = configLoader.loadToolExecutionMode();
  logger.info(
    `[Init] toolExecutionMode resolved to '${toolExecutionMode}' ` +
      `(mcpServers=${mcpServers.length}: [${mcpServers.map(s => `${s.id}@${s.url}`).join(', ')}])`,
  );
  let backendToolExecutor: BackendToolExecutor | null = null;
  if (toolExecutionMode === 'backend') {
    backendToolExecutor = new BackendToolExecutor(
      mcpAuth,
      logger,
      llamaStackConfig.skipTlsVerify ?? false,
    );
    logger.info(
      `[Init] BackendToolExecutor singleton created (skipTlsVerify=${llamaStackConfig.skipTlsVerify ?? false})`,
    );
  } else {
    logger.info(
      `[Init] BackendToolExecutor NOT created — toolExecutionMode='${toolExecutionMode}' (set augment.toolExecutionMode: backend to enable)`,
    );
  }

  return {
    securityConfig,
    ingestionService,
    mcpAuth,
    vectorStore,
    docSync,
    documentsConfig,
    conversations,
    mcpServers,
    toolScopeService,
    backendToolExecutor,
  };
}
