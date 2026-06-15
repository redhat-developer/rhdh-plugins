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
 * Common types, permissions, and constants for the boost plugin.
 *
 * @packageDocumentation
 */

/**
 * The plugin ID for the boost plugin.
 *
 * @public
 */
export const BOOST_PLUGIN_ID = 'boost';

// Shared types — provider abstraction, conversation, streaming
export type {
  // Provider abstraction
  AgenticProvider,
  ProviderDescriptor,
  ProviderCapabilities,
  ProviderConfigField,
  AgenticProviderStatus,
  ProviderStatus,
  // Chat
  ChatRequest,
  ChatResponse,
  ResponseUsage,
  // Conversation types
  ConversationSummary,
  ConversationDetails,
  InputItem,
  // Normalized streaming events (union + individual)
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
  StreamCitationReference,
  StreamCitationEvent,
  StreamCompletedEvent,
  StreamErrorEvent,
} from './types';

// Permissions — resource types, permission constants, rules, aggregations
export {
  // Resource types
  RESOURCE_TYPE_BOOST_AGENT,
  RESOURCE_TYPE_BOOST_TOOL,
  // Agent permissions (10)
  boostAgentListPermission,
  boostAgentRegisterPermission,
  boostAgentPromotePermission,
  boostAgentApprovePermission,
  boostAgentDemotePermission,
  boostAgentPublishPermission,
  boostAgentUnpublishPermission,
  boostAgentWithdrawPermission,
  boostAgentDeletePermission,
  boostAgentConfigurePermission,
  // Tool permissions (5)
  boostToolPromotePermission,
  boostToolApprovePermission,
  boostToolDemotePermission,
  boostToolPublishPermission,
  boostToolUnpublishPermission,
  // Kagenti infra (1)
  boostKagentiAdminPermission,
  // Functional permissions (5)
  boostChatReadPermission,
  boostChatCreatePermission,
  boostDocumentsManagePermission,
  boostMcpManagePermission,
  boostConfigManagePermission,
  // Conditional rule names
  BOOST_RULE_IS_OWNER,
  BOOST_RULE_IS_NOT_CREATOR,
  BOOST_RULE_HAS_LIFECYCLE_STAGE,
  // Aggregations
  boostResourcePermissions,
  boostFunctionalPermissions,
  boostPermissions,
} from './permissions';
