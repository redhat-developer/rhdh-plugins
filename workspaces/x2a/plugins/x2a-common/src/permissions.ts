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

import { createPermission } from '@backstage/plugin-permission-common';

/**
 * Can view (read-only) all x2a projects and modules.
 *
 * @public
 */
export const x2aAdminViewPermission = createPermission({
  name: 'x2a.admin',
  attributes: {
    action: 'read',
  },
});

/**
 * Can create, update and delete x2a projects and modules.
 *
 * @public
 */
export const x2aAdminWritePermission = createPermission({
  name: 'x2a.admin',
  attributes: {
    action: 'update',
  },
});

/**
 * Can view and manage (read-write) x2a projects created by the user.
 *
 * @public
 */
export const x2aUserPermission = createPermission({
  name: 'x2a.user',
  attributes: {},
});

/**
 * All x2a permissions.
 *
 * @public
 */
export const x2aPermissions = [
  x2aAdminViewPermission,
  x2aAdminWritePermission,
  x2aUserPermission,
];
