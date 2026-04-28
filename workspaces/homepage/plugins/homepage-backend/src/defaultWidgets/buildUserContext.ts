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

import {
  BackstageCredentials,
  BackstageUserPrincipal,
  LoggerService,
  PermissionsService,
} from '@backstage/backend-plugin-api';
import { RELATION_MEMBER_OF } from '@backstage/catalog-model';
import { CatalogService } from '@backstage/plugin-catalog-node';
import {
  AuthorizeResult,
  createPermission,
} from '@backstage/plugin-permission-common';
import { PermissionDecision, UserContext } from './types';

export async function buildUserContext(opts: {
  credentials: BackstageCredentials<BackstageUserPrincipal>;
  catalog: CatalogService;
  permissions: PermissionsService;
  referencedPermissions: Set<string>;
  logger: LoggerService;
}): Promise<UserContext> {
  const { credentials, catalog, permissions, referencedPermissions, logger } =
    opts;

  const userEntityRef = credentials.principal.userEntityRef;

  const userEntity = await catalog.getEntityByRef(userEntityRef, {
    credentials,
  });
  if (!userEntity) {
    logger.warn(
      `User entity '${userEntityRef}' not found in catalog; group-based visibility will fail closed`,
    );
  }
  const groupEntityRefs = new Set<string>(
    (userEntity?.relations ?? [])
      .filter(relation => relation.type === RELATION_MEMBER_OF)
      .map(relation => relation.targetRef),
  );

  const permissionDecisions = new Map<string, PermissionDecision>();
  if (referencedPermissions.size > 0) {
    const names = [...referencedPermissions];
    const requests = names.map(name => ({
      permission: createPermission({ name, attributes: {} }),
    }));
    const decisions = await permissions.authorize(requests, { credentials });
    decisions.forEach((decision, index) => {
      permissionDecisions.set(
        names[index],
        decision.result === AuthorizeResult.ALLOW ? 'ALLOW' : 'DENY',
      );
    });
  }

  return { userEntityRef, groupEntityRefs, permissionDecisions };
}
