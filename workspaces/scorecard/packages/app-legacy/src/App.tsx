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
import { RbacPage } from '@backstage-community/plugin-rbac';
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
import { apis } from './apis';
import { entityPage } from './components/catalog/EntityPage';
import { searchPage } from './components/search/SearchPage';
import { Root } from './components/Root';

import {
  AlertDisplay,
  Content,
  Header,
  OAuthRequestDialog,
  Page,
  SignInPage,
} from '@backstage/core-components';
import Grid from '@mui/material/Grid';
import { createApp } from '@backstage/app-defaults';
import { AppRouter, FlatRoutes } from '@backstage/core-app-api';
import { CatalogGraphPage } from '@backstage/plugin-catalog-graph';
import { RequirePermission } from '@backstage/plugin-permission-react';
import { catalogEntityCreatePermission } from '@backstage/plugin-catalog-common/alpha';
import { githubAuthApiRef } from '@backstage/core-plugin-api';
import { getThemes } from '@red-hat-developer-hub/backstage-plugin-theme/legacy';
import {
  ScorecardHomepageCard,
  ScorecardPage,
  ScorecardErrorStatusIcon,
  ScorecardSuccessStatusIcon,
  ScorecardWarningStatusIcon,
  scorecardTranslations,
} from '@red-hat-developer-hub/backstage-plugin-scorecard/legacy';

import { homepageTranslations } from '@red-hat-developer-hub/backstage-plugin-homepage';

const legacyHomepageCards = [
  { key: 'jira.openIssues', metricId: 'jira.openIssues' },
  { key: 'github.openPRs', aggregationId: 'github.openPRs' },
  { key: 'openPrsKpi', aggregationId: 'openPrsKpi' },
  { key: 'openIssuesKpi', aggregationId: 'openIssuesKpi' },
  { key: 'openPrsWeightedKpi', aggregationId: 'openPrsWeightedKpi' },
  { key: 'licenseFileExistsKpi', aggregationId: 'licenseFileExistsKpi' },
  { key: 'totalOpenBugs', aggregationId: 'totalOpenBugs' },
  { key: 'avgOpenPrs', aggregationId: 'avgOpenPrs' },
  { key: 'entitiesWithOpenPrs', aggregationId: 'entitiesWithOpenPrs' },
  { key: 'maxOpenPrs', aggregationId: 'maxOpenPrs' },
  { key: 'minOpenPrs', aggregationId: 'minOpenPrs' },
];

const app = createApp({
  apis,
  icons: {
    scorecardSuccessStatusIcon: ScorecardSuccessStatusIcon,
    scorecardWarningStatusIcon: ScorecardWarningStatusIcon,
    scorecardErrorStatusIcon: ScorecardErrorStatusIcon,
  },
  themes: getThemes(),
  __experimentalTranslations: {
    availableLanguages: ['en', 'de', 'es', 'fr', 'it', 'ja'],
    resources: [scorecardTranslations, homepageTranslations],
  },
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
      <SignInPage
        {...props}
        auto
        providers={[
          'guest',
          {
            id: 'github-auth-provider',
            title: 'GitHub',
            message: 'Sign in using GitHub',
            apiRef: githubAuthApiRef,
          },
        ]}
      />
    ),
  },
});

const routes = (
  <FlatRoutes>
    <Route
      path="/"
      element={
        <Page themeId="home">
          <Header title="Home" />
          <Content>
            <Grid container spacing={2}>
              {legacyHomepageCards.map(card => (
                <Grid item key={card.key} xs={12} md={6} lg={4}>
                  <ScorecardHomepageCard
                    metricId={card.metricId}
                    aggregationId={card.aggregationId}
                  />
                </Grid>
              ))}
            </Grid>
          </Content>
        </Page>
      }
    />
    <Route
      path="/scorecard/aggregations/:aggregationId/metrics/:metricId"
      element={<ScorecardPage />}
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
    <Route path="/rbac" element={<RbacPage />} />
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
      <Root>{routes}</Root>
    </AppRouter>
  </>,
);
