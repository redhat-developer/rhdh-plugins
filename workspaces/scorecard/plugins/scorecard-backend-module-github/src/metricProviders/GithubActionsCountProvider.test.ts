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
import { GithubActionsCountProvider } from './GithubActionsCountProvider';
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

describe('GithubActionsCountProvider', () => {
  const mockedGithubClient = GithubClient as jest.MockedClass<
    typeof GithubClient
  >;
  const mockedGithubClientInstance = {
    getWorkflowRuns: jest.fn(),
  } as any;
  mockedGithubClient.mockImplementation(() => mockedGithubClientInstance);

  let provider: GithubActionsCountProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = GithubActionsCountProvider.fromConfig(new ConfigReader({}));
  });

  it('should return count metric IDs only', () => {
    expect(provider.getMetricIds()).toEqual([
      'github.actions_started_7d',
      'github.actions_successful_7d',
      'github.actions_failed_7d',
    ]);
  });

  it('should return count metrics only', () => {
    const metrics = provider.getMetrics!();
    expect(metrics).toHaveLength(3);
  });

  it('should use COUNT_THRESHOLDS', () => {
    const thresholds = provider.getMetricThresholds();
    expect(thresholds.rules).toEqual([
      { key: 'success', expression: '<10' },
      { key: 'warning', expression: '10-50' },
      { key: 'error', expression: '>50' },
    ]);
  });

  it('should calculate count metrics', async () => {
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
    ]);

    const results = await provider.calculateMetrics!(mockEntity);

    expect(results.get('github.actions_started_7d')).toBe(4);
    expect(results.get('github.actions_successful_7d')).toBe(2);
    expect(results.get('github.actions_failed_7d')).toBe(1);
  });

  it('should handle empty workflow runs', async () => {
    mockedGithubClientInstance.getWorkflowRuns.mockResolvedValue([]);

    const results = await provider.calculateMetrics!(mockEntity);

    expect(results.get('github.actions_started_7d')).toBe(0);
    expect(results.get('github.actions_successful_7d')).toBe(0);
    expect(results.get('github.actions_failed_7d')).toBe(0);
  });

  it('should exclude non-terminal runs from success/failure counts', async () => {
    mockedGithubClientInstance.getWorkflowRuns.mockResolvedValue([
      {
        status: 'queued',
        conclusion: null,
        created_at: new Date().toISOString(),
      },
      {
        status: 'in_progress',
        conclusion: null,
        created_at: new Date().toISOString(),
      },
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

    expect(results.get('github.actions_started_7d')).toBe(4);
    expect(results.get('github.actions_successful_7d')).toBe(1);
    expect(results.get('github.actions_failed_7d')).toBe(0);
  });
});
