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
import { useApiHolder, useApp } from '@backstage/core-plugin-api';
import { appTreeApiRef } from '@backstage/frontend-plugin-api';

/**
 * Hook to check if the User Settings plugin (or its /settings page) is available
 * and enabled in the application.
 *
 * @internal
 */
export function useIsSettingsAvailable(): boolean {
  const apiHolder = useApiHolder();
  const appTreeApi = apiHolder.get(appTreeApiRef);
  const app = useApp();

  return useMemo(() => {
    if (appTreeApi) {
      try {
        const { tree } = appTreeApi.getTree();
        for (const node of tree.nodes.values()) {
          if (!node.spec.disabled) {
            if (
              node.spec.plugin?.id === 'user-settings' ||
              node.spec.id === 'page:user-settings' ||
              node.spec.id.startsWith('page:user-settings')
            ) {
              return true;
            }
          }
        }
        return false;
      } catch {
        // Fallback to app.getPlugins() below
      }
    }

    try {
      return (
        app?.getPlugins?.()?.some(
          plugin => plugin.getId() === 'user-settings',
        ) ?? false
      );
    } catch {
      return false;
    }
  }, [appTreeApi, app]);
}
