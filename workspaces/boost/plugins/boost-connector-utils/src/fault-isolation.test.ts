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

import {
  createProviderWrapper,
  createSafeRefresh,
  classifyConnectorError,
} from './fault-isolation';

function createMockLogger() {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  };
}

function createMockProvider(
  name: string,
  connectFn: (connection: unknown) => Promise<void> = async () => {},
) {
  return {
    getProviderName: () => name,
    connect: connectFn,
  };
}

describe('classifyConnectorError', () => {
  it.each([
    ['ECONNREFUSED', 'Connection refused'],
    ['ECONNRESET', 'Connection reset'],
    ['ETIMEDOUT', 'Timed out'],
    ['EPIPE', 'Broken pipe'],
    ['EAI_AGAIN', 'DNS lookup timed out'],
  ])('classifies %s as retryable', (code, message) => {
    const error = new Error(message);
    (error as NodeJS.ErrnoException).code = code;
    expect(classifyConnectorError(error)).toBe(true);
  });

  it('classifies HTTP 503 as retryable', () => {
    const error = new Error('Service Unavailable') as Error & {
      status: number;
    };
    error.status = 503;
    expect(classifyConnectorError(error)).toBe(true);
  });

  it('classifies HTTP 429 as retryable', () => {
    const error = new Error('Too Many Requests') as Error & {
      statusCode: number;
    };
    error.statusCode = 429;
    expect(classifyConnectorError(error)).toBe(true);
  });

  it('classifies HTTP 401 as non-retryable', () => {
    const error = new Error('Unauthorized') as Error & { status: number };
    error.status = 401;
    expect(classifyConnectorError(error)).toBe(false);
  });

  it('classifies HTTP 404 as non-retryable', () => {
    const error = new Error('Not Found') as Error & { status: number };
    error.status = 404;
    expect(classifyConnectorError(error)).toBe(false);
  });

  it('classifies axios-shaped response.status 503 as retryable', () => {
    const error = new Error('Request failed with status 503') as Error & {
      response: { status: number };
    };
    error.response = { status: 503 };
    expect(classifyConnectorError(error)).toBe(true);
  });

  it('classifies axios-shaped response.status 401 as non-retryable', () => {
    const error = new Error('Request failed with status 401') as Error & {
      response: { status: number };
    };
    error.response = { status: 401 };
    expect(classifyConnectorError(error)).toBe(false);
  });

  it('classifies bare TypeError as non-retryable', () => {
    const error = new TypeError('Invalid URL');
    expect(classifyConnectorError(error)).toBe(false);
  });

  it.each([
    ['ECONNREFUSED', true],
    ['ETIMEDOUT', true],
    ['CERT_HAS_EXPIRED', false],
  ])(
    'classifies TypeError with cause.code=%s as retryable=%s (native fetch)',
    (causeCode, expectedRetryable) => {
      const cause = new Error(`cause ${causeCode}`);
      (cause as NodeJS.ErrnoException).code = causeCode;
      const error = new TypeError('fetch failed', { cause });
      expect(classifyConnectorError(error)).toBe(expectedRetryable);
    },
  );

  it('classifies SyntaxError as non-retryable', () => {
    const error = new SyntaxError('Unexpected token');
    expect(classifyConnectorError(error)).toBe(false);
  });

  it('classifies CERT_HAS_EXPIRED as non-retryable', () => {
    const error = new Error('certificate has expired');
    (error as NodeJS.ErrnoException).code = 'CERT_HAS_EXPIRED';
    expect(classifyConnectorError(error)).toBe(false);
  });

  it('classifies UNABLE_TO_VERIFY_LEAF_SIGNATURE as non-retryable', () => {
    const error = new Error('unable to verify leaf signature');
    (error as NodeJS.ErrnoException).code = 'UNABLE_TO_VERIFY_LEAF_SIGNATURE';
    expect(classifyConnectorError(error)).toBe(false);
  });

  it('classifies unknown errors as non-retryable', () => {
    const error = new Error('Something unexpected');
    expect(classifyConnectorError(error)).toBe(false);
  });

  it('classifies non-Error values as non-retryable', () => {
    expect(classifyConnectorError('string error')).toBe(false);
    expect(classifyConnectorError(null)).toBe(false);
  });
});

