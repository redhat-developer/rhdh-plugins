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
  AuthenticationError,
  ConflictError,
  NotAllowedError,
  NotFoundError,
  ServiceUnavailableError,
} from '@backstage/errors';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { MIGRATION_PLAN_MAX_CONTENT_BYTES } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import request from 'supertest';

import {
  createApp,
  createDatabaseAndService,
  createMockScmFileStore,
  createTestJob,
  createTestModule,
  createTestProject,
  LONG_TEST_TIMEOUT,
  nonExistentId,
  supportedDatabaseIds,
  tearDownDatabases,
} from '../__testUtils__';
import type { X2ADatabaseService } from '../services/X2ADatabaseService';

const PLAN_PATH = 'proj-1234/migration-plan.md';
const MODULE_PLAN_PATH = 'proj-1234/modules/mod/migration-plan-mod.md';

type Seed = { artifact?: string | null; initStatus?: 'success' | 'running' };

interface Scope {
  name: string;
  planPath: string;
  /** Creates the project (+ module) and returns the base URL of the plan resource. */
  setup: (
    db: X2ADatabaseService,
    seed?: Seed,
  ) => Promise<{ url: string; projectId: string; moduleId?: string }>;
  /** Creates an active job that may rewrite the plan. */
  runActiveJob: (
    db: X2ADatabaseService,
    ids: { projectId: string; moduleId?: string },
    options?: { k8sJobName?: string; withPlan?: boolean },
  ) => Promise<void>;
  /** Creates an active job that can NOT rewrite the plan. */
  runUnrelatedJob: (
    db: X2ADatabaseService,
    ids: { projectId: string; moduleId?: string },
  ) => Promise<void>;
}

async function withArtifact(
  db: X2ADatabaseService,
  jobId: string,
  type: 'migration_plan' | 'module_migration_plan',
  value: string,
) {
  await db.updateJob({ id: jobId, artifacts: [{ type, value } as any] });
}

const scopes: Scope[] = [
  {
    name: 'project migration plan',
    planPath: PLAN_PATH,
    async setup(db, seed = {}) {
      const project = await createTestProject(db);
      const artifact = seed.artifact === undefined ? PLAN_PATH : seed.artifact;
      if (artifact !== null) {
        const job = await createTestJob(db, {
          projectId: project.id,
          moduleId: null,
          phase: 'init',
          status: seed.initStatus ?? 'success',
        });
        await withArtifact(db, job.id, 'migration_plan', artifact);
      }
      return {
        url: `/projects/${project.id}/migration-plan`,
        projectId: project.id,
      };
    },
    async runActiveJob(db, { projectId }, { k8sJobName, withPlan } = {}) {
      const job = await createTestJob(db, {
        projectId,
        moduleId: null,
        phase: 'init',
        status: 'running',
        k8sJobName,
      });
      if (withPlan) {
        await withArtifact(db, job.id, 'migration_plan', PLAN_PATH);
      }
    },
    async runUnrelatedJob(db, { projectId }) {
      const module = await createTestModule(db, projectId);
      await createTestJob(db, {
        projectId,
        moduleId: module.id,
        phase: 'analyze',
        status: 'running',
      });
    },
  },
  {
    name: 'module migration plan',
    planPath: MODULE_PLAN_PATH,
    async setup(db, seed = {}) {
      const project = await createTestProject(db);
      const module = await createTestModule(db, project.id, {
        name: 'mod',
        sourcePath: '/src/mod',
      });
      const artifact =
        seed.artifact === undefined ? MODULE_PLAN_PATH : seed.artifact;
      if (artifact !== null) {
        const job = await createTestJob(db, {
          projectId: project.id,
          moduleId: module.id,
          phase: 'analyze',
          status: 'success',
        });
        await withArtifact(db, job.id, 'module_migration_plan', artifact);
      }
      return {
        url: `/projects/${project.id}/modules/${module.id}/migration-plan`,
        projectId: project.id,
        moduleId: module.id,
      };
    },
    async runActiveJob(
      db,
      { projectId, moduleId },
      { k8sJobName, withPlan } = {},
    ) {
      const job = await createTestJob(db, {
        projectId,
        moduleId: moduleId!,
        phase: 'analyze',
        status: 'running',
        k8sJobName,
      });
      if (withPlan) {
        await withArtifact(
          db,
          job.id,
          'module_migration_plan',
          MODULE_PLAN_PATH,
        );
      }
    },
    async runUnrelatedJob(db, { projectId, moduleId }) {
      await createTestJob(db, {
        projectId,
        moduleId: moduleId!,
        phase: 'migrate',
        status: 'running',
      });
    },
  },
];

