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

import type { NextFunction, Request, Response } from 'express';

import {
  MAX_ATTACHMENT_SIZE_BYTES,
  MAX_QUERY_LENGTH,
  MAX_TOTAL_ATTACHMENTS_SIZE_BYTES,
} from './constant';
import { validateCompletionsRequest } from './validation';

describe('validateCompletionsRequest', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockReq = {
      body: {},
    };
    mockRes = {
      status: statusMock,
    };
    mockNext = jest.fn();
  });

  describe('basic validation', () => {
    it('should reject missing model', () => {
      mockReq.body = {
        provider: 'openai',
        query: 'test query',
      };

      validateCompletionsRequest(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'model is required and must be a non-empty string',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject missing provider', () => {
      mockReq.body = {
        model: 'gpt-4',
        query: 'test query',
      };

      validateCompletionsRequest(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'provider is required and must be a non-empty string',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject missing query', () => {
      mockReq.body = {
        model: 'gpt-4',
        provider: 'openai',
      };

      validateCompletionsRequest(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'query is required and must be a non-empty string',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should pass with valid basic request', () => {
      mockReq.body = {
        model: 'gpt-4',
        provider: 'openai',
        query: 'test query',
      };

      validateCompletionsRequest(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });
  });

  describe('query length validation (RHIDP-13062)', () => {
    it('should reject query exceeding MAX_QUERY_LENGTH', () => {
      const longQuery = 'a'.repeat(MAX_QUERY_LENGTH + 1);
      mockReq.body = {
        model: 'gpt-4',
        provider: 'openai',
        query: longQuery,
      };

      validateCompletionsRequest(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: `query exceeds maximum length of ${MAX_QUERY_LENGTH} characters`,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should pass with query at MAX_QUERY_LENGTH', () => {
      const maxQuery = 'a'.repeat(MAX_QUERY_LENGTH);
      mockReq.body = {
        model: 'gpt-4',
        provider: 'openai',
        query: maxQuery,
      };

      validateCompletionsRequest(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });
  });

  describe('attachment validation (RHIDP-13062)', () => {
    it('should pass with no attachments', () => {
      mockReq.body = {
        model: 'gpt-4',
        provider: 'openai',
        query: 'test query',
      };

      validateCompletionsRequest(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should pass with valid small attachments', () => {
      mockReq.body = {
        model: 'gpt-4',
        provider: 'openai',
        query: 'test query',
        attachments: [
          { name: 'file1.txt', content: 'small content' },
          { name: 'file2.txt', content: 'another small content' },
        ],
      };

      validateCompletionsRequest(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should reject attachment exceeding MAX_ATTACHMENT_SIZE_BYTES', () => {
      // Create content that exceeds the limit (20MB)
      const largeContent = 'a'.repeat(MAX_ATTACHMENT_SIZE_BYTES + 1);
      mockReq.body = {
        model: 'gpt-4',
        provider: 'openai',
        query: 'test query',
        attachments: [{ name: 'large-file.txt', content: largeContent }],
      };

      validateCompletionsRequest(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: `Attachment "large-file.txt" exceeds maximum size of ${MAX_ATTACHMENT_SIZE_BYTES / (1024 * 1024)}MB`,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject total attachments exceeding MAX_TOTAL_ATTACHMENTS_SIZE_BYTES', () => {
      // Create multiple attachments that individually pass but together exceed total limit
      const attachmentSize = 18 * 1024 * 1024; // 18MB each
      const content1 = 'a'.repeat(attachmentSize);
      const content2 = 'b'.repeat(attachmentSize);
      const content3 = 'c'.repeat(attachmentSize);

      mockReq.body = {
        model: 'gpt-4',
        provider: 'openai',
        query: 'test query',
        attachments: [
          { name: 'file1.txt', content: content1 },
          { name: 'file2.txt', content: content2 },
          { name: 'file3.txt', content: content3 },
        ],
      };

      validateCompletionsRequest(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: `Total attachments size exceeds maximum of ${MAX_TOTAL_ATTACHMENTS_SIZE_BYTES / (1024 * 1024)}MB`,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle attachments with empty content', () => {
      mockReq.body = {
        model: 'gpt-4',
        provider: 'openai',
        query: 'test query',
        attachments: [
          { name: 'empty.txt', content: '' },
          { name: 'file.txt', content: 'some content' },
        ],
      };

      validateCompletionsRequest(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should handle attachments without content field', () => {
      mockReq.body = {
        model: 'gpt-4',
        provider: 'openai',
        query: 'test query',
        attachments: [{ name: 'file.txt' }],
      };

      validateCompletionsRequest(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });
  });
});
