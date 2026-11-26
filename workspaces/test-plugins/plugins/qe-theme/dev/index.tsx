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

import { createDevApp } from '@backstage/dev-utils';
import type { AppTheme } from '@backstage/core-plugin-api';
import DarkIcon from '@mui/icons-material/Brightness2';
import LightIcon from '@mui/icons-material/WbSunny';
import { qeThemePlugin } from '../src/plugin';
import { darkThemeProvider, lightThemeProvider } from '../src/theme/providers';

const qeThemes: AppTheme[] = [
  {
    id: 'qe-light',
    title: 'QE Light',
    variant: 'light',
    icon: <LightIcon />,
    Provider: lightThemeProvider,
  },
  {
    id: 'qe-dark',
    title: 'QE Dark',
    variant: 'dark',
    icon: <DarkIcon />,
    Provider: darkThemeProvider,
  },
];

createDevApp()
  .registerPlugin(qeThemePlugin)
  .addThemes(qeThemes)
  .addPage({
    element: (
      <div style={{ padding: 24 }}>
        <h1>QE Theme</h1>
        <p>
          Use the sidebar theme switcher to preview the QE light and dark
          themes.
        </p>
      </div>
    ),
    title: 'QE Theme',
    path: '/qe-theme',
  })
  .render();
