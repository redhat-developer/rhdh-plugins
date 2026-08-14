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
import { DatabaseDoraDeployments } from './DatabaseDoraDeployments';

jest.setTimeout(60000);

async function seedDeployment(
  deploymentsDb: DatabaseDoraDeployments,
  entityRef = 'component:default/service-a',
) {
  const deploymentsCollectorId = 'github:deployments';
  await deploymentsDb.upsert([
    {
      catalogEntityRef: entityRef,
      collectorId: deploymentsCollectorId,
      originalDeploymentId: 'dep-1',
      commitSha: 'sha-1',
      environment: 'production',
      createdAt: new Date('2026-06-10T10:00:00.000Z'),
    },
  ]);
  const [deployment] = await deploymentsDb.readByEntityCollectorAndWindow(
    entityRef,
    deploymentsCollectorId,
    new Date('2026-06-01T00:00:00.000Z'),
    new Date('2026-06-30T00:00:00.000Z'),
  );
  return { entityRef, deployment };
}

describe('DatabaseDoraPullRequests', () => {
  const databases = TestDatabases.create({
    ids: ['POSTGRES_15', 'SQLITE_3'],
  });

  describe('upsert', () => {
    it.each(databases.eachSupportedId())(
      'inserts pull requests - %p',
      async databaseId => {
        const { deployments, pullRequests } = await createTestDatabase(
          await databases.init(databaseId),
        );
        const { entityRef, deployment } = await seedDeployment(deployments);
        const prCollectorId = 'github:deploymentRangePullRequests';

        await pullRequests.upsert([
          {
            catalogEntityRef: entityRef,
            collectorId: prCollectorId,
            originalPrId: 'pr-1',
            firstCommitAt: new Date('2026-06-09T10:00:00.000Z'),
            deploymentId: deployment.id,
          },
        ]);

        const rows = await pullRequests.readByEntityCollectorAndDeployment(
          entityRef,
          prCollectorId,
          deployment.id,
        );

        expect(rows).toEqual([
          {
            id: expect.any(String),
            catalogEntityRef: entityRef,
            collectorId: prCollectorId,
            originalPrId: 'pr-1',
            firstCommitAt: new Date('2026-06-09T10:00:00.000Z'),
            deploymentId: deployment.id,
          },
        ]);
      },
    );

    it.each(databases.eachSupportedId())(
      'merges updates on natural key conflict - %p',
      async databaseId => {
        const { deployments, pullRequests } = await createTestDatabase(
          await databases.init(databaseId),
        );
        const { entityRef, deployment } = await seedDeployment(deployments);
        const prCollectorId = 'github:deploymentRangePullRequests';

        await pullRequests.upsert([
          {
            catalogEntityRef: entityRef,
            collectorId: prCollectorId,
            originalPrId: 'pr-1',
            firstCommitAt: new Date('2026-06-09T10:00:00.000Z'),
            deploymentId: deployment.id,
          },
        ]);
        // Conflict on (catalog_entity_ref, collector_id, original_pr_id, deployment_id) for firstCommitAt
        await pullRequests.upsert([
          {
            catalogEntityRef: entityRef,
            collectorId: prCollectorId,
            originalPrId: 'pr-1',
            firstCommitAt: new Date('2026-06-09T12:00:00.000Z'),
            deploymentId: deployment.id,
          },
        ]);

        const rows = await pullRequests.readByEntityCollectorAndDeployment(
          entityRef,
          prCollectorId,
          deployment.id,
        );

        expect(rows).toHaveLength(1);
        expect(rows[0].firstCommitAt.toISOString()).toBe(
          '2026-06-09T12:00:00.000Z',
        );
      },
    );

    it.each(databases.eachSupportedId())(
      'no-ops when upserting an empty list - %p',
      async databaseId => {
        const { pullRequests } = await createTestDatabase(
          await databases.init(databaseId),
        );
        await expect(pullRequests.upsert([])).resolves.toBeUndefined();
      },
    );
  });

  describe('readByEntityCollectorAndDeployment', () => {
    it.each(databases.eachSupportedId())(
      'returns pull requests for the given deployment - %p',
      async databaseId => {
        const { deployments, pullRequests } = await createTestDatabase(
          await databases.init(databaseId),
        );
        const { entityRef, deployment } = await seedDeployment(deployments);
        const prCollectorId = 'github:deploymentRangePullRequests';

        await pullRequests.upsert([
          {
            catalogEntityRef: entityRef,
            collectorId: prCollectorId,
            originalPrId: 'pr-1',
            firstCommitAt: new Date('2026-06-09T10:00:00.000Z'),
            deploymentId: deployment.id,
          },
          {
            catalogEntityRef: entityRef,
            collectorId: prCollectorId,
            originalPrId: 'pr-2',
            firstCommitAt: new Date('2026-06-09T11:00:00.000Z'),
            deploymentId: deployment.id,
          },
        ]);

        const rows = await pullRequests.readByEntityCollectorAndDeployment(
          entityRef,
          prCollectorId,
          deployment.id,
        );

        expect(rows.map(row => row.originalPrId)).toEqual(['pr-1', 'pr-2']);
      },
    );
  });

  describe('deleteOlderThan', () => {
    it.each(databases.eachSupportedId())(
      'deletes pull requests with first commit before the cutoff - %p',
      async databaseId => {
        const { deployments, pullRequests } = await createTestDatabase(
          await databases.init(databaseId),
        );
        const { entityRef, deployment } = await seedDeployment(deployments);
        const prCollectorId = 'github:deploymentRangePullRequests';

        await pullRequests.upsert([
          {
            catalogEntityRef: entityRef,
            collectorId: prCollectorId,
            originalPrId: 'pr-old',
            firstCommitAt: new Date('2025-01-01T00:00:00.000Z'),
            deploymentId: deployment.id,
          },
          {
            catalogEntityRef: entityRef,
            collectorId: prCollectorId,
            originalPrId: 'pr-new',
            firstCommitAt: new Date('2026-06-09T10:00:00.000Z'),
            deploymentId: deployment.id,
          },
        ]);

        const deleted = await pullRequests.deleteOlderThan(
          new Date('2026-01-01T00:00:00.000Z'),
        );
        const remaining = await pullRequests.readByEntityCollectorAndDeployment(
          entityRef,
          prCollectorId,
          deployment.id,
        );

        expect(deleted).toBe(1);
        expect(remaining.map(row => row.originalPrId)).toEqual(['pr-new']);
      },
    );
  });
});
