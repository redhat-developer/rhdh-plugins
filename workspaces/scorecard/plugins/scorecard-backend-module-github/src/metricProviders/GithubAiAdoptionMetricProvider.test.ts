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
import { ConfigReader } from '@backstage/config';
import type { Entity } from '@backstage/catalog-model';
import {
  GithubAiAdoptionMetricProvider,
  AI_ADOPTION_RATE_THRESHOLD,
  AI_ADOPTION_RATE_TIME_RANGES,
} from './GithubAiAdoptionMetricProvider';
import { GithubClient } from '../github/GithubClient';

jest.mock('@backstage/catalog-model', () => ({
  ...jest.requireActual('@backstage/catalog-model'),
  getEntitySourceLocation: jest.fn().mockReturnValue({
    type: 'url',
    target: 'https://github.com/org/orgRepo/tree/main/',
  }),
}));
jest.mock('../github/GithubClient');

describe('GithubAiAdoptionMetricProvider', () => {
  const mockedLogger = mockServices.logger.mock();

  describe('getMetrics', () => {
    it('should return 3 metrics for each time range', () => {
      const provider = GithubAiAdoptionMetricProvider.fromConfig(
        new ConfigReader({}),
        { logger: mockedLogger },
      );
      const metrics = provider.getMetrics();
      expect(metrics).toHaveLength(3);
      expect(metrics.map(m => m.id)).toEqual([
        'github.aiAdoptionRate[7d]',
        'github.aiAdoptionRate[30d]',
        'github.aiAdoptionRate[90d]',
      ]);
    });

    it('should use AI_ADOPTION_RATE_THRESHOLD for all metrics', () => {
      const provider = GithubAiAdoptionMetricProvider.fromConfig(
        new ConfigReader({}),
        { logger: mockedLogger },
      );
      const metrics = provider.getMetrics();
      for (const metric of metrics) {
        expect(metric.thresholds).toEqual(AI_ADOPTION_RATE_THRESHOLD);
      }
    });

    it('should set type to number for all metrics', () => {
      const provider = GithubAiAdoptionMetricProvider.fromConfig(
        new ConfigReader({}),
        { logger: mockedLogger },
      );
      const metrics = provider.getMetrics();
      for (const metric of metrics) {
        expect(metric.type).toBe('number');
      }
    });
  });

  describe('provider identity', () => {
    it('should return github as datasource id', () => {
      const provider = GithubAiAdoptionMetricProvider.fromConfig(
        new ConfigReader({}),
        { logger: mockedLogger },
      );
      expect(provider.getProviderDatasourceId()).toBe('github');
    });

    it('should return github.aiAdoption as provider id', () => {
      const provider = GithubAiAdoptionMetricProvider.fromConfig(
        new ConfigReader({}),
        { logger: mockedLogger },
      );
      expect(provider.getProviderId()).toBe('github.aiAdoption');
    });

    it('should filter entities with github project-slug annotation', () => {
      const provider = GithubAiAdoptionMetricProvider.fromConfig(
        new ConfigReader({}),
        { logger: mockedLogger },
      );
      const filter = provider.getCatalogFilter();
      expect('metadata.annotations.github.com/project-slug' in filter).toBe(
        true,
      );
    });
  });

  describe('constants', () => {
    it('should define 3 time ranges', () => {
      expect(AI_ADOPTION_RATE_TIME_RANGES).toEqual(['7d', '30d', '90d']);
    });

    it('should define threshold with success >= 0.2, warning >= 0.1, error >= 0', () => {
      expect(AI_ADOPTION_RATE_THRESHOLD).toEqual({
        rules: [
          { key: 'success', expression: '>=0.2' },
          { key: 'warning', expression: '>=0.1' },
          { key: 'error', expression: '>=0' },
        ],
      });
    });
  });

  describe('calculateMetrics', () => {
    let provider: GithubAiAdoptionMetricProvider;
    const mockedGithubClient = GithubClient as jest.MockedClass<
      typeof GithubClient
    >;
    const mockedGithubClientInstance = {
      getCommitHistory: jest.fn(),
    } as any;
    mockedGithubClient.mockImplementation(() => mockedGithubClientInstance);

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

    beforeEach(() => {
      jest.clearAllMocks();
      provider = GithubAiAdoptionMetricProvider.fromConfig(
        new ConfigReader({}),
        { logger: mockedLogger },
      );
    });

    it('should return 0 for all ranges when no commits', async () => {
      mockedGithubClientInstance.getCommitHistory.mockResolvedValue([]);

      const results = await provider.calculateMetrics(mockEntity);

      expect(results.get('github.aiAdoptionRate[7d]')).toBe(0);
      expect(results.get('github.aiAdoptionRate[30d]')).toBe(0);
      expect(results.get('github.aiAdoptionRate[90d]')).toBe(0);
    });

    it('should detect Co-Authored-By with Claude as AI-assisted', async () => {
      const now = new Date();
      mockedGithubClientInstance.getCommitHistory.mockResolvedValue([
        {
          message:
            'feat: add feature\n\nCo-Authored-By: Claude <noreply@anthropic.com>',
          committedDate: now.toISOString(),
        },
        {
          message: 'fix: regular commit',
          committedDate: now.toISOString(),
        },
      ]);

      const results = await provider.calculateMetrics(mockEntity);

      expect(results.get('github.aiAdoptionRate[7d]')).toBe(0.5);
      expect(results.get('github.aiAdoptionRate[30d]')).toBe(0.5);
      expect(results.get('github.aiAdoptionRate[90d]')).toBe(0.5);
    });

    it('should detect Co-authored-by (lowercase) as AI-assisted', async () => {
      const now = new Date();
      mockedGithubClientInstance.getCommitHistory.mockResolvedValue([
        {
          message:
            'feat: add feature\n\nCo-authored-by: Copilot <noreply@github.com>',
          committedDate: now.toISOString(),
        },
      ]);

      const results = await provider.calculateMetrics(mockEntity);

      expect(results.get('github.aiAdoptionRate[7d]')).toBe(1);
    });

    it('should detect Assisted-by trailer as AI-assisted', async () => {
      const now = new Date();
      mockedGithubClientInstance.getCommitHistory.mockResolvedValue([
        {
          message: 'feat: refactor\n\nAssisted-by: Cursor',
          committedDate: now.toISOString(),
        },
        {
          message: 'fix: manual fix',
          committedDate: now.toISOString(),
        },
      ]);

      const results = await provider.calculateMetrics(mockEntity);

      expect(results.get('github.aiAdoptionRate[7d]')).toBe(0.5);
    });

    it('should ignore merge commits', async () => {
      const now = new Date();
      mockedGithubClientInstance.getCommitHistory.mockResolvedValue([
        {
          message: 'Merge pull request #42 from org/feature',
          committedDate: now.toISOString(),
        },
        {
          message: "Merge branch 'main' into feature",
          committedDate: now.toISOString(),
        },
        {
          message:
            'feat: add feature\n\nCo-Authored-By: Claude <noreply@anthropic.com>',
          committedDate: now.toISOString(),
        },
        {
          message: 'fix: something',
          committedDate: now.toISOString(),
        },
      ]);

      const results = await provider.calculateMetrics(mockEntity);

      // 2 merge commits ignored, 1 AI-assisted, 1 not = 0.5
      expect(results.get('github.aiAdoptionRate[7d]')).toBe(0.5);
    });

    it('should return 1.0 when all non-merge commits are AI-assisted', async () => {
      const now = new Date();
      mockedGithubClientInstance.getCommitHistory.mockResolvedValue([
        {
          message:
            'feat: new thing\n\nCo-Authored-By: Claude <noreply@anthropic.com>',
          committedDate: now.toISOString(),
        },
        {
          message: 'fix: another\n\nAssisted-by: Cursor',
          committedDate: now.toISOString(),
        },
      ]);

      const results = await provider.calculateMetrics(mockEntity);

      expect(results.get('github.aiAdoptionRate[7d]')).toBe(1);
    });

    it('should calculate different ratios for different time ranges', async () => {
      const now = new Date();
      const threeDaysAgo = new Date(now);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const fifteenDaysAgo = new Date(now);
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
      const sixtyDaysAgo = new Date(now);
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      mockedGithubClientInstance.getCommitHistory.mockResolvedValue([
        // Within 7d: 1 AI, 1 not = 0.5
        {
          message:
            'feat: recent\n\nCo-Authored-By: Claude <noreply@anthropic.com>',
          committedDate: threeDaysAgo.toISOString(),
        },
        {
          message: 'fix: recent manual',
          committedDate: threeDaysAgo.toISOString(),
        },
        // Within 30d (but not 7d): 0 AI, 1 not
        {
          message: 'chore: older manual commit',
          committedDate: fifteenDaysAgo.toISOString(),
        },
        // Within 90d (but not 30d): 1 AI, 0 not
        {
          message: 'feat: old ai\n\nAssisted-by: Cursor',
          committedDate: sixtyDaysAgo.toISOString(),
        },
      ]);

      const results = await provider.calculateMetrics(mockEntity);

      // 7d: 1 AI / 2 total = 0.5
      expect(results.get('github.aiAdoptionRate[7d]')).toBe(0.5);
      // 30d: 1 AI / 3 total = 0.333...
      expect(results.get('github.aiAdoptionRate[30d]')).toBeCloseTo(1 / 3, 10);
      // 90d: 2 AI / 4 total = 0.5
      expect(results.get('github.aiAdoptionRate[90d]')).toBe(0.5);
    });

    it('should not count Co-authored-by with non-AI authors', async () => {
      const now = new Date();
      mockedGithubClientInstance.getCommitHistory.mockResolvedValue([
        {
          message:
            'feat: pair programming\n\nCo-authored-by: John Doe <john@example.com>',
          committedDate: now.toISOString(),
        },
      ]);

      const results = await provider.calculateMetrics(mockEntity);

      expect(results.get('github.aiAdoptionRate[7d]')).toBe(0);
    });

    it('should detect various AI tools case-insensitively', async () => {
      const now = new Date();
      mockedGithubClientInstance.getCommitHistory.mockResolvedValue([
        {
          message:
            'feat: one\n\nCo-authored-by: CLAUDE <noreply@anthropic.com>',
          committedDate: now.toISOString(),
        },
        {
          message: 'feat: two\n\nAssisted-by: GitHub Copilot',
          committedDate: now.toISOString(),
        },
        {
          message: 'feat: three\n\nAssisted-by: codeium',
          committedDate: now.toISOString(),
        },
        {
          message: 'feat: four\n\nAssisted-by: Tabnine',
          committedDate: now.toISOString(),
        },
        {
          message: 'feat: five\n\nAssisted-by: Amazon Q Developer',
          committedDate: now.toISOString(),
        },
      ]);

      const results = await provider.calculateMetrics(mockEntity);

      expect(results.get('github.aiAdoptionRate[7d]')).toBe(1);
    });

    it('should log analysis summary', async () => {
      const now = new Date();
      mockedGithubClientInstance.getCommitHistory.mockResolvedValue([
        {
          message: 'feat: ai\n\nCo-Authored-By: Claude <noreply@anthropic.com>',
          committedDate: now.toISOString(),
        },
        {
          message: 'fix: manual',
          committedDate: now.toISOString(),
        },
        {
          message: 'Merge pull request #1 from org/feat',
          committedDate: now.toISOString(),
        },
      ]);

      await provider.calculateMetrics(mockEntity);

      expect(mockedLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('AI adoption [7d]'),
      );
      expect(mockedLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('3 commits analyzed'),
      );
      expect(mockedLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('1 merge commits ignored'),
      );
      expect(mockedLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('1 AI-assisted'),
      );
      expect(mockedLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('1 not AI-assisted'),
      );
    });
  });
});
