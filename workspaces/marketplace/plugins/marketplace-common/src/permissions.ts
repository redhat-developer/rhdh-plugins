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

import {
  createPermission,
  ResourcePermission,
} from '@backstage/plugin-permission-common';

/**
 * @public
 */
export const RESOURCE_TYPE_EXTENSION_PLUGIN = 'extension-plugin';

/**
 * @public
 */
export const RESOURCE_TYPE_EXTENSION_PACKAGE = 'extension-package';

/**
 * @public
 * Convenience type for extension plugin
 */
export type ExtensionPluginPermission = ResourcePermission<
  typeof RESOURCE_TYPE_EXTENSION_PLUGIN
>;

/**
 * @public
 * Convenience type for extension package
 */
export type ExtensionPackagePermission = ResourcePermission<
  typeof RESOURCE_TYPE_EXTENSION_PACKAGE
>;

/** This permission grants access to the endpoint that reads the configuration of the extension plugin
 * @public
 */
export const extensionPluginReadPermission = createPermission({
  name: 'extension.plugin.configuration.read',
  attributes: {
    action: 'read',
  },
  resourceType: RESOURCE_TYPE_EXTENSION_PLUGIN,
});

/** This permission grants access to the endpoint that updates the configuration of the extension plugin
 * @public
 */
export const extensionPluginUpdatePermission = createPermission({
  name: 'extension.plugin.configuration.update',
  attributes: {
    action: 'update',
  },
  resourceType: RESOURCE_TYPE_EXTENSION_PLUGIN,
});

/** This permission grants access to the endpoint that installs the extension plugin
 * @public
 */
export const extensionPluginCreatePermission = createPermission({
  name: 'extension.plugin.configuration.create',
  attributes: {
    action: 'create',
  },
  resourceType: RESOURCE_TYPE_EXTENSION_PLUGIN,
});

/** This permission grants access to the endpoint that disables the extension plugin
 * @public
 */
export const extensionPluginDeletePermission = createPermission({
  name: 'extension.plugin.configuration.delete',
  attributes: {
    action: 'delete',
  },
  resourceType: RESOURCE_TYPE_EXTENSION_PLUGIN,
});

/** This permission grants access to the endpoint that reads the configuration of the extension package
 * @public
 */
export const extensionPackageReadPermission = createPermission({
  name: 'extension.package.configuration.read',
  attributes: {
    action: 'read',
  },
  resourceType: RESOURCE_TYPE_EXTENSION_PACKAGE,
});

/** This permission grants access to the endpoint that installs the extension package
 * @public
 */
export const extensionPackageCreatePermission = createPermission({
  name: 'extension.package.configuration.create',
  attributes: {
    action: 'create',
  },
  resourceType: RESOURCE_TYPE_EXTENSION_PACKAGE,
});

/** This permission grants access to the endpoint that updates the configuration of the extension package
 * @public
 */
export const extensionPackageUpdatePermission = createPermission({
  name: 'extension.package.configuration.update',
  attributes: {
    action: 'update',
  },
  resourceType: RESOURCE_TYPE_EXTENSION_PACKAGE,
});

/** This permission grants access to the endpoint that disables the extension package
 * @public
 */
export const extensionPackageDeletePermission = createPermission({
  name: 'extension.package.configuration.delete',
  attributes: {
    action: 'delete',
  },
  resourceType: RESOURCE_TYPE_EXTENSION_PACKAGE,
});

/**
 * @public
 */
export const extensionPermissions = [
  // extensionPluginUpdatePermission,
  extensionPluginCreatePermission,
  extensionPluginReadPermission,
  // extensionPluginDeletePermission,
  // extensionPackageReadPermission,
  // extensionPackageDeletePermission,
  // extensionPackageUpdatePermission,
  // extensionPackageCreatePermission,
];
