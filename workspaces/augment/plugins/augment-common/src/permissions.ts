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
 * Permission to access the Augment plugin.
 *
 * Controls access to ALL Augment features. If a user has this
 * permission, they get full access. If not, they are blocked entirely.
 *
 * @public
 */
export const augmentAccessPermission = createPermission({
  name: 'augment.access',
  attributes: {
    action: 'read',
  },
});

/**
 * Permission to access admin features of the Augment plugin.
 *
 * Controls access to admin-only features such as document management,
 * swim lane/prompt editing, system prompt configuration, and branding.
 * Users with this permission see additional admin tabs in the UI.
 *
 * @public
 */
export const augmentAdminPermission = createPermission({
  name: 'augment.admin',
  attributes: {
    action: 'update',
  },
});

/**
 * List of all Augment permissions.
 *
 * To restrict access to a Keycloak group, configure RBAC policies in app-config.yaml:
 *
 * @example
 * ```yaml
 * permission:
 *   enabled: true
 *   rbac:
 *     policies:
 *       - g, group:default/augment-users, role:default/augment-user
 *       - p, role:default/augment-user, augment.access, read, allow
 *       - g, group:default/augment-admins, role:default/augment-admin
 *       - p, role:default/augment-admin, augment.access, read, allow
 *       - p, role:default/augment-admin, augment.admin, update, allow
 * ```
 *
 * @public
 */
export const augmentPermissions = [
  augmentAccessPermission,
  augmentAdminPermission,
];
