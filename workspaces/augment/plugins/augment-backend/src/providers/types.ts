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
  NormalizedStreamEvent,
  SyncResult,
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
  EvaluationResult,
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
  EvaluationResult,
  RAGSource,
};

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

// Import conversation types for local use in interfaces below
import type {
  ConversationListResult,
  ConversationDetails,
  InputItemsResult,
  ConversationItemsResult,
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
  StreamCompletedEvent,
  StreamErrorEvent,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';

// =============================================================================
// Provider Capabilities
// =============================================================================
//
// Not all providers support all features. Capabilities are modeled as
// optional properties on AgenticProvider. The router checks for capability
// presence and returns 501 if the requested feature is not available.

/**
 * @public
 */
export interface ConversationCapability {
  create(): Promise<{ conversationId: string }>;
  list(limit?: number, after?: string): Promise<ConversationListResult>;
  get(responseId: string): Promise<ConversationDetails>;
  getInputs(responseId: string): Promise<InputItemsResult>;
  getByResponseChain(responseId: string): Promise<ConversationItemsResult>;
  getProcessedMessages(conversationId: string): Promise<ProcessedMessage[]>;
  delete(responseId: string, conversationId?: string): Promise<void>;
  /** Best-effort deletion of a Llama Stack conversation container by ID. */
  deleteContainer?(conversationId: string): Promise<boolean>;
  submitApproval(approval: ToolApproval): Promise<ApprovalResult>;
}

/**
 * @public
 */
export interface RAGCapability {
  listDocuments(vectorStoreId?: string): Promise<DocumentInfo[]>;
  listVectorStores(): Promise<VectorStoreInfo[]>;
  getDefaultVectorStoreId(): string | undefined;
  getActiveVectorStoreIds(): string[] | Promise<string[]>;
  syncDocuments(): Promise<SyncResult>;
  uploadDocument?(
    fileName: string,
    content: Buffer,
    vectorStoreId?: string,
  ): Promise<{ fileId: string; fileName: string; status: string }>;
  deleteDocument?(
    fileId: string,
    vectorStoreId?: string,
  ): Promise<{ success: boolean }>;
  searchVectorStore?(
    query: string,
    maxResults?: number,
    vectorStoreId?: string,
    vectorStoreIds?: string[],
  ): Promise<{
    query: string;
    chunks: Array<{
      text: string;
      score?: number;
      fileId?: string;
      fileName?: string;
      vectorStoreId?: string;
    }>;
    vectorStoreId: string;
    totalResults: number;
  }>;
  getVectorStoreConfig?(): Promise<{
    vectorStoreName: string;
    embeddingModel: string;
    embeddingDimension: number;
    searchMode?: 'semantic' | 'keyword' | 'hybrid';
    bm25Weight?: number;
    semanticWeight?: number;
    chunkingStrategy: 'auto' | 'static';
    maxChunkSizeTokens: number;
    chunkOverlapTokens: number;
    fileSearchMaxResults?: number;
    fileSearchScoreThreshold?: number;
  } | null>;
  createVectorStoreWithConfig?(overrides: Record<string, unknown>): Promise<{
    vectorStoreId: string;
    vectorStoreName: string;
    created: boolean;
    embeddingModel: string;
    embeddingDimension?: number;
  }>;
  getVectorStoreStatus?(): Promise<{
    exists: boolean;
    vectorStoreId?: string;
    vectorStoreName?: string;
    documentCount?: number;
    embeddingModel?: string;
    ready: boolean;
  }>;
  addVectorStoreId?(id: string): void;
  removeVectorStoreId?(id: string): void;
  deleteVectorStore?(
    vectorStoreId: string,
  ): Promise<{ success: boolean; filesDeleted: number }>;
  generateAnswer?(
    query: string,
    maxResults?: number,
    vectorStoreId?: string,
    vectorStoreIds?: string[],
  ): Promise<{
    query: string;
    answer: string;
    chunks: Array<{
      text: string;
      score?: number;
      fileId?: string;
      fileName?: string;
      vectorStoreId?: string;
    }>;
    model: string;
    totalResults: number;
  }>;
}

/**
 * @public
 */
export interface SafetyCapability {
  isEnabled(): boolean;
  getStatus(): Promise<SafetyStatus>;
  checkInput(text: string): Promise<SafetyCheckResult>;
  checkOutput(text: string): Promise<SafetyCheckResult>;
}

/**
 * @public
 */
export interface EvaluationCapability {
  isEnabled(): boolean;
  getStatus(): Promise<EvalStatus>;
  evaluateResponse(
    userMessage: string,
    assistantResponse: string,
    context?: string[],
  ): Promise<EvaluationResult>;
}

// =============================================================================
// Provider Interface
// =============================================================================

/**
 * AgenticProvider is the abstraction boundary between the Backstage plugin
 * and the underlying AI/agentic runtime (Llama Stack, ADK, LangGraph, etc.).
 *
 * The router and plugin lifecycle interact ONLY through this interface.
 * Provider-specific code lives entirely within the provider implementation.
 *
 * @public
 */
export interface AgenticProvider {
  /** Unique identifier for this provider type (e.g., 'llamastack', 'adk') */
  readonly id: string;

  /** Human-readable display name */
  readonly displayName: string;

  /**
   * Initialize the provider: connect to the backend, validate config,
   * set up vector stores, etc.
   */
  initialize(): Promise<void>;

  /**
   * Post-initialization: sync documents, warm caches, etc.
   * Called after initialize() succeeds, before the plugin accepts requests.
   */
  postInitialize(): Promise<void>;

  /** Get the provider's current status (connectivity, model, etc.) */
  getStatus(): Promise<AgenticProviderStatus>;

  /**
   * Send a chat message and get a complete response.
   * Used for non-streaming requests.
   */
  chat(request: ChatRequest): Promise<ChatResponse>;

  /**
   * Stream a chat response as normalized events.
   * The provider maps its native streaming format to NormalizedStreamEvent
   * before calling onEvent.
   */
  chatStream(
    request: ChatRequest,
    onEvent: (event: NormalizedStreamEvent) => void,
    signal?: AbortSignal,
  ): Promise<void>;

  /**
   * Gracefully shut down the provider: close connections,
   * cancel pending requests, release resources.
   *
   * Called during provider hot-swap before the old provider
   * is discarded. Implementations should be idempotent.
   */
  shutdown?(): Promise<void>;

  /**
   * Invalidate any cached runtime config so that admin-saved
   * values take effect on the next request. No-op when the
   * provider does not support dynamic configuration.
   */
  invalidateRuntimeConfig?(): void;

  /**
   * Refresh dynamic config overrides for safety/evaluation services.
   * Called once per request so admin panel changes take effect
   * without a restart. No-op when the provider has no dynamic config.
   */
  refreshDynamicConfig?(): Promise<void>;

  /**
   * Return the full effective configuration (YAML baseline merged with
   * DB overrides). Used by the admin panel to pre-populate fields with
   * the live values the system is actually using.
   */
  getEffectiveConfig?(): Promise<Record<string, unknown>>;

  /**
   * Generate a production-quality system prompt from a natural language
   * description. Uses the configured LLM and enriches the request with
   * context about the agent's current capabilities (tools, MCP, RAG, etc.).
   *
   * @param capabilities - Optional detailed capabilities context from the
   *   frontend's capabilities selector, including specific tool descriptions.
   */
  generateSystemPrompt?(
    description: string,
    model?: string,
    capabilities?: import('@red-hat-developer-hub/backstage-plugin-augment-common').PromptCapabilities,
  ): Promise<string>;

  /**
   * List available models from the inference server.
   * Used by the admin panel to populate model selection dropdowns.
   */
  listModels?(): Promise<
    Array<{ id: string; owned_by?: string; model_type?: string }>
  >;

  /**
   * Test connectivity to the inference server and optionally verify that a
   * specific model is available and can generate output.
   */
  testModel?(model?: string): Promise<{
    connected: boolean;
    modelFound: boolean;
    canGenerate: boolean;
    error?: string;
  }>;

  // ---- Optional capabilities ----

  /** Conversation management (history, retrieval, HITL approval) */
  conversations?: ConversationCapability;

  /** RAG / document management */
  rag?: RAGCapability;

  /** Safety guardrails */
  safety?: SafetyCapability;

  /** Response evaluation / scoring */
  evaluation?: EvaluationCapability;
}

// =============================================================================
// Supporting Types
// =============================================================================

/**
 * @public
 */
export interface AgenticProviderStatus {
  provider: ProviderStatus;
  vectorStore: VectorStoreStatus;
  mcpServers: MCPServerStatus[];
  securityMode: SecurityMode;
  timestamp: string;
  ready: boolean;
  configurationErrors: string[];
  capabilities?: {
    chat: boolean;
    rag: { available: boolean; reason?: string };
    mcpTools: { available: boolean; reason?: string };
  };
}

/**
 * @public
 */
export interface SafetyStatus {
  enabled: boolean;
  shields: string[];
  error?: string;
}

/**
 * @public
 */
export interface SafetyCheckResult {
  safe: boolean;
  violation?: string;
  category?: string;
}

/**
 * @public
 */
export interface EvalStatus {
  enabled: boolean;
  scoringFunctions: string[];
  error?: string;
}
