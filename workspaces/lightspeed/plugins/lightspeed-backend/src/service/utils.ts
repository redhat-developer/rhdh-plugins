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

import { LoggerService } from '@backstage/backend-plugin-api';

/**
 * Interface for Lightspeed Core Service error response structure
 */
export interface LCSErrorResponse {
  error?: {
    message?: string;
  };
  detail?: {
    cause?: string;
  };
}

/**
 * Sanitizes Lightspeed Core Service (LCS) error responses to prevent
 * information disclosure. Logs full error details server-side for debugging
 * while returning only generic messages to clients.
 *
 * @param errorBody - The error response body from LCS
 * @param logger - Logger instance for server-side logging
 * @param context - Context string describing the operation (e.g., "sending feedback")
 * @returns Generic error message safe to return to clients
 */
export function sanitizeLCSError(
  errorBody: LCSErrorResponse,
  logger: LoggerService,
  context: string,
): string {
  // Log full error details server-side for debugging
  logger.error(
    `Error from lightspeed-core server while ${context}: ${JSON.stringify(errorBody)}`,
  );

  // Return only generic message to client (no internal LCS details)
  return `Error from lightspeed-core server while ${context}`;
}

/**
 * Handles LCS fetch errors by sanitizing the error response and sending it to the client.
 * This helper eliminates code duplication across multiple endpoints.
 *
 * @param fetchResponse - The failed fetch response from LCS
 * @param logger - Logger instance for server-side logging
 * @param context - Context string describing the operation
 * @param response - Express response object
 */
export async function handleLCSFetchError(
  fetchResponse: Response,
  logger: LoggerService,
  context: string,
  response: any,
): Promise<void> {
  const errorBody = await fetchResponse.json();
  const sanitizedError = sanitizeLCSError(errorBody, logger, context);
  response.status(fetchResponse.status).json({ error: sanitizedError });
}
