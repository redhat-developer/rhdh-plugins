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

import { SourcesCardProps } from '@patternfly/chatbot';
import { AlertProps } from '@patternfly/react-core';

export type Conversations = {
  [key: string]: {
    user: string;
    bot: string;
    model: string;
    loading: boolean;
    timestamp: string;
    botTimestamp: string;
    error?: AlertProps;
  };
};

/**
 * @public
 * Referenced document metadata
 */
export type ReferencedDocument = {
  doc_title: string;
  doc_url: string;
  doc_description?: string;
};

/**
 * @public
 * List of referenced documents
 */
export type ReferencedDocuments = ReferencedDocument[];

/**
 * @public
 * LCS model type - embedding or llm
 */
export type LCSModelType = 'embedding' | 'llm';

/**
 * @public
 * LCS model API model type
 */
export type LCSModelApiModelType = 'embedding' | 'llm';

/**
 * @public
 * LCS Model interface
 */
export interface LCSModel {
  identifier: string;
  metadata: {
    embedding_dimension: number;
  };
  api_model_type: LCSModelApiModelType;
  provider_id: string;
  type: 'model';
  provider_resource_id: string;
  model_type: LCSModelType;
}
export interface LCSConversation {
  provider: string;
  model: string;
  messages: BaseMessage[];
  started_at: string;
  completed_at: string;
  referenced_documents?: ReferencedDocuments;
}

export interface LCSShield {
  identifier: string;
  provider_id: string;
  type: 'shield';
  params: {};
  provider_resource_id: string;
}

/**
 * @public
 * Base message interface for chat messages
 */
export interface BaseMessage {
  name: string;
  type: string;
  id: number;
  content: string;
  model: string;
  timestamp: string;
  sources?: SourcesCardProps;
  referenced_documents?: ReferencedDocuments;
  error?: AlertProps;
}

/**
 * @public
 * Conversation summary type
 */
export type ConversationSummary = {
  conversation_id: string;
  last_message_timestamp: number;
  topic_summary: string;
};

export enum SupportedFileType {
  JSON = 'application/json',
  YAML = 'application/x-yaml',
  TEXT = 'text/plain',
}
export interface FileContent {
  content: string;
  type: string;
  name: string;
}

/**
 * @public
 * Attachment type for file attachments in chat messages
 */
export type Attachment = {
  attachment_type: string;
  content_type: string;
  content: string;
};

/**
 * @public
 * List of conversation summaries
 */
export type ConversationList = ConversationSummary[];

export type SamplePrompt =
  | {
      title: string;
      message: string;
    }
  | {
      titleKey: string;
      messageKey: string;
    };

export type SamplePrompts = SamplePrompt[];

/**
 * @public
 * Feedback capture payload for user feedback on AI responses
 */
export type CaptureFeedback = {
  conversation_id: string;
  user_question: string;
  llm_response: string;
  user_feedback: string;
  sentiment: number;
};

// Tool Calling Types
export interface ToolCall {
  id: number;
  toolName: string;
  description?: string;
  arguments: Record<string, any>;
  response?: string;
  startTime: number;
  endTime?: number;
  executionTime?: number; // in seconds
  isLoading: boolean;
}

export interface ToolCallEvent {
  id: number;
  token: string | { tool_name: string; arguments: Record<string, any> };
}

export interface ToolResultEvent {
  id: number;
  token: { tool_name: string; response: string };
}
