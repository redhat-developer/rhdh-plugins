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
  createDatabase,
  supportedDatabaseIds,
  tearDownDatabases,
} from '../../__testUtils__';
import {
  up,
  down,
} from '../../../migrations/2026081900_expand_jobs_constraints';

const PROJECT_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const JOB_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

describe('migration 2026081900_expand_jobs_constraints', () => {
  afterEach(async () => {
    await tearDownDatabases();
  });

  it.each(supportedDatabaseIds)(
    'up() preserves job columns after table recreation - %p',
    async databaseId => {
      const { client } = await createDatabase(databaseId);

      await client('projects').insert({
        id: PROJECT_ID,
        name: 'Test Project',
        dir_name: 'test-project',
        source_repo_url: 'https://github.com/source/repo',
        source_repo_branch: 'main',
        target_repo_url: 'https://github.com/target/repo',
        target_repo_branch: 'main',
        owned_by: 'test-user',
      });

      await client('jobs').insert({
        id: JOB_ID,
        project_id: PROJECT_ID,
        status: 'success',
        phase: 'analyze',
        started_at: new Date('2026-01-01T00:00:00Z'),
        error_details: 'some error detail',
      });

      // Round-trip through down() and up() exercises the SQLite table-recreation
      // path and verifies the named-column INSERT maps values correctly.
      await down(client);
      await up(client);

      const [row] = await client('jobs')
        .where({ id: JOB_ID })
        .select('project_id', 'error_details', 'status', 'phase');

      expect(row.project_id).toBe(PROJECT_ID);
      expect(row.error_details).toBe('some error detail');
      expect(row.status).toBe('success');
      expect(row.phase).toBe('analyze');
    },
  );
});
