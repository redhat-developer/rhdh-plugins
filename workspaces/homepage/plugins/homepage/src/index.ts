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
 * Dynamic Home Page plugin for the New Frontend System.
 *
 * @packageDocumentation
 */

import { unstable_ClassNameGenerator as ClassNameGenerator } from '@mui/material/className';

ClassNameGenerator.configure(componentName => {
  return componentName.startsWith('v5-')
    ? componentName
    : `v5-${componentName}`;
});

import { TranslationBlueprint } from '@backstage/plugin-app-react';
import {
  createFrontendModule,
  createFrontendPlugin,
} from '@backstage/frontend-plugin-api';
import {
  catalogStarredWidget,
  communityHomeWidgets,
  disableRandomJoke,
  disableToolkit,
  entitySectionWidget,
  featuredDocsCardWidget,
  onboardingSectionWidget,
  overrideHomeCatalogStarredWidget,
  quickAccessCardWidget,
  RecentlyVisitedWidget,
  searchBarWidget,
  templateSectionWidget,
  TopVisitedWidget,
} from './extensions/homePageCards';
import { homepageTranslations } from './translations';
import { homePageLayoutExtension } from './extensions/homePageLayoutExtension';
import { homepagePage, homepageRouteRef } from './extensions/homepagePage';
import { defaultWidgetsApi, quickAccessApi } from './extensions/apis';

/**
 * Extensions owned by the homepage plugin.
 *
 * Widgets/layout attach to `page:homepage`. Persona filtering via
 * homepage-backend is applied only by that layout.
 */
const homepageExtensions = [
  homepagePage,
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
];

/**
 * Homepage frontend plugin (`pluginId: homepage`).
 *
 * @public
 */
export const homepagePlugin = createFrontendPlugin({
  pluginId: 'homepage',
  extensions: homepageExtensions,
  routes: {
    root: homepageRouteRef,
  },
});

/**
 * Optional module for when community `@backstage/plugin-home` is also installed.
 *
 * Mirrors RH widgets onto `page:home` (no RH layout / no homepage-backend
 * filtering) and disables community toolkit / joke / starred demos.
 *
 * @public
 */
export const homepageHomeModule = createFrontendModule({
  pluginId: 'home',
  extensions: [
    ...communityHomeWidgets,
    overrideHomeCatalogStarredWidget,
    disableToolkit,
    disableRandomJoke,
  ],
});

/**
 * @public
 * @deprecated Use {@link homepageHomeModule}.
 */
export { homepageHomeModule as homePageModule };

/**
 * @public
 * @deprecated Use {@link homepagePlugin}.
 */
export { homepagePlugin as homePagePlugin };

/**
 * Translation module for the Dynamic Home Page plugin.
 *
 * @public
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

export { homepageRouteRef } from './extensions/homepagePage';

/**
 * Default export required for Module Federation to emit the NFS expose.
 *
 * @public
 */
export default homepagePlugin;
