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
import { HttpAuthService } from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';
import { z } from 'zod';
import express from 'express';
import Router from 'express-promise-router';

import { MarketplacePluginEntry } from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

import { TodoListService } from './services/TodoListService/types';

export async function createRouter({
  httpAuth,
  todoListService,
}: {
  httpAuth: HttpAuthService;
  todoListService: TodoListService;
}): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  router.get('/plugins', async (_req, res) => {
    await new Promise(resolve => setTimeout(() => resolve(null), 1000));

    const plugins: MarketplacePluginEntry[] = [
      {
        metadata: {
          name: 'airbreak',
          title: 'Airbreak',
          developer: 'Spotify',
          abstract:
            'Access Airbreak error monitoring and other integrations from within...',

          categories: ['Monitoring'],
        },
        spec: {
          description:
            '## Access Airbreak error monitoring and other integrations from within...',
        },
      },
      {
        metadata: {
          name: 'airbreak2',
          title: 'Airbreak2',
          developer: 'Spotify',
          abstract:
            'Access Airbreak error monitoring and other integrations from within. Access Airbreak error monitoring and other integrations from within.',

          categories: ['Monitoring'],
        },
        spec: {
          description:
            '## Access Airbreak error monitoring and other integrations from within...',
        },
      },
      {
        metadata: {
          name: 'airbreak3',
          title: 'Airbreak3',
          developer: 'Spotify',
          abstract:
            'Access Airbreak error monitoring and other integrations from within...',

          categories: ['Monitoring'],
        },
        spec: {
          description:
            '## Access Airbreak error monitoring and other integrations from within...',
        },
      },
      {
        metadata: {
          name: 'airbreak4',
          title: 'Airbreak4',
          developer: 'Spotify',
          abstract:
            'Access Airbreak error monitoring and other integrations from within. Access Airbreak error monitoring and other integrations from within.',

          categories: ['Monitoring'],
        },
        spec: {
          description:
            '## Access Airbreak error monitoring and other integrations from within...',
        },
      },
      {
        metadata: {
          name: 'airbreak5',
          title: 'Airbreak5',
          developer: 'Spotify',
          abstract:
            'Access Airbreak error monitoring and other integrations from within...',

          categories: ['Monitoring'],
        },
        spec: {
          description:
            '## Access Airbreak error monitoring and other integrations from within...',
        },
      },
    ];

    res.json(plugins);
  });

  // TEMPLATE NOTE:
  // Zod is a powerful library for data validation and recommended in particular
  // for user-defined schemas. In this case we use it for input validation too.
  //
  // If you want to define a schema for your API we recommend using Backstage's
  // OpenAPI tooling: https://backstage.io/docs/next/openapi/01-getting-started
  const todoSchema = z.object({
    title: z.string(),
    entityRef: z.string().optional(),
  });

  router.post('/todos', async (req, res) => {
    const parsed = todoSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new InputError(parsed.error.toString());
    }

    const result = await todoListService.createTodo(parsed.data, {
      credentials: await httpAuth.credentials(req, { allow: ['user'] }),
    });

    res.status(201).json(result);
  });

  router.get('/todos', async (_req, res) => {
    res.json(await todoListService.listTodos());
  });

  router.get('/todos/:id', async (req, res) => {
    res.json(await todoListService.getTodo({ id: req.params.id }));
  });

  return router;
}
