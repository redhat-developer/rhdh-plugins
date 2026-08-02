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
import { createTestDatabase } from './__fixtures__';

jest.setTimeout(60000);

describe('DatabaseDoraIncidents', () => {
  const databases = TestDatabases.create({
    ids: ['POSTGRES_15', 'SQLITE_3'],
  });

  it.each(databases.eachSupportedId())(
    'upserts resolution updates and reads window - %p',
    async databaseId => {
      const { incidents } = await createTestDatabase(
        await databases.init(databaseId),
      );
      const entityRef = 'component:default/service-a';
      const collectorId = 'jira:incidents';

      expect(
        await incidents.getLatestUpdatedAt(entityRef, collectorId),
      ).toBeUndefined();

      await incidents.upsert([
        {
          catalogEntityRef: entityRef,
          collectorId: collectorId,
          originalIncidentId: 'INC-1',
          createdAt: new Date('2026-06-01T10:00:00.000Z'),
          updatedAt: new Date('2026-06-01T10:00:00.000Z'),
          resolutionAt: null,
        },
      ]);

      await incidents.upsert([
        {
          catalogEntityRef: entityRef,
          collectorId: collectorId,
          originalIncidentId: 'INC-1',
          createdAt: new Date('2026-06-01T10:00:00.000Z'),
          updatedAt: new Date('2026-06-02T12:00:00.000Z'),
          resolutionAt: new Date('2026-06-02T12:00:00.000Z'),
        },
      ]);

      const rows = await incidents.readByEntityCollectorAndWindow(
        entityRef,
        collectorId,
        new Date('2026-06-01T00:00:00.000Z'),
        new Date('2026-06-30T00:00:00.000Z'),
      );

      expect(rows).toHaveLength(1);
      expect(rows[0].id).toEqual(expect.any(String));
      expect(rows[0].resolutionAt?.toISOString()).toBe(
        '2026-06-02T12:00:00.000Z',
      );
      expect(
        (
          await incidents.getLatestUpdatedAt(entityRef, collectorId)
        )?.toISOString(),
      ).toBe('2026-06-02T12:00:00.000Z');
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
