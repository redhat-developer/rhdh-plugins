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
import { GitlabMergeRequestsProvider } from './GitlabMergeRequestsProvider';
import { GitlabClient } from '../gitlab/GitlabClient';
import { DEFAULT_NUMBER_THRESHOLDS } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

jest.mock('../gitlab/GitlabClient');

describe('GitlabMergeRequestsProvider', () => {
  let provider: GitlabMergeRequestsProvider;
  const mockedGitlabClient = GitlabClient as jest.MockedClass<
    typeof GitlabClient
  >;
  const mockedClientInstance = {
    getOpenMergeRequestsCount: jest.fn(),
    getOpenedMergeRequestsCount: jest.fn(),
    getClosedMergeRequestsCount: jest.fn(),
  } as any;
  mockedGitlabClient.mockImplementation(() => mockedClientInstance);

  const mockEntity: Entity = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'test-component',
      annotations: {
        'gitlab.com/project-slug': 'my-group/my-project',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    provider = GitlabMergeRequestsProvider.fromConfig(new ConfigReader({}));
  });

  describe('metadata', () => {
    it('should return correct provider datasource ID', () => {
      expect(provider.getProviderDatasourceId()).toBe('gitlab');
    });

    it('should return correct provider ID', () => {
      expect(provider.getProviderId()).toBe('gitlab.openMergeRequests');
    });

    it('should return catalog filter for gitlab annotation', () => {
      const filter = provider.getCatalogFilter();
      expect(
        filter['metadata.annotations.gitlab.com/project-slug'],
      ).toBeDefined();
    });

    it('should return three metrics with thresholds', () => {
      const metrics = provider.getMetrics();
      expect(metrics).toHaveLength(3);
      expect(metrics.map(m => m.id)).toEqual([
        'gitlab.openMergeRequests',
        'gitlab.openedMergeRequests7d',
        'gitlab.closedMergeRequests7d',
      ]);
      for (const metric of metrics) {
        expect(metric.thresholds).toEqual(DEFAULT_NUMBER_THRESHOLDS);
      }
    });
  });

  describe('calculateMetrics', () => {
    it('should return all three merge request metrics', async () => {
      mockedClientInstance.getOpenMergeRequestsCount.mockResolvedValue(10);
      mockedClientInstance.getOpenedMergeRequestsCount.mockResolvedValue(4);
      mockedClientInstance.getClosedMergeRequestsCount.mockResolvedValue(6);

      const result = await provider.calculateMetrics(mockEntity);

      expect(result.get('gitlab.openMergeRequests')).toBe(10);
      expect(result.get('gitlab.openedMergeRequests7d')).toBe(4);
      expect(result.get('gitlab.closedMergeRequests7d')).toBe(6);
    });
  });
});
