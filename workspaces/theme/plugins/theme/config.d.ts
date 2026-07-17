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


// Types are inlined to avoid importing from the package entry point,
// which pulls in @mui/material types that break ts-json-schema-generator
// (typeof window.matchMedia has no value declaration).
// Keep in sync with ThemeConfig and related types in src/types.ts.

export interface Config {
  app: {
    branding?: {
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
        };
      };
    };
  };
}
