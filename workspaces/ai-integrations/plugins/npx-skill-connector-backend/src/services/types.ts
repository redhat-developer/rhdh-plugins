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

import type { SchedulerServiceTaskScheduleDefinition } from '@backstage/backend-plugin-api';

/** Default artifact download size in bytes (1 MiB per D7). */
export const DEFAULT_MAX_ARTIFACT_SIZE = 1 * 1024 * 1024;

/**
 * Default maximum aggregate content retained across all artifacts (50 MiB).
 * Limits the combined size of decoded artifact content to prevent
 * unbounded memory growth.
 */
export const DEFAULT_MAX_AGGREGATE_CONTENT_SIZE = 50 * 1024 * 1024;

/** Default fetch timeout in milliseconds (30 seconds per D7). */
export const DEFAULT_FETCH_TIMEOUT_MS = 30_000;

/**
 * Default source-operation deadline in milliseconds (5 minutes).
 * Bounds the total wall-clock time for processing all artifacts from one
 * source, including discovery and retries.
 */
export const DEFAULT_SOURCE_OPERATION_DEADLINE_MS = 5 * 60 * 1000;

/** Default maximum size of one discovery index response (5 MiB). */
export const DEFAULT_MAX_INDEX_RESPONSE_SIZE = 5 * 1024 * 1024;

/** Default total artifact limit for discovery entries. */
export const DEFAULT_MAX_ARTIFACTS = 25;

/** Default additional retry attempts after an initial failure. */
export const DEFAULT_MAX_RETRIES = 2;

/** Default delay in milliseconds before retry backoff (2 seconds). */
export const DEFAULT_RETRY_BASE_DELAY_MS = 2_000;

/** D7: at most five redirects are followed. */
export const MAX_REDIRECTS = 5;

/** D7: at most four concurrent artifact operations per source. */
export const MAX_CONCURRENT_ARTIFACT_FETCHES = 4;

/** Default refresh interval for Backstage scheduling (D6: ten minutes). */
export const DEFAULT_REFRESH_INTERVAL_MINUTES = 10;

/** Largest delay supported by Node's timers without clamping to 1 ms. */
export const MAX_TIMER_DELAY_MS = 2 ** 31 - 1;

/** Validated backend settings, resolved once at plugin initialization. */
export interface NpxConnectorOptions {
  readonly fetchTimeoutMs: number;
  readonly maxArtifactSizeBytes: number;
  readonly maxAggregateContentSizeBytes: number;
  readonly maxIndexResponseSizeBytes: number;
  readonly maxArtifacts: number;
  readonly maxRetries: number;
  readonly retryBaseDelayMs: number;
  readonly sourceOperationDeadlineMs: number;
}

export const DEFAULT_NPX_CONNECTOR_OPTIONS: NpxConnectorOptions = Object.freeze(
  {
    fetchTimeoutMs: DEFAULT_FETCH_TIMEOUT_MS,
    maxArtifactSizeBytes: DEFAULT_MAX_ARTIFACT_SIZE,
    maxAggregateContentSizeBytes: DEFAULT_MAX_AGGREGATE_CONTENT_SIZE,
    maxIndexResponseSizeBytes: DEFAULT_MAX_INDEX_RESPONSE_SIZE,
    maxArtifacts: DEFAULT_MAX_ARTIFACTS,
    maxRetries: DEFAULT_MAX_RETRIES,
    retryBaseDelayMs: DEFAULT_RETRY_BASE_DELAY_MS,
    sourceOperationDeadlineMs: DEFAULT_SOURCE_OPERATION_DEADLINE_MS,
  },
);

/**
 * Source configuration combining identity, index URL, allowed origins,
 * and scheduling.
 *
 * Each source produces an independent `SkillSnapshot` served via
 * `GET /skills/:sourceId`. Source IDs are unique within the connector.
 */
export interface NpxSourceConfig {
  /** Stable source identifier. */
  readonly id: string;
  /** Public HTTPS URL of the Agent Skills v0.2 discovery index. */
  readonly indexUrl: string;
  /** Additional HTTPS origins for artifact redirects. */
  readonly allowedOrigins?: readonly string[];
  /** Backstage refresh schedule, always local scope. */
  readonly schedule: SchedulerServiceTaskScheduleDefinition;
}
