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

/**
 * New Frontend System dev mode for the Translations plugin.
 */

import '@backstage/cli/asset-types';
// eslint-disable-next-line @backstage/no-ui-css-imports-in-non-frontend
import '@backstage/ui';

import ReactDOM from 'react-dom/client';

import { createApp } from '@backstage/frontend-defaults';
import { createFrontendModule } from '@backstage/frontend-plugin-api';
import {
  Sidebar,
  SidebarDivider,
  SidebarGroup,
  SidebarItem,
  SidebarSpace,
} from '@backstage/core-components';
import { NavContentBlueprint } from '@backstage/plugin-app-react';
import {
  SidebarLanguageSwitcher,
  SidebarSignOutButton,
} from '@backstage/dev-utils';
import ExtensionIcon from '@mui/icons-material/Extension';
import ScienceIcon from '@mui/icons-material/Science';
import { rhdhThemeModule } from '@red-hat-developer-hub/backstage-plugin-theme/alpha';

import translationsPlugin, { translationsApiModule } from '../src';
// eslint-disable-next-line @backstage/no-relative-monorepo-imports
import translationsTestPlugin from '../../translations-test/src';

const devSidebarContent = NavContentBlueprint.make({
  params: {
    component: () => (
      <Sidebar>
        <SidebarGroup label="Menu">
          <SidebarItem
            icon={ExtensionIcon}
            to="/translations"
            text="Translations"
          />
          <SidebarItem
            icon={ScienceIcon}
            to="/translations-test"
            text="Translations Test"
          />
        </SidebarGroup>
        <SidebarSpace />
        <SidebarDivider />
        <SidebarLanguageSwitcher />
        <SidebarSignOutButton />
      </Sidebar>
    ),
  },
});

const devNavModule = createFrontendModule({
  pluginId: 'app',
  extensions: [devSidebarContent],
});

const app = createApp({
  features: [
    devNavModule,
    translationsPlugin,
    translationsApiModule,
    translationsTestPlugin,
    rhdhThemeModule,
  ],
});

const root = app.createRoot();

ReactDOM.createRoot(document.getElementById('root')!).render(root);
