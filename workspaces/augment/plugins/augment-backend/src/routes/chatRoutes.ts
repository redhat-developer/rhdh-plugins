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
import type { LoggerService } from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';
import type { Response } from 'express';
import type { NormalizedStreamEvent } from '../providers';
import type { ChatMessage } from '../types';
import type { SafetyChatResponse, EvaluatedChatResponse } from '../types';
import { createWithRoute } from './routeWrapper';
import { SseHeartbeat } from './sseRouteHelpers';
import type { KagentiProvider } from '../providers/kagenti/KagentiProvider';
import { sanitizeErrorMessage } from '../services/utils/errorSanitizer';
import type { FlushableResponse, RouteContext } from './types';

function getLastUserContent(messages: ChatMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      return messages[i].content || '';
    }
  }
  return '';
}

function buildSafetyResponse(
  violation: string | undefined,
  filterReason: 'input_violation' | 'output_violation',
): SafetyChatResponse {
  const defaultMessages: Record<string, string> = {
    input_violation:
      'I cannot process this request as it may violate safety guidelines.',
    output_violation:
      'The AI response was filtered because it may violate safety guidelines.',
  };
  return {
    role: 'assistant',
    content: violation || defaultMessages[filterReason],
    filtered: true,
    filterReason,
  };
}

function setupSseStream(
  res: Response,
  logger: LoggerService,
): {
  abortController: AbortController;
  clientDisconnectedRef: { current: boolean };
} {
  res.setHeader('Content-Encoding', 'identity');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const clientDisconnectedRef = { current: false };
  const abortController = new AbortController();
  res.on('close', () => {
    clientDisconnectedRef.current = true;
    abortController.abort();
    logger.info('Client disconnected from stream');
  });
  return { abortController, clientDisconnectedRef };
}

interface StreamToolCall {
  id: string;
  name: string;
  serverLabel: string;
  arguments?: string;
  output?: string;
  error?: string;
  status: string;
}

interface StreamRagSource {
  filename: string;
  text?: string;
  score?: number;
  fileId?: string;
}

interface StreamMetadata {
  agentName?: string;
  toolCalls: StreamToolCall[];
  ragSources: StreamRagSource[];
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
  reasoning: string;
}

