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

import type { BackstageCredentials } from '@backstage/backend-plugin-api';
import { AuthorizeResult } from '@backstage/plugin-permission-common';

import { resolveX2aPermissionFlags } from './permissions';

function mockPermissionsSvc(
  userResult: AuthorizeResult,
  viewResult: AuthorizeResult,
  writeResult: AuthorizeResult,
) {
  return {
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
          return [{ result: viewResult }];
        }
        if (
          permission?.name === 'x2a.admin' &&
          permission?.attributes?.action === 'update'
        ) {
          return [{ result: writeResult }];
        }
        if (permission?.name === 'x2a.user') {
          return [{ result: userResult }];
        }
        return [{ result: AuthorizeResult.DENY }];
      },
    ),
  };
}

describe('resolveX2aPermissionFlags', () => {
  const creds = {
    principal: { userEntityRef: 'user:default/a' },
  } as BackstageCredentials;

  it('returns flags for x2a.user only', async () => {
    const permissionsSvc = mockPermissionsSvc(
      AuthorizeResult.ALLOW,
      AuthorizeResult.DENY,
      AuthorizeResult.DENY,
    );
    const flags = await resolveX2aPermissionFlags({
      credentials: creds,
      permissionsSvc: permissionsSvc as any,
    });
    expect(flags).toEqual({
      isX2AUser: true,
      canViewAll: false,
      canWriteAll: false,
    });
  });

  it('maps admin write to canViewAll', async () => {
    const permissionsSvc = mockPermissionsSvc(
      AuthorizeResult.DENY,
      AuthorizeResult.DENY,
      AuthorizeResult.ALLOW,
    );
    const flags = await resolveX2aPermissionFlags({
      credentials: creds,
      permissionsSvc: permissionsSvc as any,
    });
    expect(flags).toEqual({
      isX2AUser: false,
      canViewAll: true,
      canWriteAll: true,
    });
  });

  it('sets canViewAll from admin read without write', async () => {
    const permissionsSvc = mockPermissionsSvc(
      AuthorizeResult.DENY,
      AuthorizeResult.ALLOW,
      AuthorizeResult.DENY,
    );
    const flags = await resolveX2aPermissionFlags({
      credentials: creds,
      permissionsSvc: permissionsSvc as any,
    });
    expect(flags).toEqual({
      isX2AUser: false,
      canViewAll: true,
      canWriteAll: false,
    });
  });
});
