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
import { useApi } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import type { Entity } from '@backstage/catalog-model';
import { getErrorMessage } from '../../../utils';

const DEFAULT_AGENT_TEMPLATE_TAG = 'kagenti-agent';

export interface UseAgentTemplatesReturn {
  templates: Entity[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useAgentTemplates(
  tag?: string,
): UseAgentTemplatesReturn {
  const catalogApi = useApi(catalogApiRef);
  const [templates, setTemplates] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const filterTag = tag ?? DEFAULT_AGENT_TEMPLATE_TAG;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    catalogApi
      .getEntities({
        filter: {
          kind: 'Template',
          'metadata.tags': filterTag,
        },
      })
      .then(res => {
        if (!cancelled) setTemplates(res.items);
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
  }, [catalogApi, filterTag, tick]);

  const reload = () => setTick(t => t + 1);

  return { templates, loading, error, reload };
}
