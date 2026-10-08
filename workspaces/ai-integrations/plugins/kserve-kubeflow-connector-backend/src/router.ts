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
import express from 'express';
import Router from 'express-promise-router';
import {
  getDiscoveryUris,
  getModelCatalog,
  getModelCard,
} from './services/InformerService';

export async function createRouter(
  logger: LoggerService,
): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  router.get('/list', async (_req, res) => {
    try {
      const discoveryResponse = getDiscoveryUris();
      res.status(200).json(discoveryResponse);
    } catch (error) {
      logger.error('Error getting discovery URIs', error as Error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/modelcard/:sourceId/*', async (req, res) => {
    try {
      const sourceId = req.params.sourceId;
      const modelName = (req.params as Record<string, string>)[0];
      const modelCard = getModelCard(`${sourceId}/${modelName}`);
      if (modelCard) {
        res.setHeader('Content-Type', 'text/markdown');
        res.status(200).send(modelCard);
      } else {
        res.status(404).json({ error: 'Not Found' });
      }
    } catch (error) {
      logger.error('Error getting model card', error as Error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/models/:model/:version', async (req, res) => {
    try {
      const key = `${req.params.model}/${req.params.version}`;
      const modelCatalog = getModelCatalog(key);
      if (modelCatalog) {
        res.status(200).json(modelCatalog);
      } else {
        res.status(404).json({ error: 'Not Found' });
      }
    } catch (error) {
      logger.error('Error getting model catalog', error as Error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
