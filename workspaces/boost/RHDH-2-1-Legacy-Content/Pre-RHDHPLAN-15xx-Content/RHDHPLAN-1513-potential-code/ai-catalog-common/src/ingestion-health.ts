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
 * Health status of a connector derived from recent sync attempts.
 *
 * - `healthy` — all recent attempts succeeded
 * - `degraded` — mixed success and failure in recent attempts
 * - `failing` — all recent attempts failed
 * - `unknown` — zero sync attempts recorded
 *
 * @public
 */
export type HealthStatus = 'healthy' | 'degraded' | 'failing' | 'unknown';

/**
 * Error type classification for sync failures.
 *
 * @public
 */
export type ErrorType =
  | 'auth'
  | 'network'
  | 'schema'
  | 'rate-limit'
  | 'unknown';

/**
 * Classified error summary with actionable diagnostic guidance.
 *
 * @public
 */
export interface ErrorSummary {
  /** The classification category of the error. */
  errorType: ErrorType;
  /** The raw error message from the sync failure. */
  errorMessage: string;
  /** Actionable next steps for resolving the error. */
  diagnosticGuidance: string;
}

/**
 * Sync metrics from a connector sync attempt.
 *
 * @public
 */
export interface SyncMetrics {
  /** Number of assets added during the sync. */
  assetsAdded: number;
  /** Number of assets updated during the sync. */
  assetsUpdated: number;
  /** Number of assets removed during the sync. */
  assetsRemoved: number;
}

/**
 * Health status for a single connector, returned by the
 * `GET /api/boost/ingestion-health` endpoint.
 *
 * @public
 */
export interface ConnectorHealthStatus {
  /** Unique connector identifier. */
  connectorId: string;
  /** The type of connector (e.g., 'github', 'gitlab', 'jira'). */
  connectorType: string;
  /** Whether the connector is enabled for runtime syncing. */
  enabled: boolean;
  /** Derived health status based on recent sync attempts. */
  status: HealthStatus;
  /** ISO 8601 timestamp of the most recent sync attempt, or null. */
  lastSyncAttempt: string | null;
  /** ISO 8601 timestamp of the last successful sync, or null. */
  lastSuccessfulSync: string | null;
  /** Error classification from the most recent failure, or null. */
  errorSummary: ErrorSummary | null;
  /** Metrics from the most recent sync attempt. */
  metrics: SyncMetrics;
}

/**
 * A recorded sync attempt for a connector.
 *
 * @public
 */
export interface SyncAttemptRecord {
  /** Auto-generated record identifier. */
  id: string;
  /** The connector that performed the sync. */
  connectorId: string;
  /** ISO 8601 timestamp of when the sync attempt occurred. */
  timestamp: string;
  /** The outcome of the sync attempt. */
  outcome: 'success' | 'failure';
  /** Error type classification (null for successful attempts). */
  errorType: string | null;
  /** Error message (null for successful attempts). */
  errorMessage: string | null;
  /** Number of assets added. */
  assetsAdded: number;
  /** Number of assets updated. */
  assetsUpdated: number;
  /** Number of assets removed. */
  assetsRemoved: number;
  /** Duration of the sync in milliseconds. */
  durationMs: number;
}
