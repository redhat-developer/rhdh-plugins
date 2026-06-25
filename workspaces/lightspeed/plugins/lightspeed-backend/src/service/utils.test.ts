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

import { DEFAULT_HISTORY_LENGTH } from './constant';
import {
  handleLCSFetchError,
  rewriteLightspeedProxyPath,
  sanitizeLCSError,
} from './utils';

describe('sanitizeLCSError', () => {
  const mockLogger = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    child: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return generic error message to client', () => {
    const errorBody = {
      error: {
        message:
          'Model gpt-4-0613 failed with OpenAI API error: rate limit exceeded',
      },
      detail: {
        cause: 'OpenAIError: Rate limit reached',
      },
    };

    const result = sanitizeLCSError(errorBody, mockLogger, 'processing query');

    expect(result).toBe(
      'Error from lightspeed-core server while processing query',
    );
  });

  it('should log full error details server-side', () => {
    const errorBody = {
      error: {
        message: 'Database connection failed',
      },
      detail: {
        cause: 'PostgreSQL connection timeout',
      },
    };

    sanitizeLCSError(errorBody, mockLogger, 'sending feedback');

    expect(mockLogger.error).toHaveBeenCalledWith(
      `Error from lightspeed-core server while sending feedback: ${JSON.stringify(errorBody)}`,
    );
  });

  it('should not expose internal details in return value', () => {
    const errorBody = {
      error: {
        message:
          'Model gpt-4-0613 failed with organization org-abc123 rate limit',
      },
      detail: {
        cause: 'OpenAIError',
        provider: 'openai',
        model_id: 'gpt-4-0613',
      },
    };

    const result = sanitizeLCSError(
      errorBody,
      mockLogger,
      'interrupting query',
    );

    expect(result).not.toContain('gpt-4');
    expect(result).not.toContain('org-abc123');
    expect(result).not.toContain('openai');
    expect(result).not.toContain('OpenAIError');
  });

  it('should handle empty error body', () => {
    const errorBody = {};

    const result = sanitizeLCSError(
      errorBody,
      mockLogger,
      'updating conversation',
    );

    expect(result).toBe(
      'Error from lightspeed-core server while updating conversation',
    );
    expect(mockLogger.error).toHaveBeenCalled();
  });
});

describe('handleLCSFetchError', () => {
  const mockLogger = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    child: jest.fn(),
  };

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle fetch response with JSON body', async () => {
    const mockFetchResponse = {
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({
        error: { message: 'Database error' },
      }),
    } as unknown as Response;

    await handleLCSFetchError(
      mockFetchResponse,
      mockLogger,
      'processing query',
      mockResponse,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Error from lightspeed-core server while processing query',
    });
  });

  it('should handle fetch response without JSON body', async () => {
    const mockFetchResponse = {
      ok: false,
      status: 503,
      json: jest.fn().mockRejectedValue(new Error('Not JSON')),
    } as unknown as Response;

    await handleLCSFetchError(
      mockFetchResponse,
      mockLogger,
      'sending feedback',
      mockResponse,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(503);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Error from lightspeed-core server while sending feedback',
    });
    expect(mockLogger.error).toHaveBeenCalled();
  });
});

const userRef = 'user:default/test-user';

describe('rewriteLightspeedProxyPath', () => {
  it.each(['/v1/models', '/v1/shields'])(
    'returns path unchanged for skip endpoint %s',
    path => {
      expect(rewriteLightspeedProxyPath(path, userRef)).toBe(path);
    },
  );

  it('appends user_id to a path without query params', () => {
    const result = rewriteLightspeedProxyPath('/v2/conversations', userRef);
    expect(result).toBe(
      `/v2/conversations?user_id=${encodeURIComponent(userRef)}`,
    );
  });

  it('appends user_id with & when query params already exist', () => {
    const result = rewriteLightspeedProxyPath(
      '/v2/conversations?foo=bar',
      userRef,
    );
    expect(result).toBe(
      `/v2/conversations?foo=bar&user_id=${encodeURIComponent(userRef)}`,
    );
  });

  it('appends history_length when conversation_id is in the path', () => {
    const result = rewriteLightspeedProxyPath(
      '/v2/conversations/conversation_id_123',
      userRef,
    );
    expect(result).toContain(`user_id=${encodeURIComponent(userRef)}`);
    expect(result).toContain(`history_length=${DEFAULT_HISTORY_LENGTH}`);
  });

  it('does not append history_length when already present', () => {
    const result = rewriteLightspeedProxyPath(
      '/v2/conversations/conversation_id_123?history_length=5',
      userRef,
    );
    expect(result).toContain(`user_id=${encodeURIComponent(userRef)}`);
    expect(result).not.toContain(`history_length=${DEFAULT_HISTORY_LENGTH}`);
  });

  it('does not append history_length when no conversation_id in path', () => {
    const result = rewriteLightspeedProxyPath('/v1/feedback', userRef);
    expect(result).toContain(`user_id=${encodeURIComponent(userRef)}`);
    expect(result).not.toContain('history_length');
  });
});
