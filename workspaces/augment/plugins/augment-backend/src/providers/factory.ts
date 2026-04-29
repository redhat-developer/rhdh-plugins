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
 * Provider Factory
 *
 * Creates the correct AgenticProvider based on app-config.yaml.
 * The provider type is read from `augment.provider` (default: 'llamastack').
 *
 * Built-in providers are handled directly. External providers registered
 * via the extension point are looked up from the dynamic factory registry.
 */

import type {
  LoggerService,
  RootConfigService,
  DatabaseService,
} from '@backstage/backend-plugin-api';
import type { ProviderType } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { AdminConfigService } from '../services/AdminConfigService';
import type { AgenticProvider } from './types';
import type { AgenticProviderFactory } from '../extensions';
import { ResponsesApiProvider } from './llamastack';
import { KagentiProvider } from './kagenti';

export type { ProviderType };

/**
 * Options for creating an AgenticProvider instance.
 * @public
 */
export interface CreateProviderOptions {
  logger: LoggerService;
  config: RootConfigService;
  database?: DatabaseService;
  adminConfig?: AdminConfigService;
}

/**
 * Dynamically registered provider factories from extension modules.
 * Populated at startup via {@link registerProviderFactory}.
 */
const dynamicFactories = new Map<string, AgenticProviderFactory>();

/**
 * Register an external provider factory.
 *
 * Called during plugin initialization by the extension point wiring.
 *
 * @param id - The provider type identifier
 * @param factory - Factory function that creates the provider instance
 * @internal
 */
export function registerProviderFactory(
  id: string,
  factory: AgenticProviderFactory,
): void {
  dynamicFactories.set(id, factory);
}

/**
 * Creates an AgenticProvider instance based on configuration.
 *
 * Reads `augment.provider` from app-config.yaml to determine which
 * provider to instantiate. Defaults to 'llamastack' if not specified.
 * Built-in providers are handled by a direct switch; extension-registered
 * providers are resolved from the dynamic factory registry.
 *
 * @param options - Provider dependencies
 * @param overrideType - Override the provider type (used by ProviderManager for hot-swap)
 * @returns An uninitialized AgenticProvider instance
 * @internal
 */
export function createProvider(
  options: CreateProviderOptions,
  overrideType?: ProviderType,
): AgenticProvider {
  const { logger, config, database, adminConfig } = options;

  const providerType: ProviderType =
    overrideType ??
    (config.getOptionalString('augment.provider') || 'llamastack');

  logger.info(`Creating agentic provider: ${providerType}`);

  switch (providerType) {
    case 'llamastack':
      return new ResponsesApiProvider({
        logger,
        config,
        database,
        adminConfig,
      });

    case 'kagenti':
      return new KagentiProvider({
        logger,
        config,
        adminConfig,
      });

    case 'googleadk':
      throw new Error(
        'Google ADK provider is not yet implemented. ' +
          'Set augment.provider to "llamastack" in app-config.yaml.',
      );

    default: {
      const externalFactory = dynamicFactories.get(providerType);
      if (externalFactory) {
        return externalFactory(options);
      }
      throw new Error(
        `Unknown agentic provider: "${providerType}". ` +
          `Check augment.provider in app-config.yaml. ` +
          `Available providers: llamastack, kagenti, googleadk${
            dynamicFactories.size > 0
              ? `, ${[...dynamicFactories.keys()].join(', ')}`
              : ''
          }`,
      );
    }
  }
}
