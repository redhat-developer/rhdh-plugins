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

/**
 * Fetch all entities from the Backstage catalog API.
 *
 * This is a read-only operation — no writes, deletions, or
 * configuration modifications are performed.
 *
 * @public
 */
export async function fetchEntities(
  options: FetchEntitiesOptions,
): Promise<CatalogEntity[]> {
  const { catalogUrl, token, filter } = options;

  const url = new URL('/api/catalog/entities', catalogUrl);
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
