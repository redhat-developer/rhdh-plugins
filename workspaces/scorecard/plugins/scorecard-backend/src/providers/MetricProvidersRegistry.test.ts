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
} from '../../__fixtures__/mockProviders';
import { mockEntity } from '../../__fixtures__/mockEntities';

describe('MetricProvidersRegistry', () => {
  let registry: MetricProvidersRegistry;

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
          "Invalid metric provider with ID github.test_metric, provider ID must match metric ID 'different.id'",
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
          "Metric provider with ID 'non_existent' is not registered.",
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
          "Metric provider with ID 'non_existent' is not registered.",
        ),
      );
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
          "Metric provider with ID 'non_existent' is not registered.",
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
        providerId: 'github.number_metric',
        value: 42,
      });
      expect(results[1]).toEqual({
        providerId: 'jira.boolean_metric',
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
        providerId: 'github.number_metric',
        value: 42,
      });
      expect(results[1]).toEqual({
        providerId: 'github.open_issues',
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
        providerId: 'github.number_metric',
        value: 42,
      });
      expect(results[1]).toEqual({
        providerId: 'non_existent',
        error: expect.any(NotFoundError),
      });
      expect(results[1].error?.message).toBe(
        "Metric provider with ID 'non_existent' is not registered.",
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
  });

  describe('listMetrics', () => {
    it('should return empty array when no providers registered', () => {
      const metrics = registry.listMetrics();
      expect(metrics).toEqual([]);
    });

    it('should return all registered metrics', () => {
      registry.register(githubNumberProvider);
      registry.register(jiraBooleanProvider);

      const metrics = registry.listMetrics();

      expect(metrics).toHaveLength(2);
      expect(metrics[0].id).toBe('github.number_metric');
      expect(metrics[1].id).toBe('jira.boolean_metric');
    });
  });

  describe('listMetricsByDatasource', () => {
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
        'sonar.code-quality',
        'sonar',
        'Code Quality',
      );

      registry.register(githubProvider1);
      registry.register(githubProvider2);
      registry.register(sonarProvider);
    });

    it('should return empty array for non_existent datasource', () => {
      const metrics = registry.listMetricsByDatasource('non_existent');
      expect(metrics).toEqual([]);
    });

    it('should return metrics for specific datasource', () => {
      const githubMetrics = registry.listMetricsByDatasource('github');

      expect(githubMetrics).toHaveLength(2);
      expect(githubMetrics[0].id).toBe('github.open_prs');
      expect(githubMetrics[1].id).toBe('github.open_issues');
    });
  });
});
