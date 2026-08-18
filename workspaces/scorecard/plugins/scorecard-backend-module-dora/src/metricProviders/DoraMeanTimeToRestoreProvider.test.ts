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
import { DoraMeanTimeToRestoreProvider } from './DoraMeanTimeToRestoreProvider';
import {
  dbIncident,
  mockDoraDataService,
  mockDoraSyncService,
  mockEntity,
} from './__fixtures__';
import { DORA_DEFAULT_INCIDENTS_COLLECTOR_ID } from '../constants';
import { DEFAULT_DORA_MEAN_TIME_TO_RESTORE_THRESHOLDS } from './DoraConfig';

describe('DoraMeanTimeToRestoreProvider', () => {
  const mockLogger = mockServices.logger.mock();
  let provider: DoraMeanTimeToRestoreProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDoraDataService.readIncidents.mockResolvedValue([
      dbIncident({
        id: 'INC-1',
        createdAt: '2026-06-10T10:00:00.000Z',
        updatedAt: '2026-06-10T12:00:00.000Z',
        resolutionAt: '2026-06-10T12:00:00.000Z',
      }),
    ]);
    provider = DoraMeanTimeToRestoreProvider.fromConfig(new ConfigReader({}), {
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
        DEFAULT_DORA_MEAN_TIME_TO_RESTORE_THRESHOLDS,
      );
      expect(metrics[0].defaultVisualization).toBe('sparkline');
      expect(metrics[0].unit).toBe('h');
    });
  });

  describe('calculateMetrics', () => {
    it('should use default collectors', async () => {
      await provider.calculateMetrics(mockEntity);

      expect(mockDoraSyncService.syncIncidents).toHaveBeenCalledWith(
        mockEntity,
        expect.objectContaining({
          collector: expect.objectContaining({
            id: DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
            input: {},
          }),
        }),
      );
      expect(mockDoraDataService.readIncidents).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          collector: expect.objectContaining({
            id: DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
          }),
        }),
      );
    });

    it('should use custom collector and pass custom inputs', async () => {
      const customIncidentsCollectorId = 'custom:incidents';
      mockDoraDataService.readIncidents.mockResolvedValue([
        dbIncident({
          id: 'INC-2',
          createdAt: '2026-06-10T10:00:00.000Z',
          updatedAt: '2026-06-10T12:00:00.000Z',
          resolutionAt: '2026-06-10T12:00:00.000Z',
        }),
      ]);
      const customProvider = DoraMeanTimeToRestoreProvider.fromConfig(
        new ConfigReader({
          scorecard: {
            metricProviders: {
              dora: {
                meanTimeToRestore: {
                  options: {
                    collectors: {
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

    it('should sync and read incidents with correct params', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-06-30T12:00:00.000Z'));
      const windowTo = new Date('2026-06-30T12:00:00.000Z');
      const windowFrom = new Date('2026-05-31T12:00:00.000Z');

      await provider.calculateMetrics(mockEntity);

      expect(mockDoraSyncService.syncIncidents).toHaveBeenCalledWith(
        mockEntity,
        {
          windowFrom,
          windowTo,
          collector: expect.objectContaining({
            id: DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
            input: {},
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

    it('should calculate mean time to restore in hours', async () => {
      mockDoraDataService.readIncidents.mockResolvedValueOnce([
        dbIncident({
          id: 'INC-1',
          createdAt: '2026-06-10T10:00:00.000Z',
          updatedAt: '2026-06-10T11:00:00.000Z',
          resolutionAt: '2026-06-10T11:00:00.000Z', // 1h
        }),
        dbIncident({
          id: 'INC-2',
          createdAt: '2026-06-11T10:00:00.000Z',
          updatedAt: '2026-06-11T12:00:00.000Z',
          resolutionAt: '2026-06-11T12:00:00.000Z', // 2h
        }),
        dbIncident({
          id: 'INC-3',
          createdAt: '2026-06-12T10:00:00.000Z',
          updatedAt: '2026-06-12T16:00:00.000Z',
          resolutionAt: '2026-06-12T16:00:00.000Z', // 6h
        }),
      ]);

      const results = await provider.calculateMetrics(mockEntity);

      expect(results.get('dora.meanTimeToRestore')).toBe(3);
    });

    it('should throw when no resolved incidents are found', async () => {
      mockDoraDataService.readIncidents.mockResolvedValueOnce([
        dbIncident({
          id: 'INC-1',
          createdAt: '2026-06-10T10:00:00.000Z',
          updatedAt: '2026-06-10T10:00:00.000Z',
          resolutionAt: null,
        }),
      ]);

      await expect(provider.calculateMetrics(mockEntity)).rejects.toThrow(
        'Unable to calculate mean time to restore: no resolved incidents with measurable recovery time were found',
      );
    });

    it('should throw when no incidents are found', async () => {
      mockDoraDataService.readIncidents.mockResolvedValueOnce([]);

      await expect(provider.calculateMetrics(mockEntity)).rejects.toThrow(
        'Unable to calculate mean time to restore: no resolved incidents with measurable recovery time were found',
      );
    });

    it('should throw when resolved incidents are invalid and none are measurable', async () => {
      mockDoraDataService.readIncidents.mockResolvedValueOnce([
        dbIncident({
          id: 'INC-1',
          createdAt: '2026-06-10T12:00:00.000Z',
          updatedAt: '2026-06-10T12:00:00.000Z',
          resolutionAt: '2026-06-10T10:00:00.000Z',
        }),
      ]);

      await expect(provider.calculateMetrics(mockEntity)).rejects.toThrow(
        /resolutionAt before createdAt and no measurable recovery times/,
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Skipping incident INC-1'),
      );
    });

    it('should skip invalid resolved incidents and calculate mean from the rest', async () => {
      mockDoraDataService.readIncidents.mockResolvedValueOnce([
        dbIncident({
          id: 'INC-1',
          createdAt: '2026-06-10T12:00:00.000Z',
          updatedAt: '2026-06-10T12:00:00.000Z',
          resolutionAt: '2026-06-10T10:00:00.000Z',
        }),
        dbIncident({
          id: 'INC-2',
          createdAt: '2026-06-11T10:00:00.000Z',
          updatedAt: '2026-06-11T12:00:00.000Z',
          resolutionAt: '2026-06-11T12:00:00.000Z', // 2h
        }),
      ]);

      const results = await provider.calculateMetrics(mockEntity);

      expect(results.get('dora.meanTimeToRestore')).toBe(2);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Skipping incident INC-1'),
      );
    });
  });
});
