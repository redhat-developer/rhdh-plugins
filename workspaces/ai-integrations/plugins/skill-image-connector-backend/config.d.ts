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
  skillImageConnector?: {
    /** Request deadline including redirects, authentication and body reading. Integer from 1 to 2147483647 ms; defaults to 30000 ms.
     * @visibility backend
     */
    fetchTimeoutMs?: number;
    /** Maximum bytes per downloaded blob and decompressed layer. Safe integer from 1 to 9007199254740991; defaults to 5242880.
     * @visibility backend
     */
    maxBlobSizeBytes?: number;
    /** Maximum combined retained skill YAML and Markdown bytes across images. Safe integer from 1 to 9007199254740991; defaults to 52428800.
     * @visibility backend
     */
    maxAggregateContentSizeBytes?: number;
    /** Maximum total downloaded and decompressed bytes per OCI image across all inspected layers. Distinct from maxAggregateContentSizeBytes (retained content). Safe integer from 1 to 9007199254740991; defaults to 52428800.
     * @visibility backend
     */
    maxImageWorkBudgetBytes?: number;
    /** Maximum bytes per Quay discovery response. Safe integer from 1 to 9007199254740991; defaults to 5242880.
     * @visibility backend
     */
    maxDiscoveryResponseSizeBytes?: number;
    /** Maximum combined explicit images and discovered candidates to process. Safe integer from 1 to 9007199254740991; defaults to 25.
     * @visibility backend
     */
    maxImages?: number;
    /** Retries after the initial page/image attempt. Safe integer from 0 to 9007199254740991; defaults to 2; 0 disables retries.
     * @visibility backend
     */
    maxRetries?: number;
    /** Initial retry delay in milliseconds, doubled on subsequent retries. Integer from 1 to 2147483647 ms; defaults to 2000.
     * @visibility backend
     */
    retryBaseDelayMs?: number;
    /** Total wall-clock deadline for processing all images from one source, including discovery and retries. Integer from 1 to 2147483647 ms; defaults to 300000.
     * @visibility backend
     */
    sourceOperationDeadlineMs?: number;
    /** Maximum retained Markdown bytes per source for durable skill Markdown storage. Safe integer from 1 to 9007199254740991; defaults to 52428800 (50 MiB). Independent of extraction's maxAggregateContentSizeBytes. A configured value below already-retained bytes is rejected at startup.
     * @visibility backend
     */
    maxRetainedMarkdownSizeBytes?: number;
    /** Plugin ID of the authorized catalog provider for reconciliation acknowledgments. Omitted or blank values default to 'catalog'; non-string values are rejected. Only this principal may call POST /skilldocs/:sourceId/reconcile.
     * @visibility backend
     */
    catalogProviderPluginId?: string;
    /** @visibility backend */
    allowedRegistries?: string[];
    /** Additional HTTPS origins permitted for registry/discovery redirects. The initial registry hostname and its subdomains are allowed on the same HTTPS port. Omitted means no unrelated origins are allowed. Token realm redirects are never allowed.
     * @visibility backend
     */
    allowedOrigins?: string[];
    /** @visibility backend */
    images?: Array<{
      /** @visibility backend */
      imageRef?: string;
      /** @visibility backend */
      credentials?: {
        /** @visibility backend */
        username?: string;
        /** @visibility secret */
        password?: string;
        /** @visibility backend */
        tokenRealm?: string;
      };
    }>;
    /** @visibility backend */
    quayDiscovery?: {
      /** @visibility backend */
      registry?: string;
      /**
       * The Quay organization whose public repositories are discovered.
       * Needed to enable discovery. If omitted or blank, discovery is skipped
       * with a warning.
       * @visibility backend
       */
      organization?: string;
      /** Exact tag to try in each repository. Omit or leave blank to discover all active tags.
       * Set latest explicitly to preserve the former default; wildcards and regex are not supported.
       * @visibility backend
       */
      tag?: string;
    };
    /** Standard Backstage schedule for the legacy default source. When omitted, runs immediately and every ten minutes, with a timeout of twice sourceOperationDeadlineMs (at least one minute). Only local scope is supported because snapshots are held per backend instance. Ignored when sources is configured.
     * @visibility backend
     */
    schedule?: SchedulerServiceTaskScheduleDefinitionConfig;
    /**
     * Source-scoped configurations. Each source produces an independent
     * SkillSnapshot served via GET /skills/:sourceId. When present,
     * top-level images/quayDiscovery/allowedRegistries/allowedOrigins/schedule are ignored.
     * @visibility backend
     */
    sources?: Array<{
      /** Stable source identifier. Must be unique across all sources.
       * @visibility backend
       */
      id: string;
      /** @visibility backend */
      allowedRegistries?: string[];
      /** @visibility backend */
      allowedOrigins?: string[];
      /** Standard Backstage schedule for this source. When omitted, runs immediately and every ten minutes, with a timeout of twice sourceOperationDeadlineMs (at least one minute). Set frequency and timeout when configuring a schedule. Scope must be local; global scope is rejected.
       * @visibility backend
       */
      schedule?: SchedulerServiceTaskScheduleDefinitionConfig;
      /** @visibility backend */
      images?: Array<{
        /** @visibility backend */
        imageRef?: string;
        /** @visibility backend */
        credentials?: {
          /** @visibility backend */
          username?: string;
          /** @visibility secret */
          password?: string;
          /** @visibility backend */
          tokenRealm?: string;
        };
      }>;
      /** @visibility backend */
      quayDiscovery?: {
        /** @visibility backend */
        registry?: string;
        /** @visibility backend */
        organization?: string;
        /** @visibility backend */
        tag?: string;
      };
    }>;
  };
}
