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

import type { CatalogEntity, FetchEntitiesOptions } from './types';

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

/**
 * Validate that a catalog URL is well-formed and uses an allowed protocol.
 *
 * @internal
 */
function validateCatalogUrl(catalogUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(catalogUrl);
  } catch {
    throw new Error(`Invalid catalog URL: ${catalogUrl}`);
  }
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    throw new Error(
      `Catalog URL must use http or https protocol, got: ${parsed.protocol}`,
    );
  }
  return parsed;
}

/**
 * Resolve the catalog entities endpoint relative to a validated base URL,
 * preserving any path prefix (e.g. a reverse proxy mount point like
 * `/backstage`). `URL`'s relative resolution drops the last path segment
 * of the base unless it ends in `/`, so a trailing slash is enforced
 * before resolving.
 *
 * @internal
 */
function resolveEntitiesEndpoint(validatedBase: URL): URL {
  const baseHref = validatedBase.href.endsWith('/')
    ? validatedBase.href
    : `${validatedBase.href}/`;
  return new URL('api/catalog/entities', baseHref);
}

/**
 * Narrow an unknown JSON payload to `CatalogEntity[]` at runtime. The
 * check is intentionally shallow (array of objects with a string `kind`
 * and an object `metadata`) — enough to catch a misconfigured catalog
 * returning a wrapped or error payload, without re-implementing full
 * catalog entity schema validation here.
 *
 * @internal
 */
function isCatalogEntityArray(payload: unknown): payload is CatalogEntity[] {
  return (
    Array.isArray(payload) &&
    payload.every(
      item =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Record<string, unknown>).kind === 'string' &&
        typeof (item as Record<string, unknown>).metadata === 'object' &&
        (item as Record<string, unknown>).metadata !== null &&
        typeof (
          (item as Record<string, unknown>).metadata as Record<string, unknown>
        ).name === 'string',
    )
  );
}

/**
 * Fetch all entities from the Backstage catalog API.
 *
 * This is a read-only operation — no writes, deletions, or
 * configuration modifications are performed.
 *
 * **Note:** This fetches entities in a single request without
 * pagination. Very large catalogs may benefit from paginated
 * fetching — consider using `/api/catalog/entities/by-query`
 * or implementing cursor-based pagination as a follow-up.
 *
 * @param options - Catalog URL, optional auth token, and optional filter.
 * @returns Array of catalog entities matching the filter criteria.
 * @throws Error if the catalog URL is invalid or uses a non-http(s) protocol.
 * @throws Error if the catalog API returns a non-200 response.
 * @throws Error if the response shape is not an array of entities.
 *
 * @public
 */
export async function fetchEntities(
  options: FetchEntitiesOptions,
): Promise<CatalogEntity[]> {
  const { catalogUrl, token, filter } = options;

  const validatedBase = validateCatalogUrl(catalogUrl);
  const url = resolveEntitiesEndpoint(validatedBase);
  if (filter) {
    url.searchParams.set('filter', filter);
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // catalogUrl is a CLI-operator-supplied target, not attacker-controlled
  // input relayed on their behalf: this is a user-invoked, read-only CLI
  // tool, and validateCatalogUrl() above already restricts the target to
  // http/https before it reaches this call. SSRF is not applicable to a
  // locally-run tool querying the catalog the operator explicitly asked
  // it to query.
  const response = await fetch(url.toString(), { method: 'GET', headers }); // NOSONAR

  if (!response.ok) {
    throw new Error(
      `Catalog API request failed: ${response.status} ${response.statusText}`,
    );
  }

  const payload: unknown = await response.json();
  if (!isCatalogEntityArray(payload)) {
    throw new Error(
      'Catalog API returned an unexpected response shape: expected an array of entities.',
    );
  }
  return payload;
}
