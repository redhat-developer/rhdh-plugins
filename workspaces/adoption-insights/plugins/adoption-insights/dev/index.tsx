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
import { getAllThemes } from '@redhat-developer/red-hat-developer-hub-theme';
import { TestApiProvider } from '@backstage/test-utils';

import { adoptionInsightsPlugin, AdoptionInsightsPage } from '../src/plugin';
import { adoptionInsightsApiRef } from '../src/api';
import {
  AdoptionInsightsApi,
  CatalogEntitiesOptions,
  PluginViewsOptions,
  TechdocsOptions,
  TemplatesOptions,
} from '../src/types';
import { mockPluginViews } from './__data__/pluginViews';
import { mockCatalogEntities } from './__data__/catalogEntities';
import { mockTemplates } from './__data__/templates';
import { mockTechdocs } from './__data__/techdocs';

export class MockAdoptionInsightsApiClient implements AdoptionInsightsApi {
  async getPluginViews(_options: PluginViewsOptions): Promise<any> {
    return mockPluginViews;
  }

  async getCatalogEntities(_options: CatalogEntitiesOptions): Promise<any> {
    return mockCatalogEntities;
  }

  async getTemplates(_options: TemplatesOptions): Promise<any> {
    return mockTemplates;
  }

  async getTechdocs(_options: TechdocsOptions): Promise<any> {
    return mockTechdocs;
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
