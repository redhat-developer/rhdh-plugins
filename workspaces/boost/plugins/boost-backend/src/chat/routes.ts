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

import { Router } from 'express';
import type {
  HttpAuthService,
  LoggerService,
  PermissionsService,
} from '@backstage/backend-plugin-api';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { InputError, NotAllowedError, NotFoundError } from '@backstage/errors';
import {
  boostChatCreatePermission,
  boostAdminPermission,
} from '@red-hat-developer-hub/backstage-plugin-boost-common';
import type {
  InputItem,
  NormalizedStreamEvent,
} from '@red-hat-developer-hub/backstage-plugin-boost-common';
import type { ProviderManager } from '../provider/ProviderManager';
import type { ConversationAgentCache } from './ConversationAgentCache';
import type { RateLimiter } from './RateLimiter';

/**
 * Options for creating chat routes.
 *
 * @public
 */
export interface ChatRoutesOptions {
  /** The provider manager for resolving the active AI provider. */
  providerManager: ProviderManager;
  /** The Backstage permissions service. */
  permissions: PermissionsService;
  /** The Backstage HTTP auth service for extracting credentials. */
  httpAuth: HttpAuthService;
  /** The Backstage logger service. */
  logger: LoggerService;
  /** Conversation-agent mapping cache (task 1.8). */
  conversationAgentCache: ConversationAgentCache;
  /** Rate limiter for chat requests (task 1.9). */
  rateLimiter: RateLimiter;
}

/**
 * Validates that a request body contains a valid messages array of InputItem.
 */
function validateMessages(body: unknown): InputItem[] {
  if (!body || typeof body !== 'object') {
    throw new InputError('Request body is required');
  }

  const { messages } = body as { messages?: unknown };

  if (!Array.isArray(messages) || messages.length === 0) {
    throw new InputError(
      'Request body must contain a non-empty "messages" array',
    );
  }

  for (const item of messages) {
    if (!item || typeof item !== 'object' || !('type' in item)) {
      throw new InputError(
        'Each message must be an object with a "type" field',
      );
    }
    const { type } = item as { type: string };
    if (type === 'text') {
      if (typeof (item as { text?: unknown }).text !== 'string') {
        throw new InputError('Text messages must have a "text" string field');
      }
    } else if (type === 'file' || type === 'image') {
      if (typeof (item as { url?: unknown }).url !== 'string') {
        throw new InputError(`${type} messages must have a "url" string field`);
      }
    } else {
      throw new InputError(
        `Invalid message type "${type}". Valid types: text, file, image`,
      );
    }
  }

  return messages as InputItem[];
}

/**
 * Formats a NormalizedStreamEvent as an SSE data line.
 *
 * SSE format: `event: <type>\ndata: <json>\n\n`
 */
