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

import { mockServices } from '@backstage/backend-test-utils';
import { PullMetricsByProviderTask } from './PullMetricsByProviderTask';
import { MetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { mergeEntityAndProviderThresholds } from '../../utils/mergeEntityAndProviderThresholds';
import { catalogServiceMock } from '@backstage/plugin-catalog-node/testUtils';
import {
  MockNumberProvider,
  MockBatchBooleanProvider,
} from '../../../__fixtures__/mockProviders';
import type { Config } from '@backstage/config';
import { CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';
import { mockDatabaseMetricValues } from '../../../__fixtures__/mockDatabaseMetricValues';
import { ThresholdEvaluator } from '../../threshold/ThresholdEvaluator';
import { mockThresholdRules } from '../../../__fixtures__/mockThresholdRules';

jest.mock('../../utils/mergeEntityAndProviderThresholds', () => ({
  mergeEntityAndProviderThresholds: jest.fn(),
}));

const scheduleConfig = {
  frequency: { hours: 2 },
  timeout: { minutes: 20 },
  initialDelay: { seconds: 5 },
};

const mockEntities = [
  { apiVersion: '1.0.0', kind: 'Component', metadata: { name: 'test1' } },
  { apiVersion: '1.0.0', kind: 'Component', metadata: { name: 'test2' } },
];

describe('PullMetricsByProviderTask', () => {
  let mockScheduler: ReturnType<typeof mockServices.scheduler.mock>;
  let mockLogger: ReturnType<typeof mockServices.logger.mock>;
  let mockConfig: Config;
  let mockCatalog: ReturnType<typeof catalogServiceMock.mock>;
  let mockAuth: ReturnType<typeof mockServices.auth.mock>;
  let mockProvider: MetricProvider;
  let mockTaskRunner: { run: jest.Mock };
  let mockThresholdEvaluator: jest.Mocked<ThresholdEvaluator>;
  let mockMergeEntityAndProviderThresholds: jest.Mock;

  let task: PullMetricsByProviderTask;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));

    mockScheduler = mockServices.scheduler.mock();
    mockLogger = mockServices.logger.mock();
    mockConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          schedule: scheduleConfig,
        },
      },
    });
    mockCatalog = catalogServiceMock.mock();
    mockAuth = mockServices.auth.mock();
    mockProvider = new MockNumberProvider('github.test_metric', 'github');

    mockThresholdEvaluator = {
      getFirstMatchingThreshold: jest.fn(),
    } as unknown as jest.Mocked<ThresholdEvaluator>;
    mockThresholdEvaluator.getFirstMatchingThreshold.mockReturnValue('success');

    mockTaskRunner = {
      run: jest.fn().mockResolvedValue(undefined),
    };

    mockScheduler.createScheduledTaskRunner.mockReturnValue(
      mockTaskRunner as any,
    );

    mockMergeEntityAndProviderThresholds =
      mergeEntityAndProviderThresholds as jest.Mock;
    mockMergeEntityAndProviderThresholds.mockReturnValue({
      rules: mockThresholdRules,
    });

    task = new PullMetricsByProviderTask(
      {
        scheduler: mockScheduler,
        logger: mockLogger,
        database: mockDatabaseMetricValues,
        config: mockConfig,
        catalog: mockCatalog,
        auth: mockAuth,
        thresholdEvaluator: mockThresholdEvaluator,
      },
      mockProvider,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should create an instance with all dependencies', () => {
      expect(task).toBeInstanceOf(PullMetricsByProviderTask);
      expect((task as any).scheduler).toBe(mockScheduler);
      expect((task as any).logger).toBe(mockLogger);
      expect((task as any).database).toBe(mockDatabaseMetricValues);
      expect((task as any).config).toBe(mockConfig);
      expect((task as any).catalog).toBe(mockCatalog);
      expect((task as any).auth).toBe(mockAuth);
      expect((task as any).provider).toBe(mockProvider);
      expect((task as any).thresholdEvaluator).toBe(mockThresholdEvaluator);
    });
  });

  describe('start', () => {
    beforeEach(async () => {
      (task as any).getScheduleFromConfig = jest
        .fn()
        .mockReturnValue({ frequency: { hours: 1 } });
      (task as any).pullProviderMetrics = jest
        .fn()
        .mockResolvedValue(undefined);
      await (task as any).start();
    });

    it('should get scheduled from config', () => {
      expect((task as any).getScheduleFromConfig).toHaveBeenCalledWith(
        'scorecard.plugins.github.test_metric.schedule',
      );
    });

    it('should create a scheduled task runner with correct schedule', () => {
      expect(mockScheduler.createScheduledTaskRunner).toHaveBeenCalledTimes(1);
      expect(mockScheduler.createScheduledTaskRunner).toHaveBeenCalledWith({
        frequency: { hours: 1 },
      });
    });

    it('should run the task runner', () => {
      expect(mockTaskRunner.run).toHaveBeenCalledTimes(1);
      expect(mockTaskRunner.run).toHaveBeenCalledWith({
        id: 'github.test_metric',
        fn: expect.any(Function),
      });
    });
  });

  describe('getScheduleFromConfig', () => {
    it('should return the default schedule if not configured', () => {
      const config = (task as any).getScheduleFromConfig(
        'scorecard.schedule.notExists',
      );
      expect(config).toEqual({
        frequency: { hours: 1 },
        timeout: { minutes: 15 },
        initialDelay: { minutes: 1 },
      });
    });

    it('should return the schedule from config if configured', () => {
      const config = (task as any).getScheduleFromConfig('scorecard.schedule');
      expect(config).toEqual(scheduleConfig);
    });
  });

  describe('pullProviderMetrics', () => {
    beforeEach(async () => {
      mockCatalog.queryEntities.mockResolvedValueOnce({
        items: mockEntities,
        pageInfo: {
          nextCursor: undefined, // No next page
        },
        totalItems: 2,
      });
    });

    it('should log start pulling metrics', async () => {
      await (task as any).pullProviderMetrics(mockProvider, mockLogger);
      expect(mockLogger.info).toHaveBeenNthCalledWith(
        1,
        `Pulling metrics for github.test_metric`,
      );
    });

    it('should get metric type', async () => {
      const getMetricTypeSpy = jest.spyOn(mockProvider, 'getMetricType');
      await (task as any).pullProviderMetrics(mockProvider, mockLogger);

      expect(getMetricTypeSpy).toHaveBeenCalledWith();
    });

    it('should query catalog entities', async () => {
      await (task as any).pullProviderMetrics(mockProvider, mockLogger);

      expect(mockCatalog.queryEntities).toHaveBeenCalledWith(
        {
          filter: { 'metadata.annotations.mock/key': CATALOG_FILTER_EXISTS },
          limit: 50,
        },
        { credentials: undefined },
      );
    });

    it('should get catalog filter', async () => {
      const getCatalogFilterSpy = jest.spyOn(mockProvider, 'getCatalogFilter');
      await (task as any).pullProviderMetrics(mockProvider, mockLogger);

      expect(getCatalogFilterSpy).toHaveBeenCalledWith();
    });

    it('should get own service credentials', async () => {
      const getOwnServiceCredentialsSpy = jest.spyOn(
        mockAuth,
        'getOwnServiceCredentials',
      );
      await (task as any).pullProviderMetrics(mockProvider, mockLogger);

      expect(getOwnServiceCredentialsSpy).toHaveBeenCalledWith();
    });

    it('should merge entity and provider thresholds', async () => {
      await (task as any).pullProviderMetrics(mockProvider, mockLogger);

      expect(mockMergeEntityAndProviderThresholds).toHaveBeenNthCalledWith(
        1,
        mockEntities[0],
        mockProvider,
      );
      expect(mockMergeEntityAndProviderThresholds).toHaveBeenNthCalledWith(
        2,
        mockEntities[1],
        mockProvider,
      );
    });

    it('should calculate metric', async () => {
      const calculateMetricSpy = jest.spyOn(mockProvider, 'calculateMetric');
      await (task as any).pullProviderMetrics(mockProvider, mockLogger);

      expect(calculateMetricSpy).toHaveBeenNthCalledWith(1, mockEntities[0]);
      expect(calculateMetricSpy).toHaveBeenNthCalledWith(2, mockEntities[1]);
    });

    it('should get threshold evaluator', async () => {
      await (task as any).pullProviderMetrics(mockProvider, mockLogger);

      expect(
        mockThresholdEvaluator.getFirstMatchingThreshold,
      ).toHaveBeenNthCalledWith(1, 42, 'number', { rules: mockThresholdRules });
      expect(
        mockThresholdEvaluator.getFirstMatchingThreshold,
      ).toHaveBeenNthCalledWith(2, 42, 'number', { rules: mockThresholdRules });
    });

    it('should create metric values', async () => {
      const metricValues = [
        {
          catalog_entity_ref: 'component:default/test1',
          entity_kind: 'component',
          entity_namespace: undefined,
          entity_owner: undefined,
          metric_id: 'github.test_metric',
          timestamp: new Date('2024-01-15T12:00:00.000Z'),
          value: 42,
          status: 'success',
        },
        {
          catalog_entity_ref: 'component:default/test2',
          metric_id: 'github.test_metric',
          entity_kind: 'component',
          entity_namespace: undefined,
          entity_owner: undefined,
          status: 'success',
          timestamp: new Date('2024-01-15T12:00:00.000Z'),
          value: 42,
        },
      ];
      const createMetricValuesSpy = jest.spyOn(
        mockDatabaseMetricValues,
        'createMetricValues',
      );
      await (task as any).pullProviderMetrics(mockProvider, mockLogger);

      expect(createMetricValuesSpy).toHaveBeenCalledWith(metricValues);
    });

    it('should store a full entity ref for owner when spec.owner is a short name', async () => {
      mockCatalog.queryEntities.mockReset();
      mockCatalog.queryEntities.mockResolvedValueOnce({
        items: [
          {
            apiVersion: '1.0.0',
            kind: 'Component',
            metadata: { name: 'test1', namespace: 'default' },
            spec: { owner: 'my-team' },
          },
        ],
        pageInfo: { nextCursor: undefined },
        totalItems: 1,
      });

      const createMetricValuesSpy = jest.spyOn(
        mockDatabaseMetricValues,
        'createMetricValues',
      );
      await (task as any).pullProviderMetrics(mockProvider, mockLogger);

      expect(createMetricValuesSpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ entity_owner: 'group:default/my-team' }),
        ]),
      );
    });

    it('should store a full entity ref for owner when spec.owner is already a full ref', async () => {
      mockCatalog.queryEntities.mockReset();
      mockCatalog.queryEntities.mockResolvedValueOnce({
        items: [
          {
            apiVersion: '1.0.0',
            kind: 'Component',
            metadata: { name: 'test1', namespace: 'default' },
            spec: { owner: 'group:default/my-team' },
          },
        ],
        pageInfo: { nextCursor: undefined },
        totalItems: 1,
      });

      const createMetricValuesSpy = jest.spyOn(
        mockDatabaseMetricValues,
        'createMetricValues',
      );
      await (task as any).pullProviderMetrics(mockProvider, mockLogger);

      expect(createMetricValuesSpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ entity_owner: 'group:default/my-team' }),
        ]),
      );
    });

    it('should produce the same entity_owner regardless of whether spec.owner is a short name or full ref', async () => {
      const shortNameEntity = {
        apiVersion: '1.0.0',
        kind: 'Component',
        metadata: { name: 'svc-a', namespace: 'default' },
        spec: { owner: 'my-team' },
      };
      const fullRefEntity = {
        apiVersion: '1.0.0',
        kind: 'Component',
        metadata: { name: 'svc-b', namespace: 'default' },
        spec: { owner: 'group:default/my-team' },
      };

      mockCatalog.queryEntities.mockReset();
      mockCatalog.queryEntities.mockResolvedValueOnce({
        items: [shortNameEntity, fullRefEntity],
        pageInfo: { nextCursor: undefined },
        totalItems: 2,
      });

      const createMetricValuesSpy = jest.spyOn(
        mockDatabaseMetricValues,
        'createMetricValues',
      );
      await (task as any).pullProviderMetrics(mockProvider, mockLogger);

      const saved = createMetricValuesSpy.mock.calls[0][0];
      expect(saved[0].entity_owner).toBe('group:default/my-team');
      expect(saved[1].entity_owner).toBe('group:default/my-team');
    });

    it('should log completion', async () => {
      await (task as any).pullProviderMetrics(mockProvider, mockLogger);

      expect(mockLogger.info).toHaveBeenCalledWith(
        `Completed metric pull for github.test_metric: processed 2 entities`,
      );
    });

    it('should skip entities when scorecard.io/disabled-metrics annotation contains the provider id', async () => {
      const entityExcluded = {
        apiVersion: '1.0.0',
        kind: 'Component',
        metadata: {
          name: 'excluded-entity',
          annotations: {
            'scorecard.io/disabled-metrics': 'github.test_metric',
          },
        },
      };

      mockCatalog.queryEntities.mockReset().mockResolvedValueOnce({
        items: [entityExcluded],
        pageInfo: { nextCursor: undefined },
        totalItems: 2,
      });

      const calculateMetricSpy = jest.spyOn(mockProvider, 'calculateMetric');
      const createMetricValuesSpy = jest.spyOn(
        mockDatabaseMetricValues,
        'createMetricValues',
      );
      await (task as any).pullProviderMetrics(mockProvider, mockLogger);

      expect(calculateMetricSpy).not.toHaveBeenCalled();
      expect(createMetricValuesSpy).toHaveBeenCalledTimes(1);
      expect(createMetricValuesSpy).toHaveBeenCalledWith([]);
    });

    it('should throw error if pullProviderMetrics fails', async () => {
      (task as any).pullProviderMetrics = jest
        .fn()
        .mockRejectedValue(new Error('test error'));

      await expect(
        (task as any).pullProviderMetrics(mockProvider, mockLogger),
      ).rejects.toThrow('test error');
      await expect(
        (task as any).pullProviderMetrics(mockProvider, mockLogger),
      ).rejects.toThrow('test error');
    });

    describe('batch providers', () => {
      let mockBatchProvider: MockBatchBooleanProvider;

      beforeEach(() => {
        mockBatchProvider = new MockBatchBooleanProvider(
          'filecheck',
          'filecheck',
          [
            { id: 'readme', path: 'README.md' },
            { id: 'license', path: 'LICENSE' },
          ],
        );

        task = new PullMetricsByProviderTask(
          {
            scheduler: mockScheduler,
            logger: mockLogger,
            database: mockDatabaseMetricValues,
            config: mockConfig,
            catalog: mockCatalog,
            auth: mockAuth,
            thresholdEvaluator: mockThresholdEvaluator,
          },
          mockBatchProvider,
        );
      });

      it('should call calculateMetrics for batch providers', async () => {
        const calculateMetricsSpy = jest.spyOn(
          mockBatchProvider,
          'calculateMetrics',
        );
        await (task as any).pullProviderMetrics(mockBatchProvider, mockLogger);

        expect(calculateMetricsSpy).toHaveBeenCalledTimes(2); // Once per entity
        expect(calculateMetricsSpy).toHaveBeenNthCalledWith(1, mockEntities[0]);
        expect(calculateMetricsSpy).toHaveBeenNthCalledWith(2, mockEntities[1]);
      });

      it('should not call calculateMetric for batch providers', async () => {
        const calculateMetricSpy = jest.spyOn(
          mockBatchProvider,
          'calculateMetric',
        );
        await (task as any).pullProviderMetrics(mockBatchProvider, mockLogger);

        expect(calculateMetricSpy).not.toHaveBeenCalled();
      });

      it('should create metric values for all metric IDs from batch provider', async () => {
        const createMetricValuesSpy = jest.spyOn(
          mockDatabaseMetricValues,
          'createMetricValues',
        );
        await (task as any).pullProviderMetrics(mockBatchProvider, mockLogger);

        // 2 entities × 2 metrics = 4 metric values
        expect(createMetricValuesSpy).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              catalog_entity_ref: 'component:default/test1',
              metric_id: 'filecheck.readme',
              value: true,
              status: 'success',
            }),
            expect.objectContaining({
              catalog_entity_ref: 'component:default/test1',
              metric_id: 'filecheck.license',
              value: true,
              status: 'success',
            }),
            expect.objectContaining({
              catalog_entity_ref: 'component:default/test2',
              metric_id: 'filecheck.readme',
              value: true,
              status: 'success',
            }),
            expect.objectContaining({
              catalog_entity_ref: 'component:default/test2',
              metric_id: 'filecheck.license',
              value: true,
              status: 'success',
            }),
          ]),
        );
      });

      it('should evaluate thresholds for each metric in batch', async () => {
        await (task as any).pullProviderMetrics(mockBatchProvider, mockLogger);

        // 2 entities × 2 metrics = 4 threshold evaluations
        expect(
          mockThresholdEvaluator.getFirstMatchingThreshold,
        ).toHaveBeenCalledTimes(4);
        expect(
          mockThresholdEvaluator.getFirstMatchingThreshold,
        ).toHaveBeenCalledWith(true, 'boolean', { rules: mockThresholdRules });
      });

      it('should create error records for all metrics when batch calculation fails', async () => {
        jest
          .spyOn(mockBatchProvider, 'calculateMetrics')
          .mockRejectedValue(new Error('GitHub API error'));

        const createMetricValuesSpy = jest.spyOn(
          mockDatabaseMetricValues,
          'createMetricValues',
        );
        await (task as any).pullProviderMetrics(mockBatchProvider, mockLogger);

        // Should create error records for both metrics for both entities
        expect(createMetricValuesSpy).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              catalog_entity_ref: 'component:default/test1',
              metric_id: 'filecheck.readme',
              error_message: 'GitHub API error',
            }),
            expect.objectContaining({
              catalog_entity_ref: 'component:default/test1',
              metric_id: 'filecheck.license',
              error_message: 'GitHub API error',
            }),
            expect.objectContaining({
              catalog_entity_ref: 'component:default/test2',
              metric_id: 'filecheck.readme',
              error_message: 'GitHub API error',
            }),
            expect.objectContaining({
              catalog_entity_ref: 'component:default/test2',
              metric_id: 'filecheck.license',
              error_message: 'GitHub API error',
            }),
          ]),
        );
      });

      it('should handle threshold evaluation errors for individual batch metrics', async () => {
        mockThresholdEvaluator.getFirstMatchingThreshold.mockImplementation(
          () => {
            throw new Error('Threshold evaluation failed');
          },
        );

        const createMetricValuesSpy = jest.spyOn(
          mockDatabaseMetricValues,
          'createMetricValues',
        );
        await (task as any).pullProviderMetrics(mockBatchProvider, mockLogger);

        // Should still create records but with error messages
        expect(createMetricValuesSpy).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              catalog_entity_ref: 'component:default/test1',
              metric_id: 'filecheck.readme',
              value: true,
              error_message: 'Threshold evaluation failed',
            }),
          ]),
        );
      });

      it('should skip all batch metrics for an entity when all metric IDs are disabled by annotation', async () => {
        const disabledEntity = {
          apiVersion: '1.0.0',
          kind: 'Component',
          metadata: {
            name: 'disabled-all',
            annotations: {
              'scorecard.io/disabled-metrics':
                'filecheck.readme,filecheck.license',
            },
          },
        };

        mockCatalog.queryEntities.mockReset().mockResolvedValueOnce({
          items: [disabledEntity],
          pageInfo: { nextCursor: undefined },
          totalItems: 1,
        });

        const calculateMetricsSpy = jest.spyOn(
          mockBatchProvider,
          'calculateMetrics',
        );
        const createMetricValuesSpy = jest.spyOn(
          mockDatabaseMetricValues,
          'createMetricValues',
        );
        await (task as any).pullProviderMetrics(mockBatchProvider, mockLogger);

        expect(calculateMetricsSpy).not.toHaveBeenCalled();
        expect(createMetricValuesSpy).toHaveBeenCalledWith([]);
      });

      it('should only create records for enabled metrics when some are disabled by annotation', async () => {
        const partiallyDisabledEntity = {
          apiVersion: '1.0.0',
          kind: 'Component',
          metadata: {
            name: 'partial-disabled',
            annotations: {
              'scorecard.io/disabled-metrics': 'filecheck.license',
            },
          },
        };

        mockCatalog.queryEntities.mockReset().mockResolvedValueOnce({
          items: [partiallyDisabledEntity],
          pageInfo: { nextCursor: undefined },
          totalItems: 1,
        });

        const createMetricValuesSpy = jest.spyOn(
          mockDatabaseMetricValues,
          'createMetricValues',
        );
        await (task as any).pullProviderMetrics(mockBatchProvider, mockLogger);

        expect(createMetricValuesSpy).toHaveBeenCalledWith([
          expect.objectContaining({
            catalog_entity_ref: 'component:default/partial-disabled',
            metric_id: 'filecheck.readme',
            value: true,
          }),
        ]);
      });

      it('should skip batch metrics disabled via scorecard.disabledMetrics app-config', async () => {
        const configWithDisabled = mockServices.rootConfig({
          data: {
            scorecard: {
              schedule: scheduleConfig,
              disabledMetrics: ['filecheck.license'],
            },
          },
        });

        task = new PullMetricsByProviderTask(
          {
            scheduler: mockScheduler,
            logger: mockLogger,
            database: mockDatabaseMetricValues,
            config: configWithDisabled,
            catalog: mockCatalog,
            auth: mockAuth,
            thresholdEvaluator: mockThresholdEvaluator,
          },
          mockBatchProvider,
        );

        const createMetricValuesSpy = jest.spyOn(
          mockDatabaseMetricValues,
          'createMetricValues',
        );
        await (task as any).pullProviderMetrics(mockBatchProvider, mockLogger);

        const savedRecords = createMetricValuesSpy.mock.calls[0][0];
        const metricIds = savedRecords.map(
          (r: { metric_id: string }) => r.metric_id,
        );
        expect(metricIds).not.toContain('filecheck.license');
        expect(metricIds).toContain('filecheck.readme');
      });

      it('should create error records only for enabled metrics when batch calculation fails and some metrics are disabled', async () => {
        jest
          .spyOn(mockBatchProvider, 'calculateMetrics')
          .mockRejectedValue(new Error('GitHub API error'));

        const partiallyDisabledEntity = {
          apiVersion: '1.0.0',
          kind: 'Component',
          metadata: {
            name: 'partial-disabled',
            annotations: {
              'scorecard.io/disabled-metrics': 'filecheck.license',
            },
          },
        };

        mockCatalog.queryEntities.mockReset().mockResolvedValueOnce({
          items: [partiallyDisabledEntity],
          pageInfo: { nextCursor: undefined },
          totalItems: 1,
        });

        const createMetricValuesSpy = jest.spyOn(
          mockDatabaseMetricValues,
          'createMetricValues',
        );
        await (task as any).pullProviderMetrics(mockBatchProvider, mockLogger);

        expect(createMetricValuesSpy).toHaveBeenCalledWith([
          expect.objectContaining({
            catalog_entity_ref: 'component:default/partial-disabled',
            metric_id: 'filecheck.readme',
            error_message: 'GitHub API error',
          }),
        ]);
        const savedRecords = createMetricValuesSpy.mock.calls[0][0];
        expect(savedRecords).toHaveLength(1);
      });

      it('should get schedule from correct config path for batch provider', async () => {
        (task as any).getScheduleFromConfig = jest
          .fn()
          .mockReturnValue({ frequency: { hours: 1 } });
        (task as any).pullProviderMetrics = jest
          .fn()
          .mockResolvedValue(undefined);

        await (task as any).start();

        expect((task as any).getScheduleFromConfig).toHaveBeenCalledWith(
          'scorecard.plugins.filecheck.schedule',
        );
      });
    });
  });
});
