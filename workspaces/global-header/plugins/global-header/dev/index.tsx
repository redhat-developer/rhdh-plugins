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
 * New Frontend System dev mode for the Global Header plugin.
 *
 * Uses createApp() from @backstage/frontend-defaults to exercise the full
 * NFS extension wiring (blueprints, config-driven composition, extension
 * resolution) rather than rendering raw components in isolation.
 */

import '@backstage/cli/asset-types';
// eslint-disable-next-line @backstage/no-ui-css-imports-in-non-frontend
import '@backstage/ui/css/styles.css';

import ReactDOM from 'react-dom/client';

import { createApp } from '@backstage/frontend-defaults';
import {
  ApiBlueprint,
  createFrontendModule,
  createFrontendPlugin,
  PageBlueprint,
} from '@backstage/frontend-plugin-api';
import { NavContentBlueprint } from '@backstage/plugin-app-react';
import {
  Sidebar,
  SidebarGroup,
  SidebarItem,
  SidebarScrollWrapper,
  SidebarSpace,
} from '@backstage/core-components';
import {
  SidebarLanguageSwitcher,
  SidebarSignOutButton,
} from '@backstage/dev-utils';
import { configApiRef } from '@backstage/core-plugin-api';
import {
  catalogApiRef,
  MockStarredEntitiesApi,
  starredEntitiesApiRef,
} from '@backstage/plugin-catalog-react';
import { catalogApiMock } from '@backstage/plugin-catalog-react/testUtils';
import { mockApis } from '@backstage/test-utils';

import Typography from '@mui/material/Typography';

import { rhdhThemeModule } from '@red-hat-developer-hub/backstage-plugin-theme/alpha';

import globalHeaderPlugin, {
  globalHeaderModule,
  globalHeaderTranslationsModule,
} from '../src';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const entities = [
  {
    apiVersion: '1',
    kind: 'Template',
    metadata: {
      name: 'mock-starred-template',
      title: 'Mock Starred Template!',
    },
  },
  {
    apiVersion: '1',
    kind: 'Template',
    metadata: {
      name: 'mock-starred-template-2',
      title: 'Mock Starred Template 2!',
    },
  },
  {
    apiVersion: '1',
    kind: 'Template',
    metadata: {
      name: 'mock-starred-template-3',
      title: 'Mock Starred Template 3!',
    },
  },
  {
    apiVersion: '1',
    kind: 'Template',
    metadata: {
      name: 'mock-starred-template-4',
      title: 'Mock Starred Template 4!',
    },
  },
];

// ---------------------------------------------------------------------------
// Dev override modules (mock APIs)
// ---------------------------------------------------------------------------

const appDevOverrides = createFrontendModule({
  pluginId: 'app',
  extensions: [
    ApiBlueprint.make({
      name: 'config-mock',
      params: defineParams =>
        defineParams({
          api: configApiRef,
          deps: {},
          factory: () =>
            mockApis.config({
              data: {
                app: {
                  support: {
                    url: 'https://access.redhat.com/products/red-hat-developer-hub',
                  },
                },
              },
            }),
        }),
    }),
    ApiBlueprint.make({
      name: 'catalog-mock',
      params: defineParams =>
        defineParams({
          api: catalogApiRef,
          deps: {},
          factory: () => catalogApiMock({ entities }) as any,
        }),
    }),
    ApiBlueprint.make({
      name: 'starred-entities-mock',
      params: defineParams =>
        defineParams({
          api: starredEntitiesApiRef,
          deps: {},
          factory: () => new MockStarredEntitiesApi(),
        }),
    }),
  ],
});

// ---------------------------------------------------------------------------
// Dev sidebar
// ---------------------------------------------------------------------------

const devSidebarContent = NavContentBlueprint.make({
  params: {
    component: ({ items }) => (
      <Sidebar>
        <SidebarScrollWrapper>
          <SidebarGroup label="Menu">
            {items.map((item, index) => (
              <SidebarItem {...item} key={index} />
            ))}
          </SidebarGroup>
        </SidebarScrollWrapper>
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

// ---------------------------------------------------------------------------
// Dev pages (provides sidebar items and content below the header)
// ---------------------------------------------------------------------------

const devPlugin = createFrontendPlugin({
  pluginId: 'dev',
  extensions: [
    PageBlueprint.make({
      params: {
        path: '/',
        title: 'Home',
        loader: async () => (
          <div style={{ padding: 24 }}>
            <Typography variant="h4" gutterBottom>
              Global Header Dev Mode
            </Typography>
            <Typography>
              This page exercises the full NFS extension wiring. The global
              header above is rendered by the <code>globalHeaderModule</code>{' '}
              AppRootWrapper with all default toolbar and menu-item extensions
              resolved via the framework.
            </Typography>
          </div>
        ),
      },
    }),
  ],
});

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

const app = createApp({
  features: [
    globalHeaderPlugin,
    globalHeaderModule,
    globalHeaderTranslationsModule,
    appDevOverrides,
    devPlugin,
    rhdhThemeModule,
    devNavModule,
  ],
});

ReactDOM.createRoot(document.getElementById('root')!).render(app.createRoot());
