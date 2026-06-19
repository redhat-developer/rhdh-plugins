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
import { GithubPRLifecycleProvider } from './GithubPRLifecycleProvider';
import { GithubClient } from '../github/GithubClient';

jest.mock('@backstage/catalog-model', () => ({
  ...jest.requireActual('@backstage/catalog-model'),
  getEntitySourceLocation: jest.fn().mockReturnValue({
    type: 'url',
    target: 'https://github.com/org/orgRepo/tree/main/',
  }),
}));
jest.mock('../github/GithubClient');

const mockEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'test-component',
    annotations: {
      'github.com/project-slug': 'org/orgRepo',
    },
  },
};

describe('GithubPRLifecycleProvider', () => {
  const mockedGithubClient = GithubClient as jest.MockedClass<
    typeof GithubClient
  >;
  const mockedGithubClientInstance = {
    getPullRequestsWithReviews: jest.fn(),
  } as any;
  mockedGithubClient.mockImplementation(() => mockedGithubClientInstance);

  let provider: GithubPRLifecycleProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = GithubPRLifecycleProvider.fromConfig(new ConfigReader({}));
  });

  it('should return all metric IDs', () => {
    expect(provider.getMetricIds()).toEqual([
      'github.time_to_review',
      'github.time_to_approve',
      'github.time_to_merge',
    ]);
  });

  it('should return all metrics', () => {
    const metrics = provider.getMetrics!();
    expect(metrics).toHaveLength(3);
    expect(metrics.map(m => m.id)).toEqual([
      'github.time_to_review',
      'github.time_to_approve',
      'github.time_to_merge',
    ]);
  });

  it('should calculate all lifecycle metrics', async () => {
    const baseTime = new Date('2024-01-15T10:00:00Z').getTime();
    mockedGithubClientInstance.getPullRequestsWithReviews.mockResolvedValue([
      {
        createdAt: new Date(baseTime).toISOString(),
        mergedAt: new Date(baseTime + 48 * 60 * 60 * 1000).toISOString(),
        reviews: {
          nodes: [
            {
              createdAt: new Date(baseTime + 12 * 60 * 60 * 1000).toISOString(),
              state: 'COMMENTED',
            },
            {
              createdAt: new Date(baseTime + 24 * 60 * 60 * 1000).toISOString(),
              state: 'APPROVED',
            },
          ],
        },
      },
      {
        createdAt: new Date(baseTime).toISOString(),
        mergedAt: new Date(baseTime + 72 * 60 * 60 * 1000).toISOString(),
        reviews: {
          nodes: [
            {
              createdAt: new Date(baseTime + 24 * 60 * 60 * 1000).toISOString(),
              state: 'APPROVED',
            },
          ],
        },
      },
    ]);

    const results = await provider.calculateMetrics!(mockEntity);

    // Time to review: avg of 12h and 24h = 18h
    expect(results.get('github.time_to_review')).toBe(18);
    // Time to approve: avg of 24h and 24h = 24h
    expect(results.get('github.time_to_approve')).toBe(24);
    // Time to merge: avg of 48h and 72h = 60h
    expect(results.get('github.time_to_merge')).toBe(60);
  });

  it('should return 0 when no PRs have reviews', async () => {
    mockedGithubClientInstance.getPullRequestsWithReviews.mockResolvedValue([
      {
        createdAt: '2024-01-15T10:00:00Z',
        mergedAt: null,
        reviews: { nodes: [] },
      },
    ]);

    const results = await provider.calculateMetrics!(mockEntity);

    expect(results.get('github.time_to_review')).toBe(0);
    expect(results.get('github.time_to_approve')).toBe(0);
  });

  it('should skip unmerged PRs for time to merge', async () => {
    mockedGithubClientInstance.getPullRequestsWithReviews.mockResolvedValue([
      {
        createdAt: '2024-01-15T10:00:00Z',
        mergedAt: null,
        reviews: {
          nodes: [{ createdAt: '2024-01-15T22:00:00Z', state: 'APPROVED' }],
        },
      },
    ]);

    const results = await provider.calculateMetrics!(mockEntity);

    expect(results.get('github.time_to_merge')).toBe(0);
  });

  it('should return 0 for empty results', async () => {
    mockedGithubClientInstance.getPullRequestsWithReviews.mockResolvedValue([]);

    const results = await provider.calculateMetrics!(mockEntity);

    expect(results.get('github.time_to_review')).toBe(0);
    expect(results.get('github.time_to_approve')).toBe(0);
    expect(results.get('github.time_to_merge')).toBe(0);
  });
});
