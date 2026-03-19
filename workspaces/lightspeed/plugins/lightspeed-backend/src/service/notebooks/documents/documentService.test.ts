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
  LLAMA_STACK_ADDR,
  llamaStackHandlers,
  resetMockStorage,
} from '../../../../__fixtures__/llamaStackHandlers';
import { SessionService } from '../sessions/sessionService';
import { DocumentService } from './documentService';

describe('DocumentService', () => {
  const server = setupServer(...llamaStackHandlers);
  const logger = mockServices.logger.mock();
  const mockUserId = 'user:default/guest';

  let documentService: DocumentService;
  let sessionService: SessionService;
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
    documentService = new DocumentService(LLAMA_STACK_ADDR, logger);
    sessionService = new SessionService(LLAMA_STACK_ADDR, logger);

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

  describe('upsertDocument', () => {
    it('should create a new document', async () => {
      const result = await documentService.upsertDocument(
        sessionId,
        mockUserId,
        'Test Document',
        'This is test content',
        { fileType: 'text' },
      );

      expect(result.document_id).toBe('test-document');
      expect(result.file_id).toBeDefined();
      expect(result.replaced).toBe(false);
      expect(result.status).toBe('completed');
    });

    it('should sanitize document title to create ID', async () => {
      const result = await documentService.upsertDocument(
        sessionId,
        mockUserId,
        'Test Document With Spaces & Special!',
        'Content',
      );

      expect(result.document_id).toBe('test-document-with-spaces-special');
    });

    it('should throw ConflictError when creating duplicate document', async () => {
      await documentService.upsertDocument(
        sessionId,
        mockUserId,
        'Test Document',
        'Content 1',
      );

      await expect(
        documentService.upsertDocument(
          sessionId,
          mockUserId,
          'Test Document',
          'Content 2',
        ),
      ).rejects.toThrow(ConflictError);
    });

    it('should update existing document when currentDocumentId provided', async () => {
      const created = await documentService.upsertDocument(
        sessionId,
        mockUserId,
        'Original Title',
        'Original content',
      );

      const result = await documentService.upsertDocument(
        sessionId,
        mockUserId,
        'Original Title',
        'Updated content',
        undefined,
        created.document_id,
      );

      expect(result.document_id).toBe('original-title');
      expect(result.replaced).toBe(true);
    });

    it('should handle title change during update', async () => {
      const created = await documentService.upsertDocument(
        sessionId,
        mockUserId,
        'Original Title',
        'Content',
      );

      const result = await documentService.upsertDocument(
        sessionId,
        mockUserId,
        'New Title',
        'Updated content',
        undefined,
        created.document_id,
      );

      expect(result.document_id).toBe('new-title');
      expect(result.replaced).toBe(true);
    });

    it('should throw NotFoundError when updating non-existent document', async () => {
      await expect(
        documentService.upsertDocument(
          sessionId,
          mockUserId,
          'New Title',
          'Content',
          undefined,
          'non-existent-id',
        ),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError when renaming to existing document title', async () => {
      await documentService.upsertDocument(
        sessionId,
        mockUserId,
        'Document 1',
        'Content 1',
      );

      const doc2 = await documentService.upsertDocument(
        sessionId,
        mockUserId,
        'Document 2',
        'Content 2',
      );

      await expect(
        documentService.upsertDocument(
          sessionId,
          mockUserId,
          'Document 1',
          'Updated content',
          undefined,
          doc2.document_id,
        ),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('listDocuments', () => {
    it('should list all documents in a session', async () => {
      await documentService.upsertDocument(
        sessionId,
        mockUserId,
        'Document 1',
        'Content 1',
      );
      await documentService.upsertDocument(
        sessionId,
        mockUserId,
        'Document 2',
        'Content 2',
      );

      const documents = await documentService.listDocuments(
        sessionId,
        mockUserId,
      );

      expect(documents).toHaveLength(2);
      expect(documents.map(d => d.title)).toContain('Document 1');
      expect(documents.map(d => d.title)).toContain('Document 2');
    });

    it('should return empty array for session with no documents', async () => {
      const documents = await documentService.listDocuments(
        sessionId,
        mockUserId,
      );

      expect(documents).toEqual([]);
    });

    it('should filter documents by file type', async () => {
      await documentService.upsertDocument(
        sessionId,
        mockUserId,
        'Text Doc',
        'Content',
        { fileType: 'text' },
      );
      await documentService.upsertDocument(
        sessionId,
        mockUserId,
        'PDF Doc',
        'Content',
        { fileType: 'pdf' },
      );

      const textDocs = await documentService.listDocuments(
        sessionId,
        mockUserId,
        'text',
      );

      expect(textDocs).toHaveLength(1);
      expect(textDocs[0].title).toBe('Text Doc');
    });

    it('should include document metadata', async () => {
      await documentService.upsertDocument(
        sessionId,
        mockUserId,
        'Test Document',
        'Content',
        { fileType: 'text' },
      );

      const documents = await documentService.listDocuments(
        sessionId,
        mockUserId,
      );

      expect(documents[0]).toMatchObject({
        document_id: 'test-document',
        title: 'Test Document',
        session_id: sessionId,
        user_id: mockUserId,
        source_type: 'text',
      });
      expect(documents[0].created_at).toBeDefined();
    });
  });

  describe('deleteDocument', () => {
    it('should delete a document successfully', async () => {
      const created = await documentService.upsertDocument(
        sessionId,
        mockUserId,
        'Test Document',
        'Content',
      );

      await documentService.deleteDocument(sessionId, created.document_id);

      const documents = await documentService.listDocuments(
        sessionId,
        mockUserId,
      );
      expect(documents).toHaveLength(0);
    });

    it('should throw NotFoundError when deleting non-existent document', async () => {
      await expect(
        documentService.deleteDocument(sessionId, 'non-existent-id'),
      ).rejects.toThrow(NotFoundError);
    });

    it('should remove document from session metadata', async () => {
      const doc1 = await documentService.upsertDocument(
        sessionId,
        mockUserId,
        'Document 1',
        'Content 1',
      );
      await documentService.upsertDocument(
        sessionId,
        mockUserId,
        'Document 2',
        'Content 2',
      );

      // Wait for background metadata updates to complete
      // Poll until both documents appear in metadata
      const maxWaitMs = 2000;
      const startTime = Date.now();
      while (Date.now() - startTime < maxWaitMs) {
        const session = await sessionService.readSession(sessionId, mockUserId);
        const docIds = session.metadata?.document_ids || [];
        if (docIds.length === 2) {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await documentService.deleteDocument(sessionId, doc1.document_id);

      const session = await sessionService.readSession(sessionId, mockUserId);
      expect(session.metadata?.document_ids).not.toContain(doc1.document_id);
      expect(session.metadata?.document_ids).toContain('document-2');
    });
  });
});
