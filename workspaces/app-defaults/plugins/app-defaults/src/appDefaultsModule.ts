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
import {
  appDrawerExtension,
  templateCardExtension,
} from '@red-hat-developer-hub/backstage-plugin-app-react';

import { commonIconsExtension } from './icons/commonIconsExtension';

/**
 * RHDH app module for `pluginId: 'app'`.
 * Provides the application drawer, the extensible scaffolder template card,
 * and the common RHDH icon catalog (`IconBundleBlueprint`).
 * Default-export this module for dynamic frontend loading.
 *
 * @public
 */
export const appDefaultsModule = createFrontendModule({
  pluginId: 'app',
  extensions: [appDrawerExtension, templateCardExtension, commonIconsExtension],
});
