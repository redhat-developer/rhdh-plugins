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
import { mockServices } from '@backstage/backend-test-utils';
import {
  buildMockDoraServices,
  dbDeployment,
  dbPullRequest,
  mockEntity,
} from './__fixtures__';
import type { DoraDataService } from '../service/DoraDataService';
import type { DoraSyncService } from '../service/DoraSyncService';
import { DoraMedianLeadTimeForChangesProvider } from './DoraMedianLeadTimeForChangesProvider';
import {
  DORA_DEFAULT_DEPLOYMENT_PULL_REQUESTS_COLLECTOR_ID,
  DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
} from '../constants';
import { DEFAULT_DORA_MEDIAN_LEAD_TIME_THRESHOLDS } from './DoraConfig';

describe('DoraMedianLeadTimeForChangesProvider', () => {
  const mockLogger = mockServices.logger.mock();
  const deployments = [
    dbDeployment({
      id: '100',
      commitSha: 'sha-previous',
      environment: 'production',
      createdAt: '2026-06-06T12:00:00.000Z',
      result: 'success',
    }),
    dbDeployment({
      id: '101',
      commitSha: 'sha-current',
      environment: 'production',
      createdAt: '2026-06-08T12:00:00.000Z',
      result: 'success',
    }),
  ];
  const pullRequests = [
    dbPullRequest({
      id: '123',
      firstCommitAt: '2026-06-05T12:00:00.000Z', // 72h from sha-current createdAt
      deploymentId: '101',
    }),
    dbPullRequest({
      id: '124',
      firstCommitAt: '2026-06-07T12:00:00.000Z', // 24h from sha-current createdAt
      deploymentId: '101',
    }),
  ];

  let doraSyncService: jest.Mocked<DoraSyncService>;
  let doraDataService: jest.Mocked<DoraDataService>;
  let provider: DoraMedianLeadTimeForChangesProvider;

  beforeEach(() => {
    ({ doraSyncService, doraDataService } = buildMockDoraServices({
      deployments,
      pullRequests,
    }));
    provider = DoraMedianLeadTimeForChangesProvider.fromConfig(
      new ConfigReader({}),
      {
        doraSyncService,
        doraDataService,
        logger: mockLogger,
      },
    );
  });

  describe('fromConfig', () => {
    it('should create provider with default thresholds on metric', () => {
      const metrics = provider.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].thresholds).toEqual(
        DEFAULT_DORA_MEDIAN_LEAD_TIME_THRESHOLDS,
      );
      expect(metrics[0].defaultVisualization).toBe('sparkline');
      expect(metrics[0].unit).toBe('h');
    });
  });

  describe('calculateMetrics', () => {
    it('should sync deployments and pull requests with default collectors', async () => {
      await provider.calculateMetrics(mockEntity);

      expect(doraSyncService.syncDeployments).toHaveBeenCalledWith(
        mockEntity,
        expect.objectContaining({
          collector: expect.objectContaining({
            id: DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
            input: {},
          }),
        }),
      );
      expect(
        doraSyncService.syncPullRequestsForDeployment,
      ).toHaveBeenCalledWith(
        mockEntity,
        expect.objectContaining({
          collector: expect.objectContaining({
            id: DORA_DEFAULT_DEPLOYMENT_PULL_REQUESTS_COLLECTOR_ID,
          }),
          deploymentId: '101',
          baseCommitSha: 'sha-previous',
          headCommitSha: 'sha-current',
        }),
      );
    });

    it('should use custom collectors and pass custom inputs', async () => {
      const customDeploymentsCollectorId = 'custom:deployments';
      const customDeploymentPullRequestsCollectorId =
        'custom:deploymentPullRequests';
      const { doraSyncService: sync, doraDataService: data } =
        buildMockDoraServices({
          deployments,
          pullRequests,
        });

      const customProvider = DoraMedianLeadTimeForChangesProvider.fromConfig(
        new ConfigReader({
          scorecard: {
            metricProviders: {
              dora: {
                medianLeadTimeForChanges: {
                  options: {
                    collectors: {
                      deployments: {
                        id: customDeploymentsCollectorId,
                        input: {
                          artificialDeploymentFlag: true,
                          customDeploymentsInputLabel:
                            'deployments-custom-input',
                        },
                      },
                      deploymentPullRequests: {
                        id: customDeploymentPullRequestsCollectorId,
                        input: {
                          artificialPullRequestsLabel: 'prs-custom-input',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        }),
        {
          doraSyncService: sync,
          doraDataService: data,
          logger: mockLogger,
        },
      );

      await customProvider.calculateMetrics(mockEntity);

      expect(sync.syncDeployments).toHaveBeenCalledWith(
        mockEntity,
        expect.objectContaining({
          collector: expect.objectContaining({
            id: customDeploymentsCollectorId,
            input: expect.objectContaining({
              artificialDeploymentFlag: true,
              customDeploymentsInputLabel: 'deployments-custom-input',
            }),
          }),
        }),
      );
      expect(sync.syncPullRequestsForDeployment).toHaveBeenCalledWith(
        mockEntity,
        expect.objectContaining({
          collector: expect.objectContaining({
            id: customDeploymentPullRequestsCollectorId,
            input: expect.objectContaining({
              artificialPullRequestsLabel: 'prs-custom-input',
            }),
          }),
          deploymentId: '101',
          baseCommitSha: 'sha-previous',
          headCommitSha: 'sha-current',
        }),
      );
    });

    it('should calculate median lead time for changes', async () => {
      const results = await provider.calculateMetrics(mockEntity);

      expect(results.get('dora.medianLeadTimeForChanges')).toBe(48);
    });

    it('should calculate median with multiple pull requests across multiple deployment ranges', async () => {
      doraDataService.readDeployments.mockResolvedValueOnce([
        dbDeployment({
          id: '400',
          commitSha: 'sha-1',
          environment: 'production',
          createdAt: '2026-06-10T00:00:00.000Z',
          result: 'success',
        }),
        dbDeployment({
          id: '401',
          commitSha: 'sha-2',
          environment: 'production',
          createdAt: '2026-06-11T00:00:00.000Z',
          result: 'success',
        }),
        dbDeployment({
          id: '402',
          commitSha: 'sha-3',
          environment: 'production',
          createdAt: '2026-06-12T00:00:00.000Z',
          result: 'success',
        }),
      ]);
      doraDataService.readPullRequestsForDeployment
        .mockResolvedValueOnce([
          dbPullRequest({
            id: '501',
            firstCommitAt: '2026-06-10T18:00:00.000Z', // 6h
            deploymentId: '401',
          }),
          dbPullRequest({
            id: '502',
            firstCommitAt: '2026-06-10T12:00:00.000Z', // 12h
            deploymentId: '401',
          }),
        ])
        .mockResolvedValueOnce([
          dbPullRequest({
            id: '503',
            firstCommitAt: '2026-06-11T12:00:00.000Z', // 12h
            deploymentId: '402',
          }),
        ]);

      const results = await provider.calculateMetrics(mockEntity);

      expect(results.get('dora.medianLeadTimeForChanges')).toBe(12);
      expect(
        doraSyncService.syncPullRequestsForDeployment,
      ).toHaveBeenCalledTimes(2);
      expect(
        doraSyncService.syncPullRequestsForDeployment,
      ).toHaveBeenNthCalledWith(
        1,
        mockEntity,
        expect.objectContaining({
          deploymentId: '401',
          baseCommitSha: 'sha-1',
          headCommitSha: 'sha-2',
        }),
      );
      expect(
        doraSyncService.syncPullRequestsForDeployment,
      ).toHaveBeenNthCalledWith(
        2,
        mockEntity,
        expect.objectContaining({
          deploymentId: '402',
          baseCommitSha: 'sha-2',
          headCommitSha: 'sha-3',
        }),
      );
    });

    it('should throw when fewer than 2 successful production deployments are found', async () => {
      doraDataService.readDeployments.mockResolvedValueOnce([]);

      await expect(provider.calculateMetrics(mockEntity)).rejects.toThrow(
        /need at least 2 successful production deployments/,
      );
      expect(
        doraSyncService.syncPullRequestsForDeployment,
      ).not.toHaveBeenCalled();
    });

    it('should use configured productionEnvironments when filtering deployments', async () => {
      const { doraSyncService: sync, doraDataService: data } =
        buildMockDoraServices({
          deployments: [
            dbDeployment({
              id: '400',
              commitSha: 'sha-1',
              environment: 'production',
              createdAt: '2026-06-10T00:00:00.000Z',
              result: 'success',
            }),
            dbDeployment({
              id: '401',
              commitSha: 'sha-2',
              environment: 'prod',
              createdAt: '2026-06-11T00:00:00.000Z',
              result: 'success',
            }),
          ],
        });

      const customProvider = DoraMedianLeadTimeForChangesProvider.fromConfig(
        new ConfigReader({
          scorecard: {
            metricProviders: {
              dora: {
                medianLeadTimeForChanges: {
                  options: {
                    productionEnvironments: ['prod'],
                  },
                },
              },
            },
          },
        }),
        {
          doraSyncService: sync,
          doraDataService: data,
          logger: mockLogger,
        },
      );

      await expect(customProvider.calculateMetrics(mockEntity)).rejects.toThrow(
        /need at least 2 successful production deployments.*found 1/,
      );
    });

    it('should throw when no pull requests with measurable lead time are found', async () => {
      doraDataService.readPullRequestsForDeployment.mockResolvedValue([]);

      await expect(provider.calculateMetrics(mockEntity)).rejects.toThrow(
        /no pull requests with a measurable lead time/,
      );
    });

    it('should skip deployment intervals when pull request sync fails and warn', async () => {
      const { doraSyncService: sync, doraDataService: data } =
        buildMockDoraServices({
          deployments: [
            dbDeployment({
              id: '100',
              commitSha: 'sha-1',
              environment: 'production',
              createdAt: '2026-06-10T00:00:00.000Z',
              result: 'success',
            }),
            dbDeployment({
              id: '101',
              commitSha: 'sha-2',
              environment: 'production',
              createdAt: '2026-06-11T00:00:00.000Z',
              result: 'success',
            }),
            dbDeployment({
              id: '102',
              commitSha: 'sha-3',
              environment: 'production',
              createdAt: '2026-06-12T00:00:00.000Z',
              result: 'success',
            }),
          ],
          pullRequests: [
            dbPullRequest({
              id: '503',
              firstCommitAt: '2026-06-11T12:00:00.000Z', // 12h
              deploymentId: '102',
            }),
          ],
        });
      sync.syncPullRequestsForDeployment
        .mockRejectedValueOnce(new Error('GitHub compare failed'))
        .mockResolvedValueOnce(undefined);
      data.readPullRequestsForDeployment.mockResolvedValue([
        dbPullRequest({
          id: '503',
          firstCommitAt: '2026-06-11T12:00:00.000Z',
          deploymentId: '102',
        }),
      ]);

      const results = await DoraMedianLeadTimeForChangesProvider.fromConfig(
        new ConfigReader({}),
        {
          doraSyncService: sync,
          doraDataService: data,
          logger: mockLogger,
        },
      ).calculateMetrics(mockEntity);

      expect(results.get('dora.medianLeadTimeForChanges')).toBe(12);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Skipping deployment interval sha-1..sha-2'),
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('dora.medianLeadTimeForChanges'),
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('GitHub compare failed'),
      );
    });

    it('should skip pull requests with negative lead time and warn', async () => {
      doraDataService.readPullRequestsForDeployment.mockResolvedValue([
        dbPullRequest({
          id: '999',
          firstCommitAt: '2026-06-09T12:00:00.000Z', // after sha-current deployment
          deploymentId: '101',
        }),
        dbPullRequest({
          id: '124',
          firstCommitAt: '2026-06-07T12:00:00.000Z', // 24h lead time
          deploymentId: '101',
        }),
      ]);

      const results = await provider.calculateMetrics(mockEntity);

      expect(results.get('dora.medianLeadTimeForChanges')).toBe(24);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Skipping pull request 999'),
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('negative lead time'),
      );
    });

    it('should throw when all deployment intervals fail to sync pull requests', async () => {
      doraSyncService.syncPullRequestsForDeployment.mockRejectedValue(
        new Error('collector unavailable'),
      );

      await expect(provider.calculateMetrics(mockEntity)).rejects.toThrow(
        /no pull requests with a measurable lead time/,
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'Skipping deployment interval sha-previous..sha-current',
        ),
      );
    });
  });
});
