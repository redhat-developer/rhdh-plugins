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

// =============================================================================
// Provider Abstraction Types
// =============================================================================
//
// These are the shared interfaces for the boost provider abstraction.
// Provider-specific types (e.g., Kagenti config, Llama Stack config)
// live in their respective provider modules — NOT here.

/**
 * Declares the capability matrix for a provider.
 * Frontend uses these flags for capability-based feature gating —
 * never provider ID string checks.
 *
 * @public
 */
export interface ProviderCapabilities {
  /** Provider supports chat (required) */
  readonly chat: boolean;
  /** Provider supports RAG/document search */
  readonly rag: boolean;
  /** Provider supports safety shields */
  readonly safety: boolean;
  /** Provider supports evaluation/scoring */
  readonly evaluation: boolean;
  /** Provider supports conversation history */
  readonly conversations: boolean;
  /** Provider supports MCP tool servers */
  readonly mcpTools: boolean;
  /** Provider supports tool registry */
  readonly tools: boolean;
  /** Provider manages tool lifecycle (build, deploy, route) */
  readonly toolLifecycle: boolean;
  /** Provider manages agent lifecycle (build, deploy, migrate) */
  readonly agentLifecycle: boolean;
  /** Provider supports DevSpaces integration */
  readonly devSpaces: boolean;
  /** Provider needs context hydrated from DB on non-streaming paths */
  readonly contextHydration: boolean;
  /** Provider registers its own sub-routes */
  readonly providerRoutes: boolean;
}

/**
 * Configuration field definition for the admin panel.
 *
 * @public
 */
export interface ProviderConfigField {
  /** Config key (matches admin config key) */
  readonly key: string;
  /** Human-readable label for the form field */
  readonly label: string;
  /** Field type determines the form control rendered */
  readonly type: 'string' | 'boolean' | 'number' | 'select';
  /** Whether the field is required for the provider to function */
  readonly required: boolean;
  /** Help text shown below the field */
  readonly description?: string;
  /** Options for 'select' type fields */
  readonly options?: readonly string[];
  /** Placeholder text for text inputs */
  readonly placeholder?: string;
  /** Whether the field value is sensitive and should be masked in UI */
  readonly sensitive?: boolean;
}

/**
 * Describes a registered provider — its identity, capabilities,
 * and admin panel config fields.
 *
 * @public
 */
export interface ProviderDescriptor {
  /** Unique provider identifier (e.g., 'llamastack', 'kagenti') */
  readonly id: string;
  /** Human-readable display name (e.g., "Llama Stack") */
  readonly displayName: string;
  /** Short description of the provider */
  readonly description: string;
  /** Whether this provider has a working implementation */
  readonly implemented: boolean;
  /** Which capability categories this provider supports */
  readonly capabilities: ProviderCapabilities;
  /** Provider-specific config field definitions for the admin panel */
  readonly configFields: readonly ProviderConfigField[];
}

/**
 * The core provider interface. This is the abstraction boundary between
 * the Backstage plugin and the underlying AI/agentic runtime.
 *
 * The router and plugin lifecycle interact ONLY through this interface.
 * Provider-specific code lives entirely within the provider implementation.
 *
 * Required methods: `chat()` and `chatStream()`.
 * Optional capabilities are exposed as optional properties.
 *
 * @public
 */
export interface AgenticProvider {
  /** Unique identifier for this provider type (e.g., 'llamastack', 'kagenti') */
  readonly id: string;

  /** Human-readable display name */
  readonly displayName: string;

  /** Initialize the provider (connect, validate config, etc.) */
  initialize(): Promise<void>;

  /** Post-initialization hook (after all providers are registered) */
  postInitialize(): Promise<void>;

  /** Get current provider status including capabilities and health */
  getStatus(): Promise<AgenticProviderStatus>;

  /** Synchronous chat request */
  chat(request: ChatRequest): Promise<ChatResponse>;

  /** Streaming chat request */
  chatStream(
    request: ChatRequest,
    onEvent: (event: NormalizedStreamEvent) => void,
    signal?: AbortSignal,
  ): Promise<void>;

  /** Graceful shutdown */
  shutdown?(): Promise<void>;

  /** Invalidate cached runtime config */
  invalidateRuntimeConfig?(): void;

  /** Refresh dynamic configuration from the DB */
  refreshDynamicConfig?(): Promise<void>;

  /** Get the effective (merged) configuration */
  getEffectiveConfig?(): Promise<Record<string, unknown>>;

  /** List available models */
  listModels?(): Promise<
    Array<{ id: string; owned_by?: string; model_type?: string }>
  >;

  /** Test connectivity to a model */
  testModel?(
    model?: string,
    baseUrl?: string,
  ): Promise<{
    connected: boolean;
    modelFound: boolean;
    canGenerate: boolean;
    error?: string;
  }>;

  /** Set user context for per-user identity delegation */
  setUserContext?(userRef: string): void;
}

// =============================================================================
// Provider Status Types
// =============================================================================

/**
 * Overall status of an agentic provider.
 *
 * @public
 */
