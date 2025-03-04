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
import React from 'react';

import { useApi } from '@backstage/core-plugin-api';
import { useAsyncRetry, useInterval } from 'react-use';

import { adoptionInsightsApiRef } from '../api';
import { Templates, TemplatesOptions } from '../types';

export const useTemplates = ({
  start_date,
  end_date,
  limit = 3,
  intervalMs = 10000,
}: TemplatesOptions): {
  templates: Templates[];
  error: Error | undefined;
  loading: boolean;
} => {
  const [loadingData, setLoadingData] = React.useState<boolean>(true);
  const [templates, setTemplates] = React.useState<Templates[]>([]);

  const api = useApi(adoptionInsightsApiRef);

  const getTemplates = React.useCallback(async () => {
    return await api
      .getTemplates({
        type: 'top_catalog_entities',
        start_date,
        end_date,
        limit,
      })
      .then(response => setTemplates(response ?? []));
  }, [api, start_date, end_date, limit]);

  const { error, loading, retry } = useAsyncRetry(async () => {
    return await getTemplates();
  }, [getTemplates]);

  useInterval(() => retry(), intervalMs);

  React.useEffect(() => {
    let mounted = true;
    if (!loading && mounted) {
      setLoadingData(false);
    }
    return () => {
      mounted = false;
    };
  }, [loading]);

  return { templates, error, loading: loadingData };
};
