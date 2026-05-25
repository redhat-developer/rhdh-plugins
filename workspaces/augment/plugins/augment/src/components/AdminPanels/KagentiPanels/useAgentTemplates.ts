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

import { useEffect, useState, useMemo } from 'react';
import { useApiHolder } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import type { Entity } from '@backstage/catalog-model';
import { getErrorMessage } from '../../../utils';

export interface UseAgentTemplatesOptions {
  tag?: string;
  specType?: string;
}

export interface UseAgentTemplatesReturn {
  templates: Entity[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useAgentTemplates(
  options?: UseAgentTemplatesOptions,
): UseAgentTemplatesReturn {
  const apiHolder = useApiHolder();
  const catalogApi = useMemo(() => {
    try {
      return apiHolder.get(catalogApiRef);
    } catch {
      return undefined;
    }
  }, [apiHolder]);

  const [templates, setTemplates] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const tag = options?.tag;
  const specType = options?.specType;

  useEffect(() => {
    if (!catalogApi) {
      setLoading(false);
      setError(
        'Catalog API is not available. Templates require a full Backstage deployment with the catalog plugin.',
      );
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const baseFilter: Record<string, string> = { kind: 'Template' };
    if (tag) {
      baseFilter['metadata.tags'] = tag;
    }

    async function fetchTemplates(): Promise<Entity[]> {
      if (specType) {
        const typed = await catalogApi!.getEntities({
          filter: { ...baseFilter, 'spec.type': specType },
        });
        if (typed.items.length > 0) return typed.items;
      }
      const all = await catalogApi!.getEntities({ filter: baseFilter });
      return all.items;
    }

    fetchTemplates()
      .then(items => {
        if (!cancelled) setTemplates(items);
      })
      .catch(err => {
        if (!cancelled) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [catalogApi, tag, specType, tick]);

  const reload = () => setTick(t => t + 1);

  return { templates, loading, error, reload };
}
