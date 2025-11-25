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

import { KonfluxLogger, LogContext } from '../logger';
import { LoggerService } from '@backstage/backend-plugin-api';

describe('logger', () => {
  let mockBaseLogger: jest.Mocked<LoggerService>;
  let konfluxLogger: KonfluxLogger;

  beforeEach(() => {
    mockBaseLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    } as unknown as jest.Mocked<LoggerService>;

    konfluxLogger = new KonfluxLogger(mockBaseLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with base logger', () => {
      expect(konfluxLogger.baseLogger).toBe(mockBaseLogger);
    });
  });

  describe('error', () => {
    it('should log error with message only', () => {
      konfluxLogger.error('Test error message');

      expect(mockBaseLogger.error).toHaveBeenCalledTimes(1);
      expect(mockBaseLogger.error).toHaveBeenCalledWith(
        'Test error message',
        {},
      );
    });

    it('should log error with Error instance', () => {
      const error = new Error('Something went wrong');
      error.stack = 'Error: Something went wrong\n    at test.js:1:1';

      konfluxLogger.error('Test error message', error);

      expect(mockBaseLogger.error).toHaveBeenCalledTimes(1);
      expect(mockBaseLogger.error).toHaveBeenCalledWith('Test error message', {
        error: 'Something went wrong',
        errorName: 'Error',
        errorStack: 'Error: Something went wrong\n    at test.js:1:1',
      });
    });

    it('should log error with Error instance without stack', () => {
      const error = new Error('Something went wrong');
      delete error.stack;

      konfluxLogger.error('Test error message', error);

      expect(mockBaseLogger.error).toHaveBeenCalledTimes(1);
      expect(mockBaseLogger.error).toHaveBeenCalledWith('Test error message', {
        error: 'Something went wrong',
        errorName: 'Error',
      });
    });

    it('should log error with context only', () => {
      const context: LogContext = {
        cluster: 'cluster1',
        namespace: 'namespace1',
        resource: 'pipelineruns',
      };

      konfluxLogger.error('Test error message', undefined, context);

      expect(mockBaseLogger.error).toHaveBeenCalledTimes(1);
      expect(mockBaseLogger.error).toHaveBeenCalledWith('Test error message', {
        cluster: 'cluster1',
        namespace: 'namespace1',
        resource: 'pipelineruns',
      });
    });

    it('should log error with Error instance and context', () => {
      const error = new Error('Something went wrong');
      const context: LogContext = {
        cluster: 'cluster1',
        namespace: 'namespace1',
      };

      konfluxLogger.error('Test error message', error, context);

      expect(mockBaseLogger.error).toHaveBeenCalledTimes(1);
      expect(mockBaseLogger.error).toHaveBeenCalledWith('Test error message', {
        cluster: 'cluster1',
        namespace: 'namespace1',
        error: 'Something went wrong',
        errorName: 'Error',
        errorStack: expect.any(String),
      });
    });

    it('should handle Error with statusCode', () => {
      const error = new Error('HTTP error') as any;
      error.statusCode = 404;

      konfluxLogger.error('Test error message', error);

      expect(mockBaseLogger.error).toHaveBeenCalledTimes(1);
      expect(mockBaseLogger.error).toHaveBeenCalledWith('Test error message', {
        error: 'HTTP error',
        errorName: 'Error',
        errorStack: expect.any(String),
        statusCode: 404,
      });
    });

    it('should handle Error with string body', () => {
      const error = new Error('HTTP error') as any;
      error.body = 'Error response body';

      konfluxLogger.error('Test error message', error);

      expect(mockBaseLogger.error).toHaveBeenCalledTimes(1);
      expect(mockBaseLogger.error).toHaveBeenCalledWith('Test error message', {
        error: 'HTTP error',
        errorName: 'Error',
        errorStack: expect.any(String),
        body: 'Error response body',
      });
    });

    it('should handle Error with object body', () => {
      const error = new Error('HTTP error') as any;
      error.body = { message: 'Error details', code: 'ERR001' };

      konfluxLogger.error('Test error message', error);

      expect(mockBaseLogger.error).toHaveBeenCalledTimes(1);
      expect(mockBaseLogger.error).toHaveBeenCalledWith('Test error message', {
        error: 'HTTP error',
        errorName: 'Error',
        errorStack: expect.any(String),
        body: { message: 'Error details', code: 'ERR001' },
      });
    });

    it('should handle Error with number body', () => {
      const error = new Error('HTTP error') as any;
      error.body = 500;

      konfluxLogger.error('Test error message', error);

      expect(mockBaseLogger.error).toHaveBeenCalledTimes(1);
      expect(mockBaseLogger.error).toHaveBeenCalledWith('Test error message', {
        error: 'HTTP error',
        errorName: 'Error',
        errorStack: expect.any(String),
        body: 500,
      });
    });

    it('should handle Error with boolean body', () => {
      const error = new Error('HTTP error') as any;
      error.body = false;

      konfluxLogger.error('Test error message', error);

      expect(mockBaseLogger.error).toHaveBeenCalledTimes(1);
      expect(mockBaseLogger.error).toHaveBeenCalledWith('Test error message', {
        error: 'HTTP error',
        errorName: 'Error',
        errorStack: expect.any(String),
        body: false,
      });
    });

    it('should handle Error with null body', () => {
      const error = new Error('HTTP error') as any;
      error.body = null;

      konfluxLogger.error('Test error message', error);

      expect(mockBaseLogger.error).toHaveBeenCalledTimes(1);
      expect(mockBaseLogger.error).toHaveBeenCalledWith('Test error message', {
        error: 'HTTP error',
        errorName: 'Error',
        errorStack: expect.any(String),
        body: null,
      });
    });

    it('should convert array body to string', () => {
      const error = new Error('HTTP error') as any;
      error.body = ['item1', 'item2'];

      konfluxLogger.error('Test error message', error);

      expect(mockBaseLogger.error).toHaveBeenCalledTimes(1);
      expect(mockBaseLogger.error).toHaveBeenCalledWith('Test error message', {
        error: 'HTTP error',
        errorName: 'Error',
        errorStack: expect.any(String),
        body: 'item1,item2',
      });
    });

    it('should ignore non-number statusCode', () => {
      const error = new Error('HTTP error') as any;
      error.statusCode = '404';

      konfluxLogger.error('Test error message', error);

      expect(mockBaseLogger.error).toHaveBeenCalledTimes(1);
      expect(mockBaseLogger.error).toHaveBeenCalledWith('Test error message', {
        error: 'HTTP error',
        errorName: 'Error',
        errorStack: expect.any(String),
      });
    });

    it('should merge error context with provided context', () => {
      const error = new Error('Something went wrong');
      const context: LogContext = {
        cluster: 'cluster1',
        namespace: 'namespace1',
        userEmail: 'user@example.com',
      };

      konfluxLogger.error('Test error message', error, context);

      expect(mockBaseLogger.error).toHaveBeenCalledTimes(1);
      const callArgs = mockBaseLogger.error.mock.calls[0];
      expect(callArgs[0]).toBe('Test error message');
      expect(callArgs[1]).toMatchObject({
        cluster: 'cluster1',
        namespace: 'namespace1',
        userEmail: 'user@example.com',
        error: 'Something went wrong',
        errorName: 'Error',
      });
    });
  });

  describe('warn', () => {
    it('should log warning with message only', () => {
      konfluxLogger.warn('Test warning message');

      expect(mockBaseLogger.warn).toHaveBeenCalledTimes(1);
      expect(mockBaseLogger.warn).toHaveBeenCalledWith(
        'Test warning message',
        {},
      );
    });

    it('should log warning with context', () => {
      const context: LogContext = {
        cluster: 'cluster1',
        namespace: 'namespace1',
        resource: 'applications',
      };

      konfluxLogger.warn('Test warning message', context);

      expect(mockBaseLogger.warn).toHaveBeenCalledTimes(1);
      expect(mockBaseLogger.warn).toHaveBeenCalledWith('Test warning message', {
        cluster: 'cluster1',
        namespace: 'namespace1',
        resource: 'applications',
      });
    });

    it('should log warning with empty context when undefined', () => {
      konfluxLogger.warn('Test warning message');

      expect(mockBaseLogger.warn).toHaveBeenCalledTimes(1);
      expect(mockBaseLogger.warn).toHaveBeenCalledWith(
        'Test warning message',
        {},
      );
    });
  });

  describe('info', () => {
    it('should log info with message only', () => {
      konfluxLogger.info('Test info message');

      expect(mockBaseLogger.info).toHaveBeenCalledTimes(1);
      expect(mockBaseLogger.info).toHaveBeenCalledWith('Test info message', {});
    });

    it('should log info with context', () => {
      const context: LogContext = {
        cluster: 'cluster1',
        namespace: 'namespace1',
        entityRef: 'component:default/my-component',
      };

      konfluxLogger.info('Test info message', context);

      expect(mockBaseLogger.info).toHaveBeenCalledTimes(1);
      expect(mockBaseLogger.info).toHaveBeenCalledWith('Test info message', {
        cluster: 'cluster1',
        namespace: 'namespace1',
        entityRef: 'component:default/my-component',
      });
    });

    it('should log info with empty context when undefined', () => {
      konfluxLogger.info('Test info message');

      expect(mockBaseLogger.info).toHaveBeenCalledTimes(1);
      expect(mockBaseLogger.info).toHaveBeenCalledWith('Test info message', {});
    });
  });

  describe('debug', () => {
    it('should log debug with message only', () => {
      konfluxLogger.debug('Test debug message');

      expect(mockBaseLogger.debug).toHaveBeenCalledTimes(1);
      expect(mockBaseLogger.debug).toHaveBeenCalledWith(
        'Test debug message',
        {},
      );
    });

    it('should log debug with context', () => {
      const context: LogContext = {
        cluster: 'cluster1',
        namespace: 'namespace1',
        apiGroup: 'appstudio.redhat.com',
        apiVersion: 'v1alpha1',
      };

      konfluxLogger.debug('Test debug message', context);

      expect(mockBaseLogger.debug).toHaveBeenCalledTimes(1);
      expect(mockBaseLogger.debug).toHaveBeenCalledWith('Test debug message', {
        cluster: 'cluster1',
        namespace: 'namespace1',
        apiGroup: 'appstudio.redhat.com',
        apiVersion: 'v1alpha1',
      });
    });

    it('should log debug with empty context when undefined', () => {
      konfluxLogger.debug('Test debug message');

      expect(mockBaseLogger.debug).toHaveBeenCalledTimes(1);
      expect(mockBaseLogger.debug).toHaveBeenCalledWith(
        'Test debug message',
        {},
      );
    });
  });

  describe('context handling', () => {
    it('should handle context with all possible fields', () => {
      const context: LogContext = {
        cluster: 'cluster1',
        namespace: 'namespace1',
        resource: 'pipelineruns',
        apiGroup: 'appstudio.redhat.com',
        apiVersion: 'v1alpha1',
        userEmail: 'user@example.com',
        entityRef: 'component:default/my-component',
        customField: 'custom value',
      };

      konfluxLogger.info('Test message', context);

      expect(mockBaseLogger.info).toHaveBeenCalledTimes(1);
      expect(mockBaseLogger.info).toHaveBeenCalledWith('Test message', context);
    });

    it('should handle context with undefined values', () => {
      const context: LogContext = {
        cluster: 'cluster1',
        namespace: undefined,
        resource: undefined,
      };

      konfluxLogger.info('Test message', context);

      expect(mockBaseLogger.info).toHaveBeenCalledTimes(1);
      expect(mockBaseLogger.info).toHaveBeenCalledWith('Test message', {
        cluster: 'cluster1',
        namespace: undefined,
        resource: undefined,
      });
    });

    it('should handle empty context object', () => {
      konfluxLogger.info('Test message', {});

      expect(mockBaseLogger.info).toHaveBeenCalledTimes(1);
      expect(mockBaseLogger.info).toHaveBeenCalledWith('Test message', {});
    });
  });
});
