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
// Provider Types
// =============================================================================

/**
 * Capability flags that a provider may declare.
 *
 * The frontend uses these to conditionally render UI sections.
 * The backend uses them to gate API endpoints.
 *
 * @public
 */
export interface ProviderCapabilities {
  /** Provider supports basic chat */
  readonly chat: boolean;
  /** Provider supports RAG / file search */
  readonly rag: boolean;
  /** Provider supports safety shields */
  readonly safety: boolean;
  /** Provider supports response evaluation / scoring */
  readonly evaluation: boolean;
  /** Provider supports conversation history */
  readonly conversations: boolean;
  /** Provider supports MCP tool integration */
  readonly mcpTools: boolean;
  /** Provider supports general tool calling */
  readonly tools: boolean;
  /** Provider has an agent catalog (e.g., Kagenti agent registry) */
  readonly agentCatalog: boolean;
  /** Provider supports namespace-scoped resources */
  readonly namespaceScoping: boolean;
  /** Provider supports DevSpaces integration */
  readonly devSpaces: boolean;
  /** Provider supports build pipelines */
  readonly buildPipelines: boolean;
}

/**
 * Describes an AI provider's identity, capabilities, and readiness.
 *
 * The provider registry holds one descriptor per known provider,
 * including placeholders for providers that are not yet implemented.
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
}

/**
 * Token usage reported by the inference server for a single response turn.
 *
 * @public
 */
export interface ResponseUsage {
  /** Total input tokens */
  input_tokens: number;
  /** Total output tokens */
  output_tokens: number;
  /** Sum of input_tokens + output_tokens */
  total_tokens: number;
}

/**
 * Optional conversation management capabilities.
 *
 * @public
 */
export interface ConversationCapability {
  /** List conversations for the current user */
  listConversations(userRef: string): Promise<ConversationSummary[]>;
  /** Load full conversation details by ID */
  getConversation(
    conversationId: string,
    userRef: string,
  ): Promise<ConversationDetails>;
  /** Delete a conversation */
  deleteConversation(
    conversationId: string,
    userRef: string,
  ): Promise<void>;
}

/**
 * The core contract between Boost and any AI platform backend.
 *
 * Chat and streaming are required capabilities. Optional capabilities
 * (RAG, safety, evaluation, conversation management) are expressed
 * as optional capability objects.
 *
 * @public
 */
export interface AgenticProvider {
  /** Provider metadata */
  readonly descriptor: ProviderDescriptor;

  /** Send a non-streaming chat request */
  chat(options: {
    messages: InputItem[];
    model?: string;
    userRef: string;
    conversationId?: string;
    previousResponseId?: string;
  }): Promise<{
    content: string;
    responseId?: string;
    conversationId?: string;
    usage?: ResponseUsage;
  }>;

  /** Send a streaming chat request, emitting normalized events */
  chatStream(options: {
    messages: InputItem[];
    model?: string;
    userRef: string;
    conversationId?: string;
    previousResponseId?: string;
    onEvent: (event: NormalizedStreamEvent) => void;
    signal?: AbortSignal;
  }): Promise<void>;

  /** Optional conversation management */
  readonly conversations?: ConversationCapability;
}

// =============================================================================
// Conversation Types
// =============================================================================

/**
 * A single input item in a conversation turn.
 *
 * @public
 */
export interface InputItem {
  /** Role of the message sender */
  role: 'system' | 'user' | 'assistant';
  /** Text content of the message */
  content: string;
}

/**
 * Conversation summary for UI display.
 *
 * @public
 */
export interface ConversationSummary {
  /** Unique conversation identifier */
  conversationId: string;
  /** Preview of the conversation (first user message or assistant response) */
  preview: string;
  /** When the conversation was created */
  createdAt: Date;
  /** Model used */
  model: string;
  /** Status */
  status: 'completed' | 'failed' | 'in_progress';
}

/**
 * Full conversation details including message history.
 *
 * @public
 */
export interface ConversationDetails {
  /** Unique conversation identifier */
  conversationId: string;
  /** Preview of the conversation */
  preview: string;
  /** When the conversation was created */
  createdAt: Date;
  /** Model used */
  model: string;
  /** Status */
  status: 'completed' | 'failed' | 'in_progress';
  /** Full message history */
  messages: InputItem[];
}

// =============================================================================
// Normalized Streaming Events
// =============================================================================
//
// These events form the contract between the backend provider and the frontend.
// Each provider adapter maps its native streaming format to these events.
// The frontend reducer ONLY processes normalized events.
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

/** A chunk of reasoning/thinking text (models with chain-of-thought). @public */
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
  responseId?: string;
}

/** Backend is executing tool calls on behalf of the LLM. @public */
export interface StreamBackendToolExecutingEvent {
  type: 'stream.backend_tool.executing';
  toolCount: number;
  tools: string[];
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
  }>;
}

/** An agent handoff occurred during multi-agent streaming. @public */
export interface StreamAgentHandoffEvent {
  type: 'stream.agent.handoff';
  fromAgent?: string;
  toAgent: string;
  reason?: string;
}

/** The response is fully complete. @public */
export interface StreamCompletedEvent {
  type: 'stream.completed';
  responseId?: string;
  usage?: ResponseUsage;
  agentName?: string;
}

/** An error occurred during streaming. @public */
export interface StreamErrorEvent {
  type: 'stream.error';
  error: string;
  code?: string;
}

/**
 * Union of all normalized streaming events.
 *
 * This is the single source of truth for the streaming contract
 * between the backend and frontend.
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
  | StreamBackendToolExecutingEvent
  | StreamRagResultsEvent
  | StreamAgentHandoffEvent
  | StreamCompletedEvent
  | StreamErrorEvent;