function createStreamEventForwarder(
  res: Response,
  clientDisconnectedRef: { current: boolean },
  logger: LoggerService,
): {
  forward: (event: NormalizedStreamEvent) => void;
  streamedTextRef: { current: string };
  streamModelRef: { current: string | undefined };
  streamMetadataRef: { current: StreamMetadata };
} {
  const streamedTextRef = { current: '' };
  const streamModelRef = { current: undefined as string | undefined };
  const streamMetadataRef: { current: StreamMetadata } = {
    current: { toolCalls: [], ragSources: [], reasoning: '' },
  };
  const MAX_PENDING_EVENTS = 500;
  const state = { draining: false, terminated: false };
  const pendingQueue: string[] = [];

  function onDrain() {
    state.draining = false;
    flushQueue();
  }

  function writeAndFlush(payload: string): boolean {
    const ok = res.write(payload);
    const flushableRes = res as FlushableResponse;
    if (flushableRes.flush) flushableRes.flush();
    return ok;
  }

  function flushQueue() {
    while (
      pendingQueue.length > 0 &&
      !clientDisconnectedRef.current &&
      !state.terminated
    ) {
      const next = pendingQueue.shift()!;
      if (!writeAndFlush(next)) {
        state.draining = true;
        res.once('drain', onDrain);
        return;
      }
    }
  }

  const forward = (event: NormalizedStreamEvent) => {
    if (event.type === 'stream.started') {
      streamModelRef.current = (event as { model?: string }).model;
    } else if (event.type === 'stream.text.delta' && event.delta) {
      streamedTextRef.current += event.delta;
    } else if (
      event.type === 'stream.artifact' &&
      (event as { content?: string }).content
    ) {
      streamedTextRef.current += (event as { content?: string }).content;
    } else if (event.type === 'stream.completed' && event.usage) {
      streamMetadataRef.current.usage = event.usage;
      const u = event.usage;
      if (u.output_tokens === 0 && !streamedTextRef.current) {
        logger.warn(
          `Model "${
            streamModelRef.current ?? 'unknown'
          }" returned 0 output tokens (input=${
            u.input_tokens
          }). The model may not support the Responses API or the request format.`,
        );
      } else {
        logger.info(
          `Token usage: input=${u.input_tokens}, output=${u.output_tokens}, total=${u.total_tokens}`,
        );
      }
    } else if (event.type === 'stream.error') {
      logger.warn(`Stream error: ${event.error}`);
    } else if (event.type === 'stream.tool.approval') {
      logger.info(
        `HITL: Tool approval required for "${event.name}" - waiting for user decision`,
      );
    } else if (event.type === 'stream.agent.handoff') {
      const he = event as { toAgent?: string };
      if (he.toAgent) streamMetadataRef.current.agentName = he.toAgent;
    } else if (event.type === 'stream.reasoning.delta' && event.delta) {
      streamMetadataRef.current.reasoning += event.delta;
    } else if (event.type === 'stream.tool.started') {
      streamMetadataRef.current.toolCalls.push({
        id: event.callId,
        name: event.name,
        serverLabel: event.serverLabel || '',
        status: 'running',
      });
    } else if (event.type === 'stream.tool.completed') {
      const tc = streamMetadataRef.current.toolCalls.find(
        t => t.id === event.callId,
      );
      if (tc) {
        tc.output = event.output;
        tc.status = 'completed';
      }
    } else if (event.type === 'stream.tool.failed') {
      const tc = streamMetadataRef.current.toolCalls.find(
        t => t.id === event.callId,
      );
      if (tc) {
        tc.error = event.error;
        tc.status = 'failed';
      }
    } else if (event.type === 'stream.rag.results') {
      for (const src of event.sources) {
        streamMetadataRef.current.ragSources.push({
          filename: src.filename,
          text: src.text,
          score: src.score,
          fileId: src.fileId,
        });
      }
    }

    if (!clientDisconnectedRef.current && !state.terminated) {
      const payload = `data: ${JSON.stringify(event)}\n\n`;
      if (state.draining) {
        if (pendingQueue.length >= MAX_PENDING_EVENTS) {
          logger.warn(
            `SSE backpressure queue exceeded ${MAX_PENDING_EVENTS} events — terminating slow client`,
          );
          state.terminated = true;
          res.end();
          return;
        }
        pendingQueue.push(payload);
        return;
      }
      if (!writeAndFlush(payload)) {
        state.draining = true;
        res.once('drain', onDrain);
      }
    }
  };

  return { forward, streamedTextRef, streamModelRef, streamMetadataRef };
}

function handleStreamErrorAndCleanup(
  res: Response,
  clientDisconnectedRef: { current: boolean },
  error: unknown,
  toErrorMessage: (e: unknown) => string,
  logger: LoggerService,
): void {
  const msg = toErrorMessage(error);
  logger.error(`Streaming error: ${msg}`);
  if (!clientDisconnectedRef.current) {
    const { message: safeMsg } = sanitizeErrorMessage(msg);
    const errorEvent: NormalizedStreamEvent = {
      type: 'stream.error',
      error: safeMsg,
      code: 'stream_error',
    };
    res.write(`data: ${JSON.stringify(errorEvent)}\n\n`);
    res.end();
  }
}

/**
 * Resolve the conversationId for a request, creating one if needed
 * when the session doesn't already have a linked conversation.
 */
