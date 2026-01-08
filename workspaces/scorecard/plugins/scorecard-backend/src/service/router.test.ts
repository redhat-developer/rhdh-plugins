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
  mockErrorHandler,
  mockServices,
  ServiceMock,
} from '@backstage/backend-test-utils';
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
  AggregatedMetricResult,
  Metric,
  MetricResult,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { CatalogMetricService } from './CatalogMetricService';
import { NotFoundError } from '@backstage/errors';
import { catalogServiceMock } from '@backstage/plugin-catalog-node/testUtils';
import {
  AuthorizeResult,
  PolicyDecision,
} from '@backstage/plugin-permission-common';
import { PermissionsService } from '@backstage/backend-plugin-api';
import { mockDatabaseMetricValues } from '../../__fixtures__/mockDatabaseMetricValues';

jest.mock('../utils/getEntitiesOwnedByUser', () => ({
  getEntitiesOwnedByUser: jest.fn(),
}));

jest.mock('../permissions/permissionUtils', () => {
  const originalModule = jest.requireActual('../permissions/permissionUtils');
  return {
    ...originalModule,
    checkEntityAccess: jest.fn(),
  };
});

import * as getEntitiesOwnedByUserModule from '../utils/getEntitiesOwnedByUser';
import * as permissionUtilsModule from '../permissions/permissionUtils';
import { MockEntityBuilder } from '../../__fixtures__/mockEntityBuilder';

const CONDITIONAL_POLICY_DECISION: PolicyDecision = {
  result: AuthorizeResult.CONDITIONAL,
  pluginId: 'scorecard',
  resourceType: 'scorecard-metric',
  conditions: {
    anyOf: [
      {
        rule: 'HAS_METRIC_ID',
        resourceType: 'scorecard-metric',
        params: {
          metricIds: ['github.open_prs', 'github.open_issues'],
        },
      },
    ],
  },
};

