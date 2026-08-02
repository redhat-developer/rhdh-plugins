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
import { DoraDeploymentFrequencyProvider } from './DoraDeploymentFrequencyProvider';
import {
  buildMockDoraServices,
  dbDeployment,
  mockEntity,
} from './__fixtures__';
import type { DoraDataService } from '../service/DoraDataService';
import type { DoraSyncService } from '../service/DoraSyncService';
import { DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID } from '../constants';
import { DEFAULT_DORA_DEPLOYMENT_FREQUENCY_THRESHOLDS } from './DoraConfig';

describe('DoraDeploymentFrequencyProvider', () => {
  let doraSyncService: jest.Mocked<DoraSyncService>;
  let doraDataService: jest.Mocked<DoraDataService>;
  let provider: DoraDeploymentFrequencyProvider;

  beforeEach(() => {
    ({ doraSyncService, doraDataService } = buildMockDoraServices());
    provider = DoraDeploymentFrequencyProvider.fromConfig(
      new ConfigReader({}),
      {
        doraSyncService,
        doraDataService,
      },
    );
  });

  describe('fromConfig', () => {
    it('should create provider with default thresholds on metric', () => {
      const metrics = provider.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].thresholds).toEqual(
        DEFAULT_DORA_DEPLOYMENT_FREQUENCY_THRESHOLDS,
      );
      expect(metrics[0].defaultVisualization).toBe('sparkline');
      expect(metrics[0].unit).toBe('/week');
    });
  });

  describe('calculateMetrics', () => {
    it('should sync and read with default collectors when no config', async () => {
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
      expect(doraDataService.readDeployments).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          collector: expect.objectContaining({
            id: DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
          }),
        }),
      );
    });

    it('should use custom collectors and pass custom inputs', async () => {
      const customCollectorId = 'custom:deployments';
      const { doraSyncService: sync, doraDataService: data } =
        buildMockDoraServices();

      const customProvider = DoraDeploymentFrequencyProvider.fromConfig(
        new ConfigReader({
          scorecard: {
            metricProviders: {
              dora: {
                deploymentFrequency: {
                  options: {
                    collectors: {
                      deployments: {
                        id: customCollectorId,
                        input: {
                          artificialLabel: 'frequency-test',
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
        },
      );

      await customProvider.calculateMetrics(mockEntity);

      expect(sync.syncDeployments).toHaveBeenCalledWith(
        mockEntity,
        expect.objectContaining({
          collector: expect.objectContaining({
            id: customCollectorId,
            input: expect.objectContaining({
              artificialLabel: 'frequency-test',
            }),
          }),
        }),
      );
    });

    it('should calculate frequency for success result and production environment', async () => {
      doraDataService.readDeployments.mockResolvedValueOnce([
        dbDeployment({
          id: '100',
          commitSha: 'sha-1',
          environment: 'production',
          createdAt: '2026-06-01T10:00:00.000Z',
          result: 'success',
        }),
        dbDeployment({
          id: '101',
          commitSha: 'sha-2',
          environment: 'production',
          createdAt: '2026-06-02T10:00:00.000Z',
          result: 'failure',
        }),
        dbDeployment({
          id: '102',
          commitSha: 'sha-3',
          environment: 'production',
          createdAt: '2026-06-03T10:00:00.000Z',
          result: '',
        }),
        dbDeployment({
          id: '103',
          commitSha: 'sha-2',
          createdAt: '2026-06-04T10:00:00.000Z',
          result: 'success',
        }),
        dbDeployment({
          id: '104',
          commitSha: 'sha-4',
          environment: 'development',
          createdAt: '2026-06-04T11:00:00.000Z',
          result: 'success',
        }),
      ]);

      const results = await provider.calculateMetrics(mockEntity);

      expect(results.get('dora.deploymentFrequency')).toBe(0.4667); // (2 successful deployments / 30 days) * 7
    });

    it('returns 0 when no deployments are collected', async () => {
      doraDataService.readDeployments.mockResolvedValueOnce([]);

      const results = await provider.calculateMetrics(mockEntity);

      expect(results.get('dora.deploymentFrequency')).toBe(0);
    });

    it('should treat configured productionEnvironments as production', async () => {
      const { doraSyncService: sync, doraDataService: data } =
        buildMockDoraServices({
          deployments: [
            dbDeployment({
              id: '100',
              commitSha: 'sha-1',
              environment: 'prod',
              createdAt: '2026-06-01T10:00:00.000Z',
              result: 'success',
            }),
            dbDeployment({
              id: '101',
              commitSha: 'sha-2',
              environment: 'live',
              createdAt: '2026-06-02T10:00:00.000Z',
              result: 'success',
            }),
            dbDeployment({
              id: '102',
              commitSha: 'sha-3',
              environment: 'production',
              createdAt: '2026-06-03T10:00:00.000Z',
              result: 'success',
            }),
          ],
        });

      const customProvider = DoraDeploymentFrequencyProvider.fromConfig(
        new ConfigReader({
          scorecard: {
            metricProviders: {
              dora: {
                deploymentFrequency: {
                  options: {
                    productionEnvironments: ['prod', 'live'],
                  },
                },
              },
            },
          },
        }),
        {
          doraSyncService: sync,
          doraDataService: data,
        },
      );

      const results = await customProvider.calculateMetrics(mockEntity);

      // production is no longer accepted; only prod + live count
      expect(results.get('dora.deploymentFrequency')).toBe(0.4667);
    });
  });
});
