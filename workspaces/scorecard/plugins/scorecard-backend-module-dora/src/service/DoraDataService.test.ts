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

import {
  type TestDatabaseId,
  TestDatabases,
} from '@backstage/backend-test-utils';
import {
  DORA_DEFAULT_DEPLOYMENT_PULL_REQUESTS_COLLECTOR_ID,
  DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
  DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
} from '../constants';
import { collectorInputHash } from './collectorHash';
import { createTestDatabase } from '../database/__fixtures__';
import { DefaultDoraDataService } from './DoraDataService';

jest.setTimeout(60000);

const EMPTY_INPUT_HASH = collectorInputHash({});

describe('DefaultDoraDataService', () => {
  const databases = TestDatabases.create({
    ids: ['POSTGRES_15', 'SQLITE_3'],
  });

  async function createService(databaseId: TestDatabaseId) {
    const { deployments, incidents, pullRequests } = await createTestDatabase(
      await databases.init(databaseId),
    );

    return {
      deploymentsDb: deployments,
      incidentsDb: incidents,
      pullRequestsDb: pullRequests,
      dataService: new DefaultDoraDataService(
        deployments,
        incidents,
        pullRequests,
      ),
    };
  }

  describe('readDeployments', () => {
    it.each(databases.eachSupportedId())(
      'returns persisted deployment rows - %p',
      async databaseId => {
        const { deploymentsDb, dataService } = await createService(databaseId);
        const entityRef = 'component:default/service-a';
        const collectorId = DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID;
        const deploymentId = 'dep-1';

        await deploymentsDb.upsert([
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalDeploymentId: deploymentId,
            commitSha: 'sha-1',
            environment: 'production',
            createdAt: new Date('2026-06-10T10:00:00.000Z'),
          },
        ]);

        await expect(
          dataService.readDeployments(entityRef, {
            windowFrom: new Date('2026-06-01T00:00:00.000Z'),
            windowTo: new Date('2026-06-30T00:00:00.000Z'),
            collector: {
              id: collectorId,
              input: {},
              inputHash: EMPTY_INPUT_HASH,
            },
          }),
        ).resolves.toEqual([
          {
            id: expect.any(String),
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalDeploymentId: deploymentId,
            commitSha: 'sha-1',
            environment: 'production',
            createdAt: new Date('2026-06-10T10:00:00.000Z'),
          },
        ]);
      },
    );
  });

  describe('readIncidents', () => {
    it.each(databases.eachSupportedId())(
      'returns persisted incident rows - %p',
      async databaseId => {
        const { incidentsDb, dataService } = await createService(databaseId);
        const entityRef = 'component:default/service-a';
        const collectorId = DORA_DEFAULT_INCIDENTS_COLLECTOR_ID;

        await incidentsDb.upsert([
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalIncidentId: 'INC-1',
            createdAt: new Date('2026-06-11T10:00:00.000Z'),
            updatedAt: new Date('2026-06-11T12:00:00.000Z'),
            resolutionAt: new Date('2026-06-11T12:00:00.000Z'),
          },
        ]);

        await expect(
          dataService.readIncidents(entityRef, {
            windowFrom: new Date('2026-06-01T00:00:00.000Z'),
            windowTo: new Date('2026-06-30T00:00:00.000Z'),
            collector: {
              id: collectorId,
              input: {},
              inputHash: EMPTY_INPUT_HASH,
            },
          }),
        ).resolves.toEqual([
          {
            id: expect.any(String),
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalIncidentId: 'INC-1',
            createdAt: new Date('2026-06-11T10:00:00.000Z'),
            updatedAt: new Date('2026-06-11T12:00:00.000Z'),
            resolutionAt: new Date('2026-06-11T12:00:00.000Z'),
          },
        ]);
      },
    );
  });

  describe('readPullRequestsForDeployment', () => {
    it.each(databases.eachSupportedId())(
      'returns persisted pull request rows for a deployment row id - %p',
      async databaseId => {
        const { deploymentsDb, pullRequestsDb, dataService } =
          await createService(databaseId);
        const entityRef = 'component:default/service-a';
        const deploymentsCollectorId = DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID;
        const prCollectorId =
          DORA_DEFAULT_DEPLOYMENT_PULL_REQUESTS_COLLECTOR_ID;

        await deploymentsDb.upsert([
          {
            catalogEntityRef: entityRef,
            collectorId: deploymentsCollectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalDeploymentId: 'dep-1',
            commitSha: 'sha-1',
            environment: 'production',
            createdAt: new Date('2026-06-10T10:00:00.000Z'),
          },
        ]);
        const [deployment] = await deploymentsDb.readByEntityCollectorAndWindow(
          entityRef,
          deploymentsCollectorId,
          EMPTY_INPUT_HASH,
          new Date('2026-06-01T00:00:00.000Z'),
          new Date('2026-06-30T00:00:00.000Z'),
        );

        await pullRequestsDb.upsert([
          {
            catalogEntityRef: entityRef,
            collectorId: prCollectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalPrId: 'pr-1',
            firstCommitAt: new Date('2026-06-09T10:00:00.000Z'),
            deploymentId: deployment.id,
          },
        ]);

        await expect(
          dataService.readPullRequestsForDeployment(entityRef, {
            collector: {
              id: prCollectorId,
              input: {},
              inputHash: EMPTY_INPUT_HASH,
            },
            deploymentId: deployment.id,
          }),
        ).resolves.toEqual([
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
  });
});
