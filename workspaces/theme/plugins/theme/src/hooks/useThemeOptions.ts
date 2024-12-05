/*
 * Copyright 2024 The Backstage Authors
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
import React from 'react';
import { type UnifiedThemeOptions } from '@backstage/theme';
import type { ThemeConfig } from '../types';
import * as backstage from '../backstage';
import * as rhdh from '../rhdh';
import { migrateThemeConfig } from '../utils/migrateTheme';
import { mergeUnifiedThemeOptions } from '../utils/mergeTheme';
import { createPageThemes } from '../utils/createPageThemes';
import { createComponents } from '../utils/createComponents';

/** Creates a memorized Backstage UnifiedThemeOptions based on the given ThemeConfig. */
export const useThemeOptions = (
  themeConfig: ThemeConfig,
): UnifiedThemeOptions => {
  const theme = React.useMemo<UnifiedThemeOptions>(() => {
    const mode = themeConfig.mode ?? 'light';
    const variant = themeConfig.variant ?? 'rhdh';

    let defaultThemeConfig: ThemeConfig;
    if (variant === 'backstage') {
      defaultThemeConfig = backstage.getDefaultThemeConfig(mode);
    } else {
      defaultThemeConfig = rhdh.getDefaultThemeConfig(mode);
    }

    const migratedThemeConfig = migrateThemeConfig(themeConfig);
    const mergedThemeConfig = mergeUnifiedThemeOptions(
      defaultThemeConfig,
      migratedThemeConfig,
    );

    const unifiedThemeOption: UnifiedThemeOptions = {
      palette: mergedThemeConfig.palette as UnifiedThemeOptions['palette'],
      defaultPageTheme: mergedThemeConfig.defaultPageTheme,
      fontFamily: mergedThemeConfig.fontFamily,
      htmlFontSize: mergedThemeConfig.htmlFontSize,
      typography: mergedThemeConfig.typography,
    };

    unifiedThemeOption.pageTheme = createPageThemes(mergedThemeConfig);

    if (variant !== 'backstage') {
      unifiedThemeOption.components = createComponents(mergedThemeConfig);
    }

    return unifiedThemeOption;
  }, [themeConfig]);
  return theme;
};
