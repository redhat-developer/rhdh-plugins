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
 * Capabilities that a provider may support. Frontend uses these for
 * capability-based feature gating instead of provider identity checks.
 *
 * @public
 */
export interface ProviderCapabilities {
  /** Whether the provider supports an agent catalog */
  agentCatalog?: boolean;
  /** Whether the provider supports namespace scoping */
  namespaceScoping?: boolean;
  /** Whether the provider supports dev spaces */
  devSpaces?: boolean;
  /** Whether the provider supports build pipelines */
  buildPipelines?: boolean;
  /** Whether the provider supports RAG */
  rag?: boolean;
  /** Whether the provider supports safety shields */
  safety?: boolean;
  /** Whether the provider supports evaluation */
  evaluation?: boolean;
  /** Whether the provider supports conversation management */
  conversationManagement?: boolean;
}

/**
 * Metadata describing a registered provider.
 *
 * @public
 */
export interface ProviderDescriptor {
  /** Unique identifier for the provider */
  id: string;
  /** Human-readable display name */
  name: string;
  /** Capabilities supported by this provider */
  capabilities: ProviderCapabilities;
}

/**
 * The contract between Boost and any AI platform backend.
 * Chat and streaming are required capabilities; others are optional.
 *
 * @public
 */
export interface AgenticProvider {
  /** Provider metadata */
  readonly descriptor: ProviderDescriptor;

  /** Send a chat message and receive a complete response */
  chat(request: ChatRequest): Promise<ChatResponse>;

  /** Send a chat message and receive a streaming response */
  chatStream(request: ChatRequest): AsyncIterable<NormalizedStreamEvent>;

  /** Optional RAG capabilities */
  readonly rag?: RagCapability;

  /** Optional safety capabilities */
  readonly safety?: SafetyCapability;

  /** Optional evaluation capabilities */
  readonly evaluation?: EvaluationCapability;

  /** Optional conversation management capabilities */
  readonly conversations?: ConversationCapability;
}

/**
 * Request payload for chat operations.
 *
 * @public
 */
export interface ChatRequest {
  /** The input items for the conversation */
  input: InputItem[];
  /** Optional conversation ID to continue an existing conversation */
  conversationId?: string;
  /** Optional agent ID to route to a specific agent */
  agentId?: string;
}

/**
 * Response from a non-streaming chat operation.
 *
 * @public
 */
export interface ChatResponse {
  /** The response content */
  content: string;
  /** The conversation ID for follow-up messages */
  conversationId: string;
}

/**
 * Optional RAG (Retrieval-Augmented Generation) capability.
 *
 * @public
 */
export interface RagCapability {
  /** Query documents for context */
  query(params: { query: string; topK?: number }): Promise<unknown>;
}

/**
 * Optional safety capability.
 *
 * @public
 */
export interface SafetyCapability {
  /** Check content against safety shields */
  check(params: { content: string }): Promise<{ safe: boolean }>;
}

/**
 * Optional evaluation capability.
 *
 * @public
 */
export interface EvaluationCapability {
  /** Evaluate a response for quality */
  evaluate(params: {
    input: string;
    output: string;
  }): Promise<{ score: number }>;
}

/**
 * Optional conversation management capability.
 *
 * @public
 */
export interface ConversationCapability {
  /** List all conversations */
  list(): Promise<ConversationSummary[]>;
  /** Get details of a specific conversation */
  get(conversationId: string): Promise<ConversationDetails>;
  /** Delete a conversation */
  delete(conversationId: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Streaming types
// ---------------------------------------------------------------------------

/**
 * A normalized stream event emitted during chatStream.
 * Provider modules translate their native events into these.
 *
 * @public
 */
export type NormalizedStreamEvent =
  | StreamTextDelta
  | StreamToolCall
  | StreamToolResult
  | StreamError
  | StreamDone;

/**
 * A text chunk in a streaming response.
 * @public
 */
export interface StreamTextDelta {
  type: 'text_delta';
  /** The text fragment */
  content: string;
}

/**
 * A tool call event in a streaming response.
 * @public
 */
export interface StreamToolCall {
  type: 'tool_call';
  /** Tool call identifier */
  callId: string;
  /** Name of the tool being called */
  toolName: string;
  /** Arguments passed to the tool */
  args: string;
}

/**
 * A tool result event in a streaming response.
 * @public
 */
export interface StreamToolResult {
  type: 'tool_result';
  /** Tool call identifier this result corresponds to */
  callId: string;
  /** Result content from the tool */
  content: string;
}

/**
 * An error event in a streaming response.
 * @public
 */
export interface StreamError {
  type: 'error';
  /** Error message */
  message: string;
}

/**
 * Signals the end of a streaming response.
 * @public
 */
export interface StreamDone {
  type: 'done';
  /** The conversation ID for follow-up messages */
  conversationId: string;
}

// ---------------------------------------------------------------------------
// Conversation types
// ---------------------------------------------------------------------------

/**
 * Summary of a conversation, returned when listing conversations.
 *
 * @public
 */
export interface ConversationSummary {
  /** Unique conversation identifier */
  id: string;
  /** Human-readable title or first message snippet */
  title: string;
  /** ISO 8601 timestamp of creation */
  createdAt: string;
  /** ISO 8601 timestamp of last activity */
  updatedAt: string;
}

/**
 * Full details of a conversation, including message history.
 *
 * @public
 */
export interface ConversationDetails {
  /** Unique conversation identifier */
  id: string;
  /** Human-readable title */
  title: string;
  /** ISO 8601 timestamp of creation */
  createdAt: string;
  /** ISO 8601 timestamp of last activity */
  updatedAt: string;
  /** Ordered list of input items in the conversation */
  items: InputItem[];
}

/**
 * A single input item in a conversation — either a user message or
 * an assistant response.
 *
 * @public
 */
export interface InputItem {
  /** Role of the message sender */
  role: 'user' | 'assistant' | 'system';
  /** The message content */
  content: string;
  /** ISO 8601 timestamp */
  timestamp?: string;
}