function formatSseEvent(event: NormalizedStreamEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

/**
 * Creates an Express router with chat and streaming endpoints.
 *
 * Routes:
 * - POST /chat          — send messages to the active provider and receive a complete response
 * - POST /chat/stream   — send messages and receive an SSE stream of NormalizedStreamEvents
 *
 * @public
 */
export function createChatRoutes(options: ChatRoutesOptions): Router {
  const {
    providerManager,
    permissions,
    httpAuth,
    logger,
    conversationAgentCache,
    rateLimiter,
  } = options;
  const router = Router();

  /**
   * Middleware to check chat create permission with admin fallback.
   */
  async function requireChatCreate(
    req: import('express').Request,
    _res: import('express').Response,
    next: import('express').NextFunction,
  ): Promise<void> {
    try {
      const credentials = await httpAuth.credentials(req);

      const [decision] = await permissions.authorize(
        [{ permission: boostChatCreatePermission }],
        { credentials },
      );

      if (decision.result === AuthorizeResult.ALLOW) {
        return next();
      }

      // Fall back to coarse-grained admin permission
      const [adminDecision] = await permissions.authorize(
        [{ permission: boostAdminPermission }],
        { credentials },
      );

      if (adminDecision.result === AuthorizeResult.ALLOW) {
        return next();
      }

      throw new NotAllowedError('Unauthorized');
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Middleware to enforce rate limits.
   */
  async function enforceRateLimit(
    req: import('express').Request,
    res: import('express').Response,
    next: import('express').NextFunction,
  ): Promise<void> {
    try {
      const credentials = await httpAuth.credentials(req);
      const principal = credentials.principal as
        | { userEntityRef?: string }
        | undefined;
      const identity = principal?.userEntityRef ?? 'anonymous';

      const result = await rateLimiter.consume(identity);

      res.setHeader('X-RateLimit-Remaining', result.remaining.toString());

      if (!result.allowed) {
        res.setHeader(
          'Retry-After',
          Math.ceil((result.retryAfterMs ?? 60_000) / 1000).toString(),
        );
        res.status(429).json({
          error: 'Too many requests',
          retryAfterMs: result.retryAfterMs,
        });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  }

  // POST /chat — synchronous chat endpoint
  router.post(
    '/chat',
    requireChatCreate,
    enforceRateLimit,
    async (req, res, next) => {
      try {
        const messages = validateMessages(req.body);

        if (!providerManager.hasProvider()) {
          throw new NotFoundError(
            'No AI provider is registered. Install a provider module to enable chat.',
          );
        }

        const provider = providerManager.getActiveProvider();

        // Track conversation-agent mapping if conversationId is provided
        const conversationId =
          typeof req.body.conversationId === 'string'
            ? req.body.conversationId
            : undefined;

        if (conversationId) {
          await conversationAgentCache.set(
            conversationId,
            provider.descriptor.id,
          );
        }

        logger.debug(
          `Chat request via provider ${provider.descriptor.id} (${messages.length} messages)`,
        );

        const response = await provider.chat(messages);

        res.json({
          response,
          providerId: provider.descriptor.id,
          ...(conversationId ? { conversationId } : {}),
        });
      } catch (error) {
        next(error);
      }
    },
  );

  // POST /chat/stream — SSE streaming chat endpoint
  router.post(
    '/chat/stream',
    requireChatCreate,
    enforceRateLimit,
    async (req, res, next) => {
      try {
        const messages = validateMessages(req.body);

        if (!providerManager.hasProvider()) {
          throw new NotFoundError(
            'No AI provider is registered. Install a provider module to enable chat.',
          );
        }

        const provider = providerManager.getActiveProvider();

        // Track conversation-agent mapping if conversationId is provided
        const conversationId =
          typeof req.body.conversationId === 'string'
            ? req.body.conversationId
            : undefined;

        if (conversationId) {
          await conversationAgentCache.set(
            conversationId,
            provider.descriptor.id,
          );
        }

        logger.debug(
          `Stream request via provider ${provider.descriptor.id} (${messages.length} messages)`,
        );

        // Set up SSE response headers
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
        });

        // Flush headers immediately
        res.flushHeaders();

        const stream = provider.chatStream(messages);

        try {
          let providerSentDone = false;
          for await (const event of stream) {
            // If the client has disconnected, stop processing
            if (res.destroyed) {
              logger.debug('Client disconnected during stream');
              break;
            }

            res.write(formatSseEvent(event));
            providerSentDone = event.type === 'done';
          }

          if (!res.destroyed) {
            if (!providerSentDone) {
              res.write(formatSseEvent({ type: 'done' }));
            }
            res.end();
          }
        } catch (streamError) {
          // Send error event to the client if still connected
          if (!res.destroyed) {
            const errorEvent: NormalizedStreamEvent = {
              type: 'error',
              message:
                streamError instanceof Error
                  ? streamError.message
                  : 'An unexpected error occurred during streaming',
              code: 'STREAM_ERROR',
            };
            res.write(formatSseEvent(errorEvent));
            res.write(formatSseEvent({ type: 'done' }));
            res.end();
          }
          logger.error('Error during chat stream', streamError as Error);
        }
      } catch (error) {
        // If headers haven't been sent yet, pass to error handler
        if (!res.headersSent) {
          next(error);
        } else {
          logger.error('Error after stream headers sent', error as Error);
          res.end();
        }
      }
    },
  );

  return router;
}
