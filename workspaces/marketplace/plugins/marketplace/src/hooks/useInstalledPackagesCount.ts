/*
 * Copyright The Backstage Authors
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

import { useState, useEffect } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { dynamicPluginsInfoApiRef } from '../api';
// Count should reflect all records from dynamic-plugins-info

export const useInstalledPackagesCount = () => {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | undefined>(undefined);
  const dynamicPluginInfo = useApi(dynamicPluginsInfoApiRef);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        setLoading(true);
        setError(undefined);
        const plugins = await dynamicPluginInfo.listLoadedPlugins();
        setCount(plugins.length);
      } catch (err) {
        setError(err as Error);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();
  }, [dynamicPluginInfo]);

  return { count, loading, error };
};
