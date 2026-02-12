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
import { LONG_TEST_TIMEOUT, nonExistentId } from '../../utils';

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
  });

  describe('listModules', () => {
    it.each(supportedDatabaseIds)(
      'returns empty list when project has no modules - %p',
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

        const modules = await service.listModules({ projectId: project.id });
        expect(modules).toEqual([]);
      },
    );

    it.each(supportedDatabaseIds)(
      'returns all modules for project ordered by name - %p',
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
        await service.createModule({
          name: 'Zebra',
          sourcePath: '/z',
          projectId: project.id,
        });
        await service.createModule({
          name: 'Alpha',
          sourcePath: '/a',
          projectId: project.id,
        });
        await service.createModule({
          name: 'Beta',
          sourcePath: '/b',
          projectId: project.id,
        });

        const modules = await service.listModules({ projectId: project.id });
        expect(modules).toHaveLength(3);
        expect(modules[0].name).toBe('Alpha');
        expect(modules[1].name).toBe('Beta');
        expect(modules[2].name).toBe('Zebra');
      },
    );

    it.each(supportedDatabaseIds)(
      'returns only modules for the specified project - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const credentials = mockCredentials.user();
        const project1 = await service.createProject(
          {
            name: 'Project 1',
            abbreviation: 'P1',
            description: 'D1',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );
        const project2 = await service.createProject(
          {
            name: 'Project 2',
            abbreviation: 'P2',
            description: 'D2',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );
        const module1Project1 = await service.createModule({
          name: 'M1P1',
          sourcePath: '/m1',
          projectId: project1.id,
        });
        await service.createModule({
          name: 'M2P1',
          sourcePath: '/m2',
          projectId: project1.id,
        });
        const module1Project2 = await service.createModule({
          name: 'M1P2',
          sourcePath: '/m3',
          projectId: project2.id,
        });

        const project1Modules = await service.listModules({
          projectId: project1.id,
        });
        const project2Modules = await service.listModules({
          projectId: project2.id,
        });
        expect(project1Modules).toHaveLength(2);
        expect(project2Modules).toHaveLength(1);
        expect(project2Modules[0].id).toBe(module1Project2.id);
        expect(project1Modules.map(m => m.id)).toContain(module1Project1.id);
      },
    );

    it.each(supportedDatabaseIds)(
      'returns each module with status and optional analyze, migrate, publish - %p',
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
        await service.createModule({
          name: 'Module A',
          sourcePath: '/a',
          projectId: project.id,
        });

        const modules = await service.listModules({ projectId: project.id });

        expect(modules).toHaveLength(1);
        expect(modules[0]).toHaveProperty('status');
        expect(modules[0].status).toBe('pending');
        expect(modules[0].id).toBeDefined();
        expect(modules[0].name).toBe('Module A');
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'enriches each module with last analyze, migrate, publish when jobs exist - %p',
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
          name: 'Module With Jobs',
          sourcePath: '/with-jobs',
          projectId: project.id,
        });
        const analyzeJob = await service.createJob({
          projectId: project.id,
          moduleId: mod.id,
          phase: 'analyze',
          status: 'pending',
          callbackToken: 'tk',
        });
        await service.updateJob({
          id: analyzeJob.id,
          status: 'success',
        });

        const modError = await service.createModule({
          name: 'Module With Error',
          sourcePath: '/with-error',
          projectId: project.id,
        });
        const errorJob = await service.createJob({
          projectId: project.id,
          moduleId: modError.id,
          phase: 'analyze',
          status: 'pending',
          callbackToken: 'tk2',
        });
        await service.updateJob({
          id: errorJob.id,
          status: 'error',
          errorDetails: 'Analyze failed: timeout',
        });

        const modules = await service.listModules({ projectId: project.id });

        expect(modules).toHaveLength(2);
        const successModule = modules.find(m => m.name === 'Module With Jobs');
        expect(successModule).toBeDefined();
        expect(successModule?.analyze).toBeDefined();
        expect(successModule?.analyze?.id).toBe(analyzeJob.id);
        expect(successModule?.analyze?.phase).toBe('analyze');
        expect(successModule?.analyze).not.toHaveProperty('callbackToken');
        expect(successModule?.migrate).toBeUndefined();
        expect(successModule?.publish).toBeUndefined();
        expect(successModule?.status).toBe('success');
        expect(successModule?.errorDetails ?? undefined).toBeUndefined();

        const errorModule = modules.find(m => m.name === 'Module With Error');
        expect(errorModule).toBeDefined();
        expect(errorModule?.status).toBe('error');
        expect(errorModule?.errorDetails).toBe('Analyze failed: timeout');
      },
      LONG_TEST_TIMEOUT,
    );
  });

  describe('deleteModule', () => {
    it.each(supportedDatabaseIds)(
      'returns 0 when deleting non-existent module - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const deletedCount = await service.deleteModule({ id: nonExistentId });
        expect(deletedCount).toBe(0);
      },
    );

    it.each(supportedDatabaseIds)(
      'deletes module and returns 1 - %p',
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
          name: 'To Delete',
          sourcePath: '/path/to/delete',
          projectId: project.id,
        });
        expect(await service.getModule({ id: module.id })).toBeDefined();

        const deletedCount = await service.deleteModule({ id: module.id });
        expect(deletedCount).toBe(1);
        expect(await service.getModule({ id: module.id })).toBeUndefined();
      },
    );

    it.each(supportedDatabaseIds)(
      'deletes only the specified module - %p',
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

        const deletedCount = await service.deleteModule({ id: module1.id });
        expect(deletedCount).toBe(1);
        expect(await service.getModule({ id: module1.id })).toBeUndefined();
        const remaining = await service.getModule({ id: module2.id });
        expect(remaining).toBeDefined();
        expect(remaining?.name).toBe('Module 2');
        const listResult = await service.listModules({ projectId: project.id });
        expect(listResult).toHaveLength(1);
        expect(listResult[0].id).toBe(module2.id);
      },
    );
  });

  describe('CASCADE delete (project → modules)', () => {
    it.each(supportedDatabaseIds)(
      'cascade deletes modules when project is deleted - %p',
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
        const module3 = await service.createModule({
          name: 'Module 3',
          sourcePath: '/path/to/module3',
          projectId: project.id,
        });

        expect(await service.getModule({ id: module1.id })).toBeDefined();
        expect(await service.getModule({ id: module2.id })).toBeDefined();
        expect(await service.getModule({ id: module3.id })).toBeDefined();
        expect(
          await service.listModules({ projectId: project.id }),
        ).toHaveLength(3);

        const deletedCount = await service.deleteProject(
          { projectId: project.id },
          { credentials },
        );
        expect(deletedCount).toBe(1);
        expect(
          await service.getProject({ projectId: project.id }, { credentials }),
        ).toBeUndefined();

        expect(await service.getModule({ id: module1.id })).toBeUndefined();
        expect(await service.getModule({ id: module2.id })).toBeUndefined();
        expect(await service.getModule({ id: module3.id })).toBeUndefined();
        expect(await service.listModules({ projectId: project.id })).toEqual(
          [],
        );

        const dbModules = await client('modules')
          .whereIn('id', [module1.id, module2.id, module3.id])
          .select('*');
        expect(dbModules).toHaveLength(0);
      },
    );

    it.each(supportedDatabaseIds)(
      'cascade deletes only modules of the deleted project - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const credentials = mockCredentials.user();
        const project1 = await service.createProject(
          {
            name: 'Project 1',
            abbreviation: 'P1',
            description: 'D1',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );
        const project2 = await service.createProject(
          {
            name: 'Project 2',
            abbreviation: 'P2',
            description: 'D2',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );
        const module1P1 = await service.createModule({
          name: 'M1P1',
          sourcePath: '/m1',
          projectId: project1.id,
        });
        const module2P1 = await service.createModule({
          name: 'M2P1',
          sourcePath: '/m2',
          projectId: project1.id,
        });
        const module1P2 = await service.createModule({
          name: 'M1P2',
          sourcePath: '/m3',
          projectId: project2.id,
        });

        await service.deleteProject(
          { projectId: project1.id },
          { credentials },
        );

        expect(await service.getModule({ id: module1P1.id })).toBeUndefined();
        expect(await service.getModule({ id: module2P1.id })).toBeUndefined();
        const remaining = await service.getModule({ id: module1P2.id });
        expect(remaining).toBeDefined();
        expect(remaining?.projectId).toBe(project2.id);
        expect(
          await service.listModules({ projectId: project2.id }),
        ).toHaveLength(1);
        expect(
          (await service.listModules({ projectId: project2.id }))[0].id,
        ).toBe(module1P2.id);
      },
    );
  });
});
