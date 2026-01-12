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

import { http, HttpResponse } from 'msw';

export const LOCAL_LCS_ADDR = 'http://0.0.0.0:8080';

function loadTestFixture(filePathFromFixturesDir: string) {
  return require(`${__dirname}/${filePathFromFixturesDir}`);
}

const mockConversationId = 'conversation-id-1';
const mockConversationId2 = `conversation-id-2`;
const conversation1History = [
  {
    messages: [
      { content: 'what is openshit lightspeed', type: 'user' },
      {
        content:
          "OpenShift Lightspeed is a generative AI assistant integrated into the Red Hat Developer Hub (RHDH), an internal developer portal built on CNCF Backstage. It enhances developer productivity by streamlining workflows, providing instant access to technical knowledge, and supporting developers in their day-to-day tasks.\n\nOpenShift Lightspeed offers various features such as code assistance, knowledge retrieval, system navigation, troubleshooting, and integration support. It can generate, debug, and optimize code snippets, provide instant access to internal and external documentation, offer step-by-step instructions for Red Hat Developer Hub features, diagnose issues in services, pipelines, and configurations with actionable recommendations, and assist with Backstage plugins and integrations, including Kubernetes, CI/CD, and GitOps pipelines.\n\nOpenShift Lightspeed is designed to help developers work smarter, solve problems faster, and ensure they can focus on building and deploying software efficiently. It adapts its communication style to match the user's technical proficiency, providing concise, technical language for experts and clear explanations with examples for beginners.\n\nOpenShift Lightspeed is well-versed in various domains, including programming languages, DevOps, cloud platforms, Backstage, infrastructure as code, security, and documentation and standards. It leverages Markdown to format code snippets, tables, and lists for readability in its responses.",
        type: 'assistant',
      },
    ],
    started_at: '1741287754.162095',
    completed_at: '1741287761.8619468',
    provider: 'my_ollama',
    model: 'granite3-dense:8b',
  },
];

const conversation2History = [
  {
    messages: [
      { content: 'Hello', type: 'user' },
      { content: 'ai dummy response for test purpose', type: 'assistant' },
    ],
    started_at: '1741287754.162095',
    completed_at: '1741287761.8619468',
    provider: 'my_ollama',
    model: 'granite3-dense:8b',
  },
];

export const chatHistory: any = {};
chatHistory[mockConversationId] = conversation1History;
chatHistory[mockConversationId2] = conversation2History;

export function resetChatHistory() {
  // Clear all existing keys
  Object.keys(chatHistory).forEach(key => delete chatHistory[key]);
  // Restore the original conversations
  chatHistory[mockConversationId] = conversation1History;
  chatHistory[mockConversationId2] = conversation2History;
}

export const lcsHandlers = [
  // Models endpoint now served by LCS
  http.get(`${LOCAL_LCS_ADDR}/v1/models`, () => {
    const response = {
      models: [
        {
          identifier: 'openai/gpt-4-turbo',
          metadata: {},
          api_model_type: 'llm',
          provider_id: 'openai',
          type: 'model',
          provider_resource_id: 'gpt-4-turbo',
          model_type: 'llm',
        },
        {
          identifier: 'team-cluster/qwen25-7b-instruct',
          metadata: {},
          api_model_type: 'llm',
          provider_id: 'team-cluster',
          type: 'model',
          provider_resource_id: 'qwen25-7b-instruct',
          model_type: 'llm',
        },
      ],
    };
    return HttpResponse.json(response);
  }),

  http.post(`${LOCAL_LCS_ADDR}/v1/streaming_query`, () => {
    const textEncoder = new TextEncoder();
    const mockData = loadTestFixture('chatResponse.json');

    const stream = new ReadableStream({
      start(controller) {
        mockData.forEach((chunk: any) => {
          controller.enqueue(
            textEncoder.encode(`data: ${JSON.stringify(chunk)}\n\n`),
          );
        });
        controller.close();
      },
    });

    return new HttpResponse(stream, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }),

  http.get(`${LOCAL_LCS_ADDR}/v1/feedback/status`, () => {
    const response = { functionality: 'feedback', status: { enabled: true } };
    return HttpResponse.json(response);
  }),

  http.post(`${LOCAL_LCS_ADDR}/v1/feedback`, () => {
    const response = { response: 'feedback received' };
    return HttpResponse.json(response);
  }),

  http.get(
    `${LOCAL_LCS_ADDR}/v2/conversations/:conversation_id`,
    ({ params }) => {
      const conversation_id = params.conversation_id as string;
      if (conversation_id in chatHistory) {
        const mockHistoryRes = {
          conversation_id,
          chat_history: chatHistory[conversation_id],
        };
        return HttpResponse.json(mockHistoryRes);
      }
      return new HttpResponse(
        JSON.stringify({
          error: `Conversation ${conversation_id} not found`,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    },
  ),

  http.get(`${LOCAL_LCS_ADDR}/v2/conversations`, () => {
    const conversations = [];
    const ids = Object.keys(chatHistory);
    for (const id of ids) {
      const conversation = {
        conversation_id: id,
        topic_summary: 'dummy summary',
        last_message_timestamp: 1742237500.516723,
      };
      conversations.push(conversation);
    }
    const mockConversations = {
      conversations: conversations,
    };

    return HttpResponse.json(mockConversations);
  }),

  http.delete(
    `${LOCAL_LCS_ADDR}/v2/conversations/:conversation_id`,
    ({ params }) => {
      const conversation_id = params.conversation_id as string;
      if (conversation_id in chatHistory) {
        delete chatHistory[conversation_id];
        return HttpResponse.json('ok', { status: 200 });
      }
      return new HttpResponse(
        JSON.stringify({
          error: `Conversation ${conversation_id} not found`,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    },
  ),

  http.put(
    `${LOCAL_LCS_ADDR}/v2/conversations/:conversation_id`,
    ({ params }) => {
      const conversation_id = params.conversation_id as string;

      if (conversation_id in chatHistory) {
        const response = {
          conversation_id,
          success: true,
          message: 'Topic summary updated successfully',
        };
        return HttpResponse.json(response);
      }
      return new HttpResponse(
        JSON.stringify({
          detail: {
            cause: `Conversation ${conversation_id} not found`,
          },
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    },
  ),

  http.get(`${LOCAL_LCS_ADDR}/v2/conversations`, () => {
    const mockModelRes = {
      conversations: [
        {
          conversation_id: 'c0a3bc27-77cc-46da-822f-93a9c0e0de5b',
          topic_summary: 'LIGHTSPEED CONCEPT',
          last_message_timestamp: 1741289312.209488,
        },
        {
          conversation_id: 'e6df4804-5ada-4138-9dfb-4ba515beb4c5',
          topic_summary: 'AI Topic Summarizer Capability',
          last_message_timestamp: 1741289568.360167,
        },
        {
          conversation_id: '933bb6e3-35d3-453a-88fc-b387175f2979',
          topic_summary: 'OpenShift Overview',
          last_message_timestamp: 1741289606.5125692,
        },
      ],
    };
    return HttpResponse.json(mockModelRes);
  }),

  // Catch-all handler for unknown paths
  http.all(`${LOCAL_LCS_ADDR}/*`, ({ request }) => {
    console.log(`Caught request to unknown path: ${request.url}`);

    // Return a 404 response
    return new HttpResponse(
      JSON.stringify({
        error: 'Not found',
        message: `The requested resource at ${request.url} was not found`,
      }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }),
];
