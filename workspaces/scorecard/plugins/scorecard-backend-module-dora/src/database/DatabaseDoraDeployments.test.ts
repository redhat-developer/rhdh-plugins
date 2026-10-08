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
  DORA_DEFAULT_DEPLOYMENT_PULL_REQUESTS_COLLECTOR_ID,
  DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
  DORA_DEFAULT_PRODUCTION_ENVIRONMENTS,
} from '../constants';
import { collectorInputHash } from '../service/collectorHash';
import { createTestDatabase } from './__fixtures__';
import { EMPTY_INPUT_HASH } from './__fixtures__/inputHash';

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
            pullRequestsCollectorId: null,
            pullRequestsCollectorInputHash: null,
          },
        ]);
      },
    );

    it.each(databases.eachSupportedId())(
      'inserts large deployment lists in 100-row batches - %p',
      async databaseId => {
        const { client, deployments } = await createTestDatabase(
          await databases.init(databaseId),
        );
        const entityRef = 'component:default/dora-deployment-batch-success';
        const collectorId = DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID;
        const rows = Array.from({ length: 205 }, (_, index) => ({
          catalogEntityRef: entityRef,
          collectorId,
          collectorInputHash: EMPTY_INPUT_HASH,
          originalDeploymentId: `dep-${index}`,
          commitSha: `sha-${index}`,
          environment: 'production',
          createdAt: new Date('2026-06-01T10:00:00.000Z'),
        }));
        const insertBindings: number[] = [];
        const onQuery = (query: {
          method?: string;
          sql: string;
          bindings?: readonly unknown[];
        }) => {
          if (
            query.method === 'insert' &&
            query.sql.includes('dora_deployments')
          ) {
            insertBindings.push(query.bindings?.length ?? 0);
          }
        };

        client.on('query', onQuery);
        try {
          await deployments.upsert(rows);
        } finally {
          client.removeListener('query', onQuery);
        }

        expect(insertBindings).toEqual([800, 800, 40]);
        const stored = await deployments.readByEntityCollectorAndWindow(
          entityRef,
          collectorId,
          EMPTY_INPUT_HASH,
          new Date('2026-06-01T00:00:00.000Z'),
          new Date('2026-06-30T00:00:00.000Z'),
        );
        expect(stored).toHaveLength(205);
        expect(new Set(stored.map(row => row.originalDeploymentId)).size).toBe(
          205,
        );
      },
    );

    it.each(databases.eachSupportedId())(
      'rolls back earlier deployment batches when a later batch fails - %p',
      async databaseId => {
        const { client, deployments } = await createTestDatabase(
          await databases.init(databaseId),
        );
        const entityRef = 'component:default/dora-deployment-batch-failure';
        const rows = Array.from({ length: 101 }, (_, index) => ({
          catalogEntityRef: entityRef,
          collectorId: DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
          collectorInputHash: EMPTY_INPUT_HASH,
          originalDeploymentId: `dep-${index}`,
          commitSha: `sha-${index}`,
          environment: 'production',
          createdAt: new Date('2026-06-01T10:00:00.000Z'),
        }));
        let insertCount = 0;
        const failSecondInsert = (query: { method?: string; sql: string }) => {
          if (
            query.method === 'insert' &&
            query.sql.includes('dora_deployments') &&
            ++insertCount === 2
          ) {
            throw new Error('second batch failed');
          }
        };

        client.on('query', failSecondInsert);
        try {
          await expect(deployments.upsert(rows)).rejects.toThrow(
            'second batch failed',
          );
        } finally {
          client.removeListener('query', failSecondInsert);
        }
        expect(insertCount).toBe(2);
        await expect(
          client('dora_deployments')
            .where('catalog_entity_ref', entityRef)
            .select('*'),
        ).resolves.toEqual([]);
      },
    );

    it.each(databases.eachSupportedId())(
      'ignores conflicts on the natural key, preserving the immutable first row - %p',
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
            environment: 'staging',
            createdAt: new Date('2026-06-12T15:00:00.000Z'),
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
        // Preserve immutable historical deployment data
        expect(rows[0].commitSha).toBe('sha-1');
        expect(rows[0].environment).toBe('production');
        expect(rows[0].createdAt.toISOString()).toBe(
          '2026-06-10T10:00:00.000Z',
        );
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
            collectorId: 'github:doraDeploymentWorkflowRuns',
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
          'github:doraDeploymentWorkflowRuns',
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
            collectorId: 'github:doraDeploymentWorkflowRuns',
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

    it.each(databases.eachSupportedId())(
      'filters by productionEnvironments including null and empty - %p',
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
            originalDeploymentId: 'dep-prod',
            commitSha: 'sha-prod',
            environment: 'production',
            createdAt: new Date('2026-06-01T10:00:00.000Z'),
          },
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalDeploymentId: 'dep-null',
            commitSha: 'sha-null',
            environment: null,
            createdAt: new Date('2026-06-02T10:00:00.000Z'),
          },
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalDeploymentId: 'dep-empty',
            commitSha: 'sha-empty',
            environment: '',
            createdAt: new Date('2026-06-03T10:00:00.000Z'),
          },
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalDeploymentId: 'dep-staging',
            commitSha: 'sha-staging',
            environment: 'staging',
            createdAt: new Date('2026-06-04T10:00:00.000Z'),
          },
        ]);

        const rows = await deployments.readByEntityCollectorAndWindow(
          entityRef,
          collectorId,
          EMPTY_INPUT_HASH,
          new Date('2026-06-01T00:00:00.000Z'),
          new Date('2026-06-30T00:00:00.000Z'),
          ['production'],
        );

        expect(rows.map(row => row.originalDeploymentId)).toEqual([
          'dep-prod',
          'dep-null',
          'dep-empty',
        ]);
      },
    );

    it.each(databases.eachSupportedId())(
      'matches productionEnvironments case-insensitively - %p',
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
            originalDeploymentId: 'dep-prod',
            commitSha: 'sha-prod',
            environment: 'Prod',
            createdAt: new Date('2026-06-01T10:00:00.000Z'),
          },
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalDeploymentId: 'dep-live',
            commitSha: 'sha-live',
            environment: 'LIVE',
            createdAt: new Date('2026-06-02T10:00:00.000Z'),
          },
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalDeploymentId: 'dep-dev',
            commitSha: 'sha-dev',
            environment: 'development',
            createdAt: new Date('2026-06-03T10:00:00.000Z'),
          },
        ]);

        const rows = await deployments.readByEntityCollectorAndWindow(
          entityRef,
          collectorId,
          EMPTY_INPUT_HASH,
          new Date('2026-06-01T00:00:00.000Z'),
          new Date('2026-06-30T00:00:00.000Z'),
          ['prod', 'live'],
        );

        expect(rows.map(row => row.originalDeploymentId)).toEqual([
          'dep-prod',
          'dep-live',
        ]);
      },
    );

    it.each(databases.eachSupportedId())(
      'returns all rows when productionEnvironments is omitted - %p',
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
            originalDeploymentId: 'dep-prod',
            commitSha: 'sha-prod',
            environment: 'production',
            createdAt: new Date('2026-06-01T10:00:00.000Z'),
          },
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalDeploymentId: 'dep-staging',
            commitSha: 'sha-staging',
            environment: 'staging',
            createdAt: new Date('2026-06-02T10:00:00.000Z'),
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
          'dep-prod',
          'dep-staging',
        ]);
      },
    );

    it.each(databases.eachSupportedId())(
      'treats empty productionEnvironments as no filter, returning all rows - %p',
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
            originalDeploymentId: 'dep-prod',
            commitSha: 'sha-prod',
            environment: 'production',
            createdAt: new Date('2026-06-01T10:00:00.000Z'),
          },
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalDeploymentId: 'dep-staging',
            commitSha: 'sha-staging',
            environment: 'staging',
            createdAt: new Date('2026-06-02T10:00:00.000Z'),
          },
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalDeploymentId: 'dep-null',
            commitSha: 'sha-null',
            environment: null,
            createdAt: new Date('2026-06-03T10:00:00.000Z'),
          },
        ]);

        const rows = await deployments.readByEntityCollectorAndWindow(
          entityRef,
          collectorId,
          EMPTY_INPUT_HASH,
          new Date('2026-06-01T00:00:00.000Z'),
          new Date('2026-06-30T00:00:00.000Z'),
          [],
        );

        expect(rows.map(row => row.originalDeploymentId)).toEqual([
          'dep-prod',
          'dep-staging',
          'dep-null',
        ]);
      },
    );
  });

  describe('readLatestByEntityCollectorBefore', () => {
    const before = new Date('2026-06-01T00:00:00.000Z');

    it.each(databases.eachSupportedId())(
      'returns the newest production row strictly before the cutoff - %p',
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
            originalDeploymentId: 'dep-oldest',
            commitSha: 'sha-oldest',
            environment: 'production',
            createdAt: new Date('2026-05-01T10:00:00.000Z'),
          },
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalDeploymentId: 'dep-staging',
            commitSha: 'sha-staging',
            environment: 'staging',
            createdAt: new Date('2026-05-31T12:00:00.000Z'),
          },
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalDeploymentId: 'dep-latest-prod',
            commitSha: 'sha-latest-prod',
            environment: 'production',
            createdAt: new Date('2026-05-31T10:00:00.000Z'),
          },
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalDeploymentId: 'dep-at-cutoff',
            commitSha: 'sha-at-cutoff',
            environment: 'production',
            createdAt: before,
          },
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalDeploymentId: 'dep-after',
            commitSha: 'sha-after',
            environment: 'production',
            createdAt: new Date('2026-06-10T10:00:00.000Z'),
          },
        ]);

        await expect(
          deployments.readLatestByEntityCollectorBefore(
            entityRef,
            collectorId,
            EMPTY_INPUT_HASH,
            before,
            DORA_DEFAULT_PRODUCTION_ENVIRONMENTS,
          ),
        ).resolves.toEqual(
          expect.objectContaining({
            originalDeploymentId: 'dep-latest-prod',
          }),
        );
      },
    );

    it.each(databases.eachSupportedId())(
      'skips a burst of later non-production deploys - %p',
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
            originalDeploymentId: 'dep-prod',
            commitSha: 'sha-prod',
            environment: 'production',
            createdAt: new Date('2026-05-01T10:00:00.000Z'),
          },
          ...Array.from({ length: 51 }, (_, index) => ({
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalDeploymentId: `dep-staging-${index}`,
            commitSha: `sha-staging-${index}`,
            environment: 'staging',
            createdAt: new Date(Date.UTC(2026, 4, 2, 0, 0, 0) + index * 60_000),
          })),
        ]);

        await expect(
          deployments.readLatestByEntityCollectorBefore(
            entityRef,
            collectorId,
            EMPTY_INPUT_HASH,
            before,
            DORA_DEFAULT_PRODUCTION_ENVIRONMENTS,
          ),
        ).resolves.toEqual(
          expect.objectContaining({
            originalDeploymentId: 'dep-prod',
          }),
        );
      },
    );

    it.each(databases.eachSupportedId())(
      'isolates collector id and input hash - %p',
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
            originalDeploymentId: 'dep-empty-hash',
            commitSha: 'sha-empty-hash',
            environment: 'production',
            createdAt: new Date('2026-05-31T10:00:00.000Z'),
          },
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: otherHash,
            originalDeploymentId: 'dep-other-hash',
            commitSha: 'sha-other-hash',
            environment: 'production',
            createdAt: new Date('2026-05-31T12:00:00.000Z'),
          },
          {
            catalogEntityRef: entityRef,
            collectorId: 'github:doraDeploymentWorkflowRuns',
            collectorInputHash: EMPTY_INPUT_HASH,
            originalDeploymentId: 'dep-other-collector',
            commitSha: 'sha-other-collector',
            environment: 'production',
            createdAt: new Date('2026-05-31T14:00:00.000Z'),
          },
        ]);

        await expect(
          deployments.readLatestByEntityCollectorBefore(
            entityRef,
            collectorId,
            EMPTY_INPUT_HASH,
            before,
            DORA_DEFAULT_PRODUCTION_ENVIRONMENTS,
          ),
        ).resolves.toEqual(
          expect.objectContaining({
            originalDeploymentId: 'dep-empty-hash',
          }),
        );
        await expect(
          deployments.readLatestByEntityCollectorBefore(
            entityRef,
            collectorId,
            otherHash,
            before,
            DORA_DEFAULT_PRODUCTION_ENVIRONMENTS,
          ),
        ).resolves.toEqual(
          expect.objectContaining({
            originalDeploymentId: 'dep-other-hash',
          }),
        );
      },
    );

    it.each(databases.eachSupportedId())(
      'returns undefined when no production row exists before the cutoff - %p',
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
            originalDeploymentId: 'dep-staging',
            commitSha: 'sha-staging',
            environment: 'staging',
            createdAt: new Date('2026-05-31T10:00:00.000Z'),
          },
        ]);

        await expect(
          deployments.readLatestByEntityCollectorBefore(
            entityRef,
            collectorId,
            EMPTY_INPUT_HASH,
            before,
            DORA_DEFAULT_PRODUCTION_ENVIRONMENTS,
          ),
        ).resolves.toBeUndefined();
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
      'sets pullRequestsCollectorId and pullRequestsCollectorInputHash on the deployment - %p',
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
        expect(deployment.pullRequestsCollectorId).toBeNull();
        expect(deployment.pullRequestsCollectorInputHash).toBeNull();

        await deployments.markPullRequestsSynced(deployment.id, {
          collectorId: DORA_DEFAULT_DEPLOYMENT_PULL_REQUESTS_COLLECTOR_ID,
          collectorInputHash: EMPTY_INPUT_HASH,
        });

        const [afterMark] = await deployments.readByEntityCollectorAndWindow(
          entityRef,
          collectorId,
          EMPTY_INPUT_HASH,
          new Date('2026-06-01T00:00:00.000Z'),
          new Date('2026-06-30T00:00:00.000Z'),
        );
        expect(afterMark.pullRequestsCollectorId).toBe(
          DORA_DEFAULT_DEPLOYMENT_PULL_REQUESTS_COLLECTOR_ID,
        );
        expect(afterMark.pullRequestsCollectorInputHash).toBe(EMPTY_INPUT_HASH);
      },
    );

    it.each(databases.eachSupportedId())(
      'pullRequestsCollectorId and pullRequestsCollectorInputHash are preserved when the deployment is re-upserted - %p',
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
        await deployments.markPullRequestsSynced(deployment.id, {
          collectorId: DORA_DEFAULT_DEPLOYMENT_PULL_REQUESTS_COLLECTOR_ID,
          collectorInputHash: EMPTY_INPUT_HASH,
        });

        // Re-upserting the same deployment (natural key conflict) does not reset the marker.
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

        const [afterUpsert] = await deployments.readByEntityCollectorAndWindow(
          entityRef,
          collectorId,
          EMPTY_INPUT_HASH,
          new Date('2026-06-01T00:00:00.000Z'),
          new Date('2026-06-30T00:00:00.000Z'),
        );
        expect(afterUpsert.pullRequestsCollectorId).toBe(
          DORA_DEFAULT_DEPLOYMENT_PULL_REQUESTS_COLLECTOR_ID,
        );
        expect(afterUpsert.pullRequestsCollectorInputHash).toBe(
          EMPTY_INPUT_HASH,
        );
      },
    );

    it.each(databases.eachSupportedId())(
      'rolls back markPullRequestsSynced when the transaction fails - %p',
      async databaseId => {
        const { deployments, pullRequests } = await createTestDatabase(
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

        await expect(
          pullRequests.transaction(async trx => {
            await deployments.markPullRequestsSynced(
              deployment.id,
              {
                collectorId: DORA_DEFAULT_DEPLOYMENT_PULL_REQUESTS_COLLECTOR_ID,
                collectorInputHash: EMPTY_INPUT_HASH,
              },
              { trx },
            );
            throw new Error('sync failed');
          }),
        ).rejects.toThrow('sync failed');

        const [afterFailure] = await deployments.readByEntityCollectorAndWindow(
          entityRef,
          collectorId,
          EMPTY_INPUT_HASH,
          new Date('2026-06-01T00:00:00.000Z'),
          new Date('2026-06-30T00:00:00.000Z'),
        );
        expect(afterFailure.pullRequestsCollectorId).toBeNull();
        expect(afterFailure.pullRequestsCollectorInputHash).toBeNull();
      },
    );
  });
});
