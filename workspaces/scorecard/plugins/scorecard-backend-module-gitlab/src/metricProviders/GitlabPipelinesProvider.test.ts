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
import {
  GitlabPipelinesProvider,
  calculateRatio,
} from './GitlabPipelinesProvider';
import { GitlabClient } from '../gitlab/GitlabClient';

jest.mock('../gitlab/GitlabClient');

describe('GitlabPipelinesProvider', () => {
  let provider: GitlabPipelinesProvider;
  const mockedGitlabClient = GitlabClient as jest.MockedClass<
    typeof GitlabClient
  >;
  const mockedClientInstance = {
    getPipelinesCount: jest.fn(),
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
    provider = GitlabPipelinesProvider.fromConfig(new ConfigReader({}));
  });

  describe('metadata', () => {
    it('should return correct provider datasource ID', () => {
      expect(provider.getProviderDatasourceId()).toBe('gitlab');
    });

    it('should return five metric IDs', () => {
      expect(provider.getMetricIds()).toEqual([
        'gitlab.started_pipelines_7d',
        'gitlab.successful_pipelines_7d',
        'gitlab.failed_pipelines_7d',
        'gitlab.pipeline_success_ratio_7d',
        'gitlab.pipeline_success_ratio_24h',
      ]);
    });

    it('should return five metrics', () => {
      const metrics = provider.getMetrics!();
      expect(metrics).toHaveLength(5);
    });
  });

  describe('calculateMetric', () => {
    it('should return started pipelines count', async () => {
      mockedClientInstance.getPipelinesCount.mockResolvedValue(50);
      const result = await provider.calculateMetric(mockEntity);
      expect(result).toBe(50);
    });
  });

  describe('calculateMetrics', () => {
    it('should return all pipeline metrics', async () => {
      mockedClientInstance.getPipelinesCount
        .mockResolvedValueOnce(100) // started 7d
        .mockResolvedValueOnce(80) // successful 7d
        .mockResolvedValueOnce(15) // failed 7d
        .mockResolvedValueOnce(20) // successful 24h
        .mockResolvedValueOnce(5); // failed 24h

      const result = await provider.calculateMetrics!(mockEntity);

      expect(result.get('gitlab.started_pipelines_7d')).toBe(100);
      expect(result.get('gitlab.successful_pipelines_7d')).toBe(80);
      expect(result.get('gitlab.failed_pipelines_7d')).toBe(15);
      expect(result.get('gitlab.pipeline_success_ratio_7d')).toBe(84);
      expect(result.get('gitlab.pipeline_success_ratio_24h')).toBe(80);
    });

    it('should return 100% ratio when no pipelines exist', async () => {
      mockedClientInstance.getPipelinesCount.mockResolvedValue(0);

      const result = await provider.calculateMetrics!(mockEntity);

      expect(result.get('gitlab.pipeline_success_ratio_7d')).toBe(100);
      expect(result.get('gitlab.pipeline_success_ratio_24h')).toBe(100);
    });
  });
});

describe('calculateRatio', () => {
  it('should return 100 when no pipelines exist', () => {
    expect(calculateRatio(0, 0)).toBe(100);
  });

  it('should calculate correct ratio', () => {
    expect(calculateRatio(80, 20)).toBe(80);
    expect(calculateRatio(9, 1)).toBe(90);
    expect(calculateRatio(0, 10)).toBe(0);
    expect(calculateRatio(10, 0)).toBe(100);
  });

  it('should round to nearest integer', () => {
    expect(calculateRatio(1, 2)).toBe(33);
    expect(calculateRatio(2, 1)).toBe(67);
  });
});
