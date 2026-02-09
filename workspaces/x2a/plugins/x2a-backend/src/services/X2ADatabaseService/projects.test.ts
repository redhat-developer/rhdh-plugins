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
  supportedDatabaseIds,
  tearDownDatabases,
} from './__testUtils__/testHelpers';
import { delay, LONG_TEST_TIMEOUT, nonExistentId } from '../../utils';

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
          createdBy: 'user:default/mock',
        });
        expect(project.id).toBeDefined();
        expect(project.createdAt).toBeInstanceOf(Date);

        const row = await client('projects').where('id', project.id).first();
        expect(row).toBeDefined();
        expect(row.name).toBe(input.name);
        expect(row.abbreviation).toBe(input.abbreviation);
        expect(row.created_by).toBe('user:default/mock');
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
      'sets createdBy from credentials - %p',
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
        expect(project.createdBy).toBe('user:default/custom-user');
        const row = await client('projects').where('id', project.id).first();
        expect(row.created_by).toBe('user:default/custom-user');
      },
    );
  });

  describe('listProjects', () => {
    it.each(supportedDatabaseIds)(
      'returns empty list and totalCount 0 when no projects exist - %p',
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
          { credentials },
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
          { credentials },
        );
        expect(page1.totalCount).toBe(5);
        expect(page1.projects).toHaveLength(2);
        expect(page1.projects[0].name).toBe('Project 5');
        expect(page1.projects[1].name).toBe('Project 4');

        const page2 = await service.listProjects(
          { page: 1, pageSize: 2, sort: 'createdAt', order: 'desc' },
          { credentials },
        );
        expect(page2.totalCount).toBe(5);
        expect(page2.projects).toHaveLength(2);
        expect(page2.projects[0].name).toBe('Project 3');
        expect(page2.projects[1].name).toBe('Project 2');

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
          { credentials },
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
          { credentials },
        );
        expect(asc.projects).toHaveLength(3);
        expect(asc.projects[0].name).toBe('Alpha Project');
        expect(asc.projects[1].name).toBe('Beta Project');
        expect(asc.projects[2].name).toBe('Zebra Project');

        const desc = await service.listProjects(
          { sort: 'name', order: 'desc' },
          { credentials },
        );
        expect(desc.projects[0].name).toBe('Zebra Project');
        expect(desc.projects[1].name).toBe('Beta Project');
        expect(desc.projects[2].name).toBe('Alpha Project');
      },
    );

    it.each(supportedDatabaseIds)(
      'sorts by createdBy when canViewAll is true - %p',
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
          { sort: 'createdBy', order: 'asc' },
          { credentials: cred1, canViewAll: true },
        );
        expect(result.projects).toHaveLength(3);
        expect(result.projects[0].createdBy).toBe('user:default/user1');
        expect(result.projects[1].createdBy).toBe('user:default/user2');
        expect(result.projects[2].createdBy).toBe('user:default/user3');
      },
    );

    it.each(supportedDatabaseIds)(
      'filters by createdBy when canViewAll is false - %p',
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
          { credentials: cred1, canViewAll: false },
        );
        expect(user1Result.totalCount).toBe(2);
        expect(
          user1Result.projects.every(p => p.createdBy === 'user:default/user1'),
        ).toBe(true);

        const user2Result = await service.listProjects(
          { sort: 'createdAt', order: 'desc' },
          { credentials: cred2, canViewAll: false },
        );
        expect(user2Result.totalCount).toBe(2);
        expect(
          user2Result.projects.every(p => p.createdBy === 'user:default/user2'),
        ).toBe(true);
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
          { credentials: cred1, canViewAll: true },
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
          { credentials: cred1 },
        );
        expect(result.totalCount).toBe(1);
        expect(result.projects[0].createdBy).toBe('user:default/user1');
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
          { credentials: cred1, canViewAll: false },
        );
        expect(page1.totalCount).toBe(5);
        expect(page1.projects).toHaveLength(2);
        expect(
          page1.projects.every(p => p.createdBy === 'user:default/user1'),
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

        const result = await service.listProjects({}, { credentials });
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
          { credentials },
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

        const result = await service.listProjects({}, { credentials });
        expect(result.projects).toHaveLength(1);
        expect(result.projects[0].migrationPlan).toBeDefined();
        expect(result.projects[0].migrationPlan?.type).toBe('migration_plan');
        expect(result.projects[0].migrationPlan?.value).toBe(planUrl);
      },
    );
  });

  describe('getProject', () => {
    it.each(supportedDatabaseIds)(
      'returns undefined for non-existent project - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const credentials = mockCredentials.user();
        const project = await service.getProject(
          { projectId: nonExistentId },
          { credentials },
        );
        expect(project).toBeUndefined();
      },
    );

    it.each(supportedDatabaseIds)(
      'returns the project by ID with all fields - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const credentials = mockCredentials.user();
        const created = await service.createProject(
          {
            name: 'Test Project',
            abbreviation: 'TP',
            description: 'Test description',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );

        const retrieved = await service.getProject(
          { projectId: created.id },
          { credentials },
        );
        expect(retrieved).toBeDefined();
        expect(retrieved?.id).toBe(created.id);
        expect(retrieved?.name).toBe(created.name);
        expect(retrieved?.abbreviation).toBe(created.abbreviation);
        expect(retrieved?.description).toBe(created.description);
        expect(retrieved?.sourceRepoUrl).toBe(created.sourceRepoUrl);
        expect(retrieved?.targetRepoUrl).toBe(created.targetRepoUrl);
        expect(retrieved?.createdBy).toBe(created.createdBy);
        expect(retrieved?.createdAt).toEqual(created.createdAt);
      },
    );

    it.each(supportedDatabaseIds)(
      'attaches migrationPlan from latest init job when present - %p',
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
        const planUrl = 'http://example.com/migration-plan.md';
        await service.createJob({
          projectId: project.id,
          phase: 'init',
          artifacts: artifactsFromValues([planUrl], 'migration_plan'),
        });

        const retrieved = await service.getProject(
          { projectId: project.id },
          { credentials },
        );
        expect(retrieved).toBeDefined();
        expect(retrieved?.migrationPlan).toBeDefined();
        expect(retrieved?.migrationPlan?.type).toBe('migration_plan');
        expect(retrieved?.migrationPlan?.value).toBe(planUrl);
      },
    );

    it.each(supportedDatabaseIds)(
      'returns correct project when multiple exist - %p',
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

        const r1 = await service.getProject(
          { projectId: project1.id },
          { credentials },
        );
        const r2 = await service.getProject(
          { projectId: project2.id },
          { credentials },
        );
        expect(r1?.id).toBe(project1.id);
        expect(r1?.name).toBe('Project 1');
        expect(r2?.id).toBe(project2.id);
        expect(r2?.name).toBe('Project 2');
      },
    );

    it.each(supportedDatabaseIds)(
      'returns undefined when user accesses project created by another user (canViewAll false) - %p',
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

        const retrieved = await service.getProject(
          { projectId: project.id },
          { credentials: cred2, canViewAll: false },
        );
        expect(retrieved).toBeUndefined();
      },
    );

    it.each(supportedDatabaseIds)(
      'returns project when user accesses their own project - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const credentials = mockCredentials.user('user:default/user1');
        const project = await service.createProject(
          {
            name: 'My Project',
            abbreviation: 'MP',
            description: 'D',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );

        const retrieved = await service.getProject(
          { projectId: project.id },
          { credentials, canViewAll: false },
        );
        expect(retrieved).toBeDefined();
        expect(retrieved?.id).toBe(project.id);
        expect(retrieved?.createdBy).toBe('user:default/user1');
      },
    );

    it.each(supportedDatabaseIds)(
      'returns project when canViewAll is true even if created by different user - %p',
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

        const retrieved = await service.getProject(
          { projectId: project.id },
          { credentials: cred2, canViewAll: true },
        );
        expect(retrieved).toBeDefined();
        expect(retrieved?.id).toBe(project.id);
        expect(retrieved?.createdBy).toBe('user:default/user1');
      },
    );

    it.each(supportedDatabaseIds)(
      'filters by user when canViewAll is undefined - %p',
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

        const retrieved = await service.getProject(
          { projectId: project.id },
          { credentials: cred2 },
        );
        expect(retrieved).toBeUndefined();
      },
    );
  });

  describe('deleteProject', () => {
    it.each(supportedDatabaseIds)(
      'returns 0 when deleting non-existent project - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const credentials = mockCredentials.user();
        const deletedCount = await service.deleteProject(
          { projectId: nonExistentId },
          { credentials },
        );
        expect(deletedCount).toBe(0);
      },
    );

    it.each(supportedDatabaseIds)(
      'deletes project and returns 1 - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const credentials = mockCredentials.user();
        const project = await service.createProject(
          {
            name: 'To Delete',
            abbreviation: 'TD',
            description: 'D',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );
        expect(
          await service.getProject({ projectId: project.id }, { credentials }),
        ).toBeDefined();

        const deletedCount = await service.deleteProject(
          { projectId: project.id },
          { credentials },
        );
        expect(deletedCount).toBe(1);
        expect(
          await service.getProject({ projectId: project.id }, { credentials }),
        ).toBeUndefined();
      },
    );

    it.each(supportedDatabaseIds)(
      'deletes only the specified project - %p',
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

        const deletedCount = await service.deleteProject(
          { projectId: project1.id },
          { credentials },
        );
        expect(deletedCount).toBe(1);
        expect(
          await service.getProject({ projectId: project1.id }, { credentials }),
        ).toBeUndefined();
        expect(
          await service.getProject({ projectId: project2.id }, { credentials }),
        ).toBeDefined();
        const listResult = await service.listProjects({}, { credentials });
        expect(listResult.totalCount).toBe(1);
        expect(listResult.projects[0].id).toBe(project2.id);
      },
    );

    it.each(supportedDatabaseIds)(
      'returns 0 when user tries to delete project created by another user - %p',
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

        const deletedCount = await service.deleteProject(
          { projectId: project.id },
          { credentials: cred2, canWriteAll: false },
        );
        expect(deletedCount).toBe(0);
        expect(
          await service.getProject(
            { projectId: project.id },
            { credentials: cred1 },
          ),
        ).toBeDefined();
      },
    );

    it.each(supportedDatabaseIds)(
      'deletes project when user deletes their own project - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const credentials = mockCredentials.user('user:default/user1');
        const project = await service.createProject(
          {
            name: 'My Project',
            abbreviation: 'MP',
            description: 'D',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );

        const deletedCount = await service.deleteProject(
          { projectId: project.id },
          { credentials, canWriteAll: false },
        );
        expect(deletedCount).toBe(1);
        expect(
          await service.getProject({ projectId: project.id }, { credentials }),
        ).toBeUndefined();
      },
    );

    it.each(supportedDatabaseIds)(
      'deletes project when canWriteAll is true even if created by different user - %p',
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

        const deletedCount = await service.deleteProject(
          { projectId: project.id },
          { credentials: cred2, canWriteAll: true },
        );
        expect(deletedCount).toBe(1);
        expect(
          await service.getProject(
            { projectId: project.id },
            { credentials: cred1 },
          ),
        ).toBeUndefined();
      },
    );

    it.each(supportedDatabaseIds)(
      'does not delete when canWriteAll is undefined (defaults to filter) - %p',
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

        const deletedCount = await service.deleteProject(
          { projectId: project.id },
          { credentials: cred2 },
        );
        expect(deletedCount).toBe(0);
        expect(
          await service.getProject(
            { projectId: project.id },
            { credentials: cred1 },
          ),
        ).toBeDefined();
      },
    );
  });

  describe('integration', () => {
    it.each(supportedDatabaseIds)(
      'full CRUD lifecycle: create, read, list, delete - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const credentials = mockCredentials.user();

        const project = await service.createProject(
          {
            name: 'Lifecycle Test',
            abbreviation: 'LT',
            description: 'Testing full lifecycle',
            ...defaultProjectRepoFields,
          },
          { credentials },
        );

        const retrieved = await service.getProject(
          { projectId: project.id },
          { credentials },
        );
        expect(retrieved).toBeDefined();
        expect(retrieved?.name).toBe('Lifecycle Test');

        const listResult = await service.listProjects({}, { credentials });
        expect(listResult.totalCount).toBe(1);
        expect(listResult.projects[0].id).toBe(project.id);

        const deletedCount = await service.deleteProject(
          { projectId: project.id },
          { credentials },
        );
        expect(deletedCount).toBe(1);
        expect(
          await service.getProject({ projectId: project.id }, { credentials }),
        ).toBeUndefined();
        const finalList = await service.listProjects({}, { credentials });
        expect(finalList.totalCount).toBe(0);
      },
    );
  });
});
