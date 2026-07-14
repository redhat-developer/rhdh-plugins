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

import { ModelCapabilitiesCache } from './attachment-validation';
import {
  MAX_ATTACHMENT_SIZE_BYTES,
  MAX_QUERY_LENGTH,
  MAX_TOTAL_ATTACHMENTS_SIZE_BYTES,
} from './constant';
import {
  validateAttachmentsForModel,
  validateCompletionsRequest,
} from './validation';

describe('validateCompletionsRequest', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  const callValidate = () =>
    validateCompletionsRequest(
      mockReq as Request,
      mockRes as Response,
      mockNext,
    );

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

      callValidate();

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

      callValidate();

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

      callValidate();

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

      callValidate();

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });
  });

  describe('query length validation', () => {
    it('should reject query exceeding MAX_QUERY_LENGTH', () => {
      const longQuery = 'a'.repeat(MAX_QUERY_LENGTH + 1);
      mockReq.body = {
        model: 'gpt-4',
        provider: 'openai',
        query: longQuery,
      };

      callValidate();

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

      callValidate();

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });
  });

  describe('attachment passthrough', () => {
    it('should pass with no attachments', () => {
      mockReq.body = {
        model: 'gpt-4',
        provider: 'openai',
        query: 'test query',
      };

      callValidate();

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should pass with attachments (size validation is in validateAttachmentsForModel)', () => {
      mockReq.body = {
        model: 'gpt-4',
        provider: 'openai',
        query: 'test query',
        attachments: [
          {
            attachment_type: 'dom',
            content_type: 'text/html',
            content: 'small content',
          },
        ],
      };

      callValidate();

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });
  });
});

describe('validateAttachmentsForModel', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockReq = { body: {} };
    mockRes = { status: statusMock } as unknown as Partial<Response>;
    mockNext = jest.fn();
  });

  function callValidate() {
    validateAttachmentsForModel(
      mockReq as Request,
      mockRes as Response,
      mockNext,
    );
  }

  it('should pass with no attachments', () => {
    mockReq.body = { model: 'gpt-4' };
    callValidate();
    expect(mockNext).toHaveBeenCalled();
  });

  it('should pass with empty attachments', () => {
    mockReq.body = { model: 'gpt-4', attachments: [] };
    callValidate();
    expect(mockNext).toHaveBeenCalled();
  });

  it('should reject attachment exceeding MAX_ATTACHMENT_SIZE_BYTES', () => {
    const largeContent = 'a'.repeat(MAX_ATTACHMENT_SIZE_BYTES + 1);
    mockReq.body = {
      model: 'gpt-4',
      attachments: [
        {
          attachment_type: 'dom',
          content_type: 'text/html',
          content: largeContent,
        },
      ],
    };

    callValidate();

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error: `Attachment with type "dom" exceeds maximum size of ${MAX_ATTACHMENT_SIZE_BYTES / (1024 * 1024)}MB`,
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should reject total attachments exceeding MAX_TOTAL_ATTACHMENTS_SIZE_BYTES', () => {
    const attachmentSize = 18 * 1024 * 1024;
    const content1 = 'a'.repeat(attachmentSize);
    const content2 = 'b'.repeat(attachmentSize);
    const content3 = 'c'.repeat(attachmentSize);

    mockReq.body = {
      model: 'gpt-4',
      attachments: [
        {
          attachment_type: 'dom',
          content_type: 'text/html',
          content: content1,
        },
        {
          attachment_type: 'dom',
          content_type: 'text/html',
          content: content2,
        },
        {
          attachment_type: 'dom',
          content_type: 'text/html',
          content: content3,
        },
      ],
    };

    callValidate();

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error: `Total attachments size exceeds maximum of ${MAX_TOTAL_ATTACHMENTS_SIZE_BYTES / (1024 * 1024)}MB`,
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle attachments with empty content', () => {
    mockReq.body = {
      model: 'gpt-4',
      attachments: [
        { attachment_type: 'dom', content_type: 'text/html', content: '' },
      ],
    };

    callValidate();

    expect(mockNext).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });

  describe('image magic byte verification', () => {
    const VALID_JPEG_B64 = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10,
    ]).toString('base64');
    const INVALID_IMAGE_B64 = Buffer.from('Hello world').toString('base64');

    beforeEach(() => {
      ModelCapabilitiesCache.set('openai/gpt-4', true);
    });

    afterEach(() => {
      ModelCapabilitiesCache.clear();
    });

    it('should accept image with valid JPEG magic bytes', () => {
      mockReq.body = {
        model: 'gpt-4',
        provider: 'openai',
        attachments: [
          {
            attachment_type: 'image',
            content_type: 'image/jpeg',
            content: VALID_JPEG_B64,
          },
        ],
      };

      callValidate();

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should accept image with data URL prefix', () => {
      mockReq.body = {
        model: 'gpt-4',
        provider: 'openai',
        attachments: [
          {
            attachment_type: 'image',
            content_type: 'image/jpeg',
            content: `data:image/jpeg;base64,${VALID_JPEG_B64}`,
          },
        ],
      };

      callValidate();

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should reject image with invalid magic bytes', () => {
      mockReq.body = {
        model: 'gpt-4',
        provider: 'openai',
        attachments: [
          {
            attachment_type: 'image',
            content_type: 'image/jpeg',
            content: INVALID_IMAGE_B64,
          },
        ],
      };

      callValidate();

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Image attachment does not contain a valid JPEG file',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should skip magic byte check for non-image attachments', () => {
      mockReq.body = {
        model: 'gpt-4',
        provider: 'openai',
        attachments: [
          {
            attachment_type: 'api object',
            content_type: 'text/plain',
            content: INVALID_IMAGE_B64,
          },
        ],
      };

      callValidate();

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });
  });

  describe('JSON content validation', () => {
    it('should accept valid JSON content', () => {
      mockReq.body = {
        model: 'gpt-4',
        attachments: [
          {
            attachment_type: 'api object',
            content_type: 'application/json',
            content: '{"key": "value", "nested": {"a": 1}}',
          },
        ],
      };

      callValidate();

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should reject invalid JSON content', () => {
      mockReq.body = {
        model: 'gpt-4',
        attachments: [
          {
            attachment_type: 'api object',
            content_type: 'application/json',
            content: '{invalid json content',
          },
        ],
      };

      callValidate();

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error:
          'Attachment with content_type "application/json" contains invalid JSON',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should skip JSON validation for non-JSON content types', () => {
      mockReq.body = {
        model: 'gpt-4',
        attachments: [
          {
            attachment_type: 'api object',
            content_type: 'text/plain',
            content: 'this is not json and that is fine',
          },
        ],
      };

      callValidate();

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should skip JSON validation for empty content', () => {
      mockReq.body = {
        model: 'gpt-4',
        attachments: [
          {
            attachment_type: 'api object',
            content_type: 'application/json',
            content: '',
          },
        ],
      };

      callValidate();

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });
  });
});
