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

describe('DatabaseDoraDeployments', () => {
  const databases = TestDatabases.create({
    ids: ['POSTGRES_15', 'SQLITE_3'],
  });

  it.each(databases.eachSupportedId())(
    'upserts, reads cursor and window scoped by collector - %p',
    async databaseId => {
      const { deployments } = await createTestDatabase(
        await databases.init(databaseId),
      );
      const entityRef = 'component:default/service-a';
      const collectorId = 'github:deployments';
      const otherCollectorId = 'github:deploymentWorkflowRuns';

      expect(
        await deployments.getLatestCreatedAt(entityRef, collectorId),
      ).toBeUndefined();

      await deployments.upsert([
        {
          catalogEntityRef: entityRef,
          collectorId: collectorId,
          originalDeploymentId: 'dep-1',
          commitSha: 'sha-1',
          environment: 'production',
          createdAt: new Date('2026-06-01T10:00:00.000Z'),
          result: 'success',
        },
        {
          catalogEntityRef: entityRef,
          collectorId: collectorId,
          originalDeploymentId: 'dep-2',
          commitSha: 'sha-2',
          environment: 'production',
          createdAt: new Date('2026-06-10T10:00:00.000Z'),
          result: 'success',
        },
        {
          // Same original id from a different collector is a distinct row
          catalogEntityRef: entityRef,
          collectorId: otherCollectorId,
          originalDeploymentId: 'dep-2',
          commitSha: 'sha-other',
          environment: 'production',
          createdAt: new Date('2026-06-20T10:00:00.000Z'),
          result: 'success',
        },
      ]);

      const cursor = await deployments.getLatestCreatedAt(
        entityRef,
        collectorId,
      );
      expect(cursor?.toISOString()).toBe('2026-06-10T10:00:00.000Z');

      await deployments.upsert([
        {
          catalogEntityRef: entityRef,
          collectorId: collectorId,
          originalDeploymentId: 'dep-2',
          commitSha: 'sha-2-updated',
          environment: 'production',
          createdAt: new Date('2026-06-10T10:00:00.000Z'),
          result: 'failure',
        },
      ]);

      const windowRows = await deployments.readByEntityCollectorAndWindow(
        entityRef,
        collectorId,
        new Date('2026-06-01T00:00:00.000Z'),
        new Date('2026-06-30T00:00:00.000Z'),
      );

      expect(windowRows).toHaveLength(2);
      expect(windowRows[1].commitSha).toBe('sha-2-updated');
      expect(windowRows[1].result).toBe('failure');
      expect(windowRows[0].id).toEqual(expect.any(String));
      expect(windowRows[1].id).toEqual(expect.any(String));
    },
  );

  it.each(databases.eachSupportedId())(
    'no-ops when upserting an empty list - %p',
    async databaseId => {
      const { deployments } = await createTestDatabase(
        await databases.init(databaseId),
      );
      await expect(deployments.upsert([])).resolves.toBeUndefined();
    },
  );
});
