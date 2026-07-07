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
  createFrontendModule,
  createFrontendPlugin,
  PageBlueprint,
} from '@backstage/frontend-plugin-api';
import { TranslationBlueprint } from '@backstage/plugin-app-react';
import {
  EntityCardBlueprint,
  EntityContentBlueprint,
} from '@backstage/plugin-catalog-react/alpha';

import { rootRouteRef } from './routes';
import { boostTranslations } from './translations';
import { isAiAsset } from './utils/isAiAsset';

// ---------------------------------------------------------------------------
// Page Blueprint — Browse page at /ai-catalog
// ---------------------------------------------------------------------------
const aiCatalogPage = PageBlueprint.make({
  params: {
    path: '/ai-catalog',
    routeRef: rootRouteRef,
    title: 'AI Catalog',
    loader: () => import('./components/catalog').then(m => <m.AiCatalogPage />),
  },
});

// ---------------------------------------------------------------------------
// Entity Card Blueprints — stubs with isAiAsset filter
// ---------------------------------------------------------------------------
const aiAssetSummaryCard = EntityCardBlueprint.make({
  name: 'ai-asset-summary',
  params: {
    filter: isAiAsset,
    loader: () =>
      import('./components/catalog/AiAssetSummaryCard').then(m => (
        <m.AiAssetSummaryCard />
      )),
  },
});

const downloadAdoptCard = EntityCardBlueprint.make({
  name: 'download-adopt',
  params: {
    filter: isAiAsset,
    loader: () =>
      import('./components/catalog/DownloadAdoptCard').then(m => (
        <m.DownloadAdoptCard />
      )),
  },
});

const versionListCard = EntityCardBlueprint.make({
  name: 'version-list',
  params: {
    filter: isAiAsset,
    loader: () =>
      import('./components/catalog/VersionListCard').then(m => (
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
      import('./components/catalog/UsageTab').then(m => <m.UsageTab />),
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
    aiAssetSummaryCard,
    downloadAdoptCard,
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
