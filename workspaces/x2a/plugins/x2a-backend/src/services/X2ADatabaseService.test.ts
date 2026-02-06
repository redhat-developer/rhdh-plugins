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

import { toSorted } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { X2ADatabaseService } from './X2ADatabaseService';
import { migrate } from './dbMigrate';
import { delay, LONG_TEST_TIMEOUT, nonExistentId } from '../utils';

const databases = TestDatabases.create({
  ids: ['SQLITE_3', 'POSTGRES_18'],
});
const supportedDatabaseIds = databases.eachSupportedId();
console.log('Testing against supportedDatabaseIds:', supportedDatabaseIds);

const clientsToDestroy: Knex[] = [];

async function createDatabase(databaseId: TestDatabaseId) {
  const client = await databases.init(databaseId);
  clientsToDestroy.push(client);
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

const defaultProjectRepoFields = {
  sourceRepoUrl: 'https://github.com/source/repo',
  targetRepoUrl: 'https://github.com/target/repo',
  sourceRepoBranch: 'main',
  targetRepoBranch: 'main',
};

describe('X2ADatabaseService', () => {
  afterEach(async () => {
    await Promise.all(
      clientsToDestroy.splice(0).map(client => client.destroy()),
    );
  });

  describe('createProject', () => {
    it.each(supportedDatabaseIds)(
      'should create a project with all required fields - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const input = {
          name: 'Test Project',
          abbreviation: 'TP',
          description: 'A test project description',
          ...defaultProjectRepoFields,
        };

        const credentials = mockCredentials.user();
        const project = await service.createProject(input, { credentials });

        expect(project).toMatchObject({
          name: input.name,
          abbreviation: input.abbreviation,
          description: input.description,
          sourceRepoUrl: input.sourceRepoUrl,
          targetRepoUrl: input.targetRepoUrl,
          sourceRepoBranch: input.sourceRepoBranch,
          targetRepoBranch: input.targetRepoBranch,
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
        expect(row.source_repo_url).toBe(input.sourceRepoUrl);
        expect(row.target_repo_url).toBe(input.targetRepoUrl);
        expect(row.source_repo_branch).toBe(input.sourceRepoBranch);
        expect(row.target_repo_branch).toBe(input.targetRepoBranch);
        expect(row.created_by).toBe('user:default/mock');
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
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
            ...defaultProjectRepoFields,
          },
          { credentials },
        );

        const project2 = await service.createProject(
          {
            name: 'Project 2',
            abbreviation: 'P2',
            description: 'Second project',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );

        expect(project1.id).not.toBe(project2.id);
        expect(project1.name).toBe('Project 1');
        expect(project2.name).toBe('Project 2');
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
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
            ...defaultProjectRepoFields,
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
    it.each(supportedDatabaseIds)(
      'should return empty list when no projects exist - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const result = await service.listProjects({}, { credentials });

        expect(result.projects).toEqual([]);
        expect(result.totalCount).toBe(0);
      },
    );

    it.each(supportedDatabaseIds)(
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
            ...defaultProjectRepoFields,
          },
          { credentials },
        );
        await delay(10); // To make sure the projects are created in the correct order
        await service.createProject(
          {
            name: 'Project 2',
            abbreviation: 'P2',
            description: 'Second project',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );
        await delay(10);
        await service.createProject(
          {
            name: 'Project 3',
            abbreviation: 'P3',
            description: 'Third project',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );

        const result = await service.listProjects(
          { order: 'desc', sort: 'createdAt' },
          { credentials },
        );

        expect(result.totalCount).toBe(3);
        expect(result.projects).toHaveLength(3);
        expect(result.projects[0].name).toBe('Project 3'); // Should be ordered by created_at desc
        expect(result.projects[1].name).toBe('Project 2');
        expect(result.projects[2].name).toBe('Project 1');
      },
    );

    it.each(supportedDatabaseIds)(
      'should paginate results with page and pageSize - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        // Create 5 projects
        for (let i = 1; i <= 5; i++) {
          await service.createProject(
            {
              name: `Project ${i}`,
              abbreviation: `P${i}`,
              description: `Project ${i} description`,
              ...defaultProjectRepoFields,
            },
            { credentials },
          );
          await delay(10);
        }

        // First page with pageSize 2
        const page1 = await service.listProjects(
          { page: 0, pageSize: 2, sort: 'createdAt', order: 'desc' },
          { credentials },
        );
        expect(page1.totalCount).toBe(5);
        expect(page1.projects).toHaveLength(2);
        expect(page1.projects[0].name).toBe('Project 5');
        expect(page1.projects[1].name).toBe('Project 4');

        // Second page
        const page2 = await service.listProjects(
          { page: 1, pageSize: 2, sort: 'createdAt', order: 'desc' },
          { credentials },
        );
        expect(page2.totalCount).toBe(5);
        expect(page2.projects).toHaveLength(2);
        expect(page2.projects[0].name).toBe('Project 3');
        expect(page2.projects[1].name).toBe('Project 2');

        // Third page (last page with 1 item)
        const page3 = await service.listProjects(
          { page: 2, pageSize: 2, sort: 'createdAt', order: 'desc' },
          { credentials },
        );
        expect(page3.totalCount).toBe(5);
        expect(page3.projects).toHaveLength(1);
        expect(page3.projects[0].name).toBe('Project 1');
      },
    );

    it.each(supportedDatabaseIds)(
      'should use default pageSize when not specified - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        // Create more than DEFAULT_PAGE_SIZE (10) projects
        for (let i = 1; i <= 15; i++) {
          await service.createProject(
            {
              name: `Project ${i}`,
              abbreviation: `P${i}`,
              description: `Project ${i} description`,
              ...defaultProjectRepoFields,
            },
            { credentials },
          );
          if (i < 15) await delay(10);
        }

        const result = await service.listProjects(
          { sort: 'createdAt', order: 'desc' },
          { credentials },
        );

        expect(result.totalCount).toBe(15);
        expect(result.projects).toHaveLength(10); // Default page size
      },
    );

    it.each(supportedDatabaseIds)(
      'should sort by name ascending - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        await service.createProject(
          {
            name: 'Zebra Project',
            abbreviation: 'ZP',
            description: 'Z',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );
        await delay(10);
        await service.createProject(
          {
            name: 'Alpha Project',
            abbreviation: 'AP',
            description: 'A',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );
        await delay(10);
        await service.createProject(
          {
            name: 'Beta Project',
            abbreviation: 'BP',
            description: 'B',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );

        const result = await service.listProjects(
          { sort: 'name', order: 'asc' },
          { credentials },
        );

        expect(result.projects).toHaveLength(3);
        expect(result.projects[0].name).toBe('Alpha Project');
        expect(result.projects[1].name).toBe('Beta Project');
        expect(result.projects[2].name).toBe('Zebra Project');
      },
    );

    it.each(supportedDatabaseIds)(
      'should sort by name descending - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        await service.createProject(
          {
            name: 'Alpha Project',
            abbreviation: 'AP',
            description: 'A',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );
        await delay(10);
        await service.createProject(
          {
            name: 'Zebra Project',
            abbreviation: 'ZP',
            description: 'Z',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );
        await delay(10);
        await service.createProject(
          {
            name: 'Beta Project',
            abbreviation: 'BP',
            description: 'B',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );

        const result = await service.listProjects(
          { sort: 'name', order: 'desc' },
          { credentials },
        );

        expect(result.projects).toHaveLength(3);
        expect(result.projects[0].name).toBe('Zebra Project');
        expect(result.projects[1].name).toBe('Beta Project');
        expect(result.projects[2].name).toBe('Alpha Project');
      },
    );

    it.each(supportedDatabaseIds)(
      'should sort by createdBy - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials1 = mockCredentials.user('user:default/user1');
        const credentials2 = mockCredentials.user('user:default/user2');
        const credentials3 = mockCredentials.user('user:default/user3');

        await service.createProject(
          {
            name: 'Project 1',
            abbreviation: 'P1',
            description: 'D1',
            ...defaultProjectRepoFields,
          },
          { credentials: credentials3 },
        );
        await delay(10);
        await service.createProject(
          {
            name: 'Project 2',
            abbreviation: 'P2',
            description: 'D2',
            ...defaultProjectRepoFields,
          },
          { credentials: credentials1 },
        );
        await delay(10);
        await service.createProject(
          {
            name: 'Project 3',
            abbreviation: 'P3',
            description: 'D3',
            ...defaultProjectRepoFields,
          },
          { credentials: credentials2 },
        );

        const result = await service.listProjects(
          { sort: 'createdBy', order: 'asc' },
          { credentials: credentials1, canViewAll: true },
        );

        expect(result.projects).toHaveLength(3);
        // Should be sorted by created_by (userEntityRef) ascending
        expect(result.projects[0].createdBy).toBe('user:default/user1');
        expect(result.projects[1].createdBy).toBe('user:default/user2');
        expect(result.projects[2].createdBy).toBe('user:default/user3');
      },
    );

    it.each(supportedDatabaseIds)(
      'should filter by user when canViewAll is false - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials1 = mockCredentials.user('user:default/user1');
        const credentials2 = mockCredentials.user('user:default/user2');

        // User1 creates 2 projects
        await service.createProject(
          {
            name: 'User1 Project 1',
            abbreviation: 'U1P1',
            description: 'D1',
            ...defaultProjectRepoFields,
          },
          { credentials: credentials1 },
        );
        await delay(10);
        await service.createProject(
          {
            name: 'User1 Project 2',
            abbreviation: 'U1P2',
            description: 'D2',
            ...defaultProjectRepoFields,
          },
          { credentials: credentials1 },
        );
        await delay(10);

        // User2 creates 2 projects
        await service.createProject(
          {
            name: 'User2 Project 1',
            abbreviation: 'U2P1',
            description: 'D3',
            ...defaultProjectRepoFields,
          },
          { credentials: credentials2 },
        );
        await delay(10);
        await service.createProject(
          {
            name: 'User2 Project 2',
            abbreviation: 'U2P2',
            description: 'D4',
            ...defaultProjectRepoFields,
          },
          { credentials: credentials2 },
        );

        // User1 should only see their own projects
        const user1Result = await service.listProjects(
          { sort: 'createdAt', order: 'desc' },
          { credentials: credentials1, canViewAll: false },
        );
        expect(user1Result.totalCount).toBe(2);
        expect(user1Result.projects).toHaveLength(2);
        expect(
          user1Result.projects.every(p => p.createdBy === 'user:default/user1'),
        ).toBe(true);

        // User2 should only see their own projects
        const user2Result = await service.listProjects(
          { sort: 'createdAt', order: 'desc' },
          { credentials: credentials2, canViewAll: false },
        );
        expect(user2Result.totalCount).toBe(2);
        expect(user2Result.projects).toHaveLength(2);
        expect(
          user2Result.projects.every(p => p.createdBy === 'user:default/user2'),
        ).toBe(true);
      },
    );

    it.each(supportedDatabaseIds)(
      'should return all projects when canViewAll is true - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials1 = mockCredentials.user('user:default/user1');
        const credentials2 = mockCredentials.user('user:default/user2');
        const credentials3 = mockCredentials.user('user:default/user3');

        await service.createProject(
          {
            name: 'Project 1',
            abbreviation: 'P1',
            description: 'D1',
            ...defaultProjectRepoFields,
          },
          { credentials: credentials1 },
        );
        await delay(10);
        await service.createProject(
          {
            name: 'Project 2',
            abbreviation: 'P2',
            description: 'D2',
            ...defaultProjectRepoFields,
          },
          { credentials: credentials2 },
        );
        await delay(10);
        await service.createProject(
          {
            name: 'Project 3',
            abbreviation: 'P3',
            description: 'D3',
            ...defaultProjectRepoFields,
          },
          { credentials: credentials3 },
        );

        // User1 with canViewAll should see all projects
        const result = await service.listProjects(
          { sort: 'createdAt', order: 'desc' },
          { credentials: credentials1, canViewAll: true },
        );

        expect(result.totalCount).toBe(3);
        expect(result.projects).toHaveLength(3);
        expect(
          result.projects.some(p => p.createdBy === 'user:default/user1'),
        ).toBe(true);
        expect(
          result.projects.some(p => p.createdBy === 'user:default/user2'),
        ).toBe(true);
        expect(
          result.projects.some(p => p.createdBy === 'user:default/user3'),
        ).toBe(true);
      },
    );

    it.each(supportedDatabaseIds)(
      'should filter by user when canViewAll is undefined - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials1 = mockCredentials.user('user:default/user1');
        const credentials2 = mockCredentials.user('user:default/user2');

        await service.createProject(
          {
            name: 'User1 Project',
            abbreviation: 'U1P',
            description: 'D1',
            ...defaultProjectRepoFields,
          },
          { credentials: credentials1 },
        );
        await delay(10);
        await service.createProject(
          {
            name: 'User2 Project',
            abbreviation: 'U2P',
            description: 'D2',
            ...defaultProjectRepoFields,
          },
          { credentials: credentials2 },
        );

        // When canViewAll is undefined, should default to filtering
        const result = await service.listProjects(
          { sort: 'createdAt', order: 'desc' },
          { credentials: credentials1 },
        );

        expect(result.totalCount).toBe(1);
        expect(result.projects).toHaveLength(1);
        expect(result.projects[0].createdBy).toBe('user:default/user1');
      },
    );

    it.each(supportedDatabaseIds)(
      'should combine pagination and user filtering - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials1 = mockCredentials.user('user:default/user1');
        const credentials2 = mockCredentials.user('user:default/user2');

        // User1 creates 5 projects
        for (let i = 1; i <= 5; i++) {
          await service.createProject(
            {
              name: `User1 Project ${i}`,
              abbreviation: `U1P${i}`,
              description: `Description ${i}`,
              ...defaultProjectRepoFields,
            },
            { credentials: credentials1 },
          );
          await delay(10);
        }

        // User2 creates 3 projects
        for (let i = 1; i <= 3; i++) {
          await service.createProject(
            {
              name: `User2 Project ${i}`,
              abbreviation: `U2P${i}`,
              description: `Description ${i}`,
              ...defaultProjectRepoFields,
            },
            { credentials: credentials2 },
          );
          if (i < 3) await delay(10);
        }

        // User1 should only see their 5 projects, paginated
        const page1 = await service.listProjects(
          { page: 1, pageSize: 2, sort: 'createdAt', order: 'desc' },
          { credentials: credentials1, canViewAll: false },
        );
        expect(page1.totalCount).toBe(5); // Total count should be 5, not 8
        expect(page1.projects).toHaveLength(2);
        expect(
          page1.projects.every(p => p.createdBy === 'user:default/user1'),
        ).toBe(true);
      },
    );

    it.each(supportedDatabaseIds)(
      'should use default sort and order when not specified - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        await service.createProject(
          {
            name: 'Project 1',
            abbreviation: 'P1',
            description: 'D1',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );
        await delay(10);
        await service.createProject(
          {
            name: 'Project 2',
            abbreviation: 'P2',
            description: 'D2',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );
        await delay(10);
        await service.createProject(
          {
            name: 'Project 3',
            abbreviation: 'P3',
            description: 'D3',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );

        const result = await service.listProjects({}, { credentials });

        expect(result.projects).toHaveLength(3);
        // Should default to created_at desc (newest first)
        expect(result.projects[0].name).toBe('Project 3');
        expect(result.projects[1].name).toBe('Project 2');
        expect(result.projects[2].name).toBe('Project 1');
      },
    );

    it.each(supportedDatabaseIds)(
      'should handle empty page gracefully - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        await service.createProject(
          {
            name: 'Project 1',
            abbreviation: 'P1',
            description: 'D1',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );

        // Request page 2 which doesn't exist
        const result = await service.listProjects(
          { page: 2, pageSize: 10 },
          { credentials },
        );

        expect(result.totalCount).toBe(1);
        expect(result.projects).toHaveLength(0);
      },
    );
  });

  describe('getProject', () => {
    it.each(supportedDatabaseIds)(
      'should return undefined for non-existent project - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const project = await service.getProject(
          {
            projectId: nonExistentId,
          },
          { credentials },
        );

        expect(project).toBeUndefined();
      },
    );

    it.each(supportedDatabaseIds)(
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
            ...defaultProjectRepoFields,
          },
          { credentials },
        );

        const retrievedProject = await service.getProject(
          {
            projectId: createdProject.id,
          },
          { credentials },
        );

        expect(retrievedProject).toBeDefined();
        expect(retrievedProject?.id).toBe(createdProject.id);
        expect(retrievedProject?.name).toBe(createdProject.name);
        expect(retrievedProject?.abbreviation).toBe(
          createdProject.abbreviation,
        );
        expect(retrievedProject?.description).toBe(createdProject.description);
        expect(retrievedProject?.sourceRepoUrl).toBe(
          createdProject.sourceRepoUrl,
        );
        expect(retrievedProject?.targetRepoUrl).toBe(
          createdProject.targetRepoUrl,
        );
        expect(retrievedProject?.sourceRepoBranch).toBe(
          createdProject.sourceRepoBranch,
        );
        expect(retrievedProject?.targetRepoBranch).toBe(
          createdProject.targetRepoBranch,
        );
        expect(retrievedProject?.createdBy).toBe(createdProject.createdBy);
        expect(retrievedProject?.createdAt).toEqual(createdProject.createdAt);
      },
    );

    it.each(supportedDatabaseIds)(
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
            ...defaultProjectRepoFields,
          },
          { credentials },
        );
        const project2 = await service.createProject(
          {
            name: 'Project 2',
            abbreviation: 'P2',
            description: 'Second project',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );

        const retrieved1 = await service.getProject(
          { projectId: project1.id },
          { credentials },
        );
        const retrieved2 = await service.getProject(
          { projectId: project2.id },
          { credentials },
        );

        expect(retrieved1?.id).toBe(project1.id);
        expect(retrieved1?.name).toBe('Project 1');
        expect(retrieved2?.id).toBe(project2.id);
        expect(retrieved2?.name).toBe('Project 2');
      },
    );

    it.each(supportedDatabaseIds)(
      'should return undefined when user tries to access project created by another user - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials1 = mockCredentials.user('user:default/user1');
        const credentials2 = mockCredentials.user('user:default/user2');

        // User1 creates a project
        const project = await service.createProject(
          {
            name: 'User1 Project',
            abbreviation: 'U1P',
            description: 'Project created by user1',
            ...defaultProjectRepoFields,
          },
          { credentials: credentials1 },
        );

        // User2 tries to access user1's project (should be denied)
        const retrievedProject = await service.getProject(
          {
            projectId: project.id,
          },
          { credentials: credentials2, canViewAll: false },
        );

        expect(retrievedProject).toBeUndefined();
      },
    );

    it.each(supportedDatabaseIds)(
      'should return project when user accesses their own project - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user('user:default/user1');

        const project = await service.createProject(
          {
            name: 'My Project',
            abbreviation: 'MP',
            description: 'My own project',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );

        // User should be able to access their own project
        const retrievedProject = await service.getProject(
          {
            projectId: project.id,
          },
          { credentials, canViewAll: false },
        );

        expect(retrievedProject).toBeDefined();
        expect(retrievedProject?.id).toBe(project.id);
        expect(retrievedProject?.createdBy).toBe('user:default/user1');
      },
    );

    it.each(supportedDatabaseIds)(
      'should return project when canViewAll is true even if created by different user - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials1 = mockCredentials.user('user:default/user1');
        const credentials2 = mockCredentials.user('user:default/user2');

        // User1 creates a project
        const project = await service.createProject(
          {
            name: 'User1 Project',
            abbreviation: 'U1P',
            description: 'Project created by user1',
            ...defaultProjectRepoFields,
          },
          { credentials: credentials1 },
        );

        // User2 with canViewAll should be able to access user1's project
        const retrievedProject = await service.getProject(
          {
            projectId: project.id,
          },
          { credentials: credentials2, canViewAll: true },
        );

        expect(retrievedProject).toBeDefined();
        expect(retrievedProject?.id).toBe(project.id);
        expect(retrievedProject?.createdBy).toBe('user:default/user1');
      },
    );

    it.each(supportedDatabaseIds)(
      'should filter by user when canViewAll is undefined - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials1 = mockCredentials.user('user:default/user1');
        const credentials2 = mockCredentials.user('user:default/user2');

        // User1 creates a project
        const project = await service.createProject(
          {
            name: 'User1 Project',
            abbreviation: 'U1P',
            description: 'Project created by user1',
            ...defaultProjectRepoFields,
          },
          { credentials: credentials1 },
        );

        // When canViewAll is undefined, should default to filtering
        const retrievedProject = await service.getProject(
          {
            projectId: project.id,
          },
          { credentials: credentials2 },
        );

        expect(retrievedProject).toBeUndefined();
      },
    );
  });

  describe('deleteProject', () => {
    it.each(supportedDatabaseIds)(
      'should return 0 when deleting non-existent project - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user();
        const deletedCount = await service.deleteProject(
          {
            projectId: nonExistentId,
          },
          { credentials },
        );

        expect(deletedCount).toBe(0);
      },
    );

    it.each(supportedDatabaseIds)(
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
            ...defaultProjectRepoFields,
          },
          { credentials },
        );

        // Verify it exists
        const beforeDelete = await service.getProject(
          {
            projectId: project.id,
          },
          { credentials },
        );
        expect(beforeDelete).toBeDefined();

        // Delete it
        const deletedCount = await service.deleteProject(
          {
            projectId: project.id,
          },
          { credentials },
        );

        expect(deletedCount).toBe(1);

        // Verify it's gone
        const afterDelete = await service.getProject(
          { projectId: project.id },
          { credentials },
        );
        expect(afterDelete).toBeUndefined();
      },
    );

    it.each(supportedDatabaseIds)(
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
            ...defaultProjectRepoFields,
          },
          { credentials },
        );
        const project2 = await service.createProject(
          {
            name: 'Project 2',
            abbreviation: 'P2',
            description: 'Second project',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );

        const deletedCount = await service.deleteProject(
          {
            projectId: project1.id,
          },
          { credentials },
        );

        expect(deletedCount).toBe(1);

        // Verify project1 is deleted
        const deleted = await service.getProject(
          { projectId: project1.id },
          { credentials },
        );
        expect(deleted).toBeUndefined();

        // Verify project2 still exists
        const remaining = await service.getProject(
          { projectId: project2.id },
          { credentials },
        );
        expect(remaining).toBeDefined();
        expect(remaining?.name).toBe('Project 2');

        // Verify total count
        const listResult = await service.listProjects({}, { credentials });
        expect(listResult.totalCount).toBe(1);
        expect(listResult.projects[0].id).toBe(project2.id);
      },
    );

    it.each(supportedDatabaseIds)(
      'should return 0 when user tries to delete project created by another user - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials1 = mockCredentials.user('user:default/user1');
        const credentials2 = mockCredentials.user('user:default/user2');

        // User1 creates a project
        const project = await service.createProject(
          {
            name: 'User1 Project',
            abbreviation: 'U1P',
            description: 'Project created by user1',
            ...defaultProjectRepoFields,
          },
          { credentials: credentials1 },
        );

        // User2 tries to delete user1's project (should fail - returns 0)
        const deletedCount = await service.deleteProject(
          {
            projectId: project.id,
          },
          { credentials: credentials2, canWriteAll: false },
        );

        expect(deletedCount).toBe(0);

        // Verify project still exists
        const projectAfter = await service.getProject(
          {
            projectId: project.id,
          },
          { credentials: credentials1 },
        );
        expect(projectAfter).toBeDefined();
        expect(projectAfter?.id).toBe(project.id);
      },
    );

    it.each(supportedDatabaseIds)(
      'should delete project when user deletes their own project - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials = mockCredentials.user('user:default/user1');

        const project = await service.createProject(
          {
            name: 'My Project',
            abbreviation: 'MP',
            description: 'My own project',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );

        // User should be able to delete their own project
        const deletedCount = await service.deleteProject(
          {
            projectId: project.id,
          },
          { credentials, canWriteAll: false },
        );

        expect(deletedCount).toBe(1);

        // Verify project is deleted
        const projectAfter = await service.getProject(
          {
            projectId: project.id,
          },
          { credentials },
        );
        expect(projectAfter).toBeUndefined();
      },
    );

    it.each(supportedDatabaseIds)(
      'should delete project when canWriteAll is true even if created by different user - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials1 = mockCredentials.user('user:default/user1');
        const credentials2 = mockCredentials.user('user:default/user2');

        // User1 creates a project
        const project = await service.createProject(
          {
            name: 'User1 Project',
            abbreviation: 'U1P',
            description: 'Project created by user1',
            ...defaultProjectRepoFields,
          },
          { credentials: credentials1 },
        );

        // User2 with canWriteAll should be able to delete user1's project
        const deletedCount = await service.deleteProject(
          {
            projectId: project.id,
          },
          { credentials: credentials2, canWriteAll: true },
        );

        expect(deletedCount).toBe(1);

        // Verify project is deleted
        const projectAfter = await service.getProject(
          {
            projectId: project.id,
          },
          { credentials: credentials1 },
        );
        expect(projectAfter).toBeUndefined();
      },
    );

    it.each(supportedDatabaseIds)(
      'should filter by user when canWriteAll is undefined - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const credentials1 = mockCredentials.user('user:default/user1');
        const credentials2 = mockCredentials.user('user:default/user2');

        // User1 creates a project
        const project = await service.createProject(
          {
            name: 'User1 Project',
            abbreviation: 'U1P',
            description: 'Project created by user1',
            ...defaultProjectRepoFields,
          },
          { credentials: credentials1 },
        );

        // When canWriteAll is undefined, should default to filtering
        const deletedCount = await service.deleteProject(
          {
            projectId: project.id,
          },
          { credentials: credentials2 },
        );

        expect(deletedCount).toBe(0);

        // Verify project still exists
        const projectAfter = await service.getProject(
          {
            projectId: project.id,
          },
          { credentials: credentials1 },
        );
        expect(projectAfter).toBeDefined();
        expect(projectAfter?.id).toBe(project.id);
      },
    );
  });

  describe('integration tests', () => {
    it.each(supportedDatabaseIds)(
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
            ...defaultProjectRepoFields,
          },
          { credentials },
        );

        // Read
        const retrieved = await service.getProject(
          { projectId: project.id },
          { credentials },
        );
        expect(retrieved).toBeDefined();
        expect(retrieved?.name).toBe('Lifecycle Test');

        // List
        const listResult = await service.listProjects({}, { credentials });
        expect(listResult.totalCount).toBe(1);
        expect(listResult.projects[0].id).toBe(project.id);

        // Delete
        const deletedCount = await service.deleteProject(
          {
            projectId: project.id,
          },
          { credentials },
        );
        expect(deletedCount).toBe(1);

        // Verify deletion
        const afterDelete = await service.getProject(
          { projectId: project.id },
          { credentials },
        );
        expect(afterDelete).toBeUndefined();

        const finalList = await service.listProjects({}, { credentials });
        expect(finalList.totalCount).toBe(0);
      },
    );
  });

  describe('createModule', () => {
    it.each(supportedDatabaseIds)(
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

        // Verify it was persisted in the database
        const row = await client('modules').where('id', module.id).first();
        expect(row).toBeDefined();
        expect(row.name).toBe(moduleInput.name);
        expect(row.source_path).toBe(moduleInput.sourcePath);
        expect(row.project_id).toBe(moduleInput.projectId);
      },
    );

    it.each(supportedDatabaseIds)(
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
    );

    it.each(supportedDatabaseIds)(
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
            ...defaultProjectRepoFields,
          },
          { credentials },
        );
        const project2 = await service.createProject(
          {
            name: 'Project 2',
            abbreviation: 'P2',
            description: 'Second project',
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
      'should return undefined for non-existent module - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const module = await service.getModule({ id: nonExistentId });

        expect(module).toBeUndefined();
      },
    );

    it.each(supportedDatabaseIds)(
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
            ...defaultProjectRepoFields,
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

    it.each(supportedDatabaseIds)(
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
    it.each(supportedDatabaseIds)(
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
            ...defaultProjectRepoFields,
          },
          { credentials },
        );

        const modules = await service.listModules({ projectId: project.id });

        expect(modules).toEqual([]);
      },
    );

    it.each(supportedDatabaseIds)(
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
            ...defaultProjectRepoFields,
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

    it.each(supportedDatabaseIds)(
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
            ...defaultProjectRepoFields,
          },
          { credentials },
        );
        const project2 = await service.createProject(
          {
            name: 'Project 2',
            abbreviation: 'P2',
            description: 'Second project',
            ...defaultProjectRepoFields,
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
    it.each(supportedDatabaseIds)(
      'should return 0 when deleting non-existent module - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const deletedCount = await service.deleteModule({
          id: nonExistentId,
        });

        expect(deletedCount).toBe(0);
      },
    );

    it.each(supportedDatabaseIds)(
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
            ...defaultProjectRepoFields,
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

    it.each(supportedDatabaseIds)(
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
    it.each(supportedDatabaseIds)(
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

        // Verify modules exist
        expect(await service.getModule({ id: module1.id })).toBeDefined();
        expect(await service.getModule({ id: module2.id })).toBeDefined();
        expect(await service.getModule({ id: module3.id })).toBeDefined();

        const modulesBefore = await service.listModules({
          projectId: project.id,
        });
        expect(modulesBefore).toHaveLength(3);

        // Delete the project
        const deletedCount = await service.deleteProject(
          {
            projectId: project.id,
          },
          { credentials },
        );
        expect(deletedCount).toBe(1);

        // Verify project is deleted
        const projectAfter = await service.getProject(
          {
            projectId: project.id,
          },
          { credentials },
        );
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

    it.each(supportedDatabaseIds)(
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
            ...defaultProjectRepoFields,
          },
          { credentials },
        );
        const project2 = await service.createProject(
          {
            name: 'Project 2',
            abbreviation: 'P2',
            description: 'Second project',
            ...defaultProjectRepoFields,
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
        await service.deleteProject(
          { projectId: project1.id },
          { credentials },
        );

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
    it.each(supportedDatabaseIds)(
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

    it.each(supportedDatabaseIds)(
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
          log: 'Job log content',
          status: 'success',
          artifacts: [],
        });
        expect(job.startedAt).toEqual(startedAt);
        expect(job.finishedAt).toEqual(finishedAt);
      },
    );

    it.each(supportedDatabaseIds)(
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
            ...defaultProjectRepoFields,
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
          projectId: project.id,
          moduleId: module.id,
          phase: 'init' as const,
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

    it.each(supportedDatabaseIds)(
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

        expect(job.status).toBe('pending');
      },
    );
  });

  describe('getJob', () => {
    it.each(supportedDatabaseIds)(
      'should return undefined for non-existent job - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const job = await service.getJob({ id: nonExistentId });

        expect(job).toBeUndefined();
      },
    );

    it.each(supportedDatabaseIds)(
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
            ...defaultProjectRepoFields,
          },
          { credentials },
        );

        const module = await service.createModule({
          name: 'Test Module',
          sourcePath: '/path/to/module',
          projectId: project.id,
        });

        const createdJob = await service.createJob({
          projectId: project.id,
          moduleId: module.id,
          phase: 'init' as const,
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

    it.each(supportedDatabaseIds)(
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
            ...defaultProjectRepoFields,
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
          projectId: project.id,
          moduleId: module.id,
          phase: 'init' as const,
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

    it.each(supportedDatabaseIds)(
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
    it.each(supportedDatabaseIds)(
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
          moduleId: module.id,
        });

        expect(jobs).toEqual([]);
      },
    );

    it.each(supportedDatabaseIds)(
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
          moduleId: module.id,
        });

        expect(jobs).toHaveLength(3);
        // Should be ordered by started_at descending
        expect(jobs.map(j => j.id)).toContain(job1.id);
        expect(jobs.map(j => j.id)).toContain(job2.id);
        expect(jobs.map(j => j.id)).toContain(job3.id);
      },
    );

    it.each(supportedDatabaseIds)(
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
          artifacts: ['artifact1.txt', 'artifact2.json'],
        });
        const job2 = await service.createJob({
          projectId: project.id,
          moduleId: module.id,
          phase: 'init' as const,
          artifacts: ['artifact3.log'],
        });

        const jobs = await service.listJobs({
          moduleId: module.id,
        });

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

    it.each(supportedDatabaseIds)(
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
          moduleId: module1.id,
        });
        const module2Jobs = await service.listJobs({
          moduleId: module2.id,
        });

        expect(module1Jobs).toHaveLength(2);
        expect(module1Jobs.every(j => j.moduleId === module1.id)).toBe(true);
        expect(module2Jobs).toHaveLength(1);
        expect(module2Jobs[0].moduleId).toBe(module2.id);
      },
    );
  });

  describe('updateJob', () => {
    it.each(supportedDatabaseIds)(
      'should return undefined when updating non-existent job - %p',
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
        expect(updated?.log).toBe('Updated log content');
      },
    );

    it.each(supportedDatabaseIds)(
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
        });

        expect(updated).toBeDefined();
        expect(updated?.finishedAt).toEqual(finishedAt);
      },
    );

    it.each(supportedDatabaseIds)(
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

    it.each(supportedDatabaseIds)(
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

    it.each(supportedDatabaseIds)(
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
    it.each(supportedDatabaseIds)(
      'should return 0 when deleting non-existent job - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);

        const deletedCount = await service.deleteJob({
          id: nonExistentId,
        });

        expect(deletedCount).toBe(0);
      },
    );

    it.each(supportedDatabaseIds)(
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

    it.each(supportedDatabaseIds)(
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

    it.each(supportedDatabaseIds)(
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

        // Verify job1 is deleted
        const deleted = await service.getJob({ id: job1.id });
        expect(deleted).toBeUndefined();

        // Verify job2 still exists
        const remaining = await service.getJob({ id: job2.id });
        expect(remaining).toBeDefined();
        expect(remaining?.id).toBe(job2.id);

        // Verify listJobs still returns job2
        const listResult = await service.listJobs({
          moduleId: module.id,
        });
        expect(listResult).toHaveLength(1);
        expect(listResult[0].id).toBe(job2.id);
      },
    );
  });

  describe('CASCADE delete for jobs', () => {
    it.each(supportedDatabaseIds)(
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
          artifacts: ['artifact1.txt'],
        });
        const job2 = await service.createJob({
          projectId: project.id,
          moduleId: module.id,
          phase: 'init' as const,
          artifacts: ['artifact2.txt'],
        });
        const job3 = await service.createJob({
          projectId: project.id,
          moduleId: module.id,
          phase: 'init' as const,
        });

        // Verify jobs exist
        expect(await service.getJob({ id: job1.id })).toBeDefined();
        expect(await service.getJob({ id: job2.id })).toBeDefined();
        expect(await service.getJob({ id: job3.id })).toBeDefined();

        const jobsBefore = await service.listJobs({
          moduleId: module.id,
        });
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
        const jobsAfter = await service.listJobs({
          moduleId: module.id,
        });
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

    it.each(supportedDatabaseIds)(
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

        const job1Module1 = await service.createJob({
          projectId: project.id,
          moduleId: module1.id,
          phase: 'init' as const,
        });
        const job2Module1 = await service.createJob({
          projectId: project.id,
          moduleId: module1.id,
          phase: 'init' as const,
        });
        const job1Module2 = await service.createJob({
          projectId: project.id,
          moduleId: module2.id,
          phase: 'init' as const,
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
        const module2Jobs = await service.listJobs({
          moduleId: module2.id,
        });
        expect(module2Jobs).toHaveLength(1);
        expect(module2Jobs[0].id).toBe(job1Module2.id);
      },
    );
  });
});
