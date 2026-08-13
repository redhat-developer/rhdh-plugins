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
   * Whether runtime syncing is enabled (`boost.connectors.<id>.enabled`).
   * Defaults to `true` if the key is missing.
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
 * Reads connector configuration from Backstage ConfigApi for health
 * API discovery.
 *
 * This is a seam for #4044 (connector config hot-reload). Today it
 * reads both `enabled` flags from YAML via ConfigApi. After #4044
 * lands, `runtimeEnabled` will come from `RuntimeConfigResolver`
 * (YAML + DB overrides) while `startupEnabled` stays YAML-only.
 *
 * @public
 */
export class ConnectorConfigReader {
  private readonly config: RootConfigService;
  private readonly logger: LoggerService;

  constructor(options: ConnectorConfigReaderOptions) {
    this.config = options.config;
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
   * 3. Set `runtimeEnabled` from `boost.connectors.<id>.enabled`
   *    (default `true`).
   *
   * @returns Array of connector candidates that passed startup-enabled
   *   filtering.
   */
  listCandidates(): ConnectorCandidate[] {
    const candidates: ConnectorCandidate[] = [];
    const seen = new Set<string>();

    // Scan ai-catalog.providers for known connector types
    for (const connectorType of KNOWN_CONNECTOR_TYPES) {
      this.discoverFromProviders(connectorType, candidates, seen);
    }

    // Scan boost.connectors for any additional IDs
    this.discoverFromBoostConnectors(candidates, seen);

    this.logger.debug(`Discovered ${candidates.length} connector candidate(s)`);
    return candidates;
  }

  /**
   * Discover connectors from `ai-catalog.providers.<id>` config.
   */
  private discoverFromProviders(
    connectorType: string,
    candidates: ConnectorCandidate[],
    seen: Set<string>,
  ): void {
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

      // Check runtime-enabled flag from boost.connectors
      const runtimeEnabled = this.getRuntimeEnabled(connectorId);

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
  private discoverFromBoostConnectors(
    candidates: ConnectorCandidate[],
    seen: Set<string>,
  ): void {
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

        const runtimeEnabled = this.getRuntimeEnabled(connectorId);
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
   * Get the runtime-enabled flag from `boost.connectors.<id>.enabled`.
   * Defaults to `true` if the key is missing.
   */
  private getRuntimeEnabled(connectorId: string): boolean {
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
