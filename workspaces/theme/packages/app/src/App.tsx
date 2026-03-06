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

import { Navigate, Route } from 'react-router-dom';
import { ApiExplorerPage } from '@backstage/plugin-api-docs';
import { CatalogEntityPage, CatalogIndexPage } from '@backstage/plugin-catalog';
import { CatalogImportPage } from '@backstage/plugin-catalog-import';
import { ScaffolderPage } from '@backstage/plugin-scaffolder';
import { SearchPage } from '@backstage/plugin-search';
import {
  TechDocsIndexPage,
  TechDocsReaderPage,
} from '@backstage/plugin-techdocs';
import { TechDocsAddons } from '@backstage/plugin-techdocs-react';
import { ReportIssue } from '@backstage/plugin-techdocs-module-addons-contrib';
import { UserSettingsPage } from '@backstage/plugin-user-settings';
import { entityPage } from './components/catalog/EntityPage';
import { searchPage } from './components/search/SearchPage';

import { AlertDisplay, OAuthRequestDialog } from '@backstage/core-components';
import { createApp } from '@backstage/frontend-defaults';
import { convertLegacyApp } from '@backstage/core-compat-api';
import {
  createFrontendModule,
  PageBlueprint,
  type FrontendFeature,
  type FrontendFeatureLoader,
} from '@backstage/frontend-plugin-api';
import { ThemeBlueprint } from '@backstage/plugin-app-react';
import { AppRouter, FlatRoutes } from '@backstage/core-app-api';
import { CatalogGraphPage } from '@backstage/plugin-catalog-graph';
import { BCCTestPageComponent } from '@red-hat-developer-hub/backstage-plugin-bcc-test';
import { BUITestPageComponent } from '@red-hat-developer-hub/backstage-plugin-bui-test';
import { MUI4TestPageComponent } from '@red-hat-developer-hub/backstage-plugin-mui4-test';
import { MUI5TestPageComponent } from '@red-hat-developer-hub/backstage-plugin-mui5-test';
import { getAllThemes } from '@red-hat-developer-hub/backstage-plugin-theme';
import { navModule } from './modules';

/**
 * RHDH themes as NFS extensions (ThemeBlueprint).
 * Only the app can register ThemeBlueprint; we use the same theme definitions
 * from the theme plugin (getAllThemes()) so behavior matches the legacy app.
 */
const rhdhThemeExtensions = getAllThemes().map(appTheme =>
  ThemeBlueprint.make({
    name: appTheme.id,
    params: {
      theme: {
        id: appTheme.id,
        title: appTheme.title,
        variant: appTheme.variant,
        icon: appTheme.icon,
        Provider: appTheme.Provider,
      },
    },
  }),
);

const rhdhThemeModule = createFrontendModule({
  pluginId: 'app',
  extensions: rhdhThemeExtensions,
});

const homeRouteModule = createFrontendModule({
  pluginId: 'app',
  extensions: [
    PageBlueprint.make({
      name: 'catalog-alias',
      params: {
        path: '/catalog',
        loader: async () => <Navigate to="/" replace />,
      },
    }),
  ],
});

const testPagesModule = createFrontendModule({
  pluginId: 'app',
  extensions: [
    PageBlueprint.make({
      name: 'bcc-tests-direct',
      params: {
        path: '/bcc-tests',
        loader: async () => <BCCTestPageComponent />,
      },
    }),
    PageBlueprint.make({
      name: 'bui-tests-direct',
      params: {
        path: '/bui-tests',
        loader: async () => <BUITestPageComponent />,
      },
    }),
    PageBlueprint.make({
      name: 'mui4-tests-direct',
      params: {
        path: '/mui4-tests',
        loader: async () => <MUI4TestPageComponent />,
      },
    }),
    PageBlueprint.make({
      name: 'mui5-tests-direct',
      params: {
        path: '/mui5-tests',
        loader: async () => <MUI5TestPageComponent />,
      },
    }),
  ],
});

// Routes are parsed by convertLegacyApp to register NFS page extensions. convertLegacyApp
// requires a "root" element that wraps FlatRoutes (it looks for AppRouter -> root -> FlatRoutes).
const legacyRootElement = (
  <>
    <AlertDisplay />
    <OAuthRequestDialog />
    <AppRouter>
      <div>
        <FlatRoutes>
          <Route path="/catalog" element={<CatalogIndexPage />} />
          <Route
            path="/catalog/:namespace/:kind/:name"
            element={<CatalogEntityPage />}
          >
            {entityPage}
          </Route>
          <Route path="/docs" element={<TechDocsIndexPage />} />
          <Route
            path="/docs/:namespace/:kind/:name/*"
            element={<TechDocsReaderPage />}
          >
            <TechDocsAddons>
              <ReportIssue />
            </TechDocsAddons>
          </Route>
          <Route path="/create" element={<ScaffolderPage />} />
          <Route path="/api-docs" element={<ApiExplorerPage />} />
          {/* Top-level element must be a plugin component for convertLegacyApp */}
          <Route path="/catalog-import" element={<CatalogImportPage />} />
          <Route path="/search" element={<SearchPage />}>
            {searchPage}
          </Route>
          <Route path="/settings" element={<UserSettingsPage />} />
          <Route path="/catalog-graph" element={<CatalogGraphPage />} />
        </FlatRoutes>
      </div>
    </AppRouter>
  </>
);

const app = createApp({
  features: [
    rhdhThemeModule,
    ...(convertLegacyApp(legacyRootElement) as unknown as (
      | FrontendFeature
      | FrontendFeatureLoader
    )[]),
    homeRouteModule,
    navModule,
    testPagesModule,
  ],
});

export default app.createRoot();
