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
  ResponseUsage,
  RAGSource,
  ToolCallInfo,
  EvaluationResult,
  NormalizedStreamEvent,
  ChatResponse as BaseChatResponse,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';

// Re-export shared types from common for backward compatibility.
// Consumers that import from this package continue to see these types.
export {
  FileFormat,
  DEFAULT_BRANDING,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
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
  ChatAgentConfig,
  PromptGroup,
  ConversationSummary,
  ResponseUsage,
  InputTokensDetails,
  OutputTokensDetails,
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
  StreamBackendToolExecutingEvent,
  StreamRagResultsEvent,
  StreamCompletedEvent,
  StreamAgentHandoffEvent,
  StreamFormRequestEvent,
  StreamAuthRequiredEvent,
  StreamArtifactEvent,
  StreamCitationEvent,
  StreamErrorEvent,
  AdminConfigKey,
  AdminConfigEntry,
  RagTestChunk,
  RagTestResult,
  RagGenerateResult,
  UploadResult,
  VectorStoreConfig,
  VectorStoreCreateResult,
  VectorStoreStatusResult,
  BrandingConfig,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';

// =============================================================================
// Frontend-specific Types
// =============================================================================

/**
 * A fully processed message returned by the backend's getProcessedMessages endpoint.
 * Tool calls and RAG sources are already grouped with their assistant message.
 * @public
 */
export interface ProcessedMessage {
  role: 'user' | 'assistant';
  text: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    serverLabel: string;
    arguments?: string;
    output?: string;
    error?: string;
    status: string;
  }>;
  ragSources?: Array<{
    filename: string;
    text?: string;
    score?: number;
    fileId?: string;
    attributes?: Record<string, unknown>;
  }>;
  /** Token usage reported by the inference server */
  usage?: ResponseUsage;
  /** Model's reasoning/thinking content */
  reasoning?: string;
  /** Display name of the agent that produced this response (multi-agent only) */
  agentName?: string;
  /** ISO 8601 timestamp of when this message was created, if available */
  createdAt?: string;
}

/**
 * Response from the session messages API endpoint.
 * Includes the messages and the session creation timestamp as a fallback
 * for messages that lack per-message timestamps.
 * @public
 */
export interface SessionMessagesResponse {
  messages: ProcessedMessage[];
  sessionCreatedAt?: string;
  /** True when the session has a linked conversation (messages may still be empty if data was lost) */
  hasConversationId?: boolean;
}

/**
 * Result from testing MCP server connection
 * @public
 */
export interface McpTestConnectionResult {
  success: boolean;
  error?: string;
  warning?: string;
  serverType?: string;
  tools?: Array<{ name: string; description?: string }>;
  toolCount?: number;
}

/**
 * Status of Safety shields from the inference server
 * @public
 */
export interface SafetyStatusResponse {
  enabled: boolean;
  shields: string[];
  timestamp: string;
}

/**
 * Status of Evaluation scoring from the inference server
 * @public
 */
export interface EvaluationStatusResponse {
  enabled: boolean;
  scoringFunctions: string[];
  timestamp: string;
}

/**
 * UI Message - represents a message in the chat UI
 * @public
 */
export interface Message {
  /** Unique identifier for the message */
  id: string;
  /** Message text content */
  text: string;
  /** Whether this is a user message (true) or assistant message (false) */
  isUser: boolean;
  /** When the message was sent/received */
  timestamp: Date;
  /** @deprecated Use ragSources instead */
  filesSearched?: string[];
  /** Detailed RAG sources from file_search_call.results */
  ragSources?: RAGSource[];
  /** Tool calls made during response generation */
  toolCalls?: ToolCallInfo[];
  /** Response ID for conversation branching */
  responseId?: string;
  /** Conversation ID this message belongs to */
  conversationId?: string;
  /** Token usage reported by the inference server */
  usage?: TokenUsage;
  /** Error code from backend (safety_violation, stream_error, etc.) for differentiated error UI */
  errorCode?: string;
  /** Model's reasoning/thinking content (persisted from streaming state) */
  reasoning?: string;
  /** Duration of the reasoning phase in seconds */
  reasoningDuration?: number;
  /** Display name of the agent that produced this response (multi-agent only) */
  agentName?: string;
  /** Ordered agent names visited during handoffs (multi-agent only) */
  handoffPath?: string[];
  /** Validation error when the response did not match the expected output format */
  outputValidationError?: string;
  /** Structured reasoning summaries from the model's thought process */
  reasoningSummaries?: Array<{ id: string; text: string }>;
  /** Artifacts generated during the response */
  artifacts?: Array<{
    artifactId: string;
    name?: string;
    description?: string;
    content: string;
  }>;
  /** Citation references from the agent's response */
  citations?: Array<{
    title?: string;
    url?: string;
    snippet?: string;
  }>;
}

