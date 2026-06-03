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
} from '@backstage/frontend-plugin-api';
import { TranslationBlueprint } from '@backstage/plugin-app-react';
import { rootRouteRef, scorecardDrillDownRouteRef } from '../routes';
import { scorecardTranslations } from '../translations';
import { scorecardApi } from './extensions/api';
import { scorecardEntityContent } from './extensions/entityTab';
import {
  aggregatedCardWithDeprecatedMetricIdWidget,
  aggregatedCardWithDefaultAggregationWidget,
  aggregatedCardWithGithubOpenPrsWidget,
  aggregatedCardWithJiraOpenIssuesWidget,
  aggregatedCardWithGithubFilecheckLicenseWidget,
  aggregatedCardWithGithubFilecheckCodeownersWidget,
  aggregatedCardWithGithubOpenPrsWeightedWidget,
} from './extensions/homePageCards';
import { scorecardPage } from './extensions/scorecardPage';
import {
  scorecardEntityLayoutGrid,
  scorecardEntityLayoutList,
} from './extensions/scorecardLayoutExtensions';

/**
 * Extension for Scorecard translations.
 */
const scorecardTranslation = TranslationBlueprint.make({
  params: {
    resource: scorecardTranslations,
  },
});

/**
 * The primary Scorecard frontend plugin.
 * @alpha
 */
export default createFrontendPlugin({
  pluginId: 'scorecard',
  extensions: [scorecardApi, scorecardPage],
  routes: {
    root: rootRouteRef,
    drillDown: scorecardDrillDownRouteRef,
  },
});

/**
 * Catalog module that injects the Scorecard tab and its default layout
 * extensions (grid + list) into the Catalog entity pages.
 *
 * The plugin ships both layouts; platform engineers enable/disable individual
 * layouts via app-config.yaml. No separate module registration is needed
 * in App.tsx for the layouts.
 *
 * @alpha
 */
export const scorecardCatalogModule = createFrontendModule({
  pluginId: 'catalog',
  extensions: [
    scorecardEntityContent,
    scorecardEntityLayoutGrid,
    scorecardEntityLayoutList,
  ],
});

/**
 * App module that automatically registers Scorecard translations.
 * @alpha
 */
export const scorecardTranslationsModule = createFrontendModule({
  pluginId: 'app',
  extensions: [scorecardTranslation],
});

/**
 * Home module that contributes scorecard homepage widget and layout.
 * @alpha
 */
export const scorecardHomeModule = createFrontendModule({
  pluginId: 'home',
  extensions: [
    aggregatedCardWithDeprecatedMetricIdWidget,
    aggregatedCardWithDefaultAggregationWidget,
    aggregatedCardWithJiraOpenIssuesWidget,
    aggregatedCardWithGithubOpenPrsWidget,
    aggregatedCardWithGithubFilecheckLicenseWidget,
    aggregatedCardWithGithubFilecheckCodeownersWidget,
    aggregatedCardWithGithubOpenPrsWeightedWidget,
  ],
});

/**
 * Re-exporting translations for external usage.
 * @alpha
 */
export * from '../translations';
