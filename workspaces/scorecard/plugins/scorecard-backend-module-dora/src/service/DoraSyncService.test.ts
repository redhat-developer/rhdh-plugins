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
import { TestDatabases } from '@backstage/backend-test-utils';
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

  it.each(databases.eachSupportedId())(
    'syncs deployments created after the last watermark - %p',
    async databaseId => {
      const { deployments, incidents, pullRequests } = await createTestDatabase(
        await databases.init(databaseId),
      );

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
      );
      const dataService = new DefaultDoraDataService(
        deployments,
        incidents,
        pullRequests,
      );

      const windowFrom = new Date('2026-06-01T00:00:00.000Z');
      const windowTo = new Date('2026-06-30T00:00:00.000Z');
      const catalogEntityRef = stringifyEntityRef(mockEntity);

      await syncService.syncDeployments(mockEntity, {
        windowFrom,
        windowTo,
        collector: {
          id: DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
          input: {},
        },
      });

      const first = await dataService.readDeployments(catalogEntityRef, {
        windowFrom,
        windowTo,
        collector: { id: DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID },
      });

      expect(first).toHaveLength(1);
      expect(collect).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            from: windowFrom.toISOString(),
            to: windowTo.toISOString(),
          }),
        }),
      );

      jest.mocked(deploymentsCollector.collect).mockResolvedValueOnce({
        deployments: [
          {
            id: '101',
            commitSha: 'sha-2',
            environment: 'production',
            createdAt: '2026-06-15T00:00:00.000Z',
            result: 'success',
          },
        ],
      });

      await syncService.syncDeployments(mockEntity, {
        windowFrom,
        windowTo,
        collector: {
          id: DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
          input: {},
        },
      });

      const second = await dataService.readDeployments(catalogEntityRef, {
        windowFrom,
        windowTo,
        collector: { id: DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID },
      });

      expect(second).toHaveLength(2);
      expect(collect).toHaveBeenLastCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            from: '2026-06-10T00:00:00.000Z', // uses latest createdAt watermark
            to: windowTo.toISOString(),
          }),
        }),
      );
    },
  );

  it.each(databases.eachSupportedId())(
    'syncs incidents with created after window start and updated since the last watermark - %p',
    async databaseId => {
      const { deployments, incidents, pullRequests } = await createTestDatabase(
        await databases.init(databaseId),
      );

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
      );

      const windowFrom = new Date('2026-06-01T00:00:00.000Z');
      const windowTo = new Date('2026-06-30T00:00:00.000Z');

      await syncService.syncIncidents(mockEntity, {
        windowFrom,
        windowTo,
        collector: {
          id: DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
          input: {},
        },
      });

      expect(collect).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            from: windowFrom.toISOString(),
            to: windowTo.toISOString(),
            updatedSince: windowFrom.toISOString(),
          }),
        }),
      );

      await syncService.syncIncidents(mockEntity, {
        windowFrom,
        windowTo,
        collector: {
          id: DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
          input: {},
        },
      });

      expect(collect).toHaveBeenLastCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            from: windowFrom.toISOString(),
            to: windowTo.toISOString(),
            updatedSince: '2026-06-11T00:00:00.000Z', // uses latest updatedAt watermark
          }),
        }),
      );
    },
  );
});
