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

import { useEffect, useState } from 'react';

import type { Entity } from '@backstage/catalog-model';
import { SelectItem } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import {
  catalogApiRef,
  entityPresentationSnapshot,
} from '@backstage/plugin-catalog-react';

import {
  Filter,
  PaginationInfoDTO,
  PaginationInfoDTOOrderDirectionEnum,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { orchestratorApiRef } from '../api';

const RUN_BY_FILTER_PAGE_SIZE = 500;

const getInitiatorLabel = (entityRef: string, entity?: Entity): string => {
  if (entity) {
    return (
      entityPresentationSnapshot(entity, { defaultKind: 'user' })
        .primaryTitle ?? entityRef
    );
  }

  return (
    entityPresentationSnapshot(entityRef, { defaultKind: 'user' })
      .primaryTitle ?? entityRef
  );
};

export const collectDistinctInitiatorEntities = (
  instances: Array<{ initiatorEntity?: string }>,
  additionalInitiators: string[] = [],
): string[] => {
  const initiators = new Set<string>();

  instances.forEach(instance => {
    if (instance.initiatorEntity) {
      initiators.add(instance.initiatorEntity);
    }
  });

  additionalInitiators.forEach(initiator => {
    if (initiator) {
      initiators.add(initiator);
    }
  });

  return Array.from(initiators);
};

export const useRunByFilterItems = (options: {
  enabled?: boolean;
  filters?: Filter;
  additionalInitiators?: string[];
}) => {
  const orchestratorApi = useApi(orchestratorApiRef);
  const catalogApi = useApi(catalogApiRef);
  const [items, setItems] = useState<SelectItem[]>([]);
  const [loading, setLoading] = useState(false);
  const enabled = options.enabled ?? true;
  const additionalInitiatorsKey = (options.additionalInitiators ?? []).join(
    '|',
  );

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    const paginationInfo: PaginationInfoDTO = {
      pageSize: RUN_BY_FILTER_PAGE_SIZE,
      offset: 0,
      orderBy: 'start',
      orderDirection: PaginationInfoDTOOrderDirectionEnum.Desc,
    };

    orchestratorApi
      .listInstances(paginationInfo, options.filters)
      .then(async response => {
        if (cancelled) {
          return;
        }

        const refs = collectDistinctInitiatorEntities(
          response.data.items ?? [],
          options.additionalInitiators,
        );

        if (refs.length === 0) {
          setItems([]);
          return;
        }

        const entitiesResponse = await catalogApi.getEntitiesByRefs({
          entityRefs: refs,
          fields: [
            'metadata.name',
            'kind',
            'metadata.namespace',
            'metadata.title',
            'spec.profile.displayName',
          ],
        });

        if (cancelled) {
          return;
        }

        const selectItems = refs
          .map((ref, index) => ({
            label: getInitiatorLabel(ref, entitiesResponse.items[index]),
            value: ref,
          }))
          .sort((a, b) => a.label.localeCompare(b.label));

        setItems(selectItems);
      })
      .catch(() => {
        if (!cancelled) {
          setItems([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    orchestratorApi,
    catalogApi,
    enabled,
    options.filters,
    additionalInitiatorsKey,
    options.additionalInitiators,
  ]);

  return { items, loading };
};
