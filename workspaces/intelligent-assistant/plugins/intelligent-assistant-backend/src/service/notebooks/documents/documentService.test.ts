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
import { ConflictError, NotFoundError } from '@backstage/errors';

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
        'intelligent-assistant': {
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
    sessionService = new SessionService(operator, logger);

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
      );

      expect(fileId).toBeDefined();
      expect(fileId).toMatch(/^file-/);
    });

    it('should handle upload errors', async () => {
      // Mock a failure by passing invalid content
      await expect(documentService.uploadFile('', '')).resolves.toBeDefined();
    });

    it('should use correct MIME type based on file type', async () => {
      const fileId1 = await documentService.uploadFile('{}', 'test.json');
      const fileId2 = await documentService.uploadFile('text', 'test.txt');
      const fileId3 = await documentService.uploadFile('# MD', 'test.md');

      expect(fileId1).toBeDefined();
      expect(fileId2).toBeDefined();
      expect(fileId3).toBeDefined();
    });
  });

  describe('getFileStatus', () => {
    it('should get file status for existing document', async () => {
      const fileId = await documentService.uploadFile('Content', 'Test Doc');
      await documentService.upsertDocument(sessionId, 'Test Doc', {
        fileType: 'text',
        fileId,
      });

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
      );

      const result = await documentService.upsertDocument(
        sessionId,
        'Test Document',
        { fileType: 'text', fileId },
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
      );
      await documentService.upsertDocument(sessionId, 'Original Title', {
        fileType: 'text',
        fileId: fileId1,
      });

      const fileId2 = await documentService.uploadFile(
        'Updated content',
        'Original Title',
      );
      const result = await documentService.upsertDocument(
        sessionId,
        'Original Title',
        { fileType: 'text', fileId: fileId2 },
      );

      expect(result.document_id).toBe('Original Title');
      expect(result.file_id).toBe(fileId2);
      expect(result.replaced).toBe(true);
    });

    it('should create a new document when title differs from existing', async () => {
      const fileId1 = await documentService.uploadFile(
        'Content',
        'Original Title',
      );
      await documentService.upsertDocument(sessionId, 'Original Title', {
        fileType: 'text',
        fileId: fileId1,
      });

      const fileId2 = await documentService.uploadFile(
        'Updated content',
        'New Title',
      );
      const result = await documentService.upsertDocument(
        sessionId,
        'New Title',
        { fileType: 'text', fileId: fileId2 },
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
      );
      await documentService.upsertDocument(sessionId, 'Document 1', {
        fileType: 'text',
        fileId: fileId1,
      });

      const fileId2 = await documentService.uploadFile(
        'Content 2',
        'Document 2',
      );
      await documentService.upsertDocument(sessionId, 'Document 2', {
        fileType: 'text',
        fileId: fileId2,
      });

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
      const fileId1 = await documentService.uploadFile('Content', 'Text Doc');
      await documentService.upsertDocument(sessionId, 'Text Doc', {
        fileType: 'text',
        fileId: fileId1,
      });

      const fileId2 = await documentService.uploadFile('Content', 'PDF Doc');
      await documentService.upsertDocument(sessionId, 'PDF Doc', {
        fileType: 'pdf',
        fileId: fileId2,
      });

      const textDocs = await documentService.listDocuments(sessionId, 'text');

      expect(textDocs).toHaveLength(1);
      expect(textDocs[0].document_id).toBe('Text Doc');
    });

    it('should include document metadata', async () => {
      const fileId = await documentService.uploadFile(
        'Content',
        'Test Document',
      );
      await documentService.upsertDocument(sessionId, 'Test Document', {
        fileType: 'text',
        fileId,
      });

      const documents = await documentService.listDocuments(sessionId);

      expect(documents[0]).toMatchObject({
        document_id: 'Test Document',
        source_type: 'text',
      });
      expect(documents[0].created_at).toBeDefined();
    });
  });

  describe('renameDocument (via upsertDocument)', () => {
    it('should rename a document successfully', async () => {
      const fileId = await documentService.uploadFile(
        'Content',
        'Original Name',
      );
      await documentService.upsertDocument(sessionId, 'Original Name', {
        fileType: 'text',
        fileId,
      });

      await documentService.upsertDocument(sessionId, 'Original Name', {
        newTitle: 'New Name',
      });

      const documents = await documentService.listDocuments(sessionId);
      expect(documents).toHaveLength(1);
      expect(documents[0].document_id).toBe('New Name');
    });

    it('should throw NotFoundError for non-existent document when fileId is omitted', async () => {
      await expect(
        documentService.upsertDocument(sessionId, 'Non-existent', {
          newTitle: 'New Name',
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError when new title already exists', async () => {
      const fileId1 = await documentService.uploadFile('Content 1', 'Doc A');
      await documentService.upsertDocument(sessionId, 'Doc A', {
        fileType: 'text',
        fileId: fileId1,
      });

      const fileId2 = await documentService.uploadFile('Content 2', 'Doc B');
      await documentService.upsertDocument(sessionId, 'Doc B', {
        fileType: 'text',
        fileId: fileId2,
      });

      await expect(
        documentService.upsertDocument(sessionId, 'Doc A', {
          newTitle: 'Doc B',
        }),
      ).rejects.toThrow(ConflictError);
    });

    it('should preserve other documents when renaming', async () => {
      const fileId1 = await documentService.uploadFile('Content 1', 'Doc A');
      await documentService.upsertDocument(sessionId, 'Doc A', {
        fileType: 'text',
        fileId: fileId1,
      });

      const fileId2 = await documentService.uploadFile('Content 2', 'Doc B');
      await documentService.upsertDocument(sessionId, 'Doc B', {
        fileType: 'text',
        fileId: fileId2,
      });

      await documentService.upsertDocument(sessionId, 'Doc A', {
        newTitle: 'Doc A Renamed',
      });

      const documents = await documentService.listDocuments(sessionId);
      expect(documents).toHaveLength(2);
      expect(documents.map(d => d.document_id)).toContain('Doc A Renamed');
      expect(documents.map(d => d.document_id)).toContain('Doc B');
    });

    it('should rollback when re-create fails after delete', async () => {
      const fileId = await documentService.uploadFile(
        'Content',
        'Rollback Doc',
      );
      await documentService.upsertDocument(sessionId, 'Rollback Doc', {
        fileType: 'text',
        fileId,
      });

      // Spy on the vector store files.create to fail on the second call (re-create)
      const createSpy = jest.spyOn(operator.vectorStores.files, 'create');
      createSpy.mockRejectedValueOnce(new Error('Simulated create failure'));

      await expect(
        documentService.upsertDocument(sessionId, 'Rollback Doc', {
          newTitle: 'Should Fail',
        }),
      ).rejects.toThrow('Simulated create failure');

      // Document should still be accessible under its original name after rollback
      const documents = await documentService.listDocuments(sessionId);
      expect(documents).toHaveLength(1);
      expect(documents[0].document_id).toBe('Rollback Doc');

      createSpy.mockRestore();
    });
  });

  describe('deleteDocument', () => {
    it('should delete a document successfully', async () => {
      const fileId = await documentService.uploadFile(
        'Content',
        'Test Document',
      );
      await documentService.upsertDocument(sessionId, 'Test Document', {
        fileType: 'text',
        fileId,
      });

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
