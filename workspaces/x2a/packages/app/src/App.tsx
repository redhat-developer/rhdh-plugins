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
import userSettingsPlugin from '@backstage/plugin-user-settings/alpha';
import x2aPlugin, {
  x2aTranslationsModule,
} from '@red-hat-developer-hub/backstage-plugin-x2a/alpha';
import { rhdhThemeModule } from '@red-hat-developer-hub/backstage-plugin-theme/alpha';
import { navModule } from './modules/nav';

export default createApp({
  features: [
    rhdhThemeModule,
    navModule,
    catalogPlugin,
    scaffolderPlugin,
    userSettingsPlugin,
    x2aPlugin,
    x2aTranslationsModule,
  ],
});
