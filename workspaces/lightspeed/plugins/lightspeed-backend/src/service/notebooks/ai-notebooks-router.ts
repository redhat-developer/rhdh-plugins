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
import { NotAllowedError } from '@backstage/errors';

import express, { Router } from 'express';
import multer from 'multer';
import fetch from 'node-fetch';

import { lightspeedNotebooksUsePermission } from '@red-hat-developer-hub/backstage-plugin-lightspeed-common';

import { getUserRef } from '../auth-helpers';
import { userPermissionAuthorization } from '../permission';
import {
  DocumentListResponse,
  DocumentResponse,
  SessionListResponse,
  SessionResponse,
} from './ai-notebooks-types';
import { DocumentService } from './document-service';
import { isValidFileSize, isValidFileType, parseFile } from './fileParser';
import { SessionService } from './session-service';

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

  const llamaStackUrl = config.getOptionalString(
    'lightspeed.aiNotebooks.llamaStack.url',
  ) as string;

  logger.info(`AI Notebooks connecting to Llama Stack at ${llamaStackUrl}`);

  const sessionService = new SessionService(llamaStackUrl, logger, config);
  const documentService = new DocumentService(llamaStackUrl, logger, config);

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 20 * 1024 * 1024, // 20MB
    },
  });

  const authorizer = userPermissionAuthorization(permissions);

  const handleError = (res: any, error: unknown, message: string) => {
    const errormsg = `${message}: ${error}`;
    logger.error(errormsg);

    if (error instanceof NotAllowedError) {
      res.status(403).json({ status: 'error', error: error.message });
    } else {
      res.status(500).json({ status: 'error', error: errormsg });
    }
  };

  const checkPermission = async (req: any): Promise<void> => {
    const credentials = await httpAuth.credentials(req);
    await authorizer.authorizeUser(
      lightspeedNotebooksUsePermission,
      credentials,
    );
  };

  // Helper function to parse file from upload or URL
  const parseFileContent = async (
    fileType: string,
    file: Express.Multer.File | undefined,
    urlParam: string | undefined,
  ) => {
    if (fileType === 'url') {
      if (!urlParam) {
        throw new Error('URL is required when fileType is "url"');
      }
      logger.info(`Fetching URL ${urlParam} for fileType ${fileType}`);
      return await parseFile(Buffer.from(''), urlParam, fileType);
    }
    if (!file) {
      throw new Error('No file uploaded');
    }
    if (!isValidFileSize(file.size)) {
      throw new Error('File size exceeds 20MB limit');
    }
    logger.info(`Parsing file ${file.originalname} for fileType ${fileType}`);
    return await parseFile(file.buffer, file.originalname, fileType);
  };

  notebooksRouter.get('/health', async (_req, res) => {
    res.json({ status: 'ok' });
  });

  /**
   * POST /v1/sessions
   * Create a new session
   */
  notebooksRouter.post('/v1/sessions', async (req, res) => {
    try {
      await checkPermission(req);

      const userId = await getUserRef(req, httpAuth, userInfo);
      const { name, description, metadata } = req.body;

      if (!name) {
        res.status(400).json({ status: 'error', error: 'name is required' });
        return;
      }

      // Initialize metadata with conversation_id as null
      // Will be populated on first query
      const sessionMetadata = {
        ...metadata,
        conversation_id: null,
      };

      const session = await sessionService.createSession(
        userId,
        name,
        description,
        sessionMetadata,
      );

      const response: SessionResponse = {
        status: 'success',
        session,
        message: 'Session created successfully',
      };

      res.json(response);
    } catch (error) {
      handleError(res, error, 'Error creating session');
    }
  });

  /**
   * GET /v1/sessions
   * List all sessions
   */
  notebooksRouter.get('/v1/sessions', async (req, res) => {
    try {
      await checkPermission(req);

      const userId = await getUserRef(req, httpAuth, userInfo);
      const sessions = await sessionService.listSessions(userId);

      // Optional filtering
      let filteredSessions = sessions;
      const category = req.query.category as string | undefined;
      if (category) {
        filteredSessions = filteredSessions.filter(
          s => s.metadata?.category === category,
        );
      }

      const tagsParam = req.query.tags as string | undefined;
      if (tagsParam) {
        const requestedTags = tagsParam.split(',').map(t => t.trim());
        filteredSessions = filteredSessions.filter(session => {
          if (!session.metadata?.tags) return false;
          return requestedTags.some(tag =>
            session.metadata!.tags!.includes(tag),
          );
        });
      }

      const project = req.query.project as string | undefined;
      if (project) {
        filteredSessions = filteredSessions.filter(
          s => s.metadata?.project === project,
        );
      }

      const response: SessionListResponse = {
        status: 'success',
        sessions: filteredSessions,
        count: filteredSessions.length,
      };

      res.json(response);
    } catch (error) {
      handleError(res, error, 'Error listing sessions');
    }
  });

  /**
   * GET /v1/sessions/:sessionId
   * Get a single session by ID
   */
  notebooksRouter.get('/v1/sessions/:sessionId', async (req, res) => {
    try {
      await checkPermission(req);

      const userId = await getUserRef(req, httpAuth, userInfo);
      const { sessionId } = req.params;

      const session = await sessionService.readSession(sessionId, userId);

      const response: SessionResponse = {
        status: 'success',
        session,
        message: 'Session retrieved successfully',
      };

      res.json(response);
    } catch (error) {
      handleError(res, error, 'Error reading session');
    }
  });

  /**
   * PUT /v1/sessions/:sessionId
   * Update an existing session
   */
  notebooksRouter.put('/v1/sessions/:sessionId', async (req, res) => {
    try {
      await checkPermission(req);

      const userId = await getUserRef(req, httpAuth, userInfo);
      const { sessionId } = req.params;
      const { name, description, metadata } = req.body;

      const session = await sessionService.updateSession(
        sessionId,
        userId,
        name,
        description,
        metadata,
      );

      const response: SessionResponse = {
        status: 'success',
        session,
        message: 'Session updated successfully',
      };

      res.json(response);
    } catch (error) {
      handleError(res, error, 'Error updating session');
    }
  });

  /**
   * DELETE /v1/sessions/:sessionId
   * Delete a session and all its documents
   */
  notebooksRouter.delete('/v1/sessions/:sessionId', async (req, res) => {
    try {
      await checkPermission(req);

      const userId = await getUserRef(req, httpAuth, userInfo);
      const { sessionId } = req.params;

      const session = await sessionService.readSession(sessionId, userId);
      await sessionService.deleteSession(sessionId, userId);

      const response: SessionResponse = {
        status: 'success',
        session,
        message: 'Session deleted successfully',
      };

      res.json(response);
    } catch (error) {
      handleError(res, error, 'Error deleting session');
    }
  });

  /**
   * POST /v1/sessions/:sessionId/documents/upload
   * Upload and parse a document file (md, txt, pdf, json, yaml, yml, log) or URL
   */
  notebooksRouter.post(
    '/v1/sessions/:sessionId/documents/upload',
    upload.single('file') as any,
    async (req, res) => {
      try {
        await checkPermission(req);

        const userId = await getUserRef(req, httpAuth, userInfo);
        const sessionId = req.params.sessionId as string;
        const fileType = req.body.fileType as string;
        const customTitle = req.body.title as string | undefined;

        if (!fileType || !isValidFileType(fileType)) {
          res.status(400).json({
            status: 'error',
            error: `Unsupported file type: ${fileType}. Supported types: md, txt, pdf, json, yaml, yml, log, url`,
          });
          return;
        }

        const parsedDocument = await parseFileContent(
          fileType,
          req.file,
          req.body.file,
        );
        const documentTitle =
          customTitle ||
          parsedDocument.metadata.fileName.replace(/\.[^/.]+$/, '');

        const result = await documentService.uploadDocument(
          sessionId,
          userId,
          documentTitle,
          parsedDocument.content,
          parsedDocument.metadata,
        );

        const response: DocumentResponse = {
          status: 'success',
          document_id: result.document_id,
          title: documentTitle,
          session_id: sessionId,
          replaced: false,
          message: 'Document created successfully',
        };

        res.json(response);
      } catch (error) {
        handleError(res, error, 'Error uploading document');
      }
    },
  );

  /**
   * GET /v1/sessions/:sessionId/documents
   * List all documents in a session
   */
  notebooksRouter.get('/v1/sessions/:sessionId/documents', async (req, res) => {
    try {
      await checkPermission(req);

      const userId = await getUserRef(req, httpAuth, userInfo);
      const sessionId = req.params.sessionId as string;
      const fileType = req.query.fileType as string | undefined;

      // Validate session exists and user has access
      await sessionService.readSession(sessionId, userId);

      const documents = await documentService.listDocuments(
        sessionId,
        userId,
        fileType,
      );

      const response: DocumentListResponse = {
        status: 'success',
        session_id: sessionId,
        documents,
        count: documents.length,
      };

      res.json(response);
    } catch (error) {
      handleError(res, error, 'Error listing documents');
    }
  });

  /**
   * PUT /v1/sessions/:sessionId/documents/:documentId
   * Update a document's title and/or content
   * - To update only title: provide only "title" parameter
   * - To update content: must provide file upload or URL (not direct content)
   */
  notebooksRouter.put(
    '/v1/sessions/:sessionId/documents/:documentId',
    upload.single('file') as any,
    async (req, res) => {
      try {
        await checkPermission(req);

        const userId = await getUserRef(req, httpAuth, userInfo);
        const sessionId = req.params.sessionId as string;
        const currentDocumentId = req.params.documentId as string;
        const newTitle = req.body.title as string | undefined;
        const fileType = req.body.fileType as string | undefined;

        let content: string | undefined;

        // Handle content updates - must be file upload or URL
        if (fileType) {
          if (!isValidFileType(fileType)) {
            res.status(400).json({
              status: 'error',
              error: `Unsupported file type: ${fileType}`,
            });
            return;
          }

          const parsedDocument = await parseFileContent(
            fileType,
            req.file,
            req.body.file,
          );
          content = parsedDocument.content;
        }

        // Validate: at least title or content must be provided
        if (!newTitle && !content) {
          res.status(400).json({
            status: 'error',
            error:
              'At least one of title or file/URL must be provided for update',
          });
          return;
        }

        const result = await documentService.updateDocument(
          sessionId,
          userId,
          currentDocumentId,
          newTitle,
          content,
          { fileType: fileType || 'text' },
        );

        const response: DocumentResponse = {
          status: 'success',
          document_id: result.document_id,
          title: newTitle || currentDocumentId,
          session_id: sessionId,
          replaced: true,
          message: 'Document updated successfully',
        };

        res.json(response);
      } catch (error) {
        handleError(res, error, 'Error updating document');
      }
    },
  );

  /**
   * DELETE /v1/sessions/:sessionId/documents/:documentId
   * Delete a document from a session
   */
  notebooksRouter.delete(
    '/v1/sessions/:sessionId/documents/:documentId',
    async (req, res) => {
      try {
        await checkPermission(req);

        const userId = await getUserRef(req, httpAuth, userInfo);
        const sessionId = req.params.sessionId as string;
        const documentId = req.params.documentId as string;

        // Validate session exists and user has access
        await sessionService.readSession(sessionId, userId);

        await documentService.deleteDocument(sessionId, documentId);

        const response: DocumentResponse = {
          status: 'success',
          document_id: documentId,
          session_id: sessionId,
          message: 'Document deleted successfully',
        };

        res.json(response);
      } catch (error) {
        handleError(res, error, 'Error deleting document');
      }
    },
  );

  /**
   * POST /v1/sessions/:sessionId/query
   * Send a query to the AI assistant for notebook/session conversations
   * Uses session-specific vector store with uploaded documents and notebook system prompts
   */
  notebooksRouter.post('/v1/sessions/:sessionId/query', async (req, res) => {
    try {
      await checkPermission(req);

      const userId = await getUserRef(req, httpAuth, userInfo);
      const sessionId = req.params.sessionId as string;
      const { query } = req.body;

      if (!query) {
        res.status(400).json({ status: 'error', error: 'query is required' });
        return;
      }

      logger.info(
        `/notebooks/v1/sessions/${sessionId}/query receives call from user: ${userId}`,
      );

      // Get session to check for existing conversation_id
      const session = await sessionService.readSession(sessionId, userId);
      const existingConversationId = session.metadata?.conversation_id;

      // Add vector store IDs for RAG
      req.body.vector_store_ids = [sessionId];

      // Use existing conversation_id from session metadata, or let lightspeed-core generate a new one
      if (existingConversationId) {
        req.body.conversation_id = existingConversationId;
        logger.info(
          `Using existing conversation_id: ${existingConversationId}`,
        );
      } else {
        // Don't set conversation_id - lightspeed-core will generate one
        delete req.body.conversation_id;
        logger.info(
          'First query - lightspeed-core will generate conversation_id',
        );
      }

      // Add input shields for safety filtering
      // req.body.shield_ids = ['notebook_question_validation']; // TODO: Issue made in LCORE-230

      const userQueryParam = `user_id=${encodeURIComponent(userId)}`;
      const requestBody = JSON.stringify(req.body);
      const fetchResponse = await fetch(
        `http://0.0.0.0:8080/v1/streaming_query?${userQueryParam}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: requestBody,
        },
      );

      if (!fetchResponse.ok) {
        const errorBody = (await fetchResponse.json()) as any;

        logger.error(
          'Lightspeed-core error response:',
          JSON.stringify(errorBody, null, 2) as unknown as Error,
        );
        const errormsg = `Error from Llama Stack server: ${errorBody?.detail?.[0]?.msg || errorBody?.detail?.cause || 'Unknown error'}`;
        logger.error(errormsg);

        res.status(500).json({
          status: 'error',
          error: errormsg,
        });
        return;
      }
      console.log(fetchResponse, 'fetchResponse');

      // If this is the first query, capture conversation_id from the streaming response
      if (!existingConversationId) {
        const { Transform } = await import('stream');
        let conversationIdCaptured = false;

        const captureTransform = new Transform({
          transform(chunk, _encoding, callback) {
            // Pass through the chunk to client
            this.push(chunk);

            // Try to extract conversation_id from SSE data
            if (!conversationIdCaptured) {
              const chunkStr = chunk.toString();
              const lines = chunkStr.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    const conversationId = data?.data?.conversation_id;
                    if (conversationId) {
                      // Capture the conversation_id and update session metadata asynchronously
                      conversationIdCaptured = true;
                      logger.info(
                        `Captured new conversation_id: ${conversationId}`,
                      );

                      // Update session metadata asynchronously (don't block the stream)
                      sessionService
                        .updateSession(
                          sessionId,
                          userId,
                          undefined,
                          undefined,
                          {
                            ...session.metadata,
                            conversation_id: conversationId,
                          },
                        )
                        .catch(err => {
                          logger.error(
                            `Failed to update session with conversation_id: ${err}`,
                          );
                        });

                      break;
                    }
                  } catch (parseError) {
                    // Ignore parse errors for non-JSON lines
                  }
                }
              }
            }

            callback();
          },
        });

        // Stream through the transform to capture conversation_id while passing to client
        fetchResponse.body?.pipe(captureTransform).pipe(res);
      } else {
        // Just stream directly for subsequent queries
        fetchResponse.body?.pipe(res);
      }
    } catch (error: any) {
      const errormsg = `Error fetching notebook completions: ${error.message}`;
      logger.error(errormsg);

      if (error instanceof NotAllowedError) {
        res.status(403).json({ status: 'error', error: error.message });
      } else {
        res.status(500).json({ status: 'error', error: errormsg });
      }
    }
  });

  // Wrap the notebooks router with the /ai-notebooks prefix
  const router = Router();
  router.use('/ai-notebooks', notebooksRouter);
  return router;
}
