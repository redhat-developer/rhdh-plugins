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

/**
 * Sidebar item declared in config. Mirrors the params of
 * `SidebarItemBlueprint`, minus `onClick`, which is why `to` is required.
 */
interface SidebarItemConfig {
  /**
   * Text shown next to the icon. Translated when it matches one of the
   * known page titles, otherwise shown as-is.
   * @visibility frontend
   */
  title: string;
  /**
   * Link target, either an app-internal path such as `/catalog` or an
   * absolute URL. Required: unlike items contributed in code, config
   * items cannot carry an `onClick` handler, so an item without `to`
   * would do nothing.
   * @visibility frontend
   */
  to: string;
  /**
   * Key of a system icon registered via `IconBundleBlueprint`, for
   * example `home`, `category` or `school`. A generic icon is shown when
   * the key is unknown.
   * @visibility frontend
   */
  icon?: string;
  /**
   * Ordering priority. Higher values render first, ties are broken by
   * title. Defaults to `0`, which places the item in the scrollable
   * main area of the sidebar.
   * @visibility frontend
   */
  priority?: number;
  /**
   * `id` of the group this item belongs to, for example `admin` or
   * `settings`. Items without a group, or whose group does not exist,
   * render at the top level.
   * @visibility frontend
   */
  group?: string;
  /**
   * When `true`, the item is only rendered when the app has a route
   * matching its `to`. Use this for items linking to an optional
   * plugin's page so the entry disappears when that plugin is not
   * installed.
   * @visibility frontend
   */
  requiresRoute?: boolean;
}

/**
 * Sidebar group declared in config. Mirrors the params of
 * `SidebarItemGroupBlueprint`.
 */
interface SidebarItemGroupConfig {
  /**
   * Identifier referenced by the `group` of a sidebar item. Using the `id`
   * of a group contributed by an extension (for example `admin` or
   * `settings`) overrides that group instead of adding a second one.
   * @visibility frontend
   */
  id: string;
  /**
   * Text shown next to the icon.
   * @visibility frontend
   */
  title: string;
  /**
   * Key of a system icon registered via `IconBundleBlueprint`, for
   * example `home`, `category` or `school`. A generic icon is shown when
   * the key is unknown.
   * @visibility frontend
   */
  icon?: string;
  /**
   * Optional link target for the group entry itself.
   * @visibility frontend
   */
  to?: string;
  /**
   * Ordering priority. Higher values render first, ties are broken by
   * title. Defaults to `0`.
   * @visibility frontend
   */
  priority?: number;
  /**
   * How the group presents its items: `inline` renders them in a
   * collapsible list below the group entry, `flyout` renders them in a
   * submenu next to the sidebar. Defaults to `inline`.
   * @visibility frontend
   */
  variant?: 'inline' | 'flyout';
}

export interface Config {
  app?: {
    /**
     * Sidebar entries defined by deployers without writing a plugin. They are
     * merged with the items and groups contributed through
     * `SidebarItemBlueprint` and `SidebarItemGroupBlueprint` and ordered
     * together with them by `priority`.
     * @visibility frontend
     */
    sidebar?: {
      /**
       * Sidebar items. Items without a `group` render at the top level, items
       * with a `group` render inside the group of that `id`, no matter whether
       * the group comes from this config or from an extension.
       * @visibility frontend
       */
      items?: SidebarItemConfig[];
      /**
       * Sidebar groups that collect the items referencing their `id`.
       * @visibility frontend
       */
      groups?: SidebarItemGroupConfig[];
      /**
       * The same items and groups, split by plugin name. All of them are
       * flattened into one list together with the top-level `items` and
       * `groups`. Meant for the RHDH dynamic plugin configuration, where each
       * plugin ships its own app-config fragment: arrays in Backstage config
       * replace each other instead of merging, so separate per-plugin keys
       * let several plugins contribute entries without overwriting each
       * other. A group declared at the top level overrides a plugin group
       * with the same `id`.
       * @visibility frontend
       */
      plugins?: {
        /**
         * Sidebar entries shipped with the named plugin.
         * @visibility frontend
         */
        [pluginName: string]: {
          /**
           * Sidebar items of this plugin, see `app.sidebar.items`.
           * @visibility frontend
           */
          items?: SidebarItemConfig[];
          /**
           * Sidebar groups of this plugin, see `app.sidebar.groups`.
           * @visibility frontend
           */
          groups?: SidebarItemGroupConfig[];
        };
      };
    };
  };
}
