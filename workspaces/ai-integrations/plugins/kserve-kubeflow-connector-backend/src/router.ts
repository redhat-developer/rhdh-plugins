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
// import { InputError } from '@backstage/errors';
// import { z } from 'zod';
import express from 'express';
import Router from 'express-promise-router';
// import { todoListServiceRef } from './services/TodoListService';
import {
  getDiscoveryUris,
  getModelCatalog,
  getModelCard,
} from './services/InformerService';

export async function createRouter(): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  // router.use('/', async (req, res, next) => {
  //   console.log(`${req.method} ${req.originalUrl}`);
  //   if ('/foo'.includes(req.path)) {
  //     res.status(200);
  //   } else {
  //     return next();
  //   }
  // });

  // List all model catalog URIs (matching Go handleCatalogDiscoveryGet, server.go lines 162-182)
  router.get('/list', async (_req, res) => {
    try {
      const discoveryResponse = getDiscoveryUris();
      res.status(200).json(discoveryResponse);
    } catch (error) {
      console.error('Error getting discovery URIs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/modelcard/:sourceId/:modelName', async (req, res) => {
    try {
      const sourceId = req.params.sourceId;
      const modelName = req.params.modelName;
      const modelCard = getModelCard(`${sourceId}/${modelName}`);
      if (modelCard) {
        res.setHeader('Content-Type', 'text/markdown');
        res.status(200).send(modelCard);
      } else {
        res.status(404).json({ error: 'Not Found' });
      }
    } catch (error) {
      console.error('Error getting model card:', error);
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
      console.error('Error getting model catalog:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
