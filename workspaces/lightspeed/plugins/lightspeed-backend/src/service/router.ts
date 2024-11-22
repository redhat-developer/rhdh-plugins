/*
 * Copyright 2024 The Backstage Authors
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
import { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
import { NotAllowedError } from '@backstage/errors';
import { createPermissionIntegrationRouter } from '@backstage/plugin-permission-node';

import { BaseMessage, HumanMessage } from '@langchain/core/messages';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import express, { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

import {
  lightspeedConversationsCreatePermission,
  lightspeedConversationsDeletePermission,
  lightspeedConversationsReadPermission,
  lightspeedPermissions,
} from '@red-hat-developer-hub/backstage-plugin-lightspeed-common';

import {
  deleteHistory,
  loadAllConversations,
  loadHistory,
  saveHistory,
  saveSummary,
} from '../handlers/chatHistory';
import {
  generateConversationId,
  validateUserRequest,
} from '../handlers/conversationId';
import { userPermissionAuthorization } from './permission';
import {
  ConversationSummary,
  DEFAULT_HISTORY_LENGTH,
  QueryRequestBody,
  Roles,
  RouterOptions,
} from './types';
import {
  validateCompletionsRequest,
  validateLoadHistoryRequest,
} from './validation';

/**
 * @public
 * The lightspeed backend router
 */
