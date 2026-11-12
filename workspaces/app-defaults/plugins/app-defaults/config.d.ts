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

export interface Config {
  app?: {
    /**
     * Branding options shared with the global header masthead.
     * @visibility frontend
     */
    branding?: {
      /**
       * Base64 URI for the full logo.
       * If the value is a string it is used as the logo for all themes.
       * You can also specific a theme for each theme-id or variant (light/dark).
       * @deepVisibility frontend
       */
      fullLogo?: string | { [themeIdOrVariant: string]: string };
      /**
       * Fallback width for the full logo in the global header.
       * Accepts any valid CSS length (e.g. `'200px'`, `'12rem'`).
       * Used only when a `width` prop isn't supplied through the extension configuration.
       * @visibility frontend
       */
      fullLogoWidth?: string | number;
    };

    /**
     * Sidebar entries declared by deployers and merged with entries
     * contributed through SidebarItemBlueprint and SidebarItemGroupBlueprint.
     * @visibility frontend
     */
    sidebar?: {
      /**
       * Show the Settings group in the sidebar. When unset, Settings is shown
       * unless the global header is present (settings then live in the header
       * user menu). Set to `true` to force the sidebar Settings entry on, or
       * `false` to hide it even without a global header.
       * @visibility frontend
       */
      settings?: boolean;
      /**
       * Show the company logo (and its gap) in the sidebar. When unset, the
       * logo is shown unless the global header is present (the masthead
       * already shows the company logo). Set to `true` to force the sidebar
       * logo on, or `false` to hide it even without a global header.
       * @visibility frontend
       */
      logo?: boolean;
      /**
       * Items without a group render at the top level. Other items render
       * inside the group with the matching id.
       * @visibility frontend
       */
      items?: {
        /**
         * Text shown next to the icon. Translated when it matches a known page
         * title, otherwise shown as-is.
         * @visibility frontend
         */
        title: string;
        /**
         * Required link target, either an app-internal path such as /catalog
         * or an absolute URL. Config items cannot carry an onClick handler.
         * @visibility frontend
         */
        to: string;
        /**
         * Key of a system icon registered via IconBundleBlueprint, such as
         * home, category, or school. Unknown keys use a generic icon.
         * @visibility frontend
         */
        icon?: string;
        /**
         * Higher values render first; ties are broken by title. Defaults to 0.
         * @visibility frontend
         */
        priority?: number;
        /**
         * Id of the group this item belongs to. Items without a group, or
         * whose group does not exist, render at the top level.
         * @visibility frontend
         */
        group?: string;
        /**
         * Only render the item when the app has a route matching its target.
         * Useful for links to optional plugin pages.
         * @visibility frontend
         */
        requiresRoute?: boolean;
      }[];
      /**
       * Groups collect the items that reference their id.
       * @visibility frontend
       */
      groups?: {
        /**
         * Identifier referenced by an item's group. Using the id of a group
         * contributed by an extension overrides that group.
         * @visibility frontend
         */
        id: string;
        /**
         * Text shown next to the icon.
         * @visibility frontend
         */
        title: string;
        /**
         * Key of a system icon registered via IconBundleBlueprint. Unknown
         * keys use a generic icon.
         * @visibility frontend
         */
        icon?: string;
        /**
         * Optional link target for the group entry itself.
         * @visibility frontend
         */
        to?: string;
        /**
         * Higher values render first; ties are broken by title. Defaults to 0.
         * @visibility frontend
         */
        priority?: number;
        /**
         * inline renders a collapsible list below the group entry; flyout
         * renders a submenu beside the sidebar. Defaults to inline.
         * @visibility frontend
         */
        variant?: 'inline' | 'flyout';
      }[];
      /**
       * Plugin-specific items and groups. This supports dynamic plugin
       * config, where separate app-config fragments would otherwise replace
       * array values. Top-level groups override plugin groups with the same id.
       * @visibility frontend
       */
      plugins?: {
        [pluginName: string]: {
          /**
           * Items contributed by this plugin. Items without a group render at
           * the top level; others render inside the matching group.
           * @visibility frontend
           */
          items?: {
            /**
             * Text shown next to the icon. Translated when it matches a known
             * page title, otherwise shown as-is.
             * @visibility frontend
             */
            title: string;
            /**
             * Required link target, either an app-internal path such as
             * /catalog or an absolute URL. Config items cannot carry an
             * onClick handler.
             * @visibility frontend
             */
            to: string;
            /**
             * Key of a system icon registered via IconBundleBlueprint, such
             * as home, category, or school. Unknown keys use a generic icon.
             * @visibility frontend
             */
            icon?: string;
            /**
             * Higher values render first; ties are broken by title. Defaults
             * to 0.
             * @visibility frontend
             */
            priority?: number;
            /**
             * Id of the group this item belongs to. Items without a group, or
             * whose group does not exist, render at the top level.
             * @visibility frontend
             */
            group?: string;
            /**
             * Only render the item when the app has a route matching its
             * target. Useful for links to optional plugin pages.
             * @visibility frontend
             */
            requiresRoute?: boolean;
          }[];
          /**
           * Groups collect the items that reference their id.
           * @visibility frontend
           */
          groups?: {
            /**
             * Identifier referenced by an item's group. Using the id of a
             * group contributed by an extension overrides that group.
             * @visibility frontend
             */
            id: string;
            /**
             * Text shown next to the icon.
             * @visibility frontend
             */
            title: string;
            /**
             * Key of a system icon registered via IconBundleBlueprint.
             * Unknown keys use a generic icon.
             * @visibility frontend
             */
            icon?: string;
            /**
             * Optional link target for the group entry itself.
             * @visibility frontend
             */
            to?: string;
            /**
             * Higher values render first; ties are broken by title. Defaults
             * to 0.
             * @visibility frontend
             */
            priority?: number;
            /**
             * inline renders a collapsible list below the group entry; flyout
             * renders a submenu beside the sidebar. Defaults to inline.
             * @visibility frontend
             */
            variant?: 'inline' | 'flyout';
          }[];
        };
      };
    };
  };

  globalHeader?: {
    /**
     * Simple icon-button toolbar components that deployers can add without
     * writing a plugin. Each entry renders a clickable icon in the header bar.
     * @visibility frontend
     */
    components?: Array<{
      /** @visibility frontend */
      title: string;
      /** @visibility frontend */
      titleKey?: string;
      /** @visibility frontend */
      icon: string;
      /** @visibility frontend */
      link: string;
      /** @visibility frontend */
      tooltip?: string;
      /** @visibility frontend */
      priority?: number;
    }>;
    /**
     * Simple link menu items that deployers can add without writing a plugin.
     * Each item is injected into the dropdown identified by `target`.
     * @visibility frontend
     */
    menuItems?: Array<{
      /** @visibility frontend */
      target: string;
      /** @visibility frontend */
      title: string;
      /** @visibility frontend */
      titleKey?: string;
      /** @visibility frontend */
      icon?: string;
      /** @visibility frontend */
      link: string;
      /** @visibility frontend */
      sectionLabel?: string;
      /** @visibility frontend */
      sectionLink?: string;
      /** @visibility frontend */
      sectionLinkLabel?: string;
      /** @visibility frontend */
      priority?: number;
    }>;
  };
}
