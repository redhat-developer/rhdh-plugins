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
import express from 'express';
import Router from 'express-promise-router';
import { defaultCardsServiceRef } from './services/DefaultCardsService';

export async function createRouter({
  httpAuth,
  defaultCards,
}: {
  httpAuth: HttpAuthService;
  defaultCards: typeof defaultCardsServiceRef.T;
}): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  router.get('/default-cards', async (req, res) => {
    const credentials = await httpAuth.credentials(req, { allow: ['user'] });
    const result = await defaultCards.getDefaultCards({ credentials });
    res.json(result);
  });

  return router;
}
