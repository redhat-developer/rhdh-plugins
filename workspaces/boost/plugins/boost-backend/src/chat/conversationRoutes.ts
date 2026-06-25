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
import { randomUUID } from 'crypto';
import type {
  HttpAuthService,
  LoggerService,
  PermissionsService,
} from '@backstage/backend-plugin-api';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { InputError, NotAllowedError, NotFoundError } from '@backstage/errors';
import {
  boostChatReadPermission,
  boostChatCreatePermission,
  boostAdminPermission,
} from '@red-hat-developer-hub/backstage-plugin-boost-common';
import type { ConversationStore } from './ConversationStore';

/**
 * Options for creating conversation routes.
 *
 * @public
 */
export interface ConversationRoutesOptions {
  /** The conversation store for persistence. */
  store: ConversationStore;
  /** The Backstage permissions service. */
  permissions: PermissionsService;
  /** The Backstage HTTP auth service for extracting credentials. */
  httpAuth: HttpAuthService;
  /** The Backstage logger service. */
  logger: LoggerService;
}

/**
 * Extracts the user entity ref from request credentials.
 */
async function getUserRef(
  httpAuth: HttpAuthService,
  req: import('express').Request,
): Promise<string> {
  const credentials = await httpAuth.credentials(req);
  const principal = credentials.principal as
    | { userEntityRef?: string }
    | undefined;
  const ref = principal?.userEntityRef;
  if (!ref) {
    throw new NotAllowedError(
      'Conversation history requires user authentication',
    );
  }
  return ref;
}

/**
 * Creates an Express router with conversation history endpoints.
 *
 * Routes:
 * - GET    /conversations           — list sessions for the current user
 * - POST   /conversations           — create a new session
 * - GET    /conversations/:id       — get session details with messages
 * - DELETE /conversations/:id       — delete a session
 * - POST   /conversations/:id/messages  — add a message to a session
 * - POST   /conversations/:id/feedback  — submit feedback on a message
 * - GET    /conversations/:id/feedback  — list feedback for a session
 * - GET    /conversations/:id/export    — export conversation as JSON
 *
 * @public
 */
