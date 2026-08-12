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

import { ErrorClassifier } from './ErrorClassifier';
import type { ErrorType } from '@red-hat-developer-hub/backstage-plugin-boost-common';

describe('ErrorClassifier', () => {
  describe('guidanceFor', () => {
    it.each([
      { errorType: 'auth' as ErrorType, fragment: 'credentials' },
      { errorType: 'network' as ErrorType, fragment: 'connectivity' },
      { errorType: 'schema' as ErrorType, fragment: 'schema' },
      { errorType: 'rate-limit' as ErrorType, fragment: 'rate limit' },
      { errorType: 'unknown' as ErrorType, fragment: 'logs' },
    ])(
      'returns non-empty $errorType guidance mentioning $fragment',
      ({ errorType, fragment }) => {
        const guidance = ErrorClassifier.guidanceFor(errorType);
        expect(guidance.length).toBeGreaterThan(0);
        expect(guidance.toLowerCase()).toContain(fragment.toLowerCase());
      },
    );
  });

  describe('auth failure classification', () => {
    it.each([
      {
        name: '401 Unauthorized',
        error: new Error('401 Unauthorized'),
        guidance: 'credentials',
      },
      {
        name: '403 Forbidden',
        error: new Error('403 Forbidden'),
        guidance: 'permissions',
      },
      {
        name: 'OAuth token expired',
        error: new Error('OAuth token expired'),
        guidance: 'OAuth',
      },
    ])('classifies $name', ({ error, guidance }) => {
      const result = ErrorClassifier.classify(error);
      expect(result.errorType).toBe('auth');
      expect(result.diagnosticGuidance).toContain(guidance);
    });

    it('classifies 401 status code from object', () => {
      const result = ErrorClassifier.classify({
        message: 'Request failed',
        statusCode: 401,
      });
      expect(result.errorType).toBe('auth');
    });

    it('classifies insufficient scopes', () => {
      const result = ErrorClassifier.classify(
        new Error('Insufficient scopes for this endpoint'),
      );
      expect(result.errorType).toBe('auth');
      expect(result.diagnosticGuidance).toContain('permissions');
    });

    it.each([
      'Invalid API token provided',
      'Access token expired',
      'Refresh token invalid',
    ])('classifies auth message: %s', message => {
      const result = ErrorClassifier.classify(new Error(message));
      expect(result.errorType).toBe('auth');
    });
  });

  describe('network failure classification', () => {
    it.each([
      {
        name: 'ECONNREFUSED',
        message: 'connect ECONNREFUSED 127.0.0.1:443',
        guidance: 'connectivity',
      },
      {
        name: 'ENOTFOUND (DNS)',
        message: 'getaddrinfo ENOTFOUND api.example.com',
        guidance: 'DNS',
      },
      {
        name: 'TLS certificate error',
        message: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
        guidance: 'TLS',
      },
      {
        name: 'self-signed certificate',
        message: 'self signed certificate in certificate chain',
        guidance: 'certificate',
      },
    ])('classifies $name', ({ message, guidance }) => {
      const result = ErrorClassifier.classify(new Error(message));
      expect(result.errorType).toBe('network');
      expect(result.diagnosticGuidance).toContain(guidance);
    });

    it.each([
      'connect ETIMEDOUT 10.0.0.1:443',
      'DNS lookup failed for api.example.com',
      'TLS certificate expired',
    ])('classifies network message: %s', message => {
      const result = ErrorClassifier.classify(new Error(message));
      expect(result.errorType).toBe('network');
    });

    it('does not misclassify client certificate auth as network', () => {
      const result = ErrorClassifier.classify(
        new Error('Client certificate authentication required'),
      );
      // Should NOT be classified as network — the bare "certificate"
      // keyword is no longer a catch-all.
      expect(result.errorType).not.toBe('network');
    });
  });

  describe('rate limit classification', () => {
    it('classifies 429 status', () => {
      const result = ErrorClassifier.classify({
        message: 'Too Many Requests',
        statusCode: 429,
      });
      expect(result.errorType).toBe('rate-limit');
      expect(result.diagnosticGuidance).toContain('rate limit');
    });

    it.each([
      '429 Too Many Requests',
      'Rate limit exceeded',
      'X-RateLimit-Remaining: 0',
    ])('classifies rate-limit message: %s', message => {
      const result = ErrorClassifier.classify(new Error(message));
      expect(result.errorType).toBe('rate-limit');
    });

    it('classifies secondary rate limit', () => {
      const result = ErrorClassifier.classify(
        new Error('You have exceeded a secondary rate limit'),
      );
      expect(result.errorType).toBe('rate-limit');
      expect(result.diagnosticGuidance).toContain('Secondary');
    });
  });

  describe('schema mismatch classification', () => {
    it('classifies JSON parse error', () => {
      const result = ErrorClassifier.classify(
        new Error('Unexpected token < in JSON at position 0'),
      );
      expect(result.errorType).toBe('schema');
      expect(result.diagnosticGuidance).toContain('parse');
    });

    it.each([
      'SyntaxError: JSON.parse: unexpected character',
      "Unexpected field 'x' in response",
      "Cannot query field 'foo' on type 'Query'",
    ])('classifies schema message: %s', message => {
      const result = ErrorClassifier.classify(new Error(message));
      expect(result.errorType).toBe('schema');
    });

    it('classifies GraphQL query error', () => {
      const result = ErrorClassifier.classify(
        new Error("Field 'x' doesn't exist on type 'Repository'"),
      );
      expect(result.errorType).toBe('schema');
      expect(result.diagnosticGuidance).toContain('GraphQL');
    });

    it('does not classify network errors as schema just because they mention graphql', () => {
      const result = ErrorClassifier.classify(
        new Error('failed calling graphql gateway: ECONNREFUSED'),
      );
      expect(result.errorType).toBe('network');
    });
  });

  describe('unknown error fallback', () => {
    it('classifies unrecognized errors as unknown', () => {
      const result = ErrorClassifier.classify(
        new Error('Something completely unexpected happened'),
      );
      expect(result.errorType).toBe('unknown');
      expect(result.errorMessage).toBe(
        'Something completely unexpected happened',
      );
      expect(result.diagnosticGuidance).toContain('logs');
    });

    it('handles string errors', () => {
      const result = ErrorClassifier.classify('raw string error');
      expect(result.errorType).toBe('unknown');
      expect(result.errorMessage).toBe('raw string error');
    });

    it('handles null/undefined errors', () => {
      const result = ErrorClassifier.classify(null);
      expect(result.errorType).toBe('unknown');
      expect(result.errorMessage).toBe('null');
    });
  });

  describe('connector-specific classification', () => {
    it.each([
      {
        name: 'GitHub secondary rate limit',
        message: 'You have exceeded a secondary rate limit',
        connectorType: 'github',
        errorType: 'rate-limit',
        guidance: 'Secondary',
      },
      {
        name: 'Jira Cloud auth error',
        message: 'Client must be authenticated to perform this action',
        connectorType: 'jira',
        errorType: 'auth',
        guidance: 'Jira',
      },
      {
        name: 'GitLab PAT error',
        message: 'Personal access token has expired',
        connectorType: 'gitlab',
        errorType: 'auth',
        guidance: 'GitLab',
      },
    ])(
      'classifies $name',
      ({ message, connectorType, errorType, guidance }) => {
        const result = ErrorClassifier.classify(new Error(message), {
          connectorType,
        });
        expect(result.errorType).toBe(errorType);
        expect(result.diagnosticGuidance).toContain(guidance);
      },
    );

    it('falls back to base classification for unknown connector', () => {
      const result = ErrorClassifier.classify(new Error('401 Unauthorized'), {
        connectorType: 'bitbucket',
      });
      expect(result.errorType).toBe('auth');
    });
  });

  describe('status code extraction', () => {
    it('extracts statusCode from error object', () => {
      const result = ErrorClassifier.classify({
        message: 'Forbidden',
        statusCode: 403,
      });
      expect(result.errorType).toBe('auth');
    });

    it('extracts status from error object', () => {
      const result = ErrorClassifier.classify({
        message: 'Forbidden',
        status: 403,
      });
      expect(result.errorType).toBe('auth');
    });
  });
});
