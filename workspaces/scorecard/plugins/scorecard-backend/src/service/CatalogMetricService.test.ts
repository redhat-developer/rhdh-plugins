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

import { CatalogApi } from '@backstage/catalog-client';
import { Entity } from '@backstage/catalog-model';
import { NotFoundError } from '@backstage/errors';
import { CatalogMetricService } from './CatalogMetricService';
import { MetricProvidersRegistry } from '../providers/MetricProvidersRegistry';
import { ThresholdEvaluator } from '../threshold/ThresholdEvaluator';
import { mockServices } from '@backstage/backend-test-utils';
import {
  githubNumberMetricMetadata,
  githubNumberProvider,
  jiraBooleanMetricMetadata,
  jiraBooleanProvider,
} from '../../__fixtures__/mockProviders';
import { mockEntity } from '../../__fixtures__/mockEntities';
import { ThresholdConfigFormatError } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';

const mockCatalogApi = {
  getEntityByRef: jest.fn(),
} as unknown as jest.Mocked<CatalogApi>;

describe('CatalogMetricService', () => {
  let catalogMetricService: CatalogMetricService;
  let registry: MetricProvidersRegistry;
  const timestamp = '2024-01-15T10:30:00.000Z';
  const mockLogger = mockServices.logger.mock();

  const githubMetricResult = {
    id: 'github.number-metric',
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
    id: 'jira.boolean-metric',
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

    catalogMetricService = new CatalogMetricService({
      catalogApi: mockCatalogApi,
      registry,
      thresholdEvaluator: new ThresholdEvaluator(),
      logger: mockLogger,
      auth: mockServices.auth(),
    });
  });

  describe('calculateEntityMetrics', () => {
    it('should calculate metrics successfully with default thresholds', async () => {
      mockCatalogApi.getEntityByRef.mockResolvedValue(mockEntity);

      const result = await catalogMetricService.calculateEntityMetrics(
        'component:default/test-component',
      );

      expect(result).toHaveLength(2);
      expect(result).toEqual([githubMetricResult, jiraMetricResult]);
    });

    it('should calculate metrics successfully with entity thresholds', async () => {
      const annotatedEntity = {
        ...mockEntity,
        metadata: {
          ...mockEntity.metadata,
          annotations: {
            'custom.annotation': 'custom',
            'scorecard.io/github.number-metric.thresholds.rules.error': '>45', // default error: '>40'
            'scorecard.io/github.number-metric.thresholds.rules.warning': '>25', // default warning: '>20'
            // default success: '<=20'
          },
        },
      };
      mockCatalogApi.getEntityByRef.mockResolvedValue(annotatedEntity);

      const result = await catalogMetricService.calculateEntityMetrics(
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

    it('should calculate metrics for specific provider IDs', async () => {
      mockCatalogApi.getEntityByRef.mockResolvedValue(mockEntity);

      const result = await catalogMetricService.calculateEntityMetrics(
        'component:default/test-component',
        ['jira.boolean-metric'],
      );

      expect(result).toHaveLength(1);
      expect(result).toEqual([jiraMetricResult]);
    });

    it('should handle metric calculation error', async () => {
      jest
        .spyOn(jiraBooleanProvider, 'calculateMetric')
        .mockRejectedValue(new Error('Jira API failure'));
      const jiraMetricErrorResult = {
        ...jiraMetricResult,
        status: 'error' as const,
        error: 'Error: Jira API failure',
        result: undefined,
      };
      mockCatalogApi.getEntityByRef.mockResolvedValue(mockEntity);

      const result = await catalogMetricService.calculateEntityMetrics(
        'component:default/test-component',
      );

      expect(result).toHaveLength(2);
      expect(result).toEqual([githubMetricResult, jiraMetricErrorResult]);
    });

    it('should handle invalid entity threshold annotations and skip them', async () => {
      const entityWithInvalidThresholds: Entity = {
        ...mockEntity,
        metadata: {
          ...mockEntity.metadata,
          annotations: {
            'scorecard.io/github.number-metric.thresholds.rules.error':
              'invalid_expression',
          },
        },
      };

      mockCatalogApi.getEntityByRef.mockResolvedValue(
        entityWithInvalidThresholds,
      );

      const result = await catalogMetricService.calculateEntityMetrics(
        'component:default/test-component',
        ['github.number-metric'],
      );

      expect(result).toHaveLength(1);
      expect(result).toEqual([githubMetricResult]);
      expect(mockLogger.error).toHaveBeenCalledWith(
        `Invalid threshold annotation in entity 'component:default/test-component': {"key":"error","expression":"invalid_expression"}. Skipping including this threshold.`,
        new ThresholdConfigFormatError(
          'Invalid threshold expression: "invalid_expression".',
        ),
      );
    });

    it('should handle entity not found', async () => {
      mockCatalogApi.getEntityByRef.mockResolvedValue(undefined);

      await expect(
        catalogMetricService.calculateEntityMetrics(
          'component:default/non-existent',
        ),
      ).rejects.toThrow(
        new NotFoundError('Entity not found: component:default/non-existent'),
      );
    });
  });
});
