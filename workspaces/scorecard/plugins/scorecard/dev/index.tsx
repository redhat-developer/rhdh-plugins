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
 * New Frontend System dev mode for the Scorecard plugin.
 */

import type { JSX } from 'react';

import '@backstage/cli/asset-types';
// eslint-disable-next-line @backstage/no-ui-css-imports-in-non-frontend
import '@backstage/ui/css/styles.css';

import ReactDOM from 'react-dom/client';

import { createApp } from '@backstage/frontend-defaults';
import {
  ApiBlueprint,
  createApiRef,
  createFrontendModule,
} from '@backstage/frontend-plugin-api';
import {
  Sidebar,
  SidebarGroup,
  SidebarItem,
  SidebarScrollWrapper,
  SidebarSpace,
} from '@backstage/core-components';
import { NavContentBlueprint } from '@backstage/plugin-app-react';
import {
  SidebarLanguageSwitcher,
  SidebarSignOutButton,
} from '@backstage/dev-utils';

import catalogPlugin from '@backstage/plugin-catalog/alpha';
import userSettingsPlugin from '@backstage/plugin-user-settings/alpha';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { rhdhThemeModule } from '@red-hat-developer-hub/backstage-plugin-theme/alpha';

import scorecardPlugin, {
  scorecardCatalogModule,
  scorecardTranslationsModule,
} from '../src/alpha';
import { scorecardApiRef } from '../src/api';

import { MockScorecardApi, mockCatalogApi } from './mocks';

const pluginHeaderActionsApiRef = createApiRef<{
  getPluginHeaderActions(pluginId: string): Array<JSX.Element | null>;
}>({ id: 'core.plugin-header-actions' });

const appDevModule = createFrontendModule({
  pluginId: 'app',
  extensions: [
    ApiBlueprint.make({
      name: 'plugin-header-actions-mock',
      params: defineParams =>
        defineParams({
          api: pluginHeaderActionsApiRef,
          deps: {},
          factory: () => ({
            getPluginHeaderActions: (_pluginId: string) => [],
          }),
        }),
    }),
  ],
});

const catalogDevModule = createFrontendModule({
  pluginId: 'catalog',
  extensions: [
    ApiBlueprint.make({
      name: 'catalog',
      params: defineParams =>
        defineParams({
          api: catalogApiRef,
          deps: {},
          factory: () => mockCatalogApi,
        }),
    }),
  ],
});

const scorecardDevModule = createFrontendModule({
  pluginId: 'app',
  extensions: [
    ApiBlueprint.make({
      name: 'scorecard',
      params: defineParams =>
        defineParams({
          api: scorecardApiRef,
          deps: {},
          factory: () => new MockScorecardApi(),
        }),
    }),
  ],
});

const devSidebarContent = NavContentBlueprint.make({
  params: {
    component: ({ items }) => (
      <Sidebar>
        <SidebarGroup label="Menu">
          <SidebarScrollWrapper>
            {items.map((item, index) => (
              <SidebarItem {...item} key={index} />
            ))}
          </SidebarScrollWrapper>
        </SidebarGroup>
        <SidebarSpace />
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
    catalogPlugin,
    scorecardPlugin,
    scorecardCatalogModule,
    scorecardTranslationsModule,
    appDevModule,
    catalogDevModule,
    scorecardDevModule,
    rhdhThemeModule,
    userSettingsPlugin,
  ],
});

const root = app.createRoot();

ReactDOM.createRoot(document.getElementById('root')!).render(root);
