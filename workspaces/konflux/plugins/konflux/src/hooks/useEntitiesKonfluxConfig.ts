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

import { useEntity } from '@backstage/plugin-catalog-react';
import { useEntitySubcomponents } from './useEntitySubcomponents';
import { useMemo } from 'react';
import {
  KONFLUX_CLUSTER_CONFIG,
  KonfluxComponentClusterConfig,
  SubcomponentClusterConfig,
  parseEntityKonfluxConfig,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';

export const useEntitiesKonfluxConfig = ():
  | SubcomponentClusterConfig[]
  | null => {
  const { entity } = useEntity();

  const { subcomponentEntities } = useEntitySubcomponents(entity);

  return useMemo(() => {
    if (!subcomponentEntities) {
      return null;
    }

    const subcomponentConfigs: SubcomponentClusterConfig[] = [];
    try {
      subcomponentEntities.forEach(e => {
        const annotations = e?.metadata?.annotations || {};
        const clusterConfigAnnotation = annotations[KONFLUX_CLUSTER_CONFIG];

        const clustersParsedYaml = parseEntityKonfluxConfig<
          KonfluxComponentClusterConfig[]
        >(clusterConfigAnnotation);

        if (clustersParsedYaml) {
          const subcomponentName = e.metadata.name;
          clustersParsedYaml.forEach(clusterConfig => {
            // filter out invalid configs (missing required fields)
            if (
              clusterConfig.cluster &&
              clusterConfig.namespace &&
              clusterConfig.applications &&
              clusterConfig.applications.length > 0
            ) {
              subcomponentConfigs.push({
                subcomponent: subcomponentName,
                cluster: clusterConfig.cluster,
                namespace: clusterConfig.namespace,
                applications: clusterConfig.applications,
              });
            }
          });
        }
      });

      return subcomponentConfigs.length > 0 ? subcomponentConfigs : null;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to parse Konflux entity configurations:', e);
      return null;
    }
  }, [subcomponentEntities]);
};