export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, config, httpAuth, userInfo, permissions } = options;

  const router = Router();
  router.use(express.json());

  router.get('/health', (_, response) => {
    response.json({ status: 'ok' });
  });

  const permissionIntegrationRouter = createPermissionIntegrationRouter({
    permissions: lightspeedPermissions,
  });
  router.use(permissionIntegrationRouter);

  const authorizer = userPermissionAuthorization(permissions);

  // Middleware proxy to exclude /v1/query
  router.use('/v1', async (req, res, next) => {
    if (req.path === '/query') {
      return next(); // This will skip proxying and go to /v1/query endpoint
    }
    // TODO: parse server_id from req.body and get URL and token when multi-server is supported
    const credentials = await httpAuth.credentials(req);
    const user = await userInfo.getUserInfo(credentials);
    const userEntity = user.userEntityRef;

    logger.info(`/v1 receives call from user: ${userEntity}`);
    try {
      await authorizer.authorizeUser(
        lightspeedConversationsReadPermission,
        credentials,
      );
    } catch (error) {
      if (error instanceof NotAllowedError) {
        logger.error(error.message);
        res.status(403).json({ error: error.message });
      }
    }

    // Proxy middleware configuration
    const apiProxy = createProxyMiddleware({
      target: config.getConfigArray('lightspeed.servers')[0].getString('url'), // currently only single llm server is supported
      changeOrigin: true,
    });
    // For all other /v1/* requests, use the proxy
    const apiToken = config
      .getConfigArray('lightspeed.servers')[0]
      .getOptionalString('token'); // currently only single llm server is supported
    req.headers.authorization = `Bearer ${apiToken}`;
    return apiProxy(req, res, next);
  });

  router.post('/conversations', async (request, response) => {
    try {
      const credentials = await httpAuth.credentials(request, {
        allow: ['user'],
      });

      const userEntity = await userInfo.getUserInfo(credentials);
      const user_id = userEntity.userEntityRef;

      logger.info(`POST /conversations receives call from user: ${user_id}`);

      await authorizer.authorizeUser(
        lightspeedConversationsCreatePermission,
        credentials,
      );

      const conversation_id = generateConversationId(user_id);
      response.status(200).json({ conversation_id: conversation_id });
      response.end();
    } catch (error) {
      const errormsg = `${error}`;
      logger.error(errormsg);
      if (error instanceof NotAllowedError) {
        response.status(403).json({ error: error.message });
      } else {
        response.status(500).json({ error: errormsg });
      }
    }
  });

  router.get('/conversations', async (request, response) => {
    try {
      const credentials = await httpAuth.credentials(request);
      const userEntity = await userInfo.getUserInfo(credentials);
      const user_id = userEntity.userEntityRef;
      logger.info(`GET /conversations receives call from user: ${user_id}`);

      await authorizer.authorizeUser(
        lightspeedConversationsReadPermission,
        credentials,
      );

      const conversationList = await loadAllConversations(user_id);
      const conversationSummaryList: ConversationSummary[] = [];

      // currently only single llm server is supported
      const serverURL = config
        .getConfigArray('lightspeed.servers')[0]
        .getString('url');
      const apiToken = config
        .getConfigArray('lightspeed.servers')[0]
        .getOptionalString('token');

      // get model list and select first model to use for conversation summary
      const url = new URL(`${serverURL}/models`);
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      });
      const data = await res.json();
      let model = '';
      if (data.data && data.data[0]) {
        model = data.data[0].id;
        logger.info(`using model ${model} for retriving conversation summary`);
      } else {
        throw Error(`no available model found in server ${serverURL}`);
      }

      // get summary
      const promises = conversationList.map(async conversation_id => {
        const conversationHistory = await loadHistory(
          conversation_id,
          DEFAULT_HISTORY_LENGTH,
        );
        const history = conversationHistory.history;
        const LastMessage = history[history.length - 1];
        const timestamp = LastMessage.response_metadata.created_at;
        let chatSummary = conversationHistory.summary;
        if (!chatSummary) {
          const openAIApi = new ChatOpenAI({
            apiKey: apiToken || 'sk-no-key-required', // set to sk-no-key-required if api token is not provided
            model: model,
            streaming: false,
            temperature: 0,
            configuration: {
              baseOptions: {
                headers: {
                  ...(apiToken && { Authorization: `Bearer ${apiToken}` }),
                },
              },
              baseURL: serverURL,
            },
          });

          const summarizePrompt = ChatPromptTemplate.fromMessages([
            [
              'system',
              "Your task is to summarize of user's main purpose of a conversation in a few words without any introductory phrases. ",
            ],
            new MessagesPlaceholder('messages'),
          ]);

          const newchain = summarizePrompt.pipe(openAIApi);
          const summary = await newchain.invoke({
            messages: [
              ...history,
              new HumanMessage({
                content:
                  'summarize the above conversation to be displayed as a title in frontend for people to get a main subject of the conversation. do not form a sentence, only return the subject of the main purpose. ',
              }),
            ],
          });
          chatSummary = String(summary.content);
          saveSummary(conversation_id, chatSummary);
        }
        const conversationSummary: ConversationSummary = {
          conversation_id: conversation_id,
          summary: chatSummary,
          lastMessageTimestamp: timestamp,
        };
        conversationSummaryList.push(conversationSummary);
      });
      await Promise.all(promises);
      // Sorting the array
      conversationSummaryList.sort(
        (a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp,
      );
      response.status(200).json(conversationSummaryList);
      response.end();
    } catch (error) {
      const errormsg = `${error}`;
      logger.error(errormsg);
      console.log(errormsg);

      if (error instanceof NotAllowedError) {
        response.status(403).json({ error: error.message });
      } else {
        response.status(500).json({ error: errormsg });
      }
    }
  });

  router.get(
    '/conversations/:conversation_id',
    validateLoadHistoryRequest,
    async (request, response) => {
      const conversation_id = request.params.conversation_id;
      const historyLength = Number(request.query.historyLength);

      const loadhistoryLength: number = historyLength || DEFAULT_HISTORY_LENGTH;
      try {
        const credentials = await httpAuth.credentials(request);
        const userEntity = await userInfo.getUserInfo(credentials);
        const user_id = userEntity.userEntityRef;
        logger.info(
          `GET /conversations/:conversation_id receives call from user: ${user_id}`,
        );
        await authorizer.authorizeUser(
          lightspeedConversationsReadPermission,
          credentials,
        );

        validateUserRequest(conversation_id, user_id); // will throw error and return 500 with error message if user_id does not match

        const conversationHistory = await loadHistory(
          conversation_id,
          loadhistoryLength,
        );
        response.status(200).json(conversationHistory.history);
        response.end();
      } catch (error) {
        const errormsg = `${error}`;
        logger.error(errormsg);
        if (error instanceof NotAllowedError) {
          response.status(403).json({ error: error.message });
        } else {
          response.status(500).json({ error: errormsg });
        }
      }
    },
  );

  router.delete(
    '/conversations/:conversation_id',
    async (request, response) => {
      const conversation_id = request.params.conversation_id;
      try {
        const credentials = await httpAuth.credentials(request);
        const userEntity = await userInfo.getUserInfo(credentials);

        const user_id = userEntity.userEntityRef;

        logger.info(
          `DELETE /conversations/:conversation_id receives call from user: ${user_id}`,
        );

        await authorizer.authorizeUser(
          lightspeedConversationsDeletePermission,
          credentials,
        );

        validateUserRequest(conversation_id, user_id); // will throw error and return 500 with error message if user_id does not match

        response.status(200).json(await deleteHistory(conversation_id));
        response.end();
      } catch (error) {
        const errormsg = `${error}`;
        logger.error(errormsg);
        if (error instanceof NotAllowedError) {
          response.status(403).json({ error: error.message });
        } else {
          response.status(500).json({ error: errormsg });
        }
      }
    },
  );

  router.post(
    '/v1/query',
    validateCompletionsRequest,
    async (request, response) => {
      const { conversation_id, model, query, serverURL }: QueryRequestBody =
        request.body;
      try {
        const credentials = await httpAuth.credentials(request);
        const userEntity = await userInfo.getUserInfo(credentials);
        const user_id = userEntity.userEntityRef;

        logger.info(`/v1/query receives call from user: ${user_id}`);

        validateUserRequest(conversation_id, user_id); // will throw error and return 500 with error message if user_id does not match

        await authorizer.authorizeUser(
          lightspeedConversationsCreatePermission,
          credentials,
        );

        // currently only supports single server
        const apiToken = config
          .getConfigArray('lightspeed.servers')[0]
          .getOptionalString('token');

        const openAIApi = new ChatOpenAI({
          apiKey: apiToken || 'sk-no-key-required', // set to sk-no-key-required if api token is not provided
          model: model,
          streaming: true,
          streamUsage: false,
          temperature: 0,
          configuration: {
            baseOptions: {
              headers: {
                ...(apiToken && { Authorization: `Bearer ${apiToken}` }),
              },
            },
            baseURL: serverURL,
          },
        });

        const prompt = ChatPromptTemplate.fromMessages([
          [
            'system',
            'You are a helpful assistant that can answer question in Red Hat Developer Hub.',
          ],
          new MessagesPlaceholder('messages'),
        ]);

        let conversationHistory: BaseMessage[] = [];
        try {
          conversationHistory = (
            await loadHistory(conversation_id, DEFAULT_HISTORY_LENGTH)
          ).history;
        } catch (error) {
          logger.error(`${error}`);
        }

        const chain = prompt.pipe(openAIApi);
        let content = '';
        const userMessageTimestamp = Date.now();
        let botMessageTimestamp;
        for await (const chunk of await chain.stream({
          messages: [
            ...conversationHistory,
            new HumanMessage({
              content: query,
              response_metadata: {
                created_at: userMessageTimestamp,
              },
            }),
          ],
        })) {
          if (!botMessageTimestamp) {
            botMessageTimestamp = Date.now();
          }
          chunk.response_metadata.created_at = botMessageTimestamp;
          chunk.response_metadata.model = model;
          const data = {
            conversation_id: conversation_id,
            response: chunk,
          };
          const buf = Buffer.from(JSON.stringify(data));
          content += String(chunk.content);
          response.write(buf);
        }
        response.end();

        await saveHistory(
          conversation_id,
          Roles.HumanRole,
          query,
          userMessageTimestamp,
        );
        await saveHistory(
          conversation_id,
          Roles.AIRole,
          content,
          botMessageTimestamp,
          model,
        );
      } catch (error) {
        const errormsg = `Error fetching completions from ${serverURL}: ${error}`;
        logger.error(errormsg);

        if (error instanceof NotAllowedError) {
          response.status(403).json({ error: error.message });
        } else {
          response.status(500).json({ error: errormsg });
        }
      }
    },
  );

  const middleware = MiddlewareFactory.create({ logger, config });

  router.use(middleware.error());
  return router;
}
