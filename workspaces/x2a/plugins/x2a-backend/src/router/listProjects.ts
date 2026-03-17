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

import type {
  BackstageCredentials,
  BackstageUserPrincipal,
} from '@backstage/backend-plugin-api';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { NotAllowedError } from '@backstage/errors';
import {
  x2aAdminViewPermission,
  x2aUserPermission,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import type { RouterDeps } from './types';
import { getGroupsOfUser, getUserRef } from './common';
import type { ProjectsGet } from '../schema/openapi';

export async function listProjects(
  query: ProjectsGet['query'],
  deps: Pick<RouterDeps, 'permissionsSvc' | 'catalog' | 'x2aDatabase'>,
  credentials: BackstageCredentials<BackstageUserPrincipal>,
): Promise<ProjectsGet['response']> {
  const { permissionsSvc, catalog, x2aDatabase } = deps;

  const [userResult, adminViewResult] = await Promise.all([
    permissionsSvc.authorize([{ permission: x2aUserPermission }], {
      credentials,
    }),
    permissionsSvc.authorize([{ permission: x2aAdminViewPermission }], {
      credentials,
    }),
  ]);

  const isX2AUser = userResult[0]?.result === AuthorizeResult.ALLOW;
  const canViewAll = adminViewResult[0]?.result === AuthorizeResult.ALLOW;

  if (!isX2AUser && !canViewAll) {
    throw new NotAllowedError('The user is not allowed to read projects.');
  }

  const userRef = getUserRef(credentials);
  const groupsOfUser = await getGroupsOfUser(userRef, {
    catalog,
    credentials,
  });

  const { projects, totalCount } = await x2aDatabase.listProjects(query, {
    credentials,
    canViewAll,
    groupsOfUser,
  });

  return { totalCount, items: projects };
}
