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

import type { ConfigApi } from '@backstage/frontend-plugin-api';
import type {
  SidebarItemData,
  SidebarItemGroupData,
} from '@red-hat-developer-hub/backstage-plugin-app-react';

const SIDEBAR_KEY = 'app.sidebar';
const PLUGINS_KEY = 'plugins';

/** A config node that carries `items` and `groups`, with its config path. */
interface SidebarConfigSource {
  path: string;
  config: ConfigApi;
}

/**
 * Collects the config nodes that declare sidebar entries: every
 * `app.sidebar.plugins.<pluginName>` node first, then `app.sidebar` itself.
 * Later groups override earlier ones with the same id, so this order lets
 * the top-level config take precedence over per-plugin defaults.
 */
function readSidebarConfigSources(configApi: ConfigApi): SidebarConfigSource[] {
  const sidebar = configApi.getOptionalConfig(SIDEBAR_KEY);
  if (!sidebar) {
    return [];
  }

  const plugins = sidebar.getOptionalConfig(PLUGINS_KEY);
  const pluginSources = (plugins?.keys() ?? []).map(pluginName => ({
    path: `${SIDEBAR_KEY}.${PLUGINS_KEY}.${pluginName}`,
    config: plugins!.getConfig(pluginName),
  }));

  return [...pluginSources, { path: SIDEBAR_KEY, config: sidebar }];
}

/**
 * Reads the sidebar items from `app.sidebar.items` and from every
 * `app.sidebar.plugins.<pluginName>.items` and maps each entry into a
 * {@link SidebarItemData}. Config items have no extension id, so the config
 * path is used as their stable key. `to` is required here, unlike for items
 * contributed in code: config items cannot carry an `onClick` handler, so
 * an item without a link would render but do nothing.
 */
export function readConfigSidebarItems(
  configApi: ConfigApi,
): SidebarItemData[] {
  return readSidebarConfigSources(configApi).flatMap(({ path, config }) =>
    (config.getOptionalConfigArray('items') ?? []).map((item, index) => ({
      id: `${path}.items[${index}]`,
      title: item.getString('title'),
      icon: item.getOptionalString('icon'),
      to: item.getString('to'),
      priority: item.getOptionalNumber('priority'),
      group: item.getOptionalString('group'),
      requiresRoute: item.getOptionalBoolean('requiresRoute'),
    })),
  );
}

/**
 * Reads the sidebar groups from `app.sidebar.groups` and from every
 * `app.sidebar.plugins.<pluginName>.groups` and maps each entry into a
 * {@link SidebarItemGroupData}. The configured `id` is kept as-is so that a
 * group can both collect configured items and override a group contributed
 * by an extension.
 */
export function readConfigSidebarGroups(
  configApi: ConfigApi,
): SidebarItemGroupData[] {
  return readSidebarConfigSources(configApi).flatMap(({ config }) =>
    (config.getOptionalConfigArray('groups') ?? []).map(group => {
      // The config schema already rejects other values; unknown ones fall
      // back to the default variant instead of reaching the renderer.
      const variant = group.getOptionalString('variant');
      return {
        id: group.getString('id'),
        title: group.getString('title'),
        icon: group.getOptionalString('icon'),
        to: group.getOptionalString('to'),
        priority: group.getOptionalNumber('priority'),
        variant:
          variant === 'inline' || variant === 'flyout' ? variant : undefined,
      };
    }),
  );
}
