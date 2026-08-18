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
import {
  buildMockDeploymentsCollector,
  buildMockDeploymentPullRequestsCollector,
  buildMockCollectorsService,
  mockEntity,
} from './__fixtures__';
import { DoraMedianLeadTimeForChangesProvider } from './DoraMedianLeadTimeForChangesProvider';
import {
  DORA_DEFAULT_DEPLOYMENT_PULL_REQUESTS_COLLECTOR_ID,
  DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
} from '../constants';
import { Deployment } from './schemas/deploymentSchemas';
import { PullRequest } from './schemas/pullRequestSchemas';
import { DEFAULT_DORA_MEDIAN_LEAD_TIME_THRESHOLDS } from './DoraConfig';

const mockLogger = mockServices.logger.mock();

describe('DoraMedianLeadTimeForChangesProvider', () => {
  const deployments: Deployment[] = [
    {
      id: '100',
      commitSha: 'sha-previous',
      environment: 'production',
      createdAt: '2026-06-06T12:00:00.000Z',
      result: 'success',
    },
    {
      id: '101',
      commitSha: 'sha-current',
      environment: 'production',
      createdAt: '2026-06-08T12:00:00.000Z',
      result: 'success',
    },
  ];
  const pullRequests: PullRequest[] = [
    {
      id: '123',
      firstCommitAt: '2026-06-05T12:00:00.000Z', // 72h from sha-current createdAt
    },
    {
      id: '124',
      firstCommitAt: '2026-06-07T12:00:00.000Z', // 24h from sha-current createdAt
    },
  ];

  let deploymentsCollector: ReturnType<typeof buildMockDeploymentsCollector>;
  let deploymentPullRequestsCollector: ReturnType<
    typeof buildMockDeploymentPullRequestsCollector
  >;
  let collectorsService: ReturnType<
    typeof buildMockCollectorsService
  >['collectorsService'];
  let collect: ReturnType<typeof buildMockCollectorsService>['collect'];
  let provider: DoraMedianLeadTimeForChangesProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    deploymentsCollector = buildMockDeploymentsCollector({
      deployments,
      collectorId: DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
    });
    deploymentPullRequestsCollector = buildMockDeploymentPullRequestsCollector({
      pullRequests,
      collectorId: DORA_DEFAULT_DEPLOYMENT_PULL_REQUESTS_COLLECTOR_ID,
    });
    ({ collectorsService, collect } = buildMockCollectorsService({
      collectors: [deploymentsCollector, deploymentPullRequestsCollector],
    }));
    provider = DoraMedianLeadTimeForChangesProvider.fromConfig(
      new ConfigReader({}),
      {
        collectorsService,
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
    it('should use default collectors when no config', async () => {
      await provider.calculateMetrics(mockEntity);
      expect(collect).toHaveBeenCalledWith(
        expect.objectContaining({
          collectorId: DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
          input: expect.objectContaining({
            from: expect.any(String),
            to: expect.any(String),
          }),
        }),
      );
      expect(collect).toHaveBeenCalledWith(
        expect.objectContaining({
          collectorId: DORA_DEFAULT_DEPLOYMENT_PULL_REQUESTS_COLLECTOR_ID,
          input: expect.objectContaining({
            baseCommitSha: 'sha-previous',
            headCommitSha: 'sha-current',
          }),
        }),
      );
    });

    it('should use custom collectors and pass custom inputs', async () => {
      const customDeploymentsCollectorId = 'custom:deployments';
      const customDeploymentPullRequestsCollectorId =
        'custom:deploymentPullRequests';
      const customDeploymentsCollector = buildMockDeploymentsCollector({
        deployments,
        collectorId: customDeploymentsCollectorId,
      });
      const customDeploymentPullRequestsCollector =
        buildMockDeploymentPullRequestsCollector({
          pullRequests,
          collectorId: customDeploymentPullRequestsCollectorId,
        });
      const {
        collectorsService: customCollectorsService,
        collect: customCollect,
      } = buildMockCollectorsService({
        collectors: [
          customDeploymentsCollector,
          customDeploymentPullRequestsCollector,
        ],
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
          collectorsService: customCollectorsService,
          logger: mockLogger,
        },
      );

      await customProvider.calculateMetrics(mockEntity);

      expect(customCollect).toHaveBeenCalledTimes(2);
      expect(customCollect).toHaveBeenCalledWith(
        expect.objectContaining({
          collectorId: customDeploymentsCollectorId,
          input: expect.objectContaining({
            from: expect.any(String),
            to: expect.any(String),
            artificialDeploymentFlag: true,
            customDeploymentsInputLabel: 'deployments-custom-input',
          }),
        }),
      );
      expect(customCollect).toHaveBeenCalledWith(
        expect.objectContaining({
          collectorId: customDeploymentPullRequestsCollectorId,
          input: expect.objectContaining({
            baseCommitSha: 'sha-previous',
            headCommitSha: 'sha-current',
            artificialPullRequestsLabel: 'prs-custom-input',
          }),
        }),
      );
    });

    it('should calculate median lead time for changes', async () => {
      const results = await provider.calculateMetrics(mockEntity);

      expect(results.get('dora.medianLeadTimeForChanges')).toBe(48);
    });

    it('should calculate median with multiple pull requests across multiple deployment ranges', async () => {
      jest.mocked(deploymentsCollector.collect).mockResolvedValueOnce({
        deployments: [
          {
            id: '400',
            commitSha: 'sha-1',
            environment: 'production',
            createdAt: '2026-06-10T00:00:00.000Z',
            result: 'success',
          },
          {
            id: '401',
            commitSha: 'sha-2',
            environment: 'production',
            createdAt: '2026-06-11T00:00:00.000Z',
            result: 'success',
          },
          {
            id: '402',
            commitSha: 'sha-3',
            environment: 'production',
            createdAt: '2026-06-12T00:00:00.000Z',
            result: 'success',
          },
        ],
      });
      jest
        .mocked(deploymentPullRequestsCollector.collect)
        .mockResolvedValueOnce({
          pullRequests: [
            { id: '501', firstCommitAt: '2026-06-10T18:00:00.000Z' }, // 6h from sha-2 createdAt
            { id: '502', firstCommitAt: '2026-06-10T12:00:00.000Z' }, // 12h from sha-2 createdAt
          ],
        })
        .mockResolvedValueOnce({
          pullRequests: [
            { id: '503', firstCommitAt: '2026-06-11T12:00:00.000Z' },
          ], // 12h from sha-3 createdAt
        });

      const results = await provider.calculateMetrics(mockEntity);

      expect(results.get('dora.medianLeadTimeForChanges')).toBe(12);
      expect(deploymentPullRequestsCollector.collect).toHaveBeenCalledTimes(2);
      expect(deploymentPullRequestsCollector.collect).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          input: expect.objectContaining({
            baseCommitSha: 'sha-1',
            headCommitSha: 'sha-2',
          }),
        }),
      );
      expect(deploymentPullRequestsCollector.collect).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          input: expect.objectContaining({
            baseCommitSha: 'sha-2',
            headCommitSha: 'sha-3',
          }),
        }),
      );
    });

    it('should throw when fewer than 2 successful production deployments are found', async () => {
      jest.mocked(deploymentsCollector.collect).mockResolvedValueOnce({
        deployments: [],
      });

      await expect(provider.calculateMetrics(mockEntity)).rejects.toThrow(
        /need at least 2 successful production deployments/,
      );
      expect(deploymentPullRequestsCollector.collect).not.toHaveBeenCalled();
    });

    it('should use configured productionEnvironments when filtering deployments', async () => {
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
          collectorsService,
          logger: mockLogger,
        },
      );

      jest.mocked(deploymentsCollector.collect).mockResolvedValueOnce({
        deployments: [
          {
            id: '400',
            commitSha: 'sha-1',
            environment: 'production',
            createdAt: '2026-06-10T00:00:00.000Z',
            result: 'success',
          },
          {
            id: '401',
            commitSha: 'sha-2',
            environment: 'prod',
            createdAt: '2026-06-11T00:00:00.000Z',
            result: 'success',
          },
        ],
      });

      await expect(customProvider.calculateMetrics(mockEntity)).rejects.toThrow(
        /need at least 2 successful production deployments.*found 1/,
      );
    });

    it('should skip failed deployment intervals and calculate median from the rest', async () => {
      jest.mocked(deploymentsCollector.collect).mockResolvedValueOnce({
        deployments: [
          {
            id: '400',
            commitSha: 'sha-1',
            environment: 'production',
            createdAt: '2026-06-10T00:00:00.000Z',
            result: 'success',
          },
          {
            id: '401',
            commitSha: 'sha-2',
            environment: 'production',
            createdAt: '2026-06-11T00:00:00.000Z',
            result: 'success',
          },
          {
            id: '402',
            commitSha: 'sha-3',
            environment: 'production',
            createdAt: '2026-06-12T00:00:00.000Z',
            result: 'success',
          },
        ],
      });
      jest
        .mocked(deploymentPullRequestsCollector.collect)
        .mockRejectedValueOnce(new Error('GitHub compare failed'))
        .mockResolvedValueOnce({
          pullRequests: [
            { id: '503', firstCommitAt: '2026-06-11T12:00:00.000Z' }, // 12h
          ],
        });

      const results = await provider.calculateMetrics(mockEntity);

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

    it('should throw when no pull requests with measurable lead time are found', async () => {
      jest.mocked(deploymentsCollector.collect).mockResolvedValueOnce({
        deployments,
      });
      jest.mocked(deploymentPullRequestsCollector.collect).mockResolvedValue({
        pullRequests: [],
      });

      await expect(provider.calculateMetrics(mockEntity)).rejects.toThrow(
        /no pull requests with a measurable lead time/,
      );
    });

    it('should skip pull requests with negative lead time and warn', async () => {
      jest.mocked(deploymentsCollector.collect).mockResolvedValueOnce({
        deployments,
      });
      jest.mocked(deploymentPullRequestsCollector.collect).mockResolvedValue({
        pullRequests: [
          {
            id: '999',
            firstCommitAt: '2026-06-09T12:00:00.000Z', // after sha-current deployment
          },
          {
            id: '124',
            firstCommitAt: '2026-06-07T12:00:00.000Z', // 24h lead time
          },
        ],
      });

      const results = await provider.calculateMetrics(mockEntity);

      expect(results.get('dora.medianLeadTimeForChanges')).toBe(24);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Skipping pull request 999'),
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('negative lead time'),
      );
    });

    it('should throw when all deployment intervals fail to collect pull requests', async () => {
      jest
        .mocked(deploymentPullRequestsCollector.collect)
        .mockRejectedValue(new Error('collector unavailable'));

      await expect(provider.calculateMetrics(mockEntity)).rejects.toThrow(
        /no pull requests with a measurable lead time/,
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'Skipping deployment interval sha-previous..sha-current',
        ),
      );
    });

    it('should fail when deployments are not sorted ascending by createdAt', async () => {
      const unsortedDeployments: Deployment[] = [
        {
          id: '200',
          commitSha: 'sha-later',
          environment: 'production',
          createdAt: '2026-06-08T12:00:00.000Z',
          result: 'success',
        },
        {
          id: '201',
          commitSha: 'sha-earlier',
          environment: 'production',
          createdAt: '2026-06-06T12:00:00.000Z',
          result: 'success',
        },
      ];

      jest.mocked(deploymentsCollector.collect).mockResolvedValueOnce({
        deployments: unsortedDeployments,
      });

      await expect(provider.calculateMetrics(mockEntity)).rejects.toThrow(
        'Deployments must be sorted in ascending order by createdAt',
      );
    });
  });
});
