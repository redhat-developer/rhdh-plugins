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
  SyncResult,
  ChatAgent,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type {
  ChatRequest,
  ChatResponse,
  DocumentInfo,
  VectorStoreInfo,
  ProviderStatus,
  VectorStoreStatus,
  MCPServerStatus,
  SecurityMode,
  RAGSource,
} from '../types';

// Re-export types that consumers of the provider interface need
export type {
  SyncResult,
  ChatRequest,
  ChatResponse,
  DocumentInfo,
  VectorStoreInfo,
  ProviderStatus,
  VectorStoreStatus,
  MCPServerStatus,
  SecurityMode,
  RAGSource,
  ChatAgent,
};
export type { EvaluationResult } from '../types';

// Canonical conversation types — re-exported from the LlamaStack provider
export type {
  ConversationSummary,
  ConversationListResult,
  ConversationDetails,
  InputItem,
  InputItemsResult,
  ConversationItem,
  ConversationItemsResult,
  ProcessedToolCall,
  ProcessedRagSource,
  ProcessedMessage,
  ToolApproval,
  ApprovalResult,
} from './llamastack/conversationTypes';

// Re-export normalized streaming types from common
export type {
  NormalizedStreamEvent,
  StreamStartedEvent,
  StreamTextDeltaEvent,
  StreamTextDoneEvent,
  StreamReasoningDeltaEvent,
  StreamReasoningDoneEvent,
  StreamToolDiscoveryEvent,
  StreamToolStartedEvent,
  StreamToolDeltaEvent,
  StreamToolCompletedEvent,
  StreamToolFailedEvent,
  StreamToolApprovalEvent,
  StreamRagResultsEvent,
  StreamAgentHandoffEvent,
  StreamFormRequestEvent,
  StreamFormField,
  StreamFormDescriptor,
  StreamAuthRequiredEvent,
  StreamSecretDemand,
  StreamArtifactEvent,
  StreamCitationEvent,
  StreamCitationReference,
  StreamCompletedEvent,
  StreamErrorEvent,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';

export type {
  ConversationCapability,
  RAGCapability,
  SafetyCapability,
  EvaluationCapability,
  AgenticProviderStatus,
  SafetyStatus,
  SafetyCheckResult,
  EvalStatus,
} from './capabilityTypes';

export type { AgenticProvider } from './providerInterface';
