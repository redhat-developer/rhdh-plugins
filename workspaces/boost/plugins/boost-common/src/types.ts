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
 * Declares the capabilities a provider supports.
 * Frontend gates features based on these flags — never on provider identity.
 *
 * @public
 */
export interface ProviderCapabilities {
  /** Provider supports RAG (document retrieval) */
  rag?: boolean;
  /** Provider supports safety shields */
  safety?: boolean;
  /** Provider supports evaluation / scoring */
  evaluation?: boolean;
  /** Provider supports conversation management (history, list, delete) */
  conversationManagement?: boolean;
  /** Provider supports an agent catalog */
  agentCatalog?: boolean;
  /** Provider supports namespace scoping */
  namespaceScoping?: boolean;
  /** Provider supports DevSpaces integration */
  devSpaces?: boolean;
  /** Provider supports build pipelines */
  buildPipelines?: boolean;
}

/**
 * Metadata describing a registered provider.
 *
 * @public
 */
export interface ProviderDescriptor {
  /** Unique provider identifier (e.g. 'llamastack', 'kagenti') */
  id: string;
  /** Human-readable provider name */
  name: string;
  /** Capabilities this provider supports */
  capabilities: ProviderCapabilities;
}

/**
 * A normalized stream event emitted by any provider's `chatStream()`.
 * The union type ensures a consistent event shape regardless of backend.
 *
 * @public
 */
export type NormalizedStreamEvent =
  | { type: 'text'; content: string }
  | { type: 'tool_call_start'; toolCallId: string; toolName: string }
  | { type: 'tool_call_delta'; toolCallId: string; content: string }
  | { type: 'tool_call_end'; toolCallId: string }
  | { type: 'tool_result'; toolCallId: string; result: string }
  | { type: 'error'; message: string }
  | { type: 'done' };

/**
 * Summary of a conversation for list views.
 *
 * @public
 */
export interface ConversationSummary {
  /** Unique conversation identifier */
  id: string;
  /** Display title */
  title: string;
  /** ISO-8601 creation timestamp */
  createdAt: string;
  /** ISO-8601 last update timestamp */
  updatedAt: string;
}

/**
 * Full conversation details including messages.
 *
 * @public
 */
export interface ConversationDetails {
  /** Unique conversation identifier */
  id: string;
  /** Display title */
  title: string;
  /** Ordered list of messages / input items */
  items: InputItem[];
  /** ISO-8601 creation timestamp */
  createdAt: string;
  /** ISO-8601 last update timestamp */
  updatedAt: string;
}

/**
 * A single input item (message) in a conversation.
 *
 * @public
 */
export interface InputItem {
  /** Unique item identifier */
  id: string;
  /** Role of the message sender */
  role: 'user' | 'assistant' | 'system' | 'tool';
  /** Text content of the message */
  content: string;
  /** ISO-8601 timestamp */
  createdAt: string;
}

/**
 * The contract between Boost and any AI platform backend.
 * Chat and streaming are required; other capabilities are optional.
 *
 * @public
 */
export interface AgenticProvider {
  /** Provider metadata */
  readonly descriptor: ProviderDescriptor;

  /** Send a chat message and receive a complete response */
  chat(options: {
    messages: InputItem[];
    agentId?: string;
    conversationId?: string;
  }): Promise<{ response: string; conversationId: string }>;

  /** Send a chat message and receive a streaming response */
  chatStream(options: {
    messages: InputItem[];
    agentId?: string;
    conversationId?: string;
  }): AsyncIterable<NormalizedStreamEvent>;

  /** Optional RAG capability */
  rag?: {
    syncDocuments(options: { sources: string[] }): Promise<{ synced: number }>;
  };

  /** Optional safety capability */
  safety?: {
    checkInput(options: { content: string }): Promise<{ safe: boolean }>;
  };

  /** Optional evaluation capability */
  evaluation?: {
    score(options: { conversationId: string }): Promise<{ score: number }>;
  };

  /** Optional conversation management capability */
  conversations?: {
    list(): Promise<ConversationSummary[]>;
    get(conversationId: string): Promise<ConversationDetails>;
    delete(conversationId: string): Promise<void>;
  };
}
