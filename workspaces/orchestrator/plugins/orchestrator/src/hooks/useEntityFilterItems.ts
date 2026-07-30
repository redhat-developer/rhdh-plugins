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

import { SelectItem } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import {
  catalogApiRef,
  entityPresentationSnapshot,
} from '@backstage/plugin-catalog-react';

const DEFAULT_KINDS = ['Component', 'User'];

const formatEntityRef = (kind: string, namespace: string, name: string) =>
  `${kind.toLowerCase()}:${namespace}/${name}`.toLowerCase();

export const useEntityFilterItems = (options?: {
  kinds?: string[];
  enabled?: boolean;
  defaultKind?: string;
}) => {
  const catalogApi = useApi(catalogApiRef);
  const [items, setItems] = useState<SelectItem[]>([]);
  const [loading, setLoading] = useState(false);
  const enabled = options?.enabled ?? true;
  const defaultKind = options?.defaultKind ?? 'component';
  const kinds = options?.kinds ?? DEFAULT_KINDS;

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    catalogApi
      .getEntities({
        filter: { kind: kinds },
        fields: [
          'metadata.name',
          'kind',
          'metadata.namespace',
          'metadata.title',
          'spec.profile.displayName',
        ],
      })
      .then(response => {
        if (cancelled) {
          return;
        }
        const selectItems = response.items
          .map(entity => {
            const namespace = entity.metadata.namespace ?? 'default';
            const name = entity.metadata.name;
            const value = formatEntityRef(entity.kind, namespace, name);
            const { primaryTitle } = entityPresentationSnapshot(entity, {
              defaultKind,
            });
            return {
              label: primaryTitle ?? value,
              value,
            };
          })
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
  }, [catalogApi, enabled, kinds, defaultKind]);

  return { items, loading };
};
