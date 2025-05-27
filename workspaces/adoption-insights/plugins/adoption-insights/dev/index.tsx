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

createDevApp()
  .registerPlugin(adoptionInsightsPlugin)
  .addThemes(getAllThemes())
  .addPage({
    element: (
      <TestApiProvider
        apis={[[adoptionInsightsApiRef, new MockAdoptionInsightsApiClient()]]}
      >
        <AdoptionInsightsPage />
      </TestApiProvider>
    ),
    title: 'Root Page',
    path: '/adoption-insights',
  })
  .render();
