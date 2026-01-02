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
  extractKubernetesErrorDetails,
  errorToString,
} from '../error-extraction';
import { GroupVersionKind } from '@red-hat-developer-hub/backstage-plugin-konflux-common';

describe('error-extraction', () => {
  const mockResourceModelWithApiGroup: GroupVersionKind = {
    apiGroup: 'appstudio.redhat.com',
    apiVersion: 'v1alpha1',
    kind: 'Application',
    plural: 'applications',
  };

  const mockResourceModelWithoutApiGroup: GroupVersionKind = {
    apiGroup: '',
    apiVersion: 'v1',
    kind: 'Pod',
    plural: 'pods',
  };

  const namespace = 'test-namespace';

  describe('extractKubernetesErrorDetails', () => {
    describe('basic error handling', () => {
      it('should handle Error object', () => {
        const error = new Error('Test error message');
        const result = extractKubernetesErrorDetails(
          error,
          mockResourceModelWithApiGroup,
          namespace,
        );

        expect(result.message).toBe('Test error message');
        expect(result.resourcePath).toBe(
          '/apis/appstudio.redhat.com/v1alpha1/namespaces/test-namespace/applications',
        );
        expect(result.source).toBe('kubernetes');
      });

      it('should handle string error', () => {
        const error = 'String error message';
        const result = extractKubernetesErrorDetails(
          error,
          mockResourceModelWithApiGroup,
          namespace,
        );

        expect(result.message).toBe('String error message');
        expect(result.source).toBe('kubernetes');
      });

      it('should handle number error', () => {
        const error = 12345;
        const result = extractKubernetesErrorDetails(
          error,
          mockResourceModelWithApiGroup,
          namespace,
        );

        expect(result.message).toBe('12345');
        expect(result.source).toBe('kubernetes');
      });

      it('should handle null error', () => {
        const error = null;
        const result = extractKubernetesErrorDetails(
          error,
          mockResourceModelWithApiGroup,
          namespace,
        );

        expect(result.message).toBe('Unknown error');
        expect(result.source).toBe('kubernetes');
      });

      it('should handle undefined error', () => {
        const error = undefined;
        const result = extractKubernetesErrorDetails(
          error,
          mockResourceModelWithApiGroup,
          namespace,
        );

        expect(result.message).toBe('Unknown error');
        expect(result.source).toBe('kubernetes');
      });
    });

    describe('status code extraction', () => {
      it('should extract statusCode property', () => {
        const error = {
          message: 'Forbidden',
          statusCode: 403,
        };
        const result = extractKubernetesErrorDetails(
          error,
          mockResourceModelWithApiGroup,
          namespace,
        );

        expect(result.statusCode).toBe(403);
        expect(result.errorType).toBe('Forbidden');
      });

      it('should extract status property', () => {
        const error = {
          message: 'Not Found',
          status: 404,
        };
        const result = extractKubernetesErrorDetails(
          error,
          mockResourceModelWithApiGroup,
          namespace,
        );

        expect(result.statusCode).toBe(404);
        expect(result.errorType).toBe('NotFound');
      });

      it('should prefer statusCode over status', () => {
        const error = {
          message: 'Conflict',
          statusCode: 409,
          status: 500,
        };
        const result = extractKubernetesErrorDetails(
          error,
          mockResourceModelWithApiGroup,
          namespace,
        );

        expect(result.statusCode).toBe(409);
        expect(result.errorType).toBe('Conflict');
      });

      it('should handle non-number status code', () => {
        const error = {
          message: 'Error',
          statusCode: 'not-a-number',
        };
        const result = extractKubernetesErrorDetails(
          error,
          mockResourceModelWithApiGroup,
          namespace,
        );

        expect(result.statusCode).toBeUndefined();
      });
    });

    describe('error body parsing - string JSON', () => {
      it('should parse JSON string body with full error details', () => {
        const errorBody = JSON.stringify({
          kind: 'Status',
          apiVersion: 'v1',
          code: 403,
          reason: 'Forbidden',
          message: 'User does not have permission to access this resource',
        });
        const error = {
          message: 'API Error',
          statusCode: 403,
          body: errorBody,
        };
        const result = extractKubernetesErrorDetails(
          error,
          mockResourceModelWithApiGroup,
          namespace,
        );

        expect(result.statusCode).toBe(403);
        expect(result.errorType).toBe('Forbidden');
        expect(result.reason).toBe('Forbidden');
        expect(result.message).toBe(
          'User does not have permission to access this resource',
        );
      });

      it('should handle invalid JSON string body', () => {
        const error = {
          message: 'Original error',
          body: 'invalid json {',
        };
        const result = extractKubernetesErrorDetails(
          error,
          mockResourceModelWithApiGroup,
          namespace,
        );

        expect(result.message).toBe('invalid json {');
      });

      it('should extract status code from body if not in error object', () => {
        const errorBody = JSON.stringify({
          code: 404,
          reason: 'NotFound',
          message: 'Resource not found',
        });
        const error = {
          message: 'Error',
          body: errorBody,
        };
        const result = extractKubernetesErrorDetails(
          error,
          mockResourceModelWithApiGroup,
          namespace,
        );

        expect(result.statusCode).toBe(404);
        expect(result.errorType).toBe('NotFound');
        expect(result.message).toBe('Resource not found');
      });
    });

    describe('error body parsing - object', () => {
      it('should parse object body directly', () => {
        const error = {
          message: 'API Error',
          body: {
            code: 401,
            reason: 'Unauthorized',
            message: 'Authentication required',
          },
        };
        const result = extractKubernetesErrorDetails(
          error,
          mockResourceModelWithApiGroup,
          namespace,
        );

        expect(result.statusCode).toBe(401);
        expect(result.errorType).toBe('Unauthorized');
        expect(result.reason).toBe('Unauthorized');
        expect(result.message).toBe('Authentication required');
      });

      it('should handle body with details and causes', () => {
        const error = {
          message: 'Validation Error',
          body: {
            code: 422,
            reason: 'Invalid',
            message: 'Validation failed',
            details: {
              name: 'test-resource',
              group: 'appstudio.redhat.com',
              kind: 'Application',
              causes: [
                {
                  reason: 'FieldRequired',
                  message: 'Name field is required',
                  field: 'metadata.name',
                },
                {
                  reason: 'InvalidValue',
                  message: 'Invalid namespace value',
                  field: 'metadata.namespace',
                },
              ],
            },
          },
        };
        const result = extractKubernetesErrorDetails(
          error,
          mockResourceModelWithApiGroup,
          namespace,
        );

        expect(result.statusCode).toBe(422);
        expect(result.errorType).toBe('Invalid');
        expect(result.message).toContain('Validation failed');
        expect(result.message).toContain('Name field is required');
        expect(result.message).toContain('Invalid namespace value');
      });

      it('should handle causes with only reason (no message)', () => {
        const error = {
          body: {
            code: 422,
            reason: 'Invalid',
            message: 'Validation failed',
            details: {
              causes: [
                {
                  reason: 'FieldRequired',
                  field: 'metadata.name',
                },
              ],
            },
          },
        };
        const result = extractKubernetesErrorDetails(
          error,
          mockResourceModelWithApiGroup,
          namespace,
        );

        expect(result.message).toContain('Validation failed');
        expect(result.message).toContain('FieldRequired');
      });

      it('should handle empty causes array', () => {
        const error = {
          body: {
            code: 422,
            reason: 'Invalid',
            message: 'Validation failed',
            details: {
              causes: [],
            },
          },
        };
        const result = extractKubernetesErrorDetails(
          error,
          mockResourceModelWithApiGroup,
          namespace,
        );

        expect(result.message).toBe('Validation failed');
      });
    });

    describe('error type inference from status codes', () => {
      it('should infer Unauthorized for 401', () => {
        const error = { statusCode: 401 };
        const result = extractKubernetesErrorDetails(
          error,
          mockResourceModelWithApiGroup,
          namespace,
        );

        expect(result.statusCode).toBe(401);
        expect(result.errorType).toBe('Unauthorized');
      });

      it('should infer Forbidden for 403', () => {
        const error = { statusCode: 403 };
        const result = extractKubernetesErrorDetails(
          error,
          mockResourceModelWithApiGroup,
          namespace,
        );

        expect(result.statusCode).toBe(403);
        expect(result.errorType).toBe('Forbidden');
      });

      it('should infer NotFound for 404', () => {
        const error = { statusCode: 404 };
        const result = extractKubernetesErrorDetails(
          error,
          mockResourceModelWithApiGroup,
          namespace,
        );

        expect(result.statusCode).toBe(404);
        expect(result.errorType).toBe('NotFound');
      });

      it('should infer Conflict for 409', () => {
        const error = { statusCode: 409 };
        const result = extractKubernetesErrorDetails(
          error,
          mockResourceModelWithApiGroup,
          namespace,
        );

        expect(result.statusCode).toBe(409);
        expect(result.errorType).toBe('Conflict');
      });

      it('should infer Invalid for 422', () => {
        const error = { statusCode: 422 };
        const result = extractKubernetesErrorDetails(
          error,
          mockResourceModelWithApiGroup,
          namespace,
        );

        expect(result.statusCode).toBe(422);
        expect(result.errorType).toBe('Invalid');
      });

      it('should infer InternalError for 500', () => {
        const error = { statusCode: 500 };
        const result = extractKubernetesErrorDetails(
          error,
          mockResourceModelWithApiGroup,
          namespace,
        );

        expect(result.statusCode).toBe(500);
        expect(result.errorType).toBe('InternalError');
      });

      it('should infer InternalError for 502', () => {
        const error = { statusCode: 502 };
        const result = extractKubernetesErrorDetails(
          error,
          mockResourceModelWithApiGroup,
          namespace,
        );

        expect(result.statusCode).toBe(502);
        expect(result.errorType).toBe('InternalError');
      });

      it('should infer InternalError for 503', () => {
        const error = { statusCode: 503 };
        const result = extractKubernetesErrorDetails(
          error,
          mockResourceModelWithApiGroup,
          namespace,
        );

        expect(result.statusCode).toBe(503);
        expect(result.errorType).toBe('InternalError');
      });

      it('should infer Unknown for other status codes', () => {
        const error = { statusCode: 418 };
        const result = extractKubernetesErrorDetails(
          error,
          mockResourceModelWithApiGroup,
          namespace,
        );

        expect(result.statusCode).toBe(418);
        expect(result.errorType).toBe('Unknown');
      });

      it('should not override errorType from body when status code is present', () => {
        const error = {
          statusCode: 403,
          body: {
            code: 403,
            reason: 'CustomForbidden',
            message: 'Custom forbidden message',
          },
        };
        const result = extractKubernetesErrorDetails(
          error,
          mockResourceModelWithApiGroup,
          namespace,
        );

        expect(result.errorType).toBe('CustomForbidden');
        expect(result.reason).toBe('CustomForbidden');
      });
    });

    describe('resource path building', () => {
      it('should build path with apiGroup', () => {
        const error = new Error('Test error');
        const result = extractKubernetesErrorDetails(
          error,
          mockResourceModelWithApiGroup,
          namespace,
        );

        expect(result.resourcePath).toBe(
          '/apis/appstudio.redhat.com/v1alpha1/namespaces/test-namespace/applications',
        );
      });

      it('should build path without apiGroup (core API)', () => {
        const error = new Error('Test error');
        const result = extractKubernetesErrorDetails(
          error,
          mockResourceModelWithoutApiGroup,
          namespace,
        );

        expect(result.resourcePath).toBe(
          '/api/v1/namespaces/test-namespace/pods',
        );
      });

      it('should handle different namespaces', () => {
        const error = new Error('Test error');
        const customNamespace = 'custom-namespace';
        const result = extractKubernetesErrorDetails(
          error,
          mockResourceModelWithApiGroup,
          customNamespace,
        );

        expect(result.resourcePath).toBe(
          '/apis/appstudio.redhat.com/v1alpha1/namespaces/custom-namespace/applications',
        );
      });
    });

    describe('source parameter', () => {
      it('should use kubernetes as default source', () => {
        const error = new Error('Test error');
        const result = extractKubernetesErrorDetails(
          error,
          mockResourceModelWithApiGroup,
          namespace,
        );

        expect(result.source).toBe('kubernetes');
      });

      it('should use provided kubernetes source', () => {
        const error = new Error('Test error');
        const result = extractKubernetesErrorDetails(
          error,
          mockResourceModelWithApiGroup,
          namespace,
          'kubernetes',
        );

        expect(result.source).toBe('kubernetes');
      });

      it('should use provided kubearchive source', () => {
        const error = new Error('Test error');
        const result = extractKubernetesErrorDetails(
          error,
          mockResourceModelWithApiGroup,
          namespace,
          'kubearchive',
        );

        expect(result.source).toBe('kubearchive');
      });
    });

    describe('complex error scenarios', () => {
      it('should handle full Kubernetes API error structure', () => {
        const error = {
          statusCode: 403,
          body: JSON.stringify({
            kind: 'Status',
            apiVersion: 'v1',
            metadata: {},
            status: 'Failure',
            message:
              'applications.appstudio.redhat.com "test-app" is forbidden: User "system:serviceaccount:default:backstage" cannot get resource "applications" in API group "appstudio.redhat.com" in the namespace "test-namespace"',
            reason: 'Forbidden',
            details: {
              name: 'test-app',
              group: 'appstudio.redhat.com',
              kind: 'applications',
            },
            code: 403,
          }),
        };
        const result = extractKubernetesErrorDetails(
          error,
          mockResourceModelWithApiGroup,
          namespace,
        );

        expect(result.statusCode).toBe(403);
        expect(result.errorType).toBe('Forbidden');
        expect(result.reason).toBe('Forbidden');
        expect(result.message).toContain('is forbidden');
        expect(result.resourcePath).toBe(
          '/apis/appstudio.redhat.com/v1alpha1/namespaces/test-namespace/applications',
        );
      });

      it('should prioritize body message over error message', () => {
        const error = {
          message: 'Generic error message',
          body: {
            code: 404,
            reason: 'NotFound',
            message: 'Specific resource not found',
          },
        };
        const result = extractKubernetesErrorDetails(
          error,
          mockResourceModelWithApiGroup,
          namespace,
        );

        expect(result.message).toBe('Specific resource not found');
        expect(result.errorType).toBe('NotFound');
      });

      it('should handle error with only status code and no body', () => {
        const error = {
          statusCode: 500,
        };
        const result = extractKubernetesErrorDetails(
          error,
          mockResourceModelWithApiGroup,
          namespace,
        );

        expect(result.statusCode).toBe(500);
        expect(result.errorType).toBe('InternalError');
      });

      it('should handle error with empty body', () => {
        const error = {
          message: 'Error occurred',
          body: '',
        };
        const result = extractKubernetesErrorDetails(
          error,
          mockResourceModelWithApiGroup,
          namespace,
        );

        expect(result).toBeDefined();
        expect(result.resourcePath).toBeDefined();
      });

      it('should handle error with null body', () => {
        const error = {
          message: 'Error occurred',
          body: null,
        };
        const result = extractKubernetesErrorDetails(
          error,
          mockResourceModelWithApiGroup,
          namespace,
        );

        expect(result).toBeDefined();
        expect(result.resourcePath).toBeDefined();
      });
    });
  });

  describe('errorToString', () => {
    it('should handle Error instances', () => {
      const error = new Error('Test error message');
      expect(errorToString(error)).toBe('Test error message');
    });

    it('should handle string errors', () => {
      expect(errorToString('String error')).toBe('String error');
    });

    it('should handle number errors', () => {
      expect(errorToString(12345)).toBe('12345');
      expect(errorToString(0)).toBe('0');
      expect(errorToString(-42)).toBe('-42');
    });

    it('should handle boolean errors', () => {
      expect(errorToString(true)).toBe('true');
      expect(errorToString(false)).toBe('false');
    });

    it('should handle bigint errors', () => {
      expect(errorToString(BigInt(123456789))).toBe('123456789');
    });

    it('should handle symbol errors', () => {
      const sym = Symbol('test');
      expect(errorToString(sym)).toBe(sym.toString());
    });

    it('should handle null errors', () => {
      expect(errorToString(null)).toBe('Unknown error');
    });

    it('should handle undefined errors', () => {
      expect(errorToString(undefined)).toBe('Unknown error');
    });

    it('should handle object errors with JSON.stringify', () => {
      const error = { message: 'Test', code: 500 };
      expect(errorToString(error)).toBe('{"message":"Test","code":500}');
    });

    it('should handle nested object errors', () => {
      const error = {
        message: 'Test',
        details: { nested: { value: 123 } },
      };
      expect(errorToString(error)).toBe(
        '{"message":"Test","details":{"nested":{"value":123}}}',
      );
    });

    it('should handle array errors', () => {
      const error = [1, 2, 3];
      expect(errorToString(error)).toBe('[1,2,3]');
    });

    it('should handle empty object', () => {
      expect(errorToString({})).toBe('{}');
    });
  });
});
