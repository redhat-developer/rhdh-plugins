import express from 'express';
import Router from 'express-promise-router';
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
import {
  createSearchParams,
  decodeGetEntitiesRequest,
  ModelServiceApi,
} from '@red-hat-developer-hub/backstage-plugin-ai-experience-common';

export async function createRouter({
  modelService,
}: {
  modelService: ModelServiceApi;
}): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  router.get('/health', async (_, res) => {
    res.json({ status: 'ok' });
  });

  router.get('/models', async (req, res) => {
    const request = decodeGetEntitiesRequest(
      createSearchParams({ query: req.query as Record<string, string> }),
    );
    const models = await modelService.getModels(request);
    res.json(models);
  });
  router.get('/templates', async (req, res) => {
    const request = decodeGetEntitiesRequest(
      createSearchParams({ query: req.query as Record<string, string> }),
    );
    const templates = await modelService.getTemplates(request);
    res.json(templates);
  });

  return router;
}
