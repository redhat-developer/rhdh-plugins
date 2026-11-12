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
  DEFAULT_NUMBER_THRESHOLDS,
  type ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { GitlabClient } from '../gitlab/GitlabClient';
import { GitlabJobsProvider } from './GitlabJobsProvider';
import {
  GITLAB_PERCENTAGE_THRESHOLDS,
  GITLAB_SUCCESS_COUNT_THRESHOLDS,
} from './GitlabConfig';
import { oneDayAgo, sevenDaysAgo } from '../utils/relativeDates';

jest.mock('@backstage/catalog-model', () => ({
  ...jest.requireActual('@backstage/catalog-model'),
  getEntitySourceLocation: jest.fn().mockReturnValue({
    type: 'url',
    target: 'https://gitlab.com/my-group/my-project/-/tree/main/',
  }),
}));

describe('GitlabJobsProvider', () => {
  let provider: GitlabJobsProvider;

  const mockedClientInstance: jest.Mocked<Pick<GitlabClient, 'getJobsCount'>> =
    {
      getJobsCount: jest.fn(),
    };

  const sourceUrl = 'https://gitlab.com/my-group/my-project/-/tree/main/';
  const projectSlug = 'my-group/my-project';
  const fixedNow = new Date('2024-06-15T12:00:00.000Z');

  const mockEntity: Entity = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'test-component',
      annotations: {
        'gitlab.com/project-slug': projectSlug,
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(fixedNow);
    provider = GitlabJobsProvider.create(
      mockedClientInstance as unknown as GitlabClient,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('metadata', () => {
    it('should return correct provider datasource ID', () => {
      expect(provider.getProviderDatasourceId()).toBe('gitlab');
    });

    it('should return correct provider ID', () => {
      expect(provider.getProviderId()).toBe('gitlab.jobs');
    });

    it('should return catalog filter for gitlab annotation', () => {
      expect(provider.getCatalogFilter()).toEqual({
        'metadata.annotations.gitlab.com/project-slug': CATALOG_FILTER_EXISTS,
      });
    });

    it('should return five metrics with thresholds', () => {
      const metrics = provider.getMetrics();

      const expectedMetrics = {
        'gitlab.startedJobs7d': {
          id: 'gitlab.startedJobs7d',
          thresholds: DEFAULT_NUMBER_THRESHOLDS,
        },
        'gitlab.successfulJobs7d': {
          id: 'gitlab.successfulJobs7d',
          thresholds: GITLAB_SUCCESS_COUNT_THRESHOLDS,
        },
        'gitlab.failedJobs7d': {
          id: 'gitlab.failedJobs7d',
          thresholds: DEFAULT_NUMBER_THRESHOLDS,
        },
        'gitlab.jobSuccessRatio7d': {
          id: 'gitlab.jobSuccessRatio7d',
          thresholds: GITLAB_PERCENTAGE_THRESHOLDS,
          unit: '%',
        },
        'gitlab.jobSuccessRatio24h': {
          id: 'gitlab.jobSuccessRatio24h',
          thresholds: GITLAB_PERCENTAGE_THRESHOLDS,
          unit: '%',
        },
      } as Record<
        string,
        { id: string; thresholds: ThresholdConfig; unit?: string }
      >;

      expect(metrics).toHaveLength(5);

      metrics.forEach(metric => {
        expect(metric.type).toBe('number');
        expect(metric.id).toEqual(expectedMetrics[metric.id].id);
        expect(metric.thresholds).toEqual(
          expectedMetrics[metric.id].thresholds,
        );
        expect(metric.unit).toEqual(expectedMetrics[metric.id].unit);
      });
    });
  });

  describe('calculateMetrics', () => {
    it('should return all job metrics', async () => {
      mockedClientInstance.getJobsCount
        .mockResolvedValueOnce(300)
        .mockResolvedValueOnce(250)
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(10);

      const result = await provider.calculateMetrics(mockEntity);

      const since7d = sevenDaysAgo(fixedNow.getTime());
      const since1d = oneDayAgo(fixedNow.getTime());

      expect(result.get('gitlab.startedJobs7d')).toBe(300);
      expect(result.get('gitlab.successfulJobs7d')).toBe(250);
      expect(result.get('gitlab.failedJobs7d')).toBe(30);
      expect(result.get('gitlab.jobSuccessRatio7d')).toBe(89);
      expect(result.get('gitlab.jobSuccessRatio24h')).toBe(83);

      expect(mockedClientInstance.getJobsCount).toHaveBeenCalledTimes(5);

      expect(mockedClientInstance.getJobsCount).toHaveBeenNthCalledWith(
        1,
        sourceUrl,
        projectSlug,
        { since: since7d },
      );
      expect(mockedClientInstance.getJobsCount).toHaveBeenNthCalledWith(
        2,
        sourceUrl,
        projectSlug,
        { since: since7d, scope: ['success'] },
      );
      expect(mockedClientInstance.getJobsCount).toHaveBeenNthCalledWith(
        3,
        sourceUrl,
        projectSlug,
        { since: since7d, scope: ['failed'] },
      );
      expect(mockedClientInstance.getJobsCount).toHaveBeenNthCalledWith(
        4,
        sourceUrl,
        projectSlug,
        { since: since1d, scope: ['success'] },
      );
      expect(mockedClientInstance.getJobsCount).toHaveBeenNthCalledWith(
        5,
        sourceUrl,
        projectSlug,
        { since: since1d, scope: ['failed'] },
      );
    });

    it('should return 100% ratio when no jobs exist', async () => {
      mockedClientInstance.getJobsCount.mockResolvedValue(0);

      const result = await provider.calculateMetrics(mockEntity);

      expect(result.get('gitlab.jobSuccessRatio7d')).toBe(100);
      expect(result.get('gitlab.jobSuccessRatio24h')).toBe(100);
    });

    it('should throw when project-slug annotation is missing', async () => {
      const entityWithoutAnnotation: Entity = {
        ...mockEntity,
        metadata: { name: 'test-component' },
      };

      await expect(
        provider.calculateMetrics(entityWithoutAnnotation),
      ).rejects.toThrow(
        "Missing annotation 'gitlab.com/project-slug' for entity component:default/test-component",
      );
    });

    it('should propagate client errors', async () => {
      mockedClientInstance.getJobsCount.mockRejectedValue(
        new Error('GitLab unavailable'),
      );

      await expect(provider.calculateMetrics(mockEntity)).rejects.toThrow(
        'GitLab unavailable',
      );
    });
  });
});
