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
 * Augment Backend Plugin
 *
 * @packageDocumentation
 */

export { augmentPlugin as default } from './plugin';
export {
  augmentProviderExtensionPoint,
  type AgenticProviderExtensionPoint,
  type AgenticProviderFactory,
} from './extensions';

// Re-exports from common (shared between frontend and backend)
export { FileFormat } from './types';
export type {
  ChatMessage,
  ToolCallInfo,
  RAGSource,
  EvaluationResult,
  DocumentInfo,
  ProviderStatus,
  VectorStoreStatus,
  MCPServerStatus,
  SecurityMode,
  AugmentStatus,
  VectorStoreInfo,
  WorkflowStep,
  Workflow,
  QuickAction,
  PromptCard,
  PromptGroup,
  ConversationSummary,
  ResponseUsage,
  InputTokensDetails,
  OutputTokensDetails,
} from './types';

// Services (used in provider factory)
export { AdminConfigService } from './services/AdminConfigService';

// Provider factory types
export type { CreateProviderOptions } from './providers/factory';
// Explicit re-export of types used in interfaces (required for API report)
export type {
  ConversationItem,
  InputItem,
  ProcessedRagSource,
  ProcessedToolCall,
} from './providers/llamastack/conversationTypes';
export type {
  AgenticProvider,
  AgenticProviderStatus,
  ApprovalResult,
  ConversationCapability,
  ConversationDetails,
  ConversationItemsResult,
  ConversationListResult,
  EvaluationCapability,
  EvalStatus,
  InputItemsResult,
  ProcessedMessage,
  RAGCapability,
  SafetyCapability,
  SafetyCheckResult,
  SafetyStatus,
  ToolApproval,
} from './providers/types';

// Backend-specific public types
export type {
  // Configuration
  ToolScopingConfig,
  AllowedToolSpec,
  ReasoningConfig,
  ToolChoiceConfig,
  LlamaStackConfig,
  FunctionDefinition,
  DirectorySource,
  UrlSource,
  GitHubSource,
  DocumentSource,
  DocumentsConfig,
  FileAttributes,
  // Chat request/response
  ChatRequest,
  ChatResponse,
  UploadDocumentsRequest,
  UploadDocumentsResponse,
  // MCP server config
  ApprovalFilter,
  OAuthClientConfig,
  MCPServerServiceAccountConfig,
  MCPAuthConfig,
  MCPServerConfig,
  // Security
  SecurityConfig,
  // HITL
  PendingToolApproval,
  ToolApprovalResponse,
  ToolApprovalResult,
  // Safety
  ShieldRegistration,
  SafetyConfig,
  ShieldInfo,
  SafetyViolation,
  SafetyChatResponse,
  // Evaluation
  EvaluationConfig,
  ScoringFunctionInfo,
  ScoreResult,
  EvaluatedChatResponse,
  // Conversation history
  StoredResponse,
  StoredResponseList,
  ResponseInputItem,
  ResponseInputItemList,
} from './types';
