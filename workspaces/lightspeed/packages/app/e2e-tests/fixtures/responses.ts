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

export const modelBaseUrl = '*/**/api/lightspeed';
export const createdAt = Date.now();

export const models = [
  {
    identifier: 'mock-provider-1/mock-model-1',
    api_model_type: 'llm',
    model_type: 'llm',
    provider_resource_id: 'mock-model-1',
    type: 'model',
    owned_by: 'library',
    provider_id: 'mock-provider-1',
  },
  {
    identifier: 'mock-provider-1/mock-model-2',
    api_model_type: 'llm',
    model_type: 'llm',
    provider_resource_id: 'mock-model-2',
    type: 'model',
    owned_by: 'library',
    provider_id: 'mock-provider-1',
  },
];

export const defaultConversation = {
  conversation_id: 'user:development/guest+Av8Fax73D4XPx5Ls',
};

export const conversations = [
  {
    conversation_id: 'user:development/guest+Av8Fax73D4XPx5Ls',
    topic_summary: 'Conversation 1',
    last_message_timestamp: createdAt,
  },
  {
    conversation_id: 'temp-conversation-id',
    topic_summary: 'Temporary conversation',
    last_message_timestamp: createdAt,
  },
];

export const moreConversations = [
  {
    conversation_id: 'user:development/guest+Av8Fax73D4XPx5Ls',
    topic_summary: 'Conversation 1',
    last_message_timestamp: createdAt,
  },
  {
    conversation_id: 'user:development/guest+Av8Fax73D4XPx5La',
    topic_summary: 'New Conversation',
    last_message_timestamp: createdAt,
  },
];

export const contents = [
  {
    provider: models[1].provider_id,
    model: models[1].provider_resource_id,
    messages: [
      {
        content: 'New conversation',
        type: 'user',
      },
      {
        content: "Still a placeholder message'",
        type: 'assistant',
      },
    ],
    started_at: '2025-10-06T15:39:38Z',
    completed_at: '2025-10-06T15:39:42Z',
  },
];

const repeatedSentence =
  'OpenShift deployment is a way to manage applications on the OpenShift platform.';
const openshiftLongParagraph = `${repeatedSentence} `.repeat(30);

export const demoChatContent = [
  {
    provider: models[1].provider_id,
    model: models[1].provider_resource_id,
    messages: [
      {
        content: 'let me know about openshift deployment in detail',
        type: 'user',
      },
      {
        content: openshiftLongParagraph,
        type: 'assistant',
      },
    ],
    started_at: createdAt,
    completed_at: createdAt,
  },
];

export const botResponse = `This is a placeholder message`;

export const generateQueryResponse = (conversationId: string) => {
  const tokens = botResponse.match(/(\s+|[^\s]+)/g) || [];

  const events: {
    event: string;
    data?: Record<string, any>;
    done?: boolean;
  }[] = [];

  events.push({
    event: 'start',
    data: { conversation_id: conversationId },
  });

  tokens.forEach((token, index) => {
    events.push({
      event: 'token',
      data: { id: index, token, role: 'inference' },
    });
  });

  events.push({
    event: 'end',
    done: true,
  });

  return `${events
    .map(({ event, data }) => `data: ${JSON.stringify({ event, data })}\n\n`)
    .join('')}\n`;
};
