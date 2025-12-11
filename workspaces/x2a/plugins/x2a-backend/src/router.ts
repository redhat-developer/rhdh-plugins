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
import { InputError } from '@backstage/errors';
import { z } from 'zod';
import express from 'express';
import Router from 'express-promise-router';
import { convertorServiceRef } from './services/ConvertorService';

export async function createRouter({
  httpAuth,
  convertor,
}: {
  httpAuth: HttpAuthService;
  convertor: typeof convertorServiceRef.T;
}): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  // TEMPLATE NOTE:
  // Zod is a powerful library for data validation and recommended in particular
  // for user-defined schemas. In this case we use it for input validation too.
  //
  // If you want to define a schema for your API we recommend using Backstage's
  // OpenAPI tooling: https://backstage.io/docs/next/openapi/01-getting-started
  const migrationSchema = z.object({
    name: z.string(),
    // TODO: add more
    // entityRef: z.string().optional(),
  });

  router.post('/migrations', async (req, res) => {
    const parsed = migrationSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new InputError(parsed.error.toString());
    }

    const result = await convertor.createMigration(parsed.data, {
      credentials: await httpAuth.credentials(req, { allow: ['user'] }),
    });

    res.status(201).json(result);
  });

  router.get('/migrations', async (_req, res) => {
    res.json(await convertor.listMigrations());
  });

  router.get('/migrations/:id', async (req, res) => {
    res.json(await convertor.getMigration({ id: req.params.id }));
  });

  return router;
}
