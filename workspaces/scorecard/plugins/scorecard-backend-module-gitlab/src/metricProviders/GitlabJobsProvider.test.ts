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
import { GitlabJobsProvider } from './GitlabJobsProvider';
import { GitlabClient } from '../gitlab/GitlabClient';

jest.mock('../gitlab/GitlabClient');

describe('GitlabJobsProvider', () => {
  let provider: GitlabJobsProvider;
  const mockedGitlabClient = GitlabClient as jest.MockedClass<
    typeof GitlabClient
  >;
  const mockedClientInstance = {
    getJobsCount: jest.fn(),
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
    provider = GitlabJobsProvider.fromConfig(new ConfigReader({}));
  });

  describe('metadata', () => {
    it('should return correct provider datasource ID', () => {
      expect(provider.getProviderDatasourceId()).toBe('gitlab');
    });

    it('should return five metric IDs', () => {
      expect(provider.getMetricIds()).toEqual([
        'gitlab.started_jobs_7d',
        'gitlab.successful_jobs_7d',
        'gitlab.failed_jobs_7d',
        'gitlab.job_success_ratio_7d',
        'gitlab.job_success_ratio_24h',
      ]);
    });

    it('should return five metrics', () => {
      const metrics = provider.getMetrics!();
      expect(metrics).toHaveLength(5);
    });
  });

  describe('calculateMetric', () => {
    it('should return started jobs count', async () => {
      mockedClientInstance.getJobsCount.mockResolvedValue(200);
      const result = await provider.calculateMetric(mockEntity);
      expect(result).toBe(200);
    });
  });

  describe('calculateMetrics', () => {
    it('should return all job metrics', async () => {
      mockedClientInstance.getJobsCount
        .mockResolvedValueOnce(300) // started 7d
        .mockResolvedValueOnce(250) // successful 7d
        .mockResolvedValueOnce(30) // failed 7d
        .mockResolvedValueOnce(50) // successful 24h
        .mockResolvedValueOnce(10); // failed 24h

      const result = await provider.calculateMetrics!(mockEntity);

      expect(result.get('gitlab.started_jobs_7d')).toBe(300);
      expect(result.get('gitlab.successful_jobs_7d')).toBe(250);
      expect(result.get('gitlab.failed_jobs_7d')).toBe(30);
      expect(result.get('gitlab.job_success_ratio_7d')).toBe(89);
      expect(result.get('gitlab.job_success_ratio_24h')).toBe(83);
    });

    it('should return 100% ratio when no jobs exist', async () => {
      mockedClientInstance.getJobsCount.mockResolvedValue(0);

      const result = await provider.calculateMetrics!(mockEntity);

      expect(result.get('gitlab.job_success_ratio_7d')).toBe(100);
      expect(result.get('gitlab.job_success_ratio_24h')).toBe(100);
    });
  });
});
