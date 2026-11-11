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

import { mockServices } from '@backstage/backend-test-utils';
import { CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';
import type { Entity } from '@backstage/catalog-model';
import {
  DEFAULT_NUMBER_THRESHOLDS,
  type ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { GitlabClient } from '../gitlab/GitlabClient';
import { GitlabJobsProvider } from './GitlabJobsProvider';
import { GITLAB_PERCENTAGE_THRESHOLDS } from './GitlabConfig';

jest.mock('@backstage/catalog-model', () => ({
  ...jest.requireActual('@backstage/catalog-model'),
  getEntitySourceLocation: jest.fn().mockReturnValue({
    type: 'url',
    target: 'https://gitlab.com/my-group/my-project/-/tree/main/',
  }),
}));
jest.mock('../gitlab/GitlabClient');

describe('GitlabJobsProvider', () => {
  let provider: GitlabJobsProvider;

  const mockedGitlabClient = GitlabClient as jest.MockedClass<
    typeof GitlabClient
  >;
  const mockedClientInstance: jest.Mocked<Pick<GitlabClient, 'getJobsCount'>> =
    {
      getJobsCount: jest.fn(),
    };

  mockedGitlabClient.mockImplementation(() => mockedClientInstance as any);

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
    provider = GitlabJobsProvider.fromConfig(
      mockServices.rootConfig({ data: {} }),
      { logger: mockServices.logger.mock() },
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
      expect(provider.getProviderId()).toBe('gitlab.startedJobs7d');
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
          thresholds: DEFAULT_NUMBER_THRESHOLDS,
        },
        'gitlab.failedJobs7d': {
          id: 'gitlab.failedJobs7d',
          thresholds: DEFAULT_NUMBER_THRESHOLDS,
        },
        'gitlab.jobSuccessRatio7d': {
          id: 'gitlab.jobSuccessRatio7d',
          thresholds: GITLAB_PERCENTAGE_THRESHOLDS,
        },
        'gitlab.jobSuccessRatio24h': {
          id: 'gitlab.jobSuccessRatio24h',
          thresholds: GITLAB_PERCENTAGE_THRESHOLDS,
        },
      } as Record<string, { id: string; thresholds: ThresholdConfig }>;

      expect(metrics).toHaveLength(5);

      metrics.forEach(metric => {
        expect(metric.type).toBe('number');
        expect(metric.id).toEqual(expectedMetrics[metric.id].id);
        expect(metric.thresholds).toEqual(
          expectedMetrics[metric.id].thresholds,
        );
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

      const sevenDaysAgo = new Date(
        fixedNow.getTime() - 7 * 24 * 60 * 60 * 1000,
      );
      const oneDayAgo = new Date(fixedNow.getTime() - 24 * 60 * 60 * 1000);

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
        sevenDaysAgo,
      );
      expect(mockedClientInstance.getJobsCount).toHaveBeenNthCalledWith(
        2,
        sourceUrl,
        projectSlug,
        sevenDaysAgo,
        ['success'],
      );
      expect(mockedClientInstance.getJobsCount).toHaveBeenNthCalledWith(
        3,
        sourceUrl,
        projectSlug,
        sevenDaysAgo,
        ['failed'],
      );
      expect(mockedClientInstance.getJobsCount).toHaveBeenNthCalledWith(
        4,
        sourceUrl,
        projectSlug,
        oneDayAgo,
        ['success'],
      );
      expect(mockedClientInstance.getJobsCount).toHaveBeenNthCalledWith(
        5,
        sourceUrl,
        projectSlug,
        oneDayAgo,
        ['failed'],
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
