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
import type { LlamaStackConnectionConfig } from '../types';
import { ResponsesApiProvider } from './ResponsesApiProvider';
import { ModelListCache } from './ModelListCache';
import { McpAuthTokenCache } from './McpAuthTokenCache';
import { ClientManager } from './ClientManager';
import { SessionMap } from './SessionMap';

/**
 * Options for creating a {@link ResponsesApiProviderFactory}.
 *
 * @internal
 */
export interface ResponsesApiProviderFactoryOptions {
  config: RootConfigService;
  cache: CacheService;
  logger: LoggerService;
}

/**
 * Factory for creating a fully-wired {@link ResponsesApiProvider} instance
 * with all caches initialized from Backstage services.
 *
 * Reads connection settings from `boost.providers.llamastack` in app-config.yaml
 * and initializes:
 * - {@link ModelListCache} (60s TTL, task 3.2)
 * - {@link McpAuthTokenCache} (dynamic TTL, task 3.5)
 * - {@link ClientManager} (identity-keyed, 1h TTL, task 3.8)
 * - {@link SessionMap} (24h TTL, platform-ops task 1.5)
 *
 * @internal
 */
export class ResponsesApiProviderFactory {
  private readonly config: RootConfigService;
  private readonly cache: CacheService;
  private readonly logger: LoggerService;

  constructor(options: ResponsesApiProviderFactoryOptions) {
    this.config = options.config;
    this.cache = options.cache;
    this.logger = options.logger;
  }

  /**
   * Create the provider and all associated caches.
   *
   * @returns An object containing the provider and its cache services.
   */
  create(): ResponsesApiProviderBundle {
    const connection = this.readConnectionConfig();

    this.logger.info(
      `Creating Llama Stack provider for endpoint: ${connection.baseUrl}`,
    );

    const modelListCache = new ModelListCache({
      cache: this.cache,
      logger: this.logger,
    });

    const mcpAuthTokenCache = new McpAuthTokenCache({
      cache: this.cache,
      logger: this.logger,
    });

    const clientManager = new ClientManager({
      cache: this.cache,
      logger: this.logger,
    });

    const sessionMap = new SessionMap({
      cache: this.cache,
      logger: this.logger,
    });

    const provider = new ResponsesApiProvider({
      connection,
      logger: this.logger,
    });

    return {
      provider,
      modelListCache,
      mcpAuthTokenCache,
      clientManager,
      sessionMap,
    };
  }

  /**
   * Read Llama Stack connection settings from app-config.yaml.
   *
   * Expected config shape:
   * ```yaml
   * boost:
   *   providers:
   *     llamastack:
   *       baseUrl: http://localhost:8321
   *       defaultModel: meta-llama/Llama-3.1-8B-Instruct
   *       apiKey: ${LLAMA_STACK_API_KEY}  # optional
   * ```
   */
  private readConnectionConfig(): LlamaStackConnectionConfig {
    const providerConfig = this.config.getOptionalConfig(
      'boost.providers.llamastack',
    );

    if (!providerConfig) {
      this.logger.warn(
        'No boost.providers.llamastack config found. ' +
          'Using default connection settings (http://localhost:8321).',
      );
      return {
        baseUrl: 'http://localhost:8321',
      };
    }

    return {
      baseUrl: providerConfig.getString('baseUrl'),
      defaultModel: providerConfig.getOptionalString('defaultModel'),
      apiKey: providerConfig.getOptionalString('apiKey'),
    };
  }
}

/**
 * The provider and all associated cache services created by the factory.
 *
 * @internal
 */
export interface ResponsesApiProviderBundle {
  /** The AI provider instance. */
  provider: ResponsesApiProvider;
  /** Model list cache (60s TTL). */
  modelListCache: ModelListCache;
  /** MCP auth token cache (dynamic TTL per token). */
  mcpAuthTokenCache: McpAuthTokenCache;
  /** Identity-keyed client manager (1h TTL). */
  clientManager: ClientManager;
  /** Conversation session map (24h TTL). */
  sessionMap: SessionMap;
}
