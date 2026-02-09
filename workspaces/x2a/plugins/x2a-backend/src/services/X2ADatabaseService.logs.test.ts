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

import { mockCredentials } from '@backstage/backend-test-utils';

import {
  createDatabase,
  createService,
  defaultProjectRepoFields,
  supportedDatabaseIds,
  tearDownDatabases,
} from './__testUtils__/X2ADatabaseService.testHelpers';
import { nonExistentId } from '../utils';

describe('X2ADatabaseService – logs', () => {
  afterEach(async () => {
    await tearDownDatabases();
  });

  describe('getJobLogs', () => {
    it.each(supportedDatabaseIds)(
      'returns undefined for non-existent job - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const log = await service.getJobLogs({ jobId: nonExistentId });
        expect(log).toBeUndefined();
      },
    );

    it.each(supportedDatabaseIds)(
      'returns undefined or null when job has no log - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'D',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );
        const module = await service.createModule({
          name: 'Test Module',
          sourcePath: '/path/to/module',
          projectId: project.id,
        });
        const job = await service.createJob({
          projectId: project.id,
          moduleId: module.id,
          phase: 'init' as const,
        });

        const log = await service.getJobLogs({ jobId: job.id });
        // SQLite may return null, Postgres may return undefined when column is null
        expect(log === null).toBe(true);
      },
    );

    it.each(supportedDatabaseIds)(
      'returns log content when job has log - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'D',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );
        const module = await service.createModule({
          name: 'Test Module',
          sourcePath: '/path/to/module',
          projectId: project.id,
        });
        const logContent = 'Line 1\nLine 2\nLine 3';
        const job = await service.createJob({
          projectId: project.id,
          moduleId: module.id,
          phase: 'init' as const,
          log: logContent,
        });

        const log = await service.getJobLogs({ jobId: job.id });
        expect(log).toBe(logContent);
      },
    );

    it.each(supportedDatabaseIds)(
      'returns updated log after updateJob - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'D',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );
        const module = await service.createModule({
          name: 'Test Module',
          sourcePath: '/path/to/module',
          projectId: project.id,
        });
        const job = await service.createJob({
          projectId: project.id,
          moduleId: module.id,
          phase: 'init' as const,
          log: 'Initial log',
        });

        await service.updateJob({ id: job.id, log: 'Updated log content' });
        const log = await service.getJobLogs({ jobId: job.id });
        expect(log).toBe('Updated log content');
      },
    );
  });

  describe('getJobWithLog', () => {
    it.each(supportedDatabaseIds)(
      'returns undefined for non-existent job - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const result = await service.getJobWithLog({ id: nonExistentId });
        expect(result).toBeUndefined();
      },
    );

    it.each(supportedDatabaseIds)(
      'returns job with log property when log is set - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'D',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );
        const module = await service.createModule({
          name: 'Test Module',
          sourcePath: '/path/to/module',
          projectId: project.id,
        });
        const logContent = 'Job output log';
        const job = await service.createJob({
          projectId: project.id,
          moduleId: module.id,
          phase: 'init' as const,
          log: logContent,
        });

        const result = await service.getJobWithLog({ id: job.id });
        expect(result).toBeDefined();
        expect(result?.id).toBe(job.id);
        expect(result?.log).toBe(logContent);
        expect(result?.moduleId).toBe(module.id);
        expect(result?.artifacts).toEqual([]);
      },
    );

    it.each(supportedDatabaseIds)(
      'returns job with null/undefined log when job has no log - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'D',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );
        const module = await service.createModule({
          name: 'Test Module',
          sourcePath: '/path/to/module',
          projectId: project.id,
        });
        const job = await service.createJob({
          projectId: project.id,
          moduleId: module.id,
          phase: 'init' as const,
        });

        const result = await service.getJobWithLog({ id: job.id });
        expect(result).toBeDefined();
        expect(result?.id).toBe(job.id);
        expect(result?.log === null).toBe(true);
      },
    );
  });
});
