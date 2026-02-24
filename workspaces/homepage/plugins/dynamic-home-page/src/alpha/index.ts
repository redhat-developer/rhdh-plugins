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
import {
  catalogStarredWidget,
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
import { homepageTranslations } from './translations';

import { homePageLayoutExtension } from './extensions/homePageLayoutExtension';
import { quickAccessApi } from './extensions/apis';

/**
 * Frontend module for the Dynamic Home Page plugin (New Frontend System).
 *
 * Extends the `home` plugin with a custom layout and RHDH widgets: Onboarding,
 * Entity Catalog, Templates, Quick Access, Search, Recently Visited, Top Visited, etc.
 * Add to your app's `createApp({ features: [..., homePageDevModule] })`.
 *
 * @alpha
 */
export const homePageDevModule = createFrontendModule({
  pluginId: 'home',
  extensions: [
    homePageLayoutExtension,
    onboardingSectionWidget,
    entitySectionWidget,
    templateSectionWidget,
    quickAccessApi,
    quickAccessCardWidget,
    featuredDocsCardWidget,
    searchBarWidget,
    TopVisitedWidget,
    RecentlyVisitedWidget,
    catalogStarredWidget,
    disableToolkit,
  ],
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

export { homepageTranslationRef, homepageTranslations } from './translations';
