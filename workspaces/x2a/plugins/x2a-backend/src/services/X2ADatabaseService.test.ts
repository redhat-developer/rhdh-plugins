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
});
