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
import { getDiscoveryUris } from './services/InformerService';

export async function createRouter(): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  router.post('/todos', async (req, res) => {
    // const parsed = todoSchema.safeParse(req.body);
    // if (!parsed.success) {
    //   throw new InputError(parsed.error.toString());
    // }
    //
    // const result = await todoList.createTodo(parsed.data, {
    //   credentials: await httpAuth.credentials(req, { allow: ['user'] }),
    // });

    res.status(201).json(req.body); // result);
  });

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

  router.get('/modelcard', async (_req, res) => {
    res.json(_req.body); // await todoList.listTodos());
  });

  router.get('/:models/:version/:format', async (req, res) => {
    res.json(req.body); // await todoList.getTodo({ id: req.params.id }));
  });

  return router;
}
