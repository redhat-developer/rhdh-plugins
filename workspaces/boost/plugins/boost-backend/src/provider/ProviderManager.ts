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

import { NotFoundError } from '@backstage/errors';
import type {
  AgenticProvider,
  ProviderDescriptor,
} from '@red-hat-developer-hub/backstage-plugin-boost-common';

/**
 * Manages registered AI providers and tracks the active provider.
 *
 * Provider modules register via the `boostProviderExtensionPoint`.
 * The active provider is resolved by `boostAiProviderServiceRef`.
 *
 * @public
 */
export class ProviderManager {
  private activeProvider: AgenticProvider | undefined;
  private readonly providers = new Map<string, AgenticProvider>();

  /**
   * Register an AI provider. The first provider registered becomes
   * the active provider automatically.
   */
  registerProvider(provider: AgenticProvider): void {
    const id = provider.descriptor.id;
    if (this.providers.has(id)) {
      throw new Error(`Provider "${id}" is already registered`);
    }
    this.providers.set(id, provider);
    if (!this.activeProvider) {
      this.activeProvider = provider;
    }
  }

  /**
   * Returns the currently active provider.
   *
   * @throws Error if no provider has been registered.
   */
  getActiveProvider(): AgenticProvider {
    if (!this.activeProvider) {
      throw new NotFoundError(
        'No AI provider is registered. Install a provider module ' +
          '(e.g., boost-backend-module-llamastack) to register a provider.',
      );
    }
    return this.activeProvider;
  }

  /**
   * Switch the active provider to a different registered provider.
   *
   * @param providerId - The ID of the provider to switch to.
   * @throws Error if the provider is not registered.
   */
  switchProvider(providerId: string): void {
    const provider = this.providers.get(providerId);
    if (!provider) {
      const available = Array.from(this.providers.keys()).join(', ');
      throw new Error(
        `Provider "${providerId}" is not registered. ` +
          `Available providers: ${available || '(none)'}`,
      );
    }
    this.activeProvider = provider;
  }

  /**
   * Returns descriptors for all registered providers.
   */
  getRegisteredProviders(): ProviderDescriptor[] {
    return Array.from(this.providers.values()).map(p => p.descriptor);
  }

  /**
   * Returns whether any provider has been registered.
   */
  hasProvider(): boolean {
    return this.providers.size > 0;
  }
}
