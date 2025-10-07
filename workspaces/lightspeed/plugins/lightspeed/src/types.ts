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

export type ReferencedDocument = {
  doc_title: string;
  doc_url: string;
  doc_description?: string;
};

export type ReferencedDocuments = ReferencedDocument[];

export type LCSModelType = 'embedding' | 'llm';
export type LCSModelApiModelType = 'embedding' | 'llm';

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
  referencedDocuments?: ReferencedDocuments;
}

export interface LCSShield {
  identifier: string;
  provider_id: string;
  type: 'shield';
  params: {};
  provider_resource_id: string;
}
export interface BaseMessage {
  name: string;
  type: string;
  id: number;
  content: string;
  model: string;
  timestamp: string;
  sources?: SourcesCardProps;
  referencedDocuments?: ReferencedDocuments;
  error?: AlertProps;
}
export type ConversationSummary = {
  conversation_id: string;
  last_message_timestamp: number;
  topic_summary: string;
};

export enum SupportedFileType {
  JSON = 'application/json',
  YAML = 'application/x-yaml',
  TEXT = 'text/plain',
  XML = 'text/xml',
}
export interface FileContent {
  content: string;
  type: string;
  name: string;
}

export type Attachment = {
  attachment_type: string;
  content_type: string;
  content: string;
};

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

export type CaptureFeedback = {
  conversation_id: string;
  user_question: string;
  llm_response: string;
  user_feedback: string;
  sentiment: number;
};
