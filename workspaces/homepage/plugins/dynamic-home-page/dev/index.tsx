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
 * New Frontend System dev mode for the Dynamic Home Page plugin
 */

import '@backstage/cli/asset-types';
import '@backstage/ui/css/styles.css';
import ReactDOM from 'react-dom/client';
import { createApp } from '@backstage/frontend-defaults';
import {
  ApiBlueprint,
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
import searchPlugin from '@backstage/plugin-search/alpha';
import {
  catalogApiRef,
  starredEntitiesApiRef,
} from '@backstage/plugin-catalog-react';
import {
  homePageModule,
  homepageTranslationsModule,
} from '@red-hat-developer-hub/backstage-plugin-dynamic-home-page/alpha';
import { rhdhThemeModule } from '@red-hat-developer-hub/backstage-plugin-theme/alpha';
import { quickAccessApiRef } from '../src/api';
import { visitsApiRef } from '@backstage/plugin-home';
import {
  MockQuickAccessApi,
  MockVisitsApi,
  mockCatalogApi,
  mockSearchApi,
  mockStarredEntitiesApi,
} from './mocks';
import { searchApiRef } from '@backstage/plugin-search-react';

const homepageApiMocksModule = createFrontendModule({
  pluginId: 'home',
  extensions: [
    ApiBlueprint.make({
      name: 'quickaccess',
      params: defineParams =>
        defineParams({
          api: quickAccessApiRef,
          deps: {},
          factory: () => new MockQuickAccessApi(),
        }),
    }),
    ApiBlueprint.make({
      name: 'visits',
      params: defineParams =>
        defineParams({
          api: visitsApiRef,
          deps: {},
          factory: () => new MockVisitsApi(),
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
    ApiBlueprint.make({
      name: 'starred-entities',
      params: defineParams =>
        defineParams({
          api: starredEntitiesApiRef,
          deps: {},
          factory: () => mockStarredEntitiesApi,
        }),
    }),
  ],
});

const searchDevModule = createFrontendModule({
  pluginId: 'search',
  extensions: [
    ApiBlueprint.make({
      name: 'search',
      params: defineParams =>
        defineParams({
          api: searchApiRef,
          deps: {},
          factory: () => mockSearchApi,
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
    searchPlugin,
    homePageModule,
    homepageTranslationsModule,
    homepageApiMocksModule,
    catalogDevModule,
    searchDevModule,
    rhdhThemeModule,
  ],
});

const root = app.createRoot();

ReactDOM.createRoot(document.getElementById('root')!).render(root);
