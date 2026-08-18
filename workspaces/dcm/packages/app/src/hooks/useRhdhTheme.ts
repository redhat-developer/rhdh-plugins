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

import type { AppTheme } from '@backstage/core-plugin-api';
import type { ComponentType } from 'react';
import { getThemes } from '@red-hat-developer-hub/backstage-plugin-theme';
import {
  RhdhLogoFull,
  RhdhLogoIcon,
} from '@red-hat-developer-hub/backstage-plugin-dcm';

type RhdhThemeOptions = {
  RhdhLogoFull: ComponentType;
  RhdhLogoIcon: ComponentType;
  themes: AppTheme[];
} | null;

/**
 * Change this value to `true` if you want to use the RHDH theme.
 */
const ENABLE_RHDH_THEME = true;

export function useRhdhTheme(): RhdhThemeOptions {
  return ENABLE_RHDH_THEME
    ? {
        RhdhLogoFull,
        RhdhLogoIcon,
        get themes() {
          return getThemes();
        },
      }
    : null;
}
