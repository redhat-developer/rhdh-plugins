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

import { Route } from 'react-router-dom';
import { apiDocsPlugin, ApiExplorerPage } from '@backstage/plugin-api-docs';
import {
  CatalogEntityPage,
  CatalogIndexPage,
  catalogPlugin,
} from '@backstage/plugin-catalog';
import {
  CatalogImportPage,
  catalogImportPlugin,
} from '@backstage/plugin-catalog-import';
import { ScaffolderPage, scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { orgPlugin } from '@backstage/plugin-org';
import { SearchPage } from '@backstage/plugin-search';
import {
  TechDocsIndexPage,
  techdocsPlugin,
  TechDocsReaderPage,
} from '@backstage/plugin-techdocs';
import { TechDocsAddons } from '@backstage/plugin-techdocs-react';
import { ReportIssue } from '@backstage/plugin-techdocs-module-addons-contrib';
import { UserSettingsPage } from '@backstage/plugin-user-settings';
import { getThemes } from '@red-hat-developer-hub/backstage-plugin-theme';
import { apis } from './apis';
import { entityPage } from './components/catalog/EntityPage';
import { searchPage } from './components/search/SearchPage';
import { Root } from './components/Root';

import {
  AlertDisplay,
  IdentityProviders,
  OAuthRequestDialog,
  SignInPage,
} from '@backstage/core-components';
import { createApp } from '@backstage/app-defaults';
import { AppRouter, FlatRoutes } from '@backstage/core-app-api';
import { CatalogGraphPage } from '@backstage/plugin-catalog-graph';
import { RequirePermission } from '@backstage/plugin-permission-react';
import { catalogEntityCreatePermission } from '@backstage/plugin-catalog-common/alpha';
import { githubAuthApiRef } from '@backstage/core-plugin-api';
import { ScalprumContext, ScalprumState } from '@scalprum/react-core';
import { PluginStore } from '@openshift/dynamic-plugin-sdk';
import {
  DynamicHomePage,
  OnboardingSection,
  EntitySection,
  TemplateSection,
  VisitListener,
  HomePageCardMountPoint,
} from '@red-hat-developer-hub/backstage-plugin-dynamic-home-page';

const identityProviders: IdentityProviders = [
  'guest',
  {
    id: 'github-auth-provider',
    title: 'GitHub',
    message: 'Sign in using GitHub',
    apiRef: githubAuthApiRef,
  },
];

const app = createApp({
  apis,
  themes: getThemes(),
  bindRoutes({ bind }) {
    bind(catalogPlugin.externalRoutes, {
      createComponent: scaffolderPlugin.routes.root,
      viewTechDoc: techdocsPlugin.routes.docRoot,
      createFromTemplate: scaffolderPlugin.routes.selectedTemplate,
    });
    bind(apiDocsPlugin.externalRoutes, {
      registerApi: catalogImportPlugin.routes.importPage,
    });
    bind(scaffolderPlugin.externalRoutes, {
      registerComponent: catalogImportPlugin.routes.importPage,
      viewTechDoc: techdocsPlugin.routes.docRoot,
    });
    bind(orgPlugin.externalRoutes, {
      catalogIndex: catalogPlugin.routes.catalogIndex,
    });
  },
  components: {
    SignInPage: props => (
      <SignInPage {...props} auto providers={identityProviders} />
    ),
  },
});

const mountPoints: HomePageCardMountPoint[] = [
  {
    Component: OnboardingSection,
    config: {
      layouts: {
        xl: { w: 12, h: 5 },
        lg: { w: 12, h: 5 },
        md: { w: 12, h: 5 },
        sm: { w: 12, h: 5 },
        xs: { w: 12, h: 7 },
        xxs: { w: 12, h: 13 },
      },
    },
  },
  {
    Component: EntitySection,
    config: {
      layouts: {
        xl: { w: 12, h: 6 },
        lg: { w: 12, h: 6 },
        md: { w: 12, h: 6 },
        sm: { w: 12, h: 6 },
        xs: { w: 12, h: 10 },
        xxs: { w: 12, h: 14.5 },
      },
    },
  },
  {
    Component: TemplateSection,
    config: {
      layouts: {
        xl: { w: 12, h: 5 },
        lg: { w: 12, h: 5 },
        md: { w: 12, h: 5 },
        sm: { w: 12, h: 5 },
        xs: { w: 12, h: 7.5 },
        xxs: { w: 12, h: 13.5 },
      },
    },
  },
];

const scalprumState: ScalprumState = {
  initialized: true,
  api: mountPoints
    ? {
        dynamicRootConfig: {
          mountPoints: {
            'home.page/cards': mountPoints,
          },
        },
      }
    : undefined,
  config: {},
  pluginStore: new PluginStore(),
};

const routes = (
  <FlatRoutes>
    <Route
      path="/"
      element={
        <ScalprumContext.Provider value={scalprumState}>
          <DynamicHomePage />
        </ScalprumContext.Provider>
      }
    />
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
    <Route
      path="/catalog-import"
      element={
        <RequirePermission permission={catalogEntityCreatePermission}>
          <CatalogImportPage />
        </RequirePermission>
      }
    />
    <Route path="/search" element={<SearchPage />}>
      {searchPage}
    </Route>
    <Route path="/settings" element={<UserSettingsPage />} />
    <Route path="/catalog-graph" element={<CatalogGraphPage />} />
  </FlatRoutes>
);

export default app.createRoot(
  <>
    <AlertDisplay />
    <OAuthRequestDialog />
    <AppRouter>
      {/* RHIDP-4234: VisitListener should be replaced with a mount point */}
      <VisitListener />
      <Root>{routes}</Root>
    </AppRouter>
  </>,
);
