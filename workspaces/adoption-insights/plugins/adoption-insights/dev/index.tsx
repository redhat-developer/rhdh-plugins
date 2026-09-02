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
import type { ComponentProps } from 'react';
import ReactDOM from 'react-dom/client';
import { createApp } from '@backstage/frontend-defaults';
import type { ApiRef } from '@backstage/core-plugin-api';
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
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import { rhdhThemeModule } from '@red-hat-developer-hub/backstage-plugin-theme/alpha';

import adoptionInsightsPlugin, {
  adoptionInsightsTranslationsModule,
} from '../src';
import { adoptionInsightsApiRef } from '../src/api';
import { MockAdoptionInsightsApiClient, mockCatalogApi } from './mocks';

const DEFAULT_PATH = '/adoption-insights';

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

function DevSidebar({
  items,
}: {
  items: Array<
    ComponentProps<typeof SidebarItem> & { to?: string; title?: string }
  >;
}) {
  const insightsItem = items.find(item => item.to === DEFAULT_PATH);
  const navItems = insightsItem
    ? [insightsItem, ...items.filter(item => item !== insightsItem)]
    : items;

  return (
    <Sidebar>
      <SidebarScrollWrapper>
        <SidebarGroup label="Adoption Insights">
          {navItems.map((item, index) => (
            <SidebarItem
              {...item}
              key={`${item.to ?? item.title ?? 'nav'}-${index}`}
            />
          ))}
        </SidebarGroup>
      </SidebarScrollWrapper>
      <SidebarSpace />
      <SidebarLanguageSwitcher />
      <SidebarSignOutButton />
    </Sidebar>
  );
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

const devNavModule = createFrontendModule({
  pluginId: 'app',
  extensions: [
    NavContentBlueprint.make({
      params: {
        component: ({ items }) => <DevSidebar items={items} />,
      },
    }),
  ],
});

const app = createApp({
  features: [
    catalogPlugin,
    adoptionInsightsPlugin,
    adoptionInsightsTranslationsModule,
    adoptionInsightsDevModule,
    catalogDevModule,
    rhdhThemeModule,
    devNavModule,
  ],
});

const root = app.createRoot();

if (typeof window !== 'undefined' && window.location.pathname === '/') {
  window.location.pathname = DEFAULT_PATH;
}

ReactDOM.createRoot(document.getElementById('root')!).render(root);
