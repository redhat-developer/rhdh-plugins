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

import { http, HttpResponse, type HttpHandler } from 'msw';

export const LLAMA_STACK_ADDR = 'http://0.0.0.0:8321';

// Mock session data
export const mockSession1 = {
  id: 'session-1',
  name: 'Test Session 1',
  embedding_model: 'sentence-transformers/nomic-ai/nomic-embed-text-v1.5',
  embedding_dimension: 768,
  provider_id: 'rhdh-docs',
  metadata: {
    user_id: 'user:default/guest',
    name: 'Test Session 1',
    description: 'Test description',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    category: 'test',
    project: 'test-project',
    document_ids: [],
    conversation_id: null,
  },
};

export const mockSession2 = {
  id: 'session-2',
  name: 'Test Session 2',
  embedding_model: 'sentence-transformers/nomic-ai/nomic-embed-text-v1.5',
  embedding_dimension: 768,
  provider_id: 'rhdh-docs',
  metadata: {
    user_id: 'user:default/guest',
    name: 'Test Session 2',
    description: 'Another test',
    created_at: '2024-01-02T00:00:00.000Z',
    updated_at: '2024-01-02T00:00:00.000Z',
    document_ids: ['doc-1'],
    conversation_id: 'conv-1',
  },
};

export const mockFile1 = {
  id: 'file-1',
  created_at: 1704067200,
  status: 'completed' as const,
  attributes: {
    document_id: 'test-document',
    user_id: 'user:default/guest',
    title: 'Test Document',
    session_id: 'session-1',
    source_type: 'text',
    created_at: '2024-01-01T00:00:00.000Z',
  },
};

// In-memory storage for tests
const vectorStores = new Map<string, any>();
const files = new Map<string, any>();
const vectorStoreFiles = new Map<string, any[]>();

export function resetMockStorage() {
  vectorStores.clear();
  files.clear();
  vectorStoreFiles.clear();
}

export const llamaStackHandlers: HttpHandler[] = [
  // Create vector store
  http.post(`${LLAMA_STACK_ADDR}/v1/vector_stores`, async ({ request }) => {
    const body = (await request.json()) as any;
    const id = `vs-${Date.now()}`;
    const vectorStore = {
      id,
      name: body.name,
      embedding_model: body.embedding_model,
      embedding_dimension: body.embedding_dimension,
      provider_id: body.provider_id,
      metadata: body.metadata || {},
    };
    vectorStores.set(id, vectorStore);
    vectorStoreFiles.set(id, []);
    return HttpResponse.json(vectorStore);
  }),

  // Get vector store
  http.get(`${LLAMA_STACK_ADDR}/v1/vector_stores/:id`, ({ params }) => {
    const { id } = params;
    const vectorStore = vectorStores.get(id as string);
    if (!vectorStore) {
      return HttpResponse.json(
        { error: 'Vector store not found' },
        { status: 404 },
      );
    }
    return HttpResponse.json(vectorStore);
  }),

  // Update vector store
  http.post(
    `${LLAMA_STACK_ADDR}/v1/vector_stores/:id`,
    async ({ params, request }) => {
      const { id } = params;
      const body = (await request.json()) as any;
      const vectorStore = vectorStores.get(id as string);
      if (!vectorStore) {
        return HttpResponse.json(
          { error: 'Vector store not found' },
          { status: 404 },
        );
      }
      const updated = { ...vectorStore, ...body };
      vectorStores.set(id as string, updated);
      return HttpResponse.json(updated);
    },
  ),

  // Delete vector store
  http.delete(`${LLAMA_STACK_ADDR}/v1/vector_stores/:id`, ({ params }) => {
    const { id } = params;
    vectorStores.delete(id as string);
    vectorStoreFiles.delete(id as string);
    return HttpResponse.json({ success: true });
  }),

  // List vector stores
  http.get(`${LLAMA_STACK_ADDR}/v1/vector_stores`, () => {
    return HttpResponse.json({
      data: Array.from(vectorStores.values()),
    });
  }),

  // Create file
  http.post(`${LLAMA_STACK_ADDR}/v1/files`, async () => {
    const id = `file-${Date.now()}`;
    const file = {
      id,
      created_at: Math.floor(Date.now() / 1000),
      purpose: 'assistants',
    };
    files.set(id, file);
    return HttpResponse.json(file);
  }),

  // Delete file
  http.delete(`${LLAMA_STACK_ADDR}/v1/files/:id`, ({ params }) => {
    const { id } = params;
    files.delete(id as string);
    return HttpResponse.json({ success: true });
  }),

  // Create vector store file
  http.post(
    `${LLAMA_STACK_ADDR}/v1/vector_stores/:vectorStoreId/files`,
    async ({ params, request }) => {
      const { vectorStoreId } = params;
      const body = (await request.json()) as any;

      const vectorStoreFile = {
        id: body.file_id,
        created_at: Math.floor(Date.now() / 1000),
        status: 'completed' as 'in_progress' | 'completed',
        attributes: body.attributes || {},
      };

      const storeFiles = vectorStoreFiles.get(vectorStoreId as string) || [];
      storeFiles.push(vectorStoreFile);
      vectorStoreFiles.set(vectorStoreId as string, storeFiles);

      return HttpResponse.json(vectorStoreFile);
    },
  ),

  // List vector store files
  http.get(
    `${LLAMA_STACK_ADDR}/v1/vector_stores/:vectorStoreId/files`,
    ({ params }) => {
      const { vectorStoreId } = params;
      const storeFiles = vectorStoreFiles.get(vectorStoreId as string) || [];
      return HttpResponse.json({ data: storeFiles });
    },
  ),

  // Get vector store file
  http.get(
    `${LLAMA_STACK_ADDR}/v1/vector_stores/:vectorStoreId/files/:fileId`,
    ({ params }) => {
      const { vectorStoreId, fileId } = params;
      const storeFiles = vectorStoreFiles.get(vectorStoreId as string) || [];
      const file = storeFiles.find(f => f.id === fileId);
      if (!file) {
        return HttpResponse.json({ error: 'File not found' }, { status: 404 });
      }
      return HttpResponse.json(file);
    },
  ),

  // Delete vector store file
  http.delete(
    `${LLAMA_STACK_ADDR}/v1/vector_stores/:vectorStoreId/files/:fileId`,
    ({ params }) => {
      const { vectorStoreId, fileId } = params;
      const storeFiles = vectorStoreFiles.get(vectorStoreId as string) || [];
      const filtered = storeFiles.filter(f => f.id !== fileId);
      vectorStoreFiles.set(vectorStoreId as string, filtered);
      return HttpResponse.json({ success: true });
    },
  ),
];
