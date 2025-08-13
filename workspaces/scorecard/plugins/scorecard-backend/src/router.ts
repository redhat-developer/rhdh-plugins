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
import { TodoListService } from './services/TodoListService/types';
import { MetricService } from './services/metrics/MetricService';

export async function createRouter({
  httpAuth,
  todoListService,
  metricService,
}: {
  httpAuth: HttpAuthService;
  todoListService: TodoListService;
  metricService: MetricService;
}): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

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

  router.get('/metrics', async (req, res) => {
    const metricsSchema = z.object({
      datasource: z.string().min(1).optional(),
    });

    const parsed = metricsSchema.safeParse(req.query);
    if (!parsed.success) {
      throw new InputError(`Invalid query parameters: ${parsed.error.message}`);
    }

    const { datasource } = parsed.data;

    let metrics;
    if (datasource) {
      metrics = metricService.listMetricsByDatasource(datasource);
    } else {
      metrics = metricService.listMetrics();
    }

    res.json({ metrics });
  });

  router.get('/catalog/:kind/:namespace/:name/metrics', async (req, res) => {
    const { metricIds } = req.query;

    const catalogMetricsSchema = z.object({
      metricIds: z.string().optional(),
    });

    const parsed = catalogMetricsSchema.safeParse(req.query);
    if (!parsed.success) {
      throw new InputError(`Invalid query parameters: ${parsed.error.message}`);
    }

    if (metricIds) {
      const metricIdArray = (metricIds as string)
        .split(',')
        .map(id => id.trim());
      const results = await metricService.calculateMetricResult(metricIdArray);
      res.json(results);
    } else {
      const results = await metricService.calculateMetricResult();
      res.json(results);
    }
  });

  return router;
}
