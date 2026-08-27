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

import { createApp } from '@backstage/frontend-defaults';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import scaffolderPlugin from '@backstage/plugin-scaffolder/alpha';
import { appAuthModule } from '@red-hat-developer-hub/backstage-plugin-app-auth';
import { appDefaultsModule } from '@red-hat-developer-hub/backstage-plugin-app-defaults';
import { appIntegrationsModule } from '@red-hat-developer-hub/backstage-plugin-app-integrations';
import {
  globalHeaderModule,
  globalHeaderTranslationsModule,
} from '@red-hat-developer-hub/backstage-plugin-global-header/alpha';
import { navModule } from './modules/nav';
import { drawerDemoModule } from './modules/drawer-demo';
import { templateCardDemoModule } from './modules/template-card-demo';

export default createApp({
  features: [
    catalogPlugin,
    scaffolderPlugin,
    navModule,
    appAuthModule,
    appIntegrationsModule,
    // Production path: one module (drawer + template card + common icons)
    appDefaultsModule,
    drawerDemoModule,
    templateCardDemoModule,
    globalHeaderModule,
    globalHeaderTranslationsModule,
  ],
});
