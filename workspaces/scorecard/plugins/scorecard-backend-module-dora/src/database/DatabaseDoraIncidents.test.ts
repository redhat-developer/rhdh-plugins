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
import { DORA_DEFAULT_INCIDENTS_COLLECTOR_ID } from '../constants';
import { collectorInputHash } from '../service/collectorHash';
import { createTestDatabase } from './__fixtures__';

jest.setTimeout(60000);

const EMPTY_INPUT_HASH = collectorInputHash({});

describe('DatabaseDoraIncidents', () => {
  const databases = TestDatabases.create({
    ids: ['POSTGRES_15', 'SQLITE_3'],
  });

  describe('upsert', () => {
    it.each(databases.eachSupportedId())(
      'inserts incidents - %p',
      async databaseId => {
        const { incidents } = await createTestDatabase(
          await databases.init(databaseId),
        );
        const entityRef = 'component:default/service-a';
        const collectorId = DORA_DEFAULT_INCIDENTS_COLLECTOR_ID;

        await incidents.upsert([
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalIncidentId: 'INC-1',
            createdAt: new Date('2026-06-01T10:00:00.000Z'),
            updatedAt: new Date('2026-06-01T10:00:00.000Z'),
            resolutionAt: null,
          },
        ]);

        const rows = await incidents.readByEntityCollectorAndWindow(
          entityRef,
          collectorId,
          EMPTY_INPUT_HASH,
          new Date('2026-06-01T00:00:00.000Z'),
          new Date('2026-06-30T00:00:00.000Z'),
        );

        expect(rows).toEqual([
          {
            id: expect.any(String),
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalIncidentId: 'INC-1',
            createdAt: new Date('2026-06-01T10:00:00.000Z'),
            updatedAt: new Date('2026-06-01T10:00:00.000Z'),
            resolutionAt: null,
          },
        ]);
      },
    );

    it.each(databases.eachSupportedId())(
      'merges resolution updates on natural key conflict - %p',
      async databaseId => {
        const { incidents } = await createTestDatabase(
          await databases.init(databaseId),
        );
        const entityRef = 'component:default/service-a';
        const collectorId = DORA_DEFAULT_INCIDENTS_COLLECTOR_ID;

        await incidents.upsert([
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalIncidentId: 'INC-1',
            createdAt: new Date('2026-06-01T10:00:00.000Z'),
            updatedAt: new Date('2026-06-01T10:00:00.000Z'),
            resolutionAt: null,
          },
        ]);
        // Conflict on (catalog_entity_ref, collector_id, collector_input_hash, original_incident_id) for updatedAt and resolutionAt
        await incidents.upsert([
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalIncidentId: 'INC-1',
            createdAt: new Date('2026-06-01T10:00:00.000Z'),
            updatedAt: new Date('2026-06-02T12:00:00.000Z'),
            resolutionAt: new Date('2026-06-02T12:00:00.000Z'),
          },
        ]);

        const rows = await incidents.readByEntityCollectorAndWindow(
          entityRef,
          collectorId,
          EMPTY_INPUT_HASH,
          new Date('2026-06-01T00:00:00.000Z'),
          new Date('2026-06-30T00:00:00.000Z'),
        );

        expect(rows).toHaveLength(1);
        expect(rows[0].updatedAt?.toISOString()).toBe(
          '2026-06-02T12:00:00.000Z',
        );
        expect(rows[0].resolutionAt?.toISOString()).toBe(
          '2026-06-02T12:00:00.000Z',
        );
      },
    );

    it.each(databases.eachSupportedId())(
      'treats the same original id with different input hashes as distinct - %p',
      async databaseId => {
        const { incidents } = await createTestDatabase(
          await databases.init(databaseId),
        );
        const entityRef = 'component:default/service-a';
        const collectorId = DORA_DEFAULT_INCIDENTS_COLLECTOR_ID;
        const otherHash = collectorInputHash({ project: 'OPS-B' });

        await incidents.upsert([
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalIncidentId: 'INC-1',
            createdAt: new Date('2026-06-01T10:00:00.000Z'),
            updatedAt: new Date('2026-06-01T10:00:00.000Z'),
            resolutionAt: null,
          },
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: otherHash,
            originalIncidentId: 'INC-1',
            createdAt: new Date('2026-06-10T10:00:00.000Z'),
            updatedAt: new Date('2026-06-10T10:00:00.000Z'),
            resolutionAt: null,
          },
        ]);

        const emptyInputRows = await incidents.readByEntityCollectorAndWindow(
          entityRef,
          collectorId,
          EMPTY_INPUT_HASH,
          new Date('2026-06-01T00:00:00.000Z'),
          new Date('2026-06-30T00:00:00.000Z'),
        );
        const otherInputRows = await incidents.readByEntityCollectorAndWindow(
          entityRef,
          collectorId,
          otherHash,
          new Date('2026-06-01T00:00:00.000Z'),
          new Date('2026-06-30T00:00:00.000Z'),
        );

        expect(emptyInputRows).toHaveLength(1);
        expect(emptyInputRows[0].createdAt.toISOString()).toBe(
          '2026-06-01T10:00:00.000Z',
        );
        expect(otherInputRows).toHaveLength(1);
        expect(otherInputRows[0].createdAt.toISOString()).toBe(
          '2026-06-10T10:00:00.000Z',
        );
      },
    );

    it.each(databases.eachSupportedId())(
      'no-ops when upserting an empty list - %p',
      async databaseId => {
        const { incidents } = await createTestDatabase(
          await databases.init(databaseId),
        );
        await expect(incidents.upsert([])).resolves.toBeUndefined();
      },
    );
  });

  describe('readByEntityCollectorAndWindow', () => {
    it.each(databases.eachSupportedId())(
      'returns rows in the window for the given collector - %p',
      async databaseId => {
        const { incidents } = await createTestDatabase(
          await databases.init(databaseId),
        );
        const entityRef = 'component:default/service-a';
        const collectorId = DORA_DEFAULT_INCIDENTS_COLLECTOR_ID;

        await incidents.upsert([
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalIncidentId: 'INC-before',
            createdAt: new Date('2026-05-31T10:00:00.000Z'),
            updatedAt: new Date('2026-05-31T10:00:00.000Z'),
            resolutionAt: null,
          },
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalIncidentId: 'INC-1',
            createdAt: new Date('2026-06-01T10:00:00.000Z'),
            updatedAt: new Date('2026-06-01T10:00:00.000Z'),
            resolutionAt: null,
          },
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalIncidentId: 'INC-2',
            createdAt: new Date('2026-06-10T10:00:00.000Z'),
            updatedAt: new Date('2026-06-10T10:00:00.000Z'),
            resolutionAt: null,
          },
        ]);

        const rows = await incidents.readByEntityCollectorAndWindow(
          entityRef,
          collectorId,
          EMPTY_INPUT_HASH,
          new Date('2026-06-01T00:00:00.000Z'),
          new Date('2026-06-30T00:00:00.000Z'),
        );

        expect(rows.map(row => row.originalIncidentId)).toEqual([
          'INC-1',
          'INC-2',
        ]);
      },
    );
  });

  describe('deleteOlderThan', () => {
    it.each(databases.eachSupportedId())(
      'deletes incidents created before the cutoff - %p',
      async databaseId => {
        const { incidents } = await createTestDatabase(
          await databases.init(databaseId),
        );
        const entityRef = 'component:default/service-a';
        const collectorId = DORA_DEFAULT_INCIDENTS_COLLECTOR_ID;

        await incidents.upsert([
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalIncidentId: 'INC-old',
            createdAt: new Date('2025-01-01T00:00:00.000Z'),
            updatedAt: new Date('2025-01-01T00:00:00.000Z'),
            resolutionAt: null,
          },
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalIncidentId: 'INC-new',
            createdAt: new Date('2026-06-10T00:00:00.000Z'),
            updatedAt: new Date('2026-06-10T00:00:00.000Z'),
            resolutionAt: null,
          },
        ]);

        const deleted = await incidents.deleteOlderThan(
          new Date('2026-01-01T00:00:00.000Z'),
        );
        const remaining = await incidents.readByEntityCollectorAndWindow(
          entityRef,
          collectorId,
          EMPTY_INPUT_HASH,
          new Date('2025-01-01T00:00:00.000Z'),
          new Date('2026-12-31T00:00:00.000Z'),
        );

        expect(deleted).toBe(1);
        expect(remaining.map(row => row.originalIncidentId)).toEqual([
          'INC-new',
        ]);
      },
    );
  });
});
