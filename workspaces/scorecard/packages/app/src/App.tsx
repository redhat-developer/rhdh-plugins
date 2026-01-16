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
  OAuthRequestDialog,
  SignInPage,
} from '@backstage/core-components';
import { createApp } from '@backstage/app-defaults';
import { AppRouter, FlatRoutes } from '@backstage/core-app-api';
import { CatalogGraphPage } from '@backstage/plugin-catalog-graph';
import { RequirePermission } from '@backstage/plugin-permission-react';
import { catalogEntityCreatePermission } from '@backstage/plugin-catalog-common/alpha';
import { scorecardTranslations } from '@red-hat-developer-hub/backstage-plugin-scorecard/alpha';
import { githubAuthApiRef } from '@backstage/core-plugin-api';
import { getThemes } from '@red-hat-developer-hub/backstage-plugin-theme';
import { ScorecardHomepageCard } from '@red-hat-developer-hub/backstage-plugin-scorecard';

import { ScalprumContext, ScalprumState } from '@scalprum/react-core';
import { PluginStore } from '@openshift/dynamic-plugin-sdk';
import {
  DynamicCustomizableHomePage,
  OnboardingSection,
  HomePageCardMountPoint,
  homepageTranslations,
} from '@red-hat-developer-hub/backstage-plugin-dynamic-home-page';
import { ComponentType } from 'react';

const mountPoints: HomePageCardMountPoint[] = [
  {
    Component: OnboardingSection,
    config: {
      id: 'onboarding-section',
      title: 'Onboarding section',
      layouts: {
        xl: { w: 12, h: 5 },
        lg: { w: 12, h: 5 },
        md: { w: 12, h: 5 },
        sm: { w: 12, h: 5 },
        xs: { w: 12, h: 5 },
        xxs: { w: 12, h: 5 },
      },
    },
  },
  {
    Component: ScorecardHomepageCard as ComponentType,
    config: {
      id: 'scorecard-jira.open_issues',
      title: 'Scorecard: Jira open blocking tickets',
      // Supported card layout
      cardLayout: {
        width: {
          minColumns: 3,
          maxColumns: 12,
          defaultColumns: 4,
        },
        height: {
          minRows: 5,
          maxRows: 12,
          defaultRows: 6,
        },
      },
      // Default layout so that it is shown automatically
      layouts: {
        xl: { w: 4, h: 6 },
        lg: { w: 4, h: 6 },
        md: { w: 4, h: 6 },
        sm: { w: 4, h: 6 },
        xs: { w: 4, h: 6 },
        xxs: { w: 4, h: 6 },
      },
      props: {
        metricId: 'jira.open_issues',
      },
    },
  },
  {
    Component: ScorecardHomepageCard as ComponentType,
    config: {
      id: 'scorecard-github.open_prs',
      title: 'Scorecard: GitHub open PRs',
      // Supported card layout
      cardLayout: {
        width: {
          minColumns: 3,
          maxColumns: 12,
          defaultColumns: 4,
        },
        height: {
          minRows: 5,
          maxRows: 12,
          defaultRows: 6,
        },
      },
      // Default layout so that it is shown automatically
      layouts: {
        xl: { w: 4, h: 6, x: 4 },
        lg: { w: 4, h: 6, x: 4 },
        md: { w: 4, h: 6, x: 4 },
        sm: { w: 4, h: 6, x: 4 },
        xs: { w: 4, h: 6, x: 4 },
        xxs: { w: 4, h: 6, x: 4 },
      },
      props: {
        metricId: 'github.open_prs',
      },
    },
  },
  {
    Component: ScorecardHomepageCard as ComponentType,
    config: {
      id: 'scorecard-customizable',
      title: 'Scorecard: Customizable',
      // Supported card layout
      cardLayout: {
        width: {
          minColumns: 3,
          maxColumns: 12,
          defaultColumns: 4,
        },
        height: {
          minRows: 5,
          maxRows: 12,
          defaultRows: 6,
        },
      },
      // Default layout so that it is shown automatically
      layouts: {
        xl: { w: 4, h: 6, x: 8 },
        lg: { w: 4, h: 6, x: 8 },
        md: { w: 4, h: 6, x: 8 },
        sm: { w: 4, h: 6, x: 8 },
        xs: { w: 4, h: 6, x: 8 },
        xxs: { w: 4, h: 6, x: 8 },
      },
      settings: {
        schema: {
          properties: {
            metricId: {
              title: 'Metric (Needs currently a page reload after change!)',
              type: 'string',
              default: 'jira.open_issues',
              enum: ['jira.open_issues', 'github.open_prs'],
            },
          },
        },
        uiSchema: {
          metricId: {
            'ui:widget': 'RadioWidget',
            'ui:enumNames': ['Jira Open Issues', 'GitHub Open PRs'],
          },
        },
      },
    },
  },
  {
    Component: ScorecardHomepageCard as ComponentType,
    config: {
      id: 'scorecard-no-metric-id',
      title: 'Scorecard: No metric id (expected error)',
      // Supported card layout
      cardLayout: {
        width: {
          minColumns: 3,
          maxColumns: 12,
          defaultColumns: 4,
        },
        height: {
          minRows: 5,
          maxRows: 12,
          defaultRows: 6,
        },
      },
      // Default layout so that it is shown automatically
      layouts: {
        xl: { w: 4, h: 6 },
        lg: { w: 4, h: 6 },
        md: { w: 4, h: 6 },
        sm: { w: 4, h: 6 },
        xs: { w: 4, h: 6 },
        xxs: { w: 4, h: 6 },
      },
    },
  },
  {
    Component: ScorecardHomepageCard as ComponentType,
    config: {
      id: 'scorecard-invalid-metric-id',
      title: 'Scorecard: Invalid metric id (expected error)',
      // Supported card layout
      cardLayout: {
        width: {
          minColumns: 3,
          maxColumns: 12,
          defaultColumns: 4,
        },
        height: {
          minRows: 5,
          maxRows: 12,
          defaultRows: 6,
        },
      },
      // Default layout so that it is shown automatically
      layouts: {
        xl: { w: 4, h: 6, x: 4 },
        lg: { w: 4, h: 6, x: 4 },
        md: { w: 4, h: 6, x: 4 },
        sm: { w: 4, h: 6, x: 4 },
        xs: { w: 4, h: 6, x: 4 },
        xxs: { w: 4, h: 6, x: 4 },
      },
      props: {
        metricId: 'invalid-metric-id',
      },
    },
  },
];

const scalprumState: ScalprumState = {
  initialized: true,
  api: {
    dynamicRootConfig: {
      mountPoints: {
        'home.page/cards': mountPoints,
      },
    },
  },
  config: {},
  pluginStore: new PluginStore(),
};

const app = createApp({
  apis,
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
        <ScalprumContext.Provider value={scalprumState}>
          <DynamicCustomizableHomePage />
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
