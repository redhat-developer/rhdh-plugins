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
import { useApiHolder, useApp, createApiRef } from '@backstage/core-plugin-api';
import { appTreeApiRef } from '@backstage/frontend-plugin-api';
import type { PluginAvailability } from '../utils';

const catalogApiRef = createApiRef<unknown>({ id: 'plugin.catalog.service' });

/**
 * Hook to detect availability of dependent core plugins (catalog, scaffolder,
 * techdocs, api-docs, adoption-insights, extensions) in the application runtime.
 *
 * Inspects both the New Frontend System (NFS) extension tree via `appTreeApiRef`
 * and the app/api holder fallbacks.
 *
 * @internal
 */
export function usePluginAvailability(): PluginAvailability {
  const apiHolder = useApiHolder();
  const appTreeApi = apiHolder.get(appTreeApiRef);
  const app = useApp();
  const catalogApi = apiHolder.get(catalogApiRef);

  return useMemo(() => {
    let treeNodes: any[] = [];
    if (appTreeApi) {
      try {
        const { tree } = appTreeApi.getTree();
        treeNodes = Array.from(tree.nodes.values()).filter(
          node => !node.spec.disabled,
        );
      } catch {
        // Fallback to empty nodes if tree cannot be retrieved
      }
    }

    const checkAvailable = (
      pluginId: string,
      pagePrefixes: string[],
    ): boolean => {
      if (treeNodes.length > 0) {
        for (const node of treeNodes) {
          if (node.spec.plugin?.id === pluginId) {
            return true;
          }
          if (
            pagePrefixes.some(
              prefix =>
                node.spec.id === prefix ||
                node.spec.id.startsWith(`${prefix}/`),
            )
          ) {
            return true;
          }
        }
        return false;
      }

      try {
        return app?.getPlugins?.()?.some(p => p.getId() === pluginId) ?? false;
      } catch {
        return false;
      }
    };

    const isCatalogAvailable =
      Boolean(catalogApi) ||
      checkAvailable('catalog', ['page:catalog', 'page:catalog/entity']);

    const isScaffolderAvailable = checkAvailable('scaffolder', [
      'page:scaffolder',
    ]);

    // TechDocs requires both TechDocs capability AND catalog availability
    const isTechDocsAvailable =
      isCatalogAvailable && checkAvailable('techdocs', ['page:techdocs']);

    // API Docs requires API Docs capability AND catalog availability
    const isApiDocsAvailable =
      isCatalogAvailable && checkAvailable('api-docs', ['page:api-docs']);

    const isAdoptionInsightsAvailable = checkAvailable('adoption-insights', [
      'page:adoption-insights',
    ]);

    const isExtensionsAvailable = checkAvailable('extensions', [
      'page:extensions',
    ]);

    return {
      isCatalogAvailable,
      isScaffolderAvailable,
      isTechDocsAvailable,
      isApiDocsAvailable,
      isAdoptionInsightsAvailable,
      isExtensionsAvailable,
    };
  }, [appTreeApi, app, catalogApi]);
}
