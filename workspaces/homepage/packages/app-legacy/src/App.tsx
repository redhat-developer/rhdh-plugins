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
  DynamicCustomizableHomePage,
  VisitListener,
  OnboardingSection,
  QuickAccessCard,
  EntitySection,
  TemplateSection,
  homepageTranslations,
  SearchBar,
  Headline,
  // Markdown,
  // MarkdownCard,
  // Placeholder,
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
    availableLanguages: ['en', 'de', 'es', 'fr', 'it', 'ja'],
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

// prettier-ignore
export const layouts = {
  onboarding: {
    xl: { w: 12, h: 6 },
    lg: { w: 12, h: 6 },
    md: { w: 12, h: 7 },
    sm: { w: 12, h: 8 },
    xs: { w: 12, h: 9 },
    xxs: { w: 12, h: 14 },
  },
  entity: {
    xl: { w: 12, h: 7 },
    lg: { w: 12, h: 7 },
    md: { w: 12, h: 8 },
    sm: { w: 12, h: 9 },
    xs: { w: 12, h: 11 },
    xxs: { w: 12, h: 15 },
  },
  template: {
    xl: { w: 12, h: 5 },
    lg: { w: 12, h: 5 },
    md: { w: 12, h: 5 },
    sm: { w: 12, h: 5 },
    xs: { w: 12, h: 7.5 },
    xxs: { w: 12, h: 13.5 },
  },
  quickAccessCard: {
    xl: { w: 6, h: 8, x: 6 },
    lg: { w: 6, h: 8, x: 6 },
    md: { w: 6, h: 8, x: 6 },
    sm: { w: 12, h: 8, x: 6 },
    xs: { w: 12, h: 8, x: 6 },
    xxs: { w: 12, h: 8, x: 6 },
  },
};

const createHeadline = ({
  id,
  title,
  align,
  priority,
}: {
  id: string;
  title: string;
  align: string;
  priority: number;
}): HomePageCardMountPoint => ({
  Component: Headline,
  config: {
    id,
    title,
    priority,
    props: {
      title,
      align,
    },
    layouts: {
      xl: { w: 12, h: 1 },
      lg: { w: 12, h: 1 },
      md: { w: 12, h: 1 },
      sm: { w: 12, h: 1 },
      xs: { w: 12, h: 1 },
      xxs: { w: 12, h: 1 },
    },
    cardLayout: {
      width: {
        minColumns: 4,
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
});

const cardMountPoints: HomePageCardMountPoint[] = [
  // Old defaults
  {
    Component: OnboardingSection,
    config: {
      id: 'rhdh-onboarding-section',
      priority: 203,
      layouts: layouts.onboarding,
    },
  },
  {
    Component: EntitySection,
    config: {
      id: 'rhdh-entity-section',
      priority: 201,
      layouts: layouts.entity,
    },
  },
  {
    Component: TemplateSection,
    config: {
      id: 'rhdh-template-section',
      priority: 200,
      layouts: layouts.template,
    },
  },
  // 'Added' card for the playwright tests
  {
    Component: QuickAccessCard,
    config: {
      priority: 202,
      id: 'quickaccess-card',
      title: 'Quick Access Card',
      layouts: layouts.quickAccessCard,
    },
  },
  // Add extra mount points to verify same components can mount multiple times
  createHeadline({
    id: 'headline-left',
    title: 'Left title',
    align: 'left',
    priority: 102,
  }),
  createHeadline({
    id: 'headline-center',
    title: 'Centered title',
    align: 'center',
    priority: 101,
  }),
  createHeadline({
    id: 'headline-right',
    title: 'Right title',
    align: 'right',
    priority: 100,
  }),
  // Add all other mount points for the customization feature
  {
    Component: SearchBar,
    config: {
      id: 'searchbar',
      title: 'Search',
      cardLayout: {
        width: {
          minColumns: 4,
          maxColumns: 12,
          defaultColumns: 12,
        },
        height: {
          minRows: 1,
          maxRows: 2,
          defaultRows: 2,
        },
      },
    },
  },
  // Headline is not configurable at the moment
  // {
  //   Component: Headline,
  //   config: {
  //     id: 'headline',
  //     title: 'Headline',
  //   },
  // },
  // Markdown is not configurable at the moment
  // {
  //   Component: Markdown,
  //   config: {
  //     id: 'markdown',
  //     title: 'Markdown',
  //   },
  // },
  // Headline is not configurable at the moment
  // {
  //   Component: MarkdownCard,
  //   config: {
  //     id: 'markdown-card',
  //     title: 'Markdown card',
  //   },
  // },
  // Placeholder is not configurable at the moment
  // {
  //   Component: Placeholder,
  //   config: {
  //     id: 'placeholder',
  //     title: 'Placeholder',
  //   },
  // },
  {
    Component: CatalogStarredEntitiesCard,
    config: {
      id: 'catalog-starred-entities-card',
      title: 'Starred catalog entities',
    },
  },
  {
    Component: RecentlyVisitedCard as ComponentType,
    config: {
      id: 'recently-visited-card',
      title: 'Recently visited',
    },
  },
  {
    Component: TopVisitedCard as ComponentType,
    config: {
      id: 'top-visited-card',
      title: 'Top visited',
    },
  },
  {
    Component: FeaturedDocsCard as ComponentType,
    config: {
      id: 'featured-docs-card',
      title: 'Featured docs',
    },
  },
  {
    Component: JokeCard,
    config: {
      id: 'joke-card',
      title: 'Random joke',
    },
  },
  {
    Component: WorldClock as ComponentType,
    config: {
      id: 'worldclock',
      title: 'World clock',
    },
  },
  {
    Component: OnboardingSection,
    config: {
      id: 'rhdh-onboarding-section',
      title: 'Red Hat Developer Hub - Onboarding',
    },
  },
  {
    Component: EntitySection,
    config: {
      id: 'rhdh-entity-section',
      title: 'Red Hat Developer Hub - Software Catalog',
    },
  },
  {
    Component: TemplateSection,
    config: {
      id: 'rhdh-template-section',
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
    <Route
      path="/customizable"
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