async function resolveConversationId(
  conversationId: string | undefined,
  sessionId: string | undefined,
  sessions: RouteContext['sessions'],
  provider: RouteContext['provider'],
  getUserRef: RouteContext['getUserRef'],
  req: Parameters<RouteContext['getUserRef']>[0],
  logger: LoggerService,
): Promise<{ resolvedConversationId: string | undefined; userRef: string }> {
  const userRef = await getUserRef(req);
  let resolvedConversationId = conversationId;

  if (!sessionId || !sessions) {
    return { resolvedConversationId, userRef };
  }

  if (resolvedConversationId) {
    const ownerSession = await sessions.findSessionByConversation(
      resolvedConversationId,
      userRef,
    );
    if (!ownerSession) {
      throw new InputError('Conversation not found or access denied');
    }
    return { resolvedConversationId, userRef };
  }

  const session = await sessions.getSession(sessionId, userRef);
  if (!session) {
    throw new InputError(`Session ${sessionId} not found`);
  }

  if (session.conversationId) {
    return { resolvedConversationId: session.conversationId, userRef };
  }

  if (!provider.conversations || provider.id === 'kagenti') {
    return { resolvedConversationId, userRef };
  }

  let newConvId: string | undefined;
  try {
    ({ conversationId: newConvId } = await provider.conversations.create());
    const linked = await sessions.setConversationIdIfNull(
      sessionId,
      userRef,
      newConvId,
    );
    if (linked) {
      resolvedConversationId = newConvId;
      logger.info(`Created conversation ${newConvId} for session ${sessionId}`);
    } else {
      await provider.conversations.deleteContainer?.(newConvId).catch(() => {});
      const refreshed = await sessions.getSession(sessionId, userRef);
      resolvedConversationId = refreshed?.conversationId ?? undefined;
      logger.info(
        `Race resolved: session ${sessionId} already linked to ${resolvedConversationId}, cleaned up ${newConvId}`,
      );
    }
  } catch (convErr) {
    if (newConvId) {
      await provider.conversations.deleteContainer?.(newConvId).catch(() => {});
    }
    logger.warn(
      `Could not create LlamaStack conversation for session ${sessionId}, continuing without: ${convErr}`,
    );
  }

  return { resolvedConversationId, userRef };
}

/**
 * Registers chat, streaming, and human-in-the-loop approval endpoints.
 */
