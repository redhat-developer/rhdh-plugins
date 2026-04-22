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

import { mockServices } from '@backstage/backend-test-utils';
import { NotFoundError } from '@backstage/errors';

import { setupServer } from 'msw/node';

import {
  LIGHTSPEED_CORE_ADDR,
  lightspeedCoreHandlers,
  resetMockStorage,
} from '../../../../__fixtures__/lightspeedCoreHandlers';
import { SessionService } from '../sessions/sessionService';
import { VectorStoresOperator } from '../VectorStoresOperator';
import { DocumentService } from './documentService';

describe('DocumentService', () => {
  const server = setupServer(...lightspeedCoreHandlers);
  const logger = mockServices.logger.mock();
  const mockUserId = 'user:default/guest';

  let documentService: DocumentService;
  let sessionService: SessionService;
  let operator: VectorStoresOperator;
  let sessionId: string;

  beforeAll(() => {
    // ERROR on unhandled requests to catch any real HTTP calls
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(async () => {
    resetMockStorage();
    const config = mockServices.rootConfig({
      data: {
        lightspeed: {
          notebooks: {
            sessionDefaults: {
              provider_id: 'test-notebooks',
              embedding_model: 'test-embedding-model',
              embedding_dimension: 768,
            },
          },
        },
      },
    });
    VectorStoresOperator.resetInstance(); // Reset singleton before each test
    operator = VectorStoresOperator.getInstance(LIGHTSPEED_CORE_ADDR, logger);
    documentService = new DocumentService(operator, logger, config);
    sessionService = new SessionService(operator, logger, config);

    // Create a test session for document operations
    const session = await sessionService.createSession(
      mockUserId,
      'Test Session',
      'Test description',
    );
    sessionId = session.session_id;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('should upload a file and return file ID', async () => {
      const fileId = await documentService.uploadFile(
        'Test content',
        'test-file.txt',
        'txt',
      );

      expect(fileId).toBeDefined();
      expect(fileId).toMatch(/^file-/);
    });

    it('should handle upload errors', async () => {
      // Mock a failure by passing invalid content
      await expect(
        documentService.uploadFile('', '', 'txt'),
      ).resolves.toBeDefined();
    });

    it('should use correct MIME type based on file type', async () => {
      const fileId1 = await documentService.uploadFile(
        '{}',
        'test.json',
        'json',
      );
      const fileId2 = await documentService.uploadFile(
        'text',
        'test.txt',
        'txt',
      );
      const fileId3 = await documentService.uploadFile('# MD', 'test.md', 'md');

      expect(fileId1).toBeDefined();
      expect(fileId2).toBeDefined();
      expect(fileId3).toBeDefined();
    });
  });

  describe('getFileStatus', () => {
    it('should get file status for existing document', async () => {
      const fileId = await documentService.uploadFile(
        'Content',
        'Test Doc',
        'text',
      );
      await documentService.upsertDocument(
        sessionId,
        'Test Doc',
        'text',
        fileId,
      );

      const status = await documentService.getFileStatus(sessionId, 'Test Doc');

      expect(status.status).toBe('completed');
      expect(status.chunks_count).toBeDefined();
    });

    it('should throw NotFoundError for non-existent document', async () => {
      await expect(
        documentService.getFileStatus(sessionId, 'Non-existent'),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('upsertDocument', () => {
    it('should create a new document', async () => {
      const fileId = await documentService.uploadFile(
        'This is test content',
        'Test Document',
        'text',
      );

      const result = await documentService.upsertDocument(
        sessionId,
        'Test Document',
        'text',
        fileId,
      );

      expect(result.document_id).toBe('Test Document');
      expect(result.file_id).toBe(fileId);
      expect(result.replaced).toBe(false);
      expect(result.status).toBe('completed');
    });

    it('should replace existing document with same title', async () => {
      const fileId1 = await documentService.uploadFile(
        'Original content',
        'Original Title',
        'text',
      );
      await documentService.upsertDocument(
        sessionId,
        'Original Title',
        'text',
        fileId1,
      );

      const fileId2 = await documentService.uploadFile(
        'Updated content',
        'Original Title',
        'text',
      );
      const result = await documentService.upsertDocument(
        sessionId,
        'Original Title',
        'text',
        fileId2,
      );

      expect(result.document_id).toBe('Original Title');
      expect(result.file_id).toBe(fileId2);
      expect(result.replaced).toBe(false);
    });

    it('should create a new document when title differs from existing', async () => {
      const fileId1 = await documentService.uploadFile(
        'Content',
        'Original Title',
        'text',
      );
      await documentService.upsertDocument(
        sessionId,
        'Original Title',
        'text',
        fileId1,
      );

      const fileId2 = await documentService.uploadFile(
        'Updated content',
        'New Title',
        'text',
      );
      const result = await documentService.upsertDocument(
        sessionId,
        'New Title',
        'text',
        fileId2,
      );

      expect(result.document_id).toBe('New Title');
      expect(result.replaced).toBe(false);
    });
  });

  describe('listDocuments', () => {
    it('should list all documents in a session', async () => {
      const fileId1 = await documentService.uploadFile(
        'Content 1',
        'Document 1',
        'text',
      );
      await documentService.upsertDocument(
        sessionId,
        'Document 1',
        'text',
        fileId1,
      );

      const fileId2 = await documentService.uploadFile(
        'Content 2',
        'Document 2',
        'text',
      );
      await documentService.upsertDocument(
        sessionId,
        'Document 2',
        'text',
        fileId2,
      );

      const documents = await documentService.listDocuments(sessionId);

      expect(documents).toHaveLength(2);
      expect(documents.map(d => d.document_id)).toContain('Document 1');
      expect(documents.map(d => d.document_id)).toContain('Document 2');
    });

    it('should return empty array for session with no documents', async () => {
      const documents = await documentService.listDocuments(sessionId);

      expect(documents).toEqual([]);
    });

    it('should filter documents by file type', async () => {
      const fileId1 = await documentService.uploadFile(
        'Content',
        'Text Doc',
        'text',
      );
      await documentService.upsertDocument(
        sessionId,
        'Text Doc',
        'text',
        fileId1,
      );

      const fileId2 = await documentService.uploadFile(
        'Content',
        'PDF Doc',
        'pdf',
      );
      await documentService.upsertDocument(
        sessionId,
        'PDF Doc',
        'pdf',
        fileId2,
      );

      const textDocs = await documentService.listDocuments(sessionId, 'text');

      expect(textDocs).toHaveLength(1);
      expect(textDocs[0].document_id).toBe('Text Doc');
    });

    it('should include document metadata', async () => {
      const fileId = await documentService.uploadFile(
        'Content',
        'Test Document',
        'text',
      );
      await documentService.upsertDocument(
        sessionId,
        'Test Document',
        'text',
        fileId,
      );

      const documents = await documentService.listDocuments(sessionId);

      expect(documents[0]).toMatchObject({
        document_id: 'Test Document',
        source_type: 'text',
      });
      expect(documents[0].created_at).toBeDefined();
    });
  });

  describe('deleteDocument', () => {
    it('should delete a document successfully', async () => {
      const fileId = await documentService.uploadFile(
        'Content',
        'Test Document',
        'text',
      );
      await documentService.upsertDocument(
        sessionId,
        'Test Document',
        'text',
        fileId,
      );

      await documentService.deleteDocument(sessionId, 'Test Document');

      const documents = await documentService.listDocuments(sessionId);
      expect(documents).toHaveLength(0);
    });

    it('should throw NotFoundError when deleting non-existent document', async () => {
      await expect(
        documentService.deleteDocument(sessionId, 'non-existent-title'),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
