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

jest.setTimeout(60000);

const EMPTY_INPUT_HASH = collectorInputHash({});

describe('DatabaseDoraDeployments', () => {
  const databases = TestDatabases.create({
    ids: ['POSTGRES_15', 'SQLITE_3'],
  });

  describe('upsert', () => {
    it.each(databases.eachSupportedId())(
      'inserts deployments - %p',
      async databaseId => {
        const { deployments } = await createTestDatabase(
          await databases.init(databaseId),
        );
        const entityRef = 'component:default/service-a';
        const collectorId = DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID;

        await deployments.upsert([
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalDeploymentId: 'dep-1',
            commitSha: 'sha-1',
            environment: 'production',
            createdAt: new Date('2026-06-01T10:00:00.000Z'),
          },
        ]);

        const rows = await deployments.readByEntityCollectorAndWindow(
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
            originalDeploymentId: 'dep-1',
            commitSha: 'sha-1',
            environment: 'production',
            createdAt: new Date('2026-06-01T10:00:00.000Z'),
            pullRequestsSyncedAt: null,
          },
        ]);
      },
    );

    it.each(databases.eachSupportedId())(
      'merges updates on natural key conflict - %p',
      async databaseId => {
        const { deployments } = await createTestDatabase(
          await databases.init(databaseId),
        );
        const entityRef = 'component:default/service-a';
        const collectorId = DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID;

        await deployments.upsert([
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalDeploymentId: 'dep-1',
            commitSha: 'sha-1',
            environment: 'production',
            createdAt: new Date('2026-06-10T10:00:00.000Z'),
          },
        ]);
        // Conflict on (catalog_entity_ref, collector_id, collector_input_hash, original_deployment_id) for commitSha
        await deployments.upsert([
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalDeploymentId: 'dep-1',
            commitSha: 'sha-1-updated',
            environment: 'production',
            createdAt: new Date('2026-06-10T10:00:00.000Z'),
          },
        ]);

        const rows = await deployments.readByEntityCollectorAndWindow(
          entityRef,
          collectorId,
          EMPTY_INPUT_HASH,
          new Date('2026-06-01T00:00:00.000Z'),
          new Date('2026-06-30T00:00:00.000Z'),
        );

        expect(rows).toHaveLength(1);
        expect(rows[0].commitSha).toBe('sha-1-updated');
      },
    );

    it.each(databases.eachSupportedId())(
      'treats the same original id from different collectors as distinct - %p',
      async databaseId => {
        const { deployments } = await createTestDatabase(
          await databases.init(databaseId),
        );
        const entityRef = 'component:default/service-a';

        await deployments.upsert([
          {
            catalogEntityRef: entityRef,
            collectorId: DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalDeploymentId: 'dep-1',
            commitSha: 'sha-1',
            environment: 'production',
            createdAt: new Date('2026-06-10T10:00:00.000Z'),
          },
          {
            catalogEntityRef: entityRef,
            collectorId: 'github:deploymentWorkflowRuns',
            collectorInputHash: EMPTY_INPUT_HASH,
            originalDeploymentId: 'dep-1',
            commitSha: 'sha-other',
            environment: 'production',
            createdAt: new Date('2026-06-20T10:00:00.000Z'),
          },
        ]);

        const githubRows = await deployments.readByEntityCollectorAndWindow(
          entityRef,
          DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
          EMPTY_INPUT_HASH,
          new Date('2026-06-01T00:00:00.000Z'),
          new Date('2026-06-30T00:00:00.000Z'),
        );
        const workflowRows = await deployments.readByEntityCollectorAndWindow(
          entityRef,
          'github:deploymentWorkflowRuns',
          EMPTY_INPUT_HASH,
          new Date('2026-06-01T00:00:00.000Z'),
          new Date('2026-06-30T00:00:00.000Z'),
        );

        expect(githubRows).toHaveLength(1);
        expect(githubRows[0].commitSha).toBe('sha-1');
        expect(workflowRows).toHaveLength(1);
        expect(workflowRows[0].commitSha).toBe('sha-other');
      },
    );

    it.each(databases.eachSupportedId())(
      'treats the same original id with different input hashes as distinct - %p',
      async databaseId => {
        const { deployments } = await createTestDatabase(
          await databases.init(databaseId),
        );
        const entityRef = 'component:default/service-a';
        const collectorId = DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID;
        const otherHash = collectorInputHash({ workflowName: 'Deploy B' });

        await deployments.upsert([
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalDeploymentId: 'dep-1',
            commitSha: 'sha-a',
            environment: 'production',
            createdAt: new Date('2026-06-10T10:00:00.000Z'),
          },
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: otherHash,
            originalDeploymentId: 'dep-1',
            commitSha: 'sha-b',
            environment: 'production',
            createdAt: new Date('2026-06-20T10:00:00.000Z'),
          },
        ]);

        const emptyInputRows = await deployments.readByEntityCollectorAndWindow(
          entityRef,
          collectorId,
          EMPTY_INPUT_HASH,
          new Date('2026-06-01T00:00:00.000Z'),
          new Date('2026-06-30T00:00:00.000Z'),
        );
        const otherInputRows = await deployments.readByEntityCollectorAndWindow(
          entityRef,
          collectorId,
          otherHash,
          new Date('2026-06-01T00:00:00.000Z'),
          new Date('2026-06-30T00:00:00.000Z'),
        );

        expect(emptyInputRows).toHaveLength(1);
        expect(emptyInputRows[0].commitSha).toBe('sha-a');
        expect(otherInputRows).toHaveLength(1);
        expect(otherInputRows[0].commitSha).toBe('sha-b');
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

  describe('readByEntityCollectorAndWindow', () => {
    it.each(databases.eachSupportedId())(
      'returns rows in the window for the given collector - %p',
      async databaseId => {
        const { deployments } = await createTestDatabase(
          await databases.init(databaseId),
        );
        const entityRef = 'component:default/service-a';
        const collectorId = DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID;

        await deployments.upsert([
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalDeploymentId: 'dep-before',
            commitSha: 'sha-before',
            environment: 'production',
            createdAt: new Date('2026-05-31T10:00:00.000Z'),
          },
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalDeploymentId: 'dep-1',
            commitSha: 'sha-1',
            environment: 'production',
            createdAt: new Date('2026-06-01T10:00:00.000Z'),
          },
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalDeploymentId: 'dep-2',
            commitSha: 'sha-2',
            environment: 'production',
            createdAt: new Date('2026-06-10T10:00:00.000Z'),
          },
          {
            catalogEntityRef: entityRef,
            collectorId: 'github:deploymentWorkflowRuns',
            collectorInputHash: EMPTY_INPUT_HASH,
            originalDeploymentId: 'dep-other',
            commitSha: 'sha-other',
            environment: 'production',
            createdAt: new Date('2026-06-15T10:00:00.000Z'),
          },
        ]);

        const rows = await deployments.readByEntityCollectorAndWindow(
          entityRef,
          collectorId,
          EMPTY_INPUT_HASH,
          new Date('2026-06-01T00:00:00.000Z'),
          new Date('2026-06-30T00:00:00.000Z'),
        );

        expect(rows.map(row => row.originalDeploymentId)).toEqual([
          'dep-1',
          'dep-2',
        ]);
      },
    );
  });

  describe('deleteOlderThan', () => {
    it.each(databases.eachSupportedId())(
      'deletes deployments created before the cutoff - %p',
      async databaseId => {
        const { deployments } = await createTestDatabase(
          await databases.init(databaseId),
        );
        const entityRef = 'component:default/service-a';
        const collectorId = DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID;

        await deployments.upsert([
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalDeploymentId: 'dep-old',
            commitSha: 'sha-old',
            environment: 'production',
            createdAt: new Date('2025-01-01T00:00:00.000Z'),
          },
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalDeploymentId: 'dep-new',
            commitSha: 'sha-new',
            environment: 'production',
            createdAt: new Date('2026-06-10T00:00:00.000Z'),
          },
        ]);

        const deleted = await deployments.deleteOlderThan(
          new Date('2026-01-01T00:00:00.000Z'),
        );
        const remaining = await deployments.readByEntityCollectorAndWindow(
          entityRef,
          collectorId,
          EMPTY_INPUT_HASH,
          new Date('2025-01-01T00:00:00.000Z'),
          new Date('2026-12-31T00:00:00.000Z'),
        );

        expect(deleted).toBe(1);
        expect(remaining.map(row => row.originalDeploymentId)).toEqual([
          'dep-new',
        ]);
      },
    );
  });

  describe('markPullRequestsSynced', () => {
    it.each(databases.eachSupportedId())(
      'sets pullRequestsSyncedAt on the deployment - %p',
      async databaseId => {
        const { deployments } = await createTestDatabase(
          await databases.init(databaseId),
        );
        const entityRef = 'component:default/service-a';
        const collectorId = DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID;

        await deployments.upsert([
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalDeploymentId: 'dep-1',
            commitSha: 'sha-1',
            environment: 'production',
            createdAt: new Date('2026-06-10T10:00:00.000Z'),
          },
        ]);
        const [deployment] = await deployments.readByEntityCollectorAndWindow(
          entityRef,
          collectorId,
          EMPTY_INPUT_HASH,
          new Date('2026-06-01T00:00:00.000Z'),
          new Date('2026-06-30T00:00:00.000Z'),
        );
        expect(deployment.pullRequestsSyncedAt).toBeNull();

        const syncedAt = new Date('2026-06-11T00:00:00.000Z');
        await deployments.markPullRequestsSynced(deployment.id, syncedAt);

        const [afterMark] = await deployments.readByEntityCollectorAndWindow(
          entityRef,
          collectorId,
          EMPTY_INPUT_HASH,
          new Date('2026-06-01T00:00:00.000Z'),
          new Date('2026-06-30T00:00:00.000Z'),
        );
        expect(afterMark.pullRequestsSyncedAt).toEqual(syncedAt);
      },
    );

    it.each(databases.eachSupportedId())(
      'preserves pullRequestsSyncedAt when the deployment is re-upserted - %p',
      async databaseId => {
        const { deployments } = await createTestDatabase(
          await databases.init(databaseId),
        );
        const entityRef = 'component:default/service-a';
        const collectorId = DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID;

        await deployments.upsert([
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalDeploymentId: 'dep-1',
            commitSha: 'sha-1',
            environment: 'production',
            createdAt: new Date('2026-06-10T10:00:00.000Z'),
          },
        ]);
        const [deployment] = await deployments.readByEntityCollectorAndWindow(
          entityRef,
          collectorId,
          EMPTY_INPUT_HASH,
          new Date('2026-06-01T00:00:00.000Z'),
          new Date('2026-06-30T00:00:00.000Z'),
        );
        const syncedAt = new Date('2026-06-11T00:00:00.000Z');
        await deployments.markPullRequestsSynced(deployment.id, syncedAt);

        // Re-upserting the same deployment (natural key conflict) must not reset
        // the marker.
        await deployments.upsert([
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalDeploymentId: 'dep-1',
            commitSha: 'sha-1-updated',
            environment: 'production',
            createdAt: new Date('2026-06-10T10:00:00.000Z'),
          },
        ]);

        const [afterUpsert] = await deployments.readByEntityCollectorAndWindow(
          entityRef,
          collectorId,
          EMPTY_INPUT_HASH,
          new Date('2026-06-01T00:00:00.000Z'),
          new Date('2026-06-30T00:00:00.000Z'),
        );
        expect(afterUpsert.commitSha).toBe('sha-1-updated');
        expect(afterUpsert.pullRequestsSyncedAt).toEqual(syncedAt);
      },
    );
  });
});
