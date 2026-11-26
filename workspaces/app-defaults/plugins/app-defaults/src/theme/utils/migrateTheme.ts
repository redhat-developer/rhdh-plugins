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

import type { BackstagePaletteAdditions } from '@backstage/theme';
import type { SimplePaletteColorOptions } from '@mui/material/styles';
import type { ThemeConfig } from '../types';

export interface DeprecatedRHDH10to12ThemeColors {
  /**
   * primaryColor Configuration for the instance
   * The following formats are supported: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla(), color()
   */
  primaryColor?: string;
  /**
   * Header Theme color Configuration for the instance
   * The following formats are supported: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla(), color()
   */
  headerColor1?: string;
  /**
   * Header Theme color Configuration for the instance
   * The following formats are supported: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla(), color()
   */
  headerColor2?: string;
  /**
   * Navigation Side Bar Indicator color Configuration for the instance
   * The following formats are supported: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla(), color()
   */
  navigationIndicatorColor?: string;
}

function isObject(
  objectOrValue: unknown,
): objectOrValue is Record<string, unknown> {
  return typeof objectOrValue === 'object' && !Array.isArray(objectOrValue);
}

export const migrateThemeConfig = (
  themeConfig: ThemeConfig & DeprecatedRHDH10to12ThemeColors,
): ThemeConfig => {
  if (!themeConfig) {
    return { palette: {} };
  }

  // Drop deprecated values from the root level!
  const migrated: ThemeConfig = {
    palette: themeConfig.palette ?? {},
    defaultPageTheme: themeConfig.defaultPageTheme,
    pageTheme: themeConfig.pageTheme,
    fontFamily: themeConfig.fontFamily,
    htmlFontSize: themeConfig.htmlFontSize,
    typography: themeConfig.typography,
    options: themeConfig.options,
  };

  if (themeConfig.primaryColor) {
    // eslint-disable-next-line no-console
    console.warn(
      '[deprecated] Automatically migrate theme configuration from `primaryColor` to `palette.primary.main`',
    );
    if (isObject(migrated.palette?.primary)) {
      if (!(migrated.palette.primary as SimplePaletteColorOptions).main) {
        (migrated.palette.primary as SimplePaletteColorOptions).main =
          themeConfig.primaryColor;
      }
    } else if (migrated.palette) {
      migrated.palette.primary = { main: themeConfig.primaryColor };
    }
  }

  if (themeConfig.navigationIndicatorColor) {
    // eslint-disable-next-line no-console
    console.warn(
      '[deprecated] Automatically migrate theme configuration from `navigationIndicatorColor` to `palette.navigation.indicator`',
    );
    if (isObject(migrated.palette?.navigation)) {
      if (!migrated.palette.navigation.indicator) {
        migrated.palette.navigation.indicator =
          themeConfig.navigationIndicatorColor;
      }
    } else if (migrated.palette) {
      migrated.palette.navigation = {
        indicator: themeConfig.navigationIndicatorColor,
      } as BackstagePaletteAdditions['navigation'];
    }
  }

  if (themeConfig.headerColor1) {
    if (themeConfig.pageTheme) {
      // eslint-disable-next-line no-console
      console.warn(
        '[deprecated] Ignore theme configuration `headerColor1` and `headerColor2` because `pageTheme` is defined!',
      );
    } else {
      // eslint-disable-next-line no-console
      console.warn(
        '[deprecated] Automatically migrate theme configuration from `headerColor1` and `headerColor2` to `pageTheme.home.backgroundColor`',
      );
      migrated.defaultPageTheme = 'home';
      migrated.pageTheme = {
        home: {
          backgroundColor: !themeConfig.headerColor2
            ? themeConfig.headerColor1
            : [themeConfig.headerColor1, themeConfig.headerColor2],
        },
      };
    }
  }

  return migrated;
};
