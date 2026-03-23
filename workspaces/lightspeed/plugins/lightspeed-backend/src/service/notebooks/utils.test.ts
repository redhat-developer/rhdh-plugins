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
import {
  ConflictError,
  InputError,
  NotAllowedError,
  NotFoundError,
} from '@backstage/errors';

import { Response } from 'express';

import {
  buildVectorStoreMetadata,
  extractSessionFromMetadata,
  handleError,
  sanitizeTitle,
  sendValidationError,
} from './utils';

describe('utils', () => {
  const logger = mockServices.logger.mock();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleError', () => {
    let mockRes: Partial<Response>;
    let mockJson: jest.Mock;
    let mockStatus: jest.Mock;

    beforeEach(() => {
      mockJson = jest.fn().mockReturnThis();
      mockStatus = jest.fn().mockReturnValue({ json: mockJson });
      mockRes = {
        status: mockStatus,
      };
    });

    it('should handle NotAllowedError with 403 status', () => {
      const error = new NotAllowedError('User lacks permission');

      handleError(
        logger,
        mockRes as Response,
        error,
        'Permission check failed',
      );

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        error: 'User lacks permission',
      });
      expect(logger.error).toHaveBeenCalledWith(
        'Permission check failed: User lacks permission',
        error,
      );
    });

    it('should handle NotFoundError with 404 status', () => {
      const error = new NotFoundError('Resource not found');

      handleError(logger, mockRes as Response, error, 'Fetch resource failed');

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        error: 'Resource not found',
      });
    });

    it('should handle InputError with 400 status', () => {
      const error = new InputError('Invalid input data');

      handleError(logger, mockRes as Response, error, 'Validation failed');

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        error: 'Invalid input data',
      });
    });

    it('should handle ConflictError with 409 status', () => {
      const error = new ConflictError('Resource already exists');

      handleError(logger, mockRes as Response, error, 'Create resource failed');

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        error: 'Resource already exists',
      });
    });

    it('should handle generic Error with 500 status', () => {
      const error = new Error('Unexpected error');

      handleError(logger, mockRes as Response, error, 'Operation failed');

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        error: 'Unexpected error',
      });
    });

    it('should handle non-Error objects with 500 status', () => {
      const error = 'String error';

      handleError(logger, mockRes as Response, error, 'Operation failed');

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        error: 'String error',
      });
    });

    it('should handle undefined error', () => {
      const error = undefined;

      handleError(logger, mockRes as Response, error, 'Unknown error');

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        error: 'undefined',
      });
    });

    it('should handle null error', () => {
      const error = null;

      handleError(logger, mockRes as Response, error, 'Null error');

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        error: 'null',
      });
    });

    it('should log error with context message', () => {
      const error = new Error('Test error');
      const contextMessage = 'Context: Operation X failed';

      handleError(logger, mockRes as Response, error, contextMessage);

      expect(logger.error).toHaveBeenCalledWith(
        'Context: Operation X failed: Test error',
        error,
      );
    });

    it('should handle error with empty message', () => {
      const error = new Error('');

      handleError(logger, mockRes as Response, error, 'Operation failed');

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        error: '',
      });
    });

    it('should handle Error subclass instances correctly', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const error = new CustomError('Custom error occurred');

      handleError(
        logger,
        mockRes as Response,
        error,
        'Custom operation failed',
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        error: 'Custom error occurred',
      });
    });

    it('should handle multiple error types in sequence', () => {
      const errors = [
        new NotAllowedError('Permission denied'),
        new NotFoundError('Not found'),
        new InputError('Bad input'),
        new ConflictError('Conflict'),
        new Error('Generic error'),
      ];

      const expectedStatuses = [403, 404, 400, 409, 500];

      errors.forEach((error, index) => {
        mockJson.mockClear();
        mockStatus.mockClear();

        handleError(logger, mockRes as Response, error, 'Test');

        expect(mockStatus).toHaveBeenCalledWith(expectedStatuses[index]);
      });
    });
  });

  describe('sendValidationError', () => {
    let mockRes: Partial<Response>;
    let mockJson: jest.Mock;
    let mockStatus: jest.Mock;

    beforeEach(() => {
      mockJson = jest.fn().mockReturnThis();
      mockStatus = jest.fn().mockReturnValue({ json: mockJson });
      mockRes = {
        status: mockStatus,
      };
    });

    it('should send 400 status with error message', () => {
      sendValidationError(mockRes as Response, 'Field is required');

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        error: 'Field is required',
      });
    });

    it('should handle empty error message', () => {
      sendValidationError(mockRes as Response, '');

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        error: '',
      });
    });

    it('should handle long error messages', () => {
      const longMessage = 'a'.repeat(1000);
      sendValidationError(mockRes as Response, longMessage);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        error: longMessage,
      });
    });

    it('should handle special characters in error message', () => {
      sendValidationError(
        mockRes as Response,
        'Invalid format: "name" must match /^[a-z]+$/',
      );

      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        error: 'Invalid format: "name" must match /^[a-z]+$/',
      });
    });
  });

  describe('sanitizeTitle', () => {
    it('should convert to lowercase', () => {
      expect(sanitizeTitle('My Title')).toBe('my-title');
      expect(sanitizeTitle('UPPERCASE')).toBe('uppercase');
    });

    it('should replace spaces with hyphens', () => {
      expect(sanitizeTitle('hello world')).toBe('hello-world');
      expect(sanitizeTitle('one two three')).toBe('one-two-three');
    });

    it('should replace multiple spaces with single hyphen', () => {
      expect(sanitizeTitle('hello    world')).toBe('hello-world');
    });

    it('should remove special characters', () => {
      expect(sanitizeTitle('hello@world')).toBe('hello-world');
      expect(sanitizeTitle('test!@#$%^&*()')).toBe('test');
      expect(sanitizeTitle('my_file.txt')).toBe('my-file-txt');
    });

    it('should remove leading hyphens', () => {
      expect(sanitizeTitle('---hello')).toBe('hello');
      expect(sanitizeTitle('   hello')).toBe('hello');
    });

    it('should remove trailing hyphens', () => {
      expect(sanitizeTitle('hello---')).toBe('hello');
      expect(sanitizeTitle('hello   ')).toBe('hello');
    });

    it('should remove leading and trailing hyphens', () => {
      expect(sanitizeTitle('---hello---')).toBe('hello');
    });

    it('should handle empty string', () => {
      expect(sanitizeTitle('')).toBe('untitled');
    });

    it('should handle whitespace-only string', () => {
      expect(sanitizeTitle('   ')).toBe('untitled');
    });

    it('should handle string with only special characters', () => {
      expect(sanitizeTitle('!@#$%^&*()')).toBe('untitled');
    });

    it('should preserve numbers', () => {
      expect(sanitizeTitle('test123')).toBe('test123');
      expect(sanitizeTitle('123test')).toBe('123test');
    });

    it('should handle mixed alphanumeric with special chars', () => {
      expect(sanitizeTitle('My Doc v1.2.3')).toBe('my-doc-v1-2-3');
    });

    it('should handle Unicode characters', () => {
      expect(sanitizeTitle('café')).toBe('caf');
      expect(sanitizeTitle('hello 世界')).toBe('hello');
    });

    it('should trim whitespace before processing', () => {
      expect(sanitizeTitle('  hello world  ')).toBe('hello-world');
    });

    it('should handle hyphenated words', () => {
      expect(sanitizeTitle('hello-world')).toBe('hello-world');
    });

    it('should collapse multiple hyphens', () => {
      expect(sanitizeTitle('hello---world')).toBe('hello-world');
    });

    it('should handle real-world titles', () => {
      expect(sanitizeTitle('Project Proposal (Final).docx')).toBe(
        'project-proposal-final-docx',
      );
      expect(sanitizeTitle('Meeting Notes - 2024/01/15')).toBe(
        'meeting-notes-2024-01-15',
      );
      expect(sanitizeTitle('README.md')).toBe('readme-md');
    });
  });

  describe('buildVectorStoreMetadata', () => {
    it('should build metadata from session', () => {
      const session = {
        session_id: 'test-session-id',
        user_id: 'user:default/guest',
        name: 'Test Session',
        description: 'Test description',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        metadata: {
          custom_field: 'test-value',
          another_field: 'another-value',
        },
      };

      const result = buildVectorStoreMetadata(session);

      expect(result).toEqual({
        user_id: 'user:default/guest',
        name: 'Test Session',
        description: 'Test description',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        custom_field: 'test-value',
        another_field: 'another-value',
      });
    });

    it('should handle session without metadata', () => {
      const session = {
        session_id: 'test-session-id',
        user_id: 'user:default/guest',
        name: 'Test Session',
        description: 'Test description',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const result = buildVectorStoreMetadata(session);

      expect(result).toEqual({
        user_id: 'user:default/guest',
        name: 'Test Session',
        description: 'Test description',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      });
    });

    it('should handle session with empty metadata', () => {
      const session = {
        session_id: 'test-session-id',
        user_id: 'user:default/guest',
        name: 'Test Session',
        description: '',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        metadata: {},
      };

      const result = buildVectorStoreMetadata(session);

      expect(result).toEqual({
        user_id: 'user:default/guest',
        name: 'Test Session',
        description: '',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      });
    });

    it('should spread all metadata fields', () => {
      const session = {
        session_id: 'test-session-id',
        user_id: 'user:default/guest',
        name: 'Test Session',
        description: 'Description',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        metadata: {
          document_ids: ['doc1', 'doc2'],
          embedding_model: 'test-model',
          embedding_dimension: 1536,
          provider_id: 'provider-1',
          conversation_id: 'conv-123',
          custom_metadata: 'custom-value',
        },
      };

      const result = buildVectorStoreMetadata(session);

      expect(result.document_ids).toEqual(['doc1', 'doc2']);
      expect(result.embedding_model).toBe('test-model');
      expect(result.embedding_dimension).toBe(1536);
      expect(result.provider_id).toBe('provider-1');
      expect(result.conversation_id).toBe('conv-123');
      expect(result.custom_metadata).toBe('custom-value');
    });
  });

  describe('extractSessionFromMetadata', () => {
    it('should extract session from metadata', () => {
      const sessionId = 'test-session-id';
      const metadata = {
        user_id: 'user:default/guest',
        name: 'Test Session',
        description: 'Test description',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        custom_field: 'custom-value',
        document_ids: ['doc1'],
        embedding_model: 'model-1',
        embedding_dimension: 1536,
        provider_id: 'provider-1',
        conversation_id: 'conv-1',
      };

      const result = extractSessionFromMetadata(sessionId, metadata);

      expect(result).toEqual({
        session_id: 'test-session-id',
        user_id: 'user:default/guest',
        name: 'Test Session',
        description: 'Test description',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        metadata: {
          custom_field: 'custom-value',
          document_ids: ['doc1'],
          embedding_model: 'model-1',
          embedding_dimension: 1536,
          provider_id: 'provider-1',
          conversation_id: 'conv-1',
        },
      });
    });

    it('should handle metadata with undefined nested fields', () => {
      const sessionId = 'test-session-id';
      const metadata = {
        user_id: 'user:default/guest',
        name: 'Test Session',
        description: 'Test description',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const result = extractSessionFromMetadata(sessionId, metadata);

      expect(result.metadata?.document_ids).toBeUndefined();
      expect(result.metadata?.conversation_id).toBeUndefined();
      expect(result.metadata?.embedding_model).toBeUndefined();
    });

    it('should preserve null values in metadata', () => {
      const sessionId = 'test-session-id';
      const metadata = {
        user_id: 'user:default/guest',
        name: 'Test Session',
        description: 'Test description',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        conversation_id: null,
        custom_field: null,
      };

      const result = extractSessionFromMetadata(sessionId, metadata);

      expect(result.metadata?.conversation_id).toBeNull();
      expect(result.metadata?.custom_field).toBeNull();
    });

    it('should handle empty metadata object', () => {
      const sessionId = 'test-session-id';
      const metadata = {
        user_id: 'user:default/guest',
        name: 'Test Session',
        description: '',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const result = extractSessionFromMetadata(sessionId, metadata);

      expect(result.session_id).toBe('test-session-id');
      expect(result.metadata).toBeDefined();
    });
  });
});
