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

import { useMemo } from 'react';
import { ConfigApi, configApiRef, useApi } from '@backstage/core-plugin-api';
import { ThemeConfig } from '../types';

export const useThemeConfig = (themeName: string): ThemeConfig => {
  let configApi: ConfigApi | undefined = undefined;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    configApi = useApi<ConfigApi>(configApiRef); // NOSONAR
  } catch (err) {
    // useApi won't be initialized initially in createApp theme provider, and will get updated later
  }
  return useMemo(() => {
    if (!configApi) {
      return {
        mode: themeName.includes('dark') ? 'dark' : 'light',
      };
    }
    const themeConfig =
      configApi.getOptional<ThemeConfig>(`app.branding.theme.${themeName}`) ??
      {};
    if (!themeConfig.mode) {
      themeConfig.mode = themeName.includes('dark') ? 'dark' : 'light';
    }

    if (Array.isArray(themeConfig?.pageTheme?.default?.fontColor)) {
      themeConfig.pageTheme.default.fontColor =
        themeConfig.pageTheme.default.fontColor[0];
    }

    return themeConfig;
  }, [themeName, configApi]);
};
