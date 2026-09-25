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
import { OPENSSF_METRICS, OPENSSF_THRESHOLDS } from './OpenSSFConfig';
import type { OpenSSFCheck, OpenSSFResponse } from '../clients/types';

const scorecardLocation =
  'https://api.securityscorecards.dev/projects/github.com/owner/repo';

const EXPECTED_METRIC_IDS = [
  'openssf.binaryArtifacts',
  'openssf.branchProtection',
  'openssf.ciiBestPractices',
  'openssf.ciTests',
  'openssf.codeReview',
  'openssf.contributors',
  'openssf.dangerousWorkflow',
  'openssf.dependencyUpdateTool',
  'openssf.fuzzing',
  'openssf.license',
  'openssf.maintained',
  'openssf.packaging',
  'openssf.pinnedDependencies',
  'openssf.sast',
  'openssf.securityPolicy',
  'openssf.signedReleases',
  'openssf.tokenPermissions',
  'openssf.vulnerabilities',
];

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

function createCheck(name: string, score: number): OpenSSFCheck {
  return {
    name,
    score,
    reason: null,
    details: null,
    documentation: { short: '', url: '' },
  };
}

function createScorecardResponse(checks: OpenSSFCheck[]): OpenSSFResponse {
  return {
    date: '2024-01-15',
    repo: { name: 'github.com/owner/repo', commit: 'x' },
    scorecard: { version: '4.0.0', commit: 'y' },
    score: 7,
    checks,
  };
}

function mockScorecardFetch(checks: OpenSSFCheck[]): void {
  (globalThis.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue(createScorecardResponse(checks)),
  });
}

describe('OpenSSFMetricProvider', () => {
  const entity = createEntity();
  let provider: OpenSSFMetricProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    globalThis.fetch = jest.fn();
    provider = new OpenSSFMetricProvider();
  });

  describe('metadata', () => {
    it('returns provider id as openssf.securityScorecard', () => {
      expect(provider.getProviderId()).toBe('openssf.securityScorecard');
    });

    it('returns openssf as provider datasource id', () => {
      expect(provider.getProviderDatasourceId()).toBe('openssf');
    });

    it('returns all OpenSSF metrics with correct type, thresholds, and history', () => {
      const metrics = provider.getMetrics();

      expect(metrics).toHaveLength(OPENSSF_METRICS.length);
      expect(metrics.map(metric => metric.id)).toEqual(EXPECTED_METRIC_IDS);
      metrics.forEach(metric => {
        expect(metric.type).toBe('number');
        expect(metric.thresholds).toEqual(OPENSSF_THRESHOLDS);
        expect(metric.history).toBe(true);
      });
    });

    it('maps hyphenated and acronym check names to camelCase metric ids', () => {
      const metricIds = provider.getMetrics().map(metric => metric.id);

      expect(metricIds).toContain('openssf.codeReview');
      expect(metricIds).toContain('openssf.ciiBestPractices');
      expect(metricIds).toContain('openssf.ciTests');
      expect(metricIds).toContain('openssf.sast');
    });

    it('uses titles and descriptions from OPENSSF_METRICS', () => {
      const metrics = provider.getMetrics();
      const maintained = metrics.find(
        metric => metric.id === 'openssf.maintained',
      );
      const codeReview = metrics.find(
        metric => metric.id === 'openssf.codeReview',
      );
      const maintainedConfig = OPENSSF_METRICS.find(
        config => config.name === 'Maintained',
      );
      const codeReviewConfig = OPENSSF_METRICS.find(
        config => config.name === 'Code-Review',
      );

      expect(maintained).toMatchObject({
        title: maintainedConfig?.displayTitle,
        description: maintainedConfig?.description,
      });
      expect(codeReview).toMatchObject({
        title: codeReviewConfig?.displayTitle,
        description: codeReviewConfig?.description,
      });
    });

    it('requires openssf/scorecard-location annotation in catalog filter', () => {
      expect(provider.getCatalogFilter()).toEqual({
        'metadata.annotations.openssf/scorecard-location':
          CATALOG_FILTER_EXISTS,
      });
    });
  });

  describe('calculateMetrics', () => {
    it('returns scores for allowed checks from a single scorecard fetch', async () => {
      mockScorecardFetch([
        createCheck('Maintained', 8),
        createCheck('Code-Review', 9),
      ]);

      const results = await provider.calculateMetrics(entity);

      expect(results.get('openssf.maintained')).toBe(8);
      expect(results.get('openssf.codeReview')).toBe(9);
      expect(results.size).toBe(2);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(scorecardLocation, expect.any(Object));
    });

    it('omits unknown check names instead of throwing', async () => {
      mockScorecardFetch([
        createCheck('Other-Check', 5),
        createCheck('Maintained', 8),
      ]);

      const results = await provider.calculateMetrics(entity);

      expect(results.get('openssf.maintained')).toBe(8);
      expect(results.size).toBe(1);
      expect([...results.keys()]).not.toContain('openssf.otherCheck');
    });

    it.each([[11], [-1]])(
      'omits check score %i outside 0-10 and still returns valid checks',
      async invalidScore => {
        mockScorecardFetch([
          createCheck('Maintained', invalidScore),
          createCheck('Code-Review', 7),
        ]);

        const results = await provider.calculateMetrics(entity);

        expect(results.has('openssf.maintained')).toBe(false);
        expect(results.get('openssf.codeReview')).toBe(7);
      },
    );

    it.each([[0], [10]])('keeps boundary check score %i', async validScore => {
      mockScorecardFetch([createCheck('Maintained', validScore)]);

      const results = await provider.calculateMetrics(entity);

      expect(results.get('openssf.maintained')).toBe(validScore);
    });

    it('returns an empty map when no allowed checks are present', async () => {
      mockScorecardFetch([createCheck('Other-Check', 5)]);

      const results = await provider.calculateMetrics(entity);

      expect(results.size).toBe(0);
    });

    it('propagates errors from the OpenSSF client', async () => {
      const propagatedError = new Error('OpenSSF client failed');
      const getScorecardSpy = jest
        .spyOn((provider as any).openSSFClient, 'getScorecard')
        .mockRejectedValue(propagatedError);

      await expect(provider.calculateMetrics(entity)).rejects.toBe(
        propagatedError,
      );
      expect(getScorecardSpy).toHaveBeenCalledWith(entity);
      expect(fetch).not.toHaveBeenCalled();
    });
  });
});
