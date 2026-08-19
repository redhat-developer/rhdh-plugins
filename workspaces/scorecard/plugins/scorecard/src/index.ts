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
 * Scorecard plugin for Backstage – entity scorecards, metrics, and entities page.
 * @packageDocumentation
 */

import {
  createFrontendModule,
  createFrontendPlugin,
} from '@backstage/frontend-plugin-api';
import { TranslationBlueprint } from '@backstage/plugin-app-react';
import { rootRouteRef, scorecardDrillDownRouteRef } from './routes';
import { scorecardTranslations } from './translations';
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
  aggregatedCardWithMaxOpenPrsWidget,
  aggregatedCardWithMinOpenPrsWidget,
  aggregatedCardWithTotalOpenBugsWidget,
  aggregatedCardWithEntitiesWithOpenPrsWidget,
  aggregatedCardWithAvgOpenPrsWidget,
} from './extensions/homePageCards';
import { scorecardPage } from './extensions/scorecardPage';
import { scorecardEntityLayoutGrid } from './extensions/scorecardLayoutExtensions';

/**
 * Extension for Scorecard translations.
 */
const scorecardTranslation = TranslationBlueprint.make({
  name: 'scorecard-translations',
  params: {
    resource: scorecardTranslations,
  },
});

/**
 * The primary Scorecard frontend plugin for the new Backstage frontend system.
 *
 * Includes page, API, entity tab, layout, and homepage widget extensions.
 * Translations remain a separate app module (NFS requirement).
 *
 * @public
 */
export default createFrontendPlugin({
  pluginId: 'scorecard',
  extensions: [
    scorecardApi,
    scorecardPage,
    scorecardEntityContent,
    scorecardEntityLayoutGrid,
    aggregatedCardWithDeprecatedMetricIdWidget,
    aggregatedCardWithDefaultAggregationWidget,
    aggregatedCardWithJiraOpenIssuesWidget,
    aggregatedCardWithGithubOpenPrsWidget,
    aggregatedCardWithGithubFilecheckLicenseWidget,
    aggregatedCardWithGithubFilecheckCodeownersWidget,
    aggregatedCardWithGithubOpenPrsWeightedWidget,
    aggregatedCardWithMaxOpenPrsWidget,
    aggregatedCardWithMinOpenPrsWidget,
    aggregatedCardWithTotalOpenBugsWidget,
    aggregatedCardWithEntitiesWithOpenPrsWidget,
    aggregatedCardWithAvgOpenPrsWidget,
  ],
  routes: {
    root: rootRouteRef,
    drillDown: scorecardDrillDownRouteRef,
  },
});

/**
 * App module that automatically registers Scorecard translations.
 * @public
 */
export const scorecardTranslationsModule = createFrontendModule({
  pluginId: 'app',
  extensions: [scorecardTranslation],
});

export { scorecardTranslationRef, scorecardTranslations } from './translations';

/**
 * Props for Scorecard entity-tab layout components.
 * @public
 */
export type { ScorecardLayoutProps } from './blueprints/ScorecardLayoutBlueprint';
