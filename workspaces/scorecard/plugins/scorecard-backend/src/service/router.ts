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
import { InputError } from '@backstage/errors';
import { z } from 'zod';
import express from 'express';
import Router from 'express-promise-router';
import type { CatalogMetricService } from './CatalogMetricService';
import type { MetricProvidersRegistry } from '../providers/MetricProvidersRegistry';

export async function createRouter({
  metricProvidersRegistry,
  catalogMetricService,
}: {
  metricProvidersRegistry: MetricProvidersRegistry;
  catalogMetricService: CatalogMetricService;
}): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

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
      metrics = metricProvidersRegistry.listMetricsByDatasource(datasource);
    } else {
      metrics = metricProvidersRegistry.listMetrics();
    }

    res.json({ metrics });
  });

  router.get('/metrics/catalog/:kind/:namespace/:name', async (req, res) => {
    const { kind, namespace, name } = req.params;
    const { metricIds } = req.query;

    const catalogMetricsSchema = z.object({
      metricIds: z.string().min(1).optional(),
    });

    const parsed = catalogMetricsSchema.safeParse(req.query);
    if (!parsed.success) {
      throw new InputError(`Invalid query parameters: ${parsed.error.message}`);
    }

    const entityRef = `${kind}:${namespace}/${name}`;
    const metricIdArray = metricIds
      ? (metricIds as string).split(',').map(id => id.trim())
      : undefined;

    const results = await catalogMetricService.calculateEntityMetrics(
      entityRef,
      metricIdArray,
    );
    res.json(results);
  });

  return router;
}
