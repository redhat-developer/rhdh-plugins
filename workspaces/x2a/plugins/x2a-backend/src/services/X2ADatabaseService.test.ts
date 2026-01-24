/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * you may obtain a copy of the License at
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
  mockCredentials,
  mockServices,
  TestDatabaseId,
  TestDatabases,
} from '@backstage/backend-test-utils';
import { Knex } from 'knex';
import { X2ADatabaseService } from './X2ADatabaseService';
import { migrate } from './dbMigrate';
import { toSorted } from '../utils';

const databases = TestDatabases.create({
  // TODO: Reenable for 'POSTGRES_18'
  ids: ['SQLITE_3'],
});

async function createDatabase(databaseId: TestDatabaseId) {
  const client = await databases.init(databaseId);
  const mockDatabaseService = mockServices.database.mock({
    getClient: async () => client,
    migrations: { skip: false },
  });

  await migrate(mockDatabaseService);

  return {
    client,
  };
}

function createService(client: Knex): X2ADatabaseService {
  return X2ADatabaseService.create({
    logger: mockServices.logger.mock(),
    dbClient: client,
  });
}

describe('X2ADatabaseService', () => {
  describe('createProject', () => {
    it.each(databases.eachSupportedId())(
      'should create a project with all required fields - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const input = {
          name: 'Test Project',
          abbreviation: 'TP',
          description: 'A test project description',
        };

        const credentials = mockCredentials.user();
        const project = await service.createProject(input, { credentials });

        expect(project).toMatchObject({
          name: input.name,
          abbreviation: input.abbreviation,
          description: input.description,
          createdBy: 'user:default/mock',
        });
        expect(project.id).toBeDefined();
        expect(project.createdAt).toBeInstanceOf(Date);

        // Verify it was persisted in the database
        const row = await client('projects').where('id', project.id).first();
        expect(row).toBeDefined();
        expect(row.name).toBe(input.name);
        expect(row.abbreviation).toBe(input.abbreviation);
        expect(row.description).toBe(input.description);
        expect(row.created_by).toBe('user:default/mock');
      },
    );

    it.each(databases.eachSupportedId())(
      'should create multiple projects with different IDs - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project1 = await service.createProject(
          {
            name: 'Project 1',
            abbreviation: 'P1',
            description: 'First project',
          },
          { credentials },
        );

        const project2 = await service.createProject(
          {
            name: 'Project 2',
            abbreviation: 'P2',
            description: 'Second project',
          },
          { credentials },
        );

        expect(project1.id).not.toBe(project2.id);
        expect(project1.name).toBe('Project 1');
        expect(project2.name).toBe('Project 2');
      },
    );

    it.each(databases.eachSupportedId())(
      'should use the correct user from credentials - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const customCredentials = mockCredentials.user(
          'user:default/custom-user',
        );
        const project = await service.createProject(
          {
            name: 'Custom User Project',
            abbreviation: 'CUP',
            description: 'Project by custom user',
          },
          { credentials: customCredentials },
        );

        expect(project.createdBy).toBe('user:default/custom-user');
        const row = await client('projects').where('id', project.id).first();
        expect(row.created_by).toBe('user:default/custom-user');
      },
    );
  });

  describe('listProjects', () => {
    it.each(databases.eachSupportedId())(
      'should return empty list when no projects exist - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const result = await service.listProjects();

        expect(result.projects).toEqual([]);
        expect(result.totalCount).toBe(0);
      },
    );

    it.each(databases.eachSupportedId())(
      'should return all projects with correct totalCount - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        await service.createProject(
          {
            name: 'Project 1',
            abbreviation: 'P1',
            description: 'First project',
          },
          { credentials },
        );
        await service.createProject(
          {
            name: 'Project 2',
            abbreviation: 'P2',
            description: 'Second project',
          },
          { credentials },
        );
        await service.createProject(
          {
            name: 'Project 3',
            abbreviation: 'P3',
            description: 'Third project',
          },
          { credentials },
        );

        const result = await service.listProjects();

        expect(result.totalCount).toBe(3);
        expect(result.projects).toHaveLength(3);
        expect(result.projects[0].name).toBe('Project 3'); // Should be ordered by created_at desc
        expect(result.projects[1].name).toBe('Project 2');
        expect(result.projects[2].name).toBe('Project 1');
      },
    );
  });

  describe('getProject', () => {
    it.each(databases.eachSupportedId())(
      'should return undefined for non-existent project - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const project = await service.getProject({
          projectId: 'non-existent-id',
        });

        expect(project).toBeUndefined();
      },
    );

    it.each(databases.eachSupportedId())(
      'should return the correct project by ID - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const createdProject = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'Test description',
          },
          { credentials },
        );

        const retrievedProject = await service.getProject({
          projectId: createdProject.id,
        });

        expect(retrievedProject).toBeDefined();
        expect(retrievedProject?.id).toBe(createdProject.id);
        expect(retrievedProject?.name).toBe(createdProject.name);
        expect(retrievedProject?.abbreviation).toBe(
          createdProject.abbreviation,
        );
        expect(retrievedProject?.description).toBe(createdProject.description);
        expect(retrievedProject?.createdBy).toBe(createdProject.createdBy);
        expect(retrievedProject?.createdAt).toEqual(createdProject.createdAt);
      },
    );

    it.each(databases.eachSupportedId())(
      'should return correct project when multiple projects exist - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project1 = await service.createProject(
          {
            name: 'Project 1',
            abbreviation: 'P1',
            description: 'First project',
          },
          { credentials },
        );
        const project2 = await service.createProject(
          {
            name: 'Project 2',
            abbreviation: 'P2',
            description: 'Second project',
          },
          { credentials },
        );

        const retrieved1 = await service.getProject({ projectId: project1.id });
        const retrieved2 = await service.getProject({ projectId: project2.id });

        expect(retrieved1?.id).toBe(project1.id);
        expect(retrieved1?.name).toBe('Project 1');
        expect(retrieved2?.id).toBe(project2.id);
        expect(retrieved2?.name).toBe('Project 2');
      },
    );
  });

  describe('deleteProject', () => {
    it.each(databases.eachSupportedId())(
      'should return 0 when deleting non-existent project - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const deletedCount = await service.deleteProject({
          projectId: 'non-existent-id',
        });

        expect(deletedCount).toBe(0);
      },
    );

    it.each(databases.eachSupportedId())(
      'should delete a project and return 1 - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'To Delete',
            abbreviation: 'TD',
            description: 'Project to be deleted',
          },
          { credentials },
        );

        // Verify it exists
        const beforeDelete = await service.getProject({
          projectId: project.id,
        });
        expect(beforeDelete).toBeDefined();

        // Delete it
        const deletedCount = await service.deleteProject({
          projectId: project.id,
        });

        expect(deletedCount).toBe(1);

        // Verify it's gone
        const afterDelete = await service.getProject({ projectId: project.id });
        expect(afterDelete).toBeUndefined();
      },
    );

    it.each(databases.eachSupportedId())(
      'should only delete the specified project - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project1 = await service.createProject(
          {
            name: 'Project 1',
            abbreviation: 'P1',
            description: 'First project',
          },
          { credentials },
        );
        const project2 = await service.createProject(
          {
            name: 'Project 2',
            abbreviation: 'P2',
            description: 'Second project',
          },
          { credentials },
        );

        const deletedCount = await service.deleteProject({
          projectId: project1.id,
        });

        expect(deletedCount).toBe(1);

        // Verify project1 is deleted
        const deleted = await service.getProject({ projectId: project1.id });
        expect(deleted).toBeUndefined();

        // Verify project2 still exists
        const remaining = await service.getProject({ projectId: project2.id });
        expect(remaining).toBeDefined();
        expect(remaining?.name).toBe('Project 2');

        // Verify total count
        const listResult = await service.listProjects();
        expect(listResult.totalCount).toBe(1);
        expect(listResult.projects[0].id).toBe(project2.id);
      },
    );
  });

  describe('integration tests', () => {
    it.each(databases.eachSupportedId())(
      'should handle full CRUD lifecycle - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();

        // Create
        const project = await service.createProject(
          {
            name: 'Lifecycle Test',
            abbreviation: 'LT',
            description: 'Testing full lifecycle',
          },
          { credentials },
        );

        // Read
        const retrieved = await service.getProject({ projectId: project.id });
        expect(retrieved).toBeDefined();
        expect(retrieved?.name).toBe('Lifecycle Test');

        // List
        const listResult = await service.listProjects();
        expect(listResult.totalCount).toBe(1);
        expect(listResult.projects[0].id).toBe(project.id);

        // Delete
        const deletedCount = await service.deleteProject({
          projectId: project.id,
        });
        expect(deletedCount).toBe(1);

        // Verify deletion
        const afterDelete = await service.getProject({ projectId: project.id });
        expect(afterDelete).toBeUndefined();

        const finalList = await service.listProjects();
        expect(finalList.totalCount).toBe(0);
      },
    );
  });

  describe('createModule', () => {
    it.each(databases.eachSupportedId())(
      'should create a module with all required fields - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'A test project',
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

        // Verify it was persisted in the database
        const row = await client('modules').where('id', module.id).first();
        expect(row).toBeDefined();
        expect(row.name).toBe(moduleInput.name);
        expect(row.source_path).toBe(moduleInput.sourcePath);
        expect(row.project_id).toBe(moduleInput.projectId);
      },
    );

    it.each(databases.eachSupportedId())(
      'should create multiple modules with different IDs - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'A test project',
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
    );

    it.each(databases.eachSupportedId())(
      'should create modules for different projects - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project1 = await service.createProject(
          {
            name: 'Project 1',
            abbreviation: 'P1',
            description: 'First project',
          },
          { credentials },
        );
        const project2 = await service.createProject(
          {
            name: 'Project 2',
            abbreviation: 'P2',
            description: 'Second project',
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
    it.each(databases.eachSupportedId())(
      'should return undefined for non-existent module - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const module = await service.getModule({ id: 'non-existent-id' });

        expect(module).toBeUndefined();
      },
    );

    it.each(databases.eachSupportedId())(
      'should return the correct module by ID - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'Test description',
          },
          { credentials },
        );

        const createdModule = await service.createModule({
          name: 'Test Module',
          sourcePath: '/path/to/module',
          projectId: project.id,
        });

        const retrievedModule = await service.getModule({
          id: createdModule.id,
        });

        expect(retrievedModule).toBeDefined();
        expect(retrievedModule?.id).toBe(createdModule.id);
        expect(retrievedModule?.name).toBe(createdModule.name);
        expect(retrievedModule?.sourcePath).toBe(createdModule.sourcePath);
        expect(retrievedModule?.projectId).toBe(createdModule.projectId);
      },
    );

    it.each(databases.eachSupportedId())(
      'should return correct module when multiple modules exist - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'Test description',
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

        const retrieved1 = await service.getModule({ id: module1.id });
        const retrieved2 = await service.getModule({ id: module2.id });

        expect(retrieved1?.id).toBe(module1.id);
        expect(retrieved1?.name).toBe('Module 1');
        expect(retrieved2?.id).toBe(module2.id);
        expect(retrieved2?.name).toBe('Module 2');
      },
    );
  });

  describe('listModules', () => {
    it.each(databases.eachSupportedId())(
      'should return empty list when no modules exist for project - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'Test description',
          },
          { credentials },
        );

        const modules = await service.listModules({ projectId: project.id });

        expect(modules).toEqual([]);
      },
    );

    it.each(databases.eachSupportedId())(
      'should return all modules for a project - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'Test description',
          },
          { credentials },
        );

        await service.createModule({
          name: 'Module A',
          sourcePath: '/path/to/moduleA',
          projectId: project.id,
        });
        await service.createModule({
          name: 'Module B',
          sourcePath: '/path/to/moduleB',
          projectId: project.id,
        });
        await service.createModule({
          name: 'Module C',
          sourcePath: '/path/to/moduleC',
          projectId: project.id,
        });

        const modules = await service.listModules({ projectId: project.id });

        expect(modules).toHaveLength(3);
        // Should be ordered by name ascending
        expect(modules[0].name).toBe('Module A');
        expect(modules[1].name).toBe('Module B');
        expect(modules[2].name).toBe('Module C');
      },
    );

    it.each(databases.eachSupportedId())(
      'should only return modules for the specified project - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project1 = await service.createProject(
          {
            name: 'Project 1',
            abbreviation: 'P1',
            description: 'First project',
          },
          { credentials },
        );
        const project2 = await service.createProject(
          {
            name: 'Project 2',
            abbreviation: 'P2',
            description: 'Second project',
          },
          { credentials },
        );

        await service.createModule({
          name: 'Module for Project 1',
          sourcePath: '/path/to/module1',
          projectId: project1.id,
        });
        await service.createModule({
          name: 'Another Module for Project 1',
          sourcePath: '/path/to/module1b',
          projectId: project1.id,
        });
        await service.createModule({
          name: 'Module for Project 2',
          sourcePath: '/path/to/module2',
          projectId: project2.id,
        });

        const project1Modules = await service.listModules({
          projectId: project1.id,
        });
        const project2Modules = await service.listModules({
          projectId: project2.id,
        });

        expect(project1Modules).toHaveLength(2);
        expect(project1Modules.every(m => m.projectId === project1.id)).toBe(
          true,
        );
        expect(project2Modules).toHaveLength(1);
        expect(project2Modules[0].projectId).toBe(project2.id);
      },
    );
  });

  describe('deleteModule', () => {
    it.each(databases.eachSupportedId())(
      'should return 0 when deleting non-existent module - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const deletedCount = await service.deleteModule({
          id: 'non-existent-id',
        });

        expect(deletedCount).toBe(0);
      },
    );

    it.each(databases.eachSupportedId())(
      'should delete a module and return 1 - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'Test description',
          },
          { credentials },
        );

        const module = await service.createModule({
          name: 'To Delete',
          sourcePath: '/path/to/delete',
          projectId: project.id,
        });

        // Verify it exists
        const beforeDelete = await service.getModule({ id: module.id });
        expect(beforeDelete).toBeDefined();

        // Delete it
        const deletedCount = await service.deleteModule({ id: module.id });

        expect(deletedCount).toBe(1);

        // Verify it's gone
        const afterDelete = await service.getModule({ id: module.id });
        expect(afterDelete).toBeUndefined();
      },
    );

    it.each(databases.eachSupportedId())(
      'should only delete the specified module - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'Test description',
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

        // Verify module1 is deleted
        const deleted = await service.getModule({ id: module1.id });
        expect(deleted).toBeUndefined();

        // Verify module2 still exists
        const remaining = await service.getModule({ id: module2.id });
        expect(remaining).toBeDefined();
        expect(remaining?.name).toBe('Module 2');

        // Verify listModules still returns module2
        const listResult = await service.listModules({
          projectId: project.id,
        });
        expect(listResult).toHaveLength(1);
        expect(listResult[0].id).toBe(module2.id);
      },
    );
  });

  describe('CASCADE delete', () => {
    it.each(databases.eachSupportedId())(
      'should cascade delete modules when project is deleted - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'Test description',
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

        // Verify modules exist
        expect(await service.getModule({ id: module1.id })).toBeDefined();
        expect(await service.getModule({ id: module2.id })).toBeDefined();
        expect(await service.getModule({ id: module3.id })).toBeDefined();

        const modulesBefore = await service.listModules({
          projectId: project.id,
        });
        expect(modulesBefore).toHaveLength(3);

        // Delete the project
        const deletedCount = await service.deleteProject({
          projectId: project.id,
        });
        expect(deletedCount).toBe(1);

        // Verify project is deleted
        const projectAfter = await service.getProject({
          projectId: project.id,
        });
        expect(projectAfter).toBeUndefined();

        // Verify all modules are cascade deleted
        expect(await service.getModule({ id: module1.id })).toBeUndefined();
        expect(await service.getModule({ id: module2.id })).toBeUndefined();
        expect(await service.getModule({ id: module3.id })).toBeUndefined();

        // Verify listModules returns empty for deleted project
        const modulesAfter = await service.listModules({
          projectId: project.id,
        });
        expect(modulesAfter).toEqual([]);

        // Verify modules are deleted from database directly
        const dbModules = await client('modules')
          .whereIn('id', [module1.id, module2.id, module3.id])
          .select('*');
        expect(dbModules).toHaveLength(0);
      },
    );

    it.each(databases.eachSupportedId())(
      'should only cascade delete modules for the deleted project - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project1 = await service.createProject(
          {
            name: 'Project 1',
            abbreviation: 'P1',
            description: 'First project',
          },
          { credentials },
        );
        const project2 = await service.createProject(
          {
            name: 'Project 2',
            abbreviation: 'P2',
            description: 'Second project',
          },
          { credentials },
        );

        const module1Project1 = await service.createModule({
          name: 'Module 1 for Project 1',
          sourcePath: '/path/to/module1',
          projectId: project1.id,
        });
        const module2Project1 = await service.createModule({
          name: 'Module 2 for Project 1',
          sourcePath: '/path/to/module2',
          projectId: project1.id,
        });
        const module1Project2 = await service.createModule({
          name: 'Module 1 for Project 2',
          sourcePath: '/path/to/module3',
          projectId: project2.id,
        });

        // Delete project1
        await service.deleteProject({ projectId: project1.id });

        // Verify project1 modules are cascade deleted
        expect(
          await service.getModule({ id: module1Project1.id }),
        ).toBeUndefined();
        expect(
          await service.getModule({ id: module2Project1.id }),
        ).toBeUndefined();

        // Verify project2 module still exists
        const remainingModule = await service.getModule({
          id: module1Project2.id,
        });
        expect(remainingModule).toBeDefined();
        expect(remainingModule?.projectId).toBe(project2.id);

        // Verify project2 still has its module
        const project2Modules = await service.listModules({
          projectId: project2.id,
        });
        expect(project2Modules).toHaveLength(1);
        expect(project2Modules[0].id).toBe(module1Project2.id);
      },
    );
  });

  describe('createJob', () => {
    it.each(databases.eachSupportedId())(
      'should create a job with all required fields - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'A test project',
          },
          { credentials },
        );

        const module = await service.createModule({
          name: 'Test Module',
          sourcePath: '/path/to/module',
          projectId: project.id,
        });

        const jobInput = {
          moduleId: module.id,
        };

        const job = await service.createJob(jobInput);

        expect(job).toMatchObject({
          moduleId: module.id,
          status: 'pending',
          artifacts: [],
        });
        expect(job.id).toBeDefined();
        expect(job.startedAt).toBeInstanceOf(Date);
        expect(job.finishedAt).toBeNull();
        expect(job.log).toBeNull();

        // Verify it was persisted in the database
        const row = await client('jobs').where('id', job.id).first();
        expect(row).toBeDefined();
        expect(row.module_id).toBe(module.id);
        expect(row.status).toBe('pending');
        expect(row.log).toBeNull();
      },
    );

    it.each(databases.eachSupportedId())(
      'should create a job with optional fields - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'A test project',
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
          moduleId: module.id,
          log: 'Job log content',
          startedAt,
          finishedAt,
          status: 'success' as const,
        };

        const job = await service.createJob(jobInput);

        expect(job).toMatchObject({
          moduleId: module.id,
          log: 'Job log content',
          status: 'success',
          artifacts: [],
        });
        expect(job.startedAt).toEqual(startedAt);
        expect(job.finishedAt).toEqual(finishedAt);
      },
    );

    it.each(databases.eachSupportedId())(
      'should create a job with artifacts - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'A test project',
          },
          { credentials },
        );

        const module = await service.createModule({
          name: 'Test Module',
          sourcePath: '/path/to/module',
          projectId: project.id,
        });

        const artifacts = [
          'http://example.com/artifact1.md',
          'http://example.com/artifact2.json',
          'http://example.com/artifact3',
        ];
        const job = await service.createJob({
          moduleId: module.id,
          artifacts,
        });

        expect(job.artifacts).toEqual(artifacts);
        expect(job.artifacts).toHaveLength(3);

        // Verify artifacts were persisted in the database
        const artifactRows = await client('artifacts')
          .where('job_id', job.id)
          .select('value')
          .orderBy('id', 'asc');
        expect(artifactRows).toHaveLength(3);
        expect(artifactRows.map(r => r.value).sort(toSorted)).toEqual(
          artifacts.sort(toSorted),
        );
      },
    );

    it.each(databases.eachSupportedId())(
      'should create multiple jobs with different IDs - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'A test project',
          },
          { credentials },
        );

        const module = await service.createModule({
          name: 'Test Module',
          sourcePath: '/path/to/module',
          projectId: project.id,
        });

        const job1 = await service.createJob({ moduleId: module.id });
        const job2 = await service.createJob({ moduleId: module.id });

        expect(job1.id).not.toBe(job2.id);
        expect(job1.moduleId).toBe(module.id);
        expect(job2.moduleId).toBe(module.id);
      },
    );

    it.each(databases.eachSupportedId())(
      'should create jobs for different modules - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'A test project',
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

        const job1 = await service.createJob({ moduleId: module1.id });
        const job2 = await service.createJob({ moduleId: module2.id });

        expect(job1.moduleId).toBe(module1.id);
        expect(job2.moduleId).toBe(module2.id);
      },
    );

    it.each(databases.eachSupportedId())(
      'should default status to pending when not provided - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'A test project',
          },
          { credentials },
        );

        const module = await service.createModule({
          name: 'Test Module',
          sourcePath: '/path/to/module',
          projectId: project.id,
        });

        const job = await service.createJob({ moduleId: module.id });

        expect(job.status).toBe('pending');
      },
    );
  });

  describe('getJob', () => {
    it.each(databases.eachSupportedId())(
      'should return undefined for non-existent job - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const job = await service.getJob({ id: 'non-existent-id' });

        expect(job).toBeUndefined();
      },
    );

    it.each(databases.eachSupportedId())(
      'should return the correct job by ID - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'Test description',
          },
          { credentials },
        );

        const module = await service.createModule({
          name: 'Test Module',
          sourcePath: '/path/to/module',
          projectId: project.id,
        });

        const createdJob = await service.createJob({
          moduleId: module.id,
          log: 'Test log',
          status: 'running',
        });

        const retrievedJob = await service.getJob({ id: createdJob.id });

        expect(retrievedJob).toBeDefined();
        expect(retrievedJob?.id).toBe(createdJob.id);
        expect(retrievedJob?.moduleId).toBe(module.id);
        expect(retrievedJob?.log).toBe('Test log');
        expect(retrievedJob?.status).toBe('running');
        expect(retrievedJob?.artifacts).toEqual([]);
      },
    );

    it.each(databases.eachSupportedId())(
      'should return job with artifacts - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'Test description',
          },
          { credentials },
        );

        const module = await service.createModule({
          name: 'Test Module',
          sourcePath: '/path/to/module',
          projectId: project.id,
        });

        const artifacts = ['file1.txt', 'file2.json'];
        const createdJob = await service.createJob({
          moduleId: module.id,
          artifacts,
        });

        const retrievedJob = await service.getJob({ id: createdJob.id });

        expect(retrievedJob).toBeDefined();
        expect(retrievedJob?.artifacts.sort(toSorted)).toEqual(
          artifacts.sort(toSorted),
        );
        expect(retrievedJob?.artifacts).toHaveLength(2);
      },
    );

    it.each(databases.eachSupportedId())(
      'should return correct job when multiple jobs exist - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'Test description',
          },
          { credentials },
        );

        const module = await service.createModule({
          name: 'Test Module',
          sourcePath: '/path/to/module',
          projectId: project.id,
        });

        const job1 = await service.createJob({
          moduleId: module.id,
          status: 'pending',
        });
        const job2 = await service.createJob({
          moduleId: module.id,
          status: 'running',
        });

        const retrieved1 = await service.getJob({ id: job1.id });
        const retrieved2 = await service.getJob({ id: job2.id });

        expect(retrieved1?.id).toBe(job1.id);
        expect(retrieved1?.status).toBe('pending');
        expect(retrieved2?.id).toBe(job2.id);
        expect(retrieved2?.status).toBe('running');
      },
    );
  });

  describe('listJobs', () => {
    it.each(databases.eachSupportedId())(
      'should return empty list when no jobs exist for module - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'Test description',
          },
          { credentials },
        );

        const module = await service.createModule({
          name: 'Test Module',
          sourcePath: '/path/to/module',
          projectId: project.id,
        });

        const jobs = await service.listJobs({ moduleId: module.id });

        expect(jobs).toEqual([]);
      },
    );

    it.each(databases.eachSupportedId())(
      'should return all jobs for a module - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'Test description',
          },
          { credentials },
        );

        const module = await service.createModule({
          name: 'Test Module',
          sourcePath: '/path/to/module',
          projectId: project.id,
        });

        const job1 = await service.createJob({
          moduleId: module.id,
          status: 'pending',
        });
        const job2 = await service.createJob({
          moduleId: module.id,
          status: 'running',
        });
        const job3 = await service.createJob({
          moduleId: module.id,
          status: 'success',
        });

        const jobs = await service.listJobs({ moduleId: module.id });

        expect(jobs).toHaveLength(3);
        // Should be ordered by started_at descending
        expect(jobs.map(j => j.id)).toContain(job1.id);
        expect(jobs.map(j => j.id)).toContain(job2.id);
        expect(jobs.map(j => j.id)).toContain(job3.id);
      },
    );

    it.each(databases.eachSupportedId())(
      'should return jobs with their artifacts - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'Test description',
          },
          { credentials },
        );

        const module = await service.createModule({
          name: 'Test Module',
          sourcePath: '/path/to/module',
          projectId: project.id,
        });

        const job1 = await service.createJob({
          moduleId: module.id,
          artifacts: ['artifact1.txt', 'artifact2.json'],
        });
        const job2 = await service.createJob({
          moduleId: module.id,
          artifacts: ['artifact3.log'],
        });

        const jobs = await service.listJobs({ moduleId: module.id });

        expect(jobs).toHaveLength(2);
        const foundJob1 = jobs.find(j => j.id === job1.id);
        const foundJob2 = jobs.find(j => j.id === job2.id);

        expect(foundJob1?.artifacts.sort(toSorted)).toEqual([
          'artifact1.txt',
          'artifact2.json',
        ]);
        expect(foundJob2?.artifacts).toEqual(['artifact3.log']);
      },
    );

    it.each(databases.eachSupportedId())(
      'should only return jobs for the specified module - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'Test description',
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

        await service.createJob({ moduleId: module1.id });
        await service.createJob({ moduleId: module1.id });
        await service.createJob({ moduleId: module2.id });

        const module1Jobs = await service.listJobs({ moduleId: module1.id });
        const module2Jobs = await service.listJobs({ moduleId: module2.id });

        expect(module1Jobs).toHaveLength(2);
        expect(module1Jobs.every(j => j.moduleId === module1.id)).toBe(true);
        expect(module2Jobs).toHaveLength(1);
        expect(module2Jobs[0].moduleId).toBe(module2.id);
      },
    );
  });

  describe('updateJob', () => {
    it.each(databases.eachSupportedId())(
      'should return undefined when updating non-existent job - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const updated = await service.updateJob({
          id: 'non-existent-id',
          status: 'running',
        });

        expect(updated).toBeUndefined();
      },
    );

    it.each(databases.eachSupportedId())(
      'should update job status - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'Test description',
          },
          { credentials },
        );

        const module = await service.createModule({
          name: 'Test Module',
          sourcePath: '/path/to/module',
          projectId: project.id,
        });

        const job = await service.createJob({
          moduleId: module.id,
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

    it.each(databases.eachSupportedId())(
      'should update job log - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'Test description',
          },
          { credentials },
        );

        const module = await service.createModule({
          name: 'Test Module',
          sourcePath: '/path/to/module',
          projectId: project.id,
        });

        const job = await service.createJob({
          moduleId: module.id,
          log: 'Initial log',
        });

        const updated = await service.updateJob({
          id: job.id,
          log: 'Updated log content',
        });

        expect(updated).toBeDefined();
        expect(updated?.log).toBe('Updated log content');
      },
    );

    it.each(databases.eachSupportedId())(
      'should update job finishedAt - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'Test description',
          },
          { credentials },
        );

        const module = await service.createModule({
          name: 'Test Module',
          sourcePath: '/path/to/module',
          projectId: project.id,
        });

        const job = await service.createJob({
          moduleId: module.id,
        });

        const finishedAt = new Date('2026-01-24T12:00:00Z');
        const updated = await service.updateJob({
          id: job.id,
          finishedAt,
        });

        expect(updated).toBeDefined();
        expect(updated?.finishedAt).toEqual(finishedAt);
      },
    );

    it.each(databases.eachSupportedId())(
      'should update job artifacts - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'Test description',
          },
          { credentials },
        );

        const module = await service.createModule({
          name: 'Test Module',
          sourcePath: '/path/to/module',
          projectId: project.id,
        });

        const job = await service.createJob({
          moduleId: module.id,
          artifacts: ['old1.txt', 'old2.txt'],
        });

        const newArtifacts = ['new1.txt', 'new2.txt', 'new3.txt'];
        const updated = await service.updateJob({
          id: job.id,
          artifacts: newArtifacts,
        });

        expect(updated).toBeDefined();
        expect(updated?.artifacts.sort(toSorted)).toEqual(
          newArtifacts.sort(toSorted),
        );
        expect(updated?.artifacts).toHaveLength(3);

        // Verify old artifacts are deleted and new ones are inserted
        const artifactRows = await client('artifacts')
          .where('job_id', job.id)
          .select('value')
          .orderBy('id', 'asc');
        expect(artifactRows.map(r => r.value).sort(toSorted)).toEqual(
          newArtifacts.sort(toSorted),
        );
      },
    );

    it.each(databases.eachSupportedId())(
      'should clear artifacts when updating with empty array - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'Test description',
          },
          { credentials },
        );

        const module = await service.createModule({
          name: 'Test Module',
          sourcePath: '/path/to/module',
          projectId: project.id,
        });

        const job = await service.createJob({
          moduleId: module.id,
          artifacts: ['artifact1.txt', 'artifact2.txt'],
        });

        const updated = await service.updateJob({
          id: job.id,
          artifacts: [],
        });

        expect(updated).toBeDefined();
        expect(updated?.artifacts).toEqual([]);

        // Verify artifacts are deleted from database
        const artifactRows = await client('artifacts')
          .where('job_id', job.id)
          .select('*');
        expect(artifactRows).toHaveLength(0);
      },
    );

    it.each(databases.eachSupportedId())(
      'should update multiple fields at once - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'Test description',
          },
          { credentials },
        );

        const module = await service.createModule({
          name: 'Test Module',
          sourcePath: '/path/to/module',
          projectId: project.id,
        });

        const job = await service.createJob({
          moduleId: module.id,
          status: 'pending',
          log: 'Initial log',
        });

        const finishedAt = new Date('2026-01-24T12:00:00Z');
        const updated = await service.updateJob({
          id: job.id,
          status: 'success',
          log: 'Final log',
          finishedAt,
          artifacts: ['result.txt'],
        });

        expect(updated).toBeDefined();
        expect(updated?.status).toBe('success');
        expect(updated?.log).toBe('Final log');
        expect(updated?.finishedAt).toEqual(finishedAt);
        expect(updated?.artifacts).toEqual(['result.txt']);
      },
    );
  });

  describe('deleteJob', () => {
    it.each(databases.eachSupportedId())(
      'should return 0 when deleting non-existent job - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const deletedCount = await service.deleteJob({
          id: 'non-existent-id',
        });

        expect(deletedCount).toBe(0);
      },
    );

    it.each(databases.eachSupportedId())(
      'should delete a job and return 1 - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'Test description',
          },
          { credentials },
        );

        const module = await service.createModule({
          name: 'Test Module',
          sourcePath: '/path/to/module',
          projectId: project.id,
        });

        const job = await service.createJob({
          moduleId: module.id,
        });

        // Verify it exists
        const beforeDelete = await service.getJob({ id: job.id });
        expect(beforeDelete).toBeDefined();

        // Delete it
        const deletedCount = await service.deleteJob({ id: job.id });

        expect(deletedCount).toBe(1);

        // Verify it's gone
        const afterDelete = await service.getJob({ id: job.id });
        expect(afterDelete).toBeUndefined();
      },
    );

    it.each(databases.eachSupportedId())(
      'should cascade delete artifacts when job is deleted - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'Test description',
          },
          { credentials },
        );

        const module = await service.createModule({
          name: 'Test Module',
          sourcePath: '/path/to/module',
          projectId: project.id,
        });

        const job = await service.createJob({
          moduleId: module.id,
          artifacts: ['artifact1.txt', 'artifact2.txt'],
        });

        // Verify artifacts exist
        const artifactsBefore = await client('artifacts')
          .where('job_id', job.id)
          .select('*');
        expect(artifactsBefore).toHaveLength(2);

        // Delete the job
        await service.deleteJob({ id: job.id });

        // Verify artifacts are cascade deleted
        const artifactsAfter = await client('artifacts')
          .where('job_id', job.id)
          .select('*');
        expect(artifactsAfter).toHaveLength(0);
      },
    );

    it.each(databases.eachSupportedId())(
      'should only delete the specified job - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'Test description',
          },
          { credentials },
        );

        const module = await service.createModule({
          name: 'Test Module',
          sourcePath: '/path/to/module',
          projectId: project.id,
        });

        const job1 = await service.createJob({ moduleId: module.id });
        const job2 = await service.createJob({ moduleId: module.id });

        const deletedCount = await service.deleteJob({ id: job1.id });

        expect(deletedCount).toBe(1);

        // Verify job1 is deleted
        const deleted = await service.getJob({ id: job1.id });
        expect(deleted).toBeUndefined();

        // Verify job2 still exists
        const remaining = await service.getJob({ id: job2.id });
        expect(remaining).toBeDefined();
        expect(remaining?.id).toBe(job2.id);

        // Verify listJobs still returns job2
        const listResult = await service.listJobs({ moduleId: module.id });
        expect(listResult).toHaveLength(1);
        expect(listResult[0].id).toBe(job2.id);
      },
    );
  });

  describe('CASCADE delete for jobs', () => {
    it.each(databases.eachSupportedId())(
      'should cascade delete jobs when module is deleted - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'Test description',
          },
          { credentials },
        );

        const module = await service.createModule({
          name: 'Test Module',
          sourcePath: '/path/to/module',
          projectId: project.id,
        });

        const job1 = await service.createJob({
          moduleId: module.id,
          artifacts: ['artifact1.txt'],
        });
        const job2 = await service.createJob({
          moduleId: module.id,
          artifacts: ['artifact2.txt'],
        });
        const job3 = await service.createJob({
          moduleId: module.id,
        });

        // Verify jobs exist
        expect(await service.getJob({ id: job1.id })).toBeDefined();
        expect(await service.getJob({ id: job2.id })).toBeDefined();
        expect(await service.getJob({ id: job3.id })).toBeDefined();

        const jobsBefore = await service.listJobs({ moduleId: module.id });
        expect(jobsBefore).toHaveLength(3);

        // Delete the module
        const deletedCount = await service.deleteModule({ id: module.id });
        expect(deletedCount).toBe(1);

        // Verify module is deleted
        const moduleAfter = await service.getModule({ id: module.id });
        expect(moduleAfter).toBeUndefined();

        // Verify all jobs are cascade deleted
        expect(await service.getJob({ id: job1.id })).toBeUndefined();
        expect(await service.getJob({ id: job2.id })).toBeUndefined();
        expect(await service.getJob({ id: job3.id })).toBeUndefined();

        // Verify listJobs returns empty for deleted module
        const jobsAfter = await service.listJobs({ moduleId: module.id });
        expect(jobsAfter).toEqual([]);

        // Verify jobs are deleted from database directly
        const dbJobs = await client('jobs')
          .whereIn('id', [job1.id, job2.id, job3.id])
          .select('*');
        expect(dbJobs).toHaveLength(0);

        // Verify artifacts are cascade deleted
        const artifacts = await client('artifacts')
          .whereIn('job_id', [job1.id, job2.id, job3.id])
          .select('*');
        expect(artifacts).toHaveLength(0);
      },
    );

    it.each(databases.eachSupportedId())(
      'should only cascade delete jobs for the deleted module - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'Test description',
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

        const job1Module1 = await service.createJob({
          moduleId: module1.id,
        });
        const job2Module1 = await service.createJob({
          moduleId: module1.id,
        });
        const job1Module2 = await service.createJob({
          moduleId: module2.id,
        });

        // Delete module1
        await service.deleteModule({ id: module1.id });

        // Verify module1 jobs are cascade deleted
        expect(await service.getJob({ id: job1Module1.id })).toBeUndefined();
        expect(await service.getJob({ id: job2Module1.id })).toBeUndefined();

        // Verify module2 job still exists
        const remainingJob = await service.getJob({ id: job1Module2.id });
        expect(remainingJob).toBeDefined();
        expect(remainingJob?.moduleId).toBe(module2.id);

        // Verify module2 still has its job
        const module2Jobs = await service.listJobs({ moduleId: module2.id });
        expect(module2Jobs).toHaveLength(1);
        expect(module2Jobs[0].id).toBe(job1Module2.id);
      },
    );
  });
});
