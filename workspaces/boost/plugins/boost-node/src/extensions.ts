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

import { createExtensionPoint } from '@backstage/backend-plugin-api';
import type { AgenticProvider } from '@red-hat-developer-hub/backstage-plugin-boost-common';

/**
 * Interface for the boost provider extension point. Backend modules
 * use this to register AI provider implementations.
 *
 * @public
 */
export interface BoostProviderExtensionPoint {
  /**
   * Register an AI provider implementation.
   *
   * @param provider - The provider to register.
   */
  registerProvider(provider: AgenticProvider): void;
}

/**
 * Extension point for registering AI providers with the boost plugin.
 *
 * Backend modules use this to register additional AI providers:
 *
 * ```ts
 * import { boostProviderExtensionPoint } from '@red-hat-developer-hub/backstage-plugin-boost-node';
 *
 * export default createBackendModule({
 *   pluginId: 'boost',
 *   moduleId: 'my-provider',
 *   register(reg) {
 *     reg.registerInit({
 *       deps: { providers: boostProviderExtensionPoint },
 *       async init({ providers }) {
 *         providers.registerProvider(myProvider);
 *       },
 *     });
 *   },
 * });
 * ```
 *
 * @public
 */
export const boostProviderExtensionPoint =
  createExtensionPoint<BoostProviderExtensionPoint>({
    id: 'boost.provider',
  });
