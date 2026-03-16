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

import { VectorStoreService } from './VectorStoreService';
import { ResponsesApiClient } from './ResponsesApiClient';
import { LlamaStackConfig } from '../../types';
import { LoggerService } from '@backstage/backend-plugin-api';

jest.mock('./ResponsesApiClient');

/**
 * Integration test: exercises the full vector store lifecycle through
 * VectorStoreService with a shared mock ResponsesApiClient.
 *
 * create store -> upload document -> list documents -> search -> delete doc -> delete store
 */
describe('VectorStoreService — RAG lifecycle', () => {
  let client: jest.Mocked<ResponsesApiClient>;
  let logger: jest.Mocked<LoggerService>;
  let config: LlamaStackConfig;
  let service: VectorStoreService;

  const STORE_ID = 'vs_lifecycle_test';
  const STORE_NAME = 'lifecycle-test-store';
  const FILE_ID = 'file-lifecycle-abc';

  beforeEach(() => {
    client = {
      request: jest.fn(),
    } as unknown as jest.Mocked<ResponsesApiClient>;

    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      child: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<LoggerService>;

    config = {
      baseUrl: 'https://llama.example.com',
      vectorStoreIds: [],
      vectorStoreName: STORE_NAME,
      embeddingModel: 'sentence-transformers/nomic-ai/nomic-embed-text-v1.5',
      embeddingDimension: 768,
      model: 'gemini/gemini-2.5-flash',
      chunkingStrategy: 'static',
      maxChunkSizeTokens: 200,
      chunkOverlapTokens: 50,
    };

    service = new VectorStoreService(client, config, logger);
  });

  it('runs the full create → upload → list → search → delete doc → delete store lifecycle', async () => {
    // ---------------------------------------------------------------
    // Step 1: Create the vector store (via ensureExists)
    // ---------------------------------------------------------------

    // Mock: GET /v1/vector_stores (no existing stores)
    client.request.mockResolvedValueOnce({ data: [] });
    // Mock: POST /v1/vector_stores (create)
    client.request.mockResolvedValueOnce({
      id: STORE_ID,
      name: STORE_NAME,
      status: 'completed',
    });

    await service.ensureExists();
    expect(service.getConfig().vectorStoreIds).toContain(STORE_ID);

    // ---------------------------------------------------------------
    // Step 2: Upload a document
    // ---------------------------------------------------------------

    // Mock: POST /v1/files (upload raw file)
    client.request.mockResolvedValueOnce({
      id: FILE_ID,
      filename: 'test.txt',
      purpose: 'assistants',
    });
    // Mock: POST /v1/vector_stores/{id}/files (attach file)
    client.request.mockResolvedValueOnce({
      id: FILE_ID,
      status: 'completed',
      vector_store_id: STORE_ID,
    });

    const uploadResult = await service.uploadDocuments(
      [
        {
          fileName: 'test.txt',
          content: Buffer.from(
            'Developer Hub is built on Backstage',
          ).toString(),
        },
      ],
      STORE_ID,
    );

    expect(uploadResult.uploaded).toHaveLength(1);
    expect(uploadResult.uploaded[0].fileName).toBe('test.txt');

    // ---------------------------------------------------------------
    // Step 3: List documents in the store
    // ---------------------------------------------------------------

    // Mock: GET /v1/vector_stores/{id}/files
    client.request.mockResolvedValueOnce({
      data: [
        {
          id: FILE_ID,
          object: 'vector_store.file',
          status: 'completed',
          created_at: 1700000000,
          usage_bytes: 35,
        },
      ],
      has_more: false,
    });

    const documents = await service.listDocuments(STORE_ID);
    expect(documents).toHaveLength(1);
    expect(documents[0].id).toBe(FILE_ID);

    // ---------------------------------------------------------------
    // Step 4: Search the vector store
    // ---------------------------------------------------------------

    // Mock: POST /v1/vector_stores/{id}/search
    client.request.mockResolvedValueOnce({
      data: [
        {
          file_id: FILE_ID,
          filename: 'test.txt',
          score: 0.92,
          content: [{ text: 'Developer Hub is built on Backstage' }],
        },
      ],
    });

    const searchResults = await service.searchSingle(
      STORE_ID,
      'What is Developer Hub?',
      5,
    );

    expect(searchResults).toHaveLength(1);
    expect(searchResults[0].score).toBe(0.92);
    expect(searchResults[0].text).toContain('Backstage');

    // ---------------------------------------------------------------
    // Step 5: Delete the document
    // ---------------------------------------------------------------

    // Mock: DELETE /v1/vector_stores/{id}/files/{fileId}
    client.request.mockResolvedValueOnce({
      id: FILE_ID,
      deleted: true,
    });
    // Mock: DELETE /v1/files/{fileId}
    client.request.mockResolvedValueOnce({
      id: FILE_ID,
      deleted: true,
    });

    const deleteDocResult = await service.deleteDocument(FILE_ID, STORE_ID);
    expect(deleteDocResult.success).toBe(true);

    // ---------------------------------------------------------------
    // Step 6: Delete the vector store
    // ---------------------------------------------------------------

    // Mock: GET /v1/vector_stores/{id}/files (empty after delete)
    client.request.mockResolvedValueOnce({ data: [], has_more: false });
    // Mock: DELETE /v1/vector_stores/{id}
    client.request.mockResolvedValueOnce({ id: STORE_ID, deleted: true });

    const deleteStoreResult = await service.deleteVectorStore(STORE_ID);
    expect(deleteStoreResult.success).toBe(true);
    expect(deleteStoreResult.filesDeleted).toBe(0);
  });

  it('handles store-not-found gracefully during delete lifecycle', async () => {
    // Simulate deleting a store that was already removed from the server
    // Mock: fetchAllVectorStoreFiles -> 400 not found
    client.request.mockRejectedValueOnce(
      new Error("Vector_store 'vs_stale' not found"),
    );
    // Mock: DELETE /v1/vector_stores/{id} -> 400 not found
    client.request.mockRejectedValueOnce(
      new Error("Vector_store 'vs_stale' not found"),
    );

    const result = await service.deleteVectorStore('vs_stale');
    expect(result.success).toBe(true);
    expect(result.filesDeleted).toBe(0);
  });
});
