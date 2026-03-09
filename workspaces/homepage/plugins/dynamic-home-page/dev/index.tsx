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

import { createDevApp, DevAppPageOptions } from '@backstage/dev-utils';
import { TestApiProvider } from '@backstage/test-utils';
import {
  CatalogEntityPage,
  CatalogIndexPage,
  EntityLayout,
} from '@backstage/plugin-catalog';
import {
  CatalogApi,
  catalogApiRef,
  EntityProvider,
  starredEntitiesApiRef,
  MockStarredEntitiesApi,
} from '@backstage/plugin-catalog-react';
import { MockSearchApi, searchApiRef } from '@backstage/plugin-search-react';
import {
  Visit,
  VisitsApi,
  VisitsApiQueryParams,
  visitsApiRef,
} from '@backstage/plugin-home';

import { PluginStore } from '@openshift/dynamic-plugin-sdk';
import { getAllThemes } from '@red-hat-developer-hub/backstage-plugin-theme';
import { ScalprumContext, ScalprumState } from '@scalprum/react-core';

import { QuickAccessApi, quickAccessApiRef } from '../src/api';
import {
  dynamicHomePagePlugin,
  CatalogStarredEntitiesCard,
  DynamicHomePage,
  DynamicHomePageProps,
  FeaturedDocsCard,
  Headline,
  JokeCard,
  Markdown,
  MarkdownCard,
  Placeholder,
  QuickAccessCard,
  RecentlyVisitedCard,
  SearchBar,
  TopVisitedCard,
  WorldClock,
  OnboardingSection,
  EntitySection,
  TemplateSection,
  DynamicCustomizableHomePage,
} from '../src/plugin';
import { homepageTranslations } from '../src/translations';
import { HomePageCardMountPoint, QuickAccessLink } from '../src/types';
import defaultQuickAccess from './quickaccess-default.json';

