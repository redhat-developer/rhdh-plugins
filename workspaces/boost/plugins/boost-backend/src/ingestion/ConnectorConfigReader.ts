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
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import type { RuntimeConfigResolver } from '../config/RuntimeConfigResolver';
import { boostConfigFields, type BoostConfigKey } from '../config/schemas';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A connector candidate discovered from configuration.
 *
 * @public
 */
export interface ConnectorCandidate {
  /** Unique connector identifier (config key). */
  connectorId: string;
  /** The type of connector (e.g., 'github', 'gitlab', 'jira'). */
  connectorType: string;
  /** Whether the provider is registered at startup (`ai-catalog.providers.<id>.enabled`). */
  startupEnabled: boolean;
  /**
   * Whether runtime syncing is enabled for this connector.
   * Resolved via {@link RuntimeConfigResolver} for
   * `boost.connectors.<id>.enabled` (YAML baseline + DB overrides).
   * Defaults to `true` when unset in both layers.
   */
  runtimeEnabled: boolean;
}

/**
 * Options for creating a {@link ConnectorConfigReader}.
 *
 * @public
 */
export interface ConnectorConfigReaderOptions {
  /** The Backstage root config service. */
  config: RootConfigService;
  /** The runtime config resolver for DB-overridable fields. */
  resolver: RuntimeConfigResolver;
  /** The Backstage logger service. */
  logger: LoggerService;
}

// ---------------------------------------------------------------------------
// Supported connector types for health discovery
// ---------------------------------------------------------------------------

/**
 * In-scope connector types for the health API. The type is inferred
 * from the config key name when not explicitly set.
 */
const KNOWN_CONNECTOR_TYPES = ['github', 'gitlab', 'jira'] as const;

// ---------------------------------------------------------------------------
// Reader
// ---------------------------------------------------------------------------

/**
 * Reads connector configuration from Backstage ConfigApi and
 * {@link RuntimeConfigResolver} for health API discovery.
 *
 * `startupEnabled` is read from YAML-only (`ai-catalog.providers.<id>.enabled`)
 * via ConfigApi. `runtimeEnabled` is resolved via
 * {@link RuntimeConfigResolver} so that DB overrides (admin panel
 * toggles) take effect within the 30-second cache TTL.
 *
 * @public
 */
export class ConnectorConfigReader {
  private readonly config: RootConfigService;
  private readonly resolver: RuntimeConfigResolver;
  private readonly logger: LoggerService;

  constructor(options: ConnectorConfigReaderOptions) {
    this.config = options.config;
    this.resolver = options.resolver;
    this.logger = options.logger.child({ service: 'ConnectorConfigReader' });
  }

  /**
   * List connector candidates from configuration.
   *
   * Discovery algorithm (per implementation gate):
   * 1. Collect connector IDs from `boost.connectors.*` and
   *    `ai-catalog.providers.*` for in-scope types.
   * 2. Drop any ID where `ai-catalog.providers.<id>.enabled === false`
   *    (or provider block absent).
   * 3. Set `runtimeEnabled` from `RuntimeConfigResolver` resolution of
   *    `boost.connectors.<id>.enabled` (default `true`), which merges
   *    YAML baseline with DB overrides.
   *
   * @returns Array of connector candidates that passed startup-enabled
   *   filtering.
   */
  async listCandidates(): Promise<ConnectorCandidate[]> {
    const candidates: ConnectorCandidate[] = [];
    const seen = new Set<string>();

    // Scan ai-catalog.providers for known connector types
    for (const connectorType of KNOWN_CONNECTOR_TYPES) {
      await this.discoverFromProviders(connectorType, candidates, seen);
    }

    // Scan boost.connectors for any additional IDs
    await this.discoverFromBoostConnectors(candidates, seen);

    this.logger.debug(`Discovered ${candidates.length} connector candidate(s)`);
    return candidates;
  }

