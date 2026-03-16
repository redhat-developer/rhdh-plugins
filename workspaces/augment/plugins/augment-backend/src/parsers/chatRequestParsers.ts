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
import { InputError } from '@backstage/errors';
import type { ChatRequest } from '../types';
import {
  MAX_MESSAGE_CONTENT_LENGTH,
  MAX_MESSAGES_PER_REQUEST,
  MAX_APPROVAL_FIELD_LENGTH,
} from '../constants';

const VALID_ROLES = new Set(['user', 'assistant', 'system']);

/**
 * Parses and validates a chat request body.
 * @throws InputError when the body is invalid
 */
export function parseChatRequest(body: unknown): ChatRequest {
  if (!body || typeof body !== 'object') {
    throw new InputError('Request body must be a JSON object');
  }

  const { messages, enableRAG, previousResponseId, conversationId, sessionId } =
    body as Record<string, unknown>;

  if (!Array.isArray(messages) || messages.length === 0) {
    throw new InputError('messages must be a non-empty array');
  }

  if (messages.length > MAX_MESSAGES_PER_REQUEST) {
    throw new InputError(
      `messages array exceeds maximum of ${MAX_MESSAGES_PER_REQUEST} items`,
    );
  }

  for (const msg of messages) {
    if (!msg || typeof msg !== 'object') {
      throw new InputError(
        'Each message must be an object with role and content',
      );
    }
    const { role, content } = msg as Record<string, unknown>;
    if (typeof role !== 'string' || typeof content !== 'string') {
      throw new InputError(
        'Each message must have role (string) and content (string)',
      );
    }
    if (!VALID_ROLES.has(role)) {
      throw new InputError('Message role must be user, assistant, or system');
    }
    if (content.length > MAX_MESSAGE_CONTENT_LENGTH) {
      throw new InputError(
        `Message content exceeds maximum of ${MAX_MESSAGE_CONTENT_LENGTH} characters`,
      );
    }
  }

  if (
    previousResponseId !== undefined &&
    typeof previousResponseId !== 'string'
  ) {
    throw new InputError('previousResponseId must be a string');
  }
  if (conversationId !== undefined && typeof conversationId !== 'string') {
    throw new InputError('conversationId must be a string');
  }
  if (sessionId !== undefined && typeof sessionId !== 'string') {
    throw new InputError('sessionId must be a string');
  }

  return {
    messages: messages as ChatRequest['messages'],
    enableRAG: enableRAG === true,
    previousResponseId: previousResponseId as string | undefined,
    conversationId: conversationId as string | undefined,
    sessionId: sessionId as string | undefined,
  };
}

/**
 * Parses and validates an approval request body.
 * @throws InputError when the body is invalid
 */
export function parseApprovalRequest(body: unknown): {
  responseId: string;
  callId: string;
  approved: boolean;
  toolName?: string;
  toolArguments?: string;
  reason?: string;
} {
  if (!body || typeof body !== 'object') {
    throw new InputError('Request body must be a JSON object');
  }

  const { responseId, callId, approved, toolName, toolArguments, reason } =
    body as Record<string, unknown>;

  if (typeof responseId !== 'string' || !responseId) {
    throw new InputError(
      'responseId is required and must be a non-empty string',
    );
  }
  if (responseId.length > MAX_APPROVAL_FIELD_LENGTH) {
    throw new InputError(
      `responseId exceeds maximum of ${MAX_APPROVAL_FIELD_LENGTH} characters`,
    );
  }
  if (typeof callId !== 'string' || !callId) {
    throw new InputError('callId is required and must be a non-empty string');
  }
  if (callId.length > MAX_APPROVAL_FIELD_LENGTH) {
    throw new InputError(
      `callId exceeds maximum of ${MAX_APPROVAL_FIELD_LENGTH} characters`,
    );
  }
  if (typeof approved !== 'boolean') {
    throw new InputError('approved must be a boolean');
  }
  if (approved && (typeof toolName !== 'string' || !toolName)) {
    throw new InputError('toolName is required when approving a tool call');
  }
  if (toolArguments !== undefined && typeof toolArguments !== 'string') {
    throw new InputError('toolArguments must be a string');
  }

  if (reason !== undefined && typeof reason !== 'string') {
    throw new InputError('reason must be a string');
  }

  return {
    responseId,
    callId,
    approved,
    toolName: toolName as string | undefined,
    toolArguments: toolArguments as string | undefined,
    reason: reason as string | undefined,
  };
}
