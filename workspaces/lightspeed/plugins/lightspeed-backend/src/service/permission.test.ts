/*
 * Copyright 2024 The Backstage Authors
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
  AuthorizeResult,
  createPermission,
} from '@backstage/plugin-permission-common';

import { userPermissionAuthorization } from './permission';

describe('userPermissionAuthorization', () => {
  let mockPermissionsService: any;
  const mockPermission = createPermission({
    name: 'test.permission',
    attributes: { action: 'read' },
  });

  beforeEach(() => {
    mockPermissionsService = {
      authorize: jest.fn(),
    };
  });

  it('should not throw NotAllowedError', async () => {
    mockPermissionsService.authorize.mockResolvedValueOnce([
      { result: AuthorizeResult.ALLOW },
    ]);

    const { authorizeUser } = userPermissionAuthorization(
      mockPermissionsService,
    );

    const result = await authorizeUser(mockPermission, mockCredentials.user());
    expect(() => result).not.toThrow();
  });

  it('should throw NotAllowedError when authorization is denied', async () => {
    mockPermissionsService.authorize.mockResolvedValueOnce([
      { result: AuthorizeResult.DENY },
    ]);

    const { authorizeUser } = userPermissionAuthorization(
      mockPermissionsService,
    );

    await expect(
      authorizeUser(mockPermission, mockCredentials.user()),
    ).rejects.toThrow('Unauthorized');
  });
});
