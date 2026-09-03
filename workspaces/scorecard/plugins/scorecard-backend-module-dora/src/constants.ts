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

export const DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID = 'github:deployments';
export const DORA_DEFAULT_DEPLOYMENT_PULL_REQUESTS_COLLECTOR_ID =
  'github:deploymentPullRequests';
export const DORA_DEFAULT_INCIDENTS_COLLECTOR_ID = 'jira:incidents';
export const DORA_TIME_WINDOW_DAYS = 30;
export const DORA_DEFAULT_PRODUCTION_ENVIRONMENTS = ['production'];

/**
 * Specify non-identity collector inputs (like `fetchMaxItems`) under this key in
 * `collectors.deployments.input`, `collectors.incidents.input` or `collectors.deploymentPullRequests.input`.
 * These inputs will be excluded from collector identity, flattened in input and their change
 * will not cause full data refetch.
 */
export const DORA_COLLECTOR_SETTINGS_KEY = 'collectorSettings';

/**
 * Default for how long DORA source rows (deployments, incidents, and PRs linked to expired
 * deployments) are kept before cleanup. Must stay at least
 * {@link DORA_TIME_WINDOW_DAYS}. Overridable via
 * `scorecard.plugins.dora.dataRetentionDays`.
 */
export const DORA_DEFAULT_DATA_RETENTION_DAYS = 365;

/**
 * Default for freshness threshold for deployment and incident collector refresh.
 * If the last successful sync is within this many milliseconds, refresh is
 * skipped. Overridable via `scorecard.plugins.dora.staleAfterMs`.
 */
export const DORA_DEFAULT_STALE_AFTER_MS = 60_000;

/**
 * Default for how far before the last deployments watermark to re-query by createdAt
 * Captures pending status updated to success after the previous refresh.
 * Overridable via `scorecard.plugins.dora.deploymentLookbackMs`.
 */
export const DORA_DEFAULT_DEPLOYMENT_LOOKBACK_MS = 48 * 60 * 60 * 1000;

export const DORA_CLEANUP_EXPIRED_DATA_TASK_ID =
  'scorecard-dora:cleanup-expired-data' as const;
