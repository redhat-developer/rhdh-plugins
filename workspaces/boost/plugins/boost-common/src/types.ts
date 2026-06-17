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
 * Describes the identity and capabilities of an AI provider.
 *
 * @public
 */
export interface ProviderDescriptor {
  /** Unique identifier for the provider (e.g., 'llamastack', 'kagenti'). */
  id: string;
  /** Human-readable display name. */
  name: string;
  /** Optional description of the provider. */
  description?: string;
  /** Declared capabilities of this provider. */
  capabilities: ProviderCapabilities;
}

/**
 * Capability flags for a provider. Frontend uses these for feature gating
 * instead of provider ID string checks.
 *
 * @public
 */
export interface ProviderCapabilities {
  /** Whether the provider supports an agent catalog. */
  agentCatalog?: boolean;
  /** Whether the provider supports namespace scoping. */
  namespaceScoping?: boolean;
  /** Whether the provider supports Dev Spaces integration. */
  devSpaces?: boolean;
  /** Whether the provider supports build pipelines. */
  buildPipelines?: boolean;
}

/**
 * A single item in a conversation input (user message content).
 *
 * @public
 */
export interface InputItem {
  /** The type of input content. */
  type: 'text' | 'file' | 'image';
  /** Text content, when type is 'text'. */
  text?: string;
  /** File URL or reference, when type is 'file' or 'image'. */
  url?: string;
  /** MIME type of the content. */
  mimeType?: string;
}

/**
 * Summary of a conversation for listing purposes.
 *
 * @public
 */
export interface ConversationSummary {
  /** Unique conversation identifier. */
  id: string;
  /** Display title for the conversation. */
  title: string;
  /** ISO 8601 timestamp of conversation creation. */
  createdAt: string;
  /** ISO 8601 timestamp of the last update. */
  updatedAt: string;
}

/**
 * Full details of a conversation including messages.
 *
 * @public
 */
export interface ConversationDetails {
  /** Unique conversation identifier. */
  id: string;
  /** Display title for the conversation. */
  title: string;
  /** ISO 8601 timestamp of conversation creation. */
  createdAt: string;
  /** ISO 8601 timestamp of the last update. */
  updatedAt: string;
  /** Ordered list of messages in the conversation. */
  messages: ConversationMessage[];
}

/**
 * A single message within a conversation.
 *
 * @public
 */
export interface ConversationMessage {
  /** Unique message identifier. */
  id: string;
  /** Role of the message author. */
  role: 'user' | 'assistant' | 'system';
  /** Message content. */
  content: string;
  /** ISO 8601 timestamp of the message. */
  createdAt: string;
}

/**
 * Provider-agnostic normalized stream event. Each variant is
 * discriminated by the `type` field.
 *
 * @public
 */
export type NormalizedStreamEvent =
  | NormalizedStreamTextEvent
  | NormalizedStreamToolCallEvent
  | NormalizedStreamToolResultEvent
  | NormalizedStreamErrorEvent
  | NormalizedStreamDoneEvent;

/**
 * A text chunk in a streaming response.
 *
 * @public
 */
export interface NormalizedStreamTextEvent {
  /** Discriminator for text events. */
  type: 'text';
  /** The text content of this chunk. */
  text: string;
}

/**
 * A tool call request in a streaming response.
 *
 * @public
 */
export interface NormalizedStreamToolCallEvent {
  /** Discriminator for tool call events. */
  type: 'tool_call';
  /** The tool call identifier. */
  toolCallId: string;
  /** The name of the tool being called. */
  toolName: string;
  /** JSON-serialized arguments for the tool. */
  args: string;
}

/**
 * A tool result in a streaming response.
 *
 * @public
 */
export interface NormalizedStreamToolResultEvent {
  /** Discriminator for tool result events. */
  type: 'tool_result';
  /** The tool call identifier this result corresponds to. */
  toolCallId: string;
  /** The result content. */
  content: string;
}

/**
 * An error in a streaming response.
 *
 * @public
 */
export interface NormalizedStreamErrorEvent {
  /** Discriminator for error events. */
  type: 'error';
  /** Error message. */
  message: string;
  /** Optional error code. */
  code?: string;
}

/**
 * Signals the end of a streaming response.
 *
 * @public
 */
export interface NormalizedStreamDoneEvent {
  /** Discriminator for done events. */
  type: 'done';
}

/**
 * The contract between Boost and any AI platform backend.
 * Chat and streaming are required; other capabilities are optional.
 *
 * @public
 */
export interface AgenticProvider {
  /** Provider identity and capability declaration. */
  readonly descriptor: ProviderDescriptor;

  /**
   * Send a chat message and receive a complete response.
   *
   * @param messages - The conversation messages to send.
   * @returns The assistant's response content.
   */
  chat(messages: InputItem[]): Promise<string>;

  /**
   * Send a chat message and receive a streaming response.
   *
   * @param messages - The conversation messages to send.
   * @returns An async iterable of normalized stream events.
   */
  chatStream(messages: InputItem[]): AsyncIterable<NormalizedStreamEvent>;
}
