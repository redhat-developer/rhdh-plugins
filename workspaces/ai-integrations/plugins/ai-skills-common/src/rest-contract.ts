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
 * Shared REST contract constants for skill connector endpoints.
 *
 * Each connector exposes `GET /skills/:sourceId` relative to its Backstage
 * plugin base URL. The common catalog provider resolves the connector
 * through Backstage discovery and authenticates with a service token whose
 * `targetPluginId` matches the connector's registered plugin ID.
 *
 * ## Endpoint: GET /skills/:sourceId
 *
 * ### Path parameters
 * - `sourceId` — the configured source identifier, encoded as one path
 *   segment.
 *
 * ### Authentication
 * Uses Backstage's default backend service-to-service authentication.
 * The endpoint is not public merely because upstream registries may be
 * public.
 *
 * ### Responses
 * - **200** — returns a `SkillSnapshot` v1 JSON body.
 *   - `Content-Type: application/json`
 *   - The response contains one bounded snapshot with at most 1,000
 *     records and 5 MiB of serialized JSON.
 * - **404** — the `sourceId` is not configured on this connector.
 *
 * ### Consumer responsibilities
 * The consumer bounds its response read and rejects an oversized,
 * malformed, unsupported-version, or source-mismatched snapshot without
 * changing that source's catalog state.
 *
 * @packageDocumentation
 * @public
 */

/**
 * Base path for the skills endpoint on each connector.
 *
 * @public
 */
export const SKILLS_ENDPOINT_BASE = '/skills';

/**
 * Maximum response read size in bytes that consumers should accept.
 * Matches the 5 MiB snapshot serialized-size bound.
 *
 * @public
 */
export const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
