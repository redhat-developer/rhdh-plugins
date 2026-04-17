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

import { RELATION_MEMBER_OF } from '@backstage/catalog-model';
import { mockCredentials } from '@backstage/backend-test-utils';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import type { Request } from 'express';
import {
  x2aUserPermission,
  x2aAdminWritePermission,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import {
  authorize,
  getGroupsOfUser,
  isUserOfAdminViewPermission,
  isUserOfAdminWritePermission,
  isUserOfX2AUserPermission,
  removeSensitiveFromJob,
  UnsecureJob,
  useEnforceProjectPermissions,
  useEnforceX2APermissions,
} from './common';
import { getCatalogMock } from '../__testUtils__';

describe('common', () => {
  const createMockRequest = (credentialsHeader?: string): Request =>
    ({
      headers: credentialsHeader ? { authorization: credentialsHeader } : {},
    }) as Request;

  const createMockPermissionsSvc = (
    x2aUserResult: AuthorizeResult,
    adminViewResult: AuthorizeResult,
    adminWriteResult: AuthorizeResult,
  ) => ({
    authorize: jest.fn().mockImplementation(
      async (
        requests: {
          permission?: { name?: string; attributes?: { action?: string } };
        }[],
      ) => {
        const permission = requests[0]?.permission;
        if (
          permission?.name === 'x2a.admin' &&
          permission?.attributes?.action === 'read'
        ) {
          return [{ result: adminViewResult }];
        }
        if (
          permission?.name === 'x2a.admin' &&
          permission?.attributes?.action === 'update'
        ) {
          return [{ result: adminWriteResult }];
        }
        if (permission?.name === 'x2a.user') {
          return [{ result: x2aUserResult }];
        }
        return [{ result: AuthorizeResult.ALLOW }];
      },
    ),
  });

  const createMockHttpAuth = (userRef: string = 'user:default/mock') => ({
    credentials: jest.fn().mockResolvedValue(mockCredentials.user(userRef)),
  });

  describe('removeSensitiveFromJob', () => {
    it('returns undefined when job is undefined', () => {
      expect(removeSensitiveFromJob(undefined)).toBeUndefined();
    });

    it('returns undefined when job is null', () => {
      expect(removeSensitiveFromJob(null as any)).toBeUndefined();
    });

    it('removes callbackToken from job', () => {
      const job: UnsecureJob = {
        id: 'job-1',
        projectId: 'proj-1',
        moduleId: 'module-1',
        phase: 'init' as const,
        status: 'pending' as const,
        callbackToken: 'secret-token',
        startedAt: new Date(),
        k8sJobName: 'job-1',
      };
      const result = removeSensitiveFromJob(job);
      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('callbackToken');
      expect(result).toMatchObject({
        id: 'job-1',
        projectId: 'proj-1',
        phase: 'init',
        status: 'pending',
      });
    });

    it('returns job unchanged when it has no callbackToken', () => {
      const job = {
        id: 'job-1',
        projectId: 'proj-1',
        moduleId: 'module-1',
        phase: 'analyze' as const,
        status: 'success' as const,
        startedAt: new Date(),
        k8sJobName: 'job-1',
      };
      const result = removeSensitiveFromJob(job);
      expect(result).toEqual(job);
    });

    it('does not mutate the original job object', () => {
      const job = {
        id: 'job-1',
        callbackToken: 'secret',
        startedAt: new Date(),
        k8sJobName: 'job-1',
      } as UnsecureJob;
      const result = removeSensitiveFromJob(job);
      expect(job).toHaveProperty('callbackToken', 'secret');
      expect(result).not.toHaveProperty('callbackToken');
    });
  });

  describe('getGroupsOfUser', () => {
    it('returns empty array when user entity is null', async () => {
      const catalog = getCatalogMock();
      (catalog.getEntityByRef as jest.Mock).mockResolvedValue(null);
      const credentials = mockCredentials.user('user:default/testuser');

      const result = await getGroupsOfUser('user:default/testuser', {
        catalog: catalog as any,
        credentials,
      });

      expect(result).toEqual([]);
      expect(catalog.getEntityByRef).toHaveBeenCalledWith(
        'user:default/testuser',
        { credentials },
      );
    });

    it('returns empty array when user entity is undefined', async () => {
      const catalog = getCatalogMock();
      (catalog.getEntityByRef as jest.Mock).mockResolvedValue(undefined);
      const credentials = mockCredentials.user('user:default/testuser');

      const result = await getGroupsOfUser('user:default/testuser', {
        catalog: catalog as any,
        credentials,
      });

      expect(result).toEqual([]);
    });

    it('returns empty array when user entity has no relations', async () => {
      const catalog = getCatalogMock();
      (catalog.getEntityByRef as jest.Mock).mockResolvedValue({
        kind: 'User',
        metadata: { name: 'testuser' },
        relations: undefined,
      });
      const credentials = mockCredentials.user('user:default/testuser');

      const result = await getGroupsOfUser('user:default/testuser', {
        catalog: catalog as any,
        credentials,
      });

      expect(result).toEqual([]);
    });

    it('returns empty array when user entity has no memberOf relations', async () => {
      const catalog = getCatalogMock();
      (catalog.getEntityByRef as jest.Mock).mockResolvedValue({
        kind: 'User',
        metadata: { name: 'testuser' },
        relations: [
          { type: 'other-relation', targetRef: 'something:default/other' },
        ],
      });
      const credentials = mockCredentials.user('user:default/testuser');

      const result = await getGroupsOfUser('user:default/testuser', {
        catalog: catalog as any,
        credentials,
      });

      expect(result).toEqual([]);
    });

    it('returns group refs when user has memberOf relations', async () => {
      const catalog = getCatalogMock();
      (catalog.getEntityByRef as jest.Mock).mockResolvedValue({
        kind: 'User',
        metadata: { name: 'testuser' },
        relations: [
          {
            type: RELATION_MEMBER_OF,
            targetRef: 'group:default/team-a',
          },
          {
            type: RELATION_MEMBER_OF,
            targetRef: 'group:default/team-b',
          },
          { type: 'other-relation', targetRef: 'something:default/other' },
        ],
      });
      const credentials = mockCredentials.user('user:default/testuser');

      const result = await getGroupsOfUser('user:default/testuser', {
        catalog: catalog as any,
        credentials,
      });

      expect(result).toEqual(['group:default/team-a', 'group:default/team-b']);
    });

    it('returns empty array on catalog error', async () => {
      const catalog = getCatalogMock();
      (catalog.getEntityByRef as jest.Mock).mockRejectedValue(
        new Error('Catalog unavailable'),
      );
      const credentials = mockCredentials.user('user:default/testuser');

      const result = await getGroupsOfUser('user:default/testuser', {
        catalog: catalog as any,
        credentials,
      });

      expect(result).toEqual([]);
    });
  });

  describe('isUserOfX2AUserPermission', () => {
    it('returns true when x2a.user is allowed', async () => {
      const permissionsSvc = createMockPermissionsSvc(
        AuthorizeResult.ALLOW,
        AuthorizeResult.DENY,
        AuthorizeResult.DENY,
      );
      const httpAuth = createMockHttpAuth();
      const req = createMockRequest();

      const result = await isUserOfX2AUserPermission(
        req,
        permissionsSvc as any,
        httpAuth as any,
      );
      expect(result).toBe(true);
    });

    it('returns false when x2a.user is denied', async () => {
      const permissionsSvc = createMockPermissionsSvc(
        AuthorizeResult.DENY,
        AuthorizeResult.DENY,
        AuthorizeResult.DENY,
      );
      const httpAuth = createMockHttpAuth();
      const req = createMockRequest();

      const result = await isUserOfX2AUserPermission(
        req,
        permissionsSvc as any,
        httpAuth as any,
      );
      expect(result).toBe(false);
    });
  });

  describe('isUserOfAdminViewPermission', () => {
    it('returns true when x2a.admin read is allowed', async () => {
      const permissionsSvc = createMockPermissionsSvc(
        AuthorizeResult.DENY,
        AuthorizeResult.ALLOW,
        AuthorizeResult.DENY,
      );
      const httpAuth = createMockHttpAuth();
      const req = createMockRequest();

      const result = await isUserOfAdminViewPermission(
        req,
        permissionsSvc as any,
        httpAuth as any,
      );
      expect(result).toBe(true);
    });

    it('returns false when x2a.admin read is denied', async () => {
      const permissionsSvc = createMockPermissionsSvc(
        AuthorizeResult.DENY,
        AuthorizeResult.DENY,
        AuthorizeResult.DENY,
      );
      const httpAuth = createMockHttpAuth();
      const req = createMockRequest();

      const result = await isUserOfAdminViewPermission(
        req,
        permissionsSvc as any,
        httpAuth as any,
      );
      expect(result).toBe(false);
    });
  });

  describe('isUserOfAdminWritePermission', () => {
    it('returns true when x2a.admin update is allowed', async () => {
      const permissionsSvc = createMockPermissionsSvc(
        AuthorizeResult.DENY,
        AuthorizeResult.DENY,
        AuthorizeResult.ALLOW,
      );
      const httpAuth = createMockHttpAuth();
      const req = createMockRequest();

      const result = await isUserOfAdminWritePermission(
        req,
        permissionsSvc as any,
        httpAuth as any,
      );
      expect(result).toBe(true);
    });

    it('returns false when x2a.admin update is denied', async () => {
      const permissionsSvc = createMockPermissionsSvc(
        AuthorizeResult.DENY,
        AuthorizeResult.DENY,
        AuthorizeResult.DENY,
      );
      const httpAuth = createMockHttpAuth();
      const req = createMockRequest();

      const result = await isUserOfAdminWritePermission(
        req,
        permissionsSvc as any,
        httpAuth as any,
      );
      expect(result).toBe(false);
    });
  });

  describe('authorize', () => {
    it('returns ALLOW when any of the permissions is allowed', async () => {
      const permissionsSvc = {
        authorize: jest.fn().mockImplementation(async ([req]: any[]) => {
          const perm = req?.permission?.name;
          if (perm === 'x2a.user') return [{ result: AuthorizeResult.DENY }];
          if (perm === 'x2a.admin') return [{ result: AuthorizeResult.ALLOW }];
          return [{ result: AuthorizeResult.DENY }];
        }),
      };
      const httpAuth = createMockHttpAuth();
      const req = createMockRequest();

      const result = await authorize(
        req,
        [x2aAdminWritePermission, x2aUserPermission],
        permissionsSvc as any,
        httpAuth as any,
      );
      expect(result.result).toBe(AuthorizeResult.ALLOW);
    });

    it('returns DENY when all permissions are denied', async () => {
      const permissionsSvc = {
        authorize: jest
          .fn()
          .mockResolvedValue([{ result: AuthorizeResult.DENY }]),
      };
      const httpAuth = createMockHttpAuth();
      const req = createMockRequest();

      const result = await authorize(
        req,
        [x2aAdminWritePermission, x2aUserPermission],
        permissionsSvc as any,
        httpAuth as any,
      );
      expect(result.result).toBe(AuthorizeResult.DENY);
    });
  });

  describe('useEnforceX2APermissions', () => {
    it('returns canViewAll and canWriteAll when user has x2a.user', async () => {
      const permissionsSvc = createMockPermissionsSvc(
        AuthorizeResult.ALLOW,
        AuthorizeResult.DENY,
        AuthorizeResult.DENY,
      );
      const httpAuth = createMockHttpAuth();
      const req = createMockRequest();

      const result = await useEnforceX2APermissions({
        req,
        readOnly: true,
        permissionsSvc: permissionsSvc as any,
        httpAuth: httpAuth as any,
      });
      expect(result).toMatchObject({
        canViewAll: false,
        canWriteAll: false,
        credentials: {
          principal: {
            type: 'user',
            userEntityRef: 'user:default/mock',
          },
        },
      });
    });

    it('returns canViewAll when user has admin view permission', async () => {
      const permissionsSvc = createMockPermissionsSvc(
        AuthorizeResult.DENY,
        AuthorizeResult.ALLOW,
        AuthorizeResult.DENY,
      );
      const httpAuth = createMockHttpAuth();
      const req = createMockRequest();

      const result = await useEnforceX2APermissions({
        req,
        readOnly: true,
        permissionsSvc: permissionsSvc as any,
        httpAuth: httpAuth as any,
      });
      expect(result).toMatchObject({
        canViewAll: true,
        canWriteAll: false,
        credentials: {
          principal: {
            type: 'user',
            userEntityRef: 'user:default/mock',
          },
        },
      });
    });

    it('returns canViewAll and canWriteAll when readOnly and user has admin write only', async () => {
      const permissionsSvc = createMockPermissionsSvc(
        AuthorizeResult.DENY,
        AuthorizeResult.DENY,
        AuthorizeResult.ALLOW,
      );
      const httpAuth = createMockHttpAuth();
      const req = createMockRequest();

      const result = await useEnforceX2APermissions({
        req,
        readOnly: true,
        permissionsSvc: permissionsSvc as any,
        httpAuth: httpAuth as any,
      });
      expect(result).toMatchObject({
        canViewAll: true,
        canWriteAll: true,
        credentials: {
          principal: {
            type: 'user',
            userEntityRef: 'user:default/mock',
          },
        },
      });
    });

    it('returns canWriteAll when readOnly false and user has admin write', async () => {
      const permissionsSvc = createMockPermissionsSvc(
        AuthorizeResult.DENY,
        AuthorizeResult.DENY,
        AuthorizeResult.ALLOW,
      );
      const httpAuth = createMockHttpAuth();
      const req = createMockRequest();

      const result = await useEnforceX2APermissions({
        req,
        readOnly: false,
        permissionsSvc: permissionsSvc as any,
        httpAuth: httpAuth as any,
      });
      expect(result).toMatchObject({
        canViewAll: true,
        canWriteAll: true,
        credentials: {
          principal: {
            type: 'user',
            userEntityRef: 'user:default/mock',
          },
        },
      });
    });

    it('throws NotAllowedError when user has no permissions (readOnly)', async () => {
      const permissionsSvc = createMockPermissionsSvc(
        AuthorizeResult.DENY,
        AuthorizeResult.DENY,
        AuthorizeResult.DENY,
      );
      const httpAuth = createMockHttpAuth();
      const req = createMockRequest();

      await expect(
        useEnforceX2APermissions({
          req,
          readOnly: true,
          permissionsSvc: permissionsSvc as any,
          httpAuth: httpAuth as any,
        }),
      ).rejects.toMatchObject({
        name: 'NotAllowedError',
        message: 'The user is not allowed to read projects.',
      });
    });

    it('throws NotAllowedError when user has no permissions (write)', async () => {
      const permissionsSvc = createMockPermissionsSvc(
        AuthorizeResult.DENY,
        AuthorizeResult.DENY,
        AuthorizeResult.DENY,
      );
      const httpAuth = createMockHttpAuth();
      const req = createMockRequest();

      await expect(
        useEnforceX2APermissions({
          req,
          readOnly: false,
          permissionsSvc: permissionsSvc as any,
          httpAuth: httpAuth as any,
        }),
      ).rejects.toMatchObject({
        name: 'NotAllowedError',
        message: 'The user is not allowed to write projects.',
      });
    });

    it('throws NotAllowedError when readOnly=false and user has only x2a.admin read (not write)', async () => {
      const permissionsSvc = createMockPermissionsSvc(
        AuthorizeResult.DENY, // no x2a.user
        AuthorizeResult.ALLOW, // x2a.admin read
        AuthorizeResult.DENY, // no x2a.admin write
      );
      const httpAuth = createMockHttpAuth();
      const req = createMockRequest();

      await expect(
        useEnforceX2APermissions({
          req,
          readOnly: false,
          permissionsSvc: permissionsSvc as any,
          httpAuth: httpAuth as any,
        }),
      ).rejects.toMatchObject({
        name: 'NotAllowedError',
        message: 'The user is not allowed to write projects.',
      });
    });
  });

  describe('useEnforceProjectPermissions', () => {
    it('throws NotAllowedError when user has no x2a permissions', async () => {
      const permissionsSvc = createMockPermissionsSvc(
        AuthorizeResult.DENY,
        AuthorizeResult.DENY,
        AuthorizeResult.DENY,
      );
      const httpAuth = createMockHttpAuth();
      const req = createMockRequest();
      const x2aDatabase = { getProject: jest.fn() };
      const catalog = getCatalogMock();

      await expect(
        useEnforceProjectPermissions({
          req,
          readOnly: true,
          projectId: 'proj-1',
          x2aDatabase: x2aDatabase as any,
          permissionsSvc: permissionsSvc as any,
          httpAuth: httpAuth as any,
          catalog,
        }),
      ).rejects.toMatchObject({
        name: 'NotAllowedError',
        message: 'The user is not allowed to read projects.',
      });
      expect(x2aDatabase.getProject).not.toHaveBeenCalled();
    });

    it('throws NotFoundError when project does not exist', async () => {
      const permissionsSvc = createMockPermissionsSvc(
        AuthorizeResult.ALLOW,
        AuthorizeResult.DENY,
        AuthorizeResult.DENY,
      );
      const httpAuth = createMockHttpAuth('user:default/testuser');
      const req = createMockRequest();
      const x2aDatabase = {
        getProject: jest.fn().mockResolvedValue(null),
      };
      const catalog = getCatalogMock();

      await expect(
        useEnforceProjectPermissions({
          req,
          readOnly: true,
          projectId: 'non-existent',
          x2aDatabase: x2aDatabase as any,
          permissionsSvc: permissionsSvc as any,
          httpAuth: httpAuth as any,
          catalog,
        }),
      ).rejects.toMatchObject({
        name: 'NotFoundError',
        message: expect.stringContaining('Project not found'),
      });
    });

    it('does not throw when project exists and user has permission', async () => {
      const permissionsSvc = createMockPermissionsSvc(
        AuthorizeResult.ALLOW,
        AuthorizeResult.DENY,
        AuthorizeResult.DENY,
      );
      const httpAuth = createMockHttpAuth();
      const req = createMockRequest();
      const mockProject = { id: 'proj-1', name: 'Test' };
      const x2aDatabase = {
        getProject: jest.fn().mockResolvedValue(mockProject),
      };
      const catalog = getCatalogMock();

      await expect(
        useEnforceProjectPermissions({
          req,
          readOnly: true,
          projectId: 'proj-1',
          x2aDatabase: x2aDatabase as any,
          permissionsSvc: permissionsSvc as any,
          httpAuth: httpAuth as any,
          catalog,
        }),
      ).resolves.toMatchObject({
        project: mockProject,
        userRef: 'user:default/mock',
      });
      expect(x2aDatabase.getProject).toHaveBeenCalledWith(
        { projectId: 'proj-1', skipEnrichment: true },
        expect.objectContaining({
          credentials: expect.anything(),
          canViewAll: false,
          groupsOfUser: expect.any(Array),
        }),
      );
    });
  });
});
