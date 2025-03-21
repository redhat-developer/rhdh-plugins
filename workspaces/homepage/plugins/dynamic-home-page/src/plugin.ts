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

import React from 'react';

import {
  configApiRef,
  createApiFactory,
  createComponentExtension,
  createPlugin,
  createRoutableExtension,
  discoveryApiRef,
  identityApiRef,
  storageApiRef,
} from '@backstage/core-plugin-api';

import {
  type StarredEntitiesProps,
  type VisitedByTypeProps,
  type FeaturedDocsCardProps,
  visitsApiRef,
  VisitsStorageApi,
} from '@backstage/plugin-home';

import { QuickAccessApiClient, quickAccessApiRef } from './api';
import { rootRouteRef } from './routes';

import type { DynamicHomePageProps } from './components/DynamicHomePage';
import type { DynamicCustomizableHomePageProps } from './components/DynamicCustomizableHomePage';
import type { SearchBarProps } from './components/SearchBar';
import type { QuickAccessCardProps } from './components/QuickAccessCard';
import type { HeadlineProps } from './components/Headline';
import type { MarkdownProps } from './components/Markdown';
import type { MarkdownCardProps } from './components/MarkdownCard';
import type { PlaceholderProps } from './components/Placeholder';

export type { DynamicHomePageProps } from './components/DynamicHomePage';
export type { DynamicCustomizableHomePageProps } from './components/DynamicCustomizableHomePage';
export type { SearchBarProps } from './components/SearchBar';
export type { QuickAccessCardProps } from './components/QuickAccessCard';
export type { HeadlineProps } from './components/Headline';
export type { MarkdownProps } from './components/Markdown';
export type { MarkdownCardProps } from './components/MarkdownCard';
export type { PlaceholderProps } from './components/Placeholder';
export type { LocalClockProps } from './components/LocalClock';
export type { WorldClockProps } from './components/WorldClock';

/**
 * Dynamic Home Page Plugin
 * @public
 */
export const dynamicHomePagePlugin = createPlugin({
  id: 'dynamic-home-page',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    createApiFactory({
      api: quickAccessApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        configApi: configApiRef,
        identityApi: identityApiRef,
      },
      factory: ({ discoveryApi, configApi, identityApi }) =>
        new QuickAccessApiClient({ discoveryApi, configApi, identityApi }),
    }),
    createApiFactory({
      api: visitsApiRef,
      deps: {
        storageApi: storageApiRef,
        identityApi: identityApiRef,
      },
      factory: ({ storageApi, identityApi }) =>
        VisitsStorageApi.create({ storageApi, identityApi }),
    }),
  ],
});

/**
 * Dynamic Home Page
 * @public
 */
export const DynamicHomePage: React.ComponentType<DynamicHomePageProps> =
  dynamicHomePagePlugin.provide(
    createRoutableExtension({
      name: 'DynamicHomePage',
      component: () =>
        import('./components/DynamicHomePage').then(m => m.DynamicHomePage),
      mountPoint: rootRouteRef,
    }),
  );

/**
 * Customizable Dynamic Home Page
 * @public
 */
export const DynamicCustomizableHomePage: React.ComponentType<DynamicCustomizableHomePageProps> =
  dynamicHomePagePlugin.provide(
    createRoutableExtension({
      name: 'DynamicCustomizableHomePage',
      component: () =>
        import('./components/DynamicCustomizableHomePage').then(
          m => m.DynamicCustomizableHomePage,
        ),
      mountPoint: rootRouteRef,
    }),
  );

/**
 * @public
 */
export const SearchBar: React.ComponentType<SearchBarProps> =
  dynamicHomePagePlugin.provide(
    createComponentExtension({
      name: 'SearchBar',
      component: {
        lazy: () => import('./components/SearchBar').then(m => m.SearchBar),
      },
    }),
  );

/**
 * @public
 */
