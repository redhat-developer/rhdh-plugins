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

import { GroupVersionKind } from '@red-hat-developer-hub/backstage-plugin-konflux-common';

/**
 * Kubernetes API error body structure
 */
interface KubernetesErrorBody {
  kind?: string;
  apiVersion?: string;
  code?: number;
  reason?: string;
  message?: string;
  status?: string;
  details?: {
    name?: string;
    group?: string;
    kind?: string;
    causes?: Array<{
      reason?: string;
      message?: string;
      field?: string;
    }>;
  };
}

/**
 * Extracted error details from Kubernetes/Kubearchive API errors
 */
export interface ExtractedErrorDetails {
  errorType?: string;
  message?: string;
  statusCode?: number;
  reason?: string;
  resourcePath?: string;
  source?: 'kubernetes' | 'kubearchive';
}

/**
 * Builds the resource path for a Kubernetes resource
 */
function buildResourcePath(
  apiGroup: string,
  apiVersion: string,
  namespace: string,
  resource: string,
): string {
  if (apiGroup) {
    return `/apis/${apiGroup}/${apiVersion}/namespaces/${namespace}/${resource}`;
  }
  return `/api/${apiVersion}/namespaces/${namespace}/${resource}`;
}

/**
 * Extracts detailed error information from Kubernetes/Kubearchive API errors
 *
 * @param error - The error object from the API call
 * @param resourceModel - The resource model (for building resource path)
 * @param namespace - The namespace where the error occurred
 * @param source - The source of the error ('kubernetes' or 'kubearchive')
 * @returns Extracted error details with all available information
 */
export function extractKubernetesErrorDetails(
  error: unknown,
  resourceModel: GroupVersionKind,
  namespace: string,
  source: 'kubernetes' | 'kubearchive' = 'kubernetes',
): ExtractedErrorDetails {
  const fallbackMessage =
    error instanceof Error ? error.message : String(error);

  // build resource path
  const resourcePath = buildResourcePath(
    resourceModel.apiGroup,
    resourceModel.apiVersion,
    namespace,
    resourceModel.plural,
  );

  const result: ExtractedErrorDetails = {
    message: fallbackMessage,
    resourcePath,
    source,
  };

  // try to extract status code
  if (
    typeof error === 'object' &&
    error !== null &&
    ('statusCode' in error || 'status' in error)
  ) {
    const statusCode =
      // eslint-disable-next-line no-nested-ternary
      'statusCode' in error
        ? (error.statusCode as number)
        : 'status' in error
        ? (error.status as number)
        : undefined;

    if (typeof statusCode === 'number') {
      result.statusCode = statusCode;
    }
  }

  // try to parse error body
  if (
    typeof error === 'object' &&
    error !== null &&
    'body' in error &&
    error.body
  ) {
    let parsedBody: KubernetesErrorBody | undefined;

    // body might be a string (JSON) or already an object
    if (typeof error.body === 'string') {
      try {
        parsedBody = JSON.parse(error.body) as KubernetesErrorBody;
      } catch {
        // if parsing fails, use the string as-is
        result.message = error.body;
      }
    } else if (typeof error.body === 'object') {
      parsedBody = error.body as KubernetesErrorBody;
    }

    if (parsedBody) {
      // extract status code from body if not already set
      if (parsedBody.code && !result.statusCode) {
        result.statusCode = parsedBody.code;
      }

      // Extract reason (error type)
      if (parsedBody.reason) {
        result.errorType = parsedBody.reason;
        result.reason = parsedBody.reason;
      }

      // Extract detailed message
      if (parsedBody.message) {
        result.message = parsedBody.message;
      }

      // Extract additional details if available
      if (parsedBody.details) {
        const details = parsedBody.details;
        if (details.causes && details.causes.length > 0) {
          const causeMessages = details.causes
            .map(cause => cause.message || cause.reason)
            .filter(Boolean)
            .join('; ');
          if (causeMessages) {
            result.message = `${result.message || ''} ${causeMessages}`.trim();
          }
        }
      }
    }
  }

  // If we have a status code but no error type, try to infer it
  if (result.statusCode && !result.errorType) {
    switch (result.statusCode) {
      case 401:
        result.errorType = 'Unauthorized';
        break;
      case 403:
        result.errorType = 'Forbidden';
        break;
      case 404:
        result.errorType = 'NotFound';
        break;
      case 409:
        result.errorType = 'Conflict';
        break;
      case 422:
        result.errorType = 'Invalid';
        break;
      case 500:
      case 502:
      case 503:
        result.errorType = 'InternalError';
        break;
      default:
        result.errorType = 'Unknown';
    }
  }

  return result;
}
