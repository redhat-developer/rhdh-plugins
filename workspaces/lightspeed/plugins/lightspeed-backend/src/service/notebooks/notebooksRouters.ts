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

import type {
  HttpAuthService,
  LoggerService,
  PermissionsService,
  UserInfoService,
} from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';

import express, { Router } from 'express';

import { lightspeedNotebooksUsePermission } from '@red-hat-developer-hub/backstage-plugin-lightspeed-common';

import { Readable, Transform } from 'stream';

import {
  DEFAULT_LIGHTSPEED_SERVICE_HOST,
  DEFAULT_LIGHTSPEED_SERVICE_PORT,
  HTTP_STATUS_ACCEPTED,
  HTTP_STATUS_INTERNAL_ERROR,
  MAX_QUERY_RETRIES,
  NOTEBOOKS_SYSTEM_PROMPT,
  upload,
} from '../constant';
import { userPermissionAuthorization } from '../permission';
import { isValidFileType, parseFileContent } from './documents/documentHelpers';
import { DocumentService } from './documents/documentService';
import { SessionService } from './sessions/sessionService';
import {
  createDocumentListResponse,
  createDocumentResponse,
  createSessionListResponse,
  createSessionResponse,
} from './types/notebooksTypes';
import { handleError } from './utils';
import { VectorStoresOperator } from './VectorStoresOperator';

export interface NotebooksRouterOptions {
  logger: LoggerService;
  config: Config;
  httpAuth: HttpAuthService;
  userInfo: UserInfoService;
  permissions: PermissionsService;
}

