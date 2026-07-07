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
export type InputItem =
  | { type: 'text'; text: string; mimeType?: string }
  | { type: 'file'; url: string; mimeType?: string }
  | { type: 'image'; url: string; mimeType?: string };

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
  /** Identity of the user who created the conversation (userEntityRef). */
  createdBy: string;
  /** Provider that backs this conversation. */
  providerId: string;
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
  /** Identity of the user who created the conversation (userEntityRef). */
  createdBy: string;
  /** Provider that backs this conversation. */
  providerId: string;
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
  | NormalizedStreamReasoningEvent
  | NormalizedStreamToolCallEvent
  | NormalizedStreamToolResultEvent
  | NormalizedStreamRagResultEvent
  | NormalizedStreamHandoffEvent
  | NormalizedStreamApprovalEvent
  | NormalizedStreamFormEvent
  | NormalizedStreamAuthEvent
  | NormalizedStreamArtifactEvent
  | NormalizedStreamCitationEvent
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
 * A reasoning / chain-of-thought chunk in a streaming response.
 *
 * @public
 */
export interface NormalizedStreamReasoningEvent {
  /** Discriminator for reasoning events. */
  type: 'reasoning';
  /** The reasoning text content. */
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
 * A RAG retrieval result in a streaming response.
 *
 * @public
 */
export interface NormalizedStreamRagResultEvent {
  /** Discriminator for RAG result events. */
  type: 'rag_result';
  /** The retrieved content chunk. */
  content: string;
  /** Optional source identifier (URL, document name, etc.). */
  source?: string;
}

/**
 * A multi-agent handoff event in a streaming response.
 *
 * @public
 */
export interface NormalizedStreamHandoffEvent {
  /** Discriminator for handoff events. */
  type: 'handoff';
  /** Identifier of the agent handing off. */
  sourceAgent: string;
  /** Identifier of the agent receiving the handoff. */
  targetAgent: string;
}

/**
 * A human-in-the-loop approval request in a streaming response.
 *
 * @public
 */
export interface NormalizedStreamApprovalEvent {
  /** Discriminator for approval events. */
  type: 'approval';
  /** Unique identifier for the approval request. */
  requestId: string;
  /** Optional message describing what needs approval. */
  message?: string;
}

/**
 * The status of an approval request.
 *
 * @public
 */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

/**
 * A tool call approval request for human-in-the-loop flows.
 *
 * @public
 */
export interface ApprovalRequest {
  /** Unique identifier for the approval request. */
  requestId: string;
  /** The conversation this approval belongs to. */
  conversationId: string;
  /** The tool call identifier from the inference loop. */
  toolCallId: string;
  /** The name of the tool being called. */
  toolName: string;
  /** JSON-serialized arguments proposed by the agent. */
  args: string;
  /** Current status of the approval request. */
  status: ApprovalStatus;
  /** Identity of the user who will review the request (userEntityRef). */
  userRef: string;
  /** ISO 8601 timestamp of when the request was created. */
  createdAt: string;
  /** ISO 8601 timestamp of when the request was resolved (if resolved). */
  resolvedAt?: string;
  /** The approved arguments (may differ from original if edited). */
  resolvedArgs?: string;
  /** Optional message describing what needs approval. */
  message?: string;
}

/**
 * A structured form/input request in a streaming response.
 *
 * @public
 */
export interface NormalizedStreamFormEvent {
  /** Discriminator for form events. */
  type: 'form';
  /** Unique identifier for the form. */
  formId: string;
}

/**
 * An authentication challenge in a streaming response.
 *
 * @public
 */
export interface NormalizedStreamAuthEvent {
  /** Discriminator for auth events. */
  type: 'auth';
  /** Optional message describing the auth requirement. */
  message?: string;
}

/**
 * A generated artifact (code, file, etc.) in a streaming response.
 *
 * @public
 */
export interface NormalizedStreamArtifactEvent {
  /** Discriminator for artifact events. */
  type: 'artifact';
  /** Unique identifier for the artifact. */
  artifactId: string;
  /** The artifact content. */
  content: string;
  /** Optional MIME type of the artifact. */
  mimeType?: string;
}

/**
 * A citation / source reference in a streaming response.
 *
 * @public
 */
export interface NormalizedStreamCitationEvent {
  /** Discriminator for citation events. */
  type: 'citation';
  /** Optional title of the cited source. */
  title?: string;
  /** Optional URL of the cited source. */
  url?: string;
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
 * A feedback record associated with a conversation message.
 *
 * @public
 */
export interface FeedbackRecord {
  /** Unique feedback identifier. */
  id: string;
  /** The session (conversation) this feedback belongs to. */
  sessionId: string;
  /** The message this feedback is associated with. */
  messageId: string;
  /** Sentiment: positive (thumbs up) or negative (thumbs down). */
  sentiment: 'positive' | 'negative';
  /** Optional reason text explaining the feedback. */
  reason?: string;
  /** Identity of the user who submitted feedback (userEntityRef). */
  createdBy: string;
  /** ISO 8601 timestamp of when feedback was submitted. */
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Agent lifecycle model
// ---------------------------------------------------------------------------

/**
 * The four lifecycle stages for agents.
 * Draft → Pending → Published → Archived
 *
 * @public
 */
export type LifecycleStage = 'draft' | 'pending' | 'published' | 'archived';

/**
 * A governance record for an agent. Tracks lifecycle state and ownership.
 *
 * @public
 */
export interface AgentRecord {
  /** Unique agent identifier. */
  id: string;
  /** Human-readable agent name. */
  name: string;
  /** Optional description of the agent. */
  description?: string;
  /** Current lifecycle stage. */
  lifecycleStage: LifecycleStage;
  /** Identity of the user who created/registered the agent (userEntityRef). */
  createdBy: string;
  /** Whether the agent is registered for governance. */
  governanceRegistered: boolean;
  /** ISO 8601 timestamp of record creation. */
  createdAt: string;
  /** ISO 8601 timestamp of the last update. */
  updatedAt: string;
}

/**
 * A governance record for a Kagenti tool (K8s workload).
 * Tracks lifecycle state and ownership.
 *
 * MCP servers and MCP tools are NOT managed by this type —
 * they are registered endpoints without lifecycle governance.
 *
 * @public
 */
export interface ToolRecord {
  /** Unique tool identifier. */
  id: string;
  /** Human-readable tool name. */
  name: string;
  /** Optional description of the tool. */
  description?: string;
  /** Current lifecycle stage. */
  lifecycleStage: LifecycleStage;
  /** Identity of the user who created/registered the tool (userEntityRef). */
  createdBy: string;
  /** Whether the tool is registered for governance. */
  governanceRegistered: boolean;
  /** ISO 8601 timestamp of record creation. */
  createdAt: string;
  /** ISO 8601 timestamp of the last update. */
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// MCP server registration model
// ---------------------------------------------------------------------------

/**
 * Transport types supported for MCP server connections.
 *
 * @public
 */
export type McpTransport = 'streamable-http' | 'sse';

/**
 * Authentication types supported for MCP server connections.
 *
 * @public
 */
export type McpAuthType =
  | 'oauth-client-credentials'
  | 'k8s-service-account'
  | 'static-headers'
  | 'infrastructure-mtls'
  | 'none';

/**
 * A registered MCP server record.
 *
 * @public
 */
export interface McpServerRecord {
  /** Unique MCP server identifier. */
  id: string;
  /** Human-readable display name. */
  name: string;
  /** The MCP server endpoint URL. */
  url: string;
  /** Transport protocol used to connect. */
  transport: McpTransport;
  /** Authentication type configured for this server. */
  authType: McpAuthType;
  /** Optional description. */
  description?: string;
  /** ISO 8601 timestamp of record creation. */
  createdAt: string;
  /** ISO 8601 timestamp of the last update. */
  updatedAt: string;
}

/**
 * Options for chat and streaming calls on {@link AgenticProvider}.
 *
 * @public
 */
export interface ChatOptions {
  /** Backstage user entity ref for audit headers (e.g. 'user:default/jane'). */
  userRef?: string;
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
   * @param options - Optional chat options (e.g. user identity for audit).
   * @returns The assistant's response content.
   */
  chat(messages: InputItem[], options?: ChatOptions): Promise<string>;

  /**
   * Send a chat message and receive a streaming response.
   *
   * @param messages - The conversation messages to send.
   * @param options - Optional chat options (e.g. user identity for audit).
   * @returns An async iterable of normalized stream events.
   */
  chatStream(
    messages: InputItem[],
    options?: ChatOptions,
  ): AsyncIterable<NormalizedStreamEvent>;
}
