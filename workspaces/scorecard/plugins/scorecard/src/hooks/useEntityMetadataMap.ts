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

import { useEffect, useMemo, useState } from 'react';

import type { Entity } from '@backstage/catalog-model';
import { parseEntityRef, stringifyEntityRef } from '@backstage/catalog-model';
import { useApi } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { EntityMetadata, EntityMetadataMap } from '../components/types';

type RefFilter = {
  kind: string;
  'metadata.name': string;
  'metadata.namespace': string;
};

const uniqueEntityRefs = (refs: string[]) => {
  const seen = new Set<string>();
  const result: string[] = [];
  refs.forEach(ref => {
    const trimmed = ref?.trim();
    if (!trimmed || seen.has(trimmed)) {
      return;
    }
    seen.add(trimmed);
    result.push(trimmed);
  });
  return result;
};

const refToFilter = (ref: string): RefFilter | null => {
  try {
    const { kind, namespace, name } = parseEntityRef(ref);
    return {
      kind,
      'metadata.name': name,
      'metadata.namespace': namespace ?? 'default',
    };
  } catch {
    return null;
  }
};

const toEntityMetadata = (entity: Entity): EntityMetadata => ({
  title: entity?.metadata?.title?.trim(),
  description: entity?.metadata?.description?.trim(),
  kind: entity?.kind,
});

export const useEntityMetadataMap = (entityRefs: string[]) => {
  const catalogApi = useApi(catalogApiRef);
  const [entityMetadataMap, setEntityMetadataMap] = useState<EntityMetadataMap>(
    {},
  );

  const refs = useMemo(
    () => uniqueEntityRefs(entityRefs),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entityRefs.join('|')],
  );

  const refFilters = useMemo(
    () => refs.map(refToFilter).filter(Boolean) as RefFilter[],
    [refs],
  );

  useEffect(() => {
    let cancelled = false;
    const clearMap = () => setEntityMetadataMap({});

    if (refFilters.length === 0) {
      clearMap();
      return () => {
        cancelled = true;
      };
    }

    const fetchEntities = async () => {
      try {
        const response = await catalogApi.getEntities({
          filter: refFilters,
        });
        if (cancelled) {
          return;
        }
        const nextMap: EntityMetadataMap = {};
        response.items?.forEach((entity: Entity) => {
          nextMap[stringifyEntityRef(entity)] = toEntityMetadata(entity);
        });
        setEntityMetadataMap(nextMap);
      } catch {
        if (!cancelled) {
          clearMap();
        }
      }
    };

    fetchEntities();

    return () => {
      cancelled = true;
    };
  }, [catalogApi, refFilters]);

  return { entityMetadataMap };
};
