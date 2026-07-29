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

import { configApiRef, useApi } from '@backstage/core-plugin-api';

import type { ExtensionsPlugin } from '@red-hat-developer-hub/backstage-plugin-extensions-common';
import { ExtensionsAnnotation } from '@red-hat-developer-hub/backstage-plugin-extensions-common';

export interface CatalogSourceMeta {
  label: string;
  description?: string;
  badge?: string;
}

export const useCatalogSourceConfig = (): Record<string, CatalogSourceMeta> => {
  const configApi = useApi(configApiRef);

  return useMemo(() => {
    const result: Record<string, CatalogSourceMeta> = {};
    const sourcesConfig = configApi.getOptionalConfig(
      'extensions.catalogSources',
    );
    if (!sourcesConfig) return result;

    for (const key of sourcesConfig.keys()) {
      const sourceConfig = sourcesConfig.getConfig(key);
      result[key] = {
        label: sourceConfig.getString('label'),
        description: sourceConfig.getOptionalString('description'),
        badge: sourceConfig.getOptionalString('badge'),
      };
    }
    return result;
  }, [configApi]);
};

export const getCatalogSourceLabel = (
  plugin: ExtensionsPlugin,
  sourcesConfig: Record<string, CatalogSourceMeta>,
): string => {
  const sourceKey =
    plugin.metadata?.annotations?.[ExtensionsAnnotation.CATALOG_SOURCE];
  if (!sourceKey) return '';
  return sourcesConfig[sourceKey]?.label ?? sourceKey;
};
