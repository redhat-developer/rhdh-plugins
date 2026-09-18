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

import {
  HomePageWidgetBlueprint,
  type HomePageWidgetBlueprintParams,
} from '@backstage/plugin-home-react/alpha';
import homePlugin from '@backstage/plugin-home/alpha';
import { compatWrapper } from '@backstage/core-compat-api';
import { createTranslatedCardRenderer } from '../utils/translatedCardRenderer';
import { homepageWidgetAttachTo } from './homepageAttach';

/**
 * NFS homepage widgets.
 *
 * NFS allows only one `attachTo` per extension. To show widgets on both
 * `page:homepage` and community `page:home`, each widget is registered twice.
 * Persona filtering (homepage-backend) applies only on `page:homepage`.
 */

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

function makeDualHomeWidgets<TName extends string>(
  name: TName,
  params: HomePageWidgetBlueprintParams,
) {
  return {
    homepage: HomePageWidgetBlueprint.make({
      attachTo: homepageWidgetAttachTo,
      name,
      params,
    }),
    community: HomePageWidgetBlueprint.make({
      name,
      params,
    }),
  };
}

const upstreamHomeCardRenderer = ({
  Content,
}: {
  Content: React.ComponentType;
}) => <Content />;

const onboarding = makeDualHomeWidgets('rhdh-onboarding-section', {
  name: 'Red Hat Developer Hub - Onboarding',
  layout: defaultCardLayout,
  components: () =>
    import('../components/OnboardingSection/OnboardingSection').then(m => ({
      Content: m.OnboardingSectionContent,
    })),
});

const entity = makeDualHomeWidgets('rhdh-entity-section', {
  name: 'Red Hat Developer Hub - Software Catalog',
  description:
    'Browse the Systems, Components, Resources, and APIs that are available in your organization.',
  layout: defaultCardLayout,
  components: () =>
    import('../components/EntitySection/EntitySection').then(m => ({
      Content: m.EntitySectionContent,
      Renderer: createTranslatedCardRenderer('entities.title'),
    })),
});

const template = makeDualHomeWidgets('rhdh-template-section', {
  name: 'Red Hat Developer Hub - Explore templates',
  layout: defaultCardLayout,
  components: () =>
    import('../components/TemplateSection/TemplateSection').then(m => ({
      Content: m.TemplateSectionContent,
      Renderer: createTranslatedCardRenderer('templates.title'),
    })),
});

const quickAccess = makeDualHomeWidgets('quickaccess-card', {
  name: 'Quick Access Card',
  title: 'Quick Access',
  layout: defaultCardLayout,
  components: () =>
    import('../components/QuickAccessCard').then(m => ({
      Content: m.QuickAccessCardContent,
      Renderer: createTranslatedCardRenderer('quickAccess.title', {
        quickAccessStyle: true,
      }),
    })),
});

const searchBar = makeDualHomeWidgets('search-bar', {
  name: 'Search',
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
    import('../components/SearchBar').then(m => ({
      Content: m.SearchBar,
      Renderer: ({ Content }: { Content: React.ComponentType }) =>
        compatWrapper(<Content />),
    })),
});

const featuredDocs = makeDualHomeWidgets('featured-docs-card', {
  name: 'Featured docs',
  title: 'Featured Docs',
  layout: defaultCardLayout,
  components: () =>
    import('../components/FeaturedDocsCard').then(m => ({
      Content: m.FeaturedDocsCard,
      Renderer: upstreamHomeCardRenderer,
    })),
});

const catalogStarred = makeDualHomeWidgets('catalog-starred-entities-card', {
  name: 'Catalog starred',
  title: 'Starred Catalog Entities',
  layout: defaultCardLayout,
  components: () =>
    import('../components/TranslatedUpstreamHomePageCards').then(m => ({
      Content: m.CatalogStarredEntitiesCard,
      Renderer: upstreamHomeCardRenderer,
    })),
});

const recentlyVisited = makeDualHomeWidgets('recently-visited-card', {
  layout: defaultCardLayout,
  name: 'Recently visited',
  title: 'Recently Visited',
  description: 'Quick access to recently viewed entities and pages',
  components: () =>
    import('../components/TranslatedUpstreamHomePageCards').then(m => ({
      Content: m.RecentlyVisitedCard,
      Renderer: upstreamHomeCardRenderer,
    })),
});

const topVisited = makeDualHomeWidgets('top-visited-card', {
  layout: defaultCardLayout,
  name: 'Top visited',
  title: 'Top Visited',
  description: 'Your most frequently accessed entities and services',
  components: () =>
    import('../components/TranslatedUpstreamHomePageCards').then(m => ({
      Content: m.TopVisitedCard,
      Renderer: upstreamHomeCardRenderer,
    })),
});

export const onboardingSectionWidget = onboarding.homepage;
export const entitySectionWidget = entity.homepage;
export const templateSectionWidget = template.homepage;
export const quickAccessCardWidget = quickAccess.homepage;
export const searchBarWidget = searchBar.homepage;
export const featuredDocsCardWidget = featuredDocs.homepage;
export const catalogStarredWidget = catalogStarred.homepage;
export const RecentlyVisitedWidget = recentlyVisited.homepage;
export const TopVisitedWidget = topVisited.homepage;

/** RH widget twins for community `page:home` (via `homepageHomeModule`). */
export const communityHomeWidgets = [
  onboarding.community,
  entity.community,
  template.community,
  quickAccess.community,
  featuredDocs.community,
  searchBar.community,
  topVisited.community,
  recentlyVisited.community,
  catalogStarred.community,
];

export const overrideHomeCatalogStarredWidget = homePlugin
  .getExtension('home-page-widget:home/starred-entities')
  .override({
    disabled: true,
  });

export const disableToolkit = homePlugin
  .getExtension('home-page-widget:home/toolkit')
  .override({
    disabled: true,
  });

export const disableRandomJoke = homePlugin
  .getExtension('home-page-widget:home/random-joke')
  .override({
    disabled: true,
  });
