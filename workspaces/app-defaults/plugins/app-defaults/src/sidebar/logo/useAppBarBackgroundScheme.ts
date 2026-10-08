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

/** Subset of the RHDH theme palette this hook reads. */
interface RhdhPalette {
  rhdh?: {
    general?: {
      appBarBackgroundScheme?: 'light' | 'dark';
    };
  };
}

/**
 * Background scheme of the app bar and sidebar from the RHDH theme
 * (`theme.palette.rhdh.general.appBarBackgroundScheme`). Defaults to `dark`
 * because Backstage's default theme uses a dark sidebar. Mirrors the hook of
 * the same name in the global header.
 */
export const useAppBarBackgroundScheme = (): 'light' | 'dark' => {
  const theme = useTheme();
  const palette = theme.palette as typeof theme.palette & RhdhPalette;
  return palette.rhdh?.general?.appBarBackgroundScheme ?? 'dark';
};