  /**
   * Discover connectors from `ai-catalog.providers.<id>` config.
   */
  private async discoverFromProviders(
    connectorType: string,
    candidates: ConnectorCandidate[],
    seen: Set<string>,
  ): Promise<void> {
    try {
      const providersConfig = this.config.getOptionalConfig(
        'ai-catalog.providers',
      );
      if (!providersConfig) {
        return;
      }

      // Check if a provider config block exists for this type
      const providerConfig = providersConfig.getOptionalConfig(connectorType);
      if (!providerConfig) {
        return;
      }

      const connectorId = connectorType;
      if (seen.has(connectorId)) {
        return;
      }
      seen.add(connectorId);

      // Check startup-enabled flag (default: true if block exists)
      const startupEnabled =
        providerConfig.getOptionalBoolean('enabled') ?? true;

      if (!startupEnabled) {
        // Startup-disabled providers must not appear in health responses
        this.logger.debug(
          `Connector ${connectorId} startup-disabled, excluding from health`,
        );
        return;
      }

      // Resolve runtime-enabled flag via RuntimeConfigResolver
      const runtimeEnabled = await this.resolveRuntimeEnabled(connectorId);

      candidates.push({
        connectorId,
        connectorType,
        startupEnabled,
        runtimeEnabled,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to read provider config for ${connectorType}: ${error}`,
      );
    }
  }

  /**
   * Discover connectors from `boost.connectors.<id>` config that
   * were not already found via `ai-catalog.providers`.
   */
  private async discoverFromBoostConnectors(
    candidates: ConnectorCandidate[],
    seen: Set<string>,
  ): Promise<void> {
    try {
      const connectorsConfig =
        this.config.getOptionalConfig('boost.connectors');
      if (!connectorsConfig) {
        return;
      }

      for (const connectorId of connectorsConfig.keys()) {
        if (seen.has(connectorId)) {
          continue;
        }
        seen.add(connectorId);

        // If the connector is only in boost.connectors but not in
        // ai-catalog.providers, check if the provider is registered.
        // If there is no provider block, treat as not registered.
        const hasProvider = this.hasProviderBlock(connectorId);
        if (!hasProvider) {
          this.logger.debug(
            `Connector ${connectorId} in boost.connectors but no provider block, excluding`,
          );
          continue;
        }

        const startupEnabled = this.getStartupEnabled(connectorId);
        if (!startupEnabled) {
          continue;
        }

        const runtimeEnabled = await this.resolveRuntimeEnabled(connectorId);
        const connectorType = this.inferConnectorType(connectorId);

        candidates.push({
          connectorId,
          connectorType,
          startupEnabled,
          runtimeEnabled,
        });
      }
    } catch (error) {
      this.logger.warn(`Failed to read boost.connectors config: ${error}`);
    }
  }

  /**
   * Check if an `ai-catalog.providers.<id>` config block exists.
   */
  private hasProviderBlock(connectorId: string): boolean {
    try {
      const providerConfig = this.config.getOptionalConfig(
        `ai-catalog.providers.${connectorId}`,
      );
      return providerConfig !== undefined;
    } catch {
      return false;
    }
  }

  /**
   * Get the startup-enabled flag from `ai-catalog.providers.<id>.enabled`.
   */
  private getStartupEnabled(connectorId: string): boolean {
    try {
      return (
        this.config.getOptionalBoolean(
          `ai-catalog.providers.${connectorId}.enabled`,
        ) ?? true
      );
    } catch {
      return true;
    }
  }

  /**
   * Resolve the runtime-enabled flag via {@link RuntimeConfigResolver}.
   * This merges YAML baseline with DB overrides so that admin panel
   * toggles take effect within the 30-second cache TTL.
   *
   * Defaults to `true` when the key is unset in both layers.
   * Falls back to YAML-only if the key is not a registered
   * {@link BoostConfigKey}.
   */
  private async resolveRuntimeEnabled(connectorId: string): Promise<boolean> {
    const key = `boost.connectors.${connectorId}.enabled`;

    // Only use the resolver for keys registered in boostConfigFields;
    // unregistered keys fall back to YAML-only via ConfigApi.
    if (key in boostConfigFields) {
      try {
        const value = await this.resolver.resolve(key as BoostConfigKey);
        if (typeof value === 'boolean') {
          return value;
        }
        if (value !== undefined) {
          this.logger.warn(
            `Unexpected type for ${key}: ${typeof value}; falling back to YAML`,
          );
        }
        // undefined or unexpected type → fall through to YAML ConfigApi
      } catch (error) {
        this.logger.warn(
          `Failed to resolve runtime config for ${key}, falling back to YAML: ${error}`,
        );
      }
    }

    // Fallback: read from YAML-only via ConfigApi
    try {
      return (
        this.config.getOptionalBoolean(
          `boost.connectors.${connectorId}.enabled`,
        ) ?? true
      );
    } catch {
      return true;
    }
  }

  /**
   * Infer connector type from the connector ID.
   * Falls back to the ID itself if not a known type.
   */
  private inferConnectorType(connectorId: string): string {
    const lower = connectorId.toLowerCase();
    for (const known of KNOWN_CONNECTOR_TYPES) {
      if (lower.includes(known)) {
        return known;
      }
    }
    return connectorId;
  }
}
