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

function safeJsonParse(value: string): unknown {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function registerAdminSessionRoutes(
  router: import('express').Router,
  deps: AdminRouteDeps,
): void {
  const {
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
      async (req, res) => {
        if (missingSessions(res)) return;
        const rawLimit = parseInt(String(req.query.limit), 10);
        const limit = Number.isFinite(rawLimit)
          ? Math.min(Math.max(1, rawLimit), 500)
          : undefined;
        const list = await sessions!.listAllSessions(limit);
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

        // Local message store first — same pattern as user route.
        // Critical for Kagenti where the remote API has no history endpoint.
        const localMessages = await sessions!.getMessages(req.params.sessionId);

        if (localMessages.length > 0) {
          const formatted = localMessages.map(m => ({
            role: m.role,
            text: m.content,
            ...(m.agentName ? { agentName: m.agentName } : {}),
            ...(m.toolCalls ? { toolCalls: safeJsonParse(m.toolCalls) } : {}),
            ...(m.ragSources
              ? { ragSources: safeJsonParse(m.ragSources) }
              : {}),
            ...(m.usage ? { usage: safeJsonParse(m.usage) } : {}),
            ...(m.reasoning ? { reasoning: m.reasoning } : {}),
            createdAt: m.createdAt,
          }));
          res.json({
            messages: formatted,
            sessionCreatedAt: session.createdAt,
            hasConversationId: !!session.conversationId,
            source: 'local',
          });
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
          const messages =
            await deps.provider.conversations!.getProcessedMessages(
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
            source: 'provider',
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
