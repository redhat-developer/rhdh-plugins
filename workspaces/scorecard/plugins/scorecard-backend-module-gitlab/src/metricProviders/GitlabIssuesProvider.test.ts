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
import { GitlabIssuesProvider } from './GitlabIssuesProvider';
import { GitlabClient } from '../gitlab/GitlabClient';
import { DEFAULT_NUMBER_THRESHOLDS } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

jest.mock('../gitlab/GitlabClient');

describe('GitlabIssuesProvider', () => {
  let provider: GitlabIssuesProvider;
  const mockedGitlabClient = GitlabClient as jest.MockedClass<
    typeof GitlabClient
  >;
  const mockedClientInstance = {
    getOpenIssuesCount: jest.fn(),
    getOpenedIssuesCount: jest.fn(),
    getClosedIssuesCount: jest.fn(),
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
    provider = GitlabIssuesProvider.fromConfig(new ConfigReader({}));
  });

  describe('metadata', () => {
    it('should return correct provider datasource ID', () => {
      expect(provider.getProviderDatasourceId()).toBe('gitlab');
    });

    it('should return correct provider ID', () => {
      expect(provider.getProviderId()).toBe('gitlab.open_issues');
    });

    it('should return number metric type', () => {
      expect(provider.getMetricType()).toBe('number');
    });

    it('should return default number thresholds', () => {
      expect(provider.getMetricThresholds()).toEqual(DEFAULT_NUMBER_THRESHOLDS);
    });

    it('should return catalog filter for gitlab annotation', () => {
      const filter = provider.getCatalogFilter();
      expect(
        filter['metadata.annotations.gitlab.com/project-slug'],
      ).toBeDefined();
    });

    it('should return three metric IDs', () => {
      expect(provider.getMetricIds()).toEqual([
        'gitlab.open_issues',
        'gitlab.opened_issues_7d',
        'gitlab.closed_issues_7d',
      ]);
    });

    it('should return three metrics', () => {
      const metrics = provider.getMetrics!();
      expect(metrics).toHaveLength(3);
      expect(metrics.map(m => m.id)).toEqual([
        'gitlab.open_issues',
        'gitlab.opened_issues_7d',
        'gitlab.closed_issues_7d',
      ]);
    });
  });

  describe('calculateMetric', () => {
    it('should return open issues count', async () => {
      mockedClientInstance.getOpenIssuesCount.mockResolvedValue(42);
      const result = await provider.calculateMetric(mockEntity);
      expect(result).toBe(42);
      expect(mockedClientInstance.getOpenIssuesCount).toHaveBeenCalledWith(
        'my-group/my-project',
      );
    });
  });

  describe('calculateMetrics', () => {
    it('should return all three issue metrics', async () => {
      mockedClientInstance.getOpenIssuesCount.mockResolvedValue(10);
      mockedClientInstance.getOpenedIssuesCount.mockResolvedValue(5);
      mockedClientInstance.getClosedIssuesCount.mockResolvedValue(3);

      const result = await provider.calculateMetrics!(mockEntity);

      expect(result.get('gitlab.open_issues')).toBe(10);
      expect(result.get('gitlab.opened_issues_7d')).toBe(5);
      expect(result.get('gitlab.closed_issues_7d')).toBe(3);
    });
  });
});
