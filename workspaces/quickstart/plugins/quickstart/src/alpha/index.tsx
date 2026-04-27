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
  AppRootElementBlueprint,
  createFrontendModule,
  createFrontendPlugin,
} from '@backstage/frontend-plugin-api';
import { TranslationBlueprint } from '@backstage/plugin-app-react';
import { AppDrawerContentBlueprint } from '@red-hat-developer-hub/backstage-plugin-app-react/alpha';
import { GlobalHeaderMenuItemBlueprint } from '@red-hat-developer-hub/backstage-plugin-global-header/alpha';

import { quickstartTranslations } from '../translations';
import { QUICKSTART_DRAWER_ID } from './const';
import { QuickstartDrawerContent } from './QuickstartDrawerContent';
import { QuickstartHelpMenuItem } from './QuickstartHelpMenuItem';
import { QuickstartInit } from './QuickstartInit';

const quickstartDrawer = AppDrawerContentBlueprint.make({
  name: 'quickstart',
  params: {
    id: QUICKSTART_DRAWER_ID,
    element: <QuickstartDrawerContent />,
    resizable: true,
    defaultWidth: 500,
  },
});

const quickstartHelpMenuItem = GlobalHeaderMenuItemBlueprint.make({
  name: 'quickstart',
  params: {
    target: 'help',
    component: QuickstartHelpMenuItem,
    priority: 50,
  },
});

const quickstartInitElement = AppRootElementBlueprint.make({
  name: 'quickstart-init',
  params: {
    element: <QuickstartInit />,
  },
});

/**
 * The Quickstart frontend plugin for the new Backstage frontend system.
 *
 * @alpha
 */
export default createFrontendPlugin({
  pluginId: 'quickstart',
  extensions: [quickstartDrawer, quickstartHelpMenuItem],
});

/**
 * Quickstart initialization module.
 * Handles first-visit auto-open and snackbar notifications.
 *
 * @alpha
 */
export const quickstartInitModule = createFrontendModule({
  pluginId: 'app',
  extensions: [quickstartInitElement],
});

/**
 * Translation module for the quickstart plugin.
 *
 * @alpha
 */
export const quickstartTranslationsModule = createFrontendModule({
  pluginId: 'app',
  extensions: [
    TranslationBlueprint.make({
      name: 'quickstart-translations',
      params: {
        resource: quickstartTranslations,
      },
    }),
  ],
});

export {
  quickstartTranslationRef,
  quickstartTranslations,
} from '../translations';
