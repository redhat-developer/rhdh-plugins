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

describe('ErrorClassifier', () => {
  describe('auth failure classification', () => {
    it('classifies 401 Unauthorized', () => {
      const result = ErrorClassifier.classify(new Error('401 Unauthorized'));
      expect(result.errorType).toBe('auth');
      expect(result.diagnosticGuidance).toContain('credentials');
    });

    it('classifies 401 status code from object', () => {
      const result = ErrorClassifier.classify({
        message: 'Request failed',
        statusCode: 401,
      });
      expect(result.errorType).toBe('auth');
    });

    it('classifies 403 Forbidden', () => {
      const result = ErrorClassifier.classify(new Error('403 Forbidden'));
      expect(result.errorType).toBe('auth');
      expect(result.diagnosticGuidance).toContain('permissions');
    });

    it('classifies insufficient scopes', () => {
      const result = ErrorClassifier.classify(
        new Error('Insufficient scopes for this endpoint'),
      );
      expect(result.errorType).toBe('auth');
      expect(result.diagnosticGuidance).toContain('permissions');
    });

    it('classifies invalid API token', () => {
      const result = ErrorClassifier.classify(
        new Error('Invalid API token provided'),
      );
      expect(result.errorType).toBe('auth');
    });

    it('classifies OAuth token expired', () => {
      const result = ErrorClassifier.classify(new Error('OAuth token expired'));
      expect(result.errorType).toBe('auth');
      expect(result.diagnosticGuidance).toContain('OAuth');
    });

    it('classifies access token expired', () => {
      const result = ErrorClassifier.classify(
        new Error('Access token expired'),
      );
      expect(result.errorType).toBe('auth');
    });

    it('classifies refresh token invalid', () => {
      const result = ErrorClassifier.classify(
        new Error('Refresh token invalid'),
      );
      expect(result.errorType).toBe('auth');
    });
  });

  describe('network failure classification', () => {
    it('classifies ECONNREFUSED', () => {
      const result = ErrorClassifier.classify(
        new Error('connect ECONNREFUSED 127.0.0.1:443'),
      );
      expect(result.errorType).toBe('network');
      expect(result.diagnosticGuidance).toContain('connectivity');
    });

    it('classifies ETIMEDOUT', () => {
      const result = ErrorClassifier.classify(
        new Error('connect ETIMEDOUT 10.0.0.1:443'),
      );
      expect(result.errorType).toBe('network');
    });

    it('classifies ENOTFOUND (DNS)', () => {
      const result = ErrorClassifier.classify(
        new Error('getaddrinfo ENOTFOUND api.example.com'),
      );
      expect(result.errorType).toBe('network');
      expect(result.diagnosticGuidance).toContain('DNS');
    });

    it('classifies DNS lookup failed', () => {
      const result = ErrorClassifier.classify(
        new Error('DNS lookup failed for api.example.com'),
      );
      expect(result.errorType).toBe('network');
    });

    it('classifies TLS certificate error', () => {
      const result = ErrorClassifier.classify(
        new Error('UNABLE_TO_VERIFY_LEAF_SIGNATURE'),
      );
      expect(result.errorType).toBe('network');
      expect(result.diagnosticGuidance).toContain('TLS');
    });

    it('classifies self-signed certificate', () => {
      const result = ErrorClassifier.classify(
        new Error('self signed certificate in certificate chain'),
      );
      expect(result.errorType).toBe('network');
      expect(result.diagnosticGuidance).toContain('certificate');
    });

    it('classifies TLS certificate expired', () => {
      const result = ErrorClassifier.classify(
        new Error('TLS certificate expired'),
      );
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

    it('classifies 429 Too Many Requests in message', () => {
      const result = ErrorClassifier.classify(
        new Error('429 Too Many Requests'),
      );
      expect(result.errorType).toBe('rate-limit');
    });

    it('classifies rate limit exceeded', () => {
      const result = ErrorClassifier.classify(new Error('Rate limit exceeded'));
      expect(result.errorType).toBe('rate-limit');
    });

    it('classifies X-RateLimit-Remaining: 0', () => {
      const result = ErrorClassifier.classify(
        new Error('X-RateLimit-Remaining: 0'),
      );
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

    it('classifies SyntaxError: JSON.parse', () => {
      const result = ErrorClassifier.classify(
        new Error('SyntaxError: JSON.parse: unexpected character'),
      );
      expect(result.errorType).toBe('schema');
    });

    it('classifies unexpected field', () => {
      const result = ErrorClassifier.classify(
        new Error("Unexpected field 'x' in response"),
      );
      expect(result.errorType).toBe('schema');
    });

    it('classifies GraphQL query error', () => {
      const result = ErrorClassifier.classify(
        new Error("Field 'x' doesn't exist on type 'Repository'"),
      );
      expect(result.errorType).toBe('schema');
      expect(result.diagnosticGuidance).toContain('GraphQL');
    });

    it('classifies Cannot query field', () => {
      const result = ErrorClassifier.classify(
        new Error("Cannot query field 'foo' on type 'Query'"),
      );
      expect(result.errorType).toBe('schema');
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
    it('classifies GitHub secondary rate limit', () => {
      const result = ErrorClassifier.classify(
        new Error('You have exceeded a secondary rate limit'),
        { connectorType: 'github' },
      );
      expect(result.errorType).toBe('rate-limit');
      expect(result.diagnosticGuidance).toContain('Secondary');
    });

    it('classifies Jira Cloud auth error', () => {
      const result = ErrorClassifier.classify(
        new Error('Client must be authenticated to perform this action'),
        { connectorType: 'jira' },
      );
      expect(result.errorType).toBe('auth');
      expect(result.diagnosticGuidance).toContain('Jira');
    });

    it('classifies GitLab PAT error', () => {
      const result = ErrorClassifier.classify(
        new Error('Personal access token has expired'),
        { connectorType: 'gitlab' },
      );
      expect(result.errorType).toBe('auth');
      expect(result.diagnosticGuidance).toContain('GitLab');
    });

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