export function createConversationRoutes(
  options: ConversationRoutesOptions,
): Router {
  const { store, permissions, httpAuth, logger } = options;
  const router = Router();

  /**
   * Middleware to check chat read permission with admin fallback.
   */
  async function requireChatRead(
    req: import('express').Request,
    _res: import('express').Response,
    next: import('express').NextFunction,
  ): Promise<void> {
    try {
      const credentials = await httpAuth.credentials(req);

      const [decision] = await permissions.authorize(
        [{ permission: boostChatReadPermission }],
        { credentials },
      );

      if (decision.result === AuthorizeResult.ALLOW) {
        return next();
      }

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
   * Check if the user has admin permission.
   */
  async function isAdmin(req: import('express').Request): Promise<boolean> {
    try {
      const credentials = await httpAuth.credentials(req);
      const [decision] = await permissions.authorize(
        [{ permission: boostAdminPermission }],
        { credentials },
      );
      return decision.result === AuthorizeResult.ALLOW;
    } catch {
      return false;
    }
  }

  // GET /conversations — list sessions
  router.get('/conversations', requireChatRead, async (req, res, next) => {
    try {
      const userRef = await getUserRef(httpAuth, req);
      const providerId =
        typeof req.query.providerId === 'string'
          ? req.query.providerId
          : undefined;
      const keyword = typeof req.query.q === 'string' ? req.query.q : undefined;
      const allUsers = req.query.allUsers === 'true';

      // Admin cross-user view
      if (allUsers) {
        const admin = await isAdmin(req);
        if (!admin) {
          throw new NotAllowedError(
            "Admin permission required to view all users' sessions",
          );
        }
        const sessions = await store.listAllSessions(providerId);
        res.json({ sessions });
        return;
      }

      if (keyword) {
        const sessions = await store.searchSessions(
          userRef,
          keyword,
          providerId,
        );
        res.json({ sessions });
        return;
      }

      const sessions = await store.listSessions(userRef, providerId);
      res.json({ sessions });
    } catch (error) {
      next(error);
    }
  });

  // POST /conversations — create a session
  router.post('/conversations', requireChatCreate, async (req, res, next) => {
    try {
      const userRef = await getUserRef(httpAuth, req);

      if (!req.body || typeof req.body !== 'object') {
        throw new InputError('Request body is required');
      }

      const { title, providerId } = req.body as {
        title?: unknown;
        providerId?: unknown;
      };

      if (typeof title !== 'string' || title.trim().length === 0) {
        throw new InputError('A non-empty "title" string is required');
      }

      if (typeof providerId !== 'string' || providerId.trim().length === 0) {
        throw new InputError('A non-empty "providerId" string is required');
      }

      const id = typeof req.body.id === 'string' ? req.body.id : randomUUID();

      const session = await store.createSession({
        id,
        title: title.trim(),
        providerId: providerId.trim(),
        createdBy: userRef,
      });

      logger.info(`Conversation session created: ${session.id}`);
      res.status(201).json(session);
    } catch (error) {
      next(error);
    }
  });

  // GET /conversations/:id — get session with messages
  router.get('/conversations/:id', requireChatRead, async (req, res, next) => {
    try {
      const session = await store.getSession(req.params.id);
      if (!session) {
        throw new NotFoundError(`Session "${req.params.id}" not found`);
      }
      const userRef = await getUserRef(httpAuth, req);
      if (session.createdBy !== userRef && !(await isAdmin(req))) {
        throw new NotAllowedError('You do not have access to this session');
      }
      res.json(session);
    } catch (error) {
      next(error);
    }
  });

  // DELETE /conversations/:id — delete a session
  router.delete(
    '/conversations/:id',
    requireChatCreate,
    async (req, res, next) => {
      try {
        const session = await store.getSession(req.params.id);
        if (!session) {
          throw new NotFoundError(`Session "${req.params.id}" not found`);
        }
        const userRef = await getUserRef(httpAuth, req);
        if (session.createdBy !== userRef && !(await isAdmin(req))) {
          throw new NotAllowedError('You do not have access to this session');
        }
        await store.deleteSession(req.params.id);
        logger.info(`Conversation session deleted: ${req.params.id}`);
        res.status(204).end();
      } catch (error) {
        next(error);
      }
    },
  );

  // POST /conversations/:id/messages — add a message
  router.post(
    '/conversations/:id/messages',
    requireChatCreate,
    async (req, res, next) => {
      try {
        const session = await store.getSession(req.params.id);
        if (!session) {
          throw new NotFoundError(`Session "${req.params.id}" not found`);
        }
        const userRef = await getUserRef(httpAuth, req);
        if (session.createdBy !== userRef && !(await isAdmin(req))) {
          throw new NotAllowedError('You do not have access to this session');
        }

        if (!req.body || typeof req.body !== 'object') {
          throw new InputError('Request body is required');
        }

        const { role, content } = req.body as {
          role?: unknown;
          content?: unknown;
        };

        if (
          typeof role !== 'string' ||
          !['user', 'assistant', 'system'].includes(role)
        ) {
          throw new InputError(
            'A valid "role" is required (user, assistant, or system)',
          );
        }

        if (typeof content !== 'string' || content.length === 0) {
          throw new InputError('A non-empty "content" string is required');
        }

        const id = typeof req.body.id === 'string' ? req.body.id : randomUUID();

        const message = await store.addMessage({
          id,
          sessionId: req.params.id,
          role: role as 'user' | 'assistant' | 'system',
          content,
        });

        res.status(201).json(message);
      } catch (error) {
        next(error);
      }
    },
  );

  // POST /conversations/:id/feedback — submit feedback
  router.post(
    '/conversations/:id/feedback',
    requireChatCreate,
    async (req, res, next) => {
      try {
        const session = await store.getSession(req.params.id);
        if (!session) {
          throw new NotFoundError(`Session "${req.params.id}" not found`);
        }
        const userRef = await getUserRef(httpAuth, req);
        if (session.createdBy !== userRef && !(await isAdmin(req))) {
          throw new NotAllowedError('You do not have access to this session');
        }

        if (!req.body || typeof req.body !== 'object') {
          throw new InputError('Request body is required');
        }

        const { messageId, sentiment, reason } = req.body as {
          messageId?: unknown;
          sentiment?: unknown;
          reason?: unknown;
        };

        if (typeof messageId !== 'string' || messageId.length === 0) {
          throw new InputError('A non-empty "messageId" string is required');
        }

        if (
          typeof sentiment !== 'string' ||
          !['positive', 'negative'].includes(sentiment)
        ) {
          throw new InputError(
            'A valid "sentiment" is required (positive or negative)',
          );
        }

        const feedback = await store.addFeedback({
          id: randomUUID(),
          sessionId: req.params.id,
          messageId,
          sentiment: sentiment as 'positive' | 'negative',
          reason: typeof reason === 'string' ? reason : undefined,
          createdBy: userRef,
        });

        res.status(201).json(feedback);
      } catch (error) {
        next(error);
      }
    },
  );

  // GET /conversations/:id/feedback — list feedback
  router.get(
    '/conversations/:id/feedback',
    requireChatRead,
    async (req, res, next) => {
      try {
        const session = await store.getSession(req.params.id);
        if (!session) {
          throw new NotFoundError(`Session "${req.params.id}" not found`);
        }
        const userRef = await getUserRef(httpAuth, req);
        if (session.createdBy !== userRef && !(await isAdmin(req))) {
          throw new NotAllowedError('You do not have access to this session');
        }
        const feedback = await store.listFeedback(req.params.id);
        res.json({ feedback });
      } catch (error) {
        next(error);
      }
    },
  );

  // GET /conversations/:id/export — export conversation
  router.get(
    '/conversations/:id/export',
    requireChatRead,
    async (req, res, next) => {
      try {
        const session = await store.getSession(req.params.id);
        if (!session) {
          throw new NotFoundError(`Session "${req.params.id}" not found`);
        }
        const userRef = await getUserRef(httpAuth, req);
        if (session.createdBy !== userRef && !(await isAdmin(req))) {
          throw new NotAllowedError('You do not have access to this session');
        }

        const feedback = await store.listFeedback(req.params.id);

        res.json({
          ...session,
          feedback,
          exportedAt: new Date().toISOString(),
        });
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
