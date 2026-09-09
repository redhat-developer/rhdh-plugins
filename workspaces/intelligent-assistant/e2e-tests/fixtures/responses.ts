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

export const modelBaseUrl = '*/**/api/intelligent-assistant';

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

export const conversations = [
  {
    conversation_id: '1348e758-15ed-483a-bca5-b8702bbc79fe',
    topic_summary: 'Conversation 1',
    last_message_timestamp: createdAt,
  },
  {
    conversation_id: '1348e758-15ed-483a-bca5-b8702bbc79fa',
    topic_summary: 'Temporary conversation',
    last_message_timestamp: createdAt,
  },
];

export const moreConversations = [
  conversations[0],
  {
    conversation_id: '1348e758-15ed-483a-bca5-b8702bbc79fb',
    topic_summary: 'New Conversation',
    last_message_timestamp: createdAt,
  },
];

export const thinkingContent =
  'The user wants to start a new conversation. I should respond helpfully and concisely.';
export const assistantResponse = 'Still a placeholder message';

/** Default conversation history for most e2e tests (no deep-thinking / reasoning UI). */
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
        content: assistantResponse,
        type: 'assistant',
      },
    ],
    started_at: '2025-10-06T15:39:38Z',
    completed_at: '2025-10-06T15:39:42Z',
  },
];

/**
 * Same thread as {@link contents}, but assistant text includes `redacted_thinking`
 * so the chat renders the expandable “Show thinking” section.
 */
export const contentsWithRedactedThinking = [
  {
    ...contents[0],
    messages: [
      contents[0].messages[0],
      {
        content: `<think>\n${thinkingContent}\n</think>\n\n${assistantResponse}`,
        type: 'assistant',
      },
    ],
  },
];

export const mockedShields = [
  {
    identifier: 'test-shield-id',
    provider_id: 'test-shield-id',
    type: 'shield',
    params: {},
    provider_resource_id: 'test-shield-id',
  },
];

export {
  E2E_MCP_VALID_TOKEN,
  getExpectedMcpSelectedCountForMock,
  getExpectedMcpStatusDetailForMock,
  mcpServer,
  mcpServerScenarios,
  mockedMcpServersResponse,
  tokenCredentialNoUrlScenario,
  tokenCredentialValidationScenario,
  type McpServerMockEntry,
  type McpServersListMock,
} from './mcpServerMocks';
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

/** Stable conversation id aligned with seeded `chat_history` for notebook-tab e2e. */
export const NOTEBOOK_E2E_RAG_CONVERSATION_ID =
  '98f24095a40b95ce4d929bbee4aeb26759275bc7b0a5791e';

/** Assistant message body built from {@link notebookRagConversationChatHistoryForUploadTitle} (assertions + clipboard). */
export function notebookRagConversationAssistantPlainTextForUploadTitle(
  uploadDocumentTitle: string,
): string {
  return `E2E summary: ${uploadDocumentTitle} describes an uploaded fixture. [${uploadDocumentTitle}]`;
}

/** User bubble text in {@link notebookRagConversationChatHistoryForUploadTitle} (assert in notebook conversation e2e). */
export function notebookRagConversationUserPromptForUploadTitle(
  uploadDocumentTitle: string,
): string {
  return `Tell me about ${uploadDocumentTitle} in one line.`;
}

/**
 * One `chat_history` entry as returned by `GET /v2/conversations/:id` (notebook RAG + referenced_documents).
 * `uploadDocumentTitle` must match an attached notebook document basename (e.g. {@link localeNotebookUpload1Path}).
 */
export function notebookRagConversationChatHistoryForUploadTitle(
  uploadDocumentTitle: string,
): Record<string, unknown>[] {
  const userPrompt =
    notebookRagConversationUserPromptForUploadTitle(uploadDocumentTitle);
  const assistantText =
    notebookRagConversationAssistantPlainTextForUploadTitle(
      uploadDocumentTitle,
    );
  return [
    {
      provider: 'vllm',
      model: 'llama3.2:3b',
      messages: [
        {
          content: userPrompt,
          type: 'user',
          referenced_documents: null,
        },
        {
          content: assistantText,
          type: 'assistant',
          referenced_documents: [
            {
              doc_url: null,
              doc_title: uploadDocumentTitle,
              source: 'vs_e2e_notebook_rag',
            },
          ],
        },
      ],
      tool_calls: [
        {
          id: 'fc_e2e_notebook_file_search',
          name: 'file_search',
          args: {
            queries: [uploadDocumentTitle.replace(/\.[^.]+$/, '')],
          },
          type: 'file_search_call',
        },
      ],
      tool_results: [
        {
          id: 'fc_e2e_notebook_file_search',
          status: 'completed',
          content: JSON.stringify({ results: [] }),
          type: 'file_search_call',
          round: 1,
        },
      ],
      started_at: '2026-05-04T12:08:13Z',
      completed_at: '2026-05-04T12:08:26Z',
    },
  ];
}

