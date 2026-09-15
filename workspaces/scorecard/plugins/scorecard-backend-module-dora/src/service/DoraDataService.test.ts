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
  DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
  DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
  DORA_DEFAULT_PRODUCTION_ENVIRONMENTS,
} from '../constants';
import { createTestDatabase, EMPTY_INPUT_HASH } from '../database/__fixtures__';
import { DefaultDoraDataService } from './DoraDataService';

jest.setTimeout(60000);

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
            pullRequestsCollectorId: null,
            pullRequestsCollectorInputHash: null,
          },
        ]);
      },
    );
  });

  describe('readLatestProductionDeploymentBefore', () => {
    const before = new Date('2026-06-01T00:00:00.000Z');

    it.each(databases.eachSupportedId())(
      'returns the latest production deployment strictly before the cutoff - %p',
      async databaseId => {
        const { deploymentsDb, dataService } = await createService(databaseId);
        const entityRef = 'component:default/service-a';
        const collectorId = DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID;

        await deploymentsDb.upsert([
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalDeploymentId: 'dep-older-prod',
            commitSha: 'sha-older-prod',
            environment: 'production',
            createdAt: new Date('2026-05-01T10:00:00.000Z'),
          },
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalDeploymentId: 'dep-latest-prod',
            commitSha: 'sha-latest-prod',
            environment: 'production',
            createdAt: new Date('2026-05-20T10:00:00.000Z'),
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
            originalDeploymentId: 'dep-in-window',
            commitSha: 'sha-in-window',
            environment: 'production',
            createdAt: new Date('2026-06-10T10:00:00.000Z'),
          },
        ]);

        await expect(
          dataService.readLatestProductionDeploymentBefore(entityRef, {
            before,
            productionEnvironments: DORA_DEFAULT_PRODUCTION_ENVIRONMENTS,
            collector: {
              id: collectorId,
              input: {},
              inputHash: EMPTY_INPUT_HASH,
            },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            originalDeploymentId: 'dep-latest-prod',
            commitSha: 'sha-latest-prod',
          }),
        );
      },
    );

    it.each(databases.eachSupportedId())(
      'skips a more recent non-production deploy to return the last production deploy - %p',
      async databaseId => {
        const { deploymentsDb, dataService } = await createService(databaseId);
        const entityRef = 'component:default/service-a';
        const collectorId = DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID;

        await deploymentsDb.upsert([
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalDeploymentId: 'dep-prod',
            commitSha: 'sha-prod',
            environment: 'production',
            createdAt: new Date('2026-05-10T10:00:00.000Z'),
          },
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
          dataService.readLatestProductionDeploymentBefore(entityRef, {
            before,
            productionEnvironments: DORA_DEFAULT_PRODUCTION_ENVIRONMENTS,
            collector: {
              id: collectorId,
              input: {},
              inputHash: EMPTY_INPUT_HASH,
            },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            originalDeploymentId: 'dep-prod',
          }),
        );
      },
    );

    it.each(databases.eachSupportedId())(
      'treats a null environment as production - %p',
      async databaseId => {
        const { deploymentsDb, dataService } = await createService(databaseId);
        const entityRef = 'component:default/service-a';
        const collectorId = DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID;

        await deploymentsDb.upsert([
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalDeploymentId: 'dep-null-env',
            commitSha: 'sha-null-env',
            environment: null,
            createdAt: new Date('2026-05-31T10:00:00.000Z'),
          },
        ]);

        await expect(
          dataService.readLatestProductionDeploymentBefore(entityRef, {
            before,
            productionEnvironments: DORA_DEFAULT_PRODUCTION_ENVIRONMENTS,
            collector: {
              id: collectorId,
              input: {},
              inputHash: EMPTY_INPUT_HASH,
            },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            originalDeploymentId: 'dep-null-env',
          }),
        );
      },
    );

    it.each(databases.eachSupportedId())(
      'returns undefined when only non-production deployments exist before the cutoff - %p',
      async databaseId => {
        const { deploymentsDb, dataService } = await createService(databaseId);
        const entityRef = 'component:default/service-a';
        const collectorId = DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID;

        await deploymentsDb.upsert([
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
          dataService.readLatestProductionDeploymentBefore(entityRef, {
            before,
            productionEnvironments: DORA_DEFAULT_PRODUCTION_ENVIRONMENTS,
            collector: {
              id: collectorId,
              input: {},
              inputHash: EMPTY_INPUT_HASH,
            },
          }),
        ).resolves.toBeUndefined();
      },
    );

    it.each(databases.eachSupportedId())(
      'returns undefined when there are no deployments before the cutoff - %p',
      async databaseId => {
        const { dataService } = await createService(databaseId);

        await expect(
          dataService.readLatestProductionDeploymentBefore(
            'component:default/service-a',
            {
              before,
              productionEnvironments: DORA_DEFAULT_PRODUCTION_ENVIRONMENTS,
              collector: {
                id: DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
                input: {},
                inputHash: EMPTY_INPUT_HASH,
              },
            },
          ),
        ).resolves.toBeUndefined();
      },
    );

    it.each(databases.eachSupportedId())(
      'uses configured productionEnvironments when selecting the latest deploy - %p',
      async databaseId => {
        const { deploymentsDb, dataService } = await createService(databaseId);
        const entityRef = 'component:default/service-a';
        const collectorId = DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID;

        await deploymentsDb.upsert([
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalDeploymentId: 'dep-default-prod',
            commitSha: 'sha-default-prod',
            environment: 'production',
            createdAt: new Date('2026-05-20T10:00:00.000Z'),
          },
          {
            catalogEntityRef: entityRef,
            collectorId,
            collectorInputHash: EMPTY_INPUT_HASH,
            originalDeploymentId: 'dep-prod-alias',
            commitSha: 'sha-prod-alias',
            environment: 'prod',
            createdAt: new Date('2026-05-31T10:00:00.000Z'),
          },
        ]);

        await expect(
          dataService.readLatestProductionDeploymentBefore(entityRef, {
            before,
            productionEnvironments: ['prod'],
            collector: {
              id: collectorId,
              input: {},
              inputHash: EMPTY_INPUT_HASH,
            },
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            originalDeploymentId: 'dep-prod-alias',
          }),
        );
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
            originalPrId: 'pr-1',
            firstCommitAt: new Date('2026-06-09T10:00:00.000Z'),
            deploymentId: deployment.id,
          },
        ]);

        await expect(
          dataService.readPullRequestsForDeployment(entityRef, {
            deploymentId: deployment.id,
          }),
        ).resolves.toEqual([
          {
            id: expect.any(String),
            catalogEntityRef: entityRef,
            originalPrId: 'pr-1',
            firstCommitAt: new Date('2026-06-09T10:00:00.000Z'),
            deploymentId: deployment.id,
          },
        ]);
      },
    );
  });
});
