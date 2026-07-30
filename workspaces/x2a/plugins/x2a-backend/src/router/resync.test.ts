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

import request from 'supertest';

import {
  artifactsFromValues,
  createApp,
  createDatabase,
  createService,
  LONG_TEST_TIMEOUT,
  mockInputProject,
  nonExistentId,
  supportedDatabaseIds,
  tearDownDatabases,
} from '../__testUtils__';

async function seedMigrationPlan(
  client: Awaited<ReturnType<typeof createDatabase>>['client'],
  projectId: string,
): Promise<void> {
  const service = createService(client);
  await service.createJob({
    projectId,
    phase: 'init',
    status: 'success',
    artifacts: artifactsFromValues(
      ['https://repo.example.com/migration-plan.md'],
      'migration_plan',
    ),
  });
}

describe('POST /projects/:projectId/run – resync (refresh=true)', () => {
  afterEach(async () => {
    await tearDownDatabases();
  });

  it.each(supportedDatabaseIds)(
    'should create an init job with refresh flag and return 200 - %p',
    async databaseId => {
      const kubeCreateJob = jest
        .fn()
        .mockResolvedValue({ k8sJobName: 'resync-job-1' });

      const { client } = await createDatabase(databaseId);
      const app = await createApp(client, undefined, undefined, {
        createJob: kubeCreateJob,
      });

      const createRes = await request(app)
        .post('/projects')
        .send(mockInputProject);
      expect(createRes.status).toBe(200);
      const projectId = createRes.body.id;
      await seedMigrationPlan(client, projectId);

      const runRes = await request(app)
        .post(`/projects/${projectId}/run`)
        .send({
          sourceRepoAuth: { token: 'src-token' },
          targetRepoAuth: { token: 'tgt-token' },
          refresh: true,
        });

      expect(runRes.status).toBe(200);
      expect(runRes.body.jobId).toBeDefined();
      expect(runRes.body.status).toBe('pending');

      expect(kubeCreateJob).toHaveBeenCalledTimes(1);
      expect(kubeCreateJob).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: 'init',
          refresh: true,
          projectId,
        }),
      );
    },
    LONG_TEST_TIMEOUT,
  );

  it.each(supportedDatabaseIds)(
    'should return 409 when refresh is requested while init job is already running - %p',
    async databaseId => {
      const kubeCreateJob = jest
        .fn()
        .mockResolvedValue({ k8sJobName: 'resync-job-1' });

      const { client } = await createDatabase(databaseId);
      const app = await createApp(client, undefined, undefined, {
        createJob: kubeCreateJob,
      });

      const createRes = await request(app)
        .post('/projects')
        .send(mockInputProject);
      expect(createRes.status).toBe(200);
      const projectId = createRes.body.id;
      await seedMigrationPlan(client, projectId);

      const resyncBody = {
        sourceRepoAuth: { token: 'src-token' },
        targetRepoAuth: { token: 'tgt-token' },
        refresh: true,
      };

      const first = await request(app)
        .post(`/projects/${projectId}/run`)
        .send(resyncBody);
      expect(first.status).toBe(200);

      const second = await request(app)
        .post(`/projects/${projectId}/run`)
        .send(resyncBody);
      expect(second.status).toBe(409);
      expect(second.body).toMatchObject({
        error: 'JobAlreadyRunning',
        message: expect.stringContaining('init job is already running'),
      });
      expect(kubeCreateJob).toHaveBeenCalledTimes(1);
    },
    LONG_TEST_TIMEOUT,
  );

  it.each(supportedDatabaseIds)(
    'should return 400 when refresh is requested without migration plan - %p',
    async databaseId => {
      const kubeCreateJob = jest
        .fn()
        .mockResolvedValue({ k8sJobName: 'resync-job-1' });

      const { client } = await createDatabase(databaseId);
      const app = await createApp(client, undefined, undefined, {
        createJob: kubeCreateJob,
      });

      const createRes = await request(app)
        .post('/projects')
        .send(mockInputProject);
      expect(createRes.status).toBe(200);
      const projectId = createRes.body.id;

      const runRes = await request(app)
        .post(`/projects/${projectId}/run`)
        .send({
          sourceRepoAuth: { token: 'src-token' },
          targetRepoAuth: { token: 'tgt-token' },
          refresh: true,
        });

      expect(runRes.status).toBe(400);
      expect(kubeCreateJob).not.toHaveBeenCalled();
    },
    LONG_TEST_TIMEOUT,
  );

  it.each(supportedDatabaseIds)(
    'should return 404 when project does not exist - %p',
    async databaseId => {
      const { client } = await createDatabase(databaseId);
      const app = await createApp(client);

      const res = await request(app)
        .post(`/projects/${nonExistentId}/run`)
        .send({
          sourceRepoAuth: { token: 'src-token' },
          targetRepoAuth: { token: 'tgt-token' },
          refresh: true,
        });

      expect(res.status).toBe(404);
    },
    LONG_TEST_TIMEOUT,
  );

  it.each(supportedDatabaseIds)(
    'should pass refresh=undefined when not provided in body - %p',
    async databaseId => {
      const kubeCreateJob = jest
        .fn()
        .mockResolvedValue({ k8sJobName: 'init-job-1' });

      const { client } = await createDatabase(databaseId);
      const app = await createApp(client, undefined, undefined, {
        createJob: kubeCreateJob,
      });

      const createRes = await request(app)
        .post('/projects')
        .send(mockInputProject);
      const projectId = createRes.body.id;

      await request(app)
        .post(`/projects/${projectId}/run`)
        .send({
          sourceRepoAuth: { token: 'src-token' },
          targetRepoAuth: { token: 'tgt-token' },
        });

      expect(kubeCreateJob).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: 'init',
          refresh: undefined,
        }),
      );
    },
    LONG_TEST_TIMEOUT,
  );
});
