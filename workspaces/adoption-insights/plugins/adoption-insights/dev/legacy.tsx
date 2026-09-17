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

/**
 * Legacy frontend (OFS) standalone for the Adoption Insights plugin.
 */

import { ReactNode } from 'react';

import { createDevApp } from '@backstage/dev-utils';
import { getAllThemes } from '@red-hat-developer-hub/backstage-plugin-theme';
import { TestApiProvider } from '@backstage/test-utils';

import {
  adoptionInsightsPlugin,
  AdoptionInsightsPage,
} from '../src/legacy/plugin';
import { adoptionInsightsApiRef } from '../src/api';
import { adoptionInsightsTranslations } from '../src/translations';
import { CatalogEntityPage } from '@backstage/plugin-catalog';

import CatalogEntities from '../src/components/CatalogEntities';
import { DateRangeProvider } from '../src/components/Header/DateRangeContext';
import { Content, Page } from '@backstage/core-components';
import ActiveUsers from '../src/components/ActiveUsers';
import Templates from '../src/components/Templates';
import Plugins from '../src/components/Plugins';
import Techdocs from '../src/components/Techdocs';
import Searches from '../src/components/Searches';
import { MockAdoptionInsightsApiClient } from './mocks';

const AdoptionInsightsWrapper = ({ children }: { children: ReactNode }) => (
  <TestApiProvider
    apis={[[adoptionInsightsApiRef, new MockAdoptionInsightsApiClient()]]}
  >
    <Page themeId="home">
      <Content>
        <DateRangeProvider>{children}</DateRangeProvider>
      </Content>
    </Page>
  </TestApiProvider>
);

createDevApp()
  .registerPlugin(adoptionInsightsPlugin)
  .addThemes(getAllThemes())
  .addTranslationResource(adoptionInsightsTranslations)
  .setAvailableLanguages(['en', 'de', 'es', 'fr', 'it', 'ja'])
  .setDefaultLanguage('en')
  .addPage({
    element: (
      <AdoptionInsightsWrapper>
        <AdoptionInsightsPage />
      </AdoptionInsightsWrapper>
    ),
    title: 'Adoption insights Page',
    path: '/adoption-insights',
  })

  .addPage({
    path: '/active-users',
    element: (
      <AdoptionInsightsWrapper>
        <ActiveUsers />
      </AdoptionInsightsWrapper>
    ),
    title: 'Active users',
  })
  .addPage({
    path: '/templates',
    element: (
      <AdoptionInsightsWrapper>
        <Templates />
      </AdoptionInsightsWrapper>
    ),
    title: 'Top Templates',
  })
  .addPage({
    path: '/plugins',
    element: (
      <AdoptionInsightsWrapper>
        <Plugins />
      </AdoptionInsightsWrapper>
    ),
    title: 'Top Plugins',
  })
  .addPage({
    path: '/techdocs',
    element: (
      <AdoptionInsightsWrapper>
        <Techdocs />
      </AdoptionInsightsWrapper>
    ),
    title: 'Top TechDocs',
  })
  .addPage({
    path: '/searches',
    element: (
      <AdoptionInsightsWrapper>
        <Searches />
      </AdoptionInsightsWrapper>
    ),
    title: 'Top Searches',
  })
  .addPage({
    path: '/catalog/:kind/:namespace/:name',
    element: (
      <AdoptionInsightsWrapper>
        <CatalogEntityPage key="catalog-index-page" />
        <CatalogEntities />
      </AdoptionInsightsWrapper>
    ),
    title: 'Catalog Entities',
  })
  .render();
