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
 * @public
 */
export async function fetchEntities(
  options: FetchEntitiesOptions,
): Promise<CatalogEntity[]> {
  const { catalogUrl, token, filter } = options;

  const validatedBase = validateCatalogUrl(catalogUrl);

  // Use the validated URL's origin to construct the endpoint,
  // ensuring only validated http/https URLs reach the network call.
  const url = new URL('/api/catalog/entities', validatedBase.origin);
  if (filter) {
    url.searchParams.set('filter', filter);
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(
      `Catalog API request failed: ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as CatalogEntity[];
}
