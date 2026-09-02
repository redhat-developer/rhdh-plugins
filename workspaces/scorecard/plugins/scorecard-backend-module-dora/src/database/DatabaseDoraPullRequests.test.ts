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
import { DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID } from '../constants';
import { collectorInputHash } from '../service/collectorHash';
import { createTestDatabase } from './__fixtures__';
import { DatabaseDoraDeployments } from './DatabaseDoraDeployments';

jest.setTimeout(60000);

const EMPTY_INPUT_HASH = collectorInputHash({});

async function seedDeployment(
  deploymentsDb: DatabaseDoraDeployments,
  options: {
    entityRef?: string;
    originalDeploymentId?: string;
    createdAt?: Date;
  } = {},
) {
  const entityRef = options.entityRef ?? 'component:default/service-a';
  const deploymentsCollectorId = DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID;
  const originalDeploymentId = options.originalDeploymentId ?? 'dep-1';
  const createdAt = options.createdAt ?? new Date('2026-06-10T10:00:00.000Z');
  await deploymentsDb.upsert([
    {
      catalogEntityRef: entityRef,
      collectorId: deploymentsCollectorId,
      collectorInputHash: EMPTY_INPUT_HASH,
      originalDeploymentId,
      commitSha: 'sha-1',
      environment: 'production',
      createdAt,
    },
  ]);
  const rows = await deploymentsDb.readByEntityCollectorAndWindow(
    entityRef,
    deploymentsCollectorId,
    EMPTY_INPUT_HASH,
    new Date('2020-01-01T00:00:00.000Z'),
    new Date('2030-01-01T00:00:00.000Z'),
  );
  const deployment = rows.find(
    row => row.originalDeploymentId === originalDeploymentId,
  );
  if (!deployment) {
    throw new Error(`Failed to seed deployment ${originalDeploymentId}`);
  }
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
            collectorInputHash: EMPTY_INPUT_HASH,
            originalPrId: 'pr-1',
            firstCommitAt: new Date('2026-06-09T10:00:00.000Z'),
            deploymentId: deployment.id,
          },
        ]);

        const rows = await pullRequests.readByEntityCollectorAndDeployment(
          entityRef,
          prCollectorId,
          EMPTY_INPUT_HASH,
          deployment.id,
        );

        expect(rows).toEqual([
          {
            id: expect.any(String),
            catalogEntityRef: entityRef,
            collectorId: prCollectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
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
            collectorInputHash: EMPTY_INPUT_HASH,
            originalPrId: 'pr-1',
            firstCommitAt: new Date('2026-06-09T10:00:00.000Z'),
            deploymentId: deployment.id,
          },
        ]);
        // Conflict on (catalog_entity_ref, collector_id, collector_input_hash, original_pr_id, deployment_id) for firstCommitAt
        await pullRequests.upsert([
          {
            catalogEntityRef: entityRef,
            collectorId: prCollectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalPrId: 'pr-1',
            firstCommitAt: new Date('2026-06-09T12:00:00.000Z'),
            deploymentId: deployment.id,
          },
        ]);

        const rows = await pullRequests.readByEntityCollectorAndDeployment(
          entityRef,
          prCollectorId,
          EMPTY_INPUT_HASH,
          deployment.id,
        );

        expect(rows).toHaveLength(1);
        expect(rows[0].firstCommitAt.toISOString()).toBe(
          '2026-06-09T12:00:00.000Z',
        );
      },
    );

    it.each(databases.eachSupportedId())(
      'treats the same original id with different input hashes as distinct - %p',
      async databaseId => {
        const { deployments, pullRequests } = await createTestDatabase(
          await databases.init(databaseId),
        );
        const { entityRef, deployment } = await seedDeployment(deployments);
        const prCollectorId = 'github:deploymentRangePullRequests';
        const otherHash = collectorInputHash({ label: 'other' });

        await pullRequests.upsert([
          {
            catalogEntityRef: entityRef,
            collectorId: prCollectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalPrId: 'pr-1',
            firstCommitAt: new Date('2026-06-09T10:00:00.000Z'),
            deploymentId: deployment.id,
          },
          {
            catalogEntityRef: entityRef,
            collectorId: prCollectorId,
            collectorInputHash: otherHash,
            originalPrId: 'pr-1',
            firstCommitAt: new Date('2026-06-09T11:00:00.000Z'),
            deploymentId: deployment.id,
          },
        ]);

        const emptyInputRows =
          await pullRequests.readByEntityCollectorAndDeployment(
            entityRef,
            prCollectorId,
            EMPTY_INPUT_HASH,
            deployment.id,
          );
        const otherInputRows =
          await pullRequests.readByEntityCollectorAndDeployment(
            entityRef,
            prCollectorId,
            otherHash,
            deployment.id,
          );

        expect(
          emptyInputRows.map(row => row.firstCommitAt.toISOString()),
        ).toEqual(['2026-06-09T10:00:00.000Z']);
        expect(
          otherInputRows.map(row => row.firstCommitAt.toISOString()),
        ).toEqual(['2026-06-09T11:00:00.000Z']);
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
            collectorInputHash: EMPTY_INPUT_HASH,
            originalPrId: 'pr-1',
            firstCommitAt: new Date('2026-06-09T10:00:00.000Z'),
            deploymentId: deployment.id,
          },
          {
            catalogEntityRef: entityRef,
            collectorId: prCollectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalPrId: 'pr-2',
            firstCommitAt: new Date('2026-06-09T11:00:00.000Z'),
            deploymentId: deployment.id,
          },
        ]);

        const rows = await pullRequests.readByEntityCollectorAndDeployment(
          entityRef,
          prCollectorId,
          EMPTY_INPUT_HASH,
          deployment.id,
        );

        expect(rows.map(row => row.originalPrId)).toEqual(['pr-1', 'pr-2']);
      },
    );
  });

  describe('deleteForDeploymentsOlderThan', () => {
    it.each(databases.eachSupportedId())(
      'deletes pull requests for deployments older than the cutoff - %p',
      async databaseId => {
        const { deployments, pullRequests } = await createTestDatabase(
          await databases.init(databaseId),
        );
        const prCollectorId = 'github:deploymentRangePullRequests';
        const { entityRef, deployment: oldDeployment } = await seedDeployment(
          deployments,
          {
            originalDeploymentId: 'dep-old',
            createdAt: new Date('2025-01-01T00:00:00.000Z'),
          },
        );
        const { deployment: newDeployment } = await seedDeployment(
          deployments,
          {
            originalDeploymentId: 'dep-new',
            createdAt: new Date('2026-06-10T00:00:00.000Z'),
          },
        );

        await pullRequests.upsert([
          {
            catalogEntityRef: entityRef,
            collectorId: prCollectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalPrId: 'pr-old',
            firstCommitAt: new Date('2026-06-09T10:00:00.000Z'),
            deploymentId: oldDeployment.id,
          },
          {
            catalogEntityRef: entityRef,
            collectorId: prCollectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalPrId: 'pr-new',
            firstCommitAt: new Date('2026-06-09T11:00:00.000Z'),
            deploymentId: newDeployment.id,
          },
        ]);

        const deleted = await pullRequests.deleteForDeploymentsOlderThan(
          new Date('2026-01-01T00:00:00.000Z'),
        );

        expect(deleted).toBe(1);
        expect(
          (
            await pullRequests.readByEntityCollectorAndDeployment(
              entityRef,
              prCollectorId,
              EMPTY_INPUT_HASH,
              oldDeployment.id,
            )
          ).map(row => row.originalPrId),
        ).toEqual([]);
        expect(
          (
            await pullRequests.readByEntityCollectorAndDeployment(
              entityRef,
              prCollectorId,
              EMPTY_INPUT_HASH,
              newDeployment.id,
            )
          ).map(row => row.originalPrId),
        ).toEqual(['pr-new']);
      },
    );
  });
});
