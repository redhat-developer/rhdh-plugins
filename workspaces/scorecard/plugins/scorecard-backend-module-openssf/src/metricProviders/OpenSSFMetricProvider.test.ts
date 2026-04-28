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

import {
  createOpenSSFMetricProvider,
  OpenSSFMetricProvider,
} from './OpenSSFMetricProvider';
import { OPENSSF_METRICS, OPENSSF_THRESHOLDS } from './OpenSSFConfig';

const scorecardLocation =
  'https://api.securityscorecards.dev/projects/github.com/owner/repo';

function createEntity(): Entity {
  return {
    apiVersion: 'backstage.io/v1beta1',
    kind: 'Component',
    metadata: {
      name: 'my-service',
      annotations: { 'openssf/scorecard-location': scorecardLocation },
    },
    spec: {},
  } as Entity;
}

const maintainedConfig = {
  name: 'Maintained',
  displayTitle: 'OpenSSF Maintained',
  description: 'Determines if the project is actively maintained.',
};

const hyphenatedCheckConfig = {
  name: 'Code-Review',
  displayTitle: 'OpenSSF Code Review',
  description: 'Determines if the project requires code review.',
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

    it('normalizes hyphenated check names for provider id', () => {
      const provider = new OpenSSFMetricProvider(
        hyphenatedCheckConfig,
        OPENSSF_THRESHOLDS,
      );
      expect(provider.getProviderId()).toBe('openssf.code_review');
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

    it('requires openssf/scorecard-location annotation in catalog filter', () => {
      const provider = new OpenSSFMetricProvider(
        maintainedConfig,
        OPENSSF_THRESHOLDS,
      );
      expect(provider.getCatalogFilter()).toEqual({
        'metadata.annotations.openssf/scorecard-location':
          CATALOG_FILTER_EXISTS,
      });
    });
  });

  describe('calculateMetric', () => {
    it.each([0, 10])(
      'returns the score when the check is at boundary %i',
      async boundaryScore => {
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
                score: boundaryScore,
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

        expect(result).toBe(boundaryScore);
      },
    );

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
      expect(fetch).toHaveBeenCalledWith(scorecardLocation, expect.any(Object));
    });

    it('propagates errors from the OpenSSF client', async () => {
      const provider = new OpenSSFMetricProvider(
        maintainedConfig,
        OPENSSF_THRESHOLDS,
      );
      const propagatedError = new Error('OpenSSF client failed');
      const getScorecardSpy = jest
        .spyOn((provider as any).openSSFClient, 'getScorecard')
        .mockRejectedValue(propagatedError);

      await expect(provider.calculateMetric(entity)).rejects.toBe(
        propagatedError,
      );
      expect(getScorecardSpy).toHaveBeenCalledWith(entity);
      expect(fetch).not.toHaveBeenCalled();
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

  describe('createOpenSSFMetricProvider', () => {
    it('creates one provider per configured OpenSSF metric', () => {
      const providers = createOpenSSFMetricProvider();

      expect(providers).toHaveLength(OPENSSF_METRICS.length);
      expect(
        providers.every(provider => provider instanceof OpenSSFMetricProvider),
      ).toBe(true);
    });

    it('returns providers with normalized ids and configured thresholds', () => {
      const providers = createOpenSSFMetricProvider();

      const providerIds = providers.map(provider => provider.getProviderId());
      const expectedProviderIds = OPENSSF_METRICS.map(metric => {
        const normalizedName = metric.name.toLowerCase().replace(/-/g, '_');
        return `openssf.${normalizedName}`;
      });

      expect(providerIds).toEqual(expectedProviderIds);
      providers.forEach(provider => {
        expect(provider.getProviderDatasourceId()).toBe('openssf');
        expect(provider.getMetricThresholds()).toEqual(OPENSSF_THRESHOLDS);
      });
    });
  });
});
