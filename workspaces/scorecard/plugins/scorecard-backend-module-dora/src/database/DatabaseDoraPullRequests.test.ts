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

describe('DatabaseDoraPullRequests', () => {
  const databases = TestDatabases.create({
    ids: ['POSTGRES_15', 'SQLITE_3'],
  });

  it.each(databases.eachSupportedId())(
    'upserts and reads by deployment - %p',
    async databaseId => {
      const { deployments, pullRequests } = await createTestDatabase(
        await databases.init(databaseId),
      );
      const entityRef = 'component:default/service-a';
      const deploymentsCollectorId = 'github:deployments';
      const prCollectorId = 'github:deploymentRangePullRequests';

      await deployments.upsert([
        {
          catalogEntityRef: entityRef,
          collectorId: deploymentsCollectorId,
          originalDeploymentId: 'dep-1',
          commitSha: 'sha-1',
          environment: 'production',
          createdAt: new Date('2026-06-10T10:00:00.000Z'),
          result: 'success',
        },
      ]);
      const [deployment] = await deployments.readByEntityCollectorAndWindow(
        entityRef,
        deploymentsCollectorId,
        new Date('2026-06-01T00:00:00.000Z'),
        new Date('2026-06-30T00:00:00.000Z'),
      );

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

      expect(rows).toHaveLength(1);
      expect(rows[0].originalPrId).toBe('pr-1');
      expect(rows[0].deploymentId).toBe(deployment.id);
      expect(rows[0].id).toEqual(expect.any(String));
    },
  );

  it.each(databases.eachSupportedId())(
    'merges pull request updates on natural key conflict - %p',
    async databaseId => {
      const { deployments, pullRequests } = await createTestDatabase(
        await databases.init(databaseId),
      );
      const entityRef = 'component:default/service-a';
      const prCollectorId = 'github:deploymentRangePullRequests';

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
      ]);
      const [deployment] = await deployments.readByEntityCollectorAndWindow(
        entityRef,
        'github:deployments',
        new Date('2026-06-01T00:00:00.000Z'),
        new Date('2026-06-30T00:00:00.000Z'),
      );

      await pullRequests.upsert([
        {
          catalogEntityRef: entityRef,
          collectorId: prCollectorId,
          originalPrId: 'pr-1',
          firstCommitAt: new Date('2026-06-09T10:00:00.000Z'),
          deploymentId: deployment.id,
        },
      ]);
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
