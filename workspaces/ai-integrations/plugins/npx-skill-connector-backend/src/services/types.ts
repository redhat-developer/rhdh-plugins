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

export const MAX_ARTIFACT_SIZE = 1024 * 1024;
export const MAX_INDEX_RESPONSE_SIZE = 5 * 1024 * 1024;
export const FETCH_TIMEOUT_MS = 30_000;
export const SOURCE_OPERATION_DEADLINE_MS = 5 * 60_000;
export const MAX_REDIRECTS = 5;
export const DEFAULT_REFRESH_INTERVAL_MINUTES = 10;

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