export function registerChatRoutes(ctx: RouteContext): void {
  const {
    router,
    logger,
    sessions,
    sendRouteError,
    toErrorMessage,
    parseChatRequest,
    parseApprovalRequest,
    getUserRef,
  } = ctx;

  const withRoute = createWithRoute(logger, sendRouteError);

  router.post(
    '/chat',
    withRoute(
      'POST /chat',
      'Failed to process chat message',
      async (req, res) => {
        const provider = ctx.provider;
        const parsed = parseChatRequest(req.body);
        const {
          messages,
          enableRAG,
          previousResponseId,
          conversationId,
          sessionId,
        } = parsed;

        const [, { resolvedConversationId, userRef }] = await Promise.all([
          provider.refreshDynamicConfig?.(),
          resolveConversationId(
            conversationId,
            sessionId,
            sessions,
            provider,
            getUserRef,
            req,
            logger,
          ),
        ]);

        // Hydrate Kagenti context from DB for non-streaming path
        if (provider.id === 'kagenti' && sessionId && sessions) {
          const kagenti = provider as unknown as KagentiProvider;
          const existingCtx = kagenti.getSessionContextId(sessionId);
          if (!existingCtx) {
            const ctxFromDb =
              resolvedConversationId ||
              (await sessions.getSession(sessionId, userRef))?.conversationId;
            if (ctxFromDb) {
              kagenti.hydrateSessionContext(sessionId, ctxFromDb, parsed.model);
            }
          }
        }

        const userContent = getLastUserContent(messages);

        if (provider.id === 'kagenti') {
          (provider as unknown as KagentiProvider).setUserContext(userRef);
        }

        if (provider.safety?.isEnabled()) {
          const safetyResult = await provider.safety.checkInput(userContent);
          if (!safetyResult.safe) {
            logger.warn(`Input blocked by safety: ${safetyResult.violation}`);
            res.json(
              buildSafetyResponse(safetyResult.violation, 'input_violation'),
            );
            return;
          }
        }

        const response = await provider.chat({
          messages,
          enableRAG,
          previousResponseId,
          conversationId: resolvedConversationId,
          sessionId,
          model: parsed.model,
        });

        if (provider.safety?.isEnabled()) {
          const outputResult = await provider.safety.checkOutput(
            response.content,
          );
          if (!outputResult.safe) {
            logger.warn(`Output blocked by safety: ${outputResult.violation}`);
            res.json(
              buildSafetyResponse(outputResult.violation, 'output_violation'),
            );
            return;
          }
        }

        if (provider.evaluation?.isEnabled()) {
          const evaluation = await provider.evaluation.evaluateResponse(
            userContent,
            response.content,
            response.ragContext,
          );

          if (evaluation) {
            const evaluatedResponse: EvaluatedChatResponse = {
              ...response,
              evaluation,
            };
            if (!evaluation.passedThreshold) {
              logger.warn(
                `Response scored below threshold: ${evaluation.overallScore.toFixed(
                  2,
                )} (${evaluation.qualityLevel})`,
              );
            }
            res.json(evaluatedResponse);
            return;
          }
        }

        // Persist Kagenti context ID for non-streaming path
        if (provider.id === 'kagenti' && sessionId && sessions) {
          const ctxId = (
            provider as unknown as KagentiProvider
          ).getSessionContextId(sessionId);
          if (ctxId) {
            await sessions
              .setConversationIdIfNull(sessionId, userRef, ctxId)
              .catch(err =>
                logger.warn(
                  `Failed to link Kagenti context for session ${sessionId}: ${err}`,
                ),
              );
          }
        }

        // Persist messages to local store (non-streaming path)
        if (sessionId && sessions) {
          try {
            if (userContent) {
              await sessions.addMessage({
                sessionId,
                role: 'user',
                content: userContent,
              });
            }
            if (response.content) {
              await sessions.addMessage({
                sessionId,
                role: 'assistant',
                content: response.content,
              });
            }
          } catch (persistErr) {
            logger.warn(
              `Failed to persist messages for session ${sessionId}: ${persistErr}`,
            );
          }
        }

        res.json(response);
      },
    ),
  );

  router.post('/chat/stream', async (req, res) => {
    const provider = ctx.provider;
    logger.info('POST /chat/stream - Starting streaming response');

    let parsedRequest: ReturnType<typeof parseChatRequest>;
    try {
      parsedRequest = parseChatRequest(req.body);
    } catch (parseError) {
      sendRouteError(
        res,
        parseError,
        'Invalid stream request',
        'Invalid stream request',
      );
      return;
    }
    const {
      messages,
      enableRAG,
      previousResponseId,
      conversationId,
      sessionId,
    } = parsedRequest;

    const { abortController, clientDisconnectedRef } = setupSseStream(
      res,
      logger,
    );
    const { forward, streamedTextRef, streamMetadataRef } =
      createStreamEventForwarder(res, clientDisconnectedRef, logger);
    const heartbeat = new SseHeartbeat(res);
    heartbeat.start();

    try {
      const [, { resolvedConversationId, userRef }] = await Promise.all([
        provider.refreshDynamicConfig?.(),
        resolveConversationId(
          conversationId,
          sessionId,
          sessions,
          provider,
          getUserRef,
          req,
          logger,
        ),
      ]);

      // Hydrate Kagenti in-memory map from DB so conversation continues
      // across server restarts. The DB may have a conversation_id from a
      // previous stream even if the in-memory map was cleared.
      if (provider.id === 'kagenti' && sessionId && sessions) {
        const kagenti = provider as unknown as KagentiProvider;
        const existingCtx = kagenti.getSessionContextId(sessionId);
        if (!existingCtx) {
          const ctxFromDb =
            resolvedConversationId ||
            (await sessions.getSession(sessionId, userRef))?.conversationId;
          if (ctxFromDb) {
            kagenti.hydrateSessionContext(
              sessionId,
              ctxFromDb,
              parsedRequest.model,
            );
          }
        }
      }

      if (provider.id === 'kagenti') {
        (provider as unknown as KagentiProvider).setUserContext(userRef);
      }

      if (provider.safety?.isEnabled()) {
        const userContent = getLastUserContent(messages);
        const safetyResult = await provider.safety.checkInput(userContent);
        if (!safetyResult.safe) {
          heartbeat.stop();
          const errorEvent: NormalizedStreamEvent = {
            type: 'stream.error',
            error:
              safetyResult.violation || 'Input blocked by safety guardrails',
            code: 'safety_violation',
          };
          res.write(`data: ${JSON.stringify(errorEvent)}\n\n`);
          res.end();
          return;
        }
      }

      let eventCount = 0;
      const streamStartMs = Date.now();
      let firstEventMs: number | undefined;
      const wrappedForward = (event: NormalizedStreamEvent) => {
        eventCount++;
        if (!firstEventMs) firstEventMs = Date.now();
        forward(event);
      };

      await provider.chatStream(
        {
          messages,
          enableRAG,
          previousResponseId,
          conversationId: resolvedConversationId,
          sessionId,
          model: parsedRequest.model,
        },
        wrappedForward,
        abortController.signal,
      );

      const durationMs = Date.now() - streamStartMs;
      const ttfbMs = firstEventMs ? firstEventMs - streamStartMs : undefined;
      const ttfbInfo =
        ttfbMs !== undefined ? `, ${ttfbMs}ms to first event` : '';
      const zeroWarn =
        eventCount === 0
          ? ' (WARNING: zero events received from provider)'
          : '';
      logger.info(
        `Stream completed: ${eventCount} events, ${durationMs}ms total${ttfbInfo}${zeroWarn}`,
      );

      if (eventCount === 0 && !clientDisconnectedRef.current) {
        const zeroEventError: NormalizedStreamEvent = {
          type: 'stream.error',
          error:
            'The agent returned no response. It may not support streaming — check agent capabilities.',
          code: 'empty_stream',
        };
        res.write(`data: ${JSON.stringify(zeroEventError)}\n\n`);
      }

      let outputSafetyBlocked = false;
      if (
        streamedTextRef.current &&
        provider.safety?.isEnabled() &&
        !clientDisconnectedRef.current
      ) {
        const outputResult = await provider.safety.checkOutput(
          streamedTextRef.current,
        );
        if (!outputResult.safe) {
          outputSafetyBlocked = true;
          logger.warn(
            `Streamed output blocked by safety: ${outputResult.violation}`,
          );
          const warningEvent: NormalizedStreamEvent = {
            type: 'stream.error',
            error:
              outputResult.violation ||
              'The AI response was filtered because it may violate safety guidelines.',
            code: 'output_safety_violation',
          };
          res.write(`data: ${JSON.stringify(warningEvent)}\n\n`);
        }
      }

      // Close the SSE connection immediately so the client is unblocked.
      // Session bookkeeping runs in the background below.
      heartbeat.stop();
      if (!clientDisconnectedRef.current) {
        res.write('data: [DONE]\n\n');
        res.end();
      }

      // Fire-and-forget: persist session metadata without blocking the client.
      if (sessionId && sessions) {
        const lastUserContent = getLastUserContent(messages);
        const meta = streamMetadataRef.current;
        const streamedText = streamedTextRef.current;

        Promise.resolve()
          .then(async () => {
            const titleAndTouch: Promise<void>[] = [];

            if (lastUserContent) {
              titleAndTouch.push(
                sessions.getSession(sessionId, userRef).then(async session => {
                  if (session && session.title.startsWith('Chat ')) {
                    const autoTitle =
                      lastUserContent.slice(0, 80) || session.title;
                    await sessions.updateTitle(sessionId, userRef, autoTitle);
                  }
                }),
              );
            }

            titleAndTouch.push(sessions.touch(sessionId, userRef));

            if (provider.id === 'kagenti') {
              const ctxId = (
                provider as unknown as KagentiProvider
              ).getSessionContextId(sessionId);
              if (ctxId) {
                titleAndTouch.push(
                  sessions
                    .setConversationIdIfNull(sessionId, userRef, ctxId)
                    .then(linked => {
                      if (linked) {
                        logger.info(
                          `Linked session ${sessionId} to Kagenti context ${ctxId}`,
                        );
                      }
                    }),
                );
              }
            }

            await Promise.all(titleAndTouch);

            const messagePersists: Promise<unknown>[] = [];
            if (lastUserContent) {
              messagePersists.push(
                sessions.addMessage({
                  sessionId,
                  role: 'user',
                  content: lastUserContent,
                }),
              );
            }
            if (streamedText && !outputSafetyBlocked) {
              messagePersists.push(
                sessions.addMessage({
                  sessionId,
                  role: 'assistant',
                  content: streamedText,
                  agentName: meta.agentName,
                  toolCalls:
                    meta.toolCalls.length > 0
                      ? JSON.stringify(meta.toolCalls)
                      : undefined,
                  ragSources:
                    meta.ragSources.length > 0
                      ? JSON.stringify(meta.ragSources)
                      : undefined,
                  usage: meta.usage ? JSON.stringify(meta.usage) : undefined,
                  reasoning: meta.reasoning || undefined,
                }),
              );
            }
            await Promise.all(messagePersists);
          })
          .catch(bgErr => {
            logger.warn(
              `Background session bookkeeping failed for ${sessionId}: ${bgErr}`,
            );
          });
      }
    } catch (error) {
      heartbeat.stop();
      handleStreamErrorAndCleanup(
        res,
        clientDisconnectedRef,
        error,
        toErrorMessage,
        logger,
      );
    }
  });

  router.post(
    '/chat/approve',
    withRoute(
      'POST /chat/approve',
      'Failed to process approval',
      async (req, res) => {
        const provider = ctx.provider;
        const {
          responseId,
          callId,
          approved,
          toolName,
          toolArguments,
          reason,
        } = parseApprovalRequest(req.body);

        logger.info(
          `Processing ${
            approved ? 'approval' : 'rejection'
          } for responseId=${responseId}, callId=${callId}, tool=${toolName}`,
        );

        if (provider.id === 'kagenti') {
          const kagentiProvider = provider as unknown as KagentiProvider;
          const result = await kagentiProvider.submitApproval({
            responseId,
            callId,
            approved: approved === true,
            toolName,
            toolArguments,
            reason,
          });
          res.json({
            success: true,
            rejected: !approved,
            content: result.content,
            responseId: result.responseId,
            toolExecuted: result.toolExecuted,
            toolOutput: result.toolOutput,
            pendingApproval: result.pendingApproval,
            handoff: result.handoff,
          });
          return;
        }

        if (!provider.conversations) {
          res.status(501).json({
            success: false,
            error: 'Tool approval is not supported by the current provider',
          });
          return;
        }

        const result = await provider.conversations.submitApproval({
          responseId,
          callId,
          approved: approved === true,
          toolName,
          toolArguments,
        });

        res.json({
          success: true,
          rejected: !approved,
          content: result.content,
          responseId: result.responseId,
          toolExecuted: result.toolExecuted,
          toolOutput: result.toolOutput,
          outputTruncated: result.outputTruncated,
          pendingApproval: result.pendingApproval,
          handoff: result.handoff,
        });
      },
    ),
  );
}