export interface AgenticProviderStatus {
  /** Provider connectivity and health */
  provider: ProviderStatus;
  /** Timestamp of the status check */
  timestamp: string;
  /** Whether the provider is ready to serve requests */
  ready: boolean;
  /** Any configuration errors preventing operation */
  configurationErrors: string[];
  /** Summary of available capabilities */
  capabilities?: {
    chat: boolean;
    rag: { available: boolean; reason?: string };
    mcpTools: { available: boolean; reason?: string };
    agentCatalog?: boolean;
  };
}

/**
 * Provider connectivity status.
 *
 * @public
 */
export interface ProviderStatus {
  /** Whether the provider is connected to its backend */
  connected: boolean;
  /** The base URL of the provider backend */
  baseUrl: string;
  /** Model identifier in use */
  model: string;
  /** Error message if not connected */
  error?: string;
}

// =============================================================================
// Chat Types
// =============================================================================

/**
 * Chat request sent to a provider.
 *
 * @public
 */
export interface ChatRequest {
  /** User message text */
  message: string;
  /** Model to use (overrides default) */
  model?: string;
  /** Session/conversation identifier */
  sessionId?: string;
  /** Previous response ID for conversation continuity */
  previousResponseId?: string;
  /** User identity reference */
  userRef?: string;
  /** Agent identifier for agent-scoped chat */
  agentId?: string;
}

/**
 * Chat response from a provider.
 *
 * @public
 */
export interface ChatResponse {
  /** The assistant's response text */
  message: string;
  /** Response identifier for conversation threading */
  responseId?: string;
  /** Token usage information */
  usage?: ResponseUsage;
}

/**
 * Token usage statistics for a response.
 *
 * @public
 */
export interface ResponseUsage {
  /** Total input tokens */
  input_tokens: number;
  /** Total output tokens */
  output_tokens: number;
  /** Sum of input + output tokens */
  total_tokens: number;
}

// =============================================================================
// Conversation Types
// =============================================================================

/**
 * Summary of a conversation for list views.
 *
 * @public
 */
export interface ConversationSummary {
  /** Response ID — use to continue this conversation */
  responseId: string;
  /** Preview of the conversation (first user message or assistant response) */
  preview: string;
  /** When the conversation was created */
  createdAt: Date;
  /** Model used */
  model: string;
  /** Conversation status */
  status: 'completed' | 'failed' | 'in_progress';
  /** Conversation container ID */
  conversationId?: string;
  /** Previous response ID for chain deduplication */
  previousResponseId?: string;
}

/**
 * Full conversation details.
 *
 * @public
 */
export interface ConversationDetails {
  /** Conversation/response identifier */
  id: string;
  /** Model used */
  model: string;
  /** Conversation status */
  status: string;
  /** When the conversation was created */
  createdAt: Date;
  /** Input data */
  input: unknown;
  /** Output items (messages, tool calls, etc.) */
  output: Array<{
    type: string;
    id?: string;
    role?: string;
    content?: Array<{ type: string; text: string }>;
    status?: string;
    name?: string;
    call_id?: string;
    arguments?: string;
    output?: string;
    error?: string;
    server_label?: string;
    results?: Array<{
      text: string;
      filename?: string;
      file_id?: string;
      score?: number;
      attributes?: Record<string, unknown>;
    }>;
  }>;
  /** Token usage */
  usage?: ResponseUsage;
  /** Previous response in the chain */
  previousResponseId?: string;
  /** Container conversation ID */
  conversationId?: string;
}

/**
 * An input item from a conversation's input list.
 *
 * @public
 */
export interface InputItem {
  /** Item type (e.g., 'message', 'function_call', 'function_call_output') */
  type: string;
  /** Item identifier */
  id?: string;
  /** Role of the item author */
  role?: string;
  /** Item content */
  content?: unknown;
  /** Item status */
  status?: string;
  /** Function call identifier */
  call_id?: string;
  /** Function/tool name */
  name?: string;
  /** Function call arguments (JSON string) */
  arguments?: string;
  /** Function call output */
  output?: string;
}

// =============================================================================
// Normalized Streaming Events
// =============================================================================
//
// These events form the contract between the backend provider and the frontend.
// Each provider adapter maps its native streaming format to these events.
// The frontend reducer ONLY processes normalized events — never raw provider events.
//
// Design principles:
// - Discriminated union on `type` for exhaustive switch handling
// - Each event carries only the data needed for that event
// - Event names use dot notation: stream.<category>.<action>
// - Provider-specific data is normalized away before reaching the frontend

/** Response has been created, streaming is starting. @public */
export interface StreamStartedEvent {
  type: 'stream.started';
  responseId: string;
  model?: string;
  /** Server-side creation timestamp (Unix epoch seconds) */
  createdAt?: number;
}

/** A chunk of generated text. @public */
export interface StreamTextDeltaEvent {
  type: 'stream.text.delta';
  delta: string;
}

/** Text generation is complete for this response. @public */
export interface StreamTextDoneEvent {
  type: 'stream.text.done';
  text: string;
}

/** A chunk of reasoning/thinking text. @public */
export interface StreamReasoningDeltaEvent {
  type: 'stream.reasoning.delta';
  delta: string;
}

