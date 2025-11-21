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
import { mockEntity } from '../../__fixtures__/mockEntities';
import {
  buildMockDatabaseMetricValues,
  mockDatabaseMetricValues,
} from '../../__fixtures__/mockDatabaseMetricValues';
import { buildMockMetricProvidersRegistry } from '../../__fixtures__/mockMetricProvidersRegistry';
import { AuthService } from '@backstage/backend-plugin-api';
import * as permissionUtils from '../permissions/permissionUtils';
import { Metric } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import * as thresholdUtils from '../utils/mergeEntityAndProviderThresholds';

jest.mock('../utils/mergeEntityAndProviderThresholds', () => ({
  mergeEntityAndProviderThresholds: jest.fn(),
}));

jest.mock('../permissions/permissionUtils', () => ({
  filterAuthorizedMetrics: jest
    .fn()
    .mockReturnValue([{ id: 'github.important_metric' }]),
}));

const provider = new MockNumberProvider('github.important_metric', 'github');

const latestEntityMetric = [
  {
    id: 1,
    catalog_entity_ref: 'component:default/test-component',
    metric_id: 'github.important_metric',
    value: 42,
    timestamp: new Date('2024-01-15T12:00:00.000Z'),
    error_message: undefined,
    status: 'success',
  },
];

const metricsList = [
  { id: 'github.important_metric' },
  { id: 'github.number_metric' },
] as Metric[];

describe('CatalogMetricService', () => {
  let mockedCatalog: ReturnType<typeof catalogServiceMock.mock>;
  let mockedAuth: jest.Mocked<AuthService>;
  let mockedRegistry: jest.Mocked<MetricProvidersRegistry>;
  let mockedDatabase: jest.Mocked<typeof mockDatabaseMetricValues>;
  let service: CatalogMetricService;

  beforeEach(() => {
    mockedCatalog = catalogServiceMock.mock();
    mockedCatalog.getEntityByRef.mockResolvedValue(mockEntity);

    mockedAuth = mockServices.auth.mock({
      getOwnServiceCredentials: jest.fn().mockResolvedValue({
        token: 'test-token',
      }),
    });

    mockedRegistry = buildMockMetricProvidersRegistry({
      provider,
      metricsList,
    });

    mockedDatabase = buildMockDatabaseMetricValues({ latestEntityMetric });

    (permissionUtils.filterAuthorizedMetrics as jest.Mock).mockReturnValue([
      { id: 'github.important_metric' },
    ]);

    service = new CatalogMetricService({
      catalog: mockedCatalog,
      auth: mockedAuth,
      registry: mockedRegistry,
      database: mockedDatabase,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
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
        {
          anyOf: [
            {
              rule: 'HAS_METRIC_ID',
              resourceType: 'scorecard-metric',
              params: { metricIds: ['github.important_metric'] },
            },
          ],
        },
      );

      expect(permissionUtils.filterAuthorizedMetrics).toHaveBeenCalledWith(
        [{ id: 'github.important_metric' }],
        expect.objectContaining({
          anyOf: [
            {
              rule: 'HAS_METRIC_ID',
              resourceType: 'scorecard-metric',
              params: { metricIds: ['github.important_metric'] },
            },
          ],
        }),
      );
    });

    it('should filter all authorized metrics if no provider IDs are provided', async () => {
      await service.getLatestEntityMetrics(
        'component:default/test-component',
        undefined,
        {
          anyOf: [
            {
              rule: 'HAS_METRIC_ID',
              resourceType: 'scorecard-metric',
              params: { metricIds: ['github.important_metric'] },
            },
          ],
        },
      );

      expect(permissionUtils.filterAuthorizedMetrics).toHaveBeenCalledWith(
        [{ id: 'github.important_metric' }, { id: 'github.number_metric' }],
        expect.objectContaining({
          anyOf: [
            {
              rule: 'HAS_METRIC_ID',
              resourceType: 'scorecard-metric',
              params: { metricIds: ['github.important_metric'] },
            },
          ],
        }),
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
            definition: undefined,
            status: 'success',
            evaluation: 'success',
          }),
        }),
      );
    });

    it('should set status to error when error message is presented', async () => {
      mockedDatabase.readLatestEntityMetricValues.mockResolvedValue([
        {
          ...latestEntityMetric[0],
          error_message: 'Error message',
        },
      ]);

      const newResult = await service.getLatestEntityMetrics(
        'component:default/test-component',
        ['github.important_metric'],
      );

      expect(newResult[0].status).toBe('error');
      expect(newResult[0].error).toBe('Error message');
    });

    it('should set status to error when metric value is undefined', async () => {
      mockedDatabase.readLatestEntityMetricValues.mockResolvedValue([
        {
          ...latestEntityMetric[0],
          value: undefined,
        },
      ]);

      const newResult = await service.getLatestEntityMetrics(
        'component:default/test-component',
        ['github.important_metric'],
      );

      expect(newResult[0].status).toBe('error');
      expect(newResult[0].error).toBe("Error: Metric value is 'undefined'");
    });

    it('should set threshold result status to error when metric value is missing', async () => {
      mockedDatabase.readLatestEntityMetricValues.mockResolvedValue([
        {
          ...latestEntityMetric[0],
          value: undefined,
        },
      ]);

      const newResult = await service.getLatestEntityMetrics(
        'component:default/test-component',
        ['github.important_metric'],
      );

      expect(newResult[0].result.thresholdResult.status).toBe('error');
      expect(newResult[0].result.thresholdResult.error).toBe(
        'Unable to evaluate thresholds, metric value is missing',
      );
    });
  });
});