export async function createNotebooksRouter(
  options: NotebooksRouterOptions,
): Promise<Router> {
  const { logger, config, httpAuth, userInfo, permissions } = options;
  const notebooksRouter = Router();
  notebooksRouter.use(express.json());

  const lightSpeedPort =
    config.getOptionalNumber('lightspeed.servicePort') ??
    DEFAULT_LIGHTSPEED_SERVICE_PORT;
  const lightspeedBaseUrl = `http://${DEFAULT_LIGHTSPEED_SERVICE_HOST}:${lightSpeedPort}`;
  const queryModel = config.getOptionalString(
    'lightspeed.notebooks.queryDefaults.model',
  );
  const queryProvider = config.getOptionalString(
    'lightspeed.notebooks.queryDefaults.provider_id',
  );
  const systemPrompt = NOTEBOOKS_SYSTEM_PROMPT;

  if ((queryModel && !queryProvider) || (!queryModel && queryProvider)) {
    throw new Error('Query model and provider must be configured together');
  }

  logger.info(
    `AI Notebooks connecting to Lightspeed-Core at ${lightspeedBaseUrl}`,
  );

  const vectorStoresOperator = VectorStoresOperator.getInstance(
    lightspeedBaseUrl,
    logger,
  );
  const sessionService = new SessionService(vectorStoresOperator, logger);
  const documentService = new DocumentService(
    vectorStoresOperator,
    logger,
    config,
  );

  const authorizer = userPermissionAuthorization(permissions);

  const getUserId = async (req: any): Promise<string> => {
    const credentials = await httpAuth.credentials(req);
    const user = await userInfo.getUserInfo(credentials);
    return user.userEntityRef;
  };

  const requireNotebooksPermission = async (
    req: any,
    res: any,
    next: any,
  ): Promise<void> => {
    try {
      const credentials = await httpAuth.credentials(req);
      await authorizer.authorizeUser(
        lightspeedNotebooksUsePermission,
        credentials,
      );
      next();
    } catch (error) {
      handleError(logger, res, error, 'Permission denied');
    }
  };

  const requireSessionOwnership =
    () => async (req: any, res: any, next: any) => {
      try {
        const { sessionId } = req.params;
        const userId = await getUserId(req);
        await sessionService.readSession(sessionId, userId);
        next();
      } catch (error) {
        handleError(
          logger,
          res,
          error,
          'Session ownership verification failed',
        );
      }
    };

  const withAuth =
    (handler: (req: any, res: any, userId: string) => Promise<void>) =>
    async (req: any, res: any, next: any) => {
      try {
        const userId = await getUserId(req);
        await handler(req, res, userId);
      } catch (error) {
        next(error);
      }
    };

  /**
   * Transforms Responses API SSE (event:/data: lines) into the legacy
   * streaming format that the frontend useConversationMessages hook expects:
   *   data: {"event": "<type>", "data": {...}}\n\n
   *
   * Also captures the conversation_id from the first response.created event
   * and persists it on the session when it is new.
   */
  const createResponsesApiTransform = (
    session: any,
    sessionId: string,
    userId: string,
  ) => {
    let buffer = '';
    let conversationCaptured = !!session.metadata?.conversation_id;

    return new Transform({
      transform(chunk: any, _encoding: any, callback: any) {
        buffer += chunk.toString();

        const blocks = buffer.split('\n\n');
        buffer = blocks.pop()!;

        for (const block of blocks) {
          if (!block.trim()) continue;

          const lines = block.split('\n');
          let eventType = '';
          let dataLine = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              dataLine = line.slice(6).trim();
            }
          }

          if (dataLine === '[DONE]') {
            this.push('data: [DONE]\n\n');
            continue;
          }

          if (!dataLine) continue;

          let parsed: any;
          try {
            parsed = JSON.parse(dataLine);
          } catch {
            continue;
          }

          if (eventType === 'response.created') {
            const convId = parsed?.response?.conversation;
            const requestId = parsed?.response?.id;

            if (convId && !conversationCaptured) {
              conversationCaptured = true;
              logger.info(`Captured conversation ID: ${convId}`);
              sessionService
                .updateSession(sessionId, userId, undefined, undefined, {
                  ...session.metadata,
                  conversation_id: convId,
                })
                .catch((err: any) =>
                  logger.error(`Failed to update session: ${err}`),
                );
            }

            const legacy = {
              event: 'start',
              data: { conversation_id: convId, request_id: requestId },
            };
            this.push(`data: ${JSON.stringify(legacy)}\n\n`);
          } else if (eventType === 'response.output_text.delta') {
            const legacy = {
              event: 'token',
              data: { token: parsed?.delta ?? '' },
            };
            this.push(`data: ${JSON.stringify(legacy)}\n\n`);
          } else if (eventType === 'response.completed') {
            const usage = parsed?.response?.usage;
            const legacy = {
              event: 'end',
              data: {
                referenced_documents: [],
                input_tokens: usage?.input_tokens,
                output_tokens: usage?.output_tokens,
              },
            };
            this.push(`data: ${JSON.stringify(legacy)}\n\n`);
          }
        }

        callback();
      },

      flush(callback: any) {
        if (buffer.trim()) {
          const lines = buffer.split('\n');
          let dataLine = '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              dataLine = line.slice(6).trim();
            }
          }
          if (dataLine === '[DONE]') {
            this.push('data: [DONE]\n\n');
          }
        }
        callback();
      },
    });
  };

  notebooksRouter.get('/health', (_req, res) => res.json({ status: 'ok' }));
  notebooksRouter.use('/v1', requireNotebooksPermission);

  notebooksRouter.post(
    '/v1/sessions',
    withAuth(async (req, res, userId) => {
      const { name, description, metadata } = req.body;
      if (!name) {
        handleError(logger, res, 'name is required');
        return;
      }
      const session = await sessionService.createSession(
        userId,
        name,
        description,
        { ...metadata, conversation_id: null },
      );
      res.json(createSessionResponse(session, 'Session created successfully'));
    }),
  );

  notebooksRouter.get(
    '/v1/sessions',
    withAuth(async (_req, res, userId) => {
      const sessions = await sessionService.listSessions(userId);
      res.json(createSessionListResponse(sessions));
    }),
  );

  notebooksRouter.get(
    '/v1/sessions/:sessionId',
    withAuth(async (req, res, userId) => {
      const { sessionId } = req.params;
      const session = await sessionService.readSession(sessionId, userId);
      res.json(
        createSessionResponse(session, 'Session retrieved successfully'),
      );
    }),
  );

  notebooksRouter.put(
    '/v1/sessions/:sessionId',
    withAuth(async (req, res, userId) => {
      const { sessionId } = req.params;
      const { name, description, metadata } = req.body;
      const session = await sessionService.updateSession(
        sessionId,
        userId,
        name,
        description,
        metadata,
      );
      res.json(createSessionResponse(session, 'Session updated successfully'));
    }),
  );

  notebooksRouter.delete(
    '/v1/sessions/:sessionId',
    withAuth(async (req, res, userId) => {
      const { sessionId } = req.params;
      await sessionService.deleteSession(sessionId, userId);
      res.json(
        createSessionResponse(
          { session_id: sessionId } as any,
          'Session deleted successfully',
        ),
      );
    }),
  );

  notebooksRouter.get(
    '/v1/sessions/:sessionId/documents',
    requireSessionOwnership(),
    withAuth(async (req, res) => {
      const { sessionId } = req.params;
      const fileType = req.query.fileType as string | undefined;
      const documents = await documentService.listDocuments(
        sessionId,
        fileType,
      );
      res.json(createDocumentListResponse(sessionId, documents));
    }),
  );

  notebooksRouter.put(
    '/v1/sessions/:sessionId/documents',
    upload.single('file') as any,
    withAuth(async (req, res, userId) => {
      const { sessionId } = req.params;
      const { fileType, title, newTitle } = req.body;

      if (!title) {
        handleError(logger, res, 'title is required');
        return;
      }

      if (!fileType || !isValidFileType(fileType)) {
        handleError(
          logger,
          res,
          `Unsupported file type: ${fileType}. Supported types: md, txt, pdf, json, yaml, yml, log, url`,
        );
        return;
      }

      const session = await sessionService.readSession(sessionId, userId);
      if (!session) {
        handleError(logger, res, 'Session not found');
        return;
      }

      const parsedDocument = await parseFileContent(
        logger,
        fileType,
        req.file,
        req.body.file,
      );
      const fileId = await documentService.uploadFile(
        parsedDocument.content,
        title,
      );

      res.status(HTTP_STATUS_ACCEPTED).json({
        status: 'processing',
        document_id: newTitle || title,
        session_id: sessionId,
        message: 'Document upload started',
      });

      // Upload document to vector store in background
      const docName = newTitle || title;
      documentService
        .upsertDocument(sessionId, title, fileType, fileId, newTitle)
        .then(() => logger.info(`Background upload succeeded: ${docName}`))
        .catch((err: any) =>
          logger.error(`Background upload failed: ${docName}`, err),
        );
    }),
  );

  notebooksRouter.get(
    '/v1/sessions/:sessionId/documents/:documentId/status',
    requireSessionOwnership(),
    withAuth(async (req, res) => {
      const { sessionId, documentId } = req.params;
      const fileStatus = await documentService.getFileStatus(
        sessionId,
        documentId,
      );
      res.json({
        status: fileStatus.status,
        document_id: documentId,
        session_id: sessionId,
        ...(fileStatus.error && { error: fileStatus.error }),
      });
    }),
  );

  notebooksRouter.delete(
    '/v1/sessions/:sessionId/documents/:documentId',
    requireSessionOwnership(),
    withAuth(async (req, res) => {
      const { sessionId, documentId } = req.params;
      await documentService.deleteDocument(sessionId, documentId);
      res.json(
        createDocumentResponse(
          documentId,
          sessionId,
          'Document deleted successfully',
        ),
      );
    }),
  );

  notebooksRouter.post(
    '/v1/sessions/:sessionId/query',
    withAuth(async (req, res, userId) => {
      const { sessionId } = req.params;
      const { query } = req.body;

      if (!query) {
        handleError(logger, res, 'query is required');
        return;
      }

      const session = await sessionService.readSession(sessionId, userId);
      let conversationId = session.metadata?.conversation_id;

      const lightspeedRequest: any = {
        input: query,
        instructions: systemPrompt,
        tools: [{ type: 'file_search', vector_store_ids: [sessionId] }],
        model: `${queryProvider}/${queryModel}`,
        stream: true,
        max_tool_calls: 10,
        ...(conversationId && { conversation: conversationId }),
      };

      for (let retries = 0; retries <= MAX_QUERY_RETRIES; retries++) {
        const response = await fetch(
          `${lightspeedBaseUrl}/v1/responses?user_id=${encodeURIComponent(userId)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lightspeedRequest),
          },
        );

        // Retry once if conversation not found (orphaned from interrupted query)
        if (
          !response.ok &&
          conversationId &&
          response.status === 404 &&
          retries === 0
        ) {
          logger.warn(`Conversation ${conversationId} not found - retrying`);
          await sessionService.updateSession(
            sessionId,
            userId,
            undefined,
            undefined,
            {
              ...session.metadata,
              conversation_id: null,
            },
          );
          delete lightspeedRequest.conversation;
          conversationId = null;
          continue;
        }

        if (!response.ok) {
          const errorBody = (await response.json()) as any;
          const errorMsg =
            errorBody?.detail?.[0]?.msg ||
            errorBody?.detail?.cause ||
            'Unknown error';
          const statusCode =
            response.status >= 400 && response.status < 500
              ? response.status
              : HTTP_STATUS_INTERNAL_ERROR;
          res.status(statusCode).json({
            status: 'error',
            error: `Error from Llama Stack server: ${errorMsg}`,
          });
          return;
        }

        if (response.body) {
          const body = Readable.fromWeb(response.body as any);
          body
            .pipe(createResponsesApiTransform(session, sessionId, userId))
            .pipe(res);
        }
        break;
      }
    }),
  );

  notebooksRouter.use((err: Error, req: any, res: any, _next: any) =>
    handleError(logger, res, err, req.path),
  );

  const router = Router();
  router.use('/notebooks', notebooksRouter);
  return router;
}
