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
import { createTranslatedCardRenderer } from '../../utils/translatedCardRenderer';

/**
 * NFS homepage widgets.
 *
 * i18n follows the upstream `@backstage/plugin-home` model:
 * - Blueprint `params.title` / `description` are English catalog labels.
 *   `AddWidgetDialog` renders them as-is (no `t()`).
 * - On-card headers are translated at render time via
 *   {@link createTranslatedCardRenderer} or Content hooks such as
 *   `useHomePageCardTitle`.
 * - In-widget copy uses `homepageTranslationRef` through `useTranslation`.
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

/**
 * NFS widget: OnboardingSection (migrated from mountPoint home.page/cards).
 * @alpha
 */
export const onboardingSectionWidget = HomePageWidgetBlueprint.make({
  name: 'rhdh-onboarding-section',
  params: {
    name: 'Red Hat Developer Hub - Onboarding',
    layout: defaultCardLayout,
    components: () =>
      import('../../components/OnboardingSection/OnboardingSection').then(
        m => ({
          Content: m.OnboardingSectionContent,
        }),
      ),
  },
});

/**
 * NFS widget: EntitySection (migrated from mountPoint home.page/cards).
 * @alpha
 */
export const entitySectionWidget = HomePageWidgetBlueprint.make({
  name: 'rhdh-entity-section',
  params: {
    name: 'Red Hat Developer Hub - Software Catalog',
    description:
      'Browse the Systems, Components, Resources, and APIs that are available in your organization.',
    layout: defaultCardLayout,
    components: () =>
      import('../../components/EntitySection/EntitySection').then(m => ({
        Content: m.EntitySectionContent,
        Renderer: createTranslatedCardRenderer('entities.title'),
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
    name: 'Red Hat Developer Hub - Explore templates',
    layout: defaultCardLayout,
    components: () =>
      import('../../components/TemplateSection/TemplateSection').then(m => ({
        Content: m.TemplateSectionContent,
        Renderer: createTranslatedCardRenderer('templates.title'),
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
    name: 'Quick Access Card',
    title: 'Quick Access',
    layout: defaultCardLayout,
    components: () =>
      import('../../components/QuickAccessCard').then(m => ({
        Content: m.QuickAccessCardContent,
        Renderer: createTranslatedCardRenderer('quickAccess.title', {
          quickAccessStyle: true,
        }),
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
      import('../../components/SearchBar').then(m => ({
        Content: m.SearchBar,
        Renderer: ({ Content }: { Content: React.ComponentType }) =>
          compatWrapper(<Content />),
      })),
  },
});

/**
 * Renders upstream home cards that include their own InfoCard shell.
 * @alpha
 */
const upstreamHomeCardRenderer = ({
  Content,
}: {
  Content: React.ComponentType;
}) => <Content />;

/**
 * NFS widget: FeaturedDocsCard (migrated from mountPoint home.page/cards).
 * @alpha
 */
export const featuredDocsCardWidget = HomePageWidgetBlueprint.make({
  name: 'featured-docs-card',
  params: {
    name: 'Featured docs',
    title: 'Featured Docs',
    layout: defaultCardLayout,
    components: () =>
      import('../../components/FeaturedDocsCard').then(m => ({
        Content: m.FeaturedDocsCard,
        Renderer: upstreamHomeCardRenderer,
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
      name: 'Catalog starred',
      title: 'Starred Catalog Entities',
      components: () =>
        import('../../components/legacy/TranslatedUpstreamHomePageCards').then(
          m => ({
            Content: m.CatalogStarredEntitiesCard,
            Renderer: upstreamHomeCardRenderer,
          }),
        ),
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
 * Disables the upstream demo random-joke widget.
 * @alpha
 */
export const disableRandomJoke = homePlugin
  .getExtension('home-page-widget:home/random-joke')
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
    title: 'Recently Visited',
    description: 'Quick access to recently viewed entities and pages',
    components: () =>
      import('../../components/legacy/TranslatedUpstreamHomePageCards').then(
        m => ({
          Content: m.RecentlyVisitedCard,
          Renderer: upstreamHomeCardRenderer,
        }),
      ),
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
    title: 'Top Visited',
    description: 'Your most frequently accessed entities and services',
    components: () =>
      import('../../components/legacy/TranslatedUpstreamHomePageCards').then(
        m => ({
          Content: m.TopVisitedCard,
          Renderer: upstreamHomeCardRenderer,
        }),
      ),
  },
});
