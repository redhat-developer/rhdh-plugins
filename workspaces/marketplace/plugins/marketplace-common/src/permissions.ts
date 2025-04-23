/*
 * Copyright The Backstage Authors
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

/** This permission is used to access the read endpoint of the extension plugin
 * @public
 */
export const extensionPluginReadPermission = createPermission({
  name: 'extension.plugin.configuration.read',
  attributes: {
    action: 'read',
  },
});

/** This permission is used to access the read endpoint of the extension package
 * @public
 */
export const extensionPackageReadPermission = createPermission({
  name: 'extension.package.configuration.read',
  attributes: {
    action: 'read',
  },
});

/** This permission is used to access the create endpoint of the extension plugin
 * @public
 */
export const extensionPluginCreatePermission = createPermission({
  name: 'extension.plugin.configuration.create',
  attributes: {
    action: 'create',
  },
});

/** This permission is used to access the create endpoint of the extension package
 * @public
 */
export const extensionPackageCreatePermission = createPermission({
  name: 'extension.package.configuration.create',
  attributes: {
    action: 'create',
  },
});

/** This permission is used to access the update endpoint of the  extension plugin
 * @public
 */
export const extensionPluginUpdatePermission = createPermission({
  name: 'extension.plugin.configuration.update',
  attributes: {
    action: 'update',
  },
});

/** This permission is used to access the update endpoint of the extension package
 * @public
 */
export const extensionPackageUpdatePermission = createPermission({
  name: 'extension.package.configuration.update',
  attributes: {
    action: 'update',
  },
});

/** This permission is used to access the delete endpoint of the extension plugin
 * @public
 */
export const extensionPluginDeletePermission = createPermission({
  name: 'extension.plugin.configuration.delete',
  attributes: {
    action: 'delete',
  },
});

/** This permission is used to access the delete endpoint of the extension package
 * @public
 */
export const extensionPackageDeletePermission = createPermission({
  name: 'extension.package.configuration.delete',
  attributes: {
    action: 'delete',
  },
});

/**
 * @public
 */
export const extensionPermissions = [
  extensionPackageCreatePermission,
  extensionPluginCreatePermission,
  extensionPackageReadPermission,
  extensionPluginReadPermission,
  extensionPluginDeletePermission,
  extensionPackageDeletePermission,
  extensionPackageUpdatePermission,
  extensionPluginUpdatePermission,
];
