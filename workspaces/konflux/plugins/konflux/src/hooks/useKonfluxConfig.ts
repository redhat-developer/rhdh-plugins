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
import {
  KonfluxConfig,
  parseAuthProviderConfig,
  parseClusterConfigs,
  SubcomponentClusterConfig,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import { useMemo } from 'react';
import { useEntitiesKonfluxConfig } from './useEntitiesKonfluxConfig';

/**
 * Hook to access Konflux configuration.
 *
 * Combines configuration from:
 * - app-config.yaml (clusters and authProvider)
 * - Entity annotations (subcomponent configurations from subcomponent entities)
 *
 * @returns KonfluxConfig object with clusters, subcomponentConfigs, and authProvider, or undefined if config is not found or parsing fails
 */
export const useKonfluxConfig = (): KonfluxConfig | undefined => {
  const config = useApi(configApiRef);

  const subcomponentConfigsFromEntities = useEntitiesKonfluxConfig();

  return useMemo(() => {
    try {
      const konfluxConfig = config.getOptionalConfig('konflux');

      const subcomponentConfigs: SubcomponentClusterConfig[] =
        subcomponentConfigsFromEntities || [];

      // if konflux config section is not found, return a minimal config with just subcomponentConfigs
      if (!konfluxConfig) {
        return {
          clusters: {},
          subcomponentConfigs,
          authProvider: 'serviceAccount',
        };
      }

      const clustersConfig = konfluxConfig.getOptionalConfig('clusters');
      const clusters = parseClusterConfigs(clustersConfig) || {};

      const authProvider = parseAuthProviderConfig(konfluxConfig);

      return {
        clusters,
        subcomponentConfigs,
        authProvider,
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to read Konflux configuration:', error);
      return {
        clusters: {},
        subcomponentConfigs: subcomponentConfigsFromEntities || [],
        authProvider: 'serviceAccount' as const,
      };
    }
  }, [subcomponentConfigsFromEntities, config]);
};
