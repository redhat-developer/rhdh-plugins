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
  KONFLUX_CLUSTER_CONFIG,
  KonfluxComponentClusterConfig,
  KonfluxConfig,
  SubcomponentClusterConfig,
  parseAuthProviderConfig,
  parseClusterConfigs,
  parseEntityKonfluxConfig,
  parseSubcomponentClusterConfigurations,
  getSubcomponentsWithFallback,
  getSubcomponentNames,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { BackstageCredentials } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';

import { Entity, stringifyEntityRef } from '@backstage/catalog-model';
import { CatalogService } from '@backstage/plugin-catalog-node';
import { KonfluxLogger } from './logger';

/**
 * Gets related entities that have a 'partOf' relation to the given entity.
 *
 * In Konflux plugin, a "subcomponent" refers to a Backstage Component that has a
 * `subcomponentOf` relationship to the current Component being viewed.
 * Backstage automatically creates a `partOf` relation from the subcomponent
 * entity to the parent entity, which is what we query for.
 *
 * @param entity - The main/parent entity to find related entities for
 * @param credentials - Backstage credentials for authentication
 * @param catalog - Catalog service instance
 * @returns Array of entities with 'partOf' relations, or null if catalog is unavailable or an error occurs
 */
const getRelatedEntities = async (
  entity: Entity,
  credentials: BackstageCredentials,
  catalog: CatalogService | null,
  konfluxLogger: KonfluxLogger,
): Promise<Entity[] | null> => {
  try {
    if (catalog) {
      const entityRef = stringifyEntityRef(entity);

      const allEntitiesForFiltering = await catalog.getEntities(
        {},
        { credentials },
      );
      const filteredRelatedEntities = allEntitiesForFiltering.items.filter(
        item =>
          item.relations?.some(
            rel => rel.type === 'partOf' && rel.targetRef === entityRef,
          ),
      );

      return filteredRelatedEntities;
    }
    return null;
  } catch (error) {
    konfluxLogger.error('Error getting related entities', error);
    return null;
  }
};

/**
 * Extracts component cluster configurations from entity annotations into flattened structure.
 *
 * Looks for subcomponent entities with 'partOf' relations (created from
 * `subcomponentOf`), falling back to the main entity if none are found.
 * Parses the KONFLUX_CLUSTER_CONFIG annotation from each entity and returns
 * a flattened array of SubcomponentClusterConfig.
 */
const extractComponentConfigsFromEntities = async (
  entity: Entity,
  credentials: BackstageCredentials,
  catalog: CatalogService | null,
  konfluxLogger: KonfluxLogger,
): Promise<SubcomponentClusterConfig[]> => {
  try {
    const relatedEntities = await getRelatedEntities(
      entity,
      credentials,
      catalog,
      konfluxLogger,
    );

    const subcomponentEntities = getSubcomponentsWithFallback(
      relatedEntities,
      entity,
    );

    const subcomponentConfigs: SubcomponentClusterConfig[] = [];

    subcomponentEntities.forEach(e => {
      const annotations = e?.metadata?.annotations || {};
      const clusterConfigAnnotation = annotations[KONFLUX_CLUSTER_CONFIG];

      const clustersParsedYaml = parseEntityKonfluxConfig<
        KonfluxComponentClusterConfig[]
      >(clusterConfigAnnotation);

      if (clustersParsedYaml) {
        const subcomponentName = e.metadata.name;
        clustersParsedYaml.forEach(clusterConfig => {
          // filter out invalid configs (missing required field)
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

    return subcomponentConfigs;
  } catch (error) {
    konfluxLogger.error(
      'Error extracting component configs from entities',
      error,
    );
    return [];
  }
};

export const getKonfluxConfig = async (
  config: Config,
  entity: Entity,
  credentials: BackstageCredentials,
  catalog: CatalogService | null,
  konfluxLogger: KonfluxLogger,
): Promise<KonfluxConfig | undefined> => {
  try {
    const konfluxConfig = config.getOptionalConfig('konflux');
    if (!konfluxConfig) {
      return undefined;
    }

    const clustersConfig = konfluxConfig.getOptionalConfig('clusters');
    const clusters = parseClusterConfigs(clustersConfig) || {};

    const authProvider = parseAuthProviderConfig(konfluxConfig);

    const subcomponentConfigs = await extractComponentConfigsFromEntities(
      entity,
      credentials,
      catalog,
      konfluxLogger,
    );

    return {
      clusters,
      subcomponentConfigs,
      authProvider,
    };
  } catch (error) {
    konfluxLogger.error('Error parsing Konflux configuration', error);
    return undefined;
  }
};

export const determineClusterNamespaceCombinations = async (
  entity: Entity,
  credentials: BackstageCredentials,
  konfluxConfig: KonfluxConfig | undefined,
  konfluxLogger: KonfluxLogger,
  catalog: CatalogService,
): Promise<SubcomponentClusterConfig[]> => {
  if (!konfluxConfig) {
    konfluxLogger.warn('No Konflux configuration found in app-config.yaml');
    return [];
  }

  const relatedEntities = await getRelatedEntities(
    entity,
    credentials,
    catalog,
    konfluxLogger,
  );

  const subcomponentEntities = getSubcomponentsWithFallback(
    relatedEntities,
    entity,
  );
  const finalSubcomponentNames = getSubcomponentNames(subcomponentEntities);

  // Get configs for the requested subcomponents
  const subcomponentConfigs = parseSubcomponentClusterConfigurations(
    konfluxConfig,
    finalSubcomponentNames,
  );

  // Group by subcomponent+cluster+namespace and combine applications
  const grouped = new Map<string, SubcomponentClusterConfig>();

  subcomponentConfigs.forEach(config => {
    const key = `${config.subcomponent}:${config.cluster}:${config.namespace}`;
    const existing = grouped.get(key);

    if (existing) {
      // merge applications, avoiding duplicates
      const allApplications = [
        ...existing.applications,
        ...config.applications,
      ];
      existing.applications = Array.from(new Set(allApplications));
    } else {
      grouped.set(key, { ...config });
    }
  });

  return Array.from(grouped.values());
};
