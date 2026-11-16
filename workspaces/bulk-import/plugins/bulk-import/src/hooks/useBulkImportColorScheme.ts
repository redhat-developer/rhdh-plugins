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

import { appThemeApiRef, useApi } from '@backstage/core-plugin-api';

/**
 * Resolves light vs dark artwork without Material UI theme hooks.
 */
export const useBulkImportColorScheme = (): 'light' | 'dark' => {
  const themeApi = useApi(appThemeApiRef);
  const themeId = themeApi.getActiveThemeId() ?? '';
  const variant = themeApi
    .getInstalledThemes()
    .find(theme => theme.id === themeId)?.variant;

  if (
    variant === 'dark' ||
    themeId.toLowerCase().includes('dark') ||
    themeId.toLowerCase().includes('night')
  ) {
    return 'dark';
  }

  return 'light';
};
