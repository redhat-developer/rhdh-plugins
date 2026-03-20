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
import { createWithRoute, notFound } from './routeWrapper';
import { validateSessionId } from './types';
import type { AdminRouteDeps } from './adminRouteTypes';

export function registerAdminSessionRoutes(
  router: import('express').Router,
  deps: AdminRouteDeps,
): void {
  const {
    provider,
    logger,
    sendRouteError,
    sessions,
    missingSessions,
    missingConversations,
  } = deps;

  const withRoute = createWithRoute(logger, sendRouteError);

  router.get(
    '/admin/sessions',
    withRoute(
      'GET /admin/sessions',
      'Failed to list sessions',
      async (_req, res) => {
        if (missingSessions(res)) return;
        const list = await sessions!.listAllSessions();
        res.json({ sessions: list });
      },
    ),
  );

  router.get(
    '/admin/sessions/:sessionId/messages',
    withRoute(
      req => `GET /admin/sessions/${req.params.sessionId}/messages`,
      'Failed to get session messages',
      async (req, res) => {
        if (missingSessions(res)) return;
        validateSessionId(req.params.sessionId);

        const session = await sessions!.getSessionById(req.params.sessionId);
        if (!session) {
          notFound(res, 'Session');
          return;
        }

        if (!session.conversationId) {
          res.json({
            messages: [],
            sessionCreatedAt: session.createdAt,
            hasConversationId: false,
          });
          return;
        }

        if (missingConversations(res)) return;

        try {
          const messages = await provider.conversations!.getProcessedMessages(
            session.conversationId,
          );
          if (messages.length === 0) {
            logger.warn(
              `Admin: session ${req.params.sessionId} has conversationId ${session.conversationId} but returned 0 messages — conversation data may have been lost`,
            );
          }
          res.json({
            messages,
            sessionCreatedAt: session.createdAt,
            hasConversationId: true,
          });
        } catch (fetchErr) {
          logger.error(
            `Failed to fetch messages for conversation ${session.conversationId}: ${fetchErr}`,
          );
          res.status(502).json({
            error: 'Failed to retrieve messages from the conversation provider',
            messages: [],
            sessionCreatedAt: session.createdAt,
            hasConversationId: true,
          });
        }
      },
    ),
  );
}
