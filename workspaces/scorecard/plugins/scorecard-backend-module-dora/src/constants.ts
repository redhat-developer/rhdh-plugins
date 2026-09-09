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
 * Max deployments to request for the pre-window predecessor collect.
 *
 * We take the latest successful production deploy in that capped batch. That can
 * miss a real predecessor when the newest pre-window rows are all failed or
 * non-prod.
 *
 * Paging until a successful prod deploy is found would close that gap, but it
 * is a bad default: a repo with a long staging/failed burst (or a collector
 * that ignores the cap) would walk unbounded GitHub/Jira history per metric
 * run — rate limits, latency, and timeout risk on every catalog entity.
 */
export const DORA_PRE_WINDOW_DEPLOYMENT_FETCH_CAP = 100;

/** Inclusive collector `from` for unbounded predecessor lookback. */
export const DORA_PREDECESSOR_COLLECT_FROM = '1970-01-01T00:00:00.000Z';