/** Reasoning text is complete. @public */
export interface StreamReasoningDoneEvent {
  type: 'stream.reasoning.done';
  text: string;
}

/** Provider is discovering available tools. @public */
export interface StreamToolDiscoveryEvent {
  type: 'stream.tool.discovery';
  serverLabel?: string;
  status: 'in_progress' | 'completed';
  toolCount?: number;
}

/** A tool call has started. @public */
export interface StreamToolStartedEvent {
  type: 'stream.tool.started';
  callId: string;
  name: string;
  serverLabel?: string;
}

/** Tool call arguments are streaming in. @public */
export interface StreamToolDeltaEvent {
  type: 'stream.tool.delta';
  callId: string;
  delta: string;
}

/** Tool call completed with output. @public */
export interface StreamToolCompletedEvent {
  type: 'stream.tool.completed';
  callId: string;
  name: string;
  serverLabel?: string;
  output?: string;
  error?: string;
}

/** Tool call failed. @public */
export interface StreamToolFailedEvent {
  type: 'stream.tool.failed';
  callId: string;
  name: string;
  serverLabel?: string;
  error: string;
}

/** Tool call requires human approval (HITL). @public */
export interface StreamToolApprovalEvent {
  type: 'stream.tool.approval';
  callId: string;
  name: string;
  serverLabel?: string;
  arguments?: string;
  /** Response ID for this approval request */
  responseId?: string;
}

/** RAG search results arrived. @public */
export interface StreamRagResultsEvent {
  type: 'stream.rag.results';
  sources: Array<{
    filename: string;
    fileId?: string;
    text?: string;
    score?: number;
    title?: string;
    sourceUrl?: string;
    contentType?: string;
    attributes?: Record<string, unknown>;
  }>;
  filesSearched?: string[];
}

/** An agent handoff occurred during multi-agent streaming. @public */
export interface StreamAgentHandoffEvent {
  type: 'stream.agent.handoff';
  fromAgent?: string;
  toAgent: string;
  reason?: string;
}

/** Agent requests structured form input from the user. @public */
export interface StreamFormRequestEvent {
  type: 'stream.form.request';
  taskId?: string;
  contextId?: string;
  form: StreamFormDescriptor;
}

/** A form field descriptor for input-required forms. @public */
export interface StreamFormField {
  name: string;
  type?: string;
  label?: string;
  description?: string;
  required?: boolean;
  defaultValue?: unknown;
  options?: Array<{ label: string; value: string }>;
  [key: string]: unknown;
}

/** Shape of a form render request. @public */
export interface StreamFormDescriptor {
  title?: string;
  description?: string;
  fields?: StreamFormField[];
  [key: string]: unknown;
}

/** Agent requires authentication. @public */
export interface StreamAuthRequiredEvent {
  type: 'stream.auth.required';
  taskId?: string;
  authType: 'oauth' | 'secret';
  url?: string;
  demands?: { secrets?: StreamSecretDemand[]; [key: string]: unknown };
}

/** Shape of a secret demand from an agent. @public */
export interface StreamSecretDemand {
  name: string;
  description?: string;
  [key: string]: unknown;
}

/** Agent is streaming an artifact (code, file, document). @public */
export interface StreamArtifactEvent {
  type: 'stream.artifact';
  artifactId: string;
  name?: string;
  description?: string;
  content: string;
  append?: boolean;
  lastChunk?: boolean;
}

/** A single citation reference. @public */
export interface StreamCitationReference {
  title?: string;
  url?: string;
  snippet?: string;
  [key: string]: unknown;
}

/** Agent provides source citations for its response. @public */
export interface StreamCitationEvent {
  type: 'stream.citation';
  citations: StreamCitationReference[];
}

/** The response is fully complete. @public */
export interface StreamCompletedEvent {
  type: 'stream.completed';
  responseId?: string;
  usage?: ResponseUsage;
  /** Display name of the agent that produced the final response */
  agentName?: string;
}

/** An error occurred during streaming. @public */
export interface StreamErrorEvent {
  type: 'stream.error';
  error: string;
  code?: string;
  title?: string;
  context?: Record<string, unknown>;
}

/**
 * Union of all normalized streaming events.
 *
 * This is the single source of truth for the streaming contract
 * between the backend and frontend. Both the backend's stream normalizer
 * and the frontend's streaming reducer use this type.
 *
 * @public
 */
export type NormalizedStreamEvent =
  | StreamStartedEvent
  | StreamTextDeltaEvent
  | StreamTextDoneEvent
  | StreamReasoningDeltaEvent
  | StreamReasoningDoneEvent
  | StreamToolDiscoveryEvent
  | StreamToolStartedEvent
  | StreamToolDeltaEvent
  | StreamToolCompletedEvent
  | StreamToolFailedEvent
  | StreamToolApprovalEvent
  | StreamRagResultsEvent
  | StreamAgentHandoffEvent
  | StreamFormRequestEvent
  | StreamAuthRequiredEvent
  | StreamArtifactEvent
  | StreamCitationEvent
  | StreamCompletedEvent
  | StreamErrorEvent;
