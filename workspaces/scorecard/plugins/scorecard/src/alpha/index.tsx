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
import { rootRouteRef } from '../routes';
import { scorecardTranslations } from '../translations';
import { scorecardApi } from './extensions/api';
import { scorecardEntityContent } from './extensions/entityTab';
import {
  scorecardHomepageWidget,
  scorecardJiraHomepageWidget,
} from './extensions/homePageCards';
import { scorecardPage } from './extensions/metricPage';

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
  },
});

/**
 * Catalog module that automatically injects the Scorecard tab into the Catalog.
 * @alpha
 */
export const scorecardCatalogModule = createFrontendModule({
  pluginId: 'catalog',
  extensions: [scorecardEntityContent],
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
  extensions: [scorecardHomepageWidget, scorecardJiraHomepageWidget],
});

/**
 * Re-exporting translations for external usage.
 * @alpha
 */
export * from '../translations';
