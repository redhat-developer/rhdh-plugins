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

import { DEFAULT_LIGHTSPEED_SERVICE_PORT } from '../src/service/constant';

export const LIGHTSPEED_CORE_ADDR = `http://0.0.0.0:${DEFAULT_LIGHTSPEED_SERVICE_PORT}`;

// Mock session data
export const mockSession1 = {
  session_id: 'session-1',
  name: 'Test Session 1',
  user_id: 'user:default/guest',
  description: 'Test description',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  metadata: {
    embedding_model: 'sentence-transformers/nomic-ai/nomic-embed-text-v1.5',
    embedding_dimension: 768,
    provider_id: 'notebooks',
    conversation_id: null,
  },
};

export const mockSession2 = {
  session_id: 'session-2',
  name: 'Test Session 2',
  user_id: 'user:default/guest',
  description: 'Another test',
  created_at: '2024-01-02T00:00:00.000Z',
  updated_at: '2024-01-02T00:00:00.000Z',
  metadata: {
    embedding_model: 'sentence-transformers/nomic-ai/nomic-embed-text-v1.5',
    embedding_dimension: 768,
    provider_id: 'notebooks',
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

/**
 * MSW handlers for lightspeed-core vector store endpoints
 * These mock the endpoints created in lightspeed-core that proxy to llama stack
 */
export const lightspeedCoreHandlers: HttpHandler[] = [
  // Create vector store
  http.post(`${LIGHTSPEED_CORE_ADDR}/v1/vector-stores`, async ({ request }) => {
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
  http.get(`${LIGHTSPEED_CORE_ADDR}/v1/vector-stores/:id`, ({ params }) => {
    const { id } = params;
    const vectorStore = vectorStores.get(id as string);
    if (!vectorStore) {
      return HttpResponse.json(
        { detail: 'Vector store not found' },
        { status: 404 },
      );
    }
    return HttpResponse.json(vectorStore);
  }),

  // Update vector store
  http.put(
    `${LIGHTSPEED_CORE_ADDR}/v1/vector-stores/:id`,
    async ({ params, request }) => {
      const { id } = params;
      const vectorStore = vectorStores.get(id as string);
      if (!vectorStore) {
        return HttpResponse.json(
          { detail: 'Vector store not found' },
          { status: 404 },
        );
      }
      const body = (await request.json()) as any;
      const updated = {
        ...vectorStore,
        metadata: body.metadata || vectorStore.metadata,
      };
      vectorStores.set(id as string, updated);
      return HttpResponse.json(updated);
    },
  ),

  // Delete vector store
  http.delete(`${LIGHTSPEED_CORE_ADDR}/v1/vector-stores/:id`, ({ params }) => {
    const { id } = params;
    if (!vectorStores.has(id as string)) {
      return HttpResponse.json(
        { detail: 'Vector store not found' },
        { status: 404 },
      );
    }
    vectorStores.delete(id as string);
    vectorStoreFiles.delete(id as string);
    return HttpResponse.json({ deleted: true });
  }),

  // List vector stores
  http.get(`${LIGHTSPEED_CORE_ADDR}/v1/vector-stores`, () => {
    const data = Array.from(vectorStores.values());
    return HttpResponse.json({ data });
  }),

  // Upload file
  http.post(`${LIGHTSPEED_CORE_ADDR}/v1/files`, async () => {
    const fileId = `file-${Date.now()}`;
    const file = {
      id: fileId,
      created_at: Date.now(),
      purpose: 'assistants',
    };
    files.set(fileId, file);
    return HttpResponse.json(file);
  }),

  // Add file to vector store
  http.post(
    `${LIGHTSPEED_CORE_ADDR}/v1/vector-stores/:id/files`,
    async ({ params, request }) => {
      const { id } = params;
      const vectorStore = vectorStores.get(id as string);
      if (!vectorStore) {
        return HttpResponse.json(
          { detail: 'Vector store not found' },
          { status: 404 },
        );
      }

      const body = (await request.json()) as any;
      const vectorStoreFile = {
        id: body.file_id,
        status: 'completed' as const,
        created_at: Date.now(),
        chunks_count: 1,
        attributes: body.attributes || {},
      };

      const storeFiles = vectorStoreFiles.get(id as string) || [];
      storeFiles.push(vectorStoreFile);
      vectorStoreFiles.set(id as string, storeFiles);

      return HttpResponse.json(vectorStoreFile);
    },
  ),

  // List files in vector store
  http.get(
    `${LIGHTSPEED_CORE_ADDR}/v1/vector-stores/:id/files`,
    ({ params }) => {
      const { id } = params;
      const storeFiles = vectorStoreFiles.get(id as string) || [];
      return HttpResponse.json({ data: storeFiles });
    },
  ),

  // Get file from vector store
  http.get(
    `${LIGHTSPEED_CORE_ADDR}/v1/vector-stores/:id/files/:fileId`,
    ({ params }) => {
      const { id, fileId } = params;
      const storeFiles = vectorStoreFiles.get(id as string) || [];
      const file = storeFiles.find(f => f.id === fileId);
      if (!file) {
        return HttpResponse.json({ detail: 'File not found' }, { status: 404 });
      }
      return HttpResponse.json(file);
    },
  ),

  // Delete file from vector store
  http.delete(
    `${LIGHTSPEED_CORE_ADDR}/v1/vector-stores/:id/files/:fileId`,
    ({ params }) => {
      const { id, fileId } = params;
      const storeFiles = vectorStoreFiles.get(id as string) || [];
      const fileIndex = storeFiles.findIndex(f => f.id === fileId);
      if (fileIndex === -1) {
        return HttpResponse.json({ detail: 'File not found' }, { status: 404 });
      }
      storeFiles.splice(fileIndex, 1);
      vectorStoreFiles.set(id as string, storeFiles);
      return HttpResponse.json({ deleted: true });
    },
  ),
];
