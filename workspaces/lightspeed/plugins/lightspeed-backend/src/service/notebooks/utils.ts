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
import {
  ConflictError,
  InputError,
  NotAllowedError,
  NotFoundError,
} from '@backstage/errors';

import { Response } from 'express';

import { NotebookSession } from './types/notebooksTypes';

/**
 * Handle error and return appropriate HTTP status code and error message
 * Supports both Error objects and plain strings (treated as validation errors)
 * @param logger - Logger service
 * @param res - Response object
 * @param error - Error object or validation error string
 * @param message - Optional context message (not used for string errors)
 * @returns Response object
 */
export const handleError = (
  logger: LoggerService,
  res: Response,
  error: unknown,
  message?: string,
) => {
  if (typeof error === 'string') {
    logger.error(`Validation error: ${error}`);
    res.status(400).json({ status: 'error', error });
    return;
  }

  // Properly stringify error for logging
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errormsg = message ? `${message}: ${errorMessage}` : errorMessage;
  logger.error(errormsg, error as Error);

  // Handle specific error types with appropriate HTTP status codes
  if (error instanceof NotAllowedError) {
    // 403 Forbidden - User lacks permission
    res.status(403).json({ status: 'error', error: error.message });
  } else if (error instanceof NotFoundError) {
    // 404 Not Found - Resource doesn't exist
    res.status(404).json({ status: 'error', error: error.message });
  } else if (error instanceof InputError) {
    // 400 Bad Request - Invalid input/validation error
    res.status(400).json({ status: 'error', error: error.message });
  } else if (error instanceof ConflictError) {
    // 409 Conflict - Resource conflict (e.g., duplicate)
    res.status(409).json({ status: 'error', error: error.message });
  } else if (error instanceof Error) {
    // 500 Internal Server Error - Generic error
    res.status(500).json({ status: 'error', error: error.message });
  } else {
    // 500 Internal Server Error - Unknown error type
    res.status(500).json({ status: 'error', error: errorMessage });
  }
};

/**
 * Build VectorStore metadata object from session data
 * @param session - Notebook session
 * @returns Metadata object for vector store
 */
export const buildVectorStoreMetadata = (
  session: NotebookSession,
): Record<string, any> => {
  return {
    user_id: session.user_id,
    name: session.name,
    description: session.description,
    created_at: session.created_at,
    updated_at: session.updated_at,
    ...(session.metadata || {}),
  };
};

/**
 * Extract session data from VectorStore metadata
 * @param sessionId - Session ID
 * @param metadata - Vector store metadata
 * @returns Notebook session object
 */
export const extractSessionFromMetadata = (
  sessionId: string,
  metadata: Record<string, any>,
): NotebookSession => {
  // Extract session-level fields
  const {
    user_id,
    name,
    description,
    created_at,
    updated_at,
    provider_id,
    conversation_id,
    embedding_dimension,
    ...customMetadata
  } = metadata;
  delete customMetadata.provider_vector_store_id;

  return {
    session_id: sessionId,
    user_id: user_id as string,
    name: name as string,
    description: description as string,
    created_at: created_at as string,
    updated_at: updated_at as string,
    metadata: {
      ...customMetadata,
      provider_id: provider_id as string,
      conversation_id: conversation_id as string | null,
      embedding_dimension: embedding_dimension as number,
    },
  };
};
