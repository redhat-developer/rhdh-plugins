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

import { Readable } from 'stream';

import {
  DEFAULT_LIGHTSPEED_SERVICE_PORT,
  HTTP_STATUS_ACCEPTED,
  HTTP_STATUS_INTERNAL_ERROR,
  LIGHTSPEED_SERVICE_HOST,
  MAX_QUERY_RETRIES,
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
  const lightspeedBaseUrl = `http://${LIGHTSPEED_SERVICE_HOST}:${lightSpeedPort}`;
  const queryModel = config.getOptionalString(
    'lightspeed.Notebooks.queryDefaults.model',
  );
  const queryProvider = config.getOptionalString(
    'lightspeed.Notebooks.queryDefaults.provider_id',
  );

  if (!queryModel && !queryProvider) {
    logger.info('No query model and provider configured, using default values');
  } else if (!queryModel || !queryProvider) {
    throw new Error('Query model and providers should be configured together');
  }

  logger.info(
    `AI Notebooks connecting to Lightspeed-Core at ${lightspeedBaseUrl}`,
  );

  // Create singleton VectorStoresOperator - proxies vector store operations through lightspeed-core
  const vectorStoresOperator = new VectorStoresOperator(
    lightspeedBaseUrl,
    logger,
  );

  // Services now use the operator instead of direct llama stack connection
  const sessionService = new SessionService(
    vectorStoresOperator,
    logger,
    config,
  );
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

  const requireSessionOwnership = () => {
    return async (req: any, res: any, next: any) => {
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
  };

  const withAuth = (
    handler: (req: any, res: any, userId: string) => Promise<void>,
  ) => {
    return async (req: any, res: any, next: any) => {
      try {
        const userId = await getUserId(req);
        await handler(req, res, userId);
      } catch (error) {
        next(error);
      }
    };
  };

  const createConversationIdCaptureTransform = (
    session: any,
    sessionId: string,
    userId: string,
  ) => {
    const { Transform } = require('stream');
    let conversationIdCaptured = false;
    let buffer = '';

    return new Transform({
      transform(chunk: any, _encoding: any, callback: any) {
        this.push(chunk);

        if (!conversationIdCaptured) {
          const chunkStr = buffer + chunk.toString();
          const lines = chunkStr.split('\n');
          buffer = chunkStr.endsWith('\n') ? '' : lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                const conversationId = data?.data?.conversation_id;
                if (conversationId) {
                  conversationIdCaptured = true;
                  buffer = '';
                  logger.info(
                    `Captured new conversation_id: ${conversationId}`,
                  );

                  sessionService
                    .updateSession(sessionId, userId, undefined, undefined, {
                      ...session.metadata,
                      conversation_id: conversationId,
                    })
                    .catch((err: any) => {
                      logger.error(
                        `Failed to update session with conversation_id: ${err}`,
                      );
                    });

                  break;
                }
              } catch (parseError) {
                logger.error(`Failed to parse conversation_id: ${parseError}`);
              }
            }
          }
        }

        callback();
      },
    });
  };

  notebooksRouter.get('/health', async (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Apply permission check to all routes after health
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
    withAuth(async (req, res, _userId) => {
      const sessionId = req.params.sessionId as string;
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
      const sessionId = req.params.sessionId as string;
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

      const parsedDocument = await parseFileContent(
        logger,
        fileType,
        req.file,
        req.body.file,
      );
      const fileId = await documentService.uploadFile(
        parsedDocument.content,
        title,
        fileType,
      );
      const session = await sessionService.readSession(sessionId, userId);
      if (!session) {
        handleError(logger, res, 'Session not found');
        return;
      }

      // Return 202 Accepted immediately for async processing
      res.status(HTTP_STATUS_ACCEPTED).json({
        status: 'processing',
        document_id: newTitle || title,
        session_id: sessionId,
        message: 'Document upload started',
      });

      // Upload document to vector store in background
      logger.info(`Starting background upload for ${newTitle || title}`);
      documentService
        .upsertDocument(sessionId, title, fileType, fileId, newTitle)
        .then(() => {
          logger.info(`Background upload succeeded for ${newTitle || title}`);
        })
        .catch((err: any) => {
          logger.error(
            `Background document upload failed for ${newTitle || title}: ${err.message || err}`,
            err,
          );
        });
    }),
  );

  notebooksRouter.get(
    '/v1/sessions/:sessionId/documents/:documentId/status',
    requireSessionOwnership(),
    withAuth(async (req, res, _userId) => {
      const { sessionId, documentId } = req.params;

      if (!documentId) {
        handleError(logger, res, 'document_id query parameter is required');
        return;
      }

      // Get file status directly from Llama Stack
      const fileStatus = await documentService.getFileStatus(
        sessionId,
        documentId,
      );

      res.json({
        status: fileStatus.status,
        document_id: documentId,
        session_id: sessionId,
        ...(fileStatus.error ? { error: fileStatus.error } : {}),
      });
    }),
  );

  notebooksRouter.delete(
    '/v1/sessions/:sessionId/documents/:documentId',
    requireSessionOwnership(),
    withAuth(async (req, res, _userId) => {
      const sessionId = req.params.sessionId as string;
      const documentId = req.params.documentId as string;

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
      const sessionId = req.params.sessionId as string;
      const { query } = req.body;

      if (!query) {
        handleError(logger, res, 'query is required');
        return;
      }

      logger.info(
        `/notebooks/v1/sessions/${sessionId}/query receives call from user: ${userId}`,
      );

      const session = await sessionService.readSession(sessionId, userId);
      let conversationId = session.metadata?.conversation_id;

      req.body.vector_store_ids = [sessionId];
      req.body.model = queryModel;
      req.body.provider = queryProvider;
      if (conversationId) {
        req.body.conversation_id = conversationId;
        logger.info(`Using conversation_id: ${conversationId}`);
      } else {
        logger.info('Starting new conversation');
      }

      let retries = 0;
      while (retries <= MAX_QUERY_RETRIES) {
        const fetchResponse = await fetch(
          `${lightspeedBaseUrl}/v1/streaming_query?user_id=${encodeURIComponent(userId)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
          },
        );

        // Retry once if conversation_id not found (orphaned from interrupted query)
        if (
          !fetchResponse.ok &&
          conversationId &&
          fetchResponse.status === 404 &&
          retries === 0
        ) {
          logger.warn(
            `Conversation ${conversationId} not found - clearing and retrying`,
          );
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
          delete req.body.conversation_id;
          conversationId = null;
          retries++;
          continue;
        }

        if (!fetchResponse.ok) {
          const errorBody = (await fetchResponse.json()) as any;
          logger.error('Lightspeed-core error response:', errorBody);
          const errormsg = `Error from Llama Stack server: ${errorBody?.detail?.[0]?.msg || errorBody?.detail?.cause || 'Unknown error'}`;
          const statusCode =
            fetchResponse.status >= 400 && fetchResponse.status < 500
              ? fetchResponse.status
              : HTTP_STATUS_INTERNAL_ERROR;
          res.status(statusCode).json({ status: 'error', error: errormsg });
          return;
        }

        if (fetchResponse.body) {
          const body = Readable.fromWeb(fetchResponse.body as any);
          if (!conversationId) {
            const captureTransform = createConversationIdCaptureTransform(
              session,
              sessionId,
              userId,
            );
            body.pipe(captureTransform).pipe(res);
          } else {
            body.pipe(res);
          }
        }
        break;
      }
    }),
  );

  // Global error handler
  notebooksRouter.use((err: Error, req: any, res: any, _next: any) => {
    handleError(logger, res, err, req.path);
  });

  // Wrap the notebooks router with the /ai-notebooks prefix
  const router = Router();
  router.use('/ai-notebooks', notebooksRouter);
  return router;
}
