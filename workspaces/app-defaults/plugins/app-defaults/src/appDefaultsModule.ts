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

import { createFrontendModule } from '@backstage/frontend-plugin-api';
import { TranslationBlueprint } from '@backstage/plugin-app-react';
import {
  appReactTranslations,
  templateCardExtension,
} from '@red-hat-developer-hub/backstage-plugin-app-react';

import { autoLogoutElement } from './autoLogout/autoLogoutExtension';
import { appLayoutExtension } from './layout/appLayoutModule';
import { commonIconsExtension } from './icons/commonIconsExtension';
import { notFoundExtension } from './not-found/notFoundExtension';
import { localizedPageLayoutExtension } from './pageLayout/pageLayoutExtension';
import { appSidebarExtension } from './sidebar/appSidebarModule';
import { defaultSidebarExtensions } from './sidebar/defaultSidebarExtensions';
import { appDefaultsTranslations } from './translations';

/**
 * RHDH app module for `pluginId: 'app'`.
 * Provides the app layout and application drawer, the priority-ordered sidebar, the
 * extensible scaffolder template card, the common RHDH icon catalog
 * (`IconBundleBlueprint`), the localized page layout (page header title and
 * tabs), and the AutoLogout mechanism (disabled by default; opt-in via
 * `auth.autologout.enabled: true`).
 * Default-export this module for dynamic frontend loading.
 *
 * @public
 */
export const appDefaultsModule = createFrontendModule({
  pluginId: 'app',
  extensions: [
    appLayoutExtension,
    appSidebarExtension,
    ...defaultSidebarExtensions,
    templateCardExtension,
    commonIconsExtension,
    localizedPageLayoutExtension,
    notFoundExtension,
    autoLogoutElement,
  ],
});

const appDefaultsTranslation = TranslationBlueprint.make({
  params: {
    resource: appDefaultsTranslations,
  },
});

const appReactTranslation = TranslationBlueprint.make({
  name: 'app-react',
  params: {
    resource: appReactTranslations,
  },
});

/**
 * RHDH app translations module for `pluginId: 'app'`.
 * Registers the app defaults translation resource and the app-react resource
 * (catalog entity tab/group titles and page header tab titles). Must be installed separately because
 * `TranslationBlueprint` is restricted to `pluginId: 'app'`.
 * Default-export this module for dynamic frontend loading.
 *
 * @public
 */
export const appDefaultsTranslationsModule = createFrontendModule({
  pluginId: 'app',
  extensions: [appDefaultsTranslation, appReactTranslation],
});
