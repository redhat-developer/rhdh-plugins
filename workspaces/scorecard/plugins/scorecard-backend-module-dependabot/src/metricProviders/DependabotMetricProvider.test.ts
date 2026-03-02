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
import type { Entity } from '@backstage/catalog-model';
import { DependabotMetricProvider } from './DependabotMetricProvider';
import { DEPENDABOT_SEVERITY_METRIC } from './DependabotConfig';

jest.mock('../clients/DependabotClient');

const mockGetCriticalAlerts = jest.fn();
const mockGetHighAlerts = jest.fn();
const mockGetMediumAlerts = jest.fn();
const mockGetLowAlerts = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  const { DependabotClient } = jest.requireMock('../clients/DependabotClient');
  DependabotClient.mockImplementation(() => ({
    getCriticalAlerts: mockGetCriticalAlerts,
    getHighAlerts: mockGetHighAlerts,
    getMediumAlerts: mockGetMediumAlerts,
    getLowAlerts: mockGetLowAlerts,
  }));
});

const mockConfig = new ConfigReader({
  integrations: { github: [{ host: 'github.com', token: 'test-token' }] },
});
const mockLogger = {
  child: jest.fn().mockReturnThis(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
} as any;

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
      ['critical', 'dependabot.alerts.critical', 'Dependabot Critical Alerts'],
      ['high', 'dependabot.alerts.high', 'Dependabot High Alerts'],
      ['medium', 'dependabot.alerts.medium', 'Dependabot Medium Alerts'],
      ['low', 'dependabot.alerts.low', 'Dependabot Low Alerts'],
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
    it('requires github.com/project-slug annotation', () => {
      const provider = new DependabotMetricProvider(
        mockConfig,
        mockLogger,
        'critical',
      );
      const filter = provider.getCatalogFilter();
      expect(
        filter['metadata.annotations.github.com/project-slug'],
      ).toBeDefined();
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
  });

  describe('calculateMetric', () => {
    it.each([
      ['critical', mockGetCriticalAlerts],
      ['high', mockGetHighAlerts],
      ['medium', mockGetMediumAlerts],
      ['low', mockGetLowAlerts],
    ] as const)(
      'calls correct client method for %s and returns count',
      async (severity, mockFn) => {
        mockFn.mockResolvedValue([{ number: 1 }, { number: 2 }]);
        const provider = new DependabotMetricProvider(
          mockConfig,
          mockLogger,
          severity,
        );

        const result = await provider.calculateMetric(entity());

        expect(result).toBe(2);
        expect(mockFn).toHaveBeenCalledWith('https://github.com/owner/repo', {
          owner: 'owner',
          repo: 'repo',
        });
      },
    );

    it('returns 0 when no alerts', async () => {
      mockGetCriticalAlerts.mockResolvedValue([]);
      const provider = new DependabotMetricProvider(
        mockConfig,
        mockLogger,
        'critical',
      );
      expect(await provider.calculateMetric(entity())).toBe(0);
    });
  });
});
