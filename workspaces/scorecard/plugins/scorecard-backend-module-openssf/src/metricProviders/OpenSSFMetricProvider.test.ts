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

import { CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';
import type { Entity } from '@backstage/catalog-model';

import { OpenSSFMetricProvider } from './OpenSSFMetricProvider';
import { OPENSSF_THRESHOLDS } from './OpenSSFConfig';

const scorecardUrl =
  'https://api.securityscorecards.dev/projects/github.com/owner/repo';

function createEntity(): Entity {
  return {
    apiVersion: 'backstage.io/v1beta1',
    kind: 'Component',
    metadata: {
      name: 'my-service',
      annotations: { 'openssf/baseUrl': scorecardUrl },
    },
    spec: {},
  } as Entity;
}

const maintainedConfig = {
  name: 'Maintained',
  displayTitle: 'OpenSSF Maintained',
  description: 'Determines if the project is actively maintained.',
};

describe('OpenSSFMetricProvider', () => {
  const entity = createEntity();

  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetch = jest.fn();
  });

  describe('metadata', () => {
    it('returns metric name from config', () => {
      const provider = new OpenSSFMetricProvider(
        maintainedConfig,
        OPENSSF_THRESHOLDS,
      );
      expect(provider.getMetricName()).toBe('Maintained');
    });

    it('returns display title and description from config', () => {
      const provider = new OpenSSFMetricProvider(
        maintainedConfig,
        OPENSSF_THRESHOLDS,
      );
      expect(provider.getMetricDisplayTitle()).toBe('OpenSSF Maintained');
      expect(provider.getMetricDescription()).toContain('actively maintained');
    });

    it('returns provider id as openssf.<normalized_name>', () => {
      const provider = new OpenSSFMetricProvider(
        maintainedConfig,
        OPENSSF_THRESHOLDS,
      );
      expect(provider.getProviderId()).toBe('openssf.maintained');
    });

    it('returns openssf as provider datasource id', () => {
      const provider = new OpenSSFMetricProvider(
        maintainedConfig,
        OPENSSF_THRESHOLDS,
      );
      expect(provider.getProviderDatasourceId()).toBe('openssf');
    });

    it('returns number as metric type', () => {
      const provider = new OpenSSFMetricProvider(
        maintainedConfig,
        OPENSSF_THRESHOLDS,
      );
      expect(provider.getMetricType()).toBe('number');
    });

    it('returns metric descriptor with history enabled', () => {
      const provider = new OpenSSFMetricProvider(
        maintainedConfig,
        OPENSSF_THRESHOLDS,
      );
      const metric = provider.getMetric();
      expect(metric.id).toBe('openssf.maintained');
      expect(metric.title).toBe('OpenSSF Maintained');
      expect(metric.type).toBe('number');
      expect(metric.history).toBe(true);
    });

    it('returns configured thresholds', () => {
      const provider = new OpenSSFMetricProvider(
        maintainedConfig,
        OPENSSF_THRESHOLDS,
      );
      expect(provider.getMetricThresholds()).toEqual(OPENSSF_THRESHOLDS);
    });

    it('requires openssf/baseUrl annotation in catalog filter', () => {
      const provider = new OpenSSFMetricProvider(
        maintainedConfig,
        OPENSSF_THRESHOLDS,
      );
      expect(provider.getCatalogFilter()).toEqual({
        'metadata.annotations.openssf/baseUrl': CATALOG_FILTER_EXISTS,
      });
    });
  });

  describe('calculateMetric', () => {
    it('returns the score for the configured check', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          date: '2024-01-15',
          repo: { name: 'github.com/owner/repo', commit: 'x' },
          scorecard: { version: '4.0.0', commit: 'y' },
          score: 7,
          checks: [
            {
              name: 'Maintained',
              score: 8,
              reason: null,
              details: null,
              documentation: { short: '', url: '' },
            },
          ],
        }),
      });

      const provider = new OpenSSFMetricProvider(
        maintainedConfig,
        OPENSSF_THRESHOLDS,
      );
      const result = await provider.calculateMetric(entity);

      expect(result).toBe(8);
      expect(fetch).toHaveBeenCalledWith(scorecardUrl, expect.any(Object));
    });

    it('throws when the check is not in the scorecard', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          date: '2024-01-15',
          repo: { name: 'x', commit: 'x' },
          scorecard: { version: '4.0.0', commit: 'y' },
          score: 7,
          checks: [
            {
              name: 'Other-Check',
              score: 5,
              reason: null,
              details: null,
              documentation: { short: '', url: '' },
            },
          ],
        }),
      });

      const provider = new OpenSSFMetricProvider(
        maintainedConfig,
        OPENSSF_THRESHOLDS,
      );

      await expect(provider.calculateMetric(entity)).rejects.toThrow(
        "OpenSSF check 'Maintained' not found in scorecard",
      );
    });

    it('throws when the check score is out of range (< 0 or > 10)', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          date: '2024-01-15',
          repo: { name: 'x', commit: 'x' },
          scorecard: { version: '4.0.0', commit: 'y' },
          score: 7,
          checks: [
            {
              name: 'Maintained',
              score: 11,
              reason: null,
              details: null,
              documentation: { short: '', url: '' },
            },
          ],
        }),
      });

      const provider = new OpenSSFMetricProvider(
        maintainedConfig,
        OPENSSF_THRESHOLDS,
      );

      await expect(provider.calculateMetric(entity)).rejects.toThrow(
        "OpenSSF check 'Maintained' has invalid score 11",
      );
    });
  });
});
