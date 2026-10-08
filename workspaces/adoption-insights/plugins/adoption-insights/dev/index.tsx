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
 * New Frontend System dev mode for the Adoption Insights plugin.
 */

import '@backstage/cli/asset-types';
// eslint-disable-next-line @backstage/no-ui-css-imports-in-non-frontend
import '@backstage/ui/css/styles.css';
import ReactDOM from 'react-dom/client';
import { createApp } from '@backstage/frontend-defaults';
import type { ApiRef } from '@backstage/core-plugin-api';
import {
  ApiBlueprint,
  createFrontendModule,
} from '@backstage/frontend-plugin-api';
import {
  SidebarLanguageSwitcher,
  SidebarSignOutButton,
} from '@backstage/dev-utils';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import { permissionApiRef } from '@backstage/plugin-permission-react';

import rhdhAppDefaults from '@red-hat-developer-hub/backstage-plugin-app-defaults';
import rhdhThemeModule from '@red-hat-developer-hub/backstage-plugin-theme';

import adoptionInsightsPlugin, {
  adoptionInsightsTranslationsModule,
} from '../src';
import { adoptionInsightsApiRef } from '../src/api';
import { MockAdoptionInsightsApiClient, mockCatalogApi } from './mocks';
import { SidebarElementBlueprint } from '@red-hat-developer-hub/backstage-plugin-app-react';

const DEFAULT_PATH = '/adoption-insights';

function isPermissionDeniedPath(pathname: string): boolean {
  return pathname.includes('permission-denied');
}

function makeMockApi<T>(name: string, api: ApiRef<T>, factory: () => T) {
  return ApiBlueprint.make({
    name,
    params: defineParams =>
      defineParams({
        api,
        deps: {},
        factory,
      }),
  });
}

const adoptionInsightsDevModule = createFrontendModule({
  pluginId: 'adoption-insights',
  extensions: [
    makeMockApi(
      'adoption-insights-mock',
      adoptionInsightsApiRef,
      () => new MockAdoptionInsightsApiClient(),
    ),
  ],
});

const catalogDevModule = createFrontendModule({
  pluginId: 'catalog',
  extensions: [makeMockApi('catalog', catalogApiRef, () => mockCatalogApi)],
});

const appModule = createFrontendModule({
  pluginId: 'app',
  extensions: [
    // Extension `if` predicates need a permission API. Mock it locally so
    // isolated `yarn start` still shows the page; open /permission-denied to
    // preview hidden nav for unauthorized users.
    ApiBlueprint.make({
      name: 'permission',
      params: defineParams =>
        defineParams({
          api: permissionApiRef,
          deps: {},
          factory: () => ({
            authorize: async () =>
              isPermissionDeniedPath(window.location.pathname)
                ? { result: 'DENY' as const }
                : { result: 'ALLOW' as const },
          }),
        }),
    }),
    SidebarElementBlueprint.make({
      name: 'SidebarLanguageSwitcher',
      params: {
        component: SidebarLanguageSwitcher,
        priority: -10000,
      },
    }),
    SidebarElementBlueprint.make({
      name: 'SidebarSignOutButton',
      params: {
        component: SidebarSignOutButton,
        priority: -10001,
      },
    }),
  ],
});

const app = createApp({
  features: [
    rhdhAppDefaults,
    rhdhThemeModule,
    appModule,
    catalogPlugin,
    adoptionInsightsPlugin,
    adoptionInsightsTranslationsModule,
    adoptionInsightsDevModule,
    catalogDevModule,
  ],
});

const root = app.createRoot();

if (typeof window !== 'undefined' && window.location.pathname === '/') {
  window.location.pathname = DEFAULT_PATH;
}

ReactDOM.createRoot(document.getElementById('root')!).render(root);
