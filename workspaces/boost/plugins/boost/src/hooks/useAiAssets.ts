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
import { isAiAsset } from '../utils/isAiAsset';

export interface AiAssetFilters {
  search?: string;
  category?: string[];
  lifecycle?: string[];
  tags?: string[];
  owner?: string;
}

export interface UseAiAssetsResult {
  entities: Entity[];
  loading: boolean;
  error: Error | undefined;
  retry: () => void;
}

/**
 * Builds catalog entity filter expressions for all AI asset kind/type
 * combinations. Returns an OR query across all valid pairs.
 */
function buildCatalogFilter(
  filters: AiAssetFilters,
): Record<string, string | string[]>[] {
  const kindTypeMap: [string, string[]][] = [
    ['AiResource', ['skill', 'rule']],
    ['API', ['mcp-server']],
    ['Component', ['ai-agent']],
    ['Resource', ['ai-model', 'ai-tool', 'vector-store']],
  ];

  const filterSets: Record<string, string | string[]>[] = [];

  for (const [kind, types] of kindTypeMap) {
    const base: Record<string, string | string[]> = {
      kind,
      'spec.type': types,
    };
    if (filters.lifecycle?.length) {
      base['spec.lifecycle'] = filters.lifecycle;
    }
    if (filters.owner) {
      base['spec.owner'] = filters.owner;
    }
    filterSets.push(base);
  }

  return filterSets;
}

/**
 * Wraps catalogApiRef to query AI asset entities with optional filtering.
 * Uses client-side filtering for search, tags, and category (post-fetch).
 */
export function useAiAssets(filters: AiAssetFilters = {}): UseAiAssetsResult {
  const catalogApi = useApi(catalogApiRef);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>();
  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback(() => setRetryCount(c => c + 1), []);

  const { search, owner } = filters;
  const categoryKey = filters.category?.join(',') ?? '';
  const lifecycleKey = filters.lifecycle?.join(',') ?? '';
  const tagsKey = filters.tags?.join(',') ?? '';

  // Only lifecycle and owner are passed to the catalog API filter.
  // Other filter dimensions (search, category, tags) are applied client-side.
  const catalogFilter = useMemo(
    () => buildCatalogFilter(filters),
    [lifecycleKey, owner], // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    let cancelled = false;

    async function fetchEntities() {
      setLoading(true);
      setError(undefined);

      try {
        const response = await catalogApi.getEntities({
          filter: catalogFilter,
        });

        if (cancelled) return;

        let results = response.items.filter(isAiAsset);

        if (search) {
          const term = search.toLowerCase();
          results = results.filter(
            e =>
              e.metadata.name.toLowerCase().includes(term) ||
              (e.metadata.description ?? '').toLowerCase().includes(term) ||
              (e.metadata.tags ?? []).some(t => t.toLowerCase().includes(term)),
          );
        }

        if (tagsKey) {
          const tagSet = new Set(tagsKey.split(',').map(t => t.toLowerCase()));
          results = results.filter(e =>
            (e.metadata.tags ?? []).some(t => tagSet.has(t.toLowerCase())),
          );
        }

        if (categoryKey) {
          const cats = new Set(
            categoryKey.split(',').map(c => c.toLowerCase()),
          );
          results = results.filter(e => {
            const specType = (e.spec as Record<string, unknown> | undefined)
              ?.type as string | undefined;
            return specType !== undefined && cats.has(specType.toLowerCase());
          });
        }

        setEntities(results);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err : new Error('Failed to load AI assets'),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchEntities();

    return () => {
      cancelled = true;
    };
  }, [
    catalogApi,
    catalogFilter,
    search,
    categoryKey,
    tagsKey,
    owner,
    retryCount,
  ]);

  return { entities, loading, error, retry };
}
