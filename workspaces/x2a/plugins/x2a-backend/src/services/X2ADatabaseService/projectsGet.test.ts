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
  nonExistentId,
  supportedDatabaseIds,
  tearDownDatabases,
} from '../../__testUtils__';

describe('X2ADatabaseService – projects (get & delete)', () => {
  afterEach(async () => {
    await tearDownDatabases();
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
          { credentials, groupsOfUser: [] },
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
          { credentials, groupsOfUser: [] },
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
      'returns project owned by group when user passes groupsOfUser containing that group - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const service = createService(client);
        const cred = mockCredentials.user('user:default/member');

        const groupProjectId = '22222222-2222-2222-2222-222222222222';
        await client('projects').insert({
          id: groupProjectId,
          name: 'Group-owned Project',
          abbreviation: 'GOP',
          description: 'Created by group',
          source_repo_url: defaultProjectRepoFields.sourceRepoUrl,
          target_repo_url: defaultProjectRepoFields.targetRepoUrl,
          source_repo_branch: defaultProjectRepoFields.sourceRepoBranch,
          target_repo_branch: defaultProjectRepoFields.targetRepoBranch,
          created_by: 'group:default/team-x',
          created_at: new Date(),
          dir_name: 'group-owned-project-22222222',
        });

        const retrieved = await service.getProject(
          { projectId: groupProjectId },
          {
            credentials: cred,
            canViewAll: false,
            groupsOfUser: ['group:default/team-x'],
          },
        );
        expect(retrieved).toBeDefined();
        expect(retrieved?.id).toBe(groupProjectId);
        expect(retrieved?.name).toBe('Group-owned Project');
        expect(retrieved?.createdBy).toBe('group:default/team-x');
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
          { credentials, groupsOfUser: [] },
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
          { credentials, groupsOfUser: [] },
        );
        const r2 = await service.getProject(
          { projectId: project2.id },
          { credentials, groupsOfUser: [] },
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
          { credentials: cred2, canViewAll: false, groupsOfUser: [] },
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
          { credentials, canViewAll: false, groupsOfUser: [] },
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
          { credentials: cred2, canViewAll: true, groupsOfUser: [] },
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
          { credentials: cred2, groupsOfUser: [] },
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
          { credentials, groupsOfUser: [] },
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
          await service.getProject(
            { projectId: project.id },
            { credentials, groupsOfUser: [] },
          ),
        ).toBeDefined();

        const deletedCount = await service.deleteProject(
          { projectId: project.id },
          { credentials, groupsOfUser: [] },
        );
        expect(deletedCount).toBe(1);
        expect(
          await service.getProject(
            { projectId: project.id },
            { credentials, groupsOfUser: [] },
          ),
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
          { credentials, groupsOfUser: [] },
        );
        expect(deletedCount).toBe(1);
        expect(
          await service.getProject(
            { projectId: project1.id },
            { credentials, groupsOfUser: [] },
          ),
        ).toBeUndefined();
        expect(
          await service.getProject(
            { projectId: project2.id },
            { credentials, groupsOfUser: [] },
          ),
        ).toBeDefined();
        const listResult = await service.listProjects(
          {},
          { credentials, groupsOfUser: [] },
        );
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
          { credentials: cred2, canWriteAll: false, groupsOfUser: [] },
        );
        expect(deletedCount).toBe(0);
        expect(
          await service.getProject(
            { projectId: project.id },
            { credentials: cred1, groupsOfUser: [] },
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
          { credentials, canWriteAll: false, groupsOfUser: [] },
        );
        expect(deletedCount).toBe(1);
        expect(
          await service.getProject(
            { projectId: project.id },
            { credentials, groupsOfUser: [] },
          ),
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
          { credentials: cred2, canWriteAll: true, groupsOfUser: [] },
        );
        expect(deletedCount).toBe(1);
        expect(
          await service.getProject(
            { projectId: project.id },
            { credentials: cred1, groupsOfUser: [] },
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
          { credentials: cred2, groupsOfUser: [] },
        );
        expect(deletedCount).toBe(0);
        expect(
          await service.getProject(
            { projectId: project.id },
            { credentials: cred1, groupsOfUser: [] },
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
          { credentials, groupsOfUser: [] },
        );
        expect(retrieved).toBeDefined();
        expect(retrieved?.name).toBe('Lifecycle Test');

        const listResult = await service.listProjects(
          {},
          { credentials, groupsOfUser: [] },
        );
        expect(listResult.totalCount).toBe(1);
        expect(listResult.projects[0].id).toBe(project.id);

        const deletedCount = await service.deleteProject(
          { projectId: project.id },
          { credentials, groupsOfUser: [] },
        );
        expect(deletedCount).toBe(1);
        expect(
          await service.getProject(
            { projectId: project.id },
            { credentials, groupsOfUser: [] },
          ),
        ).toBeUndefined();
        const finalList = await service.listProjects(
          {},
          { credentials, groupsOfUser: [] },
        );
        expect(finalList.totalCount).toBe(0);
      },
    );
  });
});
