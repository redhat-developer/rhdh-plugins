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

import { TranslationBlueprint } from '@backstage/plugin-app-react';
import { createFrontendModule } from '@backstage/frontend-plugin-api';
import homePlugin from '@backstage/plugin-home/alpha';
import {
  catalogStarredWidget,
  disableRandomJoke,
  disableToolkit,
  entitySectionWidget,
  featuredDocsCardWidget,
  onboardingSectionWidget,
  quickAccessCardWidget,
  RecentlyVisitedWidget,
  searchBarWidget,
  templateSectionWidget,
  TopVisitedWidget,
} from './extensions/homePageCards';
import { homepageTranslations } from '../translations';

import { homePageLayoutExtension } from './extensions/homePageLayoutExtension';
import { defaultWidgetsApi, quickAccessApi } from './extensions/apis';

/**
 * Homepage extensions layered onto `@backstage/plugin-home`.
 *
 * Shared by {@link homePagePlugin} (preferred for dynamic installs)
 * and {@link homePageModule} (for apps that already register `homePlugin`).
 */
const homePageExtensions = [
  homePageLayoutExtension,
  onboardingSectionWidget,
  entitySectionWidget,
  templateSectionWidget,
  defaultWidgetsApi,
  quickAccessApi,
  quickAccessCardWidget,
  featuredDocsCardWidget,
  searchBarWidget,
  TopVisitedWidget,
  RecentlyVisitedWidget,
  catalogStarredWidget,
  disableToolkit,
  disableRandomJoke,
];

/**
 * Upstream home plugin with custom layout and widgets applied.
 *
 * Use this as the single NFS feature when the host app does not already
 * register `@backstage/plugin-home` (e.g. dynamic plugin installs).
 * The Module Federation alpha default export is this plugin so
 * `dynamicFrontendFeaturesLoader` registers `page:home`.
 *
 * @alpha
 */
export const homePagePlugin = homePlugin.withOverrides({
  extensions: homePageExtensions,
});

/**
 * Frontend module for the Dynamic Home Page plugin (New Frontend System).
 *
 * Extends the `home` plugin with a custom layout and widgets: Onboarding,
 * Entity Catalog, Templates, Quick Access, Search, Recently Visited, Top Visited, etc.
 *
 * Prefer {@link homePagePlugin} when the host does not already load
 * `@backstage/plugin-home`. Keep using this module only if `homePlugin` is
 * already in `createApp({ features })` or discovered via `app.packages`.
 *
 * @alpha
 */
export const homePageModule = createFrontendModule({
  pluginId: 'home', // upstream home!
  extensions: homePageExtensions,
});

/**
 * Translation module for the Dynamic Home Page plugin.
 *
 * @alpha
 */
export const homepageTranslationsModule = createFrontendModule({
  pluginId: 'app',
  extensions: [
    TranslationBlueprint.make({
      name: 'homepage-translations',
      params: {
        resource: homepageTranslations,
      },
    }),
  ],
});

/**
 *
 * @alpha
 */
export { homepageTranslationRef, homepageTranslations } from '../translations';

/**
 * Default export required for Module Federation to emit the `alpha` NFS expose.
 * Must be a FrontendPlugin so that the Backstage instance registers `page:home` without a
 * separate `@backstage/plugin-home` install.
 *
 * @alpha
 */
export default homePagePlugin;
