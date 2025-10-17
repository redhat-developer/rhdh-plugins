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

import { Entity } from '@backstage/catalog-model';
import { NotFoundError } from '@backstage/errors';
import { mockServices } from '@backstage/backend-test-utils';
import { catalogServiceMock } from '@backstage/plugin-catalog-node/testUtils';
import { CatalogMetricService } from './CatalogMetricService';
import { MetricProvidersRegistry } from '../providers/MetricProvidersRegistry';
import { ThresholdEvaluator } from '../threshold/ThresholdEvaluator';
import {
  githubNumberMetricMetadata,
  githubNumberProvider,
  jiraBooleanMetricMetadata,
  jiraBooleanProvider,
} from '../../__fixtures__/mockProviders';
import { mockEntity } from '../../__fixtures__/mockEntities';
import {
  PermissionCondition,
  PermissionCriteria,
  PermissionRuleParams,
} from '@backstage/plugin-permission-common';
import { mockDatabaseMetricValues } from '../../__fixtures__/mockDatabaseMetricValues';

const timestamp = '2024-01-15T10:30:00.000Z';
const timestampDate = new Date(timestamp);
const storedMetricValues = [
  {
    id: 1,
    catalog_entity_ref: 'component:default/test-component',
    metric_id: 'github.number_metric',
    value: 42,
    timestamp: timestampDate,
    error_message: undefined,
  },
  {
    id: 2,
    catalog_entity_ref: 'component:default/test-component',
    metric_id: 'jira.boolean_metric',
    value: false,
    timestamp: timestampDate,
    error_message: undefined,
  },
];

