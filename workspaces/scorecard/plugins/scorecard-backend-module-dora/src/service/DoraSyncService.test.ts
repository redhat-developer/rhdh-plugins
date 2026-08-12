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

import { stringifyEntityRef } from '@backstage/catalog-model';
import { TestDatabases, mockServices } from '@backstage/backend-test-utils';
import {
  buildMockCollectorsService,
  buildMockDeploymentsCollector,
  buildMockIncidentsCollector,
  mockEntity,
} from '../metricProviders/__fixtures__';
import { createTestDatabase } from '../database/__fixtures__';
import { DefaultDoraDataService } from './DoraDataService';
import { DefaultDoraSyncService } from './DoraSyncService';
import {
  DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
  DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
} from '../constants';

jest.setTimeout(60000);

describe('DefaultDoraSyncService', () => {
  const databases = TestDatabases.create({
    ids: ['POSTGRES_15', 'SQLITE_3'],
  });
  const logger = mockServices.logger.mock();

  beforeEach(() => {
    logger.debug.mockClear();
  });

  it.each(databases.eachSupportedId())(
    'syncs deployments from the last successful sync watermark - %p',
    async databaseId => {
      const { deployments, incidents, pullRequests, lastSync } =
        await createTestDatabase(await databases.init(databaseId));

      const deploymentsCollector = buildMockDeploymentsCollector({
        deployments: [
          {
            id: '100',
            commitSha: 'sha-1',
            environment: 'production',
            createdAt: '2026-06-10T00:00:00.000Z',
            result: 'success',
          },
        ],
        collectorId: DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
      });
      const { collectorsService, collect } = buildMockCollectorsService({
        collectors: [deploymentsCollector],
      });

      const syncService = new DefaultDoraSyncService(
        collectorsService,
        deployments,
        incidents,
        pullRequests,
        lastSync,
        logger,
      );
      const dataService = new DefaultDoraDataService(
        deployments,
        incidents,
        pullRequests,
      );

      const windowFrom = new Date('2026-06-01T00:00:00.000Z');
      const firstWindowTo = new Date('2026-06-15T00:00:00.000Z');
      const secondWindowTo = new Date('2026-06-30T00:00:00.000Z');
      const catalogEntityRef = stringifyEntityRef(mockEntity);

      await syncService.syncDeployments(mockEntity, {
        windowFrom,
        windowTo: firstWindowTo,
        collector: {
          id: DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
          input: {},
        },
      });

      const first = await dataService.readDeployments(catalogEntityRef, {
        windowFrom,
        windowTo: secondWindowTo,
        collector: { id: DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID },
      });

      expect(first).toHaveLength(1);
      expect(collect).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            from: windowFrom.toISOString(),
            to: firstWindowTo.toISOString(),
          }),
        }),
      );
      expect(
        (
          await lastSync.getLastSyncedAt(
            catalogEntityRef,
            DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
          )
        )?.toISOString(),
      ).toBe(firstWindowTo.toISOString());

      jest.mocked(deploymentsCollector.collect).mockResolvedValueOnce({
        deployments: [
          {
            id: '101',
            commitSha: 'sha-2',
            environment: 'production',
            createdAt: '2026-06-20T00:00:00.000Z',
            result: 'success',
          },
        ],
      });

      await syncService.syncDeployments(mockEntity, {
        windowFrom,
        windowTo: secondWindowTo,
        collector: {
          id: DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
          input: {},
        },
      });

      const second = await dataService.readDeployments(catalogEntityRef, {
        windowFrom,
        windowTo: secondWindowTo,
        collector: { id: DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID },
      });

      expect(second).toHaveLength(2);
      expect(collect).toHaveBeenLastCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            from: firstWindowTo.toISOString(),
            to: secondWindowTo.toISOString(),
          }),
        }),
      );
    },
  );

  it.each(databases.eachSupportedId())(
    'coalesces concurrent deployment syncs for the same entity and collector - %p',
    async databaseId => {
      const { deployments, incidents, pullRequests, lastSync } =
        await createTestDatabase(await databases.init(databaseId));

      let resolveCollect!: () => void;
      const collectGate = new Promise<void>(resolve => {
        resolveCollect = resolve;
      });

      const deploymentsCollector = buildMockDeploymentsCollector({
        deployments: [
          {
            id: '100',
            commitSha: 'sha-1',
            environment: 'production',
            createdAt: '2026-06-10T00:00:00.000Z',
            result: 'success',
          },
        ],
        collectorId: DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
      });
      jest.mocked(deploymentsCollector.collect).mockImplementation(async () => {
        await collectGate;
        return {
          deployments: [
            {
              id: '100',
              commitSha: 'sha-1',
              environment: 'production',
              createdAt: '2026-06-10T00:00:00.000Z',
              result: 'success',
            },
          ],
        };
      });

      const { collectorsService, collect } = buildMockCollectorsService({
        collectors: [deploymentsCollector],
      });
      const syncService = new DefaultDoraSyncService(
        collectorsService,
        deployments,
        incidents,
        pullRequests,
        lastSync,
        logger,
      );

      const windowFrom = new Date('2026-06-01T00:00:00.000Z');
      const windowTo = new Date('2026-06-30T00:00:00.000Z');
      const options = {
        windowFrom,
        windowTo,
        collector: {
          id: DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
          input: {},
        },
      };

      // Hold the first collect open so the sync stays in-flight, then start a
      // second sync for the same entity/collector.
      // Both should share that one collector call, not run two fetches.
      const first = syncService.syncDeployments(mockEntity, options);
      const second = syncService.syncDeployments(mockEntity, options);
      resolveCollect();
      await Promise.all([first, second]);

      expect(collect).toHaveBeenCalledTimes(1);
    },
  );

  it.each(databases.eachSupportedId())(
    'syncs incidents updated since the last successful sync watermark - %p',
    async databaseId => {
      const { deployments, incidents, pullRequests, lastSync } =
        await createTestDatabase(await databases.init(databaseId));

      const incidentsCollector = buildMockIncidentsCollector({
        incidents: [
          {
            id: 'INC-1',
            createdAt: '2026-06-10T00:00:00.000Z',
            updatedAt: '2026-06-11T00:00:00.000Z',
            resolutionAt: '2026-06-11T00:00:00.000Z',
          },
        ],
        collectorId: DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
      });
      const { collectorsService, collect } = buildMockCollectorsService({
        collectors: [incidentsCollector],
      });

      const syncService = new DefaultDoraSyncService(
        collectorsService,
        deployments,
        incidents,
        pullRequests,
        lastSync,
        logger,
      );

      const windowFrom = new Date('2026-06-01T00:00:00.000Z');
      const firstWindowTo = new Date('2026-06-15T00:00:00.000Z');
      const secondWindowTo = new Date('2026-06-30T00:00:00.000Z');

      await syncService.syncIncidents(mockEntity, {
        windowFrom,
        windowTo: firstWindowTo,
        collector: {
          id: DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
          input: {},
        },
      });

      expect(collect).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            from: windowFrom.toISOString(),
            to: firstWindowTo.toISOString(),
            updatedSince: windowFrom.toISOString(),
          }),
        }),
      );

      await syncService.syncIncidents(mockEntity, {
        windowFrom,
        windowTo: secondWindowTo,
        collector: {
          id: DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
          input: {},
        },
      });

      expect(collect).toHaveBeenLastCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            from: windowFrom.toISOString(),
            to: secondWindowTo.toISOString(),
            updatedSince: firstWindowTo.toISOString(),
          }),
        }),
      );
    },
  );

  it.each(databases.eachSupportedId())(
    'skips deployment and incident refresh when last sync is within staleAfterMs - %p',
    async databaseId => {
      const { deployments, incidents, pullRequests, lastSync } =
        await createTestDatabase(await databases.init(databaseId));

      const deploymentsCollector = buildMockDeploymentsCollector({
        deployments: [
          {
            id: '100',
            commitSha: 'sha-1',
            environment: 'production',
            createdAt: '2026-06-10T00:00:00.000Z',
            result: 'success',
          },
        ],
        collectorId: DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
      });
      const incidentsCollector = buildMockIncidentsCollector({
        incidents: [
          {
            id: 'INC-1',
            createdAt: '2026-06-10T00:00:00.000Z',
            updatedAt: '2026-06-11T00:00:00.000Z',
            resolutionAt: '2026-06-11T00:00:00.000Z',
          },
        ],
        collectorId: DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
      });
      const { collectorsService, collect } = buildMockCollectorsService({
        collectors: [deploymentsCollector, incidentsCollector],
      });

      const staleAfterMs = 60_000;
      const catalogEntityRef = stringifyEntityRef(mockEntity);
      const syncService = new DefaultDoraSyncService(
        collectorsService,
        deployments,
        incidents,
        pullRequests,
        lastSync,
        logger,
        staleAfterMs,
      );

      const windowTo = new Date();
      const windowFrom = new Date(windowTo.getTime() - 7 * 24 * 60 * 60 * 1000);
      const secondWindowTo = new Date(windowTo.getTime() + 30_000);

      await syncService.syncDeployments(mockEntity, {
        windowFrom,
        windowTo,
        collector: {
          id: DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
          input: {},
        },
      });
      await syncService.syncIncidents(mockEntity, {
        windowFrom,
        windowTo,
        collector: {
          id: DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
          input: {},
        },
      });
      expect(collect).toHaveBeenCalledTimes(2);

      collect.mockClear();
      logger.debug.mockClear();

      await syncService.syncDeployments(mockEntity, {
        windowFrom,
        windowTo: secondWindowTo,
        collector: {
          id: DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
          input: {},
        },
      });
      await syncService.syncIncidents(mockEntity, {
        windowFrom,
        windowTo: secondWindowTo,
        collector: {
          id: DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
          input: {},
        },
      });

      expect(collect).toHaveBeenCalledTimes(0);
      expect(logger.debug).toHaveBeenCalledTimes(2);
      expect(logger.debug).toHaveBeenNthCalledWith(
        1,
        `Skipping DORA deployments refresh for collector "${DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID}" on "${catalogEntityRef}" because data is fresh within staleAfterMs (${staleAfterMs} ms).`,
      );
      expect(logger.debug).toHaveBeenNthCalledWith(
        2,
        `Skipping DORA incidents refresh for collector "${DORA_DEFAULT_INCIDENTS_COLLECTOR_ID}" on "${catalogEntityRef}" because data is fresh within staleAfterMs (${staleAfterMs} ms).`,
      );
    },
  );
});
