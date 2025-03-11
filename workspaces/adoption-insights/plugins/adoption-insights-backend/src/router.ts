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
import { HttpAuthService } from '@backstage/backend-plugin-api';
import express, { Request, Response } from 'express';
import Router from 'express-promise-router';
import EventApiController from './controllers/EventApiController';
import { QueryParams } from './types/event-request';

export async function createRouter({
  httpAuth,
  eventApiController,
}: {
  httpAuth: HttpAuthService;
  eventApiController: EventApiController;
}): Promise<express.Router> {
  const router = Router();

  router.use(express.json());

  const getUserEntityRef = async (req: Request): Promise<string> => {
    const credentials = await httpAuth.credentials(req, {
      allow: ['user'],
    });
    return credentials.principal.userEntityRef;
  };
  // TODO: remove it and add permission support
  router.use(async (req, _, next) => {
    await getUserEntityRef(req);
    next();
  });

  router.get(
    '/events',
    async (req: Request<{}, {}, {}, QueryParams>, res: Response) =>
      eventApiController.getInsights(req, res),
  );

  router.post('/events', async (req, res) => {
    return eventApiController.trackEvents(req, res);
  });

  router.get('/health', (_, response) => {
    response.json({ status: 'ok' });
  });

  return router;
}
