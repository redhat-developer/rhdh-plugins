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

export * from './AppDrawerContentBlueprint';
export * from './appDrawerContentDataRef';
export * from './appDrawerExtension';

import { appDrawerExtension } from './appDrawerExtension';

/**
 * @public
 */
export const appDrawerExtensions = [appDrawerExtension];

/**
 * Frontend module that provides (only) the app drawer system.
 * Registers a wrapper extension that renders the drawer and accepts
 * drawer content contributions via inputs.
 *
 * @public
 */
export const appDrawerModule = createFrontendModule({
  pluginId: 'app',
  extensions: appDrawerExtensions,
});
