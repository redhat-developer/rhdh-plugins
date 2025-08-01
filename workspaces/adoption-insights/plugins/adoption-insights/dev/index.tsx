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
import { ReactNode } from 'react';

import { createDevApp } from '@backstage/dev-utils';
import { getAllThemes } from '@red-hat-developer-hub/backstage-plugin-theme';
import { TestApiProvider } from '@backstage/test-utils';

import { adoptionInsightsPlugin, AdoptionInsightsPage } from '../src/plugin';
import { adoptionInsightsApiRef } from '../src/api';
import {
  ActiveUsersResponse,
  AdoptionInsightsApi,
  APIsViewOptions,
  CatalogEntitiesResponse,
  PluginTrendResponse,
  SearchesResponse,
  TechdocsResponse,
  TemplatesResponse,
  UsersResponse,
} from '../src/types';
import { mockPluginViews } from './__data__/plugins';
import mockCatalogEntities from './__data__/catalogEntities';
import mockTemplates from './__data__/templates';
import mockActiveUsers from './__data__/activeUsers';
import mockTechdocs from './__data__/techdocs';
import mockSearches from './__data__/searches';
import mockUsers from './__data__/users';
import { CatalogEntityPage } from '@backstage/plugin-catalog';

import CatalogEntities from '../src/components/CatalogEntities';
import { DateRangeProvider } from '../src/components/Header/DateRangeContext';
import { Content, Page } from '@backstage/core-components';
import ActiveUsers from '../src/components/ActiveUsers';
import Templates from '../src/components/Templates';
import Plugins from '../src/components/Plugins';
import Techdocs from '../src/components/Techdocs';
import Searches from '../src/components/Searches';

export class MockAdoptionInsightsApiClient implements AdoptionInsightsApi {
  async getPlugins(_options: APIsViewOptions): Promise<PluginTrendResponse> {
    return mockPluginViews;
  }
  async getCatalogEntities(
    _options: APIsViewOptions,
  ): Promise<CatalogEntitiesResponse> {
    return mockCatalogEntities;
  }
  async getTemplates(_options: APIsViewOptions): Promise<TemplatesResponse> {
    return mockTemplates;
  }
  async getTechdocs(_options: APIsViewOptions): Promise<TechdocsResponse> {
    return mockTechdocs;
  }
  async getActiveUsers(
    _options: APIsViewOptions,
  ): Promise<ActiveUsersResponse> {
    return mockActiveUsers;
  }
  async getSearches(_options: APIsViewOptions): Promise<SearchesResponse> {
    return mockSearches;
  }
  async getUsers(_options: APIsViewOptions): Promise<UsersResponse> {
    return mockUsers;
  }
  async downloadBlob(_options: APIsViewOptions): Promise<void> {
    return Promise.resolve();
  }
}

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
