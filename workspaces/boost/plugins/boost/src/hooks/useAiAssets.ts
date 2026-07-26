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
import type { FilterDefinition } from '../blueprints/AiCatalogFilterBlueprint';
import { applyEntityFilters } from '../utils/entityHelpers';
import { buildCatalogFilter, isAiAsset } from '../utils/isAiAsset';

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
 * Fetches all AI asset entities from the catalog and applies filters
 * client-side. The catalog API is called once on mount (and on retry);
 * all filtering is a pure memo over the cached result.
 */
export function useAiAssets(
  search: string | undefined,
  filters: FilterDefinition[],
  filterValues: Map<string, string[]>,
): UseAiAssetsResult {
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
        if (!cancelled) {
          const items = response.items
            .filter(isAiAsset)
            .sort((a, b) =>
              (a.metadata.title ?? a.metadata.name).localeCompare(
                b.metadata.title ?? b.metadata.name,
              ),
            );
          setAllEntities(items);
        }
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
    () => applyEntityFilters(allEntities, search, filters, filterValues),
    [allEntities, search, filters, filterValues],
  );

  return { entities, allEntities, loading, error, retry };
}