/**
 * Token usage data reported by the inference server.
 * Canonical definition lives in augment-common; re-exported here for backward compatibility.
 * @public
 */
export type TokenUsage = ResponseUsage;

/**
 * Response from the chat endpoint.
 * Extends the shared base with frontend-specific fields (safety, evaluation).
 * @public
 */
export interface ChatResponse extends BaseChatResponse {
  /** Whether the response was filtered by safety shields */
  filtered?: boolean;
  /** Reason for filtering (if filtered) */
  filterReason?: string;
  /** Whether this action requires user confirmation */
  requiresConfirmation?: boolean;
  /** Description of pending action requiring confirmation */
  pendingAction?: string;
  /** Evaluation result if scoring is enabled */
  evaluation?: EvaluationResult;
}

export type { SyncResult } from '@red-hat-developer-hub/backstage-plugin-augment-common';

export type {
  ToolCapabilityInfo,
  PromptCapabilities,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';

// =============================================================================
// Streaming Event Types (Direct from Responses API - no hardcoding)
// =============================================================================

/**
 * Normalized streaming event from the backend.
 *
 * Now a type alias for the properly typed discriminated union defined in common.
 * Kept as an alias for backward compatibility with existing consumer code.
 * @public
 */
export type StreamingEvent = NormalizedStreamEvent;

/**
 * Callback for streaming events
 * @public
 */
export type StreamingEventCallback = (event: StreamingEvent) => void;

// =============================================================================
// Conversation History Types (Responses API)
// =============================================================================

/**
 * Full conversation details retrieved from the provider
 * @public
 */
export interface ConversationDetails {
  id: string;
  model: string;
  status: string;
  createdAt: Date;
  /** User's input - can be a string or array of input items */
  input?: unknown;
  output: Array<{
    type: string;
    id?: string;
    role?: string;
    content?: Array<{ type: string; text: string }>;
  }>;
  /** Previous response ID if this is part of a conversation chain */
  previousResponseId?: string;
}

/**
 * Input item from a conversation (context)
 * @public
 */
export interface ConversationInputItem {
  type: string;
  id?: string;
  role?: 'user' | 'assistant' | 'system';
  content?: string | Array<{ type: string; text?: string }>;
  status?: string;
  call_id?: string;
  output?: string;
  /** Tool name (for mcp_call, function_call items) */
  name?: string;
  /** MCP server label (for mcp_call items) */
  server_label?: string;
  /** Tool arguments as JSON string (for mcp_call, function_call items) */
  arguments?: string;
  /** Error message (for failed tool calls) */
  error?: string;
  /** Search queries (for file_search_call items) */
  queries?: string[];
  /** Search results (for file_search_call items with include: file_search_call.results) */
  results?: Array<{
    filename?: string;
    file_id?: string;
    text?: string;
    score?: number;
    attributes?: Record<string, unknown>;
  }>;
}

// BrandingConfig — re-exported from common above

// =============================================================================
// Chat Sessions (local DB — mirrors ai-virtual-agent pattern)
// =============================================================================

/**
 * A chat session stored in the backend's local database.
 * The conversation_id links to a provider-managed conversation container.
 * @public
 */
export interface ChatSessionSummary {
  id: string;
  title: string;
  userRef?: string;
  conversationId: string | null;
  createdAt: string;
  updatedAt: string;
  /** Model or agent identifier associated with this session (e.g. "namespace/agentName") */
  model?: string;
  /** Provider that created this session (e.g. "llamastack", "kagenti") */
  providerId?: string;
}
