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
import { MAX_SESSION_LIST_LIMIT, MAX_SESSION_TITLE_LENGTH } from '../constants';
import { createWithRoute, notFound } from './routeWrapper';
import { type RouteContext, validateSessionId } from './types';

function safeJsonParse(value: string): unknown {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Registers chat session CRUD endpoints (local DB).
 */
export function registerSessionRoutes(ctx: RouteContext): void {
  const {
    router,
    logger,
    provider,
    sessions,
    sendRouteError,
    missingSessions,
    missingConversations,
    getUserRef,
  } = ctx;

  const withRoute = createWithRoute(logger, sendRouteError);

  router.get(
    '/sessions',
    withRoute('GET /sessions', 'Failed to list sessions', async (req, res) => {
      if (missingSessions(res)) return;
      const userRef = await getUserRef(req);
      const rawLimit = req.query.limit;
      const limit =
        rawLimit && !isNaN(Number(rawLimit))
          ? Math.min(Number(rawLimit), MAX_SESSION_LIST_LIMIT)
          : undefined;
      const rawOffset = req.query.offset;
      const offset =
        rawOffset && !isNaN(Number(rawOffset))
          ? Math.max(0, Number(rawOffset))
          : undefined;
      const rawProviderId = req.query.providerId;
      const providerId =
        typeof rawProviderId === 'string' && rawProviderId.trim()
          ? rawProviderId.trim()
          : undefined;
      const list = await sessions!.listSessions(
        userRef,
        limit,
        offset,
        providerId,
      );
      res.json({ sessions: list });
    }),
  );

  router.post(
    '/sessions',
    withRoute(
      'POST /sessions',
      'Failed to create session',
      async (req, res) => {
        if (missingSessions(res)) return;
        const userRef = await getUserRef(req);
        const body = req.body as Record<string, unknown>;
        let title: string | undefined;
        if (body.title !== undefined && typeof body.title === 'string') {
          title =
            body.title.trim().slice(0, MAX_SESSION_TITLE_LENGTH) || undefined;
        }
        const model =
          typeof body.model === 'string'
            ? body.model.trim() || undefined
            : undefined;
        const providerId =
          typeof body.providerId === 'string'
            ? body.providerId.trim() || undefined
            : undefined;
        const session = await sessions!.createSession(
          userRef,
          title,
          model,
          providerId,
        );
        res.json({ session });
      },
    ),
  );

  router.get(
    '/sessions/:sessionId',
    withRoute(
      req => `GET /sessions/${req.params.sessionId}`,
      'Failed to get session',
      async (req, res) => {
        if (missingSessions(res)) return;
        validateSessionId(req.params.sessionId);
        const userRef = await getUserRef(req);
        const session = await sessions!.getSession(
          req.params.sessionId,
          userRef,
        );
        if (!session) {
          notFound(res, 'Session');
          return;
        }
        res.json({ session });
      },
    ),
  );

  router.delete(
    '/sessions/:sessionId',
    withRoute(
      req => `DELETE /sessions/${req.params.sessionId}`,
      'Failed to delete session',
      async (req, res) => {
        if (missingSessions(res)) return;
        validateSessionId(req.params.sessionId);
        const userRef = await getUserRef(req);
        const session = await sessions!.getSession(
          req.params.sessionId,
          userRef,
        );
        if (!session) {
          notFound(res, 'Session');
          return;
        }

        if (session.conversationId && provider.conversations) {
          const containerDeleted =
            await provider.conversations.deleteContainer?.(
              session.conversationId,
            );
          if (containerDeleted) {
            logger.info(
              `Deleted LlamaStack conversation ${session.conversationId} for session ${req.params.sessionId}`,
            );
          } else {
            logger.info(
              `Session ${req.params.sessionId} had conversation ${session.conversationId} — LlamaStack conversation cleanup skipped or failed`,
            );
          }
        }

        const deleted = await sessions!.deleteSession(
          req.params.sessionId,
          userRef,
        );
        res.json({ success: deleted });
      },
    ),
  );

  router.patch(
    '/sessions/:sessionId',
    withRoute(
      req => `PATCH /sessions/${req.params.sessionId}`,
      'Failed to update session',
      async (req, res) => {
        if (missingSessions(res)) return;
        validateSessionId(req.params.sessionId);
        const userRef = await getUserRef(req);
        const { title } = req.body as { title?: string };
        if (typeof title !== 'string' || !title.trim()) {
          res.status(400).json({ error: 'title must be a non-empty string' });
          return;
        }
        const trimmed = title.trim().slice(0, MAX_SESSION_TITLE_LENGTH);
        const session = await sessions!.getSession(
          req.params.sessionId,
          userRef,
        );
        if (!session) {
          notFound(res, 'Session');
          return;
        }
        await sessions!.updateTitle(req.params.sessionId, userRef, trimmed);
        res.json({ success: true, title: trimmed });
      },
    ),
  );

  // -------------------------------------------------------------------------
  // Session State (debug view)
  // -------------------------------------------------------------------------

  router.get(
    '/sessions/:sessionId/state',
    withRoute(
      req => `GET /sessions/${req.params.sessionId}/state`,
      'Failed to get session state',
      async (req, res) => {
        if (missingSessions(res)) return;
        validateSessionId(req.params.sessionId);
        const userRef = await getUserRef(req);
        const session = await sessions!.getSession(
          req.params.sessionId,
          userRef,
        );
        if (!session) {
          notFound(res, 'Session');
          return;
        }
        const messages = await sessions!.getMessages(req.params.sessionId);
        const messagesByRole = {
          user: messages.filter(m => m.role === 'user').length,
          assistant: messages.filter(m => m.role === 'assistant').length,
        };
        const agents = [
          ...new Set(
            messages.filter(m => m.agentName).map(m => m.agentName as string),
          ),
        ];
        const lastActivity =
          messages.length > 0
            ? messages[messages.length - 1].createdAt
            : session.updatedAt;

        res.json({
          session: {
            id: session.id,
            title: session.title,
            conversationId: session.conversationId,
            model: session.model,
            providerId: session.providerId,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
          },
          messages: {
            total: messages.length,
            byRole: messagesByRole,
          },
          agents,
          lastActivity,
        });
      },
    ),
  );

  // -------------------------------------------------------------------------
  // Message Feedback
  // -------------------------------------------------------------------------

  router.post(
    '/feedback',
    withRoute('POST /feedback', 'Failed to save feedback', async (req, res) => {
      if (missingSessions(res)) return;
      const userRef = await getUserRef(req);
      const body = req.body as Record<string, unknown>;
      const messageId =
        typeof body.messageId === 'string' ? body.messageId.trim() : '';
      const direction = body.direction;
      if (
        !messageId ||
        (direction !== 'positive' && direction !== 'negative')
      ) {
        res
          .status(400)
          .json({
            error: 'messageId and direction (positive|negative) are required',
          });
        return;
      }
      const reasons = Array.isArray(body.reasons)
        ? (body.reasons as string[]).filter(r => typeof r === 'string')
        : undefined;
      const comment =
        typeof body.comment === 'string' ? body.comment.trim() : undefined;
      const sessionId =
        typeof body.sessionId === 'string'
          ? body.sessionId.trim() || undefined
          : undefined;

      const id = await sessions!.saveFeedback(userRef, {
        messageId,
        sessionId,
        direction,
        reasons: reasons && reasons.length > 0 ? reasons : undefined,
        comment: comment || undefined,
      });
      res.json({ success: true, id });
    }),
  );

  router.get(
    '/sessions/:sessionId/messages',
    withRoute(
      req => `GET /sessions/${req.params.sessionId}/messages`,
      'Failed to get session messages',
      async (req, res) => {
        if (missingSessions(res)) return;
        validateSessionId(req.params.sessionId);
        const userRef = await getUserRef(req);
        const session = await sessions!.getSession(
          req.params.sessionId,
          userRef,
        );
        if (!session) {
          notFound(res, 'Session');
          return;
        }

        // Try local message store first — this is the primary source of
        // truth, especially for Kagenti where the remote API has no
        // history endpoint.
        const rawLimit = parseInt(String(req.query.limit), 10);
        const rawOffset = parseInt(String(req.query.offset), 10);
        const msgLimit = Number.isFinite(rawLimit)
          ? Math.min(Math.max(1, rawLimit), 500)
          : undefined;
        const msgOffset = Number.isFinite(rawOffset)
          ? Math.max(0, rawOffset)
          : undefined;
        const localMessages = await sessions!.getMessages(
          req.params.sessionId,
          msgLimit,
          msgOffset,
        );

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
            ...(m.citations
              ? { citations: safeJsonParse(m.citations) }
              : {}),
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

        // Fall back to provider API for LlamaStack sessions that predate
        // local persistence.
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
              `Session ${req.params.sessionId} has conversationId ${session.conversationId} but returned 0 messages — conversation data may have been lost`,
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
