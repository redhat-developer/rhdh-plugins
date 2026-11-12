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
import { sevenDaysAgo } from '../utils/relativeDates';
import { GitlabMergeRequestsProvider } from './GitlabMergeRequestsProvider';

jest.mock('@backstage/catalog-model', () => ({
  ...jest.requireActual('@backstage/catalog-model'),
  getEntitySourceLocation: jest.fn().mockReturnValue({
    type: 'url',
    target: 'https://gitlab.com/my-group/my-project/-/tree/main/',
  }),
}));

describe('GitlabMergeRequestsProvider', () => {
  let provider: GitlabMergeRequestsProvider;

  const mockedClientInstance: jest.Mocked<
    Pick<
      GitlabClient,
      | 'getOpenMergeRequestsCount'
      | 'getOpenedMergeRequestsCount'
      | 'getClosedMergeRequestsCount'
    >
  > = {
    getOpenMergeRequestsCount: jest.fn(),
    getOpenedMergeRequestsCount: jest.fn(),
    getClosedMergeRequestsCount: jest.fn(),
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

    provider = GitlabMergeRequestsProvider.create(
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
      expect(provider.getProviderId()).toBe('gitlab.mergeRequests');
    });

    it('should return catalog filter for gitlab annotation', () => {
      expect(provider.getCatalogFilter()).toEqual({
        'metadata.annotations.gitlab.com/project-slug': CATALOG_FILTER_EXISTS,
      });
    });

    it('should return three metrics with thresholds', () => {
      const metrics = provider.getMetrics();

      const expectedMetrics = {
        'gitlab.openMergeRequests': {
          id: 'gitlab.openMergeRequests',
          thresholds: DEFAULT_NUMBER_THRESHOLDS,
        },
        'gitlab.openedMergeRequests7d': {
          id: 'gitlab.openedMergeRequests7d',
          thresholds: DEFAULT_NUMBER_THRESHOLDS,
        },
        'gitlab.closedMergeRequests7d': {
          id: 'gitlab.closedMergeRequests7d',
          thresholds: DEFAULT_NUMBER_THRESHOLDS,
        },
      } as Record<string, { id: string; thresholds: ThresholdConfig }>;

      expect(metrics).toHaveLength(3);

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
    it('should return all three merge request metrics', async () => {
      mockedClientInstance.getOpenMergeRequestsCount.mockResolvedValue(10);
      mockedClientInstance.getOpenedMergeRequestsCount.mockResolvedValue(4);
      mockedClientInstance.getClosedMergeRequestsCount.mockResolvedValue(6);

      const result = await provider.calculateMetrics(mockEntity);

      const since7d = sevenDaysAgo(fixedNow.getTime());

      expect(result.get('gitlab.openMergeRequests')).toBe(10);
      expect(result.get('gitlab.openedMergeRequests7d')).toBe(4);
      expect(result.get('gitlab.closedMergeRequests7d')).toBe(6);

      expect(
        mockedClientInstance.getOpenMergeRequestsCount,
      ).toHaveBeenCalledWith(sourceUrl, projectSlug);
      expect(
        mockedClientInstance.getOpenedMergeRequestsCount,
      ).toHaveBeenCalledWith(sourceUrl, projectSlug, since7d);
      expect(
        mockedClientInstance.getClosedMergeRequestsCount,
      ).toHaveBeenCalledWith(sourceUrl, projectSlug, since7d);
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
      mockedClientInstance.getOpenMergeRequestsCount.mockRejectedValue(
        new Error('GitLab unavailable'),
      );

      await expect(provider.calculateMetrics(mockEntity)).rejects.toThrow(
        'GitLab unavailable',
      );
    });
  });
});
