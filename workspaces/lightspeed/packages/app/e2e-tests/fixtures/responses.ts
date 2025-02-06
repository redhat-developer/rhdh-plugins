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
    summary: 'Conversation 1',
    lastMessageTimestamp: createdAt,
  },
];

export const moreConversations = [
  {
    conversation_id: 'user:development/guest+Av8Fax73D4XPx5Ls',
    summary: 'Conversation 1',
    lastMessageTimestamp: createdAt,
  },
  {
    conversation_id: 'user:development/guest+Av8Fax73D4XPx5La',
    summary: 'New Conversation',
    lastMessageTimestamp: createdAt,
  },
];

export const contents = [
  {
    lc: 1,
    type: 'constructor',
    id: ['langchain_core', 'messages', 'HumanMessage'],
    kwargs: {
      content: 'New conversation',
      response_metadata: {
        created_at: createdAt,
      },
      additional_kwargs: {},
    },
  },
  {
    lc: 1,
    type: 'constructor',
    id: ['langchain_core', 'messages', 'AIMessage'],
    kwargs: {
      content: 'Still a placeholder message',
      response_metadata: {
        created_at: createdAt,
        model: models[1].id,
      },
      tool_calls: [],
      invalid_tool_calls: [],
      additional_kwargs: {},
    },
  },
];

export const botResponse = `This is a placeholder message`;

export const generateQueryResponse = (conversationId: string) => {
  let body = '';

  for (const token of botResponse.split(' ')) {
    body += `{"conversation_id":"${conversationId}","response":{"lc":1,"type":"constructor","id":["langchain_core","messages","AIMessageChunk"],"kwargs":{"content":" ${token}","tool_call_chunks":[],"additional_kwargs":{},"id":"chatcmpl-890","tool_calls":[],"invalid_tool_calls":[],"response_metadata":{"prompt":0,"completion":0,"created_at":1736332476031,"model":"${models[1].id}"}}}}`;
  }
  body += `{"conversation_id":"${conversationId}","response":{"lc":1,"type":"constructor","id":["langchain_core","messages","AIMessageChunk"],"kwargs":{"content":"","tool_call_chunks":[],"additional_kwargs":{},"id":"chatcmpl-890","tool_calls":[],"invalid_tool_calls":[],"response_metadata":{"prompt":0,"completion":0,"finish_reason":"stop","system_fingerprint":"fp_ollama","created_at":1736332476031,"model":"${models[1].id}"}}}}`;

  return body;
};
