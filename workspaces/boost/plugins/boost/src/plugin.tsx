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
  createExtensionInput,
  createFrontendModule,
  createFrontendPlugin,
  PageBlueprint,
} from '@backstage/frontend-plugin-api';
import { TranslationBlueprint } from '@backstage/plugin-app-react';
import {
  EntityCardBlueprint,
  EntityContentBlueprint,
} from '@backstage/plugin-catalog-react/alpha';

import {
  AiCatalogFilterBlueprint,
  filterDefinitionDataRef,
} from './blueprints/AiCatalogFilterBlueprint';
import {
  categoryFilterDefinition,
  providerFilterDefinition,
  ownerFilterDefinition,
  tagsFilterDefinition,
} from './filters/builtInFilterDefinitions';
import { rootRouteRef } from './routes';
import { boostTranslations } from './translations';
import { isAiAsset } from './utils/isAiAsset';

// ---------------------------------------------------------------------------
// Built-in filter extensions
// ---------------------------------------------------------------------------
const categoryFilter = AiCatalogFilterBlueprint.make({
  name: 'category',
  params: categoryFilterDefinition,
});
const providerFilter = AiCatalogFilterBlueprint.make({
  name: 'provider',
  params: providerFilterDefinition,
});
const ownerFilter = AiCatalogFilterBlueprint.make({
  name: 'owner',
  params: ownerFilterDefinition,
});
const tagsFilter = AiCatalogFilterBlueprint.make({
  name: 'tags',
  params: tagsFilterDefinition,
});

// ---------------------------------------------------------------------------
// Page Blueprint — Browse page at /ai-catalog with extensible filter input
// ---------------------------------------------------------------------------
const aiCatalogPage = PageBlueprint.makeWithOverrides({
  name: 'ai-catalog',
  inputs: {
    filters: createExtensionInput([filterDefinitionDataRef]),
  },
  factory(originalFactory, { inputs }) {
    const filterDefs = inputs.filters
      .map(f => f.get(filterDefinitionDataRef))
      .sort((a, b) => a.priority - b.priority);

    return originalFactory({
      path: '/ai-catalog',
      routeRef: rootRouteRef,
      title: 'AI Catalog',
      loader: () =>
        import('./components/catalog').then(m => (
          <m.AiCatalogPage filters={filterDefs} />
        )),
    });
  },
});

// ---------------------------------------------------------------------------
// Entity Card Blueprints — stubs with isAiAsset filter
// ---------------------------------------------------------------------------
const summaryCard = EntityCardBlueprint.make({
  name: 'summary',
  params: {
    filter: isAiAsset,
    loader: () =>
      import('./components/catalog/entity/SummaryCard').then(m => (
        <m.SummaryCard />
      )),
  },
});

const adoptionCard = EntityCardBlueprint.make({
  name: 'adoption',
  params: {
    filter: isAiAsset,
    loader: () =>
      import('./components/catalog/entity/AdoptionCard').then(m => (
        <m.AdoptionCard />
      )),
  },
});

const versionListCard = EntityCardBlueprint.make({
  name: 'version-list',
  params: {
    filter: isAiAsset,
    loader: () =>
      import('./components/catalog/entity/VersionListCard').then(m => (
        <m.VersionListCard />
      )),
  },
});

// ---------------------------------------------------------------------------
// Entity Content Blueprint — Usage tab stub with isAiAsset filter
// ---------------------------------------------------------------------------
// TODO(RHDHPLAN-1508): Add permission check for ai-catalog.asset.read.usage-docs
// when RBAC is implemented. Currently defaults to allow per design decision 7.
const usageTab = EntityContentBlueprint.make({
  name: 'usage',
  params: {
    path: '/usage',
    title: 'Usage',
    filter: isAiAsset,
    loader: () =>
      import('./components/catalog/entity/UsageTab').then(m => <m.UsageTab />),
  },
});

// ---------------------------------------------------------------------------
// Translation Blueprint
// ---------------------------------------------------------------------------
const boostTranslation = TranslationBlueprint.make({
  params: {
    resource: boostTranslations,
  },
});

// ---------------------------------------------------------------------------
// Plugin export
// ---------------------------------------------------------------------------
/**
 * The Boost frontend plugin for RHDH.
 * @public
 */
export const boostPlugin = createFrontendPlugin({
  pluginId: 'boost',
  extensions: [
    aiCatalogPage,
    categoryFilter,
    providerFilter,
    ownerFilter,
    tagsFilter,
    summaryCard,
    adoptionCard,
    versionListCard,
    usageTab,
  ],
  routes: {
    root: rootRouteRef,
  },
});

/**
 * Translation module — must be installed separately because
 * TranslationBlueprint is restricted to pluginId 'app'.
 * @public
 */
export const boostTranslationsModule = createFrontendModule({
  pluginId: 'app',
  extensions: [boostTranslation],
});
