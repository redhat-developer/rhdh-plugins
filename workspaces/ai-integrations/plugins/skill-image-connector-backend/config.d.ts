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

export interface Config {
  skillImageConnector?: {
    /** Request deadline including redirects, authentication and body reading. Defaults to 30000 ms.
     * @visibility backend
     */
    fetchTimeoutMs?: number;
    /** Maximum bytes per downloaded blob and decompressed layer. Defaults to 5242880.
     * @visibility backend
     */
    maxBlobSizeBytes?: number;
    /** Maximum combined retained skill YAML and Markdown bytes across images. Defaults to 52428800.
     * @visibility backend
     */
    maxAggregateContentSizeBytes?: number;
    /** Maximum bytes per Quay discovery response. Defaults to 5242880.
     * @visibility backend
     */
    maxDiscoveryResponseSizeBytes?: number;
    /** Maximum combined explicit images and discovered candidates to process. Positive integer; defaults to 25.
     * @visibility backend
     */
    maxImages?: number;
    /** Retries after the initial page/image attempt. Defaults to 2; 0 disables retries.
     * @visibility backend
     */
    maxRetries?: number;
    /** Initial retry delay in milliseconds, doubled on subsequent retries. Defaults to 2000.
     * @visibility backend
     */
    retryBaseDelayMs?: number;
    /** @visibility backend */
    allowedRegistries?: string[];
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
       * Although typed as optional, discovery is silently skipped when this
       * field is omitted — it is effectively required for discovery to function.
       * @visibility backend
       */
      organization?: string;
      /** Exact tag to try in each repository. Omit or leave blank to discover all active tags.
       * Set latest explicitly to preserve the former default; wildcards and regex are not supported.
       * @visibility backend
       */
      tag?: string;
    };
  };
}
