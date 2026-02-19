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
import { createApp } from '@backstage/frontend-defaults';
import { ThemeBlueprint } from '@backstage/plugin-app-react';
import { createFrontendModule } from '@backstage/frontend-plugin-api';

import catalogPlugin from '@backstage/plugin-catalog/alpha';

import {
  DarkIcon,
  darkThemeProvider,
  LightIcon,
  lightThemeProvider,
} from '@red-hat-developer-hub/backstage-plugin-theme';

import { navModule } from './modules/nav';

// TODO: workaround until our theme package supports the new frontend system.
const rhdhDarkTheme = ThemeBlueprint.make({
  name: 'rhdh-dark',
  params: {
    theme: {
      id: 'rhdh-dark',
      title: 'RHDH Dark Theme',
      variant: 'dark',
      icon: <DarkIcon />,
      Provider: darkThemeProvider,
    },
  },
});

const rhdhLightTheme = ThemeBlueprint.make({
  name: 'rhdh-light',
  params: {
    theme: {
      id: 'rhdh-light',
      title: 'RHDH Light Theme',
      variant: 'light',
      icon: <LightIcon />,
      Provider: lightThemeProvider,
    },
  },
});

export default createApp({
  features: [
    createFrontendModule({
      pluginId: 'app',
      extensions: [rhdhDarkTheme, rhdhLightTheme],
    }),
    catalogPlugin,
    navModule,
  ],
});
