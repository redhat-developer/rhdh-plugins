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
export const RESOURCE_TYPE_EXTENSIONS_PLUGIN = 'extensions-plugin';

/**
 * @public
 * Convenience type for extensions plugin
 */
export type ExtensionsPluginPermission = ResourcePermission<
  typeof RESOURCE_TYPE_EXTENSIONS_PLUGIN
>;

/** This permission grants access to the endpoint that reads the configuration of the extensions plugin
 * @public
 */
export const extensionsPluginReadPermission = createPermission({
  name: 'extensions.plugin.configuration.read',
  attributes: {
    action: 'read',
  },
  resourceType: RESOURCE_TYPE_EXTENSIONS_PLUGIN,
});

/** This permission grants access to the endpoint that installs or updates the extensions plugin
 * @public
 */
export const extensionsPluginWritePermission = createPermission({
  name: 'extensions.plugin.configuration.write',
  attributes: {
    action: 'create',
  },
  resourceType: RESOURCE_TYPE_EXTENSIONS_PLUGIN,
});

/** This permission grants access to the endpoint that disables the extensions plugin
 * @public
 */
export const extensionsPluginDeletePermission = createPermission({
  name: 'extensions.plugin.configuration.delete',
  attributes: {
    action: 'delete',
  },
  resourceType: RESOURCE_TYPE_EXTENSIONS_PLUGIN,
});

/**
 * @public
 */
export const extensionsPermissions = [
  extensionsPluginWritePermission,
  extensionsPluginReadPermission,
  // extensionsPluginDeletePermission,
];
