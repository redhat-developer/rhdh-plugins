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
import type { ProviderDescriptor } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { AgenticProvider } from './providers/types';
import type { CreateProviderOptions } from './providers/factory';

/**
 * Factory function that creates an AgenticProvider from standard options.
 * Extension modules implement this to provide their own provider.
 *
 * @public
 */
export type AgenticProviderFactory = (
  options: CreateProviderOptions,
) => AgenticProvider;

/**
 * Extension point for registering custom agentic providers.
 *
 * Backend modules use this to register additional AI providers
 * (beyond the built-in ones) without forking the plugin:
 *
 * ```ts
 * import { augmentProviderExtensionPoint } from '@red-hat-developer-hub/backstage-plugin-augment-backend';
 *
 * export default createBackendModule({
 *   pluginId: 'augment',
 *   moduleId: 'my-provider',
 *   register(reg) {
 *     reg.registerInit({
 *       deps: { providers: augmentProviderExtensionPoint },
 *       async init({ providers }) {
 *         providers.registerProvider(descriptor, factory);
 *       },
 *     });
 *   },
 * });
 * ```
 *
 * @public
 */
export interface AgenticProviderExtensionPoint {
  /**
   * Register a provider implementation.
   *
   * @param descriptor - Metadata describing the provider (id, capabilities, config fields)
   * @param factory - Function that creates the provider instance
   */
  registerProvider(
    descriptor: ProviderDescriptor,
    factory: AgenticProviderFactory,
  ): void;
}

/**
 * Extension point for registering custom agentic providers.
 *
 * @public
 */
export const augmentProviderExtensionPoint =
  createExtensionPoint<AgenticProviderExtensionPoint>({
    id: 'augment.providers',
  });
