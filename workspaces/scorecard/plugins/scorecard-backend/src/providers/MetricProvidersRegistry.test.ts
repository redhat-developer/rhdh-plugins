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
  filecheckBatchProvider,
  filecheckBatchMetrics,
} from '../../__fixtures__/mockProviders';
import {
  validateMetricId,
  validateProviderId,
} from '../validation/validateMetricProviderIds';

jest.mock('../validation/validateMetricProviderIds', () => {
  const actual = jest.requireActual('../validation/validateMetricProviderIds');
  return {
    ...actual,
    validateProviderId: jest.fn(actual.validateProviderId),
    validateMetricId: jest.fn(actual.validateMetricId),
  };
});

describe('MetricProvidersRegistry', () => {
  let registry: MetricProvidersRegistry;

  beforeEach(() => {
    registry = new MetricProvidersRegistry();
    jest.mocked(validateProviderId).mockClear();
    jest.mocked(validateMetricId).mockClear();
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

    it('should throw ConflictError when registering duplicate metric IDs', () => {
      class ProviderWithSharedMetric extends MockNumberProvider {
        getMetrics() {
          return [
            {
              id: 'jira.sharedMetric',
              title: 'Shared',
              description: 'Shared',
              type: 'number' as const,
              thresholds: this.getDefaultThresholds(),
            },
          ];
        }
      }

      registry.register(new ProviderWithSharedMetric('jira.providerA', 'jira'));

      expect(() =>
        registry.register(
          new ProviderWithSharedMetric('jira.providerB', 'jira'),
        ),
      ).toThrow(
        new ConflictError(
          "Metric with ID 'jira.sharedMetric' has already been registered",
        ),
      );
    });

    it('should throw ConflictError when registering providers with duplicate provider ID', () => {
      class ProviderWithMetricA extends MockNumberProvider {
        getMetrics() {
          return [
            {
              id: 'github.metricA',
              title: 'A',
              description: 'A',
              type: 'number' as const,
              thresholds: this.getDefaultThresholds(),
            },
          ];
        }
      }
      class ProviderWithMetricB extends MockNumberProvider {
        getMetrics() {
          return [
            {
              id: 'github.metricB',
              title: 'B',
              description: 'B',
              type: 'number' as const,
              thresholds: this.getDefaultThresholds(),
            },
          ];
        }
      }

      registry.register(new ProviderWithMetricA('github.shared', 'github'));

      expect(() =>
        registry.register(new ProviderWithMetricB('github.shared', 'github')),
      ).toThrow(
        new ConflictError(
          "Metric provider with ID 'github.shared' has already been registered",
        ),
      );
    });

    it('should call validateProviderId when registering', () => {
      registry.register(githubNumberProvider);

      expect(validateProviderId).toHaveBeenCalledWith(
        githubNumberProvider.getProviderId(),
        githubNumberProvider.getProviderDatasourceId(),
      );
    });

    it('should call validateMetricId for each metric when registering', () => {
      registry.register(filecheckBatchProvider);

      expect(validateMetricId).toHaveBeenCalledTimes(
        filecheckBatchMetrics.length,
      );
      for (const metric of filecheckBatchMetrics) {
        expect(validateMetricId).toHaveBeenCalledWith(
          metric.id,
          filecheckBatchProvider.getProviderDatasourceId(),
        );
      }
    });

    it('should throw error when provider default thresholds are invalid', () => {
      class InvalidThresholdFormatProvider extends MockNumberProvider {
        getMetrics() {
          return [
            {
              id: this.getProviderId(),
              title: 'Invalid Threshold Metric',
              description: 'Test',
              type: 'number' as const,
              thresholds: {
                rules: [{ key: 'error', expression: 'Invalid expression' }],
              },
            },
          ];
        }
      }

      const invalidProvider = new InvalidThresholdFormatProvider(
        'github.invalidThresholdFormat',
        'github',
      );

      expect(() => registry.register(invalidProvider)).toThrow(
        /Invalid default thresholds for metric provider 'github.invalidThresholdFormat'/,
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
            "Metric with ID 'filecheck.readme' has already been registered",
          ),
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
