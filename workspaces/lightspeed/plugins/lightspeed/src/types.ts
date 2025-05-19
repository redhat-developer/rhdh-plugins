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

export interface BaseMessage {
  name: string;
  type: string;
  id: number;
  content: string;
  response_metadata: {
    model?: string;
    created_at: number;
    role?: string;
  };
  sources?: SourcesCardProps;
  additional_kwargs: {
    [_key: string]: any;
  };
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

export type SamplePrompts = {
  title: string;
  message: string;
}[];
