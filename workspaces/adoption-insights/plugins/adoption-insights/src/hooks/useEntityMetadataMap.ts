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

type EntityMetadata = {
  title?: string;
  description?: string;
  kind?: string;
};

type EntityMetadataMap = Record<string, EntityMetadata>;

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

  const refFilters = useMemo(() => {
    return refs
      .map(ref => {
        try {
          const { kind, namespace, name } = parseEntityRef(ref);
          return {
            kind,
            'metadata.name': name,
            'metadata.namespace': namespace ?? 'default',
          };
        } catch (error) {
          return null;
        }
      })
      .filter(Boolean) as Array<{
      kind: string;
      'metadata.name': string;
      'metadata.namespace': string;
    }>;
  }, [refs]);

  useEffect(() => {
    let cancelled = false;

    if (refFilters.length === 0) {
      setEntityMetadataMap({});
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
          const entityRef = stringifyEntityRef(entity);
          nextMap[entityRef] = {
            title: entity?.metadata?.title?.trim(),
            description: entity?.metadata?.description?.trim(),
            kind: entity?.kind,
          };
        });
        setEntityMetadataMap(nextMap);
      } catch (error) {
        if (!cancelled) {
          setEntityMetadataMap({});
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
