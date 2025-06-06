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
    id: 'mock-model-1',
    object: 'model',
    created: Math.floor(createdAt / 1000),
    owned_by: 'library',
  },
  {
    id: 'mock-model-2',
    object: 'model',
    created: Math.floor(createdAt / 1000),
    owned_by: 'library',
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
    lc: 1,
    type: 'constructor',
    id: ['langchain_core', 'messages', 'HumanMessage'],
    content: 'New conversation',
    response_metadata: {
      created_at: createdAt,
    },
    additional_kwargs: {},
  },
  {
    lc: 1,
    type: 'constructor',
    id: ['langchain_core', 'messages', 'AIMessage'],
    content: 'Still a placeholder message',
    response_metadata: {
      created_at: createdAt,
      model: models[1].id,
      tool_calls: [],
      invalid_tool_calls: [],
      additional_kwargs: {},
    },
  },
];

const repeatedSentence =
  'OpenShift deployment is a way to manage applications on the OpenShift platform.';
const openshiftLongParagraph = `${repeatedSentence} `.repeat(30);

export const demoChatContent = [
  {
    lc: 1,
    type: 'constructor',
    id: ['langchain_core', 'messages', 'HumanMessage'],
    content: 'let me know about openshift deplyment in detail',
    response_metadata: {
      created_at: createdAt,
    },
    additional_kwargs: {},
  },
  {
    lc: 1,
    type: 'constructor',
    id: ['langchain_core', 'messages', 'AIMessage'],
    content: openshiftLongParagraph,
    response_metadata: {
      created_at: createdAt,
      model: models[1].id,
      tool_calls: [],
      invalid_tool_calls: [],
      additional_kwargs: {},
    },
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
      data: { id: index, token },
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