/** BYOK rag_id used in local testing guide (PR #4178). */
export const BYOK_E2E_RAG_ID = 'my-knowledge';

export const BYOK_E2E_DOC_TITLE = 'my-knowledge.md';

export const BYOK_E2E_DOC_URL = 'https://example.com/my-doc';

/** LCORE `referenced_documents` payload for BYOK-attributed responses. */
export const byokReferencedDocuments = [
  {
    doc_title: BYOK_E2E_DOC_TITLE,
    doc_url: BYOK_E2E_DOC_URL,
    doc_description:
      'Custom knowledge document used to validate BYOK source labeling.',
    source: BYOK_E2E_RAG_ID,
  },
  {
    doc_title: 'product-docs.md',
    doc_url: 'https://example.com/product-docs',
    doc_description: 'Secondary BYOK source for multi-source labeling.',
    source: 'product-docs',
  },
];

export const byokReferencedDocumentWithoutSource = [
  {
    doc_title: 'generic-doc.md',
    doc_url: 'https://example.com/generic',
    doc_description: 'Document without a LCORE source id.',
  },
];

/** SSE `start.request_id` in {@link generateQueryResponse}. */
const mockStreamRequestId = '0e3c4cd7-2817-4c34-91a2-6944550364df';

type QuerySseEvent = {
  event: string;
  data?: Record<string, unknown>;
  done?: boolean;
};

function serializeQuerySseEvents(events: QuerySseEvent[]): string {
  return `${events
    .map(({ event, data }) => `data: ${JSON.stringify({ event, data })}\n\n`)
    .join('')}\n`;
}

function buildTokenEvents(text: string): QuerySseEvent[] {
  const tokens = text.match(/(\s+|[^\s]+)/g) || [text];
  return tokens.map((token, index) => ({
    event: 'token',
    data: { id: index, token, role: 'inference' },
  }));
}

export const generateQueryResponse = (conversationId: string) => {
  const events: QuerySseEvent[] = [
    {
      event: 'start',
      data: {
        conversation_id: conversationId,
        request_id: mockStreamRequestId,
      },
    },
    ...buildTokenEvents(botResponse),
    { event: 'end', done: true },
  ];

  return serializeQuerySseEvents(events);
};

/** SSE stream ending with BYOK `referenced_documents` (LCORE `end` event). */
export function generateQueryResponseWithReferencedDocuments(
  conversationId: string,
  referencedDocuments: Record<string, unknown>[] = byokReferencedDocuments,
): string {
  const events: QuerySseEvent[] = [
    {
      event: 'start',
      data: {
        conversation_id: conversationId,
        request_id: mockStreamRequestId,
      },
    },
    ...buildTokenEvents(botResponse),
    {
      event: 'end',
      data: { referenced_documents: referencedDocuments },
      done: true,
    },
  ];

  return serializeQuerySseEvents(events);
}

const e2eMcpToolCallId = 'mcp_list_e2e-00000000-0000-4000-8000-000000000001';

/** SSE with `tool_call` / `tool_result` then assistant tokens (same wire format as {@link generateQueryResponse}). */
export function generateQueryResponseWithMcpToolCall(
  conversationId: string,
): string {
  const events: QuerySseEvent[] = [
    {
      event: 'start',
      data: {
        conversation_id: conversationId,
        request_id: mockStreamRequestId,
      },
    },
    {
      event: 'tool_call',
      data: {
        id: e2eMcpToolCallId,
        name: 'mcp_list_tools',
        args: { server_label: 'mcp-integration-tools' },
        type: 'mcp_list_tools',
      },
    },
    {
      event: 'tool_result',
      data: {
        id: e2eMcpToolCallId,
        status: 'success',
        content: '{"server_label":"mcp-integration-tools","tools":[]}',
      },
    },
    ...buildTokenEvents(assistantResponse),
    { event: 'end', done: true },
  ];

  return serializeQuerySseEvents(events);
}
