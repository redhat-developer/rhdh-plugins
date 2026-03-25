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
import type { ResponsesApiClient } from '../client/ResponsesApiClient';
import type { ConversationSummary, ResponseUsage } from '../../../types';

/**
 * Accessor functions injected into ConversationService so that
 * runtime config changes (baseUrl, model) take effect without
 * restarting the plugin. The orchestrator (or ClientManager in
 * Step 3) provides concrete implementations.
 */
export interface ConversationClientAccessor {
  /** Returns the current ResponsesApiClient (may be re-created on baseUrl change). */
  getClient: () => ResponsesApiClient;
  /** Returns the current model identifier. */
  getModel: () => string;
}

export type { ConversationSummary };

/**
 * Conversation list result
 * @public
 */
export interface ConversationListResult {
  conversations: ConversationSummary[];
  hasMore: boolean;
  lastId?: string;
}

/**
 * Conversation details from the Responses API.
 * @public
 */
export interface ConversationDetails {
  id: string;
  model: string;
  status: string;
  createdAt: Date;
  input: unknown;
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
  usage?: ResponseUsage;
  previousResponseId?: string;
  conversationId?: string;
}

/**
 * Input item from conversation
 * @public
 */
export interface InputItem {
  type: string;
  id?: string;
  role?: string;
  content?: unknown;
  status?: string;
  call_id?: string;
  name?: string;
  arguments?: string;
  output?: string;
}

/**
 * Input items result
 * @public
 */
export interface InputItemsResult {
  items: InputItem[];
  hasMore: boolean;
}

/**
 * Item from the Conversations API (/v1/conversations/\{id\}/items)
 * @public
 */
export interface ConversationItem {
  type: string;
  id?: string;
  role?: string;
  content?: unknown;
  status?: string;
  name?: string;
  call_id?: string;
  arguments?: string;
  output?: string;
  error?: string;
  server_label?: string;
  queries?: string[];
  results?: Array<{
    filename?: string;
    file_id?: string;
    text?: string;
    score?: number;
    attributes?: Record<string, unknown>;
  }>;
  /** Reasoning summary parts (for type:'reasoning' items) */
  summary?: Array<{ type: string; text: string }>;
  /** Unix timestamp (seconds) from LlamaStack, if available */
  created_at?: number;
}

/**
 * Result from getConversationItems
 * @public
 */
export interface ConversationItemsResult {
  items: ConversationItem[];
}

/**
 * Processed tool call from conversation
 * @public
 */
export interface ProcessedToolCall {
  id: string;
  name: string;
  serverLabel: string;
  arguments?: string;
  output?: string;
  error?: string;
  status: string;
}

/**
 * Processed RAG source from conversation
 * @public
 */
export interface ProcessedRagSource {
  filename: string;
  text?: string;
  score?: number;
  fileId?: string;
  attributes?: Record<string, unknown>;
}

/**
 * Processed message from conversation
 * @public
 */
export interface ProcessedMessage {
  role: 'user' | 'assistant';
  text: string;
  toolCalls?: ProcessedToolCall[];
  ragSources?: ProcessedRagSource[];
  /** ISO 8601 timestamp of when this message was created, if available */
  createdAt?: string;
  /** Display name of the agent that produced this message (multi-agent only) */
  agentName?: string;
  /** Model reasoning/thinking text extracted from reasoning items */
  reasoning?: string;
}

/**
 * Tool approval for HITL
 * @public
 */
export interface ToolApproval {
  responseId: string;
  callId: string;
  approved: boolean;
  toolName?: string;
  toolArguments?: string;
}

/**
 * Result of a tool approval submission
 * @public
 */
export interface ApprovalResult {
  content: string;
  responseId: string;
  toolExecuted: boolean;
  toolOutput?: string;
  /** Whether the tool output was truncated to fit context limits. */
  outputTruncated?: boolean;
  /** Present when the model requests approval for a chained tool call. */
  pendingApproval?: {
    approvalRequestId: string;
    toolName: string;
    serverLabel?: string;
    arguments?: string;
  };
  /** Present when the continuation triggered a handoff to another agent. */
  handoff?: {
    fromAgent: string;
    toAgent: string;
  };
}
