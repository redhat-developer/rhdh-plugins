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
  AggregatedMetric,
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
    getAuthorizedEntityRefs: jest.fn(),
  };
});

import * as getEntitiesOwnedByUserModule from '../utils/getEntitiesOwnedByUser';
import * as permissionUtilsModule from '../permissions/permissionUtils';
import { MockEntityBuilder } from '../../__fixtures__/mockEntityBuilder';
import { AggregatedMetricMapper } from './mappers';

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
  let mockLogger: ReturnType<typeof mockServices.logger.mock>;
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
    mockLogger = mockServices.logger.mock();
    catalogMetricService = new CatalogMetricService({
      catalog,
      registry: metricProvidersRegistry,
      auth: mockServices.auth(),
      database: mockDatabaseMetricValues,
      logger: mockLogger,
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

    it('should return all metrics when no metricIds parameter', async () => {
      const response = await request(app).get('/metrics');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('metrics');
      expect(response.body.metrics).toHaveLength(3);

      const metricIds = response.body.metrics.map((m: Metric) => m.id);
      expect(metricIds).toContain('github.open_prs');
      expect(metricIds).toContain('github.open_issues');
      expect(metricIds).toContain('sonar.quality');
    });

    it('should return metrics filtered by metricIds - single metric', async () => {
      const response = await request(app).get(
        '/metrics?metricIds=github.open_prs',
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('metrics');
      expect(response.body.metrics).toHaveLength(1);

      const metricIds = response.body.metrics.map((m: Metric) => m.id);
      expect(metricIds).toContain('github.open_prs');
    });

    it('should return metrics filtered by metricIds - multiple metrics', async () => {
      const response = await request(app).get(
        '/metrics?metricIds=github.open_prs,github.open_issues',
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('metrics');
      expect(response.body.metrics).toHaveLength(2);

      const metricIds = response.body.metrics.map((m: Metric) => m.id);
      expect(metricIds).toContain('github.open_prs');
      expect(metricIds).toContain('github.open_issues');
    });

    it('should return metrics filtered by metricIds with whitespace', async () => {
      const response = await request(app).get(
        '/metrics?metricIds=github.open_prs, github.open_issues',
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('metrics');
      expect(response.body.metrics).toHaveLength(2);

      const metricIds = response.body.metrics.map((m: Metric) => m.id);
      expect(metricIds).toContain('github.open_prs');
      expect(metricIds).toContain('github.open_issues');
    });

    it('should return 400 InputError when invalid metricIds parameter - empty string', async () => {
      const response = await request(app).get('/metrics?metricIds=');

      expect(response.status).toEqual(400);
      expect(response.body.error.name).toEqual('InputError');
      expect(response.body.error.message).toContain('Invalid query parameters');
    });

    it('should return only existing metrics when metricIds contains non-existent IDs', async () => {
      const response = await request(app).get(
        '/metrics?metricIds=github.open_prs,non.existent.metric',
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('metrics');
      expect(response.body.metrics).toHaveLength(1);

      expect(response.body.metrics[0].id).toBe('github.open_prs');
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

    it('should return metrics filtered by datasource - sonar', async () => {
      const response = await request(app).get('/metrics?datasource=sonar');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('metrics');
      expect(response.body.metrics).toHaveLength(1);

      const metricIds = response.body.metrics.map((m: Metric) => m.id);
      expect(metricIds).toContain('sonar.quality');
    });

    it('should return empty array when datasource does not exist', async () => {
      const response = await request(app).get(
        '/metrics?datasource=nonexistent',
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('metrics');
      expect(response.body.metrics).toHaveLength(0);
    });

    it('should return 400 InputError when invalid datasource parameter - empty string', async () => {
      const response = await request(app).get('/metrics?datasource=');

      expect(response.status).toEqual(400);
      expect(response.body.error.name).toEqual('InputError');
      expect(response.body.error.message).toContain('Invalid query parameters');
    });

    it('should return 400 InputError when both metricIds and datasource are provided', async () => {
      const response = await request(app).get(
        '/metrics?metricIds=sonar.quality&datasource=github',
      );

      expect(response.status).toBe(400);
      expect(response.body.error.name).toBe('InputError');
      expect(response.body.error.message).toBe(
        'Cannot filter by both metricIds and datasource',
      );
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

    it('should check entity access before returning metrics', async () => {
      const checkEntityAccessSpy = jest.spyOn(
        permissionUtilsModule,
        'checkEntityAccess',
      );
      const response = await request(app).get(
        '/metrics/catalog/component/default/my-service',
      );

      expect(response.status).toBe(200);
      expect(checkEntityAccessSpy).toHaveBeenCalledWith(
        'component:default/my-service',
        expect.any(Object),
        permissionsMock,
        httpAuthMock,
      );
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

  describe('GET /metrics/:metricId/catalog/aggregations', () => {
    const mockAggregatedMetric: AggregatedMetric = {
      values: {
        error: 3,
        warning: 4,
        success: 5,
      },
      total: 12,
      timestamp: '2025-01-01T10:30:00.000Z',
    };

    const mockAggregatedMetricResult: AggregatedMetricResult = {
      id: 'github.open_prs',
      status: 'success',
      metadata: {
        title: 'GitHub Open PRs',
        description: 'Mock number description.',
        type: 'number',
        history: undefined,
      },
      result: {
        total: mockAggregatedMetric.total,
        timestamp: mockAggregatedMetric.timestamp,
        values: [
          { count: 3, name: 'error' },
          { count: 4, name: 'warning' },
          { count: 5, name: 'success' },
        ],
        thresholds: {
          rules: [
            { key: 'error', expression: '>40' },
            { key: 'warning', expression: '>20' },
            { key: 'success', expression: '<=20' },
          ],
        },
      },
    };

    let mockCatalog: ReturnType<typeof catalogServiceMock.mock>;
    let getEntitiesOwnedByUserSpy: jest.SpyInstance;
    let checkEntityAccessSpy: jest.SpyInstance;
    let aggregationApp: express.Express;
    let toAggregatedMetricResultSpy: jest.SpyInstance;
    let getAggregatedMetricByEntityRefsSpy: jest.SpyInstance;

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

      getAggregatedMetricByEntityRefsSpy = jest
        .spyOn(catalogMetricService, 'getAggregatedMetricByEntityRefs')
        .mockResolvedValue(mockAggregatedMetric);

      toAggregatedMetricResultSpy = jest
        .spyOn(AggregatedMetricMapper, 'toAggregatedMetricResult')
        .mockReturnValue(mockAggregatedMetricResult);

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
        '/metrics/github.open_prs/catalog/aggregations',
      );

      expect(result.statusCode).toBe(403);
      expect(result.body.error.name).toEqual('NotAllowedError');
    });

    it('should return 401 AuthenticationError when user entity reference is not found', async () => {
      httpAuthMock.credentials.mockResolvedValue({
        principal: {},
      } as any);
      const result = await request(aggregationApp).get(
        '/metrics/github.open_prs/catalog/aggregations',
      );

      expect(result.statusCode).toBe(401);
      expect(result.body.error.name).toEqual('AuthenticationError');
      expect(result.body.error.message).toContain(
        'User entity reference not found',
      );
    });

    it('should return 403 NotAllowedError when user does not have access to the metric', async () => {
      permissionsMock.authorizeConditional.mockResolvedValue([
        CONDITIONAL_POLICY_DECISION,
      ]);
      const result = await request(aggregationApp).get(
        '/metrics/jira.open_issues/catalog/aggregations',
      );

      expect(result.statusCode).toBe(403);
      expect(result.body.error.name).toEqual('NotAllowedError');
      expect(result.body.error.message).toContain(
        'To view the scorecard metrics, your administrator must grant you the required permission.',
      );
    });

    it('should return 404 NotFoundError when metric is not found', async () => {
      const result = await request(aggregationApp).get(
        '/metrics/non.existent.metric/catalog/aggregations',
      );

      expect(result.statusCode).toBe(404);
      expect(result.body.error.name).toBe('NotFoundError');
      expect(result.body.error.message).toContain('Metric provider with ID');
    });

    it('should return aggregated metrics for a specific metric', async () => {
      const response = await request(aggregationApp).get(
        '/metrics/github.open_prs/catalog/aggregations',
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockAggregatedMetricResult);
    });

    it('should call authorizeConditional to check permissions', async () => {
      await request(aggregationApp).get(
        '/metrics/github.open_prs/catalog/aggregations',
      );

      expect(permissionsMock.authorizeConditional).toHaveBeenCalledTimes(1);
    });

    it('should call getEntitiesOwnedByUser to get entities owned by user', async () => {
      await request(aggregationApp).get(
        '/metrics/github.open_prs/catalog/aggregations',
      );

      expect(getEntitiesOwnedByUserSpy).toHaveBeenCalledTimes(1);
      expect(getEntitiesOwnedByUserSpy).toHaveBeenCalledWith(
        'user:default/test-user',
        expect.objectContaining({
          catalog: expect.any(Object),
          credentials: expect.any(Object),
        }),
      );
    });

    it('should return empty aggregation when user owns no entities', async () => {
      const emptyAggregatedMetric = AggregatedMetricMapper.toAggregatedMetric();
      const emptyAggregatedMetricResult =
        AggregatedMetricMapper.toAggregatedMetricResult(
          metricProvidersRegistry.getMetric('github.open_prs'),
          metricProvidersRegistry
            .getProvider('github.open_prs')
            .getMetricThresholds(),
          emptyAggregatedMetric,
        );

      getEntitiesOwnedByUserSpy.mockResolvedValueOnce([]);
      getAggregatedMetricByEntityRefsSpy.mockResolvedValueOnce(
        emptyAggregatedMetric,
      );
      toAggregatedMetricResultSpy.mockReturnValueOnce(
        emptyAggregatedMetricResult,
      );

      const response = await request(aggregationApp).get(
        '/metrics/github.open_prs/catalog/aggregations',
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual(emptyAggregatedMetricResult);
      expect(getAggregatedMetricByEntityRefsSpy).toHaveBeenCalledWith(
        [],
        'github.open_prs',
      );
      expect(checkEntityAccessSpy).not.toHaveBeenCalled();
    });

    it('should call getAggregatedMetricByEntityRefs to get aggregated metric', async () => {
      await request(aggregationApp).get(
        '/metrics/github.open_prs/catalog/aggregations',
      );

      expect(getAggregatedMetricByEntityRefsSpy).toHaveBeenCalledTimes(1);
      expect(getAggregatedMetricByEntityRefsSpy).toHaveBeenCalledWith(
        ['component:default/my-service', 'component:default/my-other-service'],
        'github.open_prs',
      );
    });

    it('should check entity access for each entity owned by user', async () => {
      await request(aggregationApp).get(
        '/metrics/github.open_prs/catalog/aggregations',
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
    });

    it('should get aggregated metric by entity refs', async () => {
      await request(aggregationApp).get(
        '/metrics/github.open_prs/catalog/aggregations',
      );

      expect(getAggregatedMetricByEntityRefsSpy).toHaveBeenCalledTimes(1);
      expect(getAggregatedMetricByEntityRefsSpy).toHaveBeenCalledWith(
        ['component:default/my-service', 'component:default/my-other-service'],
        'github.open_prs',
      );
    });

    it('should call toAggregatedMetricResult to map aggregated metric to result', async () => {
      await request(aggregationApp).get(
        '/metrics/github.open_prs/catalog/aggregations',
      );

      expect(toAggregatedMetricResultSpy).toHaveBeenCalledTimes(1);
      expect(toAggregatedMetricResultSpy).toHaveBeenCalledWith(
        metricProvidersRegistry.getMetric('github.open_prs'),
        metricProvidersRegistry
          .getProvider('github.open_prs')
          .getMetricThresholds(),
        mockAggregatedMetric,
      );
    });
  });

  describe('GET /metrics/:metricId/catalog/aggregations/entities', () => {
    const AUTHORIZED_ENTITY_REFS = [
      'component:default/my-service',
      'component:default/another-service',
    ];

    const mockEntityMetricDetailResponse = {
      metricId: 'github.open_prs',
      metricMetadata: {
        title: 'GitHub Open PRs',
        description: 'Mock number description.',
        type: 'number',
      },
      entities: [
        {
          entityRef: 'component:default/my-service',
          entityName: 'my-service',
          entityKind: 'Component',
          owner: 'team:default/platform',
          metricValue: 15,
          timestamp: '2025-01-01T10:30:00.000Z',
          status: 'error',
        },
        {
          entityRef: 'component:default/another-service',
          entityName: 'another-service',
          entityKind: 'Component',
          owner: 'team:default/backend',
          metricValue: 8,
          timestamp: '2025-01-01T10:25:00.000Z',
          status: 'warning',
        },
      ],
      pagination: {
        page: 1,
        pageSize: 10,
        total: 2,
        totalPages: 1,
      },
    };

    let drillDownApp: express.Express;
    let getEntityMetricDetailsSpy: jest.SpyInstance;
    let getEntitiesOwnedByUserSpy: jest.SpyInstance;
    let checkEntityAccessSpy: jest.SpyInstance;
    let getAuthorizedEntityRefsSpy: jest.SpyInstance;

    beforeEach(async () => {
      const githubProvider = new MockNumberProvider(
        'github.open_prs',
        'github',
        'GitHub Open PRs',
      );
      metricProvidersRegistry.register(githubProvider);

      const jiraProvider = new MockNumberProvider(
        'jira.open_issues',
        'jira',
        'Jira Open Issues',
      );
      metricProvidersRegistry.register(jiraProvider);

      getEntityMetricDetailsSpy = jest
        .spyOn(catalogMetricService, 'getEntityMetricDetails')
        .mockResolvedValue(mockEntityMetricDetailResponse as any);

      getEntitiesOwnedByUserSpy = jest
        .spyOn(getEntitiesOwnedByUserModule, 'getEntitiesOwnedByUser')
        .mockResolvedValue([
          'component:default/my-service',
          'component:default/another-service',
        ]);

      checkEntityAccessSpy = jest.spyOn(
        permissionUtilsModule,
        'checkEntityAccess',
      );

      getAuthorizedEntityRefsSpy = jest
        .spyOn(permissionUtilsModule, 'getAuthorizedEntityRefs')
        .mockResolvedValue(AUTHORIZED_ENTITY_REFS);

      const mockCatalog = catalogServiceMock.mock();
      const router = await createRouter({
        metricProvidersRegistry,
        catalogMetricService,
        catalog: mockCatalog,
        httpAuth: httpAuthMock,
        permissions: permissionsMock,
      });

      drillDownApp = express();
      drillDownApp.use(router);
      drillDownApp.use(mockErrorHandler());
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return entity metric details with default pagination', async () => {
      const response = await request(drillDownApp).get(
        '/metrics/github.open_prs/catalog/aggregations/entities',
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockEntityMetricDetailResponse);
      expect(getEntityMetricDetailsSpy).toHaveBeenCalledWith(
        AUTHORIZED_ENTITY_REFS,
        'github.open_prs',
        {
          status: undefined,
          owner: undefined,
          kind: undefined,
          entityName: undefined,
          sortBy: undefined,
          sortOrder: 'desc',
          page: 1,
          limit: 5,
        },
      );
    });

    it('should handle custom page and pageSize', async () => {
      await request(drillDownApp).get(
        '/metrics/github.open_prs/catalog/aggregations/entities?page=2&pageSize=20',
      );

      expect(getEntityMetricDetailsSpy).toHaveBeenCalledWith(
        AUTHORIZED_ENTITY_REFS,
        'github.open_prs',
        expect.objectContaining({
          page: 2,
          limit: 20,
        }),
      );
    });

    it('should enforce max pageSize of 100', async () => {
      await request(drillDownApp).get(
        '/metrics/github.open_prs/catalog/aggregations/entities?pageSize=200',
      );

      expect(getEntityMetricDetailsSpy).toHaveBeenCalledWith(
        AUTHORIZED_ENTITY_REFS,
        'github.open_prs',
        expect.objectContaining({
          limit: 100,
        }),
      );
    });

    it('should filter by status', async () => {
      await request(drillDownApp).get(
        '/metrics/github.open_prs/catalog/aggregations/entities?status=error',
      );

      expect(getEntityMetricDetailsSpy).toHaveBeenCalledWith(
        AUTHORIZED_ENTITY_REFS,
        'github.open_prs',
        expect.objectContaining({
          status: 'error',
        }),
      );
    });

    it('should filter by owner', async () => {
      await request(drillDownApp).get(
        '/metrics/github.open_prs/catalog/aggregations/entities?owner=team:default/platform',
      );

      expect(getEntityMetricDetailsSpy).toHaveBeenCalledWith(
        AUTHORIZED_ENTITY_REFS,
        'github.open_prs',
        expect.objectContaining({
          owner: 'team:default/platform',
        }),
      );
    });

    it('should filter by kind', async () => {
      await request(drillDownApp).get(
        '/metrics/github.open_prs/catalog/aggregations/entities?kind=Component',
      );

      expect(getEntityMetricDetailsSpy).toHaveBeenCalledWith(
        AUTHORIZED_ENTITY_REFS,
        'github.open_prs',
        expect.objectContaining({
          kind: 'Component',
        }),
      );
    });

    it('should filter by entityName', async () => {
      await request(drillDownApp).get(
        '/metrics/github.open_prs/catalog/aggregations/entities?entityName=service',
      );

      expect(getEntityMetricDetailsSpy).toHaveBeenCalledWith(
        AUTHORIZED_ENTITY_REFS,
        'github.open_prs',
        expect.objectContaining({
          entityName: 'service',
        }),
      );
    });

    it('should handle ownedByMe=true and call getEntitiesOwnedByUser', async () => {
      await request(drillDownApp).get(
        '/metrics/github.open_prs/catalog/aggregations/entities?ownedByMe=true',
      );

      expect(getEntitiesOwnedByUserSpy).toHaveBeenCalledWith(
        'user:default/test-user',
        expect.objectContaining({
          catalog: expect.any(Object),
          credentials: expect.any(Object),
        }),
      );

      expect(getEntityMetricDetailsSpy).toHaveBeenCalledWith(
        ['component:default/my-service', 'component:default/another-service'],
        'github.open_prs',
        expect.any(Object),
      );
    });

    it('should check entity access when ownedByMe=true', async () => {
      await request(drillDownApp).get(
        '/metrics/github.open_prs/catalog/aggregations/entities?ownedByMe=true',
      );

      expect(checkEntityAccessSpy).toHaveBeenCalledTimes(2);
      expect(checkEntityAccessSpy).toHaveBeenCalledWith(
        'component:default/my-service',
        expect.any(Object),
        permissionsMock,
        httpAuthMock,
      );
      expect(checkEntityAccessSpy).toHaveBeenCalledWith(
        'component:default/another-service',
        expect.any(Object),
        permissionsMock,
        httpAuthMock,
      );
    });

    it('should sort by entityName ascending', async () => {
      await request(drillDownApp).get(
        '/metrics/github.open_prs/catalog/aggregations/entities?sortBy=entityName&sortOrder=asc',
      );

      expect(getEntityMetricDetailsSpy).toHaveBeenCalledWith(
        AUTHORIZED_ENTITY_REFS,
        'github.open_prs',
        expect.objectContaining({
          sortBy: 'entityName',
          sortOrder: 'asc',
        }),
      );
    });

    it('should sort by metricValue descending', async () => {
      await request(drillDownApp).get(
        '/metrics/github.open_prs/catalog/aggregations/entities?sortBy=metricValue&sortOrder=desc',
      );

      expect(getEntityMetricDetailsSpy).toHaveBeenCalledWith(
        AUTHORIZED_ENTITY_REFS,
        'github.open_prs',
        expect.objectContaining({
          sortBy: 'metricValue',
          sortOrder: 'desc',
        }),
      );
    });

    it('should combine multiple filters', async () => {
      await request(drillDownApp).get(
        '/metrics/github.open_prs/catalog/aggregations/entities?status=error&kind=Component&owner=team:default/platform&sortBy=metricValue&sortOrder=desc',
      );

      expect(getEntityMetricDetailsSpy).toHaveBeenCalledWith(
        AUTHORIZED_ENTITY_REFS,
        'github.open_prs',
        expect.objectContaining({
          status: 'error',
          kind: 'Component',
          owner: 'team:default/platform',
          sortBy: 'metricValue',
          sortOrder: 'desc',
        }),
      );
    });

    it('should return 403 when user does not have permission', async () => {
      permissionsMock.authorizeConditional.mockResolvedValue([
        { result: AuthorizeResult.DENY },
      ]);

      const response = await request(drillDownApp).get(
        '/metrics/github.open_prs/catalog/aggregations/entities',
      );

      expect(response.status).toBe(403);
      expect(response.body.error.name).toEqual('NotAllowedError');
    });

    it('should return 401 when user entity reference is not found', async () => {
      httpAuthMock.credentials.mockResolvedValue({
        principal: {},
      } as any);

      const response = await request(drillDownApp).get(
        '/metrics/github.open_prs/catalog/aggregations/entities',
      );

      expect(response.status).toBe(401);
      expect(response.body.error.name).toEqual('AuthenticationError');
      expect(response.body.error.message).toContain(
        'User entity reference not found',
      );
    });

    it('should return 403 when user does not have access to metric (conditional)', async () => {
      permissionsMock.authorizeConditional.mockResolvedValue([
        CONDITIONAL_POLICY_DECISION,
      ]);

      const response = await request(drillDownApp).get(
        '/metrics/jira.open_issues/catalog/aggregations/entities',
      );

      expect(response.status).toBe(403);
      expect(response.body.error.name).toEqual('NotAllowedError');
    });

    it('should return 404 when metric does not exist', async () => {
      const response = await request(drillDownApp).get(
        '/metrics/non.existent.metric/catalog/aggregations/entities',
      );

      expect(response.status).toBe(404);
      expect(response.body.error.name).toBe('NotFoundError');
    });

    it('should return empty entities array when no results', async () => {
      getEntityMetricDetailsSpy.mockResolvedValue({
        metricId: 'github.open_prs',
        metricMetadata: mockEntityMetricDetailResponse.metricMetadata,
        entities: [],
        pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
      });

      const response = await request(drillDownApp).get(
        '/metrics/github.open_prs/catalog/aggregations/entities',
      );

      expect(response.status).toBe(200);
      expect(response.body.entities).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should call getAuthorizedEntityRefs when ownedByMe is not set', async () => {
      await request(drillDownApp).get(
        '/metrics/github.open_prs/catalog/aggregations/entities',
      );

      expect(getAuthorizedEntityRefsSpy).toHaveBeenCalledTimes(1);
      expect(getAuthorizedEntityRefsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          catalog: expect.any(Object),
          credentials: expect.any(Object),
        }),
      );
    });

    it('should call getAuthorizedEntityRefs when ownedByMe=false', async () => {
      await request(drillDownApp).get(
        '/metrics/github.open_prs/catalog/aggregations/entities?ownedByMe=false',
      );

      expect(getAuthorizedEntityRefsSpy).toHaveBeenCalledTimes(1);
      expect(getEntitiesOwnedByUserSpy).not.toHaveBeenCalled();
    });

    it('should not call getEntitiesOwnedByUser when ownedByMe is not set', async () => {
      await request(drillDownApp).get(
        '/metrics/github.open_prs/catalog/aggregations/entities',
      );

      expect(getEntitiesOwnedByUserSpy).not.toHaveBeenCalled();
    });

    it('should not call checkEntityAccess when ownedByMe is not set', async () => {
      await request(drillDownApp).get(
        '/metrics/github.open_prs/catalog/aggregations/entities',
      );

      expect(checkEntityAccessSpy).not.toHaveBeenCalled();
    });

    it('should pass authorized entity refs from getAuthorizedEntityRefs to getEntityMetricDetails', async () => {
      const restrictedRefs = ['component:default/allowed-service'];
      getAuthorizedEntityRefsSpy.mockResolvedValueOnce(restrictedRefs);

      await request(drillDownApp).get(
        '/metrics/github.open_prs/catalog/aggregations/entities',
      );

      expect(getEntityMetricDetailsSpy).toHaveBeenCalledWith(
        restrictedRefs,
        'github.open_prs',
        expect.any(Object),
      );
    });

    it('should not call getAuthorizedEntityRefs when ownedByMe=true', async () => {
      await request(drillDownApp).get(
        '/metrics/github.open_prs/catalog/aggregations/entities?ownedByMe=true',
      );

      expect(getAuthorizedEntityRefsSpy).not.toHaveBeenCalled();
      expect(getEntitiesOwnedByUserSpy).toHaveBeenCalledTimes(1);
    });
  });
});
