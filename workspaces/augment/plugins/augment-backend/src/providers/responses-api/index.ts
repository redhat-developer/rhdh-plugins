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

export type {
  ResponsesApiClientConfig,
  McpAuthProvider,
  ClientProvider,
  ConfigProvider,
  EffectiveConfigSnapshot,
  CapabilityInfo,
} from './types';

export {
  ResponsesApiClient,
  ResponsesApiError,
  type ResponsesApiRequestOptions,
} from './client/ResponsesApiClient';

export {
  normalizeLlamaStackEvent,
  LS_EVENT,
} from './stream/StreamEventNormalizer';
export { hasResponse, hasItem, hasPart, hasError } from './stream/eventTypes';

export { ResponsesApiService, type ChatDeps } from './chat/ResponsesApiService';
export { requireLastUserMessage } from './chat/chatUtils';

export {
  resolveAgentGraph,
  type ResolvedAgent,
  type AgentGraphSnapshot,
  type BuildDepsForAgent,
  toFunctionToolName,
} from './agents/agentGraph';

export {
  buildTools,
  sanitizeToolsForServer,
  type ToolsBuilderDeps,
} from './tools/ToolsBuilder';
export { BackendToolExecutor } from './tools/BackendToolExecutor';
export { BackendApprovalStore } from './tools/BackendApprovalStore';

export { ConversationService } from './conversations/ConversationService';
export {
  ConversationFacade,
  type ConversationFacadeContext,
} from './conversations/ConversationFacade';

export { VectorStoreService } from './documents/VectorStoreService';
export { DocumentSyncService } from './documents/DocumentSyncService';
