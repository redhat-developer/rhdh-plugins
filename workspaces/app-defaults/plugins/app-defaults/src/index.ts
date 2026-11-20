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
 * RHDH app module for the new frontend system.
 *
 * @packageDocumentation
 */

import { createFrontendFeatureLoader } from '@backstage/frontend-plugin-api';

import {
  appDefaultsModule,
  appDefaultsTranslationsModule,
} from './appDefaultsModule';
import { appDefaultsTranslations } from './translations';
import { learningPathsModule } from './learning-paths';

export { appDefaultsModule };

export { appDefaultsTranslationsModule };

export { appDefaultsTranslations };

export { appDefaultsTranslationRef } from './translations';

export { autoLogoutElement } from './autoLogout/autoLogoutExtension';

export {
  appDrawerExtension,
  appDrawerModule,
  appLayoutExtension,
  appLayoutModule,
} from './layout/appLayoutModule';

export { learningPathsModule } from './learning-paths';

export { localizedPageLayoutExtension } from './pageLayout/pageLayoutExtension';

export { catalogModule } from './catalog/catalogModule';

export {
  appSidebarExtension,
  appSidebarModule,
} from './sidebar/appSidebarModule';
export { AppSidebar } from './sidebar/AppSidebar';
export type { AppSidebarProps } from './sidebar/AppSidebar';
export {
  CompanyLogo,
  useBrandingFullLogo,
  useBrandingIconLogo,
} from './sidebar/logo';
export type { CompanyLogoProps, LogoURLs } from './sidebar/logo';

/**
 * Feature loader that registers the RHDH app defaults module, the
 * translations module, and learning paths.
 *
 * Plugin overrides (catalog, catalog graph, scaffolder, API docs, TechDocs)
 * are available as individual subpath exports (e.g. `./catalog-plugin-override`)
 * so they can be loaded conditionally when their respective plugins are enabled.
 *
 * @public
 */
export default createFrontendFeatureLoader({
  loader() {
    return [
      appDefaultsModule,
      appDefaultsTranslationsModule,
      learningPathsModule,
    ];
  },
});
