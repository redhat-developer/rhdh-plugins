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
  nonExistentId,
  supportedDatabaseIds,
  tearDownDatabases,
} from '../../__testUtils__';

describe('X2ADatabaseService – jobs (update & delete)', () => {
  afterEach(async () => {
    await tearDownDatabases();
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
