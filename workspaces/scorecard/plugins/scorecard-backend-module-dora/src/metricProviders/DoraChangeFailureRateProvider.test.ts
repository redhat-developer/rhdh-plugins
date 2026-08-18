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
import { DoraChangeFailureRateProvider } from './DoraChangeFailureRateProvider';
import {
  dbDeployment,
  dbIncident,
  mockDoraDataService,
  mockDoraSyncService,
  mockEntity,
} from './__fixtures__';
import {
  DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
  DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
} from '../constants';
import { DEFAULT_DORA_CHANGE_FAILURE_RATE_THRESHOLDS } from './DoraConfig';

describe('DoraChangeFailureRateProvider', () => {
  const mockLogger = mockServices.logger.mock();
  let provider: DoraChangeFailureRateProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDoraDataService.readDeployments.mockResolvedValue([
      dbDeployment({
        id: '100',
        commitSha: 'sha-1',
        environment: 'production',
        createdAt: '2026-06-10T00:00:00.000Z',
      }),
      dbDeployment({
        id: '101',
        commitSha: 'sha-2',
        environment: 'production',
        createdAt: '2026-06-11T00:00:00.000Z',
      }),
    ]);
    mockDoraDataService.readIncidents.mockResolvedValue([
      dbIncident({
        id: 'INC-1',
        createdAt: '2026-06-10T12:00:00.000Z',
        updatedAt: '2026-06-10T13:00:00.000Z',
        resolutionAt: '2026-06-10T13:00:00.000Z',
      }),
    ]);
    provider = DoraChangeFailureRateProvider.fromConfig(new ConfigReader({}), {
      doraSyncService: mockDoraSyncService,
      doraDataService: mockDoraDataService,
      logger: mockLogger,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
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
    });
  });

  describe('calculateMetrics', () => {
    it('should use default collectors', async () => {
      await provider.calculateMetrics(mockEntity);

      expect(mockDoraSyncService.syncDeployments).toHaveBeenCalledWith(
        mockEntity,
        expect.objectContaining({
          collector: expect.objectContaining({
            id: DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
          }),
        }),
      );
      expect(mockDoraSyncService.syncIncidents).toHaveBeenCalledWith(
        mockEntity,
        expect.objectContaining({
          collector: expect.objectContaining({
            id: DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
          }),
        }),
      );
    });

    it('should use custom collectors and pass custom inputs', async () => {
      const customDeploymentsCollectorId = 'custom:deployments';
      const customIncidentsCollectorId = 'custom:incidents';
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
          doraSyncService: mockDoraSyncService,
          doraDataService: mockDoraDataService,
          logger: mockLogger,
        },
      );

      await customProvider.calculateMetrics(mockEntity);

      expect(mockDoraSyncService.syncDeployments).toHaveBeenCalledWith(
        mockEntity,
        expect.objectContaining({
          collector: expect.objectContaining({
            id: customDeploymentsCollectorId,
            input: expect.objectContaining({
              customDeploymentsInputLabel: 'deployments-custom-input',
            }),
          }),
        }),
      );
      expect(mockDoraSyncService.syncIncidents).toHaveBeenCalledWith(
        mockEntity,
        expect.objectContaining({
          collector: expect.objectContaining({
            id: customIncidentsCollectorId,
            input: expect.objectContaining({
              customIncidentsInputLabel: 'incidents-custom-input',
            }),
          }),
        }),
      );
    });

    it('should sync and read deployments and incidents with correct params', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-06-30T12:00:00.000Z'));
      const windowTo = new Date('2026-06-30T12:00:00.000Z');
      const windowFrom = new Date('2026-05-31T12:00:00.000Z');

      await provider.calculateMetrics(mockEntity);

      expect(mockDoraSyncService.syncDeployments).toHaveBeenCalledWith(
        mockEntity,
        {
          windowFrom,
          windowTo,
          collector: expect.objectContaining({
            id: DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
          }),
        },
      );
      expect(mockDoraSyncService.syncIncidents).toHaveBeenCalledWith(
        mockEntity,
        {
          windowFrom,
          windowTo,
          collector: expect.objectContaining({
            id: DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
          }),
        },
      );
      expect(mockDoraDataService.readDeployments).toHaveBeenCalledWith(
        'component:default/test-component',
        {
          windowFrom,
          windowTo,
          collector: expect.objectContaining({
            id: DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
          }),
        },
      );
      expect(mockDoraDataService.readIncidents).toHaveBeenCalledWith(
        'component:default/test-component',
        {
          windowFrom,
          windowTo,
          collector: expect.objectContaining({
            id: DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
          }),
        },
      );
    });

    it('should calculate change failure rate using incidents between successful deployments', async () => {
      mockDoraDataService.readDeployments.mockResolvedValueOnce([
        dbDeployment({
          id: '100',
          commitSha: 'sha-1',
          environment: 'production',
          createdAt: '2026-06-10T00:00:00.000Z',
        }),
        dbDeployment({
          id: '101',
          commitSha: 'sha-2',
          environment: 'production',
          createdAt: '2026-06-11T00:00:00.000Z',
        }),
        dbDeployment({
          id: '102',
          commitSha: 'sha-3',
          environment: 'production',
          createdAt: '2026-06-12T00:00:00.000Z',
        }),
      ]);
      mockDoraDataService.readIncidents.mockResolvedValueOnce([
        dbIncident({
          id: 'INC-1',
          createdAt: '2026-06-10T06:00:00.000Z', // for deployment 100
          updatedAt: '2026-06-10T06:00:00.000Z',
          resolutionAt: null,
        }),
        dbIncident({
          id: 'INC-2',
          createdAt: '2026-06-12T05:00:00.000Z', // after last pair boundary
          updatedAt: '2026-06-12T05:00:00.000Z',
          resolutionAt: null,
        }),
      ]);

      const results = await provider.calculateMetrics(mockEntity);

      expect(results.get('dora.changeFailureRate')).toBe(50); // 1 failed pair out of 2 pairs
    });

    it('should return 0 when evaluated intervals have no incidents', async () => {
      mockDoraDataService.readIncidents.mockResolvedValueOnce([]);

      const results = await provider.calculateMetrics(mockEntity);

      expect(results.get('dora.changeFailureRate')).toBe(0);
    });

    it('should attribute an incident after last successful production deployment to the following DORA interval', async () => {
      mockDoraDataService.readDeployments.mockResolvedValueOnce([
        dbDeployment({
          id: '100',
          commitSha: 'sha-1',
          environment: 'production',
          createdAt: '2026-06-10T00:00:00.000Z',
        }),
        dbDeployment({
          id: '101',
          commitSha: 'sha-2',
          environment: 'production',
          createdAt: '2026-06-11T10:00:00.000Z',
        }),
        dbDeployment({
          id: '102',
          commitSha: 'sha-3',
          environment: 'production',
          createdAt: '2026-06-12T00:00:00.000Z',
        }),
      ]);
      mockDoraDataService.readIncidents.mockResolvedValueOnce([
        dbIncident({
          id: 'INC-1',
          // In interval [sha-1, sha-2)
          createdAt: '2026-06-11T00:00:00.000Z',
          updatedAt: '2026-06-11T00:00:00.000Z',
          resolutionAt: null,
        }),
        dbIncident({
          id: 'INC-2',
          // After last successful deployment sha-3; not counted in this run
          createdAt: '2026-06-13T00:00:00.000Z',
          updatedAt: '2026-06-13T00:00:00.000Z',
          resolutionAt: null,
        }),
      ]);

      const results = await provider.calculateMetrics(mockEntity);

      expect(results.get('dora.changeFailureRate')).toBe(50); // 1 of 2 intervals
    });

    it('should throw when fewer than 2 successful production deployments are found', async () => {
      mockDoraDataService.readDeployments.mockResolvedValueOnce([
        dbDeployment({
          id: '100',
          commitSha: 'sha-1',
          environment: 'production',
          createdAt: '2026-06-10T00:00:00.000Z',
        }),
      ]);

      await expect(provider.calculateMetrics(mockEntity)).rejects.toThrow(
        /need at least 2 successful production deployments/,
      );
    });

    it('should throw when fewer than 2 production deployments are found among mixed environments', async () => {
      mockDoraDataService.readDeployments.mockResolvedValueOnce([
        dbDeployment({
          id: '100',
          commitSha: 'sha-1',
          environment: 'production',
          createdAt: '2026-06-10T00:00:00.000Z',
        }),
        dbDeployment({
          id: '101',
          commitSha: 'sha-2',
          environment: 'development',
          createdAt: '2026-06-11T00:00:00.000Z',
        }),
      ]);

      await expect(provider.calculateMetrics(mockEntity)).rejects.toThrow(
        /need at least 2 successful production deployments.*found 1/,
      );
    });

    it('should throw when fewer than two production deployments are found', async () => {
      mockDoraDataService.readDeployments.mockResolvedValueOnce([
        dbDeployment({
          id: '100',
          commitSha: 'sha-1',
          environment: 'production',
          createdAt: '2026-06-10T00:00:00.000Z',
        }),
        dbDeployment({
          id: '101',
          commitSha: 'sha-2',
          environment: 'demo-test',
          createdAt: '2026-06-11T00:00:00.000Z',
        }),
      ]);

      await expect(provider.calculateMetrics(mockEntity)).rejects.toThrow(
        /need at least 2 successful production deployments.*found 1/,
      );
    });

    it('should throw when all adjacent successful production deployments share createdAt', async () => {
      mockDoraDataService.readDeployments.mockResolvedValueOnce([
        dbDeployment({
          id: '100',
          commitSha: 'sha-1',
          environment: 'production',
          createdAt: '2026-06-10T00:00:00.000Z',
        }),
        dbDeployment({
          id: '101',
          commitSha: 'sha-2',
          environment: 'production',
          createdAt: '2026-06-10T00:00:00.000Z',
        }),
      ]);

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
