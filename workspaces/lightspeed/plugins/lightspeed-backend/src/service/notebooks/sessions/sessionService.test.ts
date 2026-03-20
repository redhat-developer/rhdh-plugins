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
import { NotAllowedError } from '@backstage/errors';

import { setupServer } from 'msw/node';

import {
  LLAMA_STACK_ADDR,
  llamaStackHandlers,
  resetMockStorage,
} from '../../../../__fixtures__/llamaStackHandlers';
import { SessionService } from './sessionService';

describe('SessionService', () => {
  const server = setupServer(...llamaStackHandlers);
  const logger = mockServices.logger.mock();
  const mockUserId = 'user:default/guest';
  const mockUserId2 = 'user:default/other';

  let service: SessionService;

  beforeAll(() => {
    // ERROR on unhandled requests to catch any real HTTP calls
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    resetMockStorage();
    service = new SessionService(LLAMA_STACK_ADDR, logger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create a new session successfully', async () => {
      const session = await service.createSession(
        mockUserId,
        'Test Session',
        'Test description',
      );

      expect(session).toBeDefined();
      expect(session.session_id).toBeDefined();
      expect(session.session_id).toMatch(/^vs-/);
      expect(session.user_id).toBe(mockUserId);
      expect(session.name).toBe('Test Session');
      expect(session.description).toBe('Test description');
      expect(session.created_at).toBeDefined();
      expect(session.updated_at).toBeDefined();
      expect(session.metadata?.document_ids).toEqual([]);
      expect(session.metadata?.conversation_id).toBeNull();
    });

    it('should create session with custom metadata', async () => {
      const session = await service.createSession(
        mockUserId,
        'Test Session',
        'Test description',
        {
          category: 'test-category',
          project: 'test-project',
        },
      );

      expect(session.metadata?.category).toBe('test-category');
      expect(session.metadata?.project).toBe('test-project');
    });

    it('should create session with default empty description', async () => {
      const session = await service.createSession(mockUserId, 'Test Session');

      expect(session.description).toBe('');
    });
  });

  describe('readSession', () => {
    it('should read an existing session', async () => {
      const created = await service.createSession(
        mockUserId,
        'Test Session',
        'Test description',
      );

      const session = await service.readSession(created.session_id, mockUserId);

      expect(session.session_id).toBe(created.session_id);
      expect(session.user_id).toBe(mockUserId);
      expect(session.name).toBe('Test Session');
      expect(session.description).toBe('Test description');
    });

    it('should throw error for non-existent session', async () => {
      await expect(
        service.readSession('non-existent-id', mockUserId),
      ).rejects.toThrow();
    });

    it('should throw NotAllowedError when user does not own the session', async () => {
      const created = await service.createSession(
        mockUserId,
        'Test Session',
        'Test description',
      );

      await expect(
        service.readSession(created.session_id, mockUserId2),
      ).rejects.toThrow(NotAllowedError);
    });
  });

  describe('updateSession', () => {
    it('should update session name', async () => {
      const created = await service.createSession(
        mockUserId,
        'Original Name',
        'Original description',
      );

      const updated = await service.updateSession(
        created.session_id,
        mockUserId,
        'Updated Name',
      );

      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('Original description');
      expect(updated.updated_at).not.toBe(created.updated_at);
    });

    it('should update session description', async () => {
      const created = await service.createSession(
        mockUserId,
        'Test Session',
        'Original description',
      );

      const updated = await service.updateSession(
        created.session_id,
        mockUserId,
        undefined,
        'Updated description',
      );

      expect(updated.name).toBe('Test Session');
      expect(updated.description).toBe('Updated description');
    });

    it('should update session metadata', async () => {
      const created = await service.createSession(
        mockUserId,
        'Test Session',
        'Test description',
        { category: 'old' },
      );

      const updated = await service.updateSession(
        created.session_id,
        mockUserId,
        undefined,
        undefined,
        { category: 'new', conversation_id: 'conv-123' },
      );

      expect(updated.metadata?.category).toBe('new');
      expect(updated.metadata?.conversation_id).toBe('conv-123');
    });

    it('should throw NotAllowedError when updating other users session', async () => {
      const created = await service.createSession(
        mockUserId,
        'Test Session',
        'Test description',
      );

      await expect(
        service.updateSession(created.session_id, mockUserId2, 'New Name'),
      ).rejects.toThrow(NotAllowedError);
    });
  });

  describe('deleteSession', () => {
    it('should delete a session successfully', async () => {
      const created = await service.createSession(
        mockUserId,
        'Test Session',
        'Test description',
      );

      await service.deleteSession(created.session_id, mockUserId);

      await expect(
        service.readSession(created.session_id, mockUserId),
      ).rejects.toThrow();
    });

    it('should throw NotAllowedError when deleting other users session', async () => {
      const created = await service.createSession(
        mockUserId,
        'Test Session',
        'Test description',
      );

      await expect(
        service.deleteSession(created.session_id, mockUserId2),
      ).rejects.toThrow(NotAllowedError);
    });
  });

  describe('listSessions', () => {
    it('should list all sessions for a user', async () => {
      await service.createSession(mockUserId, 'Session 1', 'Description 1');
      await new Promise(resolve => setTimeout(resolve, 10));
      await service.createSession(mockUserId, 'Session 2', 'Description 2');
      await service.createSession(mockUserId2, 'Other Session', 'Other');

      const sessions = await service.listSessions(mockUserId);

      expect(sessions).toHaveLength(2);
      expect(sessions[0].name).toBe('Session 2'); // Newest first
      expect(sessions[1].name).toBe('Session 1');
    });

    it('should return empty array when user has no sessions', async () => {
      const sessions = await service.listSessions('user:default/nosessions');

      expect(sessions).toEqual([]);
    });

    it('should sort sessions by created_at descending', async () => {
      const session1 = await service.createSession(
        mockUserId,
        'First',
        'First',
      );
      await new Promise(resolve => setTimeout(resolve, 10));
      const session2 = await service.createSession(
        mockUserId,
        'Second',
        'Second',
      );
      await new Promise(resolve => setTimeout(resolve, 10));
      const session3 = await service.createSession(
        mockUserId,
        'Third',
        'Third',
      );

      const sessions = await service.listSessions(mockUserId);

      expect(sessions).toHaveLength(3);
      expect(sessions[0].session_id).toBe(session3.session_id);
      expect(sessions[1].session_id).toBe(session2.session_id);
      expect(sessions[2].session_id).toBe(session1.session_id);
    });
  });
});
