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

// ---------------------------------------------------------------------------
// Provider implementation
// ---------------------------------------------------------------------------

export { ResponsesApiProvider } from './ResponsesApiProvider';
export { ResponsesApiProvider as LlamaStackProvider } from './ResponsesApiProvider';

export { ResponsesApiCoordinator } from './ResponsesApiCoordinator';
export { ResponsesApiCoordinator as LlamaStackOrchestrator } from './ResponsesApiCoordinator';

// ---------------------------------------------------------------------------
// LlamaStack platform services (config, safety, status, auth)
// ---------------------------------------------------------------------------

export { ConfigLoader } from './config/ConfigLoader';
export { ConfigResolutionService } from './config/ConfigResolutionService';
export {
  getApiApprovalConfig,
  loadMcpAuthConfigs,
  loadMcpServerConfigs,
} from './config/McpConfigLoader';
export { loadBrandingOverrides } from './config/BrandingConfigLoader';
export {
  resolveCapabilities,
  parseVersion,
  isToolCompatibilityError,
  type ServerCapabilities,
  type ServerCapabilityOverrides,
} from './config/ServerCapabilities';

export { SafetyService } from './safety/SafetyService';
export { EvaluationService } from './safety/EvaluationService';

export { StatusService } from './status/StatusService';
export { aggregateStatus } from './status/StatusAggregator';

export { McpAuthService } from './auth/McpAuthService';

// ---------------------------------------------------------------------------
// Provider wiring (root-level)
// ---------------------------------------------------------------------------

export { ClientManager } from './ClientManager';
export { ChatDepsBuilder } from './ChatDepsBuilder';
export { AgentGraphManager } from './AgentGraphManager';
export { BackendApprovalHandler } from './BackendApprovalHandler';
export {
  buildConversationsCapability,
  buildRagCapability,
  buildSafetyCapability,
  buildEvaluationCapability,
} from './CapabilityBuilders';
export {
  type OrchestratorInitDeps,
  type OrchestratorState,
  initializeOrchestrator,
} from './OrchestratorInitializer';
export {
  VectorStoreFacade,
  type VectorStoreFacadeContext,
} from './VectorStoreFacade';

// ---------------------------------------------------------------------------
// Re-exports from responses-api toolkit (backward compatibility)
// ---------------------------------------------------------------------------

export { normalizeLlamaStackEvent } from '../responses-api/stream/StreamEventNormalizer';
export {
  ResponsesApiClient,
  ResponsesApiError,
  LlamaStackApiError,
} from '../responses-api/client/ResponsesApiClient';
export {
  ResponsesApiService,
  type ChatDeps,
} from '../responses-api/chat/ResponsesApiService';
export { ConversationService } from '../responses-api/conversations/ConversationService';
export {
  ConversationFacade,
  type ConversationFacadeContext,
} from '../responses-api/conversations/ConversationFacade';
export type {
  ConversationDetails,
  ApprovalResult,
  ConversationClientAccessor,
} from '../responses-api/conversations/conversationTypes';
export { VectorStoreService } from '../responses-api/documents/VectorStoreService';
export { DocumentSyncService } from '../responses-api/documents/DocumentSyncService';
export {
  resolveAgentGraph,
  type ResolvedAgent,
  type AgentGraphSnapshot,
  type BuildDepsForAgent,
  toFunctionToolName,
} from '../responses-api/agents/agentGraph';
export {
  buildTools,
  sanitizeToolsForServer,
  type ToolsBuilderDeps,
} from '../responses-api/tools/ToolsBuilder';
export { BackendToolExecutor } from '../responses-api/tools/BackendToolExecutor';
export { BackendApprovalStore } from '../responses-api/tools/BackendApprovalStore';
