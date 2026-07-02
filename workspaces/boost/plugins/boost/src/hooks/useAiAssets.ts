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

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Entity } from '@backstage/catalog-model';
import { useApi } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { AI_ASSET_SPEC_TYPES, isAiAsset } from '../utils/isAiAsset';

export interface AiAssetFilters {
  search?: string;
  category?: string[];
  lifecycle?: string[];
  tags?: string[];
  owner?: string;
}

export interface UseAiAssetsResult {
  /** Entities after all client-side filters. */
  entities: Entity[];
  /** All AI asset entities before client-side filters — stable for deriving filter options. */
  allEntities: Entity[];
  loading: boolean;
  error: Error | undefined;
  retry: () => void;
}

/**
 * Builds the static catalog filter for all AI asset kind/type pairs.
 * Returns an OR query (array of filter objects).
 */
function buildCatalogFilter(): Record<string, string | string[]>[] {
  return Object.entries(AI_ASSET_SPEC_TYPES).map(([kind, types]) => ({
    kind,
    'spec.type': [...types],
  }));
}

function applyClientFilters(
  items: Entity[],
  filters: AiAssetFilters,
): Entity[] {
  let results = items;

  if (filters.search) {
    const term = filters.search.toLowerCase();
    results = results.filter(
      e =>
        e.metadata.name.toLowerCase().includes(term) ||
        (e.metadata.description ?? '').toLowerCase().includes(term) ||
        (e.metadata.tags ?? []).some(t => t.toLowerCase().includes(term)),
    );
  }

  if (filters.tags?.length) {
    const tagSet = new Set(filters.tags.map(t => t.toLowerCase()));
    results = results.filter(e =>
      (e.metadata.tags ?? []).some(t => tagSet.has(t.toLowerCase())),
    );
  }

  if (filters.category?.length) {
    const cats = new Set(filters.category.map(c => c.toLowerCase()));
    results = results.filter(e => {
      const specType = (e.spec as Record<string, unknown> | undefined)?.type as
        | string
        | undefined;
      return specType !== undefined && cats.has(specType.toLowerCase());
    });
  }

  if (filters.lifecycle?.length) {
    const vals = new Set(filters.lifecycle.map(v => v.toLowerCase()));
    results = results.filter(e => {
      const lc = (e.spec as Record<string, unknown> | undefined)?.lifecycle as
        | string
        | undefined;
      return lc !== undefined && vals.has(lc.toLowerCase());
    });
  }

  if (filters.owner) {
    const ownerLower = filters.owner.toLowerCase();
    results = results.filter(e => {
      const o = (e.spec as Record<string, unknown> | undefined)?.owner as
        | string
        | undefined;
      return o !== undefined && o.toLowerCase() === ownerLower;
    });
  }

  return results;
}

/**
 * Fetches all AI asset entities from the catalog and applies filters
 * client-side. The catalog API is called once on mount (and on retry);
 * all filtering is a pure memo over the cached result.
 *
 * Callers must pass a memoized `filters` object (e.g. from useMemo or
 * useUrlFilters) — an inline object literal will defeat the memo and
 * recompute on every render.
 *
 * When catalogs grow beyond ~500 assets, the internals can switch to
 * cursor-based queryEntities without changing the consumer API.
 */
export function useAiAssets(filters: AiAssetFilters = {}): UseAiAssetsResult {
  const catalogApi = useApi(catalogApiRef);
  const [allEntities, setAllEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>();
  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback(() => setRetryCount(c => c + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(undefined);

    catalogApi
      .getEntities({ filter: buildCatalogFilter() })
      .then(response => {
        if (!cancelled) setAllEntities(response.items.filter(isAiAsset));
      })
      .catch(err => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err : new Error('Failed to load AI assets'),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [catalogApi, retryCount]);

  const entities = useMemo(
    () => applyClientFilters(allEntities, filters),
    [allEntities, filters],
  );

  return { entities, allEntities, loading, error, retry };
}
