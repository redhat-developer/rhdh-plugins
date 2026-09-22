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

import type {
  CacheService,
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import type { KagentiConnectionConfig } from '../types';
import { KagentiProvider } from './KagentiProvider';
import { AgentCardCache } from './AgentCardCache';
import { KeycloakTokenCache } from './KeycloakTokenCache';
import { SessionMap } from './SessionMap';
import { KeycloakAuthClient } from '@red-hat-developer-hub/backstage-plugin-boost-node';
import { KagentiApiClient } from './KagentiApiClient';

/**
 * Options for creating a {@link KagentiProviderFactory}.
 *
 * @internal
 */
export interface KagentiProviderFactoryOptions {
  config: RootConfigService;
  cache: CacheService;
  logger: LoggerService;
}

/**
 * Factory for creating a fully-wired {@link KagentiProvider} instance
 * with all caches initialized from Backstage services.
 *
 * Reads connection settings from `boost.providers.kagenti` in app-config.yaml
 * and initializes:
 * - {@link AgentCardCache} (5m TTL, task 3.3)
 * - {@link KeycloakTokenCache} (dynamic TTL, task 3.4)
 * - {@link SessionMap} (24h TTL, task 3.7)
 *
 * @internal
 */
export class KagentiProviderFactory {
  private readonly config: RootConfigService;
  private readonly cache: CacheService;
  private readonly logger: LoggerService;

  constructor(options: KagentiProviderFactoryOptions) {
    this.config = options.config;
    this.cache = options.cache;
    this.logger = options.logger;
  }

  /**
   * Create the provider and all associated caches.
   *
   * @returns An object containing the provider and its cache services.
   */
  create(): KagentiProviderBundle {
    const connection = this.readConnectionConfig();

    this.logger.info(
      `Creating Kagenti provider for endpoint: ${connection.baseUrl}`,
    );

    const agentCardCache = new AgentCardCache({
      cache: this.cache,
      logger: this.logger,
    });

    const keycloakTokenCache = new KeycloakTokenCache({
      cache: this.cache,
      logger: this.logger,
    });

    const sessionMap = new SessionMap({
      cache: this.cache,
      logger: this.logger,
    });

    // Read Keycloak auth config and construct auth client + API client
    const authConfig = this.readKagentiAuthConfig();
    let apiClient: KagentiApiClient | undefined;
    if (authConfig) {
      const authClient = new KeycloakAuthClient(
        authConfig,
        authConfig.tokenExpiryBufferSeconds,
      );
      apiClient = new KagentiApiClient({
        baseUrl: connection.baseUrl,
        logger: this.logger,
        authClient,
      });
      this.logger.info(
        'Keycloak service-account auth configured for Kagenti provider',
      );
    }

    const provider = new KagentiProvider({
      connection,
      logger: this.logger,
      apiClient,
    });

    return {
      provider,
      agentCardCache,
      keycloakTokenCache,
      sessionMap,
    };
  }

  /**
   * Read Keycloak service-account auth config from app-config.yaml.
   *
   * Returns the config only when all three required fields are present.
   * Logs a warning when a partial set of fields is found (constraint 3).
   */
  private readKagentiAuthConfig():
    | {
        tokenEndpoint: string;
        clientId: string;
        clientSecret: string;
        tokenExpiryBufferSeconds?: number;
      }
    | undefined {
    const authConfig = this.config.getOptionalConfig('boost.kagenti.auth');
    if (!authConfig) {
      return undefined;
    }

    const tokenEndpoint = authConfig.getOptionalString('tokenEndpoint');
    const clientId = authConfig.getOptionalString('clientId');
    const clientSecret = authConfig.getOptionalString('clientSecret');
    const tokenExpiryBufferSeconds = authConfig.getOptionalNumber(
      'tokenExpiryBufferSeconds',
    );

    if (tokenEndpoint && clientId && clientSecret) {
      return {
        tokenEndpoint,
        clientId,
        clientSecret,
        tokenExpiryBufferSeconds,
      };
    }

    const present = [
      tokenEndpoint && 'tokenEndpoint',
      clientId && 'clientId',
      clientSecret && 'clientSecret',
    ].filter(Boolean);
    if (present.length > 0) {
      const missing = ['tokenEndpoint', 'clientId', 'clientSecret'].filter(
        k => !present.includes(k),
      );
      this.logger.warn(
        `Partial Kagenti auth config: found ${present.join(', ')} but missing ${missing.join(', ')}. Auth disabled.`,
      );
    }

    return undefined;
  }

  /**
   * Read Kagenti connection settings from app-config.yaml.
   *
   * Expected config shape:
   * ```yaml
   * boost:
   *   providers:
   *     kagenti:
   *       baseUrl: http://localhost:8080
   *       defaultAgent: default
   * ```
   */
  private readConnectionConfig(): KagentiConnectionConfig {
    const providerConfig = this.config.getOptionalConfig(
      'boost.providers.kagenti',
    );

    if (!providerConfig) {
      const securityMode =
        this.config.getOptionalString('boost.security.mode') ??
        'development-only-no-auth';

      if (securityMode === 'development-only-no-auth') {
        this.logger.warn(
          'No boost.providers.kagenti config found. ' +
            'Using default connection settings (http://localhost:8080). ' +
            'This is only permitted in development-only-no-auth mode.',
        );
        return {
          baseUrl: 'http://localhost:8080',
        };
      }

      throw new Error(
        'Missing required config: boost.providers.kagenti.baseUrl. ' +
          'The Kagenti provider module requires connection configuration ' +
          'when security mode is not development-only-no-auth.',
      );
    }

    return {
      baseUrl: providerConfig.getString('baseUrl'),
      defaultAgent: providerConfig.getOptionalString('defaultAgent'),
    };
  }
}

/**
 * The provider and all associated cache services created by the factory.
 *
 * @internal
 */
export interface KagentiProviderBundle {
  /** The AI provider instance. */
  provider: KagentiProvider;
  /** Agent card cache (5m TTL). */
  agentCardCache: AgentCardCache;
  /** Keycloak token cache (dynamic TTL per token). */
  keycloakTokenCache: KeycloakTokenCache;
  /** Conversation session map (24h TTL). */
  sessionMap: SessionMap;
}
