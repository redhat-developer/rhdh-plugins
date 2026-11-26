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
    branding?: {
      /**
       * Base64 URI for the full logo.
       * If the value is a string it is used as the logo for all themes.
       * You can also specify a theme for each theme-id or variant (light/dark).
       * @deepVisibility frontend
       */
      fullLogo?: string | { [themeIdOrVariant: string]: string };
      /**
       * Base64 URI for the icon logo (collapsed sidebar / compact masthead).
       * If the value is a string it is used as the logo for all themes.
       * You can also specify a theme for each theme-id or variant (light/dark).
       * @deepVisibility frontend
       */
      iconLogo?: string | { [themeIdOrVariant: string]: string };
      /**
       * Fallback width for the full logo.
       * Accepts any valid CSS length (e.g. `'200px'`, `'12rem'`).
       * @visibility frontend
       */
      fullLogoWidth?: string | number;
      /**
       * Theme configuration.
       * @deepVisibility frontend
       */
      theme?: {
        [key: string]: {
          /**
           * Optional key to load different defaults.
           * Fallbacks to the latest 'rhdh' theme if not defined.
           */
          variant?: 'rhdh' | 'backstage';

          /**
           * Light or dark theme.
           * Automatically selects 'dark' if the theme name contains the keyword "dark".
           */
          mode?: 'light' | 'dark';

          /**
           * Palette configuration. Accepts standard Backstage/MUI palette options
           * plus an optional 'rhdh' key for RHDH-specific palette extensions.
           */
          palette?: {
            rhdh?: {
              general?: {
                pageInset?: string;
                pageInsetBackgroundColor?: string;
                disabled?: string;
                disabledBackground?: string;
                paperBackgroundImage?: string;
                paperBorderColor?: string;
                popoverBoxShadow?: string;
                cardBackgroundColor?: string;
                cardBorderColor?: string;
                mainSectionBackgroundColor?: string;
                formControlBackgroundColor?: string;
                sidebarBackgroundColor?: string;
                sidebarDividerColor?: string;
                sidebarItemSelectedBackgroundColor?: string;
                tableTitleColor?: string;
                tableSubtitleColor?: string;
                tableColumnTitleColor?: string;
                tableRowHover?: string;
                tableBorderColor?: string;
                tableBackgroundColor?: string;
                tabsLinkHoverBackgroundColor?: string;
                contrastText?: string;
                appBarBackgroundScheme?: 'light' | 'dark';
                appBarBackgroundColor?: string;
                appBarForegroundColor?: string;
                appBarBackgroundImage?: string;
                starredItemsColor?: string;
              };
              primary?: {
                main?: string;
                focusVisibleBorder?: string;
              };
              secondary?: {
                main?: string;
                focusVisibleBorder?: string;
              };
              cards?: {
                headerTextColor?: string;
                headerBackgroundColor?: string;
                headerBackgroundImage?: string;
              };
            };
            [key: string]: unknown;
          };

          /** Font family for the theme. */
          fontFamily?: string;

          /** Base HTML font size in pixels. */
          htmlFontSize?: number;

          /** Typography configuration for headings and base font settings. */
          typography?: {
            htmlFontSize?: number;
            fontFamily?: string;
            h1?: {
              fontFamily?: string;
              fontSize?: number | string;
              fontWeight?: number;
              marginBottom?: number;
            };
            h2?: {
              fontFamily?: string;
              fontSize?: number | string;
              fontWeight?: number;
              marginBottom?: number;
            };
            h3?: {
              fontFamily?: string;
              fontSize?: number | string;
              fontWeight?: number;
              marginBottom?: number;
            };
            h4?: {
              fontFamily?: string;
              fontSize?: number | string;
              fontWeight?: number;
              marginBottom?: number;
            };
            h5?: {
              fontFamily?: string;
              fontSize?: number | string;
              fontWeight?: number;
              marginBottom?: number;
            };
            h6?: {
              fontFamily?: string;
              fontSize?: number | string;
              fontWeight?: number;
              marginBottom?: number;
            };
          };

          /** Default page theme name. */
          defaultPageTheme?: string;

          /** Page theme configurations keyed by theme name. */
          pageTheme?: {
            [key: string]: {
              backgroundColor?: string | string[];
              colors?: string | string[];
              shape?: string;
              backgroundImage?: string;
              fontColor?: string;
            };
          };

          /** UI component style options. */
          options?: {
            components?: 'rhdh' | 'backstage' | 'mui';
            rippleEffect?: 'on' | 'off';
            paper?: 'patternfly' | 'mui';
            buttons?: 'patternfly' | 'mui';
            inputs?: 'patternfly' | 'mui';
            checkbox?: 'patternfly' | 'mui';
            accordions?: 'patternfly' | 'mui';
            sidebars?: 'patternfly' | 'mui';
            pages?: 'patternfly' | 'mui';
            headers?: 'patternfly' | 'mui';
            toolbars?: 'patternfly' | 'mui';
            dialogs?: 'patternfly' | 'mui';
            cards?: 'patternfly' | 'mui';
            tables?: 'patternfly' | 'mui';
            tabs?: 'patternfly' | 'mui';
            appBar?: 'patternfly' | 'mui';
            breadcrumbs?: 'patternfly' | 'mui';
          };

          /**
           * Structured BUI token overrides mapping to --bui-* CSS custom properties.
           */
          bui?: {
            tokens?: {
              primary?: string;
              warning?: string;
              error?: string;
              success?: string;
              info?: string;
              fontFamily?: string;
              fontFamilyMonospace?: string;
              borderColor?: string;
              backgroundColor?: string;
              foregroundPrimary?: string;
              foregroundSecondary?: string;
              foregroundDisabled?: string;
              focusRing?: string;
              shadow?: string;
            };
          };
        };
      };
      /**
       * Raw CSS string injected as global styles. Use at your own risk --
       * BUI class names may change between Backstage releases.
       * @visibility frontend
       */
      customCSS?: string;
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
        /**
         * HTML anchor target for the link (`_blank` opens in a new tab,
         * `_self` in the same tab). Invalid values are ignored.
         * @visibility frontend
         */
        target?: '_blank' | '_self';
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
            /**
             * HTML anchor target for the link (`_blank` opens in a new tab,
             * `_self` in the same tab). Invalid values are ignored.
             * @visibility frontend
             */
            target?: '_blank' | '_self';
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
}