export const QuickAccessCard: React.ComponentType<QuickAccessCardProps> =
  dynamicHomePagePlugin.provide(
    createComponentExtension({
      name: 'QuickAccessCard',
      component: {
        lazy: () =>
          import('./components/QuickAccessCard').then(m => m.QuickAccessCard),
      },
    }),
  );

/**
 * @public
 */
export const Headline: React.ComponentType<HeadlineProps> =
  dynamicHomePagePlugin.provide(
    createComponentExtension({
      name: 'Headline',
      component: {
        lazy: () => import('./components/Headline').then(m => m.Headline),
      },
    }),
  );

/**
 * @public
 */
export const Markdown: React.ComponentType<MarkdownProps> =
  dynamicHomePagePlugin.provide(
    createComponentExtension({
      name: 'Markdown',
      component: {
        lazy: () => import('./components/Markdown').then(m => m.Markdown),
      },
    }),
  );

/**
 * @public
 */
export const MarkdownCard: React.ComponentType<MarkdownCardProps> =
  dynamicHomePagePlugin.provide(
    createComponentExtension({
      name: 'MarkdownCard',
      component: {
        lazy: () =>
          import('./components/MarkdownCard').then(m => m.MarkdownCard),
      },
    }),
  );

/**
 * @public
 */
export const Placeholder: React.ComponentType<PlaceholderProps> =
  dynamicHomePagePlugin.provide(
    createComponentExtension({
      name: 'MarkdownCard',
      component: {
        lazy: () => import('./components/Placeholder').then(m => m.Placeholder),
      },
    }),
  );

/**
 * @public
 */
export const CatalogStarredEntitiesCard: React.ComponentType<StarredEntitiesProps> =
  dynamicHomePagePlugin.provide(
    createComponentExtension({
      name: 'CatalogStarredEntitiesCard',
      component: {
        lazy: () =>
          import('@backstage/plugin-home').then(m => m.HomePageStarredEntities),
      },
    }),
  );

/**
 * @public
 */
export const RecentlyVisitedCard: React.ComponentType<VisitedByTypeProps> =
  dynamicHomePagePlugin.provide(
    createComponentExtension({
      name: 'RecentlyVisitedCard',
      component: {
        lazy: () =>
          import('@backstage/plugin-home').then(m => m.HomePageRecentlyVisited),
      },
    }),
  );

/**
 * @public
 */
export const TopVisitedCard: React.ComponentType<VisitedByTypeProps> =
  dynamicHomePagePlugin.provide(
    createComponentExtension({
      name: 'TopVisitedCard',
      component: {
        lazy: () =>
          import('@backstage/plugin-home').then(m => m.HomePageTopVisited),
      },
    }),
  );

/**
 * @public
 */
export const FeaturedDocsCard: React.ComponentType<FeaturedDocsCardProps> =
  dynamicHomePagePlugin.provide(
    createComponentExtension({
      name: 'FeaturedDocsCard',
      component: {
        lazy: () =>
          import('./components/FeaturedDocsCard').then(m => m.FeaturedDocsCard),
      },
    }),
  );

/**
 * @public
 */
export const JokeCard: React.ComponentType<{
  defaultCategory?: 'any' | 'programming';
}> = dynamicHomePagePlugin.provide(
  createComponentExtension({
    name: 'JokeCard',
    component: {
      lazy: () =>
        import('@backstage/plugin-home').then(m => m.HomePageRandomJoke),
    },
  }),
);

/**
 * @public
 */
export const VisitListener = dynamicHomePagePlugin.provide(
  createComponentExtension({
    name: 'VisitListener',
    component: {
      lazy: () =>
        import('./components/VisitListener').then(m => m.VisitListener),
    },
  }),
);

/**
 * @public
 */
export const WorldClock = dynamicHomePagePlugin.provide(
  createComponentExtension({
    name: 'WorldClock',
    component: {
      lazy: () => import('./components/WorldClock').then(m => m.WorldClock),
    },
  }),
);
