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
import { GitlabIssuesProvider } from './GitlabIssuesProvider';

jest.mock('@backstage/catalog-model', () => ({
  ...jest.requireActual('@backstage/catalog-model'),
  getEntitySourceLocation: jest.fn().mockReturnValue({
    type: 'url',
    target: 'https://gitlab.com/my-group/my-project/-/tree/main/',
  }),
}));
jest.mock('../gitlab/GitlabClient');

describe('GitlabIssuesProvider', () => {
  let provider: GitlabIssuesProvider;
  const mockedGitlabClient = GitlabClient as jest.MockedClass<
    typeof GitlabClient
  >;
  const mockedClientInstance: jest.Mocked<
    Pick<
      GitlabClient,
      'getOpenIssuesCount' | 'getOpenedIssuesCount' | 'getClosedIssuesCount'
    >
  > = {
    getOpenIssuesCount: jest.fn(),
    getOpenedIssuesCount: jest.fn(),
    getClosedIssuesCount: jest.fn(),
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

    provider = GitlabIssuesProvider.fromConfig(
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
      expect(provider.getProviderId()).toBe('gitlab.openIssues');
    });

    it('should return catalog filter for gitlab annotation', () => {
      expect(provider.getCatalogFilter()).toEqual({
        'metadata.annotations.gitlab.com/project-slug': CATALOG_FILTER_EXISTS,
      });
    });

    it('should return three metrics with thresholds', () => {
      const metrics = provider.getMetrics();

      const expectedMetrics = {
        'gitlab.openIssues': {
          id: 'gitlab.openIssues',
          thresholds: DEFAULT_NUMBER_THRESHOLDS,
        },
        'gitlab.openedIssues7d': {
          id: 'gitlab.openedIssues7d',
          thresholds: DEFAULT_NUMBER_THRESHOLDS,
        },
        'gitlab.closedIssues7d': {
          id: 'gitlab.closedIssues7d',
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
    it('should return all three issue metrics', async () => {
      mockedClientInstance.getOpenIssuesCount.mockResolvedValue(10);
      mockedClientInstance.getOpenedIssuesCount.mockResolvedValue(5);
      mockedClientInstance.getClosedIssuesCount.mockResolvedValue(3);

      const result = await provider.calculateMetrics(mockEntity);

      const sevenDaysAgo = new Date(
        fixedNow.getTime() - 7 * 24 * 60 * 60 * 1000,
      );

      expect(result.get('gitlab.openIssues')).toBe(10);
      expect(result.get('gitlab.openedIssues7d')).toBe(5);
      expect(result.get('gitlab.closedIssues7d')).toBe(3);

      expect(mockedClientInstance.getOpenIssuesCount).toHaveBeenCalledWith(
        sourceUrl,
        projectSlug,
      );
      expect(mockedClientInstance.getOpenedIssuesCount).toHaveBeenCalledWith(
        sourceUrl,
        projectSlug,
        sevenDaysAgo,
      );
      expect(mockedClientInstance.getClosedIssuesCount).toHaveBeenCalledWith(
        sourceUrl,
        projectSlug,
        sevenDaysAgo,
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
      mockedClientInstance.getOpenIssuesCount.mockRejectedValue(
        new Error('GitLab unavailable'),
      );

      await expect(provider.calculateMetrics(mockEntity)).rejects.toThrow(
        'GitLab unavailable',
      );
    });
  });
});
