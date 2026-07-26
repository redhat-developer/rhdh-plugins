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
          id: 'github.numberMetric',
          ...githubNumberMetricMetadata,
        },
        {
          id: 'jira.booleanMetric',
          ...jiraBooleanMetricMetadata,
        },
      ]);
    });

    it('should throw ConflictError when registering provider with duplicate ID', () => {
      const provider1 = new MockNumberProvider('jira.duplicateId', 'jira');
      const provider2 = new MockBooleanProvider('jira.duplicateId', 'jira');
      registry.register(provider1);

      expect(() => registry.register(provider2)).toThrow(
        new ConflictError(
          "Metric provider with ID 'jira.duplicateId' has already been registered",
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
        'github.testMetric',
        'github',
      );

      expect(() => registry.register(invalidProvider)).toThrow(
        new Error(
          "Invalid metric provider: metric ID 'github.testMetric' returned by getMetricIds() " +
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
        'github.testMetric',
        'github',
      );

      // @ts-expect-error - expect error to be thrown
      expect(() => registry.register(invalidProvider)).toThrow(
        new Error(
          "Invalid metric provider with ID github.testMetric, getMetricType() must match getMetric().type. Expected 'boolean', but got 'number'",
        ),
      );
    });

    it('should throw error when provider ID does not start with datasource ID', () => {
      const invalidProvider = new MockNumberProvider('invalidFormat', 'github');

      expect(() => registry.register(invalidProvider)).toThrow(
        new Error(
          "Invalid metric provider with ID invalidFormat, must have format 'github.<metricName>' where metric name is not empty",
        ),
      );
    });

    it('should throw error when provider ID has no metric name after datasource', () => {
      const invalidProvider = new MockNumberProvider('github.', 'github');

      expect(() => registry.register(invalidProvider)).toThrow(
        new Error(
          "Invalid metric provider with ID github., must have format 'github.<metricName>' where metric name is not empty",
        ),
      );
    });

    it('should throw error for provider ID missing dot separator', () => {
      const invalidProvider = new MockNumberProvider('githubopenPrs', 'github');

      expect(() => registry.register(invalidProvider)).toThrow(
        new Error(
          "Invalid metric provider with ID githubopenPrs, must have format 'github.<metricName>' where metric name is not empty",
        ),
      );
    });

    it('should throw error when provider default thresholds are invalid', () => {
      class InvalidThresholdFormatProvider extends MockNumberProvider {
        getMetricThresholds() {
          return {
            rules: [{ key: 'error', expression: 'Invalid expression' }],
          } as any;
        }
      }

      const invalidProvider = new InvalidThresholdFormatProvider(
        'github.invalidThresholdFormat',
        'github',
      );

      expect(() => registry.register(invalidProvider)).toThrow(
        'Invalid default thresholds for metric provider \'github.invalidThresholdFormat\'; caused by ThresholdConfigFormatError: Invalid threshold expression: "Invalid expression"',
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
          'filecheck',
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
          'filecheck',
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
            return ['invalidFormat'];
          }
          getMetrics() {
            return [
              {
                id: 'invalidFormat',
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
          "Invalid metric provider with ID invalidFormat, must have format 'github.<metricName>' where metric name is not empty",
        );
      });
    });
  });

  describe('getProvider', () => {
    it('should return provider for registered provider', () => {
      registry.register(githubNumberProvider);

      const provider = registry.getProvider('github.numberMetric');

      expect(provider).toEqual(githubNumberProvider);
    });

    it('should throw NotFoundError for unregistered provider', () => {
      expect(() => registry.getProvider('nonExistent')).toThrow(
        new NotFoundError(
          "No metric provider registered for metric ID 'nonExistent'.",
        ),
      );
    });
  });

  describe('getMetric', () => {
    it('should return metric for registered provider', () => {
      registry.register(githubNumberProvider);

      const metric = registry.getMetric('github.numberMetric');

      expect(metric).toEqual({
        id: 'github.numberMetric',
        ...githubNumberMetricMetadata,
      });
    });

    it('should throw NotFoundError for unregistered provider', () => {
      expect(() => registry.getMetric('nonExistent')).toThrow(
        new NotFoundError(
          "No metric provider registered for metric ID 'nonExistent'.",
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
        'github.numberMetric',
        mockEntity,
      );

      expect(result).toBe(42);
    });

    it('should throw NotFoundError for unregistered provider', async () => {
      await expect(
        registry.calculateMetric('nonExistent', mockEntity),
      ).rejects.toThrow(
        new NotFoundError(
          "No metric provider registered for metric ID 'nonExistent'.",
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
        ['github.numberMetric', 'jira.booleanMetric'],
        mockEntity,
      );

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        metricId: 'github.numberMetric',
        value: 42,
      });
      expect(results[1]).toEqual({
        metricId: 'jira.booleanMetric',
        value: false,
      });
    });

    it('should calculate metrics for only specified providers', async () => {
      registry.register(githubNumberProvider);
      registry.register(
        new MockNumberProvider(
          'github.openIssues',
          'github',
          'GitHub Open Issues',
          'Github Open Issues description',
          10,
        ),
      );
      registry.register(jiraBooleanProvider);

      const results = await registry.calculateMetrics(
        ['github.numberMetric', 'github.openIssues'],
        mockEntity,
      );

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        metricId: 'github.numberMetric',
        value: 42,
      });
      expect(results[1]).toEqual({
        metricId: 'github.openIssues',
        value: 10,
      });
    });

    it('should handle mix of successful and failed metric calculations', async () => {
      registry.register(githubNumberProvider);

      const results = await registry.calculateMetrics(
        ['github.numberMetric', 'nonExistent'],
        mockEntity,
      );

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        metricId: 'github.numberMetric',
        value: 42,
      });
      expect(results[1]).toEqual({
        metricId: 'nonExistent',
        error: expect.any(NotFoundError),
      });
      expect(results[1].error?.message).toBe(
        "No metric provider registered for metric ID 'nonExistent'.",
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
      expect(metrics[0].id).toBe('github.numberMetric');
      expect(metrics[1].id).toBe('jira.booleanMetric');
    });

    it('should return filtered metrics', () => {
      const metrics = registry.listMetrics(['jira.booleanMetric']);

      expect(metrics).toHaveLength(1);
      expect(metrics[0].id).toBe('jira.booleanMetric');
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
        'github.numberMetric',
        'non.existent.metric',
        'jira.booleanMetric',
        'another.non.existent',
      ]);

      expect(metrics).toHaveLength(2);
      expect(metrics[0].id).toBe('github.numberMetric');
      expect(metrics[1].id).toBe('jira.booleanMetric');
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
          'jira.booleanMetric',
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
          'github.openIssues',
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
      expect(metrics[0].id).toBe('github.numberMetric');
      expect(metrics[1].id).toBe('github.openIssues');
    });

    it('should return metrics for jira datasource', () => {
      const metrics = registry.listMetricsByDatasource('jira');

      expect(metrics).toHaveLength(1);
      expect(metrics[0].id).toBe('jira.booleanMetric');
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
        const metrics = registry.listMetricsByDatasource('filecheck');

        expect(metrics).toHaveLength(3);
        expect(metrics.map(m => m.id)).toContain('filecheck.readme');
        expect(metrics.map(m => m.id)).toContain('filecheck.license');
        expect(metrics.map(m => m.id)).toContain('filecheck.codeowners');
      });

      it('should not include batch provider metrics under a different datasource', () => {
        const githubMetrics = registry.listMetricsByDatasource('github');

        expect(githubMetrics).toHaveLength(1);
        expect(githubMetrics[0].id).toBe('github.numberMetric');
      });

      it('should not duplicate metrics from batch providers in datasource listing', () => {
        const metrics = registry.listMetricsByDatasource('filecheck');
        const metricIds = metrics.map(m => m.id);

        // Each metric ID should appear exactly once
        const uniqueIds = [...new Set(metricIds)];
        expect(metricIds).toEqual(uniqueIds);
      });
    });
  });
});
