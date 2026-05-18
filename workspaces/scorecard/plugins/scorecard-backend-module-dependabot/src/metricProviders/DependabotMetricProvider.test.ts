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

import { ConfigReader } from '@backstage/config';
import { CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';
import type { Entity } from '@backstage/catalog-model';
import { DependabotMetricProvider } from './DependabotMetricProvider';
import { DEPENDABOT_SEVERITY_METRIC } from './DependabotConfig';
import { mockServices } from '@backstage/backend-test-utils';

jest.mock('@backstage/catalog-model', () => ({
  ...jest.requireActual('@backstage/catalog-model'),
  getEntitySourceLocation: jest.fn().mockReturnValue({
    type: 'url',
    target: 'https://github.com/owner/repo',
  }),
}));
jest.mock('../clients/DependabotClient');

const mockGetAlerts = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  const { DependabotClient } = jest.requireMock('../clients/DependabotClient');
  DependabotClient.mockImplementation(() => ({ getAlerts: mockGetAlerts }));
});

const mockConfig = new ConfigReader({
  integrations: { github: [{ host: 'github.com', token: 'test-token' }] },
});
const mockLogger = mockServices.logger.mock();

function entity(projectSlug = 'owner/repo'): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'my-service',
      annotations: { 'github.com/project-slug': projectSlug },
    },
  } as Entity;
}

describe('DependabotMetricProvider', () => {
  describe('getProviderDatasourceId', () => {
    it('returns dependabot', () => {
      const provider = new DependabotMetricProvider(
        mockConfig,
        mockLogger,
        'critical',
      );
      expect(provider.getProviderDatasourceId()).toBe('dependabot');
    });
  });

  describe('getProviderId / getMetric', () => {
    it.each([
      ['critical', 'dependabot.alerts_critical', 'Dependabot Critical Alerts'],
      ['high', 'dependabot.alerts_high', 'Dependabot High Alerts'],
      ['medium', 'dependabot.alerts_medium', 'Dependabot Medium Alerts'],
      ['low', 'dependabot.alerts_low', 'Dependabot Low Alerts'],
    ] as const)(
      'for %s returns id %s and title %s',
      (severity, expectedId, expectedTitle) => {
        const provider = new DependabotMetricProvider(
          mockConfig,
          mockLogger,
          severity,
        );
        expect(provider.getProviderId()).toBe(expectedId);
        const metric = provider.getMetric();
        expect(metric.id).toBe(expectedId);
        expect(metric.title).toBe(expectedTitle);
        expect(metric.description).toBe(
          DEPENDABOT_SEVERITY_METRIC[severity].description,
        );
        expect(metric.type).toBe('number');
        expect(metric.history).toBe(true);
      },
    );
  });

  describe('getMetricType', () => {
    it('returns number', () => {
      const provider = new DependabotMetricProvider(
        mockConfig,
        mockLogger,
        'critical',
      );
      expect(provider.getMetricType()).toBe('number');
    });
  });

  describe('getMetricThresholds', () => {
    it('returns default thresholds when none provided', () => {
      const provider = new DependabotMetricProvider(
        mockConfig,
        mockLogger,
        'critical',
      );
      expect(provider.getMetricThresholds()).toBeDefined();
      expect(provider.getMetricThresholds().rules).toBeDefined();
    });

    it('returns custom thresholds when provided', () => {
      const custom = { rules: [{ key: 'ok', expression: '<1' }] };
      const provider = new DependabotMetricProvider(
        mockConfig,
        mockLogger,
        'critical',
        custom,
      );
      expect(provider.getMetricThresholds()).toEqual(custom);
    });
  });

  describe('getCatalogFilter', () => {
    it('requires project-slug and dependabot annotation value true', () => {
      const provider = new DependabotMetricProvider(
        mockConfig,
        mockLogger,
        'critical',
      );
      expect(provider.getCatalogFilter()).toEqual({
        'metadata.annotations.github.com/project-slug': CATALOG_FILTER_EXISTS,
        'metadata.annotations.github.com/dependabot': 'true',
      });
    });
  });

  describe('getRepository', () => {
    it('parses owner/repo from annotation', () => {
      const provider = new DependabotMetricProvider(
        mockConfig,
        mockLogger,
        'critical',
      );
      expect(provider.getRepository(entity('org/repo-name'))).toEqual({
        owner: 'org',
        repo: 'repo-name',
      });
    });

    it('throws when annotation is missing', () => {
      const provider = new DependabotMetricProvider(
        mockConfig,
        mockLogger,
        'critical',
      );
      const e = entity();
      delete e.metadata.annotations!['github.com/project-slug'];
      expect(() => provider.getRepository(e)).toThrow(
        "Missing annotation 'github.com/project-slug'",
      );
    });

    it('throws when project-slug has no slash', () => {
      const provider = new DependabotMetricProvider(
        mockConfig,
        mockLogger,
        'critical',
      );
      expect(() => provider.getRepository(entity('invalid'))).toThrow(
        "Invalid format of 'github.com/project-slug'",
      );
    });

    it.each(['/repo', 'owner/'])(
      'throws when project-slug has an empty owner or repo segment: %s',
      projectSlug => {
        const provider = new DependabotMetricProvider(
          mockConfig,
          mockLogger,
          'critical',
        );
        expect(() => provider.getRepository(entity(projectSlug))).toThrow(
          "Invalid format of 'github.com/project-slug'",
        );
      },
    );
  });

  describe('calculateMetric', () => {
    it.each(['critical', 'high', 'medium', 'low'] as const)(
      'calls getAlerts with target from getEntitySourceLocation and returns count',
      async severity => {
        mockGetAlerts.mockResolvedValue([{ number: 1 }, { number: 2 }]);
        const provider = new DependabotMetricProvider(
          mockConfig,
          mockLogger,
          severity,
        );
        const ent = entity();

        const result = await provider.calculateMetric(ent);

        expect(result).toBe(2);
        // target comes from getEntitySourceLocation(entity), not hardcoded
        expect(mockGetAlerts).toHaveBeenCalledWith(
          'https://github.com/owner/repo',
          { owner: 'owner', repo: 'repo' },
          severity,
        );
        const { getEntitySourceLocation } = jest.requireMock(
          '@backstage/catalog-model',
        );
        expect(getEntitySourceLocation).toHaveBeenCalledWith(ent);
      },
    );

    it('returns 0 when no alerts', async () => {
      mockGetAlerts.mockResolvedValue([]);
      const provider = new DependabotMetricProvider(
        mockConfig,
        mockLogger,
        'critical',
      );
      expect(await provider.calculateMetric(entity())).toBe(0);
    });

    it('propagates errors when getAlerts fails', async () => {
      mockGetAlerts.mockRejectedValueOnce(new Error('dependabot unavailable'));
      const provider = new DependabotMetricProvider(
        mockConfig,
        mockLogger,
        'critical',
      );

      await expect(provider.calculateMetric(entity())).rejects.toThrow(
        'dependabot unavailable',
      );
      expect(mockGetAlerts).toHaveBeenCalledWith(
        'https://github.com/owner/repo',
        { owner: 'owner', repo: 'repo' },
        'critical',
      );
    });
  });
});
