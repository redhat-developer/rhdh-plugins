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
 * Extract status code from error object
 */
function extractStatusCode(error: unknown): number | undefined {
  if (
    typeof error !== 'object' ||
    error === null ||
    (!('statusCode' in error) && !('status' in error))
  ) {
    return undefined;
  }

  const statusCode =
    'statusCode' in error
      ? (error.statusCode as number)
      : (error.status as number);

  return typeof statusCode === 'number' ? statusCode : undefined;
}

/**
 * Parse error body from string or object
 */
function parseErrorBody(error: unknown): {
  parsedBody: KubernetesErrorBody | undefined;
  fallbackMessage?: string;
} {
  if (
    typeof error !== 'object' ||
    error === null ||
    !('body' in error) ||
    !error.body
  ) {
    return { parsedBody: undefined };
  }

  if (typeof error.body === 'string') {
    try {
      return { parsedBody: JSON.parse(error.body) as KubernetesErrorBody };
    } catch {
      return { parsedBody: undefined, fallbackMessage: error.body };
    }
  }

  if (typeof error.body === 'object') {
    return { parsedBody: error.body as KubernetesErrorBody };
  }

  return { parsedBody: undefined };
}

/**
 * Extract error details from parsed body
 */
function extractErrorDetailsFromBody(
  parsedBody: KubernetesErrorBody,
  currentMessage: string,
): Partial<ExtractedErrorDetails> {
  const details: Partial<ExtractedErrorDetails> = {};

  if (parsedBody.code) {
    details.statusCode = parsedBody.code;
  }

  if (parsedBody.reason) {
    details.errorType = parsedBody.reason;
    details.reason = parsedBody.reason;
  }

  if (parsedBody.message) {
    details.message = parsedBody.message;
  }

  if (parsedBody.details?.causes && parsedBody.details.causes.length > 0) {
    const causeMessages = parsedBody.details.causes
      .map(cause => cause.message || cause.reason)
      .filter(Boolean)
      .join('; ');
    if (causeMessages) {
      details.message = `${
        details.message || currentMessage
      } ${causeMessages}`.trim();
    }
  }

  return details;
}

/**
 * Infer error type from HTTP status code
 */
function inferErrorTypeFromStatusCode(statusCode: number): string {
  switch (statusCode) {
    case 401:
      return 'Unauthorized';
    case 403:
      return 'Forbidden';
    case 404:
      return 'NotFound';
    case 409:
      return 'Conflict';
    case 422:
      return 'Invalid';
    case 500:
    case 502:
    case 503:
      return 'InternalError';
    default:
      return 'Unknown';
  }
}

/**
 * Safely convert an error to a string message
 * @internal - exported for testing
 */
export function errorToString(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object' && error !== null) {
    return JSON.stringify(error);
  }
  if (error === null || error === undefined) {
    return 'Unknown error';
  }
  if (
    typeof error === 'number' ||
    typeof error === 'boolean' ||
    typeof error === 'bigint'
  ) {
    return `${error}`;
  }
  if (typeof error === 'symbol') {
    return error.toString();
  }
  return 'Unknown error';
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
  const fallbackMessage = errorToString(error);

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

  // Extract status code from error object
  const statusCode = extractStatusCode(error);
  if (statusCode) {
    result.statusCode = statusCode;
  }

  // Parse and extract details from error body
  const { parsedBody, fallbackMessage: bodyMessage } = parseErrorBody(error);
  if (bodyMessage) {
    result.message = bodyMessage;
  }

  if (parsedBody) {
    const bodyDetails = extractErrorDetailsFromBody(
      parsedBody,
      result.message || '',
    );
    Object.assign(result, bodyDetails);

    // Use status code from body if not already set
    if (parsedBody.code && !result.statusCode) {
      result.statusCode = parsedBody.code;
    }
  }

  // Infer error type from status code if not already set
  if (result.statusCode && !result.errorType) {
    result.errorType = inferErrorTypeFromStatusCode(result.statusCode);
  }

  return result;
}
