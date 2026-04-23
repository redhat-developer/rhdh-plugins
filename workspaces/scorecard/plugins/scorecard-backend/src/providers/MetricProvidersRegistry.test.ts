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

import { ConflictError, NotFoundError } from '@backstage/errors';
import { MetricProvidersRegistry } from './MetricProvidersRegistry';
import {
  githubNumberMetricMetadata,
  githubNumberProvider,
  jiraBooleanMetricMetadata,
  jiraBooleanProvider,
  MockNumberProvider,
  MockBooleanProvider,
  MockBatchBooleanProvider,
  filecheckBatchProvider,
  filecheckBatchMetrics,
} from '../../__fixtures__/mockProviders';
import { MockEntityBuilder } from '../../__fixtures__/mockEntityBuilder';

describe('MetricProvidersRegistry', () => {
  let registry: MetricProvidersRegistry;

  const mockEntity = new MockEntityBuilder().build();

  beforeEach(() => {
    registry = new MetricProvidersRegistry();
  });

  describe('register', () => {
    it('should register metric providers with different IDs successfully', () => {
      expect(() => registry.register(githubNumberProvider)).not.toThrow();
      expect(() => registry.register(jiraBooleanProvider)).not.toThrow();
      expect(registry.listMetrics()).toEqual([
        {
          id: 'github.number_metric',
          ...githubNumberMetricMetadata,
        },
        {
          id: 'jira.boolean_metric',
          ...jiraBooleanMetricMetadata,
        },
      ]);
    });

    it('should throw ConflictError when registering provider with duplicate ID', () => {
      const provider1 = new MockNumberProvider('jira.duplicate_id', 'jira');
      const provider2 = new MockBooleanProvider('jira.duplicate_id', 'jira');
      registry.register(provider1);

      expect(() => registry.register(provider2)).toThrow(
        new ConflictError(
          "Metric provider with ID 'jira.duplicate_id' has already been registered",
        ),
      );
    });

    it('should throw error when provider ID does not match metric ID', () => {
      class InvalidProvider extends MockNumberProvider {
        getMetric() {
          const metric = super.getMetric();
          return { ...metric, id: 'different.id' };
        }
      }

      const invalidProvider = new InvalidProvider(
        'github.test_metric',
        'github',
      );

      expect(() => registry.register(invalidProvider)).toThrow(
        new Error(
          "Invalid metric provider: metric ID 'github.test_metric' returned by getMetricIds() " +
            'does not have a corresponding metric in getMetrics()',
        ),
      );
    });

    it('should throw error when metric type does not match metricType', () => {
      class InvalidProvider extends MockNumberProvider {
        // @ts-expect-error - put wrong metric type for testing
        getMetricType() {
          return 'boolean';
        }
      }

      const invalidProvider = new InvalidProvider(
        'github.test_metric',
        'github',
      );

      // @ts-expect-error - expect error to be thrown
      expect(() => registry.register(invalidProvider)).toThrow(
        new Error(
          "Invalid metric provider with ID github.test_metric, getMetricType() must match getMetric().type. Expected 'boolean', but got 'number'",
        ),
      );
    });

    it('should throw error when provider ID does not start with datasource ID', () => {
      const invalidProvider = new MockNumberProvider(
        'invalid_format',
        'github',
      );

      expect(() => registry.register(invalidProvider)).toThrow(
        new Error(
          "Invalid metric provider with ID invalid_format, must have format 'github.<metric_name>' where metric name is not empty",
        ),
      );
    });

    it('should throw error when provider ID has no metric name after datasource', () => {
      const invalidProvider = new MockNumberProvider('github.', 'github');

      expect(() => registry.register(invalidProvider)).toThrow(
        new Error(
          "Invalid metric provider with ID github., must have format 'github.<metric_name>' where metric name is not empty",
        ),
      );
    });

    it('should throw error for provider ID missing dot separator', () => {
      const invalidProvider = new MockNumberProvider(
        'githubopen_prs',
        'github',
      );

      expect(() => registry.register(invalidProvider)).toThrow(
        new Error(
          "Invalid metric provider with ID githubopen_prs, must have format 'github.<metric_name>' where metric name is not empty",
        ),
      );
    });

    describe('batch providers', () => {
      it('should register batch provider with multiple metric IDs', () => {
        expect(() => registry.register(filecheckBatchProvider)).not.toThrow();

        expect(registry.listMetrics()).toEqual(filecheckBatchMetrics);
      });

      it('should store batch provider under each metric ID', () => {
        registry.register(filecheckBatchProvider);

        // Should be able to get the same provider instance for each metric ID
        const provider1 = registry.getProvider('filecheck.readme');
        const provider2 = registry.getProvider('filecheck.license');
        const provider3 = registry.getProvider('filecheck.codeowners');

        expect(provider1).toBe(filecheckBatchProvider);
        expect(provider2).toBe(filecheckBatchProvider);
        expect(provider3).toBe(filecheckBatchProvider);
      });

      it('should throw ConflictError when batch provider metric ID conflicts with existing', () => {
        const existingProvider = new MockBooleanProvider(
          'filecheck.readme',
          'github',
        );
        registry.register(existingProvider);

        expect(() => registry.register(filecheckBatchProvider)).toThrow(
          new ConflictError(
            "Metric provider with ID 'filecheck.readme' has already been registered",
          ),
        );
      });

      it('should throw error when metric ID from getMetricIds has no corresponding metric', () => {
        class InvalidBatchProvider extends MockBatchBooleanProvider {
          getMetricIds(): string[] {
            return ['filecheck.readme', 'filecheck.nonexistent'];
          }
          getMetrics() {
            return [
              {
                id: 'filecheck.readme',
                title: 'README',
                description: 'README check',
                type: 'boolean' as const,
              },
            ];
          }
        }

        const invalidProvider = new InvalidBatchProvider(
          'github',
          'filecheck',
          [],
        );

        expect(() => registry.register(invalidProvider)).toThrow(
          "Invalid metric provider: metric ID 'filecheck.nonexistent' returned by getMetricIds() " +
            'does not have a corresponding metric in getMetrics()',
        );
      });

      it('should throw error when batch provider metric ID has wrong format', () => {
        class InvalidBatchProvider extends MockBatchBooleanProvider {
          getMetricIds(): string[] {
            return ['invalid_format'];
          }
          getMetrics() {
            return [
              {
                id: 'invalid_format',
                title: 'Invalid',
                description: 'Invalid',
                type: 'boolean' as const,
              },
            ];
          }
        }

        const invalidProvider = new InvalidBatchProvider(
          'github',
          'filecheck',
          [],
        );

        expect(() => registry.register(invalidProvider)).toThrow(
          "Invalid metric provider with ID invalid_format, must have format 'github.<metric_name>' where metric name is not empty",
        );
      });
    });
  });

  describe('getProvider', () => {
    it('should return provider for registered provider', () => {
      registry.register(githubNumberProvider);

      const provider = registry.getProvider('github.number_metric');

      expect(provider).toEqual(githubNumberProvider);
    });

    it('should throw NotFoundError for unregistered provider', () => {
      expect(() => registry.getProvider('non_existent')).toThrow(
        new NotFoundError(
          "No metric provider registered for metric ID 'non_existent'.",
        ),
      );
    });
  });

  describe('getMetric', () => {
    it('should return metric for registered provider', () => {
      registry.register(githubNumberProvider);

      const metric = registry.getMetric('github.number_metric');

      expect(metric).toEqual({
        id: 'github.number_metric',
        ...githubNumberMetricMetadata,
      });
    });

    it('should throw NotFoundError for unregistered provider', () => {
      expect(() => registry.getMetric('non_existent')).toThrow(
        new NotFoundError(
          "No metric provider registered for metric ID 'non_existent'.",
        ),
      );
    });

    it('should return specific metric from batch provider', () => {
      registry.register(filecheckBatchProvider);

      const readmeMetric = registry.getMetric('filecheck.readme');
      const licenseMetric = registry.getMetric('filecheck.license');
      const codeownersMetric = registry.getMetric('filecheck.codeowners');

      expect(readmeMetric).toEqual(filecheckBatchMetrics[0]);
      expect(licenseMetric).toEqual(filecheckBatchMetrics[1]);
      expect(codeownersMetric).toEqual(filecheckBatchMetrics[2]);
    });
  });

  describe('calculateMetric', () => {
    it('should calculate metric for registered provider', async () => {
      registry.register(githubNumberProvider);

      const result = await registry.calculateMetric(
        'github.number_metric',
        mockEntity,
      );

      expect(result).toBe(42);
    });

    it('should throw NotFoundError for unregistered provider', async () => {
      await expect(
        registry.calculateMetric('non_existent', mockEntity),
      ).rejects.toThrow(
        new NotFoundError(
          "No metric provider registered for metric ID 'non_existent'.",
        ),
      );
    });
  });

  describe('calculateMetrics', () => {
    it('should handle empty provider IDs array', async () => {
      const results = await registry.calculateMetrics([], mockEntity);

      expect(results).toEqual([]);
    });

    it('should calculate metrics for multiple registered providers', async () => {
      registry.register(githubNumberProvider);
      registry.register(jiraBooleanProvider);

      const results = await registry.calculateMetrics(
        ['github.number_metric', 'jira.boolean_metric'],
        mockEntity,
      );

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        metricId: 'github.number_metric',
        value: 42,
      });
      expect(results[1]).toEqual({
        metricId: 'jira.boolean_metric',
        value: false,
      });
    });

    it('should calculate metrics for only specified providers', async () => {
      registry.register(githubNumberProvider);
      registry.register(
        new MockNumberProvider(
          'github.open_issues',
          'github',
          'GitHub Open Issues',
          'Github Open Issues description',
          10,
        ),
      );
      registry.register(jiraBooleanProvider);

      const results = await registry.calculateMetrics(
        ['github.number_metric', 'github.open_issues'],
        mockEntity,
      );

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        metricId: 'github.number_metric',
        value: 42,
      });
      expect(results[1]).toEqual({
        metricId: 'github.open_issues',
        value: 10,
      });
    });

    it('should handle mix of successful and failed metric calculations', async () => {
      registry.register(githubNumberProvider);

      const results = await registry.calculateMetrics(
        ['github.number_metric', 'non_existent'],
        mockEntity,
      );

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        metricId: 'github.number_metric',
        value: 42,
      });
      expect(results[1]).toEqual({
        metricId: 'non_existent',
        error: expect.any(NotFoundError),
      });
      expect(results[1].error?.message).toBe(
        "No metric provider registered for metric ID 'non_existent'.",
      );
    });
  });

  describe('listProviders', () => {
    it('should return empty array when no providers registered', () => {
      const providers = registry.listProviders();
      expect(providers).toEqual([]);
    });

    it('should return all registered providers', () => {
      registry.register(githubNumberProvider);
      registry.register(jiraBooleanProvider);

      const providers = registry.listProviders();

      expect(providers).toHaveLength(2);
      expect(providers).toContain(githubNumberProvider);
      expect(providers).toContain(jiraBooleanProvider);
    });

    it('should deduplicate batch providers that are stored under multiple metric IDs', () => {
      registry.register(filecheckBatchProvider);
      registry.register(jiraBooleanProvider);

      const providers = registry.listProviders();

      // Should only have 2 providers, not 4 (batch provider has 3 metric IDs)
      expect(providers).toHaveLength(2);
      expect(providers).toContain(filecheckBatchProvider);
      expect(providers).toContain(jiraBooleanProvider);
    });
  });

  describe('listMetrics', () => {
    beforeEach(() => {
      registry.register(githubNumberProvider);
      registry.register(jiraBooleanProvider);
    });

    it('should return empty array when no providers registered', () => {
      registry = new MetricProvidersRegistry();

      const metrics = registry.listMetrics();
      expect(metrics).toEqual([]);
    });

    it('should return all registered metrics', () => {
      const metrics = registry.listMetrics();

      expect(metrics).toHaveLength(2);
      expect(metrics[0].id).toBe('github.number_metric');
      expect(metrics[1].id).toBe('jira.boolean_metric');
    });

    it('should return filtered metrics', () => {
      const metrics = registry.listMetrics(['jira.boolean_metric']);

      expect(metrics).toHaveLength(1);
      expect(metrics[0].id).toBe('jira.boolean_metric');
    });

    it('should return empty array when all provider IDs are non-existent', () => {
      const metrics = registry.listMetrics([
        'non.existent.metric1',
        'non.existent.metric2',
      ]);

      expect(metrics).toEqual([]);
    });

    it('should return only existing metrics when mix of existing and non-existent IDs', () => {
      const metrics = registry.listMetrics([
        'github.number_metric',
        'non.existent.metric',
        'jira.boolean_metric',
        'another.non.existent',
      ]);

      expect(metrics).toHaveLength(2);
      expect(metrics[0].id).toBe('github.number_metric');
      expect(metrics[1].id).toBe('jira.boolean_metric');
    });

    describe('with batch providers', () => {
      beforeEach(() => {
        registry = new MetricProvidersRegistry();
        registry.register(filecheckBatchProvider);
        registry.register(jiraBooleanProvider);
      });

      it('should return all metrics including batch provider metrics', () => {
        const metrics = registry.listMetrics();

        expect(metrics).toHaveLength(4); // 3 from batch + 1 from jira
        expect(metrics.map(m => m.id)).toEqual([
          'filecheck.readme',
          'filecheck.license',
          'filecheck.codeowners',
          'jira.boolean_metric',
        ]);
      });

      it('should return specific batch provider metrics when filtered', () => {
        const metrics = registry.listMetrics([
          'filecheck.readme',
          'filecheck.codeowners',
        ]);

        expect(metrics).toHaveLength(2);
        expect(metrics[0].id).toBe('filecheck.readme');
        expect(metrics[1].id).toBe('filecheck.codeowners');
      });

      it('should not duplicate metrics from batch providers', () => {
        const metrics = registry.listMetrics();
        const metricIds = metrics.map(m => m.id);

        // Each metric ID should appear exactly once
        const uniqueIds = [...new Set(metricIds)];
        expect(metricIds).toEqual(uniqueIds);
      });
    });
  });

  describe('listMetricsByDatasource', () => {
    beforeEach(() => {
      registry.register(githubNumberProvider);
      registry.register(jiraBooleanProvider);
      registry.register(
        new MockNumberProvider(
          'github.open_issues',
          'github',
          'GitHub Open Issues',
        ),
      );
    });

    it('should return empty array when no providers registered', () => {
      registry = new MetricProvidersRegistry();

      const metrics = registry.listMetricsByDatasource('github');
      expect(metrics).toEqual([]);
    });

    it('should return all metrics for a specific datasource', () => {
      const metrics = registry.listMetricsByDatasource('github');

      expect(metrics).toHaveLength(2);
      expect(metrics[0].id).toBe('github.number_metric');
      expect(metrics[1].id).toBe('github.open_issues');
    });

    it('should return metrics for jira datasource', () => {
      const metrics = registry.listMetricsByDatasource('jira');

      expect(metrics).toHaveLength(1);
      expect(metrics[0].id).toBe('jira.boolean_metric');
    });

    it('should return empty array when datasource does not exist', () => {
      const metrics = registry.listMetricsByDatasource('nonexistent');

      expect(metrics).toEqual([]);
    });

    it('should return empty array when datasource is empty string', () => {
      const metrics = registry.listMetricsByDatasource('');

      expect(metrics).toEqual([]);
    });

    describe('with batch providers', () => {
      beforeEach(() => {
        registry = new MetricProvidersRegistry();
        registry.register(filecheckBatchProvider);
        registry.register(githubNumberProvider);
        registry.register(jiraBooleanProvider);
      });

      it('should return all metrics from batch provider for datasource', () => {
        const metrics = registry.listMetricsByDatasource('github');

        expect(metrics).toHaveLength(4); // 3 from batch + 1 from number provider
        expect(metrics.map(m => m.id)).toContain('filecheck.readme');
        expect(metrics.map(m => m.id)).toContain('filecheck.license');
        expect(metrics.map(m => m.id)).toContain('filecheck.codeowners');
        expect(metrics.map(m => m.id)).toContain('github.number_metric');
      });

      it('should not duplicate metrics from batch providers in datasource listing', () => {
        const metrics = registry.listMetricsByDatasource('github');
        const metricIds = metrics.map(m => m.id);

        // Each metric ID should appear exactly once
        const uniqueIds = [...new Set(metricIds)];
        expect(metricIds).toEqual(uniqueIds);
      });
    });
  });
});