describe('createRouter – migration plan editing', () => {
  afterEach(async () => {
    await tearDownDatabases();
  });

  describe.each(scopes)('$name', scope => {
    describe('POST .../read', () => {
      it.each(supportedDatabaseIds)(
        'returns the document read through the SCM store with the user token - %p',
        async databaseId => {
          const { client, x2aDatabase } =
            await createDatabaseAndService(databaseId);
          const scmFileStore = createMockScmFileStore();
          scmFileStore.getFile.mockResolvedValue({
            content: '# Plan',
            version: 'v1',
          });
          const app = await createApp(
            client,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            { scmFileStore },
          );
          const { url } = await scope.setup(x2aDatabase);

          const response = await request(app)
            .post(`${url}/read`)
            .send({ targetRepoAuth: { token: 'oauth2:user-token' } });

          expect(response.status).toBe(200);
          expect(response.body).toEqual({ content: '# Plan', version: 'v1' });
          expect(scmFileStore.getFile).toHaveBeenCalledWith({
            repoUrl: 'https://github.com/target/repo',
            branch: 'main',
            path: scope.planPath,
            token: 'oauth2:user-token',
          });
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'falls back to the configured target repo token - %p',
        async databaseId => {
          const { client, x2aDatabase } =
            await createDatabaseAndService(databaseId);
          const scmFileStore = createMockScmFileStore();
          scmFileStore.getFile.mockResolvedValue({ content: '', version: 'v' });
          const app = await createApp(
            client,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            {
              scmFileStore,
              x2aConfig: { git: { targetRepo: { token: 'config-token' } } },
            },
          );
          const { url } = await scope.setup(x2aDatabase);

          const response = await request(app).post(`${url}/read`).send({});

          expect(response.status).toBe(200);
          expect(scmFileStore.getFile).toHaveBeenCalledWith(
            expect.objectContaining({ token: 'config-token' }),
          );
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'returns 400 without any token - %p',
        async databaseId => {
          const { client, x2aDatabase } =
            await createDatabaseAndService(databaseId);
          const scmFileStore = createMockScmFileStore();
          const app = await createApp(
            client,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            { scmFileStore },
          );
          const { url } = await scope.setup(x2aDatabase);

          const response = await request(app).post(`${url}/read`).send({});

          expect(response.status).toBe(400);
          expect(response.body.error.message).toMatch(/token is required/);
          expect(scmFileStore.getFile).not.toHaveBeenCalled();
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'returns 400 for an empty token - %p',
        async databaseId => {
          const { client, x2aDatabase } =
            await createDatabaseAndService(databaseId);
          const app = await createApp(client);
          const { url } = await scope.setup(x2aDatabase);

          const response = await request(app)
            .post(`${url}/read`)
            .send({ targetRepoAuth: { token: '' } });

          expect(response.status).toBe(400);
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'returns 403 when the user may not write projects - %p',
        async databaseId => {
          const { client, x2aDatabase } =
            await createDatabaseAndService(databaseId);
          const scmFileStore = createMockScmFileStore();
          const app = await createApp(
            client,
            AuthorizeResult.DENY,
            undefined,
            undefined,
            undefined,
            undefined,
            { scmFileStore },
          );
          const { url } = await scope.setup(x2aDatabase);

          const response = await request(app)
            .post(`${url}/read`)
            .send({ targetRepoAuth: { token: 't' } });

          expect(response.status).toBe(403);
          expect(scmFileStore.getFile).not.toHaveBeenCalled();
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'returns 404 for a project owned by someone else - %p',
        async databaseId => {
          const { client, x2aDatabase } =
            await createDatabaseAndService(databaseId);
          const scmFileStore = createMockScmFileStore();
          const app = await createApp(
            client,
            AuthorizeResult.ALLOW,
            AuthorizeResult.DENY,
            undefined,
            AuthorizeResult.DENY,
            undefined,
            { scmFileStore },
          );
          const { url } = await scope.setup(x2aDatabase);

          const response = await request(app)
            .post(`${url}/read`)
            .set(
              'Authorization',
              mockCredentials.user.header('user:default/other'),
            )
            .send({ targetRepoAuth: { token: 't' } });

          expect(response.status).toBe(404);
          expect(scmFileStore.getFile).not.toHaveBeenCalled();
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'returns 404 when the project does not exist - %p',
        async databaseId => {
          const { client } = await createDatabaseAndService(databaseId);
          const app = await createApp(client);
          const url = scope.name.startsWith('module')
            ? `/projects/${nonExistentId}/modules/${nonExistentId}/migration-plan`
            : `/projects/${nonExistentId}/migration-plan`;

          const response = await request(app)
            .post(`${url}/read`)
            .send({ targetRepoAuth: { token: 't' } });

          expect(response.status).toBe(404);
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'returns 404 when the plan was not produced yet - %p',
        async databaseId => {
          const { client, x2aDatabase } =
            await createDatabaseAndService(databaseId);
          const scmFileStore = createMockScmFileStore();
          const app = await createApp(
            client,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            { scmFileStore },
          );
          const { url } = await scope.setup(x2aDatabase, { artifact: null });

          const response = await request(app)
            .post(`${url}/read`)
            .send({ targetRepoAuth: { token: 't' } });

          expect(response.status).toBe(404);
          expect(response.body.error.message).toMatch(/does not exist yet/);
          expect(scmFileStore.getFile).not.toHaveBeenCalled();
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'refuses stored paths that are not plain repository paths - %p',
        async databaseId => {
          const { client, x2aDatabase } =
            await createDatabaseAndService(databaseId);
          const scmFileStore = createMockScmFileStore();
          const app = await createApp(
            client,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            { scmFileStore },
          );

          for (const artifact of [
            '../../etc/passwd',
            '/abs/plan.md',
            'https://evil.example.com/plan.md',
          ]) {
            const { url } = await scope.setup(x2aDatabase, { artifact });
            const response = await request(app)
              .post(`${url}/read`)
              .send({ targetRepoAuth: { token: 't' } });

            expect(response.status).toBe(400);
            expect(response.body.error.message).not.toContain(artifact);
          }
          expect(scmFileStore.getFile).not.toHaveBeenCalled();
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'passes the SCM store failures through with their status - %p',
        async databaseId => {
          const { client, x2aDatabase } =
            await createDatabaseAndService(databaseId);
          const scmFileStore = createMockScmFileStore();
          const app = await createApp(
            client,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            { scmFileStore },
          );
          const { url } = await scope.setup(x2aDatabase);

          for (const [error, status] of [
            [new AuthenticationError('rejected'), 401],
            [new NotAllowedError('denied'), 403],
            [new NotFoundError('missing'), 404],
            [new ServiceUnavailableError('down'), 503],
          ] as const) {
            scmFileStore.getFile.mockRejectedValueOnce(error);
            const response = await request(app)
              .post(`${url}/read`)
              .send({ targetRepoAuth: { token: 't' } });
            expect(response.status).toBe(status);
            expect(response.body.error.message).toBe(error.message);
          }
        },
        LONG_TEST_TIMEOUT,
      );
    });

    describe('PUT', () => {
      const body = {
        content: '# New',
        message: 'Manual update',
        version: 'v1',
        targetRepoAuth: { token: 'user-token' },
      };

      async function setupApp(
        databaseId: Parameters<typeof createDatabaseAndService>[0],
        kubeServiceOverrides?: Record<string, unknown>,
        seed?: Seed,
      ) {
        const { client, x2aDatabase } =
          await createDatabaseAndService(databaseId);
        const scmFileStore = createMockScmFileStore();
        scmFileStore.putFile.mockResolvedValue({ version: 'v2' });
        const app = await createApp(
          client,
          undefined,
          undefined,
          kubeServiceOverrides,
          undefined,
          undefined,
          { scmFileStore },
        );
        const ids = await scope.setup(x2aDatabase, seed);
        return { app, scmFileStore, x2aDatabase, ...ids };
      }

      it.each(supportedDatabaseIds)(
        'commits the document and returns the new version - %p',
        async databaseId => {
          const { app, scmFileStore, url } = await setupApp(databaseId);

          const response = await request(app).put(url).send(body);

          expect(response.status).toBe(200);
          expect(response.body).toEqual({ version: 'v2' });
          expect(scmFileStore.putFile).toHaveBeenCalledWith({
            repoUrl: 'https://github.com/target/repo',
            branch: 'main',
            path: scope.planPath,
            token: 'user-token',
            content: '# New',
            message: 'Manual update',
            expectedVersion: 'v1',
          });
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'accepts an empty document - %p',
        async databaseId => {
          const { app, scmFileStore, url } = await setupApp(databaseId);

          const response = await request(app)
            .put(url)
            .send({ ...body, content: '' });

          expect(response.status).toBe(200);
          expect(scmFileStore.putFile).toHaveBeenCalledWith(
            expect.objectContaining({ content: '' }),
          );
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'trims the commit message - %p',
        async databaseId => {
          const { app, scmFileStore, url } = await setupApp(databaseId);

          await request(app)
            .put(url)
            .send({ ...body, message: '  Fix typo \n' });

          expect(scmFileStore.putFile).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Fix typo' }),
          );
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'returns 400 for an invalid body - %p',
        async databaseId => {
          const { app, scmFileStore, url } = await setupApp(databaseId);

          const invalidBodies = [
            {},
            { ...body, content: undefined },
            { ...body, content: 42 },
            { ...body, message: '' },
            { ...body, message: '   ' },
            { ...body, version: '' },
            { ...body, version: undefined },
            { ...body, targetRepoAuth: { token: '' } },
          ];
          for (const invalid of invalidBodies) {
            const response = await request(app).put(url).send(invalid);
            expect(response.status).toBe(400);
          }
          expect(scmFileStore.putFile).not.toHaveBeenCalled();
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'returns 400 without any token - %p',
        async databaseId => {
          const { app, scmFileStore, url } = await setupApp(databaseId);

          const response = await request(app)
            .put(url)
            .send({ ...body, targetRepoAuth: undefined });

          expect(response.status).toBe(400);
          expect(scmFileStore.putFile).not.toHaveBeenCalled();
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'returns 404 when the plan was not produced yet - %p',
        async databaseId => {
          const { app, scmFileStore, url } = await setupApp(
            databaseId,
            undefined,
            { artifact: null },
          );

          const response = await request(app).put(url).send(body);

          expect(response.status).toBe(404);
          expect(scmFileStore.putFile).not.toHaveBeenCalled();
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'refuses an unsafe stored path - %p',
        async databaseId => {
          const { app, scmFileStore, url } = await setupApp(
            databaseId,
            undefined,
            { artifact: 'a/../../b.md' },
          );

          const response = await request(app).put(url).send(body);

          expect(response.status).toBe(400);
          expect(scmFileStore.putFile).not.toHaveBeenCalled();
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'returns 403 when the user may not write projects - %p',
        async databaseId => {
          const { client, x2aDatabase } =
            await createDatabaseAndService(databaseId);
          const scmFileStore = createMockScmFileStore();
          const app = await createApp(
            client,
            AuthorizeResult.DENY,
            undefined,
            undefined,
            undefined,
            undefined,
            { scmFileStore },
          );
          const { url } = await scope.setup(x2aDatabase);

          const response = await request(app).put(url).send(body);

          expect(response.status).toBe(403);
          expect(scmFileStore.putFile).not.toHaveBeenCalled();
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'returns 409 while a job that may rewrite the document is running - %p',
        async databaseId => {
          const { app, scmFileStore, x2aDatabase, url, ...ids } =
            await setupApp(databaseId);
          await scope.runActiveJob(x2aDatabase, ids);

          const response = await request(app).put(url).send(body);

          expect(response.status).toBe(409);
          expect(response.body.error.message).toMatch(/job is running/);
          expect(scmFileStore.putFile).not.toHaveBeenCalled();
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'still returns 409 when Kubernetes confirms the job is running - %p',
        async databaseId => {
          const getJobStatus = jest
            .fn()
            .mockResolvedValue({ status: 'running' });
          const { app, scmFileStore, x2aDatabase, url, ...ids } =
            await setupApp(databaseId, { getJobStatus });
          await scope.runActiveJob(x2aDatabase, ids, {
            k8sJobName: 'k8s-job-1',
          });

          const response = await request(app).put(url).send(body);

          expect(response.status).toBe(409);
          expect(getJobStatus).toHaveBeenCalledWith('k8s-job-1');
          expect(scmFileStore.putFile).not.toHaveBeenCalled();
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'saves when the stored running status is stale (Kubernetes says finished) - %p',
        async databaseId => {
          const getJobStatus = jest
            .fn()
            .mockResolvedValue({ status: 'success' });
          const { app, scmFileStore, x2aDatabase, url, ...ids } =
            await setupApp(databaseId, { getJobStatus });
          await scope.runActiveJob(x2aDatabase, ids, {
            k8sJobName: 'k8s-job-1',
            withPlan: true,
          });

          const response = await request(app).put(url).send(body);

          expect(response.status).toBe(200);
          expect(scmFileStore.putFile).toHaveBeenCalledTimes(1);
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'is not blocked by a running job of another phase or module - %p',
        async databaseId => {
          const { app, scmFileStore, x2aDatabase, url, ...ids } =
            await setupApp(databaseId);
          await scope.runUnrelatedJob(x2aDatabase, ids);

          const response = await request(app).put(url).send(body);

          expect(response.status).toBe(200);
          expect(scmFileStore.putFile).toHaveBeenCalledTimes(1);
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'passes the SCM store failures through with their status - %p',
        async databaseId => {
          const { app, scmFileStore, url } = await setupApp(databaseId);

          for (const [error, status] of [
            [new ConflictError('changed meanwhile'), 409],
            [new AuthenticationError('rejected'), 401],
            [new NotAllowedError('protected branch'), 403],
            [new NotFoundError('missing'), 404],
            [new ServiceUnavailableError('down'), 503],
          ] as const) {
            scmFileStore.putFile.mockRejectedValueOnce(error);
            const response = await request(app).put(url).send(body);
            expect(response.status).toBe(status);
            expect(response.body.error.message).toBe(error.message);
          }
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'rejects a document above 100 kB - %p',
        async databaseId => {
          const { app, scmFileStore, url } = await setupApp(databaseId);

          const overBytes = await request(app)
            .put(url)
            .send({
              ...body,
              content: 'x'.repeat(MIGRATION_PLAN_MAX_CONTENT_BYTES + 1),
            });
          // Two-byte characters cross the limit before the character count does
          const overUtf8 = await request(app)
            .put(url)
            .send({
              ...body,
              content: 'č'.repeat(MIGRATION_PLAN_MAX_CONTENT_BYTES / 2 + 1),
            });

          for (const response of [overBytes, overUtf8]) {
            expect(response.status).toBe(400);
            expect(response.body.error.message).toMatch(/too large/);
            expect(response.body.error.message).toMatch(/100 kB/);
          }
          expect(scmFileStore.putFile).not.toHaveBeenCalled();
        },
        LONG_TEST_TIMEOUT,
      );
    });
  });

  describe('module scope', () => {
    const moduleScope = scopes[1];

    it.each(supportedDatabaseIds)(
      'returns 404 when the module does not exist - %p',
      async databaseId => {
        const { client, x2aDatabase } =
          await createDatabaseAndService(databaseId);
        const scmFileStore = createMockScmFileStore();
        const app = await createApp(
          client,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          { scmFileStore },
        );
        const project = await createTestProject(x2aDatabase);
        const url = `/projects/${project.id}/modules/${nonExistentId}/migration-plan`;

        const read = await request(app)
          .post(`${url}/read`)
          .send({ targetRepoAuth: { token: 't' } });
        const save = await request(app)
          .put(url)
          .send({
            content: 'c',
            message: 'm',
            version: 'v',
            targetRepoAuth: { token: 't' },
          });

        expect(read.status).toBe(404);
        expect(save.status).toBe(404);
        expect(scmFileStore.getFile).not.toHaveBeenCalled();
        expect(scmFileStore.putFile).not.toHaveBeenCalled();
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'returns 404 when the module belongs to another project - %p',
      async databaseId => {
        const { client, x2aDatabase } =
          await createDatabaseAndService(databaseId);
        const scmFileStore = createMockScmFileStore();
        const app = await createApp(
          client,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          { scmFileStore },
        );
        const { moduleId } = await moduleScope.setup(x2aDatabase);
        const otherProject = await createTestProject(x2aDatabase);
        const url = `/projects/${otherProject.id}/modules/${moduleId}/migration-plan`;

        const response = await request(app)
          .post(`${url}/read`)
          .send({ targetRepoAuth: { token: 't' } });

        expect(response.status).toBe(404);
        expect(response.body.error.message).toMatch(/does not belong/);
        expect(scmFileStore.getFile).not.toHaveBeenCalled();
      },
      LONG_TEST_TIMEOUT,
    );
  });
});