describe('CatalogMetricService', () => {
  let catalogMetricService: CatalogMetricService;
  let registry: MetricProvidersRegistry;
  const mockCatalogService = catalogServiceMock.mock();

  const githubMetricResult = {
    id: 'github.number_metric',
    metadata: {
      ...githubNumberMetricMetadata,
    },
    status: 'success' as const,
    result: {
      thresholdResult: {
        definition: {
          rules: [
            { key: 'error', expression: '>40' },
            { key: 'warning', expression: '>20' },
            { key: 'success', expression: '<=20' },
          ],
        },
        status: 'success',
        evaluation: 'error',
      },
      timestamp,
      value: 42,
    },
  };

  const jiraMetricResult = {
    id: 'jira.boolean_metric',
    metadata: {
      ...jiraBooleanMetricMetadata,
    },
    status: 'success' as const,
    result: {
      thresholdResult: {
        definition: {
          rules: [
            { key: 'success', expression: '==true' },
            { key: 'error', expression: '==false' },
          ],
        },
        status: 'success',
        evaluation: 'error',
      },
      timestamp,
      value: false,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(timestamp);

    registry = new MetricProvidersRegistry();
    registry.register(githubNumberProvider);
    registry.register(jiraBooleanProvider);

    mockDatabaseMetricValues.readLatestEntityMetricValues.mockResolvedValue(
      storedMetricValues,
    );

    catalogMetricService = new CatalogMetricService({
      catalog: mockCatalogService,
      auth: mockServices.auth(),
      registry,
      thresholdEvaluator: new ThresholdEvaluator(),
      database: mockDatabaseMetricValues,
    });
  });

  describe('getLatestEntityMetrics', () => {
    it('should get metrics with default thresholds', async () => {
      mockCatalogService.getEntityByRef.mockResolvedValue(mockEntity);

      const result = await catalogMetricService.getLatestEntityMetrics(
        'component:default/test-component',
      );

      expect(mockCatalogService.getEntityByRef).toHaveBeenCalledWith(
        'component:default/test-component',
        expect.objectContaining({
          credentials: expect.any(Object),
        }),
      );
      expect(
        mockDatabaseMetricValues.readLatestEntityMetricValues,
      ).toHaveBeenCalledWith('component:default/test-component', [
        'github.number_metric',
        'jira.boolean_metric',
      ]);

      expect(result).toHaveLength(2);
      expect(result).toEqual([githubMetricResult, jiraMetricResult]);
    });

    it('should get metrics with entity thresholds', async () => {
      const annotatedEntity = {
        ...mockEntity,
        metadata: {
          ...mockEntity.metadata,
          annotations: {
            'custom.annotation': 'custom',
            'scorecard.io/github.number_metric.thresholds.rules.error': '>45', // default error: '>40'
            'scorecard.io/github.number_metric.thresholds.rules.warning': '>25', // default warning: '>20'
            // default success: '<=20'
          },
        },
      };
      mockCatalogService.getEntityByRef.mockResolvedValue(annotatedEntity);

      const result = await catalogMetricService.getLatestEntityMetrics(
        'component:default/test-component',
      );
      expect(result).toHaveLength(2);
      const expectedGithubResult = {
        ...githubMetricResult,
        result: {
          ...githubMetricResult.result,
          thresholdResult: {
            definition: {
              rules: [
                { key: 'error', expression: '>45' }, // overridden from entity
                { key: 'warning', expression: '>25' }, // overridden from entity
                { key: 'success', expression: '<=20' }, // default from provider
              ],
            },
            status: 'success',
            evaluation: 'warning',
          },
        },
      };

      expect(result).toEqual([expectedGithubResult, jiraMetricResult]);
    });

    it('should retrieve metrics for specific provider IDs', async () => {
      mockCatalogService.getEntityByRef.mockResolvedValue(mockEntity);
      mockDatabaseMetricValues.readLatestEntityMetricValues.mockResolvedValue([
        storedMetricValues[1],
      ]);

      const result = await catalogMetricService.getLatestEntityMetrics(
        'component:default/test-component',
        ['jira.boolean_metric'],
      );

      expect(
        mockDatabaseMetricValues.readLatestEntityMetricValues,
      ).toHaveBeenCalledWith('component:default/test-component', [
        'jira.boolean_metric',
      ]);
      expect(result).toHaveLength(1);
      expect(result).toEqual([jiraMetricResult]);
    });

    it("should return 'error' status when metric calculation error", async () => {
      mockCatalogService.getEntityByRef.mockResolvedValue(mockEntity);
      const metricsWithError = [
        storedMetricValues[0], // github metric - success
        {
          ...storedMetricValues[1], // jira metric - error
          value: undefined,
          error_message: 'Error: Jira API failure',
        },
      ];
      mockDatabaseMetricValues.readLatestEntityMetricValues.mockResolvedValue(
        metricsWithError,
      );

      const jiraMetricErrorResult = {
        ...jiraMetricResult,
        status: 'error' as const,
        error: 'Error: Jira API failure',
        result: {
          thresholdResult: {
            definition: {
              rules: [
                {
                  expression: '==true',
                  key: 'success',
                },
                {
                  expression: '==false',
                  key: 'error',
                },
              ],
            },
            evaluation: undefined,
            status: 'error',
            error: 'Unable to evaluate thresholds, metric value is missing',
          },
          timestamp: '2024-01-15T10:30:00.000Z',
          value: undefined,
        },
      };
      mockCatalogService.getEntityByRef.mockResolvedValue(mockEntity);

      const result = await catalogMetricService.getLatestEntityMetrics(
        'component:default/test-component',
      );

      expect(result).toHaveLength(2);
      expect(result).toEqual([githubMetricResult, jiraMetricErrorResult]);
    });

    it('should handle invalid entity threshold annotations', async () => {
      const entityWithInvalidThresholds: Entity = {
        ...mockEntity,
        metadata: {
          ...mockEntity.metadata,
          annotations: {
            'scorecard.io/github.number_metric.thresholds.rules.error':
              'invalid_expression',
          },
        },
      };

      mockCatalogService.getEntityByRef.mockResolvedValue(
        entityWithInvalidThresholds,
      );

      mockDatabaseMetricValues.readLatestEntityMetricValues.mockResolvedValue([
        storedMetricValues[0],
      ]);

      const result = await catalogMetricService.getLatestEntityMetrics(
        'component:default/test-component',
        ['github.number_metric'],
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ...githubMetricResult,
        result: {
          ...githubMetricResult.result,
          thresholdResult: {
            definition: undefined,
            status: 'error',
            evaluation: undefined,
            error: expect.stringContaining('Invalid threshold annotation'),
          },
        },
      });
    });

    it('should handle entity not found', async () => {
      mockCatalogService.getEntityByRef.mockResolvedValue(undefined);

      await expect(
        catalogMetricService.getLatestEntityMetrics(
          'component:default/non-existent',
        ),
      ).rejects.toThrow(
        new NotFoundError('Entity not found: component:default/non-existent'),
      );
    });

    it('should filter authorized metrics based upon permission filter', async () => {
      mockCatalogService.getEntityByRef.mockResolvedValue(mockEntity);

      const filter: PermissionCriteria<
        PermissionCondition<string, PermissionRuleParams>
      > = {
        anyOf: [
          {
            rule: 'HAS_METRIC_ID',
            resourceType: 'scorecard-metric',
            params: { metricIds: ['github.number_metric'] },
          },
        ],
      };

      mockDatabaseMetricValues.readLatestEntityMetricValues.mockResolvedValue([
        storedMetricValues[0],
      ]);

      const result = await catalogMetricService.getLatestEntityMetrics(
        'component:default/test-component',
        undefined,
        filter,
      );

      expect(
        mockDatabaseMetricValues.readLatestEntityMetricValues,
      ).toHaveBeenCalledWith('component:default/test-component', [
        'github.number_metric',
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('github.number_metric');
      expect(result).toEqual([githubMetricResult]);
    });
  });
});
