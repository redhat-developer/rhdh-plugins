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
  artifactsFromValues,
  createDatabase,
  createService,
  defaultProjectRepoFields,
  LONG_TEST_TIMEOUT,
  nonExistentId,
  supportedDatabaseIds,
  tearDownDatabases,
} from '../../__testUtils__';
import { delay } from '../../utils';

describe('X2ADatabaseService – projects', () => {
  afterEach(async () => {
    await tearDownDatabases();
  });

  describe('createProject', () => {
    it.each(supportedDatabaseIds)(
      'creates a project with all required fields and persists to DB - %p',
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
          ownedBy: 'user:default/mock',
        });
        expect(project.id).toBeDefined();
        expect(project.createdAt).toBeInstanceOf(Date);

        const row = await client('projects').where('id', project.id).first();
        expect(row).toBeDefined();
        expect(row.name).toBe(input.name);
        expect(row.abbreviation).toBe(input.abbreviation);
        expect(row.owned_by).toBe('user:default/mock');
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'computes and persists dirName at creation time - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'My Cool Project',
            abbreviation: 'MCP',
            description: 'desc',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );

        expect(project.dirName).toBeDefined();
        expect(project.dirName).toMatch(/^my-cool-project-/);

        const row = await client('projects').where('id', project.id).first();
        expect(row.dir_name).toBe(project.dirName);
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'creates multiple projects with distinct IDs - %p',
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
        expect(project1.id).not.toBe(project2.id);
        expect(project1.name).toBe('Project 1');
        expect(project2.name).toBe('Project 2');
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'sets ownedBy from credentials - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const customCredentials = mockCredentials.user(
          'user:default/custom-user',
        );
        const project = await service.createProject(
          {
            name: 'Custom',
            abbreviation: 'CUP',
            description: 'D',
            ...defaultProjectRepoFields,
          },
          { credentials: customCredentials },
        );
        expect(project.ownedBy).toBe('user:default/custom-user');
        const row = await client('projects').where('id', project.id).first();
        expect(row.owned_by).toBe('user:default/custom-user');
      },
    );

    it.each(supportedDatabaseIds)(
      'sets ownedBy from ownedByGroup when provided - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Group-owned Project',
            abbreviation: 'GOP',
            description: 'Owned by group',
            ownedByGroup: 'group:default/team-a',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );
        expect(project.ownedBy).toBe('group:default/team-a');
        const row = await client('projects').where('id', project.id).first();
        expect(row.owned_by).toBe('group:default/team-a');
      },
    );

    it.each(supportedDatabaseIds)(
      'falls back to user ref when ownedByGroup is not provided - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const credentials = mockCredentials.user('user:default/jane');
        const project = await service.createProject(
          {
            name: 'User-owned Project',
            abbreviation: 'UOP',
            description: 'Owned by user',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );
        expect(project.ownedBy).toBe('user:default/jane');
        const row = await client('projects').where('id', project.id).first();
        expect(row.owned_by).toBe('user:default/jane');
      },
    );
  });

  describe('updateProject', () => {
    it.each(supportedDatabaseIds)(
      'updates name and persists to DB - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Original',
            abbreviation: 'OG',
            description: 'Original desc',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );

        const updated = await service.updateProject(
          { projectId: project.id },
          { name: 'Updated' },
          { credentials, groupsOfUser: [] },
        );

        expect(updated).toBeDefined();
        expect(updated!.name).toBe('Updated');
        expect(updated!.description).toBe('Original desc');

        const row = await client('projects').where('id', project.id).first();
        expect(row.name).toBe('Updated');
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'updates description and persists to DB - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test',
            abbreviation: 'T',
            description: 'Old',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );

        const updated = await service.updateProject(
          { projectId: project.id },
          { description: 'New description' },
          { credentials, groupsOfUser: [] },
        );

        expect(updated).toBeDefined();
        expect(updated!.description).toBe('New description');
        expect(updated!.name).toBe('Test');
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'updates ownedBy and persists to DB - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Test',
            abbreviation: 'T',
            description: 'D',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );

        const updated = await service.updateProject(
          { projectId: project.id },
          { ownedBy: 'group:default/team-x' },
          { credentials, canWriteAll: true, groupsOfUser: [] },
        );

        expect(updated).toBeDefined();
        expect(updated!.ownedBy).toBe('group:default/team-x');

        const row = await client('projects').where('id', project.id).first();
        expect(row.owned_by).toBe('group:default/team-x');
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'updates multiple fields at once - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Old Name',
            abbreviation: 'ON',
            description: 'Old desc',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );

        const updated = await service.updateProject(
          { projectId: project.id },
          {
            name: 'New Name',
            description: 'New desc',
            ownedBy: 'user:default/other',
          },
          { credentials, canWriteAll: true, groupsOfUser: [] },
        );

        expect(updated).toBeDefined();
        expect(updated!.name).toBe('New Name');
        expect(updated!.description).toBe('New desc');
        expect(updated!.ownedBy).toBe('user:default/other');
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'returns undefined for non-existent project - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const credentials = mockCredentials.user();

        const result = await service.updateProject(
          { projectId: nonExistentId },
          { name: 'Does not matter' },
          { credentials, groupsOfUser: [] },
        );

        expect(result).toBeUndefined();
      },
    );

    it.each(supportedDatabaseIds)(
      'respects permission filtering - non-owner cannot update - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const cred1 = mockCredentials.user('user:default/user1');
        const cred2 = mockCredentials.user('user:default/user2');

        const project = await service.createProject(
          {
            name: 'User1 Project',
            abbreviation: 'U1P',
            description: 'D',
            ...defaultProjectRepoFields,
          },
          { credentials: cred1 },
        );

        const result = await service.updateProject(
          { projectId: project.id },
          { name: 'Hijacked' },
          { credentials: cred2, canWriteAll: false, groupsOfUser: [] },
        );

        expect(result).toBeUndefined();

        const row = await client('projects').where('id', project.id).first();
        expect(row.name).toBe('User1 Project');
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'admin with canWriteAll can update any project - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const cred1 = mockCredentials.user('user:default/user1');
        const adminCred = mockCredentials.user('user:default/admin');

        const project = await service.createProject(
          {
            name: 'User1 Project',
            abbreviation: 'U1P',
            description: 'D',
            ...defaultProjectRepoFields,
          },
          { credentials: cred1 },
        );

        const updated = await service.updateProject(
          { projectId: project.id },
          { name: 'Admin Updated' },
          { credentials: adminCred, canWriteAll: true, groupsOfUser: [] },
        );

        expect(updated).toBeDefined();
        expect(updated!.name).toBe('Admin Updated');
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'does not alter dir_name when project name is updated - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Original Name',
            abbreviation: 'ON',
            description: 'desc',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );
        const originalDirName = project.dirName;
        expect(originalDirName).toBeDefined();

        const updated = await service.updateProject(
          { projectId: project.id },
          { name: 'Completely Different Name' },
          { credentials, groupsOfUser: [] },
        );

        expect(updated).toBeDefined();
        expect(updated!.name).toBe('Completely Different Name');
        expect(updated!.dirName).toBe(originalDirName);

        const row = await client('projects').where('id', project.id).first();
        expect(row.dir_name).toBe(originalDirName);
      },
      LONG_TEST_TIMEOUT,
    );
  });

  describe('listProjects', () => {
    it.each(supportedDatabaseIds)(
      'returns empty list and totalCount 0 when no projects exist - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const credentials = mockCredentials.user();
        const result = await service.listProjects(
          {},
          { credentials, groupsOfUser: [] },
        );
        expect(result.projects).toEqual([]);
        expect(result.totalCount).toBe(0);
      },
    );

    it.each(supportedDatabaseIds)(
      'returns all projects with correct totalCount and respects sort order - %p',
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

        const result = await service.listProjects(
          { order: 'desc', sort: 'createdAt' },
          { credentials, groupsOfUser: [] },
        );
        expect(result.totalCount).toBe(3);
        expect(result.projects).toHaveLength(3);
        expect(result.projects[0].name).toBe('Project 3');
        expect(result.projects[1].name).toBe('Project 2');
        expect(result.projects[2].name).toBe('Project 1');
      },
    );

    it.each(supportedDatabaseIds)(
      'paginates with page and pageSize - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const credentials = mockCredentials.user();
        for (let i = 1; i <= 5; i++) {
          await service.createProject(
            {
              name: `Project ${i}`,
              abbreviation: `P${i}`,
              description: `D${i}`,
              ...defaultProjectRepoFields,
            },
            { credentials },
          );
          await delay(10);
        }

        const page1 = await service.listProjects(
          { page: 0, pageSize: 2, sort: 'createdAt', order: 'desc' },
          { credentials, groupsOfUser: [] },
        );
        expect(page1.totalCount).toBe(5);
        expect(page1.projects).toHaveLength(2);
        expect(page1.projects[0].name).toBe('Project 5');
        expect(page1.projects[1].name).toBe('Project 4');

        const page2 = await service.listProjects(
          { page: 1, pageSize: 2, sort: 'createdAt', order: 'desc' },
          { credentials, groupsOfUser: [] },
        );
        expect(page2.totalCount).toBe(5);
        expect(page2.projects).toHaveLength(2);
        expect(page2.projects[0].name).toBe('Project 3');
        expect(page2.projects[1].name).toBe('Project 2');

        const page3 = await service.listProjects(
          { page: 2, pageSize: 2, sort: 'createdAt', order: 'desc' },
          { credentials, groupsOfUser: [] },
        );
        expect(page3.totalCount).toBe(5);
        expect(page3.projects).toHaveLength(1);
        expect(page3.projects[0].name).toBe('Project 1');
      },
    );

    it.each(supportedDatabaseIds)(
      'uses default pageSize when not specified - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const credentials = mockCredentials.user();
        for (let i = 1; i <= 15; i++) {
          await service.createProject(
            {
              name: `Project ${i}`,
              abbreviation: `P${i}`,
              description: `D${i}`,
              ...defaultProjectRepoFields,
            },
            { credentials },
          );
          if (i < 15) await delay(10);
        }
        const result = await service.listProjects(
          { sort: 'createdAt', order: 'desc' },
          { credentials, groupsOfUser: [] },
        );
        expect(result.totalCount).toBe(15);
        expect(result.projects).toHaveLength(10);
      },
    );

    it.each(supportedDatabaseIds)(
      'sorts by name in ascending and descending order - %p',
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

        const asc = await service.listProjects(
          { sort: 'name', order: 'asc' },
          { credentials, groupsOfUser: [] },
        );
        expect(asc.projects).toHaveLength(3);
        expect(asc.projects[0].name).toBe('Alpha Project');
        expect(asc.projects[1].name).toBe('Beta Project');
        expect(asc.projects[2].name).toBe('Zebra Project');

        const desc = await service.listProjects(
          { sort: 'name', order: 'desc' },
          { credentials, groupsOfUser: [] },
        );
        expect(desc.projects[0].name).toBe('Zebra Project');
        expect(desc.projects[1].name).toBe('Beta Project');
        expect(desc.projects[2].name).toBe('Alpha Project');
      },
    );

    it.each(supportedDatabaseIds)(
      'sorts by ownedBy when canViewAll is true - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const cred1 = mockCredentials.user('user:default/user1');
        const cred2 = mockCredentials.user('user:default/user2');
        const cred3 = mockCredentials.user('user:default/user3');
        await service.createProject(
          {
            name: 'P1',
            abbreviation: 'P1',
            description: 'D1',
            ...defaultProjectRepoFields,
          },
          { credentials: cred3 },
        );
        await delay(10);
        await service.createProject(
          {
            name: 'P2',
            abbreviation: 'P2',
            description: 'D2',
            ...defaultProjectRepoFields,
          },
          { credentials: cred1 },
        );
        await delay(10);
        await service.createProject(
          {
            name: 'P3',
            abbreviation: 'P3',
            description: 'D3',
            ...defaultProjectRepoFields,
          },
          { credentials: cred2 },
        );

        const result = await service.listProjects(
          { sort: 'ownedBy', order: 'asc' },
          { credentials: cred1, canViewAll: true, groupsOfUser: [] },
        );
        expect(result.projects).toHaveLength(3);
        expect(result.projects[0].ownedBy).toBe('user:default/user1');
        expect(result.projects[1].ownedBy).toBe('user:default/user2');
        expect(result.projects[2].ownedBy).toBe('user:default/user3');
      },
    );

    it.each(supportedDatabaseIds)(
      'filters by ownedBy when canViewAll is false - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const cred1 = mockCredentials.user('user:default/user1');
        const cred2 = mockCredentials.user('user:default/user2');
        await service.createProject(
          {
            name: 'U1P1',
            abbreviation: 'U1P1',
            description: 'D1',
            ...defaultProjectRepoFields,
          },
          { credentials: cred1 },
        );
        await delay(10);
        await service.createProject(
          {
            name: 'U1P2',
            abbreviation: 'U1P2',
            description: 'D2',
            ...defaultProjectRepoFields,
          },
          { credentials: cred1 },
        );
        await delay(10);
        await service.createProject(
          {
            name: 'U2P1',
            abbreviation: 'U2P1',
            description: 'D3',
            ...defaultProjectRepoFields,
          },
          { credentials: cred2 },
        );
        await delay(10);
        await service.createProject(
          {
            name: 'U2P2',
            abbreviation: 'U2P2',
            description: 'D4',
            ...defaultProjectRepoFields,
          },
          { credentials: cred2 },
        );

        const user1Result = await service.listProjects(
          { sort: 'createdAt', order: 'desc' },
          { credentials: cred1, canViewAll: false, groupsOfUser: [] },
        );
        expect(user1Result.totalCount).toBe(2);
        expect(
          user1Result.projects.every(p => p.ownedBy === 'user:default/user1'),
        ).toBe(true);

        const user2Result = await service.listProjects(
          { sort: 'createdAt', order: 'desc' },
          { credentials: cred2, canViewAll: false, groupsOfUser: [] },
        );
        expect(user2Result.totalCount).toBe(2);
        expect(
          user2Result.projects.every(p => p.ownedBy === 'user:default/user2'),
        ).toBe(true);
      },
    );

    it.each(supportedDatabaseIds)(
      'returns projects owned by user or their groups when groupsOfUser is provided - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const cred = mockCredentials.user('user:default/user1');

        // Project created by user
        await service.createProject(
          {
            name: 'User Project',
            abbreviation: 'UP',
            description: 'D1',
            ...defaultProjectRepoFields,
          },
          { credentials: cred },
        );

        // Project "owned" by group (inserted directly - e.g. created by group workflow)
        const groupProjectId = '11111111-1111-1111-1111-111111111111';
        await client('projects').insert({
          id: groupProjectId,
          name: 'Group Project',
          abbreviation: 'GP',
          description: 'Project created by group',
          source_repo_url: defaultProjectRepoFields.sourceRepoUrl,
          target_repo_url: defaultProjectRepoFields.targetRepoUrl,
          source_repo_branch: defaultProjectRepoFields.sourceRepoBranch,
          target_repo_branch: defaultProjectRepoFields.targetRepoBranch,
          owned_by: 'group:default/team-a',
          created_at: new Date(),
          dir_name: 'group-project-11111111',
        });

        const result = await service.listProjects(
          { sort: 'createdAt', order: 'desc' },
          {
            credentials: cred,
            canViewAll: false,
            groupsOfUser: ['group:default/team-a'],
          },
        );

        expect(result.totalCount).toBe(2);
        expect(result.projects).toHaveLength(2);
        const ownedBys = result.projects.map(p => p.ownedBy);
        expect(ownedBys).toContain('user:default/user1');
        expect(ownedBys).toContain('group:default/team-a');
      },
    );

    it.each(supportedDatabaseIds)(
      'returns all projects when canViewAll is true - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const cred1 = mockCredentials.user('user:default/user1');
        const cred2 = mockCredentials.user('user:default/user2');
        const cred3 = mockCredentials.user('user:default/user3');
        await service.createProject(
          {
            name: 'P1',
            abbreviation: 'P1',
            description: 'D1',
            ...defaultProjectRepoFields,
          },
          { credentials: cred1 },
        );
        await delay(10);
        await service.createProject(
          {
            name: 'P2',
            abbreviation: 'P2',
            description: 'D2',
            ...defaultProjectRepoFields,
          },
          { credentials: cred2 },
        );
        await delay(10);
        await service.createProject(
          {
            name: 'P3',
            abbreviation: 'P3',
            description: 'D3',
            ...defaultProjectRepoFields,
          },
          { credentials: cred3 },
        );

        const result = await service.listProjects(
          { sort: 'createdAt', order: 'desc' },
          { credentials: cred1, canViewAll: true, groupsOfUser: [] },
        );
        expect(result.totalCount).toBe(3);
        expect(result.projects).toHaveLength(3);
        expect(
          result.projects.some(p => p.ownedBy === 'user:default/user1'),
        ).toBe(true);
        expect(
          result.projects.some(p => p.ownedBy === 'user:default/user2'),
        ).toBe(true);
        expect(
          result.projects.some(p => p.ownedBy === 'user:default/user3'),
        ).toBe(true);
      },
    );

    it.each(supportedDatabaseIds)(
      'defaults to filtering by user when canViewAll is undefined - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const cred1 = mockCredentials.user('user:default/user1');
        const cred2 = mockCredentials.user('user:default/user2');
        await service.createProject(
          {
            name: 'U1',
            abbreviation: 'U1',
            description: 'D1',
            ...defaultProjectRepoFields,
          },
          { credentials: cred1 },
        );
        await delay(10);
        await service.createProject(
          {
            name: 'U2',
            abbreviation: 'U2',
            description: 'D2',
            ...defaultProjectRepoFields,
          },
          { credentials: cred2 },
        );

        const result = await service.listProjects(
          { sort: 'createdAt', order: 'desc' },
          { credentials: cred1, groupsOfUser: [] },
        );
        expect(result.totalCount).toBe(1);
        expect(result.projects[0].ownedBy).toBe('user:default/user1');
      },
    );

    it.each(supportedDatabaseIds)(
      'combines pagination and user filtering - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const cred1 = mockCredentials.user('user:default/user1');
        const cred2 = mockCredentials.user('user:default/user2');
        for (let i = 1; i <= 5; i++) {
          await service.createProject(
            {
              name: `User1 Project ${i}`,
              abbreviation: `U1P${i}`,
              description: `D${i}`,
              ...defaultProjectRepoFields,
            },
            { credentials: cred1 },
          );
          await delay(10);
        }
        for (let i = 1; i <= 3; i++) {
          await service.createProject(
            {
              name: `User2 Project ${i}`,
              abbreviation: `U2P${i}`,
              description: `D${i}`,
              ...defaultProjectRepoFields,
            },
            { credentials: cred2 },
          );
          if (i < 3) await delay(10);
        }

        const page1 = await service.listProjects(
          { page: 1, pageSize: 2, sort: 'createdAt', order: 'desc' },
          { credentials: cred1, canViewAll: false, groupsOfUser: [] },
        );
        expect(page1.totalCount).toBe(5);
        expect(page1.projects).toHaveLength(2);
        expect(
          page1.projects.every(p => p.ownedBy === 'user:default/user1'),
        ).toBe(true);
      },
    );

    it.each(supportedDatabaseIds)(
      'uses default sort and order when not specified - %p',
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

        const result = await service.listProjects(
          {},
          { credentials, groupsOfUser: [] },
        );
        expect(result.projects).toHaveLength(3);
        expect(result.projects[0].name).toBe('Project 3');
        expect(result.projects[1].name).toBe('Project 2');
        expect(result.projects[2].name).toBe('Project 1');
      },
    );

    it.each(supportedDatabaseIds)(
      'handles empty page gracefully - %p',
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

        const result = await service.listProjects(
          { page: 2, pageSize: 10 },
          { credentials, groupsOfUser: [] },
        );
        expect(result.totalCount).toBe(1);
        expect(result.projects).toHaveLength(0);
      },
    );

    it.each(supportedDatabaseIds)(
      'attaches migrationPlan to each project from latest init job - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'Project with plan',
            abbreviation: 'PWP',
            description: 'D',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );
        const planUrl = 'http://example.com/plan.md';
        await service.createJob({
          projectId: project.id,
          phase: 'init',
          artifacts: artifactsFromValues([planUrl], 'migration_plan'),
        });

        const result = await service.listProjects(
          {},
          { credentials, groupsOfUser: [] },
        );
        expect(result.projects).toHaveLength(1);
        expect(result.projects[0].migrationPlan).toBeDefined();
        expect(result.projects[0].migrationPlan?.type).toBe('migration_plan');
        expect(result.projects[0].migrationPlan?.value).toBe(planUrl);
      },
    );

    describe('sort by status', () => {
      const credentials = mockCredentials.user();
      const listOpts = {
        credentials,
        canViewAll: true as const,
        groupsOfUser: [] as string[],
      };

      async function makeProject(
        service: ReturnType<typeof createService>,
        name: string,
        abbrev: string,
        initStatus?: 'success' | 'error' | 'running' | 'pending',
      ) {
        const project = await service.createProject(
          {
            name,
            abbreviation: abbrev,
            description: name,
            ...defaultProjectRepoFields,
          },
          { credentials },
        );
        if (initStatus) {
          await service.createJob({
            projectId: project.id,
            phase: 'init',
            status: initStatus,
          });
        }
        return project;
      }

      async function addModule(
        service: ReturnType<typeof createService>,
        projectId: string,
        name: string,
        effectiveStatus:
          | 'finished'
          | 'waiting'
          | 'error'
          | 'pending'
          | 'running',
      ) {
        const mod = await service.createModule({
          name,
          sourcePath: `/${name}`,
          projectId,
        });
        if (effectiveStatus === 'finished') {
          await service.createJob({
            projectId,
            moduleId: mod.id,
            phase: 'analyze',
            status: 'success',
          });
          await service.createJob({
            projectId,
            moduleId: mod.id,
            phase: 'publish',
            status: 'success',
          });
        } else if (effectiveStatus === 'waiting') {
          await service.createJob({
            projectId,
            moduleId: mod.id,
            phase: 'analyze',
            status: 'success',
          });
        } else if (effectiveStatus === 'error') {
          await service.createJob({
            projectId,
            moduleId: mod.id,
            phase: 'analyze',
            status: 'error',
          });
        } else if (effectiveStatus === 'running') {
          await service.createJob({
            projectId,
            moduleId: mod.id,
            phase: 'analyze',
            status: 'running',
          });
        }
        return mod;
      }

      it.each(supportedDatabaseIds)(
        'sorts by state ascending and descending - %p',
        async databaseId => {
          const { client } = await createDatabase(databaseId);
          const service = createService(client);

          // 'created' (no init), 'failed' (init error), 'initialized' (init success, 0 modules)
          await makeProject(service, 'P-Created', 'PC');
          await makeProject(service, 'P-Failed', 'PF', 'error');
          await makeProject(service, 'P-Initialized', 'PI', 'success');

          // Semantic order: created(0) < initialized(2) < failed(4)
          const asc = await service.listProjects(
            { sort: 'status', order: 'asc' },
            listOpts,
          );
          expect(asc.projects.map(p => p.status?.state)).toEqual([
            'created',
            'initialized',
            'failed',
          ]);

          const desc = await service.listProjects(
            { sort: 'status', order: 'desc' },
            listOpts,
          );
          expect(desc.projects.map(p => p.status?.state)).toEqual([
            'failed',
            'initialized',
            'created',
          ]);
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'uses default order (desc) when order is not specified - %p',
        async databaseId => {
          const { client } = await createDatabase(databaseId);
          const service = createService(client);

          await makeProject(service, 'P-Created', 'PC');
          await makeProject(service, 'P-Initialized', 'PI', 'success');

          const result = await service.listProjects(
            { sort: 'status' },
            listOpts,
          );
          // desc: initialized(2) > created(0)
          expect(result.projects.map(p => p.status?.state)).toEqual([
            'initialized',
            'created',
          ]);
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'breaks ties by modulesSummary finished percentage - %p',
        async databaseId => {
          const { client } = await createDatabase(databaseId);
          const service = createService(client);

          // Both 'inProgress': init success, mixed modules, no errors
          // projLow: 1 finished + 1 waiting → finished = 50%
          const projLow = await makeProject(
            service,
            'Low-Finished',
            'LF',
            'success',
          );
          await addModule(service, projLow.id, 'lf-m1', 'finished');
          await addModule(service, projLow.id, 'lf-m2', 'waiting');

          // projHigh: 3 finished + 1 waiting → finished = 75%
          const projHigh = await makeProject(
            service,
            'High-Finished',
            'HF',
            'success',
          );
          await addModule(service, projHigh.id, 'hf-m1', 'finished');
          await addModule(service, projHigh.id, 'hf-m2', 'finished');
          await addModule(service, projHigh.id, 'hf-m3', 'finished');
          await addModule(service, projHigh.id, 'hf-m4', 'waiting');

          const asc = await service.listProjects(
            { sort: 'status', order: 'asc' },
            listOpts,
          );
          // Both 'inProgress'; ascending finished%: 50% < 75%
          expect(asc.projects.map(p => p.name)).toEqual([
            'Low-Finished',
            'High-Finished',
          ]);

          const desc = await service.listProjects(
            { sort: 'status', order: 'desc' },
            listOpts,
          );
          expect(desc.projects.map(p => p.name)).toEqual([
            'High-Finished',
            'Low-Finished',
          ]);
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'falls through to error percentage when finished percentages match - %p',
        async databaseId => {
          const { client } = await createDatabase(databaseId);
          const service = createService(client);

          // Both 'failed': init success, 0 finished, different error%
          // projLowErr: 1 error + 3 pending → error = 25%
          const projLowErr = await makeProject(
            service,
            'Low-Error',
            'LE',
            'success',
          );
          await addModule(service, projLowErr.id, 'le-m1', 'error');
          await addModule(service, projLowErr.id, 'le-m2', 'pending');
          await addModule(service, projLowErr.id, 'le-m3', 'pending');
          await addModule(service, projLowErr.id, 'le-m4', 'pending');

          // projHighErr: 2 error + 2 pending → error = 50%
          const projHighErr = await makeProject(
            service,
            'High-Error',
            'HE',
            'success',
          );
          await addModule(service, projHighErr.id, 'he-m1', 'error');
          await addModule(service, projHighErr.id, 'he-m2', 'error');
          await addModule(service, projHighErr.id, 'he-m3', 'pending');
          await addModule(service, projHighErr.id, 'he-m4', 'pending');

          const asc = await service.listProjects(
            { sort: 'status', order: 'asc' },
            listOpts,
          );
          // Both 'failed', 0% finished; ascending error%: 25% < 50%
          expect(asc.projects.map(p => p.name)).toEqual([
            'Low-Error',
            'High-Error',
          ]);

          const desc = await service.listProjects(
            { sort: 'status', order: 'desc' },
            listOpts,
          );
          expect(desc.projects.map(p => p.name)).toEqual([
            'High-Error',
            'Low-Error',
          ]);
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'treats equivalent fractions as equal (e.g. 1/3 vs 2/6) and falls through to next tiebreaker - %p',
        async databaseId => {
          const { client } = await createDatabase(databaseId);
          const service = createService(client);

          // Project A: 1 finished + 1 error + 1 pending → finished = 1/3, error = 1/3
          const projA = await makeProject(service, 'Frac-A', 'FA', 'success');
          await addModule(service, projA.id, 'fa-m1', 'finished');
          await addModule(service, projA.id, 'fa-m2', 'error');
          await addModule(service, projA.id, 'fa-m3', 'pending');

          // Project B: 2 finished + 4 pending → finished = 2/6 = 1/3, error = 0
          const projB = await makeProject(service, 'Frac-B', 'FB', 'success');
          await addModule(service, projB.id, 'fb-m1', 'finished');
          await addModule(service, projB.id, 'fb-m2', 'finished');
          await addModule(service, projB.id, 'fb-m3', 'pending');
          await addModule(service, projB.id, 'fb-m4', 'pending');
          await addModule(service, projB.id, 'fb-m5', 'pending');
          await addModule(service, projB.id, 'fb-m6', 'pending');

          // Both inProgress with identical finished% (1/3).
          // Tiebreaker: error% → A has 1/3, B has 0 → B sorts first ascending.
          const asc = await service.listProjects(
            { sort: 'status', order: 'asc' },
            listOpts,
          );
          expect(asc.projects.map(p => p.name)).toEqual(['Frac-B', 'Frac-A']);

          const desc = await service.listProjects(
            { sort: 'status', order: 'desc' },
            listOpts,
          );
          expect(desc.projects.map(p => p.name)).toEqual(['Frac-A', 'Frac-B']);
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'treats identical fractions with same denominator as tied - %p',
        async databaseId => {
          const { client } = await createDatabase(databaseId);
          const service = createService(client);

          // Both projects: 1 finished + 2 pending → finished = 1/3
          // All summary percentages are identical so the comparator returns 0.
          const projA = await makeProject(service, 'Same-A', 'SA', 'success');
          await addModule(service, projA.id, 'sa-m1', 'finished');
          await addModule(service, projA.id, 'sa-m2', 'pending');
          await addModule(service, projA.id, 'sa-m3', 'pending');

          const projB = await makeProject(service, 'Same-B', 'SB', 'success');
          await addModule(service, projB.id, 'sb-m1', 'finished');
          await addModule(service, projB.id, 'sb-m2', 'pending');
          await addModule(service, projB.id, 'sb-m3', 'pending');

          const result = await service.listProjects(
            { sort: 'status', order: 'asc' },
            listOpts,
          );
          expect(result.totalCount).toBe(2);
          expect(result.projects).toHaveLength(2);
          expect(
            result.projects.every(p => p.status?.state === 'inProgress'),
          ).toBe(true);
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'treats projects with 0 modules as tied on all percentages - %p',
        async databaseId => {
          const { client } = await createDatabase(databaseId);
          const service = createService(client);

          // Both 'initialized' with 0 modules: all percentages = 0
          await makeProject(service, 'Init-A', 'IA', 'success');
          await delay(10);
          await makeProject(service, 'Init-B', 'IB', 'success');

          const result = await service.listProjects(
            { sort: 'status', order: 'asc' },
            listOpts,
          );
          expect(result.totalCount).toBe(2);
          expect(result.projects).toHaveLength(2);
          expect(
            result.projects.every(p => p.status?.state === 'initialized'),
          ).toBe(true);
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'paginates correctly after in-memory sort - %p',
        async databaseId => {
          const { client } = await createDatabase(databaseId);
          const service = createService(client);

          await makeProject(service, 'P-Created', 'PC');
          await makeProject(service, 'P-Failed', 'PF', 'error');
          await makeProject(service, 'P-Initialized', 'PI', 'success');

          // Semantic asc: created(0), initialized(2), failed(4)
          const p0 = await service.listProjects(
            { sort: 'status', order: 'asc', page: 0, pageSize: 2 },
            listOpts,
          );
          expect(p0.totalCount).toBe(3);
          expect(p0.projects).toHaveLength(2);
          expect(p0.projects.map(p => p.status?.state)).toEqual([
            'created',
            'initialized',
          ]);

          const p1 = await service.listProjects(
            { sort: 'status', order: 'asc', page: 1, pageSize: 2 },
            listOpts,
          );
          expect(p1.totalCount).toBe(3);
          expect(p1.projects).toHaveLength(1);
          expect(p1.projects.map(p => p.status?.state)).toEqual(['failed']);
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'returns empty array for page beyond available data - %p',
        async databaseId => {
          const { client } = await createDatabase(databaseId);
          const service = createService(client);

          await makeProject(service, 'P-Only', 'PO');

          const result = await service.listProjects(
            { sort: 'status', order: 'asc', page: 5, pageSize: 10 },
            listOpts,
          );
          expect(result.totalCount).toBe(1);
          expect(result.projects).toHaveLength(0);
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'handles empty project list - %p',
        async databaseId => {
          const { client } = await createDatabase(databaseId);
          const service = createService(client);

          const result = await service.listProjects(
            { sort: 'status', order: 'asc' },
            listOpts,
          );
          expect(result.totalCount).toBe(0);
          expect(result.projects).toEqual([]);
        },
      );

      it.each(supportedDatabaseIds)(
        'sorts all six status states in semantic order - %p',
        async databaseId => {
          const { client } = await createDatabase(databaseId);
          const service = createService(client);

          // created: no init job
          await makeProject(service, 'P-Created', 'PCR');

          // initializing: init job running
          await makeProject(service, 'P-Initializing', 'PIG', 'running');

          // initialized: init success, 0 modules
          await makeProject(service, 'P-Initialized', 'PID', 'success');

          // inProgress: init success, 1 waiting module (beyond pending)
          const projInProgress = await makeProject(
            service,
            'P-InProgress',
            'PIP',
            'success',
          );
          await addModule(service, projInProgress.id, 'ip-m1', 'waiting');

          // failed: init error
          await makeProject(service, 'P-Failed', 'PFA', 'error');

          // completed: init success, all modules finished
          const projCompleted = await makeProject(
            service,
            'P-Completed',
            'PCO',
            'success',
          );
          await addModule(service, projCompleted.id, 'co-m1', 'finished');

          const asc = await service.listProjects(
            { sort: 'status', order: 'asc' },
            listOpts,
          );
          expect(asc.projects.map(p => p.status?.state)).toEqual([
            'created',
            'initializing',
            'initialized',
            'inProgress',
            'failed',
            'completed',
          ]);

          const desc = await service.listProjects(
            { sort: 'status', order: 'desc' },
            listOpts,
          );
          expect(desc.projects.map(p => p.status?.state)).toEqual([
            'completed',
            'failed',
            'inProgress',
            'initialized',
            'initializing',
            'created',
          ]);
        },
        LONG_TEST_TIMEOUT,
      );

      it.each(supportedDatabaseIds)(
        'sort by status respects permission filtering (canViewAll=false) - %p',
        async databaseId => {
          const { client } = await createDatabase(databaseId);
          const service = createService(client);

          const cred1 = mockCredentials.user('user:default/user1');
          const cred2 = mockCredentials.user('user:default/user2');

          // User1 projects
          await service.createProject(
            {
              name: 'U1-Created',
              abbreviation: 'U1C',
              description: 'U1 created',
              ...defaultProjectRepoFields,
            },
            { credentials: cred1 },
          );
          const u1Init = await service.createProject(
            {
              name: 'U1-Initialized',
              abbreviation: 'U1I',
              description: 'U1 initialized',
              ...defaultProjectRepoFields,
            },
            { credentials: cred1 },
          );
          await service.createJob({
            projectId: u1Init.id,
            phase: 'init',
            status: 'success',
          });

          // User2 project (should not appear for user1)
          const u2Proj = await service.createProject(
            {
              name: 'U2-Failed',
              abbreviation: 'U2F',
              description: 'U2 failed',
              ...defaultProjectRepoFields,
            },
            { credentials: cred2 },
          );
          await service.createJob({
            projectId: u2Proj.id,
            phase: 'init',
            status: 'error',
          });

          const result = await service.listProjects(
            { sort: 'status', order: 'asc' },
            { credentials: cred1, canViewAll: false, groupsOfUser: [] },
          );

          expect(result.totalCount).toBe(2);
          expect(result.projects).toHaveLength(2);
          expect(
            result.projects.every(p => p.ownedBy === 'user:default/user1'),
          ).toBe(true);
          // Semantic asc: created(0) < initialized(2)
          expect(result.projects.map(p => p.status?.state)).toEqual([
            'created',
            'initialized',
          ]);
        },
        LONG_TEST_TIMEOUT,
      );
    });
  });
});