describe('createProviderWrapper', () => {
  it('delegates getProviderName to the wrapped provider', () => {
    const logger = createMockLogger();
    const provider = createMockProvider('mcpRegistry');
    const wrapped = createProviderWrapper(provider, logger);

    expect(wrapped.getProviderName()).toBe('mcpRegistry');
  });

  it('delegates connect() to the wrapped provider', async () => {
    const logger = createMockLogger();
    const connectFn = jest.fn().mockResolvedValue(undefined);
    const provider = createMockProvider('mcpRegistry', connectFn);
    const wrapped = createProviderWrapper(provider, logger);

    const mockConnection = {};
    await wrapped.connect(mockConnection as never);

    expect(connectFn).toHaveBeenCalledWith(mockConnection);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('catches connect() errors and logs structured error', async () => {
    const logger = createMockLogger();
    const crashError = new Error('DNS resolution failure');
    (crashError as NodeJS.ErrnoException).code = 'EAI_AGAIN';
    const provider = createMockProvider('mcpRegistry', async () => {
      throw crashError;
    });

    const wrapped = createProviderWrapper(provider, logger, {
      endpoint: 'https://registry.example.com',
    });
    // Should not throw
    await wrapped.connect({} as never);

    expect(logger.error).toHaveBeenCalledWith(
      'Connector connect() failed',
      expect.objectContaining({
        connectorId: 'mcpRegistry',
        endpoint: 'https://registry.example.com',
        errorType: 'Error',
        errorMessage: 'DNS resolution failure',
        retryable: true,
      }),
    );
  });

  it('does not rethrow errors from connect()', async () => {
    const logger = createMockLogger();
    const provider = createMockProvider('rhoai', async () => {
      throw new Error('crash');
    });
    const wrapped = createProviderWrapper(provider, logger);

    // This should NOT throw
    await expect(wrapped.connect({} as never)).resolves.toBeUndefined();
  });

  it('includes nextRetryAt in error context when provided', async () => {
    const logger = createMockLogger();
    const crashError = new Error('Connection refused');
    (crashError as NodeJS.ErrnoException).code = 'ECONNREFUSED';
    const provider = createMockProvider('mcpRegistry', async () => {
      throw crashError;
    });

    const wrapped = createProviderWrapper(provider, logger, {
      endpoint: 'https://registry.example.com',
      nextRetryAt: '2025-01-01T00:05:00Z',
    });
    await wrapped.connect({} as never);

    expect(logger.error).toHaveBeenCalledWith(
      'Connector connect() failed',
      expect.objectContaining({
        connectorId: 'mcpRegistry',
        retryable: true,
        nextRetryAt: '2025-01-01T00:05:00Z',
      }),
    );
  });

  it('omits nextRetryAt for non-retryable errors even if provided', async () => {
    const logger = createMockLogger();
    const provider = createMockProvider('mcpRegistry', async () => {
      throw new TypeError('Invalid URL');
    });

    const wrapped = createProviderWrapper(provider, logger, {
      endpoint: 'https://registry.example.com',
      nextRetryAt: '2025-01-01T00:05:00Z',
    });
    await wrapped.connect({} as never);

    const loggedCtx = (logger.error as jest.Mock).mock.calls[0][1];
    expect(loggedCtx.retryable).toBe(false);
    expect(loggedCtx.nextRetryAt).toBeUndefined();
  });

  it('allows multiple providers to fail independently', async () => {
    const logger = createMockLogger();

    const providerA = createMockProvider('mcpRegistry', async () => {
      throw new Error('MCP crash');
    });
    const providerB = createMockProvider('rhoai', async () => {
      throw new Error('RHOAI crash');
    });

    const wrappedA = createProviderWrapper(providerA, logger);
    const wrappedB = createProviderWrapper(providerB, logger);

    await wrappedA.connect({} as never);
    await wrappedB.connect({} as never);

    expect(logger.error).toHaveBeenCalledTimes(2);
    expect(logger.error).toHaveBeenCalledWith(
      'Connector connect() failed',
      expect.objectContaining({ connectorId: 'mcpRegistry' }),
    );
    expect(logger.error).toHaveBeenCalledWith(
      'Connector connect() failed',
      expect.objectContaining({ connectorId: 'rhoai' }),
    );
  });
});

describe('createSafeRefresh', () => {
  it('calls the wrapped refresh function', async () => {
    const logger = createMockLogger();
    const refreshFn = jest.fn().mockResolvedValue(undefined);
    const safeRefresh = createSafeRefresh(refreshFn, 'mcpRegistry', logger);

    await safeRefresh();

    expect(refreshFn).toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('catches refresh errors and logs structured error', async () => {
    const logger = createMockLogger();
    const refreshFn = jest.fn().mockRejectedValue(new Error('Network timeout'));
    const safeRefresh = createSafeRefresh(refreshFn, 'mcpRegistry', logger, {
      endpoint: 'https://registry.example.com/api/v1/tools',
    });

    // Should not throw
    await safeRefresh();

    expect(logger.error).toHaveBeenCalledWith(
      'Connector refresh failed',
      expect.objectContaining({
        connectorId: 'mcpRegistry',
        endpoint: 'https://registry.example.com/api/v1/tools',
        errorType: 'Error',
        errorMessage: 'Network timeout',
        retryable: false,
      }),
    );
  });

  it('does not rethrow errors from refresh', async () => {
    const logger = createMockLogger();
    const refreshFn = jest.fn().mockRejectedValue(new Error('crash'));
    const safeRefresh = createSafeRefresh(refreshFn, 'ociSkill', logger);

    await expect(safeRefresh()).resolves.toBeUndefined();
  });

  it('logs error context fields including connectorId', async () => {
    const logger = createMockLogger();
    const error = new Error('Connection refused');
    (error as NodeJS.ErrnoException).code = 'ECONNREFUSED';
    const refreshFn = jest.fn().mockRejectedValue(error);

    const safeRefresh = createSafeRefresh(refreshFn, 'rhoai', logger);
    await safeRefresh();

    expect(logger.error).toHaveBeenCalledWith(
      'Connector refresh failed',
      expect.objectContaining({
        connectorId: 'rhoai',
        errorType: 'Error',
        errorMessage: 'Connection refused',
        retryable: true,
      }),
    );
  });
});
