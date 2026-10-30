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

import type { SchedulerServiceTaskScheduleDefinitionConfig } from '@backstage/backend-plugin-api';

export interface Config {
  npxSkillConnector?: {
    /**
     * Request deadline including redirects and body reading.
     * Integer from 1 to 2147483647 ms; defaults to 30000 ms.
     * @visibility backend
     */
    fetchTimeoutMs?: number;
    /**
     * Maximum bytes per downloaded artifact. Safe integer from 1 to
     * 9007199254740991; defaults to 1048576 (1 MiB).
     * @visibility backend
     */
    maxArtifactSizeBytes?: number;
    /**
     * Maximum combined retained content bytes across all artifacts per
     * source. Safe integer from 1 to 9007199254740991; defaults to
     * 52428800 (50 MiB).
     * @visibility backend
     */
    maxAggregateContentSizeBytes?: number;
    /**
     * Maximum total discovery index candidates to process. Safe integer
     * from 1 to 9007199254740991; defaults to 25.
     * @visibility backend
     */
    maxArtifacts?: number;
    /**
     * Retries after the initial attempt. Safe integer from 0 to
     * 9007199254740991; defaults to 2; 0 disables retries.
     * @visibility backend
     */
    maxRetries?: number;
    /**
     * Initial retry delay in milliseconds, doubled on subsequent retries.
     * Integer from 1 to 2147483647 ms; defaults to 2000.
     * @visibility backend
     */
    retryBaseDelayMs?: number;
    /**
     * Total wall-clock deadline for processing all artifacts from one
     * source, including discovery and retries. Integer from 1 to
     * 2147483647 ms; defaults to 300000.
     * @visibility backend
     */
    sourceOperationDeadlineMs?: number;
    /**
     * Maximum bytes per discovery index response. Safe integer from 1 to
     * 9007199254740991; defaults to 5242880 (5 MiB).
     * @visibility backend
     */
    maxIndexResponseSizeBytes?: number;
    /**
     * Source-scoped configurations. Each source produces an independent
     * SkillSnapshot served via GET /skills/:sourceId.
     * @visibility backend
     */
    sources?: Array<{
      /**
       * Stable source identifier. Must be unique across all sources.
       * @visibility backend
       */
      id: string;
      /**
       * Public HTTPS URL of the Agent Skills v0.2 discovery index.
       * @visibility backend
       */
      indexUrl: string;
      /**
       * Additional HTTPS origins permitted for artifact redirects. The
       * initial index origin is always allowed. Omitted means no
       * additional origins are permitted.
       * @visibility backend
       */
      allowedOrigins?: string[];
      /**
       * Standard Backstage schedule for this source. When omitted, runs
       * immediately and every ten minutes, with a timeout of twice
       * sourceOperationDeadlineMs (at least one minute). Scope must be
       * local; global scope is rejected.
       * @visibility backend
       */
      schedule?: SchedulerServiceTaskScheduleDefinitionConfig;
    }>;
  };
}
