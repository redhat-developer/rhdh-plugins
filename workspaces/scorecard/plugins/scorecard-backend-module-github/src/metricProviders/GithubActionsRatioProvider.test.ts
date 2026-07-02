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
import { GithubActionsRatioProvider } from './GithubActionsRatioProvider';
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

describe('GithubActionsRatioProvider', () => {
  const mockedGithubClient = GithubClient as jest.MockedClass<
    typeof GithubClient
  >;
  const mockedGithubClientInstance = {
    getWorkflowRuns: jest.fn(),
  } as any;
  mockedGithubClient.mockImplementation(() => mockedGithubClientInstance);

  let provider: GithubActionsRatioProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = GithubActionsRatioProvider.fromConfig(new ConfigReader({}));
  });

  it('should return ratio metric IDs only', () => {
    expect(provider.getMetricIds()).toEqual([
      'github.actions_success_ratio_7d',
      'github.actions_success_ratio_24h',
    ]);
  });

  it('should return ratio metrics only', () => {
    const metrics = provider.getMetrics!();
    expect(metrics).toHaveLength(2);
  });

  it('should use RATIO_THRESHOLDS', () => {
    const thresholds = provider.getMetricThresholds();
    expect(thresholds.rules).toEqual([
      { key: 'success', expression: '>=80' },
      { key: 'warning', expression: '50-79' },
      { key: 'error', expression: '<50' },
    ]);
  });

  it('should calculate ratio metrics', async () => {
    const now = new Date();
    const hoursAgo = (h: number) =>
      new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();

    mockedGithubClientInstance.getWorkflowRuns.mockResolvedValue([
      {
        status: 'completed',
        conclusion: 'success',
        created_at: hoursAgo(48),
      },
      {
        status: 'completed',
        conclusion: 'success',
        created_at: hoursAgo(72),
      },
      {
        status: 'completed',
        conclusion: 'failure',
        created_at: hoursAgo(96),
      },
      {
        status: 'in_progress',
        conclusion: null,
        created_at: hoursAgo(20),
      },
      {
        status: 'completed',
        conclusion: 'success',
        created_at: hoursAgo(2),
      },
      {
        status: 'completed',
        conclusion: 'failure',
        created_at: hoursAgo(5),
      },
    ]);

    const results = await provider.calculateMetrics!(mockEntity);

    // 7d ratio: 3 success / (3 success + 2 failure) = 60%
    expect(results.get('github.actions_success_ratio_7d')).toBe(60);
    // 24h ratio: 1 success / (1 success + 1 failure) = 50%
    expect(results.get('github.actions_success_ratio_24h')).toBe(50);
  });

  it('should return 100% ratio when no completed runs', async () => {
    mockedGithubClientInstance.getWorkflowRuns.mockResolvedValue([
      {
        status: 'in_progress',
        conclusion: null,
        created_at: new Date().toISOString(),
      },
    ]);

    const results = await provider.calculateMetrics!(mockEntity);

    expect(results.get('github.actions_success_ratio_7d')).toBe(100);
    expect(results.get('github.actions_success_ratio_24h')).toBe(100);
  });

  it('should handle empty workflow runs', async () => {
    mockedGithubClientInstance.getWorkflowRuns.mockResolvedValue([]);

    const results = await provider.calculateMetrics!(mockEntity);

    expect(results.get('github.actions_success_ratio_7d')).toBe(100);
    expect(results.get('github.actions_success_ratio_24h')).toBe(100);
  });

  it('should exclude cancelled runs from ratio calculation', async () => {
    mockedGithubClientInstance.getWorkflowRuns.mockResolvedValue([
      {
        status: 'completed',
        conclusion: 'cancelled',
        created_at: new Date().toISOString(),
      },
      {
        status: 'completed',
        conclusion: 'success',
        created_at: new Date().toISOString(),
      },
    ]);

    const results = await provider.calculateMetrics!(mockEntity);

    // Ratio: 1/(1+0) = 100% (cancelled excluded from ratio)
    expect(results.get('github.actions_success_ratio_7d')).toBe(100);
  });
});
