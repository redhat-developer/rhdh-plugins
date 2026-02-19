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

import { NotFoundError } from '@backstage/errors';
import { mockServices } from '@backstage/backend-test-utils';
import { catalogServiceMock } from '@backstage/plugin-catalog-node/testUtils';
import { CatalogMetricService } from './CatalogMetricService';
import { MetricProvidersRegistry } from '../providers/MetricProvidersRegistry';
import { MockNumberProvider } from '../../__fixtures__/mockProviders';
import {
  buildMockDatabaseMetricValues,
  mockDatabaseMetricValues,
} from '../../__fixtures__/mockDatabaseMetricValues';
import { buildMockMetricProvidersRegistry } from '../../__fixtures__/mockMetricProvidersRegistry';
import {
  AuthService,
  BackstageCredentials,
  LoggerService,
} from '@backstage/backend-plugin-api';
import * as permissionUtils from '../permissions/permissionUtils';
import {
  AggregatedMetric,
  Metric,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import * as thresholdUtils from '../utils/mergeEntityAndProviderThresholds';
import { DbMetricValue, DbAggregatedMetric } from '../database/types';
import { mockThresholdRules } from '../../__fixtures__/mockThresholdRules';
import { MockEntityBuilder } from '../../__fixtures__/mockEntityBuilder';
import {
  PermissionCondition,
  PermissionRuleParams,
  PermissionCriteria,
} from '@backstage/plugin-permission-common';
import { AggregatedMetricMapper } from './mappers';

jest.mock('../utils/mergeEntityAndProviderThresholds');
jest.mock('../permissions/permissionUtils');

const provider = new MockNumberProvider('github.important_metric', 'github');

const latestEntityMetric = [
  {
    id: 1,
    catalog_entity_ref: 'component:default/test-component',
    metric_id: 'github.important_metric',
    value: 42,
    timestamp: new Date('2024-01-15T12:00:00.000Z'),
    error_message: null,
    status: 'success',
  } as DbMetricValue,
] as DbMetricValue[];

const aggregatedMetric: DbAggregatedMetric = {
  metric_id: 'github.important_metric',
  total: 2,
  max_timestamp: new Date('2024-01-15T12:00:00.000Z'),
  statusCounts: {
    success: 1,
    warning: 1,
  },
};

const metricsList = [
  { id: 'github.important_metric' },
  { id: 'github.number_metric' },
] as Metric[];

const permissionsFilter = {
  anyOf: [
    {
      rule: 'HAS_METRIC_ID',
      resourceType: 'scorecard-metric',
      params: { metricIds: ['github.important_metric'] },
    },
  ],
} as PermissionCriteria<PermissionCondition<string, PermissionRuleParams>>;

describe('CatalogMetricService', () => {
  let mockedCatalog: ReturnType<typeof catalogServiceMock.mock>;
  let mockedAuth: jest.Mocked<AuthService>;
  let mockedRegistry: jest.Mocked<MetricProvidersRegistry>;
  let mockedDatabase: jest.Mocked<typeof mockDatabaseMetricValues>;
  let mockedLogger: jest.Mocked<LoggerService>;
  let service: CatalogMetricService;
  let toAggregatedMetricSpy: jest.SpyInstance;

  const mockEntity = new MockEntityBuilder().build();

  beforeEach(() => {
    mockedCatalog = catalogServiceMock.mock();
    mockedCatalog.getEntityByRef.mockResolvedValue(mockEntity);

    mockedCatalog.getEntitiesByRefs = jest
      .fn()
      .mockResolvedValue({ items: [] });

    mockedAuth = mockServices.auth.mock({
      getOwnServiceCredentials: jest.fn().mockResolvedValue({
        token: 'test-token',
      }),
    });

    mockedRegistry = buildMockMetricProvidersRegistry({
      provider,
      metricsList,
    });

    mockedDatabase = buildMockDatabaseMetricValues({
      latestEntityMetric,
      aggregatedMetric,
    });

    mockedLogger = mockServices.logger.mock();

    (permissionUtils.filterAuthorizedMetrics as jest.Mock).mockReturnValue([
      { id: 'github.important_metric' },
    ]);

    (
      thresholdUtils.mergeEntityAndProviderThresholds as jest.Mock
    ).mockReturnValue({
      rules: mockThresholdRules,
    });

    toAggregatedMetricSpy = jest.spyOn(
      AggregatedMetricMapper,
      'toAggregatedMetric',
    );

    service = new CatalogMetricService({
      catalog: mockedCatalog,
      auth: mockedAuth,
      registry: mockedRegistry,
      database: mockedDatabase,
      logger: mockedLogger,
    });

    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should create an instance with all dependencies', () => {
      expect(service).toBeInstanceOf(CatalogMetricService);
      expect((service as any).catalog).toBe(mockedCatalog);
      expect((service as any).auth).toBe(mockedAuth);
      expect((service as any).registry).toBe(mockedRegistry);
      expect((service as any).database).toBe(mockedDatabase);
    });
  });

  describe('getLatestEntityMetrics', () => {
    it('should handle multiple metrics correctly', async () => {
      const secondProvider = new MockNumberProvider(
        'github.number_metric',
        'github',
      );
      mockedRegistry.getProvider.mockImplementation(id =>
        id === 'github.important_metric' ? provider : secondProvider,
      );

      const multipleMetrics = [
        { ...latestEntityMetric[0], metric_id: 'github.important_metric' },
        {
          ...latestEntityMetric[0],
          metric_id: 'github.number_metric',
          value: 10,
        },
      ];
      mockedDatabase.readLatestEntityMetricValues.mockResolvedValue(
        multipleMetrics,
      );

      (permissionUtils.filterAuthorizedMetrics as jest.Mock).mockReturnValue([
        { id: 'github.important_metric' },
        { id: 'github.number_metric' },
      ] as Metric[]);

      const result = await service.getLatestEntityMetrics(
        'component:default/test-component',
      );

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('github.important_metric');
      expect(result[1].id).toBe('github.number_metric');
    });

    it('should get own service credentials', async () => {
      await service.getLatestEntityMetrics('component:default/test-component', [
        'github.important_metric',
      ]);

      expect(mockedAuth.getOwnServiceCredentials).toHaveBeenCalledWith();
    });

    it('should get entity by ref', async () => {
      await service.getLatestEntityMetrics('component:default/test-component');

      expect(mockedCatalog.getEntityByRef).toHaveBeenCalledWith(
        'component:default/test-component',
        expect.objectContaining({
          credentials: expect.any(Object),
        }),
      );
    });

    it('should throw an error if the entity is not found', async () => {
      mockedCatalog.getEntityByRef.mockResolvedValue(undefined);

      await expect(
        service.getLatestEntityMetrics('component:default/test-component'),
      ).rejects.toThrow(
        new NotFoundError('Entity not found: component:default/test-component'),
      );
    });

    it('should filter authorized metrics for specific provider IDs', async () => {
      await service.getLatestEntityMetrics(
        'component:default/test-component',
        ['github.important_metric'],
        permissionsFilter,
      );

      expect(permissionUtils.filterAuthorizedMetrics).toHaveBeenCalledWith(
        [{ id: 'github.important_metric' }],
        permissionsFilter,
      );
    });

    it('should filter all authorized metrics if no provider IDs are provided', async () => {
      await service.getLatestEntityMetrics(
        'component:default/test-component',
        undefined,
        permissionsFilter,
      );

      expect(permissionUtils.filterAuthorizedMetrics).toHaveBeenCalledWith(
        [{ id: 'github.important_metric' }, { id: 'github.number_metric' }],
        permissionsFilter,
      );
    });

    it('should read latest entity metric values', async () => {
      await service.getLatestEntityMetrics('component:default/test-component', [
        'github.important_metric',
      ]);

      expect(mockedDatabase.readLatestEntityMetricValues).toHaveBeenCalledWith(
        'component:default/test-component',
        ['github.important_metric'],
      );
    });

    it('should return empty array when no metrics found in database', async () => {
      mockedDatabase.readLatestEntityMetricValues.mockResolvedValue([]);

      const result = await service.getLatestEntityMetrics(
        'component:default/test-component',
        ['github.important_metric'],
      );

      expect(result).toEqual([]);
    });

    it('should get provider by metric ID', async () => {
      await service.getLatestEntityMetrics('component:default/test-component', [
        'github.important_metric',
      ]);

      expect(mockedRegistry.getProvider).toHaveBeenCalledWith(
        'github.important_metric',
      );
    });

    it('should get provider metric', async () => {
      const getMetricSpy = jest.spyOn(provider, 'getMetric');

      await service.getLatestEntityMetrics('component:default/test-component', [
        'github.important_metric',
      ]);

      expect(getMetricSpy).toHaveBeenCalled();
    });

    it('should merge entity and provider thresholds', async () => {
      const mergeEntityAndProviderThresholdsSpy = jest.spyOn(
        thresholdUtils,
        'mergeEntityAndProviderThresholds',
      );

      await service.getLatestEntityMetrics('component:default/test-component', [
        'github.important_metric',
      ]);

      expect(mergeEntityAndProviderThresholdsSpy).toHaveBeenCalledWith(
        mockEntity,
        provider,
      );
    });

    it('should set threshold error when merge thresholds fails', async () => {
      (
        thresholdUtils.mergeEntityAndProviderThresholds as jest.Mock
      ).mockImplementation(() => {
        throw new Error('Merge thresholds failed');
      });

      const newResult = await service.getLatestEntityMetrics(
        'component:default/test-component',
        ['github.important_metric'],
      );

      expect(newResult).toHaveLength(1);

      const thresholdResult = newResult[0].result.thresholdResult;
      expect(thresholdResult.status).toBe('error');
      expect(thresholdResult.error).toBe('Error: Merge thresholds failed');
    });

    it('should set threshold error when value is null', async () => {
      mockedDatabase.readLatestEntityMetricValues.mockResolvedValue([
        {
          ...latestEntityMetric[0],
          value: null,
          error_message: 'Error message during metric calculation',
        },
      ]);

      const newResult = await service.getLatestEntityMetrics(
        'component:default/test-component',
        ['github.important_metric'],
      );

      expect(newResult[0].status).toBe('error');
      expect(newResult[0].error).toBe(
        'Error message during metric calculation',
      );
      expect(newResult[0].result.thresholdResult.status).toBe('error');
      expect(newResult[0].result.thresholdResult.error).toBe(
        'Unable to evaluate thresholds, metric value is missing',
      );
    });

    it('should set threshold error when value is not null and error message exist', async () => {
      mockedDatabase.readLatestEntityMetricValues.mockResolvedValue([
        {
          ...latestEntityMetric[0],
          error_message: 'Threshold error message during metric calculation',
        },
      ]);

      const newResult = await service.getLatestEntityMetrics(
        'component:default/test-component',
        ['github.important_metric'],
      );

      expect(newResult[0].status).toBe('success');
      expect(newResult[0].error).toBeUndefined();
      expect(newResult[0].result.thresholdResult.status).toBe('error');
      expect(newResult[0].result.thresholdResult.error).toBe(
        'Threshold error message during metric calculation',
      );
    });

    it('should return metric result', async () => {
      const result = await service.getLatestEntityMetrics(
        'component:default/test-component',
        ['github.important_metric'],
      );

      expect(result.length).toBe(1);

      const resultMetric = result[0];

      expect(resultMetric).toEqual(
        expect.objectContaining({
          id: 'github.important_metric',
          status: 'success',
        }),
      );
      expect(resultMetric.metadata).toEqual(
        expect.objectContaining({
          title: provider.getMetric().title,
          description: provider.getMetric().description,
          type: provider.getMetric().type,
          history: provider.getMetric().history,
        }),
      );
      expect(resultMetric.result).toEqual(
        expect.objectContaining({
          value: 42,
          timestamp: '2024-01-15T12:00:00.000Z',
          thresholdResult: expect.objectContaining({
            definition: {
              rules: mockThresholdRules,
            },
            status: 'success',
            evaluation: 'success',
          }),
        }),
      );
    });

    it('should set threshold result status to error when metric value is missing', async () => {
      mockedDatabase.readLatestEntityMetricValues.mockResolvedValue([
        {
          ...latestEntityMetric[0],
          value: null,
        },
      ]);

      const newResult = await service.getLatestEntityMetrics(
        'component:default/test-component',
        ['github.important_metric'],
      );

      const thresholdResult = newResult[0].result.thresholdResult;
      expect(thresholdResult.status).toBe('error');
      expect(thresholdResult.error).toBe(
        'Unable to evaluate thresholds, metric value is missing',
      );
    });
  });

  describe('getAggregatedMetricByEntityRefs', () => {
    describe('when entities are provided', () => {
      let result: AggregatedMetric;

      beforeEach(async () => {
        result = await service.getAggregatedMetricByEntityRefs(
          [
            'component:default/test-component',
            'component:default/test-component-2',
          ],
          'github.important_metric',
        );
      });

      it('should return aggregated metrics for multiple entities', async () => {
        expect(result).toEqual({
          values: {
            success: 1,
            warning: 1,
          },
          total: 2,
          timestamp: '2024-01-15T12:00:00.000Z',
        });
      });

      it('should read aggregated metric by entity refs', async () => {
        expect(
          mockedDatabase.readAggregatedMetricByEntityRefs,
        ).toHaveBeenCalledWith(
          [
            'component:default/test-component',
            'component:default/test-component-2',
          ],
          'github.important_metric',
        );
      });

      it('should call toAggregatedMetric to map aggregated metric to result', async () => {
        expect(toAggregatedMetricSpy).toHaveBeenCalledTimes(1);
        expect(toAggregatedMetricSpy).toHaveBeenCalledWith(aggregatedMetric);
      });
    });

    describe('when no entities are provided', () => {
      let result: AggregatedMetric;

      beforeEach(async () => {
        result = await service.getAggregatedMetricByEntityRefs(
          [],
          'github.important_metric',
        );
      });

      it('should return empty aggregation when no entities provided', async () => {
        expect(result).toEqual({
          values: {},
          total: 0,
          timestamp: '2024-01-15T12:00:00.000Z',
        });
      });

      it('should not read aggregated metric by entity refs', async () => {
        expect(
          mockedDatabase.readAggregatedMetricByEntityRefs,
        ).not.toHaveBeenCalled();
      });

      it('should call toAggregatedMetric to map aggregated metric to result', async () => {
        expect(toAggregatedMetricSpy).toHaveBeenCalledTimes(1);
        expect(toAggregatedMetricSpy).toHaveBeenCalledWith();
      });
    });
  });

  describe('getEntityMetricDetails', () => {
    const mockMetricRows: DbMetricValue[] = [
      {
        id: 1,
        catalog_entity_ref: 'component:default/service-a',
        metric_id: 'github.important_metric',
        value: 15,
        timestamp: new Date('2024-01-15T12:00:00.000Z'),
        error_message: null,
        status: 'error',
        entity_kind: 'Component',
        entity_owner: 'team:default/platform',
      },
      {
        id: 2,
        catalog_entity_ref: 'component:default/service-b',
        metric_id: 'github.important_metric',
        value: 8,
        timestamp: new Date('2024-01-15T11:00:00.000Z'),
        error_message: null,
        status: 'warning',
        entity_kind: 'Component',
        entity_owner: 'team:default/backend',
      },
      {
        id: 3,
        catalog_entity_ref: 'component:default/service-c',
        metric_id: 'github.important_metric',
        value: 3,
        timestamp: new Date('2024-01-15T10:00:00.000Z'),
        error_message: null,
        status: 'success',
        entity_kind: 'API',
        entity_owner: 'team:default/platform',
      },
    ];

    const mockEntities = {
      items: [
        new MockEntityBuilder()
          .withKind('Component')
          .withMetadata({ name: 'service-a', namespace: 'default' })
          .withSpec({ owner: 'team:default/platform' })
          .build(),
        new MockEntityBuilder()
          .withKind('Component')
          .withMetadata({ name: 'service-b', namespace: 'default' })
          .withSpec({ owner: 'team:default/backend' })
          .build(),
        new MockEntityBuilder()
          .withKind('API')
          .withMetadata({ name: 'service-c', namespace: 'default' })
          .withSpec({ owner: 'team:default/platform' })
          .build(),
      ],
    };

    let mockCredentials: BackstageCredentials;

    beforeEach(() => {
      mockedDatabase.readEntityMetricsByStatus.mockResolvedValue({
        rows: mockMetricRows,
        total: 3,
      });

      mockedCatalog.getEntitiesByRefs.mockReset();
      mockedCatalog.getEntitiesByRefs.mockResolvedValue(mockEntities);
      mockCredentials = {} as BackstageCredentials;
    });

    it('should fetch entity metrics with default options', async () => {
      const result = await service.getEntityMetricDetails(
        'github.important_metric',
        mockCredentials,
        {
          page: 1,
          limit: 10,
        },
      );

      expect(result.metricId).toBe('github.important_metric');
      expect(result.entities).toHaveLength(3);
      expect(result.pagination).toEqual({
        page: 1,
        pageSize: 10,
        total: 3,
        totalPages: 1,
      });
    });

    it('should enrich entities with catalog metadata', async () => {
      const result = await service.getEntityMetricDetails(
        'github.important_metric',
        mockCredentials,
        {
          page: 1,
          limit: 10,
        },
      );

      expect(result.entities[0]).toEqual({
        entityRef: 'component:default/service-a',
        entityName: 'service-a',
        entityKind: 'Component',
        owner: 'team:default/platform',
        metricValue: 15,
        timestamp: '2024-01-15T12:00:00.000Z',
        status: 'error',
      });
    });

    it('should call database with correct pagination parameters', async () => {
      await service.getEntityMetricDetails(
        'github.important_metric',
        mockCredentials,
        {
          page: 2,
          limit: 5,
        },
      );

      expect(mockedDatabase.readEntityMetricsByStatus).toHaveBeenCalledWith(
        'github.important_metric',
        { pagination: { limit: 5, offset: 5 } },
      );
    });

    it('should filter by status at database level', async () => {
      await service.getEntityMetricDetails(
        'github.important_metric',
        mockCredentials,
        {
          status: 'error',
          page: 1,
          limit: 10,
        },
      );

      expect(mockedDatabase.readEntityMetricsByStatus).toHaveBeenCalledWith(
        'github.important_metric',
        { status: 'error', pagination: { limit: 10, offset: 0 } },
      );
    });

    it('should filter by kind at database level', async () => {
      await service.getEntityMetricDetails(
        'github.important_metric',
        mockCredentials,
        {
          kind: 'Component',
          page: 1,
          limit: 10,
        },
      );

      expect(mockedDatabase.readEntityMetricsByStatus).toHaveBeenCalledWith(
        'github.important_metric',
        { entityKind: 'Component', pagination: { limit: 10, offset: 0 } },
      );
    });

    it('should filter by owner at database level', async () => {
      await service.getEntityMetricDetails(
        'github.important_metric',
        mockCredentials,
        {
          owner: ['team:default/platform'],
          page: 1,
          limit: 10,
        },
      );

      expect(mockedDatabase.readEntityMetricsByStatus).toHaveBeenCalledWith(
        'github.important_metric',
        {
          entityOwner: ['team:default/platform'],
          pagination: { limit: 10, offset: 0 },
        },
      );
    });

    it('should filter by entityName at database level', async () => {
      mockedDatabase.readEntityMetricsByStatus.mockResolvedValueOnce({
        rows: [mockMetricRows[0]],
        total: 1,
      });

      const result = await service.getEntityMetricDetails(
        'github.important_metric',
        mockCredentials,
        {
          entityName: 'service-a',
          page: 1,
          limit: 10,
        },
      );

      expect(mockedDatabase.readEntityMetricsByStatus).toHaveBeenCalledWith(
        'github.important_metric',
        { entityName: 'service-a', pagination: { limit: 10, offset: 0 } },
      );

      expect(result.entities).toHaveLength(1);
      expect(result.entities[0].entityName).toBe('service-a');
      expect(result.pagination.total).toBe(1);
    });

    it('should pass entityName to database for filtering', async () => {
      await service.getEntityMetricDetails(
        'github.important_metric',
        mockCredentials,
        {
          entityName: 'SERVICE',
          page: 1,
          limit: 10,
        },
      );

      expect(mockedDatabase.readEntityMetricsByStatus).toHaveBeenCalledWith(
        'github.important_metric',
        { entityName: 'SERVICE', pagination: { limit: 10, offset: 0 } },
      );
    });

    it('should sort by entityName ascending', async () => {
      await service.getEntityMetricDetails(
        'github.important_metric',
        mockCredentials,
        {
          sortBy: 'entityName',
          sortOrder: 'asc',
          page: 1,
          limit: 10,
        },
      );

      expect(mockedDatabase.readEntityMetricsByStatus).toHaveBeenCalledWith(
        'github.important_metric',
        {
          sortBy: 'entityName',
          sortOrder: 'asc',
          pagination: { limit: 10, offset: 0 },
        },
      );
    });

    it('should sort by metricValue descending', async () => {
      await service.getEntityMetricDetails(
        'github.important_metric',
        mockCredentials,
        {
          sortBy: 'metricValue',
          sortOrder: 'desc',
          page: 1,
          limit: 10,
        },
      );

      expect(mockedDatabase.readEntityMetricsByStatus).toHaveBeenCalledWith(
        'github.important_metric',
        {
          sortBy: 'metricValue',
          sortOrder: 'desc',
          pagination: { limit: 10, offset: 0 },
        },
      );
    });

    it('should sort by timestamp descending by default', async () => {
      await service.getEntityMetricDetails(
        'github.important_metric',
        mockCredentials,
        {
          page: 1,
          limit: 10,
        },
      );

      // When no sortBy/sortOrder are supplied the DB defaults to timestamp desc
      expect(mockedDatabase.readEntityMetricsByStatus).toHaveBeenCalledWith(
        'github.important_metric',
        { pagination: { limit: 10, offset: 0 } },
      );
    });

    it('should handle null metric values in sorting', async () => {
      mockedDatabase.readEntityMetricsByStatus.mockResolvedValue({
        rows: [{ ...mockMetricRows[0], value: null }, mockMetricRows[1]],
        total: 2,
      });

      await service.getEntityMetricDetails(
        'github.important_metric',
        mockCredentials,
        {
          sortBy: 'metricValue',
          sortOrder: 'desc',
          page: 1,
          limit: 10,
        },
      );

      // Null handling (nulls-last) is delegated to the DB via orderByRaw
      expect(mockedDatabase.readEntityMetricsByStatus).toHaveBeenCalledWith(
        'github.important_metric',
        {
          sortBy: 'metricValue',
          sortOrder: 'desc',
          pagination: { limit: 10, offset: 0 },
        },
      );
    });

    it('should batch-fetch entities using getEntitiesByRefs', async () => {
      await service.getEntityMetricDetails(
        'github.important_metric',
        mockCredentials,
        {
          page: 1,
          limit: 10,
        },
      );

      expect(mockedCatalog.getEntitiesByRefs).toHaveBeenCalledWith(
        {
          entityRefs: [
            'component:default/service-a',
            'component:default/service-b',
            'component:default/service-c',
          ],
          fields: ['kind', 'metadata', 'spec'],
        },
        { credentials: expect.any(Object) },
      );
    });

    it('should exclude entities that the catalog returns null for (unauthorized)', async () => {
      // service-b (index 1) returns undefined/null — catalog enforces no access
      mockedCatalog.getEntitiesByRefs.mockResolvedValue({
        items: [mockEntities.items[0], undefined, mockEntities.items[2]],
      });

      const result = await service.getEntityMetricDetails(
        'github.important_metric',
        mockCredentials,
        {
          page: 1,
          limit: 10,
        },
      );

      // service-b is filtered out; only the two authorized entities are returned
      expect(result.entities).toHaveLength(2);
      expect(result.entities.map(e => e.entityRef)).not.toContain(
        'component:default/service-b',
      );
      expect(result.entities[0].entityRef).toBe('component:default/service-a');
      expect(result.entities[1].entityRef).toBe('component:default/service-c');
    });

    it('should handle catalog API failures by logging an error and not returning information from the database', async () => {
      mockedCatalog.getEntitiesByRefs.mockRejectedValue(
        new Error('Catalog API error'),
      );

      const result = await service.getEntityMetricDetails(
        'github.important_metric',
        mockCredentials,
        {
          page: 1,
          limit: 10,
        },
      );

      expect(mockedLogger.error).toHaveBeenCalledWith(
        'Failed to fetch entities from catalog',
        expect.objectContaining({ error: expect.any(Error) }),
      );

      // When catalog is unavailable, do not bypass and instead log error
      expect(result.entities).toHaveLength(0);
    });

    it('should pass null to database for unscoped query (avoids catalog enumeration)', async () => {
      await service.getEntityMetricDetails(
        'github.important_metric',
        mockCredentials,
        { page: 1, limit: 10 },
      );

      expect(mockedDatabase.readEntityMetricsByStatus).toHaveBeenCalledWith(
        'github.important_metric',
        { pagination: { limit: 10, offset: 0 } },
      );
    });

    it('should use catalog.getEntitiesByRefs as the sole authorization gate for the unscoped path', async () => {
      // Simulate catalog returning null for service-b (no access) and real entities for others
      mockedCatalog.getEntitiesByRefs.mockResolvedValue({
        items: [mockEntities.items[0], undefined, mockEntities.items[2]],
      });

      const result = await service.getEntityMetricDetails(
        'github.important_metric',
        mockCredentials,
        { page: 1, limit: 10 },
      );

      // service-b should be filtered out because catalog returned null (unauthorized)
      expect(result.entities).toHaveLength(2);
      expect(result.entities.map(e => e.entityRef)).not.toContain(
        'component:default/service-b',
      );
    });

    it('should combine filters, sorting, and pagination', async () => {
      mockedDatabase.readEntityMetricsByStatus.mockResolvedValue({
        rows: [mockMetricRows[0]],
        total: 1,
      });

      const result = await service.getEntityMetricDetails(
        'github.important_metric',
        mockCredentials,
        {
          status: 'error',
          kind: 'Component',
          owner: ['team:default/platform'],
          sortBy: 'metricValue',
          sortOrder: 'desc',
          page: 1,
          limit: 5,
        },
      );

      expect(mockedDatabase.readEntityMetricsByStatus).toHaveBeenCalledWith(
        'github.important_metric',
        {
          status: 'error',
          entityKind: 'Component',
          entityOwner: ['team:default/platform'],
          sortBy: 'metricValue',
          sortOrder: 'desc',
          pagination: { limit: 5, offset: 0 },
        },
      );

      expect(result.entities).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should return empty results when no entities match', async () => {
      mockedDatabase.readEntityMetricsByStatus.mockResolvedValue({
        rows: [],
        total: 0,
      });

      const result = await service.getEntityMetricDetails(
        'github.important_metric',
        mockCredentials,
        {
          page: 1,
          limit: 10,
        },
      );

      expect(result.entities).toEqual([]);
      expect(result.pagination).toEqual({
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0,
      });
    });

    it('should include metric metadata in response', async () => {
      const result = await service.getEntityMetricDetails(
        'github.important_metric',
        mockCredentials,
        {
          page: 1,
          limit: 10,
        },
      );

      expect(result.metricMetadata).toEqual({
        title: provider.getMetric().title,
        description: provider.getMetric().description,
        type: provider.getMetric().type,
      });
    });
  });
});
