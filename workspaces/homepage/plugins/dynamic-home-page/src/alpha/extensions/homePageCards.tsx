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

import { HomePageWidgetBlueprint } from '@backstage/plugin-home-react/alpha';
import homePlugin from '@backstage/plugin-home/alpha';
import { compatWrapper } from '@backstage/core-compat-api';

const defaultCardLayout = {
  width: {
    minColumns: 4,
    maxColumns: 12,
    defaultColumns: 12,
  },
  height: {
    minRows: 2,
    maxRows: 12,
    defaultRows: 4,
  },
} as const;

/**
 * NFS widget: OnboardingSection (migrated from mountPoint home.page/cards).
 * @alpha
 */
export const onboardingSectionWidget = HomePageWidgetBlueprint.make({
  name: 'rhdh-onboarding-section',
  params: {
    name: 'RhdhOnboardingSection',
    layout: defaultCardLayout,
    components: () =>
      import('../../components/OnboardingSection').then(m => ({
        Content: m.OnboardingSection,
      })),
  },
});

/**
 * NFS widget: EntitySection (migrated from mountPoint home.page/cards).
 * @alpha
 */
export const entitySectionWidget = HomePageWidgetBlueprint.make({
  name: 'rhdh-entity-section',
  params: {
    name: 'RhdhEntitySection',
    layout: defaultCardLayout,
    components: () =>
      import('../../components/EntitySection').then(m => ({
        Content: () => compatWrapper(<m.EntitySection />),
      })),
  },
});

/**
 * NFS widget: TemplateSection (migrated from mountPoint home.page/cards).
 * @alpha
 */
export const templateSectionWidget = HomePageWidgetBlueprint.make({
  name: 'rhdh-template-section',
  params: {
    name: 'RhdhTemplateSection',
    layout: defaultCardLayout,
    components: () =>
      import('../../components/TemplateSection').then(m => ({
        Content: m.TemplateSection,
      })),
  },
});

/**
 * NFS widget: QuickAccessCard (migrated from mountPoint home.page/cards).
 * @alpha
 */
export const quickAccessCardWidget = HomePageWidgetBlueprint.make({
  name: 'quick-access-card',
  params: {
    name: 'QuickAccessCard',
    layout: defaultCardLayout,
    components: () =>
      import('../../components/QuickAccessCard').then(m => ({
        Content: () => compatWrapper(<m.QuickAccessCard />),
      })),
  },
});

/**
 * NFS widget: SearchBar (migrated from mountPoint home.page/cards).
 * @alpha
 */
export const searchBarWidget = HomePageWidgetBlueprint.make({
  name: 'search-bar',
  params: {
    name: 'SearchBar',
    layout: {
      ...defaultCardLayout,
      height: {
        ...defaultCardLayout.height,
        defaultRows: 2,
        minRows: 1,
        maxRows: 1,
      },
    },
    components: () =>
      import('../../components/SearchBar').then(m => ({
        Content: () => compatWrapper(<m.SearchBar />),
      })),
  },
});

/**
 * NFS widget: FeaturedDocsCard (migrated from mountPoint home.page/cards).
 * @alpha
 */
export const featuredDocsCardWidget = HomePageWidgetBlueprint.make({
  name: 'featured-docs-card',
  params: {
    name: 'FeaturedDocsCard',
    layout: defaultCardLayout,
    components: () =>
      import('../../components/FeaturedDocsCard').then(m => ({
        Content: m.FeaturedDocsCard,
      })),
  },
});

/**
 * NFS widget: CatalogStarred (migrated from mountPoint home.page/cards).
 * @alpha
 */
export const catalogStarredWidget = homePlugin
  .getExtension('home-page-widget:home/starred-entities')
  .override({
    params: {
      name: 'CatalogStarred',
      title: 'Starred catalog entities',
    },
  });

/**
 * Disables the default home plugin toolkit widget.
 * @alpha
 */
export const disableToolkit = homePlugin
  .getExtension('home-page-widget:home/toolkit')
  .override({
    disabled: true,
  });

/**
 * NFS widget: RecentlyVisited (migrated from mountPoint home.page/cards).
 * @alpha
 */
export const RecentlyVisitedWidget = HomePageWidgetBlueprint.make({
  name: 'recently-visited',
  params: {
    layout: defaultCardLayout,
    name: 'Recently visited',
    components: () =>
      import('@backstage/plugin-home').then(m => ({
        Content: m.HomePageRecentlyVisited,
      })),
  },
});

/**
 * NFS widget: TopVisited (migrated from mountPoint home.page/cards).
 * @alpha
 */
export const TopVisitedWidget = HomePageWidgetBlueprint.make({
  name: 'top-visited',
  params: {
    layout: defaultCardLayout,
    name: 'Top visited',
    components: () =>
      import('@backstage/plugin-home').then(m => ({
        Content: () => <m.HomePageTopVisited />,
      })),
  },
});
