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
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { NotAllowedError } from '@backstage/errors';

import { resolveCredentialsContext } from './credentials';

function buildDeps(overrides?: {
  isUser?: boolean;
  userResult?: AuthorizeResult;
  viewResult?: AuthorizeResult;
  writeResult?: AuthorizeResult;
  groups?: string[];
}) {
  const {
    isUser = true,
    userResult = AuthorizeResult.ALLOW,
    viewResult = AuthorizeResult.DENY,
    writeResult = AuthorizeResult.DENY,
    groups = [],
  } = overrides ?? {};

  const auth = {
    isPrincipal: jest
      .fn()
      .mockImplementation((_creds: any, kind: string) =>
        kind === 'user' ? isUser : !isUser,
      ),
    getOwnServiceCredentials: jest.fn(),
    authenticate: jest.fn(),
    getNoneCredentials: jest.fn(),
    getLimitedUserToken: jest.fn(),
    listPublicServiceKeys: jest.fn(),
  };

  const memberRelations = groups.map(g => ({
    type: 'memberOf',
    targetRef: g,
  }));
  const catalog = {
    getEntities: jest.fn().mockResolvedValue({ items: [] }),
    getEntityByRef: jest.fn().mockResolvedValue(
      groups.length > 0
        ? {
            kind: 'User',
            metadata: { name: 'mock', namespace: 'default' },
            apiVersion: 'backstage.io/v1alpha1',
            spec: {},
            relations: memberRelations,
          }
        : undefined,
    ),
    removeEntityByUid: jest.fn(),
    refreshEntity: jest.fn(),
    getLocationByRef: jest.fn(),
    addLocation: jest.fn(),
    removeLocationById: jest.fn(),
    getLocationById: jest.fn(),
    getLocationByEntity: jest.fn(),
    queryEntities: jest.fn(),
    validateEntity: jest.fn(),
  };

  const permissionsSvc = {
    authorize: jest.fn().mockImplementation((requests: any[]) => {
      const permission = requests[0]?.permission;
      const name = permission?.name;
      const action = permission?.attributes?.action;
      if (name === 'x2a.user') return [{ result: userResult }];
      if (name === 'x2a.admin' && action === 'read')
        return [{ result: viewResult }];
      if (name === 'x2a.admin' && action === 'update')
        return [{ result: writeResult }];
      return [{ result: AuthorizeResult.DENY }];
    }),
    authorizeConditional: jest.fn(),
  };

  return {
    auth: auth as any,
    catalog: catalog as any,
    permissionsSvc: permissionsSvc as any,
  };
}

describe('resolveCredentialsContext', () => {
  describe('user principal', () => {
    it('resolves a user with x2a.user permission for read', async () => {
      const deps = buildDeps({ userResult: AuthorizeResult.ALLOW });
      const ctx = await resolveCredentialsContext({
        credentials: mockCredentials.user(),
        readOnly: true,
        ...deps,
      });

      expect(ctx.userRef).toBe('user:default/mock');
      expect(ctx.canViewAll).toBe(false);
      expect(ctx.canWriteAll).toBe(false);
    });

    it('resolves a user with admin view permission', async () => {
      const deps = buildDeps({
        userResult: AuthorizeResult.DENY,
        viewResult: AuthorizeResult.ALLOW,
      });
      const ctx = await resolveCredentialsContext({
        credentials: mockCredentials.user(),
        readOnly: true,
        ...deps,
      });

      expect(ctx.canViewAll).toBe(true);
      expect(ctx.canWriteAll).toBe(false);
    });

    it('resolves group memberships', async () => {
      const deps = buildDeps({ groups: ['group:default/team-a'] });
      const ctx = await resolveCredentialsContext({
        credentials: mockCredentials.user(),
        readOnly: true,
        ...deps,
      });

      expect(ctx.groupsOfUser).toEqual(['group:default/team-a']);
    });

    it('rejects a user with no permissions for read', async () => {
      const deps = buildDeps({
        userResult: AuthorizeResult.DENY,
        viewResult: AuthorizeResult.DENY,
      });

      await expect(
        resolveCredentialsContext({
          credentials: mockCredentials.user(),
          readOnly: true,
          ...deps,
        }),
      ).rejects.toThrow(NotAllowedError);
    });

    it('rejects a user with no permissions for write', async () => {
      const deps = buildDeps({
        userResult: AuthorizeResult.DENY,
        writeResult: AuthorizeResult.DENY,
      });

      await expect(
        resolveCredentialsContext({
          credentials: mockCredentials.user(),
          readOnly: false,
          ...deps,
        }),
      ).rejects.toThrow(NotAllowedError);
    });

    it('skips write permission check when readOnly is true', async () => {
      const deps = buildDeps({
        userResult: AuthorizeResult.ALLOW,
        writeResult: AuthorizeResult.ALLOW,
      });
      const ctx = await resolveCredentialsContext({
        credentials: mockCredentials.user(),
        readOnly: true,
        ...deps,
      });

      expect(ctx.canWriteAll).toBe(false);
    });
  });

  describe('service principal', () => {
    it('resolves a service principal with x2a.user permission', async () => {
      const deps = buildDeps({
        isUser: false,
        userResult: AuthorizeResult.ALLOW,
      });
      const ctx = await resolveCredentialsContext({
        credentials: mockCredentials.service(),
        readOnly: true,
        ...deps,
      });

      expect(ctx.userRef).toBe('user:default/system');
      expect(ctx.groupsOfUser).toEqual([]);
    });

    it('resolves a service principal with admin view to canViewAll', async () => {
      const deps = buildDeps({
        isUser: false,
        userResult: AuthorizeResult.DENY,
        viewResult: AuthorizeResult.ALLOW,
      });
      const ctx = await resolveCredentialsContext({
        credentials: mockCredentials.service(),
        readOnly: true,
        ...deps,
      });

      expect(ctx.canViewAll).toBe(true);
    });

    it('grants canViewAll when service has admin write', async () => {
      const deps = buildDeps({
        isUser: false,
        userResult: AuthorizeResult.DENY,
        writeResult: AuthorizeResult.ALLOW,
      });
      const ctx = await resolveCredentialsContext({
        credentials: mockCredentials.service(),
        readOnly: false,
        ...deps,
      });

      expect(ctx.canViewAll).toBe(true);
      expect(ctx.canWriteAll).toBe(true);
    });

    it('rejects a service principal with no permissions', async () => {
      const deps = buildDeps({
        isUser: false,
        userResult: AuthorizeResult.DENY,
        viewResult: AuthorizeResult.DENY,
        writeResult: AuthorizeResult.DENY,
      });

      await expect(
        resolveCredentialsContext({
          credentials: mockCredentials.service(),
          readOnly: false,
          ...deps,
        }),
      ).rejects.toThrow(NotAllowedError);
    });
  });
});