const defaultMountPoints: HomePageCardMountPoint[] = [
  {
    Component: OnboardingSection,
    config: {
      id: 'OnboardingSection',
      title: 'Onboarding section',
      // prettier-ignore
      layouts: {
        xl: { w: 12, h: 6 },
        lg: { w: 12, h: 6 },
        md: { w: 12, h: 7 },
        sm: { w: 12, h: 8 },
        xs: { w: 12, h: 9 },
        xxs: { w: 12, h: 14 },
      },
    },
  },
  {
    Component: EntitySection,
    config: {
      id: 'EntitySection',
      title: 'Entity section',
      // prettier-ignore
      layouts: {
        xl: { w: 12, h: 7 },
        lg: { w: 12, h: 7 },
        md: { w: 12, h: 8 },
        sm: { w: 12, h: 9 },
        xs: { w: 12, h: 11 },
        xxs: { w: 12, h: 15 },
      },
    },
  },
  {
    Component: TemplateSection,
    config: {
      id: 'TemplateSection',
      title: 'Template section',
      // prettier-ignore
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
  {
    Component: SearchBar,
    config: {
      id: 'Search',
      title: 'Search',
    },
  },
  {
    Component: QuickAccessCard,
    config: {
      id: 'QuickAccessCard',
      title: 'Quick access card',
    },
  },
  {
    Component: Headline,
    config: {
      id: 'Headline',
      title: 'Headline',
    },
  },
  {
    Component: Markdown,
    config: {
      id: 'Markdown',
      title: 'Markdown',
    },
  },
  {
    Component: MarkdownCard,
    config: {
      id: 'MarkdownCard',
      title: 'Markdown card',
    },
  },
  {
    Component: Placeholder,
    config: {
      id: 'Placeholder',
      title: 'Placeholder',
    },
  },
  {
    Component: CatalogStarredEntitiesCard,
    config: {
      id: 'CatalogStarredEntitiesCard',
      title: 'Catalog starred entities card',
    },
  },
  {
    Component: RecentlyVisitedCard as ComponentType,
    config: {
      id: 'RecentlyVisitedCard',
      title: 'Recently visited card',
    },
  },
  {
    Component: TopVisitedCard as ComponentType,
    config: {
      id: 'TopVisitedCard',
      title: 'Top visited card',
    },
  },
  {
    Component: FeaturedDocsCard as ComponentType,
    config: {
      id: 'FeaturedDocsCard',
      title: 'Featured docs card',
    },
  },
  {
    Component: JokeCard,
    config: {
      id: 'JokeCard',
      title: 'Joke card',
    },
  },
];

const createHeadline = ({
  title,
  align,
  priority,
}: {
  title: string;
  align: string;
  priority: number;
}): HomePageCardMountPoint => ({
  Component: Headline,
  config: {
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

const createPlaceholder = ({
  priority,
}: {
  priority: number;
}): HomePageCardMountPoint => ({
  Component: Placeholder,
  config: {
    priority,
    props: {
      showBorder: true,
      debugContent: '1x1',
    },
    layouts: {
      xl: { w: 1, h: 1 },
      lg: { w: 1, h: 1 },
      md: { w: 1, h: 1 },
      sm: { w: 1, h: 1 },
      xs: { w: 1, h: 1 },
      xxs: { w: 1, h: 1 },
    },
  },
});

const customizedMountPoints: HomePageCardMountPoint[] = [
  ...defaultMountPoints,
  createHeadline({ title: 'Left title', align: 'left', priority: 202 }),
  createHeadline({ title: 'Centered title', align: 'center', priority: 201 }),
  createHeadline({ title: 'Right title', align: 'right', priority: 200 }),
  createPlaceholder({ priority: 102 }),
  createPlaceholder({ priority: 101 }),
  createPlaceholder({ priority: 100 }),
];

class MockQuickAccessApi implements QuickAccessApi {
  async getQuickAccessLinks(): Promise<QuickAccessLink[]> {
    return defaultQuickAccess as QuickAccessLink[];
  }
}

const entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'random-component',
  },
};

const entities /* : Entity[]*/ = [
  {
    apiVersion: '1',
    kind: 'Component',
    metadata: {
      name: 'service-a',
      description: 'Hello, I am service A with a title',
      title: 'Service A',
    },
  },
  {
    apiVersion: '1',
    kind: 'Component',
    metadata: {
      name: 'service-b',
      description: 'Hello, I am service B',
    },
  },
  {
    apiVersion: '1',
    kind: 'Component',
    metadata: {
      name: 'service-c',
      description: 'Hello, I am service C',
    },
  },
  {
    apiVersion: '1',
    kind: 'Component',
    metadata: {
      name: 'service-d',
      description: 'Hello, I am service D',
    },
  },
];

const mockCatalogApi: Partial<CatalogApi> = {
  // getEntities: (request?: GetEntitiesRequest, options?: CatalogRequestOptions): Promise<GetEntitiesResponse>
  getEntities: async () => ({
    items: entities,
  }),
  // getEntitiesByRefs(request: GetEntitiesByRefsRequest, options?: CatalogRequestOptions): Promise<GetEntitiesByRefsResponse>
  getEntitiesByRefs: async () => ({
    items: entities,
  }),
  queryEntities: async () => ({
    items: entities,
    totalItems: entities.length,
    pageInfo: {
      nextCursor: undefined,
      prevCursor: undefined,
    },
  }),
};

const mockStarredEntitiesApi = new MockStarredEntitiesApi();
mockStarredEntitiesApi.toggleStarred('service-a');
mockStarredEntitiesApi.toggleStarred('service-b');

class MockVisitsApi implements VisitsApi {
  async list(queryParams?: VisitsApiQueryParams): Promise<Visit[]> {
    const links = [
      'example-app',
      'another-app',
      'service-a',
      'service-b',
      'service-c',
      'short',
      'long-application-name',
    ];
    const visits = links.map(link => ({
      id: link,
      name: link,
      pathname: link,
      hits: link.length,
      timestamp: Date.now() - link.length * 1000 * 60,
    }));
    if (
      queryParams?.orderBy?.[0]?.field === 'timestamp' &&
      queryParams.orderBy[0].direction === 'desc'
    ) {
      visits.sort((a, b) => b.timestamp - a.timestamp);
    }
    if (
      queryParams?.orderBy?.[0]?.field === 'hits' &&
      queryParams.orderBy[0].direction === 'desc'
    ) {
      visits.sort((a, b) => b.hits - a.hits);
    }
    return visits;
  }

  async save(): Promise<Visit> {
    throw new Error('MockVisitsApi save not implemented.');
  }
}

const createPage = ({
  navTitle,
  pageTitle,
  props,
  pageWidth,
  mountPoints,
  customizable,
}: {
  navTitle: string;
  pageTitle?: string;
  props?: DynamicHomePageProps;
  pageWidth?: number;
  mountPoints?: HomePageCardMountPoint[];
  customizable?: boolean;
}): DevAppPageOptions => {
  const backstageApis = [
    [searchApiRef, new MockSearchApi()],
    [quickAccessApiRef, new MockQuickAccessApi()],
    [catalogApiRef, mockCatalogApi],
    [starredEntitiesApiRef, mockStarredEntitiesApi],
    [visitsApiRef, new MockVisitsApi()],
  ] as const;

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

  const pageContent = (
    <TestApiProvider key={navTitle} apis={backstageApis}>
      <ScalprumContext.Provider value={scalprumState}>
        <div style={{ width: pageWidth }}>
          {customizable ? (
            <DynamicCustomizableHomePage title={pageTitle} {...props} />
          ) : (
            <DynamicHomePage title={pageTitle} {...props} />
          )}
        </div>
      </ScalprumContext.Provider>
    </TestApiProvider>
  );

  return {
    element: pageContent,
    title: navTitle,
    path: navTitle.toLocaleLowerCase('en-US').replaceAll(/[^a-z0-9]/g, '-'),
  };
};

createDevApp()
  .registerPlugin(dynamicHomePagePlugin)
  .addTranslationResource(homepageTranslations)
  .setAvailableLanguages(['en', 'de', 'es', 'fr', 'it', 'ja'])
  .setDefaultLanguage('en')
  .addThemes(getAllThemes())
  .addPage(
    createPage({
      navTitle: 'Default',
      mountPoints: defaultMountPoints,
    }),
  )
  .addPage(
    createPage({
      navTitle: 'Default small',
      pageWidth: 600,
      mountPoints: defaultMountPoints,
    }),
  )
  .addPage(
    createPage({
      navTitle: 'Default medium',
      pageWidth: 1200,
      mountPoints: defaultMountPoints,
    }),
  )
  .addPage(
    createPage({
      navTitle: 'Default large',
      pageWidth: 1600,
      mountPoints: defaultMountPoints,
    }),
  )
  .addPage(
    createPage({
      navTitle: 'Customizable',
      pageTitle: 'Customizable Homepage',
      mountPoints: customizedMountPoints,
      customizable: true,
    }),
  )
  .addPage(
    createPage({
      navTitle: 'With title',
      props: {
        title: 'Hello {{firstName}}',
      },
      mountPoints: defaultMountPoints,
    }),
  )
  .addPage(
    createPage({
      navTitle: 'With subtitle',
      props: {
        subtitle: 'Hello {{displayName}}',
      },
      mountPoints: defaultMountPoints,
    }),
  )
  .addPage(
    createPage({
      navTitle: 'With pageTitle',
      props: {
        pageTitle: 'Another page title',
      },
      mountPoints: defaultMountPoints,
    }),
  )
  .addPage(
    createPage({
      navTitle: 'With local clock',
      props: {
        localClock: {
          format: 'full',
        },
      },
      mountPoints: defaultMountPoints,
    }),
  )
  .addPage(
    createPage({
      navTitle: 'With world clocks',
      props: {
        worldClocks: [
          {
            label: 'Raleigh',
            timeZone: 'EST',
          },
          {
            label: 'London',
            timeZone: 'GMT',
          },
          {
            label: 'Brno',
            timeZone: 'CET',
          },
          {
            label: 'Bangalore',
            timeZone: 'IST',
          },
        ],
      },
      mountPoints: defaultMountPoints,
    }),
  )
  .addPage(
    createPage({
      navTitle: 'With both clocks',
      props: {
        localClock: {
          format: 'time',
        },
        worldClocks: [
          {
            label: 'Raleigh',
            timeZone: 'EST',
          },
          {
            label: 'London',
            timeZone: 'GMT',
          },
          {
            label: 'Brno',
            timeZone: 'CET',
          },
          {
            label: 'Bangalore',
            timeZone: 'IST',
          },
        ],
      },
      mountPoints: defaultMountPoints,
    }),
  )
  .addPage(
    createPage({
      navTitle: 'No configuration',
      pageTitle: 'No configuration (mountpoints not defined)',
      mountPoints: undefined,
    }),
  )
  .addPage(
    createPage({
      navTitle: 'No cards',
      pageTitle: 'No cards (empty mountpoint array)',
      mountPoints: [],
    }),
  )
  .addPage(
    createPage({
      navTitle: 'SearchBar',
      pageTitle: 'SearchBar',
      mountPoints: [
        {
          Component: SearchBar as ComponentType,
          config: {
            // prettier-ignore
            layouts: {
              xl:  { w: 2, h: 1 },
              lg:  { w: 2, h: 1 },
              md:  { w: 2, h: 1 },
              sm:  { w: 2, h: 1 },
              xs:  { w: 2, h: 1 },
              xxs: { w: 2, h: 1 },
            },
            props: {
              path: '/searchbar',
            },
          },
        },
        {
          Component: SearchBar as ComponentType,
          config: {
            // prettier-ignore
            layouts: {
              xl:  { w: 6, h: 1 },
              lg:  { w: 6, h: 1 },
              md:  { w: 6, h: 1 },
              sm:  { w: 6, h: 1 },
              xs:  { w: 6, h: 1 },
              xxs: { w: 6, h: 1 },
            },
            props: {
              path: '/searchbar',
            },
          },
        },
        {
          Component: SearchBar as ComponentType,
          config: {
            // prettier-ignore
            layouts: {
              xl:  { w: 12, h: 1 },
              lg:  { w: 12, h: 1 },
              md:  { w: 12, h: 1 },
              sm:  { w: 12, h: 1 },
              xs:  { w: 12, h: 1 },
              xxs: { w: 12, h: 1 },
            },
            props: {
              path: '/searchbar',
            },
          },
        },
      ],
    }),
  )
  .addPage(
    createPage({
      navTitle: 'QuickAccess',
      pageTitle: 'QuickAccessCard',
      mountPoints: [
        {
          Component: QuickAccessCard as ComponentType,
          config: {
            // prettier-ignore
            layouts: {
              xl:  { w:  6, h: 8 },
              lg:  { w:  6, h: 8 },
              md:  { w:  6, h: 8 },
              sm:  { w: 12, h: 8 },
              xs:  { w: 12, h: 8 },
              xxs: { w: 12, h: 8 },
            },
          },
        },
        {
          Component: QuickAccessCard as ComponentType,
          config: {
            // prettier-ignore
            layouts: {
              xl:  { w:  6, h: 8, x: 6 },
              lg:  { w:  6, h: 8, x: 6 },
              md:  { w:  6, h: 8, x: 6 },
              sm:  { w: 12, h: 8, x: 6 },
              xs:  { w: 12, h: 8, x: 6 },
              xxs: { w: 12, h: 8, x: 6 },
            },
          },
        },
      ],
    }),
  )
  .addPage(
    createPage({
      navTitle: 'Headline',
      pageTitle: 'Headline',
      mountPoints: [
        {
          Component: Headline as ComponentType,
          config: {
            // prettier-ignore
            layouts: {
              xl:  { w: 12, h: 1 },
              lg:  { w: 12, h: 1 },
              md:  { w: 12, h: 1 },
              sm:  { w: 12, h: 1 },
              xs:  { w: 12, h: 1 },
              xxs: { w: 12, h: 1 },
            },
            props: {
              title: 'A headline',
            },
          },
        },
        {
          Component: Headline as ComponentType,
          config: {
            // prettier-ignore
            layouts: {
              xl:  { w: 12, h: 1 },
              lg:  { w: 12, h: 1 },
              md:  { w: 12, h: 1 },
              sm:  { w: 12, h: 1 },
              xs:  { w: 12, h: 1 },
              xxs: { w: 12, h: 1 },
            },
            props: {
              title: 'A centered headline',
              align: 'center',
            },
          },
        },
        {
          Component: Headline as ComponentType,
          config: {
            // prettier-ignore
            layouts: {
              xl:  { w: 12, h: 1 },
              lg:  { w: 12, h: 1 },
              md:  { w: 12, h: 1 },
              sm:  { w: 12, h: 1 },
              xs:  { w: 12, h: 1 },
              xxs: { w: 12, h: 1 },
            },
            props: {
              title: 'A right-aligned headline',
              align: 'right',
            },
          },
        },
      ],
    }),
  )
  .addPage(
    createPage({
      navTitle: 'MarkdownCard',
      pageTitle: 'MarkdownCard',
      mountPoints: [
        {
          Component: MarkdownCard as ComponentType,
          config: {
            props: {
              title: 'Markdown example',
              content:
                '# Headline 1\n## Headline 2\n### Headline 3\n\nSome content',
            },
          },
        },
      ],
    }),
  )
  .addPage(
    createPage({
      navTitle: 'Markdown',
      pageTitle: 'Markdown',
      mountPoints: [
        {
          Component: Markdown as ComponentType,
          config: {
            props: {
              title: 'Markdown example',
              content:
                '# Headline 1\n## Headline 2\n### Headline 3\n\nSome content',
            },
          },
        },
      ],
    }),
  )
  .addPage(
    createPage({
      navTitle: 'Placeholder',
      pageTitle: 'Placeholder',
      mountPoints: [
        {
          Component: Placeholder as ComponentType,
          config: {
            props: {
              showBorder: true,
            },
          },
        },
      ],
    }),
  )
  .addPage(
    createPage({
      navTitle: 'CatalogStarred',
      pageTitle: 'CatalogStarredEntitiesCard',
      mountPoints: [
        {
          Component: CatalogStarredEntitiesCard,
        },
      ],
    }),
  )
  .addPage(
    createPage({
      navTitle: 'FeaturedDocs',
      pageTitle: 'FeaturedDocsCard',
      mountPoints: [
        {
          Component: FeaturedDocsCard as ComponentType,
        },
      ],
    }),
  )
  .addPage(
    createPage({
      navTitle: 'RecentlyVisitedCard',
      pageTitle: 'RecentlyVisitedCard',
      mountPoints: [
        {
          Component: RecentlyVisitedCard as ComponentType,
        },
      ],
    }),
  )
  .addPage(
    createPage({
      navTitle: 'TopVisitedCard',
      pageTitle: 'TopVisitedCard',
      mountPoints: [
        {
          Component: TopVisitedCard as ComponentType,
        },
      ],
    }),
  )
  .addPage(
    createPage({
      navTitle: 'JokeCard',
      pageTitle: 'JokeCard',
      mountPoints: [
        {
          Component: JokeCard,
        },
      ],
    }),
  )
  .addPage(
    createPage({
      navTitle: 'WorldClock',
      pageTitle: 'WorldClock',
      mountPoints: [
        {
          Component: WorldClock as ComponentType,
          config: {
            props: {
              worldClocks: [
                {
                  label: 'Raleigh',
                  timeZone: 'EST',
                },
                {
                  label: 'London',
                  timeZone: 'GMT',
                },
                {
                  label: 'Brno',
                  timeZone: 'CET',
                },
                {
                  label: 'Bangalore',
                  timeZone: 'IST',
                },
              ],
              timeFormat: {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              },
            },
          },
        },
      ],
    }),
  )
  .addPage(
    createPage({
      navTitle: 'Layout test 1',
      pageTitle: 'Layout test 1',
      mountPoints: [
        {
          Component: Placeholder as ComponentType,
          config: {
            // prettier-ignore
            layouts: {
              xl:  { w: 1, h: 1 },
              lg:  { w: 1, h: 1 },
              md:  { w: 1, h: 1 },
              sm:  { w: 1, h: 1 },
              xs:  { w: 1, h: 1 },
              xxs: { w: 1, h: 1 },
            },
            props: {
              debugContent: '1 (no x)',
              showBorder: true,
            },
          },
        },
        {
          Component: Placeholder as ComponentType,
          config: {
            // prettier-ignore
            layouts: {
              xl:  { w: 1, h: 1 },
              lg:  { w: 1, h: 1 },
              md:  { w: 1, h: 1 },
              sm:  { w: 1, h: 1 },
              xs:  { w: 1, h: 1 },
              xxs: { w: 1, h: 1 },
            },
            props: {
              debugContent: '2 (no x)',
              showBorder: true,
            },
          },
        },
        {
          Component: Placeholder as ComponentType,
          config: {
            // prettier-ignore
            layouts: {
              xl:  { w: 1, h: 1 },
              lg:  { w: 1, h: 1 },
              md:  { w: 1, h: 1 },
              sm:  { w: 1, h: 1 },
              xs:  { w: 1, h: 1 },
              xxs: { w: 1, h: 1 },
            },
            props: {
              debugContent: '3 (no x)',
              showBorder: true,
            },
          },
        },
      ],
    }),
  )
  .addPage(
    createPage({
      navTitle: 'Layout test 2',
      pageTitle: 'Layout test 2',
      mountPoints: [
        {
          Component: Placeholder as ComponentType,
          config: {
            // prettier-ignore
            layouts: {
              xl:  { w: 1, h: 1 },
              lg:  { w: 1, h: 1 },
              md:  { w: 1, h: 1 },
              sm:  { w: 1, h: 1 },
              xs:  { w: 1, h: 1 },
              xxs: { w: 1, h: 1 },
            },
            props: {
              debugContent: '1 (no x)',
              showBorder: true,
            },
          },
        },
        {
          Component: Placeholder as ComponentType,
          config: {
            // prettier-ignore
            layouts: {
              xl:  { w: 1, h: 1, x: 1 },
              lg:  { w: 1, h: 1, x: 1 },
              md:  { w: 1, h: 1, x: 1 },
              sm:  { w: 1, h: 1, x: 1 },
              xs:  { w: 1, h: 1, x: 1 },
              xxs: { w: 1, h: 1, x: 1 },
            },
            props: {
              debugContent: '2 (x=1)',
              showBorder: true,
            },
          },
        },
        {
          Component: Placeholder as ComponentType,
          config: {
            // prettier-ignore
            layouts: {
              xl:  { w: 1, h: 1, x: 2 },
              lg:  { w: 1, h: 1, x: 2 },
              md:  { w: 1, h: 1, x: 2 },
              sm:  { w: 1, h: 1, x: 2 },
              xs:  { w: 1, h: 1, x: 2 },
              xxs: { w: 1, h: 1, x: 2 },
            },
            props: {
              debugContent: '3 (x=1)',
              showBorder: true,
            },
          },
        },
      ],
    }),
  )
  .addPage(
    createPage({
      navTitle: 'Layout test 3',
      pageTitle: 'Layout test 3',
      mountPoints: [
        {
          Component: Placeholder as ComponentType,
          config: {
            // prettier-ignore
            layouts: {
              xl:  { w: 1, h: 1, x: 1, y: 1 },
              lg:  { w: 1, h: 1, x: 1, y: 1 },
              md:  { w: 1, h: 1, x: 1, y: 1 },
              sm:  { w: 1, h: 1, x: 1, y: 1 },
              xs:  { w: 1, h: 1, x: 1, y: 1 },
              xxs: { w: 1, h: 1, x: 1, y: 1 },
            },
            props: {
              debugContent: '1 (1,1)',
              showBorder: true,
            },
          },
        },
        {
          Component: Placeholder as ComponentType,
          config: {
            // prettier-ignore
            layouts: {
              xl:  { w: 1, h: 1, x: 2, y: 2 },
              lg:  { w: 1, h: 1, x: 2, y: 2 },
              md:  { w: 1, h: 1, x: 2, y: 2 },
              sm:  { w: 1, h: 1, x: 2, y: 2 },
              xs:  { w: 1, h: 1, x: 2, y: 2 },
              xxs: { w: 1, h: 1, x: 2, y: 2 },
            },
            props: {
              debugContent: '2 (2,2)',
              showBorder: true,
            },
          },
        },
        {
          Component: Placeholder as ComponentType,
          config: {
            // prettier-ignore
            layouts: {
              xl:  { w: 2, h: 2 },
              lg:  { w: 2, h: 2 },
              md:  { w: 2, h: 2 },
              sm:  { w: 2, h: 2 },
              xs:  { w: 2, h: 2 },
              xxs: { w: 2, h: 2 },
            },
            props: {
              debugContent: '3 (w=2, h=2, no x and y)',
              showBorder: true,
            },
          },
        },
      ],
    }),
  )
  .addPage(
    createPage({
      navTitle: 'Catch error',
      mountPoints: [
        {
          Component: () => {
            throw new Error();
          },
          config: {
            // prettier-ignore
            layouts: {
              xl:  { w: 2, h: 1 },
              lg:  { w: 2, h: 1 },
              md:  { w: 2, h: 1 },
              sm:  { w: 2, h: 1 },
              xs:  { w: 2, h: 1 },
              xxs: { w: 2, h: 1 },
            },
            props: {
              path: '/searchbar',
            },
          },
        },
      ],
    }),
  )
  .addPage({
    path: '/catalog',
    title: 'Catalog',
    element: <CatalogIndexPage />,
  })
  .addPage({
    path: '/catalog/:namespace/:kind/:name',
    element: <CatalogEntityPage />,
    children: (
      <EntityProvider entity={entity}>
        <EntityLayout>
          <EntityLayout.Route path="/" title="Overview">
            <h1>Overview</h1>
          </EntityLayout.Route>
        </EntityLayout>
      </EntityProvider>
    ),
  })
  .render();
