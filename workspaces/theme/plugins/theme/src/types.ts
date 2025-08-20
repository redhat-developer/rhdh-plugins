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

import { type UnifiedThemeOptions } from '@backstage/theme';

export type BackstageThemePalette = UnifiedThemeOptions['palette'];

export interface RHDHThemePalette {
  general: {
    pageInset: string;

    disabled: string;
    disabledBackground: string;

    paperBackgroundImage: string;
    paperBorderColor: string;

    popoverBoxShadow: string;

    cardBackgroundColor: string;
    cardBorderColor: string;

    mainSectionBackgroundColor: string;
    formControlBackgroundColor: string;

    sidebarBackgroundColor: string;
    sidebarDividerColor: string;
    sidebarItemSelectedBackgroundColor: string;

    tableTitleColor: string;
    tableSubtitleColor: string;
    tableColumnTitleColor: string;
    tableRowHover: string;
    tableBorderColor: string;
    tableBackgroundColor: string;
    tabsLinkHoverBackgroundColor: string;

    contrastText: string;

    appBarBackgroundScheme: 'light' | 'dark';

    appBarBackgroundColor: string;
    appBarForegroundColor: string;
    appBarBackgroundImage: string;

    starredItemsColor: string;
  };

  primary: {
    main: string;
    focusVisibleBorder: string;
  };

  secondary: {
    main: string;
    focusVisibleBorder: string;
  };

  cards?: {
    headerTextColor: string;
    headerBackgroundColor: string;
    headerBackgroundImage: string;
  };
}

export type ThemeConfigPalette = BackstageThemePalette & {
  rhdh?: RHDHThemePalette;
};

// Aligned with PageTheme
export interface ThemeConfigPageTheme {
  backgroundColor?: string | string[];
  colors?: string | string[];
  shape?: string;
  backgroundImage?: string;
  fontColor?: string;
}

export interface ThemeConfigOptions {
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
}

export interface ThemeConfig {
  /** Optional key to load different defaults. Fallbacks to the latest `rhdh` theme if not defined. */
  variant?: 'rhdh' | 'backstage';

  /** Light or dark theme. Automatically selects `dark` if the theme name contains the keyword "dark". */
  mode?: 'light' | 'dark';

  palette?: ThemeConfigPalette;

  fontFamily?: UnifiedThemeOptions['fontFamily'];

  htmlFontSize?: UnifiedThemeOptions['htmlFontSize'];

  typography?: UnifiedThemeOptions['typography'];

  defaultPageTheme?: string;

  pageTheme?: Record<string, ThemeConfigPageTheme>;

  options?: ThemeConfigOptions;
}

export interface Branding {
  theme?: {
    [key: string]: ThemeConfig;
  };
}

export interface Config {
  app: {
    branding?: Branding;
  };
}
