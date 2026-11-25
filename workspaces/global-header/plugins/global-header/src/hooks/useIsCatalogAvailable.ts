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

import { useMemo } from 'react';
import { useApiHolder } from '@backstage/core-plugin-api';
import { appTreeApiRef } from '@backstage/frontend-plugin-api';

/**
 * Hook to check if the Catalog Entity Page is available and enabled in the application.
 * Specifically checks for 'page:catalog/entity', which is required for user profile
 * and entity navigation (/catalog/:namespace/:kind/:name).
 *
 * @internal
 */
export function useIsCatalogAvailable(): boolean {
  const apiHolder = useApiHolder();
  const appTreeApi = apiHolder.get(appTreeApiRef);

  return useMemo(() => {
    if (appTreeApi) {
      try {
        const { tree } = appTreeApi.getTree();
        for (const node of tree.nodes.values()) {
          if (!node.spec.disabled && node.spec.id === 'page:catalog/entity') {
            return true;
          }
        }
        return false;
      } catch {
        // Ignore errors
      }
    }

    return false;
  }, [appTreeApi]);
}
