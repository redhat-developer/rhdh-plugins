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

import type { LoggerService } from '@backstage/backend-plugin-api';
import type {
  ConnectorHealthStatus,
  HealthStatus,
  SyncAttemptRecord,
  ErrorSummary,
  ErrorType,
  SyncMetrics,
} from '@red-hat-developer-hub/backstage-plugin-boost-common';
import type { SyncAttemptsStore } from './SyncAttemptsStore';
import type {
  ConnectorConfigReader,
  ConnectorCandidate,
} from './ConnectorConfigReader';
import { ErrorClassifier } from './ErrorClassifier';

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

/**
 * Options for creating a {@link HealthStatusService}.
 *
 * @public
 */
export interface HealthStatusServiceOptions {
  /** The sync attempts store. */
  store: SyncAttemptsStore;
  /** The connector config reader. */
  configReader: ConnectorConfigReader;
  /** The Backstage logger service. */
  logger: LoggerService;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/** Number of recent attempts used for status derivation. */
const STATUS_WINDOW = 3;

const ERROR_TYPES: ReadonlySet<string> = new Set([
  'auth',
  'network',
  'schema',
  'rate-limit',
  'unknown',
]);

/**
 * Service for deriving connector health status from sync attempt
 * history and connector configuration.
 *
 * @public
 */
export class HealthStatusService {
  private readonly store: SyncAttemptsStore;
  private readonly configReader: ConnectorConfigReader;
  private readonly logger: LoggerService;

  constructor(options: HealthStatusServiceOptions) {
    this.store = options.store;
    this.configReader = options.configReader;
    this.logger = options.logger.child({ service: 'HealthStatusService' });
  }

  /**
   * Get health status for all connectors.
   *
   * @param includeDisabled - Whether to include runtime-disabled connectors.
   * @returns Array of connector health status objects.
   */
  async getHealthStatuses(
    includeDisabled: boolean = false,
  ): Promise<ConnectorHealthStatus[]> {
    // Step 1: Discover candidates from config
    const candidates = this.configReader.listCandidates();

    // Step 2: Filter out disabled connectors unless includeDisabled
    const filtered = includeDisabled
      ? candidates
      : candidates.filter(c => c.runtimeEnabled);

    if (filtered.length === 0) {
      return [];
    }

    // Step 3: Fetch sync attempts and last successes for all connectors
    const connectorIds = filtered.map(c => c.connectorId);
    const [attemptsMap, lastSuccessEntries] = await Promise.all([
      this.store.getLatestAttemptsForAll(connectorIds, STATUS_WINDOW),
      Promise.all(
        connectorIds.map(async id => {
          const lastSuccess = await this.store.getLastSuccessfulAttempt(id);
          return [id, lastSuccess] as const;
        }),
      ),
    ]);
    const lastSuccessMap = new Map(lastSuccessEntries);

    // Step 4: Build health status for each connector
    const results: ConnectorHealthStatus[] = [];
    for (const candidate of filtered) {
      const attempts = attemptsMap.get(candidate.connectorId) ?? [];
      const lastSuccess = lastSuccessMap.get(candidate.connectorId) ?? null;
      results.push(this.buildHealthStatus(candidate, attempts, lastSuccess));
    }

    this.logger.debug(`Computed health for ${results.length} connector(s)`);
    return results;
  }

  /**
   * Derive health status from a list of recent sync attempts.
   *
   * Rules (per spec):
   * - 0 attempts → `unknown`
   * - All succeeded → `healthy`
   * - All failed → `failing`
   * - Mixed → `degraded`
   *
   * @param attempts - Recent sync attempts (newest first), up to
   *   `STATUS_WINDOW` entries.
   * @returns The derived health status.
   */
  static deriveStatus(attempts: SyncAttemptRecord[]): HealthStatus {
    if (attempts.length === 0) {
      return 'unknown';
    }

    const relevant = attempts.slice(0, STATUS_WINDOW);
    const allSuccess = relevant.every(a => a.outcome === 'success');
    const allFailure = relevant.every(a => a.outcome === 'failure');

    if (allSuccess) {
      return 'healthy';
    }
    if (allFailure) {
      return 'failing';
    }
    return 'degraded';
  }

  /**
   * Build a complete health status object for a connector.
   */
  private buildHealthStatus(
    candidate: ConnectorCandidate,
    attempts: SyncAttemptRecord[],
    lastSuccess: SyncAttemptRecord | null,
  ): ConnectorHealthStatus {
    const status = HealthStatusService.deriveStatus(attempts);

    // Find timestamps
    const lastAttempt = attempts[0] ?? null;

    // Build error summary from most recent failure in the status window
    // (including degraded cases where the latest attempt succeeded).
    let errorSummary: ErrorSummary | null = null;
    const lastFailure = attempts.find(a => a.outcome === 'failure') ?? null;
    if (lastFailure) {
      errorSummary = this.buildErrorSummary(candidate, lastFailure);
    }

    // Build metrics from most recent attempt
    const metrics: SyncMetrics = lastAttempt
      ? {
          assetsAdded: lastAttempt.assetsAdded,
          assetsUpdated: lastAttempt.assetsUpdated,
          assetsRemoved: lastAttempt.assetsRemoved,
        }
      : { assetsAdded: 0, assetsUpdated: 0, assetsRemoved: 0 };

    return {
      connectorId: candidate.connectorId,
      connectorType: candidate.connectorType,
      enabled: candidate.runtimeEnabled,
      status,
      lastSyncAttempt: lastAttempt?.timestamp ?? null,
      lastSuccessfulSync: lastSuccess?.timestamp ?? null,
      errorSummary,
      metrics,
    };
  }

  /**
   * Build an error summary using ErrorClassifier for actionable guidance.
   */
  private buildErrorSummary(
    candidate: ConnectorCandidate,
    failure: SyncAttemptRecord,
  ): ErrorSummary {
    const errorMessage = failure.errorMessage ?? 'Unknown error';
    const classified = ErrorClassifier.classify(errorMessage, {
      connectorType: candidate.connectorType,
    });

    // Prefer the type stored at write time (may have used status codes).
    const storedType = failure.errorType;
    const errorType: ErrorType =
      storedType && ERROR_TYPES.has(storedType)
        ? (storedType as ErrorType)
        : classified.errorType;

    const diagnosticGuidance =
      classified.errorType === errorType
        ? classified.diagnosticGuidance
        : ErrorClassifier.guidanceFor(errorType);

    return {
      errorType,
      errorMessage,
      diagnosticGuidance,
    };
  }
}
