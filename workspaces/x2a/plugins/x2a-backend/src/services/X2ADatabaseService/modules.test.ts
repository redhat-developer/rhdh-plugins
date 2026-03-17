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
} from './__testUtils__/testHelpers';
import { LONG_TEST_TIMEOUT, nonExistentId } from '../../utils/tests';

describe('X2ADatabaseService – modules', () => {
  afterEach(async () => {
    await tearDownDatabases();
  });

  describe('createModule', () => {
    it.each(supportedDatabaseIds)(
      'creates a module with all required fields and persists to DB - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'A test project',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );
        const moduleInput = {
          name: 'Test Module',
          sourcePath: '/path/to/module',
          projectId: project.id,
        };

        const module = await service.createModule(moduleInput);

        expect(module).toMatchObject({
          name: moduleInput.name,
          sourcePath: moduleInput.sourcePath,
          projectId: moduleInput.projectId,
        });
        expect(module.id).toBeDefined();

        const row = await client('modules').where('id', module.id).first();
        expect(row).toBeDefined();
        expect(row.name).toBe(moduleInput.name);
        expect(row.source_path).toBe(moduleInput.sourcePath);
        expect(row.project_id).toBe(moduleInput.projectId);
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'creates multiple modules with different IDs - %p',
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

        expect(module1.id).not.toBe(module2.id);
        expect(module1.name).toBe('Module 1');
        expect(module2.name).toBe('Module 2');
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'creates modules for different projects - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const credentials = mockCredentials.user();
        const project1 = await service.createProject(
          {
            name: 'Project 1',
            abbreviation: 'P1',
            description: 'First',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );
        const project2 = await service.createProject(
          {
            name: 'Project 2',
            abbreviation: 'P2',
            description: 'Second',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );

        const module1 = await service.createModule({
          name: 'Module for Project 1',
          sourcePath: '/path/to/module1',
          projectId: project1.id,
        });
        const module2 = await service.createModule({
          name: 'Module for Project 2',
          sourcePath: '/path/to/module2',
          projectId: project2.id,
        });

        expect(module1.projectId).toBe(project1.id);
        expect(module2.projectId).toBe(project2.id);
      },
    );
  });

  describe('getModule', () => {
    it.each(supportedDatabaseIds)(
      'returns undefined for non-existent module - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const module = await service.getModule({ id: nonExistentId });
        expect(module).toBeUndefined();
      },
    );

    it.each(supportedDatabaseIds)(
      'returns the module by ID with all fields - %p',
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
        const created = await service.createModule({
          name: 'Test Module',
          sourcePath: '/path/to/module',
          projectId: project.id,
        });

        const retrieved = await service.getModule({ id: created.id });
        expect(retrieved).toBeDefined();
        expect(retrieved?.id).toBe(created.id);
        expect(retrieved?.name).toBe(created.name);
        expect(retrieved?.sourcePath).toBe(created.sourcePath);
        expect(retrieved?.projectId).toBe(created.projectId);
      },
    );

    it.each(supportedDatabaseIds)(
      'returns correct module when multiple exist - %p',
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

        const r1 = await service.getModule({ id: module1.id });
        const r2 = await service.getModule({ id: module2.id });
        expect(r1?.id).toBe(module1.id);
        expect(r1?.name).toBe('Module 1');
        expect(r2?.id).toBe(module2.id);
        expect(r2?.name).toBe('Module 2');
      },
    );

    describe('status and errorDetails (enrichment)', () => {
      it.each(supportedDatabaseIds)(
        'returns status pending and no errorDetails when module has no jobs - %p',
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
          const mod = await service.createModule({
            name: 'No Jobs Module',
            sourcePath: '/no-jobs',
            projectId: project.id,
          });

          const retrieved = await service.getModule({ id: mod.id });

          expect(retrieved).toBeDefined();
          expect(retrieved?.status).toBe('pending');
          expect(retrieved?.errorDetails).toBeUndefined();
          expect(retrieved?.analyze).toBeUndefined();
          expect(retrieved?.migrate).toBeUndefined();
          expect(retrieved?.publish).toBeUndefined();
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'returns status success and no errorDetails when all phases finished successfully - %p',
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
          const mod = await service.createModule({
            name: 'Success Module',
            sourcePath: '/success',
            projectId: project.id,
          });
          const analyzeJob = await service.createJob({
            projectId: project.id,
            moduleId: mod.id,
            phase: 'analyze',
            status: 'success',
          });
          const migrateJob = await service.createJob({
            projectId: project.id,
            moduleId: mod.id,
            phase: 'migrate',
            status: 'success',
          });
          const publishJob = await service.createJob({
            projectId: project.id,
            moduleId: mod.id,
            phase: 'publish',
            status: 'success',
          });

          const retrieved = await service.getModule({ id: mod.id });

          expect(retrieved).toBeDefined();
          expect(retrieved?.status).toBe('success');
          expect(retrieved?.errorDetails).toBeUndefined();
          expect(retrieved?.analyze?.id).toBe(analyzeJob.id);
          expect(retrieved?.migrate?.id).toBe(migrateJob.id);
          expect(retrieved?.publish?.id).toBe(publishJob.id);
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'returns status running when last job (e.g. migrate) is running - %p',
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
          const mod = await service.createModule({
            name: 'Running Module',
            sourcePath: '/running',
            projectId: project.id,
          });
          await service.createJob({
            projectId: project.id,
            moduleId: mod.id,
            phase: 'analyze',
            status: 'success',
          });
          await service.createJob({
            projectId: project.id,
            moduleId: mod.id,
            phase: 'migrate',
            status: 'running',
          });

          const retrieved = await service.getModule({ id: mod.id });

          expect(retrieved).toBeDefined();
          expect(retrieved?.status).toBe('running');
          expect(retrieved?.errorDetails).toBeUndefined();
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'returns status error and errorDetails from analyze job when analyze failed - %p',
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
          const mod = await service.createModule({
            name: 'Analyze Error Module',
            sourcePath: '/analyze-error',
            projectId: project.id,
          });
          const analyzeJob = await service.createJob({
            projectId: project.id,
            moduleId: mod.id,
            phase: 'analyze',
            status: 'pending',
          });
          await service.updateJob({
            id: analyzeJob.id,
            status: 'error',
            errorDetails: 'Analyze failed: timeout',
          });

          const retrieved = await service.getModule({ id: mod.id });

          expect(retrieved).toBeDefined();
          expect(retrieved?.status).toBe('error');
          expect(retrieved?.errorDetails).toBe('Analyze failed: timeout');
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'returns status error and errorDetails from migrate job when migrate is last phase and failed - %p',
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
          const mod = await service.createModule({
            name: 'Migrate Error Module',
            sourcePath: '/migrate-error',
            projectId: project.id,
          });
          await service.createJob({
            projectId: project.id,
            moduleId: mod.id,
            phase: 'analyze',
            status: 'success',
          });
          const migrateJob = await service.createJob({
            projectId: project.id,
            moduleId: mod.id,
            phase: 'migrate',
            status: 'pending',
          });
          await service.updateJob({
            id: migrateJob.id,
            status: 'error',
            errorDetails: 'Migration failed: conflict',
          });

          const retrieved = await service.getModule({ id: mod.id });

          expect(retrieved).toBeDefined();
          expect(retrieved?.status).toBe('error');
          expect(retrieved?.errorDetails).toBe('Migration failed: conflict');
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'returns status error and errorDetails from publish job when publish failed - %p',
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
          const mod = await service.createModule({
            name: 'Publish Error Module',
            sourcePath: '/publish-error',
            projectId: project.id,
          });
          await service.createJob({
            projectId: project.id,
            moduleId: mod.id,
            phase: 'analyze',
            status: 'success',
          });
          await service.createJob({
            projectId: project.id,
            moduleId: mod.id,
            phase: 'migrate',
            status: 'success',
          });
          const publishJob = await service.createJob({
            projectId: project.id,
            moduleId: mod.id,
            phase: 'publish',
            status: 'pending',
          });
          await service.updateJob({
            id: publishJob.id,
            status: 'error',
            errorDetails: 'Publish failed: push rejected',
          });

          const retrieved = await service.getModule({ id: mod.id });

          expect(retrieved).toBeDefined();
          expect(retrieved?.status).toBe('error');
          expect(retrieved?.errorDetails).toBe('Publish failed: push rejected');
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'uses last phase for status so publish success overrides earlier analyze error - %p',
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
          const mod = await service.createModule({
            name: 'Publish Success Module',
            sourcePath: '/publish-ok',
            projectId: project.id,
          });
          await service.createJob({
            projectId: project.id,
            moduleId: mod.id,
            phase: 'analyze',
            status: 'error',
          });
          await service.createJob({
            projectId: project.id,
            moduleId: mod.id,
            phase: 'migrate',
            status: 'success',
          });
          await service.createJob({
            projectId: project.id,
            moduleId: mod.id,
            phase: 'publish',
            status: 'success',
          });

          const retrieved = await service.getModule({ id: mod.id });

          expect(retrieved).toBeDefined();
          expect(retrieved?.status).toBe('success');
          expect(retrieved?.errorDetails).toBeUndefined();
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'with skipEnrichment true returns module without status or errorDetails - %p',
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
          const mod = await service.createModule({
            name: 'Skip Enrich Module',
            sourcePath: '/skip-enrich',
            projectId: project.id,
          });
          await service.createJob({
            projectId: project.id,
            moduleId: mod.id,
            phase: 'analyze',
            status: 'error',
          });

          const retrieved = await service.getModule({
            id: mod.id,
            skipEnrichment: true,
          });

          expect(retrieved).toBeDefined();
          expect(retrieved?.id).toBe(mod.id);
          expect(retrieved?.name).toBe(mod.name);
          expect(retrieved?.sourcePath).toBe(mod.sourcePath);
          expect(retrieved?.projectId).toBe(mod.projectId);
          expect(retrieved?.status).toBeUndefined();
          expect(retrieved?.errorDetails).toBeUndefined();
          expect(retrieved?.analyze).toBeUndefined();
          expect(retrieved?.migrate).toBeUndefined();
          expect(retrieved?.publish).toBeUndefined();
        },
        LONG_TEST_TIMEOUT,
      );
    });
  });
});
