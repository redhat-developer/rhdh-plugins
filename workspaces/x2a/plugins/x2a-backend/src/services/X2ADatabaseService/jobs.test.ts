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
  Artifact,
  toSorted,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import {
  artifactsFromValues,
  createDatabase,
  createService,
  defaultProjectRepoFields,
  supportedDatabaseIds,
  tearDownDatabases,
} from './__testUtils__/testHelpers';
import { delay, LONG_TEST_TIMEOUT, nonExistentId } from '../../utils';

describe('X2ADatabaseService – jobs', () => {
  afterEach(async () => {
    await tearDownDatabases();
  });

  describe('createJob', () => {
    it.each(supportedDatabaseIds)(
      'creates a job with required fields and defaults status to pending - %p',
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
        const jobInput = {
          projectId: project.id,
          moduleId: module.id,
          phase: 'init' as const,
        };

        const job = await service.createJob(jobInput);

        expect(job).toMatchObject({
          moduleId: module.id,
          status: 'pending',
          artifacts: [],
        });
        expect(job.id).toBeDefined();
        expect(job.startedAt).toBeInstanceOf(Date);
        expect(job.finishedAt).toBeUndefined();

        const row = await client('jobs').where('id', job.id).first();
        expect(row).toBeDefined();
        expect(row.module_id).toBe(module.id);
        expect(row.status).toBe('pending');
        expect(row.log).toBeNull();
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'creates a job with optional fields (log, startedAt, finishedAt, status) - %p',
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
        const startedAt = new Date('2026-01-24T10:00:00Z');
        const finishedAt = new Date('2026-01-24T11:00:00Z');
        const jobInput = {
          projectId: project.id,
          moduleId: module.id,
          phase: 'init' as const,
          log: 'Job log content',
          startedAt,
          finishedAt,
          status: 'success' as const,
        };

        const job = await service.createJob(jobInput);

        expect(job).toMatchObject({
          moduleId: module.id,
          status: 'success',
          artifacts: [],
        });
        expect(job.startedAt).toEqual(startedAt);
        expect(job.finishedAt).toEqual(finishedAt);

        const row = await client('jobs').where('id', job.id).first();
        expect(row.log).toBe(jobInput.log);
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'creates a job with artifacts and persists them - %p',
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
        const artifacts: Pick<Artifact, 'type' | 'value'>[] = [
          { type: 'migration_plan', value: 'http://example.com/artifact1.md' },
          {
            type: 'module_migration_plan',
            value: 'http://example.com/artifact2.md',
          },
          { type: 'migrated_sources', value: 'http://example.com/artifact3' },
        ];

        const job = await service.createJob({
          projectId: project.id,
          moduleId: module.id,
          phase: 'init' as const,
          artifacts,
        });

        expect(job.artifacts).toHaveLength(3);
        for (const expected of artifacts) {
          const found = job.artifacts!.find(
            a => a.type === expected.type && a.value === expected.value,
          );
          expect(found).toBeDefined();
          expect(found!.id).toBeDefined();
        }

        const artifactRows = await client('artifacts')
          .where('job_id', job.id)
          .select('id', 'type', 'value')
          .orderBy('id', 'asc');
        expect(artifactRows).toHaveLength(3);
        const sortByType = (a: { type: string }, b: { type: string }) =>
          toSorted(a.type, b.type);
        expect(
          artifactRows
            .map(r => ({ type: r.type, value: r.value }))
            .sort(sortByType),
        ).toEqual(
          artifacts
            .map(a => ({ type: a.type, value: a.value }))
            .sort(sortByType),
        );
      },
    );

    it.each(supportedDatabaseIds)(
      'creates multiple jobs with different IDs - %p',
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

        const job1 = await service.createJob({
          projectId: project.id,
          moduleId: module.id,
          phase: 'init' as const,
        });
        const job2 = await service.createJob({
          projectId: project.id,
          moduleId: module.id,
          phase: 'init' as const,
        });

        expect(job1.id).not.toBe(job2.id);
        expect(job1.moduleId).toBe(module.id);
        expect(job2.moduleId).toBe(module.id);
      },
    );

    it.each(supportedDatabaseIds)(
      'creates jobs for different modules - %p',
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
        const module1 = await service.createModule({
          name: 'Module 1',
          sourcePath: '/path/to/module1',
          projectId: project.id,
        });
        const module2 = await service.createModule({
          name: 'Module 2',
          sourcePath: '/path/to/module2',
          projectId: project.id,
        });

        const job1 = await service.createJob({
          projectId: project.id,
          moduleId: module1.id,
          phase: 'init' as const,
        });
        const job2 = await service.createJob({
          projectId: project.id,
          moduleId: module2.id,
          phase: 'init' as const,
        });

        expect(job1.moduleId).toBe(module1.id);
        expect(job2.moduleId).toBe(module2.id);
      },
    );

    it.each(supportedDatabaseIds)(
      'creates project-level job when moduleId is omitted - %p',
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

        const job = await service.createJob({
          projectId: project.id,
          phase: 'init' as const,
        });

        expect(job.id).toBeDefined();
        expect(job.projectId).toBe(project.id);
        expect(job.moduleId).toBeUndefined();
        const row = await client('jobs').where('id', job.id).first();
        expect(row.module_id).toBeNull();
      },
    );
  });

  describe('getJob', () => {
    it.each(supportedDatabaseIds)(
      'returns undefined for non-existent job - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const job = await service.getJob({ id: nonExistentId });
        expect(job).toBeUndefined();
      },
    );

    it.each(supportedDatabaseIds)(
      'returns the job by ID (without log column) - %p',
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
        const created = await service.createJob({
          projectId: project.id,
          moduleId: module.id,
          phase: 'init' as const,
          log: 'Test log',
          status: 'running',
        });

        const retrieved = await service.getJob({ id: created.id });
        expect(retrieved).toBeDefined();
        expect(retrieved?.id).toBe(created.id);
        expect(retrieved?.moduleId).toBe(module.id);
        expect(retrieved?.status).toBe('running');
        expect(retrieved?.artifacts).toEqual([]);
      },
    );

    it.each(supportedDatabaseIds)(
      'returns job with artifacts - %p',
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
        const artifacts = artifactsFromValues(['file1.txt', 'file2.json']);
        const created = await service.createJob({
          projectId: project.id,
          moduleId: module.id,
          phase: 'init' as const,
          artifacts,
        });

        const retrieved = await service.getJob({ id: created.id });
        expect(retrieved).toBeDefined();
        expect(retrieved?.artifacts).toHaveLength(2);
        const values = (retrieved?.artifacts ?? [])
          .map(a => a.value)
          .sort(toSorted);
        expect(values).toEqual(['file1.txt', 'file2.json'].sort(toSorted));
      },
    );

    it.each(supportedDatabaseIds)(
      'returns correct job when multiple exist - %p',
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
        const job1 = await service.createJob({
          projectId: project.id,
          moduleId: module.id,
          phase: 'init' as const,
          status: 'pending',
        });
        const job2 = await service.createJob({
          projectId: project.id,
          moduleId: module.id,
          phase: 'init' as const,
          status: 'running',
        });

        const r1 = await service.getJob({ id: job1.id });
        const r2 = await service.getJob({ id: job2.id });
        expect(r1?.id).toBe(job1.id);
        expect(r1?.status).toBe('pending');
        expect(r2?.id).toBe(job2.id);
        expect(r2?.status).toBe('running');
      },
    );
  });

  describe('listJobs', () => {
    it.each(supportedDatabaseIds)(
      'returns empty list when no jobs exist (with or without lastJobOnly) - %p',
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

        const jobs = await service.listJobs({
          projectId: project.id,
          moduleId: module.id,
        });
        expect(jobs).toEqual([]);

        const lastOnly = await service.listJobs({
          projectId: project.id,
          moduleId: module.id,
          lastJobOnly: true,
        });
        expect(lastOnly).toEqual([]);
      },
    );

    it.each(supportedDatabaseIds)(
      'returns all jobs for module ordered by started_at desc - %p',
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
        const job1 = await service.createJob({
          projectId: project.id,
          moduleId: module.id,
          phase: 'init' as const,
          status: 'pending',
        });
        const job2 = await service.createJob({
          projectId: project.id,
          moduleId: module.id,
          phase: 'init' as const,
          status: 'running',
        });
        const job3 = await service.createJob({
          projectId: project.id,
          moduleId: module.id,
          phase: 'init' as const,
          status: 'success',
        });

        const jobs = await service.listJobs({
          projectId: project.id,
          moduleId: module.id,
        });
        expect(jobs).toHaveLength(3);
        expect(jobs.map(j => j.id)).toContain(job1.id);
        expect(jobs.map(j => j.id)).toContain(job2.id);
        expect(jobs.map(j => j.id)).toContain(job3.id);
      },
    );

    it.each(supportedDatabaseIds)(
      'returns jobs with their artifacts - %p',
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
        const job1 = await service.createJob({
          projectId: project.id,
          moduleId: module.id,
          phase: 'init' as const,
          artifacts: artifactsFromValues(['artifact1.txt', 'artifact2.json']),
        });
        const job2 = await service.createJob({
          projectId: project.id,
          moduleId: module.id,
          phase: 'init' as const,
          artifacts: artifactsFromValues(['artifact3.log']),
        });

        const jobs = await service.listJobs({
          projectId: project.id,
          moduleId: module.id,
        });
        expect(jobs).toHaveLength(2);
        const found1 = jobs.find(j => j.id === job1.id);
        const found2 = jobs.find(j => j.id === job2.id);
        expect(found1?.artifacts?.map(a => a.value).sort(toSorted)).toEqual([
          'artifact1.txt',
          'artifact2.json',
        ]);
        expect(found2?.artifacts?.map(a => a.value)).toEqual(['artifact3.log']);
      },
    );

    it.each(supportedDatabaseIds)(
      'returns only jobs for the specified module - %p',
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
        const module1 = await service.createModule({
          name: 'Module 1',
          sourcePath: '/path/to/module1',
          projectId: project.id,
        });
        const module2 = await service.createModule({
          name: 'Module 2',
          sourcePath: '/path/to/module2',
          projectId: project.id,
        });
        await service.createJob({
          projectId: project.id,
          moduleId: module1.id,
          phase: 'init' as const,
        });
        await service.createJob({
          projectId: project.id,
          moduleId: module1.id,
          phase: 'init' as const,
        });
        await service.createJob({
          projectId: project.id,
          moduleId: module2.id,
          phase: 'init' as const,
        });

        const module1Jobs = await service.listJobs({
          projectId: project.id,
          moduleId: module1.id,
        });
        const module2Jobs = await service.listJobs({
          projectId: project.id,
          moduleId: module2.id,
        });
        expect(module1Jobs).toHaveLength(2);
        expect(module1Jobs.every(j => j.moduleId === module1.id)).toBe(true);
        expect(module2Jobs).toHaveLength(1);
        expect(module2Jobs[0].moduleId).toBe(module2.id);
      },
    );

    it.each(supportedDatabaseIds)(
      'filters by phase when phase is provided - %p',
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
        await service.createJob({
          projectId: project.id,
          moduleId: module.id,
          phase: 'init' as const,
        });
        await delay(5);
        await service.createJob({
          projectId: project.id,
          moduleId: module.id,
          phase: 'analyze' as const,
        });
        await delay(5);
        await service.createJob({
          projectId: project.id,
          moduleId: module.id,
          phase: 'migrate' as const,
        });

        const initJobs = await service.listJobs({
          projectId: project.id,
          moduleId: module.id,
          phase: 'init',
        });
        const analyzeJobs = await service.listJobs({
          projectId: project.id,
          moduleId: module.id,
          phase: 'analyze',
        });
        const migrateJobs = await service.listJobs({
          projectId: project.id,
          moduleId: module.id,
          phase: 'migrate',
        });
        expect(initJobs).toHaveLength(1);
        expect(initJobs[0].phase).toBe('init');
        expect(analyzeJobs).toHaveLength(1);
        expect(analyzeJobs[0].phase).toBe('analyze');
        expect(migrateJobs).toHaveLength(1);
        expect(migrateJobs[0].phase).toBe('migrate');
      },
    );

    it.each(supportedDatabaseIds)(
      'returns only the most recent job when lastJobOnly is true - %p',
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
        await service.createJob({
          projectId: project.id,
          moduleId: module.id,
          phase: 'init' as const,
          status: 'pending',
        });
        await delay(5);
        await service.createJob({
          projectId: project.id,
          moduleId: module.id,
          phase: 'analyze' as const,
          status: 'running',
        });
        await delay(5);
        const job3 = await service.createJob({
          projectId: project.id,
          moduleId: module.id,
          phase: 'migrate' as const,
          status: 'success',
        });

        const jobs = await service.listJobs({
          projectId: project.id,
          moduleId: module.id,
          lastJobOnly: true,
        });
        expect(jobs).toHaveLength(1);
        expect(jobs[0].id).toBe(job3.id);
        expect(jobs[0].phase).toBe('migrate');
        expect(jobs[0].status).toBe('success');
      },
    );

    it.each(supportedDatabaseIds)(
      'returns single job with artifacts when lastJobOnly is true - %p',
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
        await service.createJob({
          projectId: project.id,
          moduleId: module.id,
          phase: 'init' as const,
          artifacts: artifactsFromValues(['old.txt']),
        });
        await delay(5);
        const latestJob = await service.createJob({
          projectId: project.id,
          moduleId: module.id,
          phase: 'init' as const,
          artifacts: artifactsFromValues(['artifact1.txt', 'artifact2.json']),
        });

        const jobs = await service.listJobs({
          projectId: project.id,
          moduleId: module.id,
          lastJobOnly: true,
        });
        expect(jobs).toHaveLength(1);
        expect(jobs[0].id).toBe(latestJob.id);
        expect(jobs[0].artifacts?.map(a => a.value).sort(toSorted)).toEqual([
          'artifact1.txt',
          'artifact2.json',
        ]);
      },
    );
  });

  describe('listJobsForProject', () => {
    it.each(supportedDatabaseIds)(
      'returns all jobs for project across modules ordered by started_at desc - %p',
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
        const module1 = await service.createModule({
          name: 'Module 1',
          sourcePath: '/m1',
          projectId: project.id,
        });
        const module2 = await service.createModule({
          name: 'Module 2',
          sourcePath: '/m2',
          projectId: project.id,
        });
        const job1 = await service.createJob({
          projectId: project.id,
          moduleId: module1.id,
          phase: 'init' as const,
        });
        const job2 = await service.createJob({
          projectId: project.id,
          moduleId: module2.id,
          phase: 'init' as const,
        });
        const job3 = await service.createJob({
          projectId: project.id,
          moduleId: module1.id,
          phase: 'analyze' as const,
        });

        const jobs = await service.listJobsForProject({
          projectId: project.id,
        });
        expect(jobs).toHaveLength(3);
        expect(jobs.map(j => j.id)).toContain(job1.id);
        expect(jobs.map(j => j.id)).toContain(job2.id);
        expect(jobs.map(j => j.id)).toContain(job3.id);
        expect(jobs.every(j => j.projectId === project.id)).toBe(true);
      },
    );

    it.each(supportedDatabaseIds)(
      'returns empty list when project has no jobs - %p',
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

        const jobs = await service.listJobsForProject({
          projectId: project.id,
        });
        expect(jobs).toEqual([]);
      },
    );
  });

  describe('listJobsForModule', () => {
    it.each(supportedDatabaseIds)(
      'returns all jobs for the given module ordered by started_at desc - %p',
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
        const job1 = await service.createJob({
          projectId: project.id,
          moduleId: module.id,
          phase: 'init' as const,
        });
        const job2 = await service.createJob({
          projectId: project.id,
          moduleId: module.id,
          phase: 'analyze' as const,
        });

        const jobs = await service.listJobsForModule({
          projectId: project.id,
          moduleId: module.id,
        });
        expect(jobs).toHaveLength(2);
        expect(jobs.map(j => j.id)).toContain(job1.id);
        expect(jobs.map(j => j.id)).toContain(job2.id);
        expect(jobs.every(j => j.moduleId === module.id)).toBe(true);
      },
    );

    it.each(supportedDatabaseIds)(
      'returns empty list when module has no jobs - %p',
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

        const jobs = await service.listJobsForModule({
          projectId: project.id,
          moduleId: module.id,
        });
        expect(jobs).toEqual([]);
      },
    );
  });

  describe('updateJob', () => {
    it.each(supportedDatabaseIds)(
      'returns undefined when updating non-existent job - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const updated = await service.updateJob({
          id: nonExistentId,
          status: 'running',
        });
        expect(updated).toBeUndefined();
      },
    );

    it.each(supportedDatabaseIds)(
      'updates job status - %p',
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
          status: 'pending',
        });

        const updated = await service.updateJob({
          id: job.id,
          status: 'running',
        });
        expect(updated).toBeDefined();
        expect(updated?.status).toBe('running');
        expect(updated?.id).toBe(job.id);
      },
    );

    it.each(supportedDatabaseIds)(
      'updates job log (verifiable via getJobWithLog) - %p',
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

        const updated = await service.updateJob({
          id: job.id,
          log: 'Updated log content',
        });
        expect(updated).toBeDefined();

        const withLog = await service.getJobWithLog({ id: job.id });
        expect(withLog?.log).toBe('Updated log content');
      },
    );

    it.each(supportedDatabaseIds)(
      'updates job finishedAt, errorDetails and k8sJobName - %p',
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
        const finishedAt = new Date('2026-01-24T12:00:00Z');

        const updated = await service.updateJob({
          id: job.id,
          finishedAt,
          errorDetails: 'Something failed',
          k8sJobName: 'my-k8s-job-xyz',
        });
        expect(updated).toBeDefined();
        expect(updated?.finishedAt).toEqual(finishedAt);
        expect(updated?.errorDetails).toBe('Something failed');
        expect(updated?.k8sJobName).toBe('my-k8s-job-xyz');
      },
    );

    it.each(supportedDatabaseIds)(
      'updates job artifacts (replaces existing) - %p',
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
          artifacts: artifactsFromValues(['old1.txt', 'old2.txt']),
        });
        const newArtifacts = artifactsFromValues([
          'new1.txt',
          'new2.txt',
          'new3.txt',
        ]);

        const updated = await service.updateJob({
          id: job.id,
          artifacts: newArtifacts as Artifact[],
        });
        expect(updated).toBeDefined();
        expect(updated?.artifacts).toHaveLength(3);
        expect(
          (updated?.artifacts ?? []).map(a => a.value).sort(toSorted),
        ).toEqual(['new1.txt', 'new2.txt', 'new3.txt'].sort(toSorted));

        const artifactRows = await client('artifacts')
          .where('job_id', job.id)
          .select('type', 'value')
          .orderBy('id', 'asc');
        expect(artifactRows.map(r => r.value).sort(toSorted)).toEqual(
          ['new1.txt', 'new2.txt', 'new3.txt'].sort(toSorted),
        );
      },
    );

    it.each(supportedDatabaseIds)(
      'clears artifacts when updating with empty array - %p',
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
          artifacts: artifactsFromValues(['artifact1.txt', 'artifact2.txt']),
        });

        const updated = await service.updateJob({ id: job.id, artifacts: [] });
        expect(updated).toBeDefined();
        expect(updated?.artifacts ?? []).toEqual([]);
        const artifactRows = await client('artifacts')
          .where('job_id', job.id)
          .select('*');
        expect(artifactRows).toHaveLength(0);
      },
    );

    it.each(supportedDatabaseIds)(
      'updates multiple fields at once - %p',
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
          status: 'pending',
          log: 'Initial log',
        });
        const finishedAt = new Date('2026-01-24T12:00:00Z');

        const updated = await service.updateJob({
          id: job.id,
          status: 'success',
          log: 'Final log',
          finishedAt,
          artifacts: artifactsFromValues(['result.txt']) as Artifact[],
        });
        expect(updated).toBeDefined();
        expect(updated?.status).toBe('success');
        expect(updated?.finishedAt).toEqual(finishedAt);
        expect((updated?.artifacts ?? []).map(a => a.value)).toEqual([
          'result.txt',
        ]);
      },
    );
  });

  describe('deleteJob', () => {
    it.each(supportedDatabaseIds)(
      'returns 0 when deleting non-existent job - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const deletedCount = await service.deleteJob({ id: nonExistentId });
        expect(deletedCount).toBe(0);
      },
    );

    it.each(supportedDatabaseIds)(
      'deletes job and returns 1 - %p',
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
        expect(await service.getJob({ id: job.id })).toBeDefined();

        const deletedCount = await service.deleteJob({ id: job.id });
        expect(deletedCount).toBe(1);
        expect(await service.getJob({ id: job.id })).toBeUndefined();
      },
    );

    it.each(supportedDatabaseIds)(
      'cascade deletes artifacts when job is deleted - %p',
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
          artifacts: artifactsFromValues(['artifact1.txt', 'artifact2.txt']),
        });
        expect(
          (await client('artifacts').where('job_id', job.id).select('*'))
            .length,
        ).toBe(2);

        await service.deleteJob({ id: job.id });
        expect(
          (await client('artifacts').where('job_id', job.id).select('*'))
            .length,
        ).toBe(0);
      },
    );

    it.each(supportedDatabaseIds)(
      'deletes only the specified job - %p',
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
        const job1 = await service.createJob({
          projectId: project.id,
          moduleId: module.id,
          phase: 'init' as const,
        });
        const job2 = await service.createJob({
          projectId: project.id,
          moduleId: module.id,
          phase: 'init' as const,
        });

        const deletedCount = await service.deleteJob({ id: job1.id });
        expect(deletedCount).toBe(1);
        expect(await service.getJob({ id: job1.id })).toBeUndefined();
        const remaining = await service.getJob({ id: job2.id });
        expect(remaining).toBeDefined();
        expect(remaining?.id).toBe(job2.id);
        const listResult = await service.listJobs({
          projectId: project.id,
          moduleId: module.id,
        });
        expect(listResult).toHaveLength(1);
        expect(listResult[0].id).toBe(job2.id);
      },
    );
  });

  describe('CASCADE delete (module → jobs)', () => {
    it.each(supportedDatabaseIds)(
      'cascade deletes jobs and artifacts when module is deleted - %p',
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
        const job1 = await service.createJob({
          projectId: project.id,
          moduleId: module.id,
          phase: 'init' as const,
          artifacts: artifactsFromValues(['a1.txt']),
        });
        const job2 = await service.createJob({
          projectId: project.id,
          moduleId: module.id,
          phase: 'init' as const,
          artifacts: artifactsFromValues(['a2.txt']),
        });
        const job3 = await service.createJob({
          projectId: project.id,
          moduleId: module.id,
          phase: 'init' as const,
        });

        expect(await service.getJob({ id: job1.id })).toBeDefined();
        expect(await service.getJob({ id: job2.id })).toBeDefined();
        expect(await service.getJob({ id: job3.id })).toBeDefined();
        expect(
          await service.listJobs({
            projectId: project.id,
            moduleId: module.id,
          }),
        ).toHaveLength(3);

        const deletedCount = await service.deleteModule({ id: module.id });
        expect(deletedCount).toBe(1);
        expect(await service.getModule({ id: module.id })).toBeUndefined();

        expect(await service.getJob({ id: job1.id })).toBeUndefined();
        expect(await service.getJob({ id: job2.id })).toBeUndefined();
        expect(await service.getJob({ id: job3.id })).toBeUndefined();
        expect(
          await service.listJobs({
            projectId: project.id,
            moduleId: module.id,
          }),
        ).toEqual([]);

        const dbJobs = await client('jobs')
          .whereIn('id', [job1.id, job2.id, job3.id])
          .select('*');
        expect(dbJobs).toHaveLength(0);
        const artifacts = await client('artifacts')
          .whereIn('job_id', [job1.id, job2.id, job3.id])
          .select('*');
        expect(artifacts).toHaveLength(0);
      },
    );

    it.each(supportedDatabaseIds)(
      'cascade deletes only jobs of the deleted module - %p',
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
        const module1 = await service.createModule({
          name: 'Module 1',
          sourcePath: '/m1',
          projectId: project.id,
        });
        const module2 = await service.createModule({
          name: 'Module 2',
          sourcePath: '/m2',
          projectId: project.id,
        });
        const job1M1 = await service.createJob({
          projectId: project.id,
          moduleId: module1.id,
          phase: 'init' as const,
        });
        const job2M1 = await service.createJob({
          projectId: project.id,
          moduleId: module1.id,
          phase: 'init' as const,
        });
        const job1M2 = await service.createJob({
          projectId: project.id,
          moduleId: module2.id,
          phase: 'init' as const,
        });

        await service.deleteModule({ id: module1.id });

        expect(await service.getJob({ id: job1M1.id })).toBeUndefined();
        expect(await service.getJob({ id: job2M1.id })).toBeUndefined();
        const remaining = await service.getJob({ id: job1M2.id });
        expect(remaining).toBeDefined();
        expect(remaining?.moduleId).toBe(module2.id);
        expect(
          await service.listJobs({
            projectId: project.id,
            moduleId: module2.id,
          }),
        ).toHaveLength(1);
        expect(
          (
            await service.listJobs({
              projectId: project.id,
              moduleId: module2.id,
            })
          )[0].id,
        ).toBe(job1M2.id);
      },
    );
  });
});
