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
import { useTheme } from '@mui/material/styles';
import type { ThemeConfig } from '@red-hat-developer-hub/backstage-plugin-theme';

/**
 * Get the app bar background scheme from the theme. Defaults to light if not set.
 */
export const useAppBarBackgroundScheme = () => {
  const theme = useTheme();
  const appBarBackgroundScheme = (theme as ThemeConfig)?.palette?.rhdh?.general
    ?.appBarBackgroundScheme;

  // default to 'dark' because Backstage's default theme is always dark
  return appBarBackgroundScheme ?? 'dark';
};
