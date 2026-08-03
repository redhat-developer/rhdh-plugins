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

  describe('upsert', () => {
    it.each(databases.eachSupportedId())(
      'inserts deployments - %p',
      async databaseId => {
        const { deployments } = await createTestDatabase(
          await databases.init(databaseId),
        );
        const entityRef = 'component:default/service-a';
        const collectorId = 'github:deployments';

        await deployments.upsert([
          {
            catalogEntityRef: entityRef,
            collectorId,
            originalDeploymentId: 'dep-1',
            commitSha: 'sha-1',
            environment: 'production',
            createdAt: new Date('2026-06-01T10:00:00.000Z'),
            result: 'success',
          },
        ]);

        const rows = await deployments.readByEntityCollectorAndWindow(
          entityRef,
          collectorId,
          new Date('2026-06-01T00:00:00.000Z'),
          new Date('2026-06-30T00:00:00.000Z'),
        );

        expect(rows).toHaveLength(1);
        expect(rows[0].id).toEqual(expect.any(String));
        expect(rows[0].originalDeploymentId).toBe('dep-1');
        expect(rows[0].commitSha).toBe('sha-1');
      },
    );

    it.each(databases.eachSupportedId())(
      'merges updates on natural key conflict - %p',
      async databaseId => {
        const { deployments } = await createTestDatabase(
          await databases.init(databaseId),
        );
        const entityRef = 'component:default/service-a';
        const collectorId = 'github:deployments';

        await deployments.upsert([
          {
            catalogEntityRef: entityRef,
            collectorId,
            originalDeploymentId: 'dep-1',
            commitSha: 'sha-1',
            environment: 'production',
            createdAt: new Date('2026-06-10T10:00:00.000Z'),
            result: 'success',
          },
        ]);
        // Conflict on (catalog_entity_ref, collector_id, original_deployment_id) for commitSha
        await deployments.upsert([
          {
            catalogEntityRef: entityRef,
            collectorId,
            originalDeploymentId: 'dep-1',
            commitSha: 'sha-1-updated',
            environment: 'production',
            createdAt: new Date('2026-06-10T10:00:00.000Z'),
            result: 'failure',
          },
        ]);

        const rows = await deployments.readByEntityCollectorAndWindow(
          entityRef,
          collectorId,
          new Date('2026-06-01T00:00:00.000Z'),
          new Date('2026-06-30T00:00:00.000Z'),
        );

        expect(rows).toHaveLength(1);
        expect(rows[0].commitSha).toBe('sha-1-updated');
        expect(rows[0].result).toBe('failure');
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
            collectorId: 'github:deployments',
            originalDeploymentId: 'dep-1',
            commitSha: 'sha-1',
            environment: 'production',
            createdAt: new Date('2026-06-10T10:00:00.000Z'),
            result: 'success',
          },
          {
            catalogEntityRef: entityRef,
            collectorId: 'github:deploymentWorkflowRuns',
            originalDeploymentId: 'dep-1',
            commitSha: 'sha-other',
            environment: 'production',
            createdAt: new Date('2026-06-20T10:00:00.000Z'),
            result: 'success',
          },
        ]);

        const githubRows = await deployments.readByEntityCollectorAndWindow(
          entityRef,
          'github:deployments',
          new Date('2026-06-01T00:00:00.000Z'),
          new Date('2026-06-30T00:00:00.000Z'),
        );
        const workflowRows = await deployments.readByEntityCollectorAndWindow(
          entityRef,
          'github:deploymentWorkflowRuns',
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
        const collectorId = 'github:deployments';

        await deployments.upsert([
          {
            catalogEntityRef: entityRef,
            collectorId,
            originalDeploymentId: 'dep-before',
            commitSha: 'sha-before',
            environment: 'production',
            createdAt: new Date('2026-05-31T10:00:00.000Z'),
            result: 'success',
          },
          {
            catalogEntityRef: entityRef,
            collectorId,
            originalDeploymentId: 'dep-1',
            commitSha: 'sha-1',
            environment: 'production',
            createdAt: new Date('2026-06-01T10:00:00.000Z'),
            result: 'success',
          },
          {
            catalogEntityRef: entityRef,
            collectorId,
            originalDeploymentId: 'dep-2',
            commitSha: 'sha-2',
            environment: 'production',
            createdAt: new Date('2026-06-10T10:00:00.000Z'),
            result: 'success',
          },
          {
            catalogEntityRef: entityRef,
            collectorId: 'github:deploymentWorkflowRuns',
            originalDeploymentId: 'dep-other',
            commitSha: 'sha-other',
            environment: 'production',
            createdAt: new Date('2026-06-15T10:00:00.000Z'),
            result: 'success',
          },
        ]);

        const rows = await deployments.readByEntityCollectorAndWindow(
          entityRef,
          collectorId,
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
});
