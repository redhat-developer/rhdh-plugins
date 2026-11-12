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
import { GitlabPipelinesProvider } from './GitlabPipelinesProvider';
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

describe('GitlabPipelinesProvider', () => {
  let provider: GitlabPipelinesProvider;

  const mockedClientInstance: jest.Mocked<
    Pick<GitlabClient, 'getPipelinesCount'>
  > = {
    getPipelinesCount: jest.fn(),
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

    provider = GitlabPipelinesProvider.create(
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
      expect(provider.getProviderId()).toBe('gitlab.pipelines');
    });

    it('should return catalog filter for gitlab annotation', () => {
      expect(provider.getCatalogFilter()).toEqual({
        'metadata.annotations.gitlab.com/project-slug': CATALOG_FILTER_EXISTS,
      });
    });

    it('should return five metrics with thresholds', () => {
      const metrics = provider.getMetrics();

      const expectedMetrics = {
        'gitlab.startedPipelines7d': {
          id: 'gitlab.startedPipelines7d',
          thresholds: DEFAULT_NUMBER_THRESHOLDS,
        },
        'gitlab.successfulPipelines7d': {
          id: 'gitlab.successfulPipelines7d',
          thresholds: GITLAB_SUCCESS_COUNT_THRESHOLDS,
        },
        'gitlab.failedPipelines7d': {
          id: 'gitlab.failedPipelines7d',
          thresholds: DEFAULT_NUMBER_THRESHOLDS,
        },
        'gitlab.pipelineSuccessRatio7d': {
          id: 'gitlab.pipelineSuccessRatio7d',
          thresholds: GITLAB_PERCENTAGE_THRESHOLDS,
          unit: '%',
        },
        'gitlab.pipelineSuccessRatio24h': {
          id: 'gitlab.pipelineSuccessRatio24h',
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
    const since7d = sevenDaysAgo(fixedNow.getTime());
    const since1d = oneDayAgo(fixedNow.getTime());

    it('should return all pipeline metrics', async () => {
      mockedClientInstance.getPipelinesCount
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(80)
        .mockResolvedValueOnce(15)
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(5);

      const result = await provider.calculateMetrics(mockEntity);

      expect(result.get('gitlab.startedPipelines7d')).toBe(100);
      expect(result.get('gitlab.successfulPipelines7d')).toBe(80);
      expect(result.get('gitlab.failedPipelines7d')).toBe(15);
      expect(result.get('gitlab.pipelineSuccessRatio7d')).toBe(84);
      expect(result.get('gitlab.pipelineSuccessRatio24h')).toBe(80);

      expect(mockedClientInstance.getPipelinesCount).toHaveBeenNthCalledWith(
        1,
        sourceUrl,
        projectSlug,
        since7d,
      );
      expect(mockedClientInstance.getPipelinesCount).toHaveBeenNthCalledWith(
        2,
        sourceUrl,
        projectSlug,
        since7d,
        'success',
      );
      expect(mockedClientInstance.getPipelinesCount).toHaveBeenNthCalledWith(
        3,
        sourceUrl,
        projectSlug,
        since7d,
        'failed',
      );
      expect(mockedClientInstance.getPipelinesCount).toHaveBeenNthCalledWith(
        4,
        sourceUrl,
        projectSlug,
        since1d,
        'success',
      );
      expect(mockedClientInstance.getPipelinesCount).toHaveBeenNthCalledWith(
        5,
        sourceUrl,
        projectSlug,
        since1d,
        'failed',
      );
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
      mockedClientInstance.getPipelinesCount.mockRejectedValue(
        new Error('GitLab unavailable'),
      );

      await expect(provider.calculateMetrics(mockEntity)).rejects.toThrow(
        'GitLab unavailable',
      );
    });
  });
});
