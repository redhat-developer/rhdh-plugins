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

import type { ComponentType } from 'react';
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
  VisitListener,
  OnboardingSection,
  QuickAccessCard,
  EntitySection,
  TemplateSection,
  defaultLayouts,
  homepageTranslations,
  SearchBar,
  Headline,
  Markdown,
  MarkdownCard,
  Placeholder,
  CatalogStarredEntitiesCard,
  RecentlyVisitedCard,
  TopVisitedCard,
  FeaturedDocsCard,
  JokeCard,
  WorldClock,
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
  __experimentalTranslations: {
    availableLanguages: ['en', 'de', 'fr', 'it', 'es'],
    resources: [homepageTranslations],
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
      <SignInPage {...props} auto providers={identityProviders} />
    ),
  },
});

const cardMountPoints: HomePageCardMountPoint[] = [
  {
    Component: Headline,
    config: {
      props: {
        title: 'asd',
      },
    },
  },
  {
    Component: Headline,
    config: {
      props: {
        title: 'asd 2',
      },
    },
  },
  {
    Component: Headline,
    config: {
      name: 'Headline',
      props: {
        title: 'asd 3',
      },
    },
  },
  {
    Component: OnboardingSection,
    config: {
      layouts: defaultLayouts.onboarding,
    },
  },
  {
    Component: QuickAccessCard,
    config: {
      layouts: defaultLayouts.quickAccessCard,
    },
  },
  {
    Component: EntitySection,
    config: {
      layouts: defaultLayouts.entity,
    },
  },
  {
    Component: SearchBar,
    config: {
      name: 'SearchBar',
      title: 'Search bar',
      cardLayout: {
        width: {
          minColumns: 3,
          maxColumns: 12,
          defaultColumns: 12,
        },
        height: {
          minRows: 1,
          maxRows: 1,
          defaultRows: 1,
        },
      },
    },
  },
  {
    Component: QuickAccessCard,
    config: {
      name: 'QuickAccessCard',
      title: 'Quick Access Card',
    },
  },
  {
    Component: Headline,
    config: {
      name: 'Headline',
      title: 'Headline',
    },
  },
  {
    Component: Markdown,
    config: {
      name: 'Markdown',
      title: 'Markdown',
    },
  },
  {
    Component: MarkdownCard,
    config: {
      name: 'MarkdownCard',
      title: 'Markdown card',
    },
  },
  {
    Component: Placeholder,
    config: {
      name: 'Placeholder',
      title: 'Placeholder',
    },
  },
  {
    Component: CatalogStarredEntitiesCard,
    config: {
      name: 'CatalogStarredEntitiesCard',
      title: 'Starred catalog entities',
    },
  },
  {
    Component: RecentlyVisitedCard as ComponentType,
    config: {
      name: 'RecentlyVisitedCard',
      title: 'Recently visited',
    },
  },
  {
    Component: TopVisitedCard as ComponentType,
    config: {
      name: 'TopVisitedCard',
      title: 'Top visited',
    },
  },
  {
    Component: FeaturedDocsCard as ComponentType,
    config: {
      name: 'FeaturedDocsCard',
      title: 'Featured docs',
    },
  },
  {
    Component: JokeCard,
    config: {
      name: 'JokeCard',
      title: 'Random joke',
    },
  },
  {
    Component: WorldClock as ComponentType,
    config: {
      name: 'WorldClock',
      title: 'World clock',
    },
  },
  // {
  //   Component: OnboardingSection,
  //   config: {
  //     name: 'OnboardingSection',
  //     title: 'Red Hat Developer Hub - Onboarding',
  //   },
  // },
  {
    Component: EntitySection,
    config: {
      name: 'EntitySection',
      title: 'Red Hat Developer Hub - Software Catalog',
    },
  },
  {
    Component: TemplateSection,
    config: {
      name: 'TemplateSection',
      title: 'Red Hat Developer Hub - Explore templates',
    },
  },
];

const scalprumState: ScalprumState = {
  initialized: true,
  api: {
    dynamicRootConfig: {
      mountPoints: {
        // In RHDH, mount points will be loaded dynamically at runtime
        'home.page/cards': cardMountPoints,
      },
    },
  },
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
