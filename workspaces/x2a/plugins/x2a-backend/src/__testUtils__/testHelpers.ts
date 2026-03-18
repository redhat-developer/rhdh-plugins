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

import { Knex } from 'knex';
import {
  mockServices,
  TestDatabaseId,
  TestDatabases,
} from '@backstage/backend-test-utils';
import {
  Artifact,
  ArtifactType,
  MigrationPhase,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { X2ADatabaseService } from '../services/X2ADatabaseService';
import { migrate } from '../services/dbMigrate';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const LONG_TEST_TIMEOUT = 60 * 1000;
export const nonExistentId = '00000000-0000-0000-0000-000000000000';

export const TEST_DATABASE_IDS: TestDatabaseId[] = ['SQLITE_3', 'POSTGRES_18'];

// ---------------------------------------------------------------------------
// Database lifecycle
// ---------------------------------------------------------------------------

const databases = TestDatabases.create({
  ids: TEST_DATABASE_IDS,
});

export const supportedDatabaseIds = databases.eachSupportedId();

const clientsToDestroy: Knex[] = [];

export async function createDatabase(databaseId: TestDatabaseId) {
  const client = await databases.init(databaseId);
  clientsToDestroy.push(client);
  const mockDatabaseService = mockServices.database.mock({
    getClient: async () => client,
    migrations: { skip: false },
  });
  await migrate(mockDatabaseService);
  return { client };
}

export function createService(client: Knex): X2ADatabaseService {
  return X2ADatabaseService.create({
    logger: mockServices.logger.mock(),
    dbClient: client,
  });
}

export async function createDatabaseAndService(databaseId: TestDatabaseId) {
  const { client } = await createDatabase(databaseId);
  const x2aDatabase = createService(client);
  return { client, x2aDatabase };
}

export function tearDownDatabases(): Promise<void> {
  return Promise.all(
    clientsToDestroy.splice(0).map(client => client.destroy()),
  ).then(() => undefined);
}

// ---------------------------------------------------------------------------
// Test data builders
// ---------------------------------------------------------------------------

export const defaultProjectRepoFields = {
  sourceRepoUrl: 'https://github.com/source/repo',
  targetRepoUrl: 'https://github.com/target/repo',
  sourceRepoBranch: 'main',
  targetRepoBranch: 'main',
};

/** Build Artifact[] from value strings (type defaults to 'migrated_sources'). */
export function artifactsFromValues(
  values: string[],
  type: ArtifactType = 'migrated_sources',
): Pick<Artifact, 'type' | 'value'>[] {
  return values.map(value => ({ type, value }));
}

export const getTestArtifacts = (
  phase: MigrationPhase,
): Pick<Artifact, 'type' | 'value'>[] => {
  const artifacts: Pick<Artifact, 'type' | 'value'>[] = [];
  if (phase === 'init') {
    artifacts.push({
      value: 'migration_plan',
      type: 'migration_plan',
    });
  } else if (phase === 'analyze') {
    artifacts.push({
      value: 'module_migration_plan',
      type: 'module_migration_plan',
    });
  } else if (phase === 'migrate') {
    artifacts.push({
      value: 'migrated_sources',
      type: 'migrated_sources',
    });
  }
  return artifacts;
};
