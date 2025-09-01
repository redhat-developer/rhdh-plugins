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
import { mockErrorHandler, mockServices } from '@backstage/backend-test-utils';
import express from 'express';
import request from 'supertest';

import { createRouter } from './router';
import { MetricProvidersRegistry } from '../providers/MetricProvidersRegistry';
import {
  MockNumberProvider,
  MockBooleanProvider,
  githubNumberMetricMetadata,
} from '../../__fixtures__/mockProviders';
import {
  Metric,
  MetricResult,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { CatalogMetricService } from './CatalogMetricService';
import { CatalogClient } from '@backstage/catalog-client';
import { ThresholdEvaluator } from '../threshold/ThresholdEvaluator';
import { NotFoundError } from '@backstage/errors';

const mockCatalogClient = {
  getEntityByRef: jest.fn(),
} as unknown as CatalogClient;

describe('createRouter', () => {
  let app: express.Express;
  let metricProvidersRegistry: MetricProvidersRegistry;
  let catalogMetricService: CatalogMetricService;

  beforeEach(async () => {
    metricProvidersRegistry = new MetricProvidersRegistry();
    catalogMetricService = new CatalogMetricService({
      catalogApi: mockCatalogClient,
      registry: metricProvidersRegistry,
      thresholdEvaluator: new ThresholdEvaluator(),
      logger: mockServices.logger.mock(),
      auth: mockServices.auth(),
    });
    const router = await createRouter({
      metricProvidersRegistry,
      catalogMetricService,
    });
    app = express();
    app.use(router);
    app.use(mockErrorHandler());
  });

  describe('GET /metrics', () => {
    beforeEach(() => {
      const githubProvider1 = new MockNumberProvider(
        'github.open-prs',
        'github',
        'GitHub Open PRs',
      );
      const githubProvider2 = new MockNumberProvider(
        'github.open-issues',
        'github',
        'GitHub Open Issues',
      );
      const sonarProvider = new MockBooleanProvider(
        'sonar.quality',
        'sonar',
        'Code Quality',
      );

      metricProvidersRegistry.register(githubProvider1);
      metricProvidersRegistry.register(githubProvider2);
      metricProvidersRegistry.register(sonarProvider);
    });

    it('should return all metrics', async () => {
      const response = await request(app).get('/metrics');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('metrics');
      expect(response.body.metrics).toHaveLength(3);

      const metricIds = response.body.metrics.map((m: Metric) => m.id);
      expect(metricIds).toContain('github.open-prs');
      expect(metricIds).toContain('github.open-issues');
      expect(metricIds).toContain('sonar.quality');
    });

    it('should return metrics filtered by datasource', async () => {
      const response = await request(app).get('/metrics?datasource=github');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('metrics');
      expect(response.body.metrics).toHaveLength(2);

      const metricIds = response.body.metrics.map((m: Metric) => m.id);
      expect(metricIds).toContain('github.open-prs');
      expect(metricIds).toContain('github.open-issues');
    });

    it('should return 400 InputError when invalid datasource parameter - empty string', async () => {
      const response = await request(app).get('/metrics?datasource=');

      expect(response.status).toEqual(400);
      expect(response.body.error.name).toEqual('InputError');
      expect(response.body.error.message).toContain('Invalid query parameters');
    });
  });

  describe('GET /metrics/catalog/:kind/:namespace/:name', () => {
    const mockMetricResults: MetricResult[] = [
      {
        id: 'github.open-prs',
        status: 'success',
        metadata: githubNumberMetricMetadata,
        result: {
          value: 5,
          timestamp: '2025-01-01T10:30:00.000Z',
          thresholdResult: {
            definition: {
              rules: [
                { key: 'error', expression: '>10' },
                { key: 'warning', expression: '>5' },
                { key: 'success', expression: '<=5' },
              ],
            },
            status: 'success',
            evaluation: 'success',
          },
        },
      },
      {
        id: 'github.open-issues',
        status: 'success',
        metadata: githubNumberMetricMetadata,
        result: {
          value: true,
          timestamp: '2025-01-01T10:30:00.000Z',
          thresholdResult: {
            definition: {
              rules: [
                { key: 'error', expression: '>5' },
                { key: 'success', expression: '<=5' },
              ],
            },
            status: 'success',
            evaluation: 'error',
          },
        },
      },
    ];

    beforeEach(() => {
      jest
        .spyOn(catalogMetricService, 'calculateEntityMetrics')
        .mockResolvedValue(mockMetricResults);
    });

    it('should return metrics for a specific entity', async () => {
      const response = await request(app).get(
        '/metrics/catalog/component/default/my-service',
      );

      expect(response.status).toBe(200);
      expect(catalogMetricService.calculateEntityMetrics).toHaveBeenCalledWith(
        'component:default/my-service',
        undefined,
      );
      expect(response.body).toEqual(mockMetricResults);
    });

    it('should handle multiple metricIds parameter', async () => {
      const response = await request(app).get(
        '/metrics/catalog/component/default/my-service?metricIds=github.open-prs,github.open-issues',
      );

      expect(response.status).toBe(200);
      expect(catalogMetricService.calculateEntityMetrics).toHaveBeenCalledWith(
        'component:default/my-service',
        ['github.open-prs', 'github.open-issues'],
      );
      expect(response.body).toEqual(mockMetricResults);
    });

    it('should handle single metricIds parameter', async () => {
      const response = await request(app).get(
        '/metrics/catalog/component/default/my-service?metricIds=github.open-prs',
      );

      expect(response.status).toBe(200);
      expect(catalogMetricService.calculateEntityMetrics).toHaveBeenCalledWith(
        'component:default/my-service',
        ['github.open-prs'],
      );
    });

    it('should return 404 NotFoundError when entity is not found', async () => {
      jest
        .spyOn(catalogMetricService, 'calculateEntityMetrics')
        .mockRejectedValue(
          new NotFoundError('Entity not found: component:default/non-existent'),
        );

      const response = await request(app).get(
        '/metrics/catalog/component/default/non-existent',
      );

      expect(response.status).toBe(404);
      expect(response.body.error.name).toBe('NotFoundError');
      expect(response.body.error.message).toContain('Entity not found');
    });

    it('should return 400 InputError when invalid query parameters', async () => {
      const response = await request(app).get(
        '/metrics/catalog/component/default/my-service?metricIds=',
      );

      expect(response.status).toBe(400);
      expect(response.body.error.name).toBe('InputError');
      expect(response.body.error.message).toContain('Invalid query parameters');
    });
  });
});
