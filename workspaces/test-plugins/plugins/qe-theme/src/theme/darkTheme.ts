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

import { createUnifiedTheme, palettes } from '@backstage/theme';
import { createPagesDarkTheme } from './pageDarkTheme';

/**
 * Definition for the dark palette variant
 */
const palette = {
  ...palettes.dark,
  navigation: {
    background: '#222427',
    indicator: 'rgb(244, 238, 169)',
    color: '#ffffff',
    selectedColor: '#ffffff',
    navItem: {
      hoverBackground: '#3c3f42',
    },
    submenu: {
      background: '#222427',
    },
  },
  primary: {
    main: '#ab75cf',
  },
} as const;

/**
 * Theme instance
 */
export const darkTheme = createUnifiedTheme({
  palette,
  defaultPageTheme: 'home',
  pageTheme: createPagesDarkTheme(),
});
