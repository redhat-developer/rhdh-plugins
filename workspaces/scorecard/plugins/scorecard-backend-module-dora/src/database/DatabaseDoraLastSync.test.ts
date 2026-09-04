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

import { TestDatabases } from '@backstage/backend-test-utils';
import {
  DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
  DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
} from '../constants';
import { collectorInputHash } from '../service/collectorHash';
import { createTestDatabase } from './__fixtures__';

jest.setTimeout(60000);

const EMPTY_INPUT_HASH = collectorInputHash({});

describe('DatabaseDoraLastSync', () => {
  const databases = TestDatabases.create({
    ids: ['POSTGRES_15', 'SQLITE_3'],
  });

  describe('setLastSyncedAt', () => {
    it.each(databases.eachSupportedId())(
      'stores last synced at for an entity and collector - %p',
      async databaseId => {
        const { lastSync } = await createTestDatabase(
          await databases.init(databaseId),
        );
        const entityRef = 'component:default/service-a';
        const collectorId = DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID;

        expect(
          await lastSync.getLastSyncedAt(
            entityRef,
            collectorId,
            EMPTY_INPUT_HASH,
          ),
        ).toBeUndefined();

        await lastSync.setLastSyncedAt(
          entityRef,
          collectorId,
          EMPTY_INPUT_HASH,
          new Date('2026-06-10T00:00:00.000Z'),
        );

        expect(
          (
            await lastSync.getLastSyncedAt(
              entityRef,
              collectorId,
              EMPTY_INPUT_HASH,
            )
          )?.toISOString(),
        ).toBe('2026-06-10T00:00:00.000Z');
      },
    );

    it.each(databases.eachSupportedId())(
      'does not move last synced at backwards - %p',
      async databaseId => {
        const { lastSync } = await createTestDatabase(
          await databases.init(databaseId),
        );
        const entityRef = 'component:default/service-a';
        const collectorId = DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID;

        await lastSync.setLastSyncedAt(
          entityRef,
          collectorId,
          EMPTY_INPUT_HASH,
          new Date('2026-06-10T00:00:00.000Z'),
        );
        await lastSync.setLastSyncedAt(
          entityRef,
          collectorId,
          EMPTY_INPUT_HASH,
          new Date('2026-06-09T00:00:00.000Z'),
        );

        expect(
          (
            await lastSync.getLastSyncedAt(
              entityRef,
              collectorId,
              EMPTY_INPUT_HASH,
            )
          )?.toISOString(),
        ).toBe('2026-06-10T00:00:00.000Z');
      },
    );

    it.each(databases.eachSupportedId())(
      'advances last synced at when the new value is later - %p',
      async databaseId => {
        const { lastSync } = await createTestDatabase(
          await databases.init(databaseId),
        );
        const entityRef = 'component:default/service-a';
        const collectorId = DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID;

        await lastSync.setLastSyncedAt(
          entityRef,
          collectorId,
          EMPTY_INPUT_HASH,
          new Date('2026-06-10T00:00:00.000Z'),
        );
        await lastSync.setLastSyncedAt(
          entityRef,
          collectorId,
          EMPTY_INPUT_HASH,
          new Date('2026-06-15T00:00:00.000Z'),
        );

        expect(
          (
            await lastSync.getLastSyncedAt(
              entityRef,
              collectorId,
              EMPTY_INPUT_HASH,
            )
          )?.toISOString(),
        ).toBe('2026-06-15T00:00:00.000Z');
      },
    );

    it.each(databases.eachSupportedId())(
      'keeps last synced at independent per collector - %p',
      async databaseId => {
        const { lastSync } = await createTestDatabase(
          await databases.init(databaseId),
        );
        const entityRef = 'component:default/service-a';
        const collectorId = DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID;
        const otherCollectorId = DORA_DEFAULT_INCIDENTS_COLLECTOR_ID;

        await lastSync.setLastSyncedAt(
          entityRef,
          collectorId,
          EMPTY_INPUT_HASH,
          new Date('2026-06-15T00:00:00.000Z'),
        );
        await lastSync.setLastSyncedAt(
          entityRef,
          otherCollectorId,
          EMPTY_INPUT_HASH,
          new Date('2026-06-01T00:00:00.000Z'),
        );

        expect(
          (
            await lastSync.getLastSyncedAt(
              entityRef,
              otherCollectorId,
              EMPTY_INPUT_HASH,
            )
          )?.toISOString(),
        ).toBe('2026-06-01T00:00:00.000Z');
        expect(
          (
            await lastSync.getLastSyncedAt(
              entityRef,
              collectorId,
              EMPTY_INPUT_HASH,
            )
          )?.toISOString(),
        ).toBe('2026-06-15T00:00:00.000Z');
      },
    );

    it.each(databases.eachSupportedId())(
      'keeps last synced at independent per input hash - %p',
      async databaseId => {
        const { lastSync } = await createTestDatabase(
          await databases.init(databaseId),
        );
        const entityRef = 'component:default/service-a';
        const collectorId = DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID;
        const otherHash = collectorInputHash({ workflowName: 'Deploy B' });

        await lastSync.setLastSyncedAt(
          entityRef,
          collectorId,
          EMPTY_INPUT_HASH,
          new Date('2026-06-15T00:00:00.000Z'),
        );
        await lastSync.setLastSyncedAt(
          entityRef,
          collectorId,
          otherHash,
          new Date('2026-06-01T00:00:00.000Z'),
        );

        expect(
          (
            await lastSync.getLastSyncedAt(entityRef, collectorId, otherHash)
          )?.toISOString(),
        ).toBe('2026-06-01T00:00:00.000Z');
        expect(
          (
            await lastSync.getLastSyncedAt(
              entityRef,
              collectorId,
              EMPTY_INPUT_HASH,
            )
          )?.toISOString(),
        ).toBe('2026-06-15T00:00:00.000Z');
      },
    );
  });

  describe('deleteOlderThan', () => {
    it.each(databases.eachSupportedId())(
      'deletes watermarks older than the cutoff - %p',
      async databaseId => {
        const { lastSync } = await createTestDatabase(
          await databases.init(databaseId),
        );
        const entityRef = 'component:default/service-a';
        const collectorId = DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID;
        const staleHash = collectorInputHash({ workflowName: 'old' });

        await lastSync.setLastSyncedAt(
          entityRef,
          collectorId,
          EMPTY_INPUT_HASH,
          new Date('2026-06-10T00:00:00.000Z'),
        );
        await lastSync.setLastSyncedAt(
          entityRef,
          collectorId,
          staleHash,
          new Date('2025-01-01T00:00:00.000Z'),
        );

        const deleted = await lastSync.deleteOlderThan(
          new Date('2026-01-01T00:00:00.000Z'),
        );

        expect(deleted).toBe(1);
        expect(
          await lastSync.getLastSyncedAt(entityRef, collectorId, staleHash),
        ).toBeUndefined();
        expect(
          (
            await lastSync.getLastSyncedAt(
              entityRef,
              collectorId,
              EMPTY_INPUT_HASH,
            )
          )?.toISOString(),
        ).toBe('2026-06-10T00:00:00.000Z');
      },
    );
  });
});
