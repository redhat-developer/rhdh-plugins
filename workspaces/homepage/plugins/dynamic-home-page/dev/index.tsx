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
import { mockApis, TestApiProvider } from '@backstage/test-utils';
import { configApiRef } from '@backstage/core-plugin-api';
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
} from '../src/plugin';
import { homepageTranslations } from '../src/translations';
import { HomePageCardMountPoint, QuickAccessLink } from '../src/types';
import defaultQuickAccess from './quickaccess-default.json';
import { defaultLayouts } from '../src/defaults';

const defaultMountPoints: HomePageCardMountPoint[] = [
  {
    Component: OnboardingSection,
    config: {
      name: 'OnboardingSection',
      title: 'Onboarding section',
      layouts: defaultLayouts.onboarding,
    },
  },
  {
    Component: EntitySection,
    config: {
      name: 'EntitySection',
      title: 'Entity section',
      layouts: defaultLayouts.entity,
    },
  },
  {
    Component: TemplateSection,
    config: {
      name: 'TemplateSection',
      title: 'Template section',
      layouts: defaultLayouts.template,
    },
  },
  {
    Component: SearchBar,
    config: {
      name: 'Search',
      title: 'Search',
    },
  },
  {
    Component: QuickAccessCard,
    config: {
      name: 'QuickAccessCard',
      title: 'Quick access card',
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
      title: 'Catalog starred entities card',
    },
  },
  {
    Component: RecentlyVisitedCard as ComponentType,
    config: {
      name: 'RecentlyVisitedCard',
      title: 'Recently visited card',
    },
  },
  {
    Component: TopVisitedCard as ComponentType,
    config: {
      name: 'TopVisitedCard',
      title: 'Top visited card',
    },
  },
  {
    Component: FeaturedDocsCard as ComponentType,
    config: {
      name: 'FeaturedDocsCard',
      title: 'Featured docs card',
    },
  },
  {
    Component: JokeCard,
    config: {
      name: 'JokeCard',
      title: 'Joke card',
    },
  },
];

const customizedMountPoints: HomePageCardMountPoint[] = [
  ...defaultMountPoints,
  {
    Component: Headline,
    config: {
      priority: 202,
      props: {
        align: 'left',
        title: 'Left title',
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
  },
  {
    Component: Headline,
    config: {
      priority: 201,
      props: {
        align: 'center',
        title: 'Centered title',
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
  },
  {
    Component: Headline,
    config: {
      priority: 200,
      props: {
        align: 'right',
        title: 'Right title',
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
  },
  {
    Component: Placeholder,
    config: {
      priority: 102,
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
  },
  {
    Component: Placeholder,
    config: {
      priority: 101,
      props: {
        showBorder: true,
        debugContent: '1x1',
      },
      layouts: {
        xl: { w: 1, h: 1, x: 1 },
        lg: { w: 1, h: 1, x: 1 },
        md: { w: 1, h: 1, x: 1 },
        sm: { w: 1, h: 1, x: 1 },
        xs: { w: 1, h: 1, x: 1 },
        xxs: { w: 1, h: 1, x: 1 },
      },
    },
  },
  {
    Component: Placeholder,
    config: {
      priority: 100,
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
  },
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
      description: 'Hello, I am service A',
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
    [
      configApiRef,
      mockApis.config({
        data: {
          homepage: {
            customizable: customizable ?? false,
          },
        },
      }),
    ],
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
          <DynamicHomePage title={pageTitle} {...props} />
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
  .setAvailableLanguages(['en', 'de', 'fr', 'it', 'es'])
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
