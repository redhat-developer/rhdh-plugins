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
import { DoraChangeFailureRateProvider } from './DoraChangeFailureRateProvider';
import {
  buildMockCollectorsService,
  buildMockDeploymentsCollector,
  buildMockIncidentsCollector,
  mockEntity,
} from './__fixtures__';
import {
  DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
  DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
} from '../constants';
import { DEFAULT_DORA_CHANGE_FAILURE_RATE_THRESHOLDS } from './DoraConfig';

const mockLogger = mockServices.logger.mock();

describe('DoraChangeFailureRateProvider', () => {
  let deploymentsCollector: ReturnType<typeof buildMockDeploymentsCollector>;
  let incidentsCollector: ReturnType<typeof buildMockIncidentsCollector>;
  let collectorsService: ReturnType<
    typeof buildMockCollectorsService
  >['collectorsService'];
  let collect: ReturnType<typeof buildMockCollectorsService>['collect'];
  let provider: DoraChangeFailureRateProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    deploymentsCollector = buildMockDeploymentsCollector({
      deployments: [
        {
          id: '100',
          commitSha: 'sha-1',
          environment: 'production',
          createdAt: '2026-06-10T00:00:00.000Z',
          result: 'success',
        },
        {
          id: '101',
          commitSha: 'sha-2',
          environment: 'production',
          createdAt: '2026-06-11T00:00:00.000Z',
          result: 'success',
        },
      ],
      collectorId: DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
    });
    incidentsCollector = buildMockIncidentsCollector({
      incidents: [
        {
          id: 'INC-1',
          createdAt: '2026-06-10T12:00:00.000Z',
          resolutionAt: '2026-06-10T13:00:00.000Z',
        },
      ],
      collectorId: DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
    });
    ({ collectorsService, collect } = buildMockCollectorsService({
      collectors: [deploymentsCollector, incidentsCollector],
    }));
    provider = DoraChangeFailureRateProvider.fromConfig(new ConfigReader({}), {
      collectorsService,
      logger: mockLogger,
    });
  });

  describe('fromConfig', () => {
    it('should create provider with default thresholds on metric', () => {
      const metrics = provider.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].thresholds).toEqual(
        DEFAULT_DORA_CHANGE_FAILURE_RATE_THRESHOLDS,
      );
      expect(metrics[0].defaultVisualization).toBe('sparkline');
      expect(metrics[0].unit).toBe('%');
      expect(metrics[0].collectorIds).toEqual([
        DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
        DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
      ]);
    });
  });

  describe('calculateMetrics', () => {
    it('should use default collectors when no config', async () => {
      await provider.calculateMetrics(mockEntity);

      expect(collect).toHaveBeenCalledWith(
        expect.objectContaining({
          collectorId: DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
        }),
      );
      expect(collect).toHaveBeenCalledWith(
        expect.objectContaining({
          collectorId: DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
        }),
      );
    });

    it('should use custom collectors and pass custom inputs', async () => {
      const customDeploymentsCollectorId = 'custom:deployments';
      const customIncidentsCollectorId = 'custom:incidents';
      const customDeploymentsCollector = buildMockDeploymentsCollector({
        deployments: [
          {
            id: '100',
            commitSha: 'sha-1',
            environment: 'production',
            createdAt: '2026-06-10T00:00:00.000Z',
            result: 'success',
          },
          {
            id: '101',
            commitSha: 'sha-2',
            environment: 'production',
            createdAt: '2026-06-11T00:00:00.000Z',
            result: 'success',
          },
        ],
        collectorId: customDeploymentsCollectorId,
      });
      const customIncidentsCollector = buildMockIncidentsCollector({
        incidents: [
          {
            id: 'INC-1',
            createdAt: '2026-06-10T12:00:00.000Z',
            resolutionAt: null,
          },
        ],
        collectorId: customIncidentsCollectorId,
      });
      const {
        collectorsService: customCollectorsService,
        collect: customCollect,
      } = buildMockCollectorsService({
        collectors: [customDeploymentsCollector, customIncidentsCollector],
      });
      const customProvider = DoraChangeFailureRateProvider.fromConfig(
        new ConfigReader({
          scorecard: {
            metricProviders: {
              dora: {
                changeFailureRate: {
                  options: {
                    collectors: {
                      deployments: {
                        id: customDeploymentsCollectorId,
                        input: {
                          customDeploymentsInputLabel:
                            'deployments-custom-input',
                        },
                      },
                      incidents: {
                        id: customIncidentsCollectorId,
                        input: {
                          customIncidentsInputLabel: 'incidents-custom-input',
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

      expect(customCollect).toHaveBeenCalledWith(
        expect.objectContaining({
          collectorId: customDeploymentsCollectorId,
          input: expect.objectContaining({
            from: expect.any(String),
            to: expect.any(String),
            customDeploymentsInputLabel: 'deployments-custom-input',
          }),
        }),
      );
      expect(customCollect).toHaveBeenCalledWith(
        expect.objectContaining({
          collectorId: customIncidentsCollectorId,
          input: expect.objectContaining({
            from: expect.any(String),
            to: expect.any(String),
            customIncidentsInputLabel: 'incidents-custom-input',
          }),
        }),
      );
    });

    it('should calculate change failure rate using incidents between successful deployments', async () => {
      jest.mocked(deploymentsCollector.collect).mockResolvedValueOnce({
        deployments: [
          {
            id: '100',
            commitSha: 'sha-1',
            environment: 'production',
            createdAt: '2026-06-10T00:00:00.000Z',
            result: 'success',
          },
          {
            id: '101',
            commitSha: 'sha-2',
            environment: 'production',
            createdAt: '2026-06-11T00:00:00.000Z',
            result: 'success',
          },
          {
            id: '102',
            commitSha: 'sha-3',
            environment: 'production',
            createdAt: '2026-06-12T00:00:00.000Z',
            result: 'success',
          },
        ],
      });
      jest.mocked(incidentsCollector.collect).mockResolvedValueOnce({
        incidents: [
          {
            id: 'INC-1',
            createdAt: '2026-06-10T06:00:00.000Z', // for deployment 100
            resolutionAt: null,
          },
          {
            id: 'INC-2',
            createdAt: '2026-06-12T05:00:00.000Z', // after last pair boundary
            resolutionAt: null,
          },
        ],
      });

      const results = await provider.calculateMetrics(mockEntity);

      expect(results.get('dora.changeFailureRate')).toBe(50); // 1 failed pair out of 2 pairs
    });

    it('should throw when fewer than 2 successful production deployments are found', async () => {
      jest.mocked(deploymentsCollector.collect).mockResolvedValueOnce({
        deployments: [],
      });

      await expect(provider.calculateMetrics(mockEntity)).rejects.toThrow(
        /need at least 2 successful production deployments/,
      );
      expect(incidentsCollector.collect).not.toHaveBeenCalled();
    });

    it('should throw when fewer than 2 successful deployments are found', async () => {
      jest.mocked(deploymentsCollector.collect).mockResolvedValueOnce({
        deployments: [
          {
            id: '100',
            commitSha: 'sha-1',
            environment: 'production',
            createdAt: '2026-06-10T00:00:00.000Z',
            result: 'success',
          },
          {
            id: '101',
            commitSha: 'sha-2',
            environment: 'production',
            createdAt: '2026-06-11T00:00:00.000Z',
            result: 'failure',
          },
        ],
      });

      await expect(provider.calculateMetrics(mockEntity)).rejects.toThrow(
        /need at least 2 successful production deployments.*found 1/,
      );
    });

    it('should throw when fewer than two production deployments are found', async () => {
      jest.mocked(deploymentsCollector.collect).mockResolvedValueOnce({
        deployments: [
          {
            id: '100',
            commitSha: 'sha-1',
            environment: 'production',
            createdAt: '2026-06-10T00:00:00.000Z',
            result: 'success',
          },
          {
            id: '101',
            commitSha: 'sha-2',
            environment: 'demo-test',
            createdAt: '2026-06-11T00:00:00.000Z',
            result: 'success',
          },
        ],
      });

      await expect(provider.calculateMetrics(mockEntity)).rejects.toThrow(
        /need at least 2 successful production deployments.*found 1/,
      );
    });

    it('should use configured productionEnvironments when filtering deployments', async () => {
      const customProvider = DoraChangeFailureRateProvider.fromConfig(
        new ConfigReader({
          scorecard: {
            metricProviders: {
              dora: {
                changeFailureRate: {
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

    it('should return 0 when evaluated intervals have no incidents', async () => {
      jest.mocked(incidentsCollector.collect).mockResolvedValueOnce({
        incidents: [],
      });

      const results = await provider.calculateMetrics(mockEntity);

      expect(results.get('dora.changeFailureRate')).toBe(0);
    });

    it('should attribute an incident after last successful production deployment to the following DORA interval', async () => {
      jest.mocked(deploymentsCollector.collect).mockResolvedValueOnce({
        deployments: [
          {
            id: '100',
            commitSha: 'sha-1',
            environment: 'production',
            createdAt: '2026-06-10T00:00:00.000Z',
            result: 'success',
          },
          {
            id: '101',
            commitSha: 'sha-2',
            environment: 'production',
            createdAt: '2026-06-11T10:00:00.000Z',
            result: 'success',
          },
          {
            id: '102',
            commitSha: 'sha-3',
            environment: 'production',
            createdAt: '2026-06-12T00:00:00.000Z',
            result: 'success',
          },
        ],
      });
      jest.mocked(incidentsCollector.collect).mockResolvedValueOnce({
        incidents: [
          {
            id: 'INC-1',
            // Belongs to [sha-2, sha-3]
            createdAt: '2026-06-11T00:00:00.000Z',
            resolutionAt: null,
          },
          {
            id: 'INC-2',
            // After last successful deployment sha-3, not counted
            createdAt: '2026-06-13T00:00:00.000Z',
            resolutionAt: null,
          },
        ],
      });

      const results = await provider.calculateMetrics(mockEntity);

      expect(results.get('dora.changeFailureRate')).toBe(50); // 1 of 2 intervals
    });

    it('should throw when all adjacent successful production deployments share createdAt', async () => {
      jest.mocked(deploymentsCollector.collect).mockResolvedValueOnce({
        deployments: [
          {
            id: '100',
            commitSha: 'sha-1',
            environment: 'production',
            createdAt: '2026-06-10T00:00:00.000Z',
            result: 'success',
          },
          {
            id: '101',
            commitSha: 'sha-2',
            environment: 'production',
            createdAt: '2026-06-10T00:00:00.000Z',
            result: 'success',
          },
        ],
      });

      await expect(provider.calculateMetrics(mockEntity)).rejects.toThrow(
        /no evaluable deployment intervals/,
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Skipping deployment interval 100..101'),
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('non-increasing createdAt'),
      );
    });
  });
});
