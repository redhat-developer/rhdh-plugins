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
import {
  BackstageCredentials,
  PermissionsService,
} from '@backstage/backend-plugin-api';
import { NotAllowedError } from '@backstage/errors';
import {
  AuthorizeResult,
  BasicPermission,
} from '@backstage/plugin-permission-common';

export function userPermissionAuthorization(
  permissionsService: PermissionsService,
) {
  const permissions = permissionsService;

  return {
    async authorizeUser(
      permission: BasicPermission,
      credentials: BackstageCredentials,
    ): Promise<void> {
      const decision = (
        await permissions.authorize(
          [
            {
              permission,
            },
          ],
          { credentials },
        )
      )[0];

      if (decision.result !== AuthorizeResult.ALLOW) {
        throw new NotAllowedError('Unauthorized');
      }
    },
  };
}