describe('createRouter', () => {
  let app: express.Express;
  let metricProvidersRegistry: MetricProvidersRegistry;
  let catalogMetricService: CatalogMetricService;
  let httpAuthMock: ServiceMock<
    import('@backstage/backend-plugin-api').HttpAuthService
  >;
  const permissionsMock: ServiceMock<PermissionsService> =
    mockServices.permissions.mock({
      authorizeConditional: jest.fn(),
      authorize: jest.fn(),
    });

  beforeEach(async () => {
    metricProvidersRegistry = new MetricProvidersRegistry();
    const catalog = catalogServiceMock.mock();
    catalogMetricService = new CatalogMetricService({
      catalog,
      registry: metricProvidersRegistry,
      auth: mockServices.auth(),
      database: mockDatabaseMetricValues,
    });

    permissionsMock.authorizeConditional.mockResolvedValue([
      { result: AuthorizeResult.ALLOW },
    ]);

    permissionsMock.authorize.mockResolvedValue([
      { result: AuthorizeResult.ALLOW },
    ]);

    httpAuthMock = mockServices.httpAuth.mock({
      credentials: jest.fn().mockResolvedValue({
        principal: {
          userEntityRef: 'user:default/test-user',
        },
      }),
    });

    const router = await createRouter({
      metricProvidersRegistry,
      catalogMetricService,
      catalog,
      httpAuth: httpAuthMock,
      permissions: permissionsMock,
    });
    app = express();
    app.use(router);
    app.use(mockErrorHandler());
  });

  describe('GET /metrics', () => {
    beforeEach(() => {
      const githubProvider1 = new MockNumberProvider(
        'github.open_prs',
        'github',
        'GitHub Open PRs',
      );
      const githubProvider2 = new MockNumberProvider(
        'github.open_issues',
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

    it('should return 403 Unauthorized when DENY permissions', async () => {
      permissionsMock.authorizeConditional.mockResolvedValue([
        { result: AuthorizeResult.DENY },
      ]);
      const response = await request(app).get('/metrics');

      expect(response.statusCode).toBe(403);
      expect(response.body.error.name).toEqual('NotAllowedError');
    });

    it('should return all metrics', async () => {
      const response = await request(app).get('/metrics');
      console.log('response', response.body);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('metrics');
      expect(response.body.metrics).toHaveLength(3);

      const metricIds = response.body.metrics.map((m: Metric) => m.id);
      expect(metricIds).toContain('github.open_prs');
      expect(metricIds).toContain('github.open_issues');
      expect(metricIds).toContain('sonar.quality');
    });

    it('should return metrics filtered by datasource', async () => {
      const response = await request(app).get('/metrics?datasource=github');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('metrics');
      expect(response.body.metrics).toHaveLength(2);

      const metricIds = response.body.metrics.map((m: Metric) => m.id);
      expect(metricIds).toContain('github.open_prs');
      expect(metricIds).toContain('github.open_issues');
    });

    it('should filter authorized metrics when CONDITIONAL permission', async () => {
      permissionsMock.authorizeConditional.mockResolvedValue([
        CONDITIONAL_POLICY_DECISION,
      ]);
      const response = await request(app).get('/metrics');

      expect(response.statusCode).toBe(200);
      const metricIds = response.body.metrics.map((m: Metric) => m.id);
      expect(metricIds).toContain('github.open_prs');
      expect(metricIds).toContain('github.open_issues');
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
        id: 'github.open_prs',
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
        id: 'github.open_issues',
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
        .spyOn(catalogMetricService, 'getLatestEntityMetrics')
        .mockResolvedValue(mockMetricResults);
    });

    it('should return 403 Unauthorized when DENY permissions', async () => {
      permissionsMock.authorizeConditional.mockResolvedValue([
        { result: AuthorizeResult.DENY },
      ]);
      const result = await request(app).get(
        '/metrics/catalog/component/default/my-service',
      );

      expect(result.statusCode).toBe(403);
      expect(result.body.error.name).toEqual('NotAllowedError');
    });

    it('should return metrics for a specific entity', async () => {
      const response = await request(app).get(
        '/metrics/catalog/component/default/my-service',
      );

      expect(response.status).toBe(200);
      expect(catalogMetricService.getLatestEntityMetrics).toHaveBeenCalledWith(
        'component:default/my-service',
        undefined,
        undefined,
      );
      expect(response.body).toEqual(mockMetricResults);
    });

    it('should handle uppercase in url parameters', async () => {
      const response = await request(app).get(
        '/metrics/catalog/Component/default/my-service',
      );

      expect(response.status).toBe(200);
      expect(catalogMetricService.getLatestEntityMetrics).toHaveBeenCalledWith(
        'component:default/my-service',
        undefined,
        undefined,
      );
      expect(response.body).toEqual(mockMetricResults);
    });

    it('should handle multiple metricIds parameter', async () => {
      const response = await request(app).get(
        '/metrics/catalog/component/default/my-service?metricIds=github.open_prs,github.open_issues',
      );

      expect(response.status).toBe(200);
      expect(catalogMetricService.getLatestEntityMetrics).toHaveBeenCalledWith(
        'component:default/my-service',
        ['github.open_prs', 'github.open_issues'],
        undefined,
      );
      expect(response.body).toEqual(mockMetricResults);
    });

    it('should handle single metricIds parameter', async () => {
      const response = await request(app).get(
        '/metrics/catalog/component/default/my-service?metricIds=github.open_prs',
      );

      expect(response.status).toBe(200);
      expect(catalogMetricService.getLatestEntityMetrics).toHaveBeenCalledWith(
        'component:default/my-service',
        ['github.open_prs'],
        undefined,
      );
    });

    it('should filter authorized metrics when CONDITIONAL permission', async () => {
      permissionsMock.authorizeConditional.mockResolvedValue([
        CONDITIONAL_POLICY_DECISION,
      ]);
      const response = await request(app).get(
        '/metrics/catalog/component/default/my-service',
      );

      expect(response.status).toBe(200);
      expect(catalogMetricService.getLatestEntityMetrics).toHaveBeenCalledWith(
        'component:default/my-service',
        undefined,
        {
          anyOf: [
            {
              rule: 'HAS_METRIC_ID',
              resourceType: 'scorecard-metric',
              params: { metricIds: ['github.open_prs', 'github.open_issues'] },
            },
          ],
        },
      );
    });

    it('should return 404 NotFoundError when entity is not found', async () => {
      jest
        .spyOn(catalogMetricService, 'getLatestEntityMetrics')
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

  describe('GET /metrics/:metricId/catalog/aggregation', () => {
    const mockAggregatedMetricResults: AggregatedMetricResult[] = [
      {
        id: 'github.open_prs',
        status: 'success',
        metadata: {
          title: 'GitHub open PRs',
          description:
            'Current count of open Pull Requests for a given GitHub repository.',
          type: 'number',
          history: true,
        },
        result: {
          values: [
            { count: 5, name: 'success' },
            { count: 4, name: 'warning' },
            { count: 3, name: 'error' },
          ],
          total: 12,
          timestamp: '2025-01-01T10:30:00.000Z',
        },
      },
    ];
    let mockCatalog: ReturnType<typeof catalogServiceMock.mock>;
    let getEntitiesOwnedByUserSpy: jest.SpyInstance;
    let checkEntityAccessSpy: jest.SpyInstance;
    let aggregationApp: express.Express;

    beforeEach(async () => {
      const githubProvider = new MockNumberProvider(
        'github.open_prs',
        'github',
        'GitHub Open PRs',
      );
      const jiraProvider = new MockNumberProvider(
        'jira.open_issues',
        'jira',
        'Jira Open Issues',
      );
      metricProvidersRegistry.register(githubProvider);
      metricProvidersRegistry.register(jiraProvider);

      mockCatalog = catalogServiceMock.mock();

      const userEntity = new MockEntityBuilder()
        .withKind('User')
        .withMetadata({ name: 'test-user', namespace: 'default' })
        .build();
      mockCatalog.getEntityByRef.mockResolvedValue(userEntity);

      const componentEntity = new MockEntityBuilder()
        .withKind('Component')
        .withMetadata({ name: 'my-service', namespace: 'default' })
        .build();
      mockCatalog.getEntities.mockResolvedValue({ items: [componentEntity] });

      jest
        .spyOn(catalogMetricService, 'getAggregatedMetricsByEntityRefs')
        .mockResolvedValue(mockAggregatedMetricResults);

      getEntitiesOwnedByUserSpy = jest
        .spyOn(getEntitiesOwnedByUserModule, 'getEntitiesOwnedByUser')
        .mockResolvedValue([
          'component:default/my-service',
          'component:default/my-other-service',
        ]);

      checkEntityAccessSpy = jest.spyOn(
        permissionUtilsModule,
        'checkEntityAccess',
      );

      const router = await createRouter({
        metricProvidersRegistry,
        catalogMetricService,
        catalog: mockCatalog,
        httpAuth: httpAuthMock,
        permissions: permissionsMock,
      });
      aggregationApp = express();
      aggregationApp.use(router);
      aggregationApp.use(mockErrorHandler());
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return 403 Unauthorized when DENY permissions', async () => {
      permissionsMock.authorizeConditional.mockResolvedValue([
        { result: AuthorizeResult.DENY },
      ]);
      const result = await request(aggregationApp).get(
        '/metrics/github.open_prs/catalog/aggregation',
      );

      expect(result.statusCode).toBe(403);
      expect(result.body.error.name).toEqual('NotAllowedError');
    });

    it('should return 403 NotAllowedError when user entity reference is not found', async () => {
      httpAuthMock.credentials.mockResolvedValue({
        principal: {},
      } as any);
      const result = await request(aggregationApp).get(
        '/metrics/github.open_prs/catalog/aggregation',
      );

      expect(result.statusCode).toBe(403);
      expect(result.body.error.name).toEqual('NotAllowedError');
      expect(result.body.error.message).toContain(
        'User entity reference not found',
      );
    });

    it('should return 403 NotAllowedError when user does not have access to the metric', async () => {
      permissionsMock.authorizeConditional.mockResolvedValue([
        CONDITIONAL_POLICY_DECISION,
      ]);
      const result = await request(aggregationApp).get(
        '/metrics/jira.open_issues/catalog/aggregation',
      );

      expect(result.statusCode).toBe(403);
      expect(result.body.error.name).toEqual('NotAllowedError');
      expect(result.body.error.message).toContain(
        'Access to metric "jira.open_issues" denied',
      );
    });

    it('should return aggregated metrics for a specific metric', async () => {
      const response = await request(aggregationApp).get(
        '/metrics/github.open_prs/catalog/aggregation',
      );

      expect(response.status).toBe(200);
      expect(
        catalogMetricService.getAggregatedMetricsByEntityRefs,
      ).toHaveBeenCalledWith(
        ['component:default/my-service', 'component:default/my-other-service'],
        ['github.open_prs'],
        undefined,
      );
      expect(response.body).toEqual(mockAggregatedMetricResults);
    });

    it('should get entities owned by user', async () => {
      const response = await request(aggregationApp).get(
        '/metrics/github.open_prs/catalog/aggregation',
      );

      expect(response.status).toBe(200);
      expect(getEntitiesOwnedByUserSpy).toHaveBeenCalledWith(
        'user:default/test-user',
        expect.objectContaining({
          catalog: expect.any(Object),
          credentials: expect.any(Object),
        }),
      );
    });

    it('should return empty array when user owns no entities', async () => {
      getEntitiesOwnedByUserSpy.mockResolvedValue([]);
      const response = await request(aggregationApp).get(
        '/metrics/github.open_prs/catalog/aggregation',
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
      expect(
        catalogMetricService.getAggregatedMetricsByEntityRefs,
      ).not.toHaveBeenCalled();
    });

    it('should check entity access for each entity owned by user', async () => {
      const response = await request(aggregationApp).get(
        '/metrics/github.open_prs/catalog/aggregation',
      );

      expect(checkEntityAccessSpy).toHaveBeenCalledTimes(2);
      expect(checkEntityAccessSpy).toHaveBeenCalledWith(
        'component:default/my-service',
        expect.any(Object),
        permissionsMock,
        httpAuthMock,
      );
      expect(checkEntityAccessSpy).toHaveBeenCalledWith(
        'component:default/my-other-service',
        expect.any(Object),
        permissionsMock,
        httpAuthMock,
      );
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockAggregatedMetricResults);
    });

    it('should filter authorized metrics when CONDITIONAL permission', async () => {
      permissionsMock.authorizeConditional.mockResolvedValue([
        CONDITIONAL_POLICY_DECISION,
      ]);
      const response = await request(aggregationApp).get(
        '/metrics/github.open_prs/catalog/aggregation',
      );

      expect(response.status).toBe(200);
      expect(
        catalogMetricService.getAggregatedMetricsByEntityRefs,
      ).toHaveBeenCalledWith(
        ['component:default/my-service', 'component:default/my-other-service'],
        ['github.open_prs'],
        {
          anyOf: [
            {
              rule: 'HAS_METRIC_ID',
              resourceType: 'scorecard-metric',
              params: { metricIds: ['github.open_prs', 'github.open_issues'] },
            },
          ],
        },
      );
    });

    it('should return 404 NotFoundError when metric is not found', async () => {
      const result = await request(aggregationApp).get(
        '/metrics/non.existent.metric/catalog/aggregation',
      );

      expect(result.statusCode).toBe(404);
      expect(result.body.error.name).toBe('NotFoundError');
      expect(result.body.error.message).toContain('Metric provider with ID');
    });
  });
});
