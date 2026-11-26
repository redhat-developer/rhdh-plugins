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

import { PageTheme } from '@backstage/theme';
import { ThemeConfig } from '../types';
import { createPageTheme } from './createPageTheme';

export const createPageThemes = (
  themeConfig: ThemeConfig | undefined,
): Record<string, PageTheme> | undefined => {
  if (!themeConfig?.pageTheme || !Object.keys(themeConfig.pageTheme).length) {
    return undefined;
  }

  const pageThemes: Record<string, PageTheme> = {};

  for (const page in themeConfig.pageTheme) {
    if (Object.hasOwn(themeConfig.pageTheme, page)) {
      pageThemes[page] = createPageTheme(themeConfig.pageTheme[page]);
    }
  }

  return pageThemes;
};
