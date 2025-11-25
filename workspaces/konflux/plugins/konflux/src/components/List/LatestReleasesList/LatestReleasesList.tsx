/* eslint-disable no-nested-ternary */
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
import { useKonfluxConfig } from '../../../hooks/useKonfluxConfig';

import { useEntitySubcomponents } from '../../../hooks/useEntitySubcomponents';
import { useDeepCompareMemoize } from '@janus-idp/shared-react';

import { useMemo } from 'react';
import {
  parseSubcomponentClusterConfigurations,
  ReleaseResource,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { useReleases } from '../../../hooks/resources/useReleases';
import { InfoCard, ResponseErrorPanel } from '@backstage/core-components';
import { getLatestRelease } from './utils';
import { LatestReleaseItemRow } from './LatestReleaseItemRow';
import { Entity } from '@backstage/catalog-model';
import { ResourceListContent } from '../../ResourceListContent/ResourceListContent';

type LatestReleaseItemRowWithPropsProps = ReleaseResource & {
  itemKey: string;
  hasSubcomponents: boolean;
  entity: Entity;
};

const LatestReleaseItemRowWithProps = (
  props: LatestReleaseItemRowWithPropsProps,
) => {
  const { hasSubcomponents, entity, itemKey, ...release } = props;
  return (
    <LatestReleaseItemRow
      release={release}
      hasSubcomponents={hasSubcomponents}
      entity={entity}
    />
  );
};

export const LatestReleasesList = () => {
  const { data: releases, loaded, error, clusterErrors } = useReleases();

  const konfluxConfig = useKonfluxConfig();
  const { entity } = useEntity();

  const { subcomponentNames, loading, subcomponentEntities } =
    useEntitySubcomponents(entity);
  const hasSubcomponents = (subcomponentEntities?.length || 0) > 1;

  const subcomponentConfigs = useDeepCompareMemoize(
    parseSubcomponentClusterConfigurations(
      konfluxConfig,
      subcomponentNames?.length > 0
        ? subcomponentNames
        : [entity.metadata.name],
    ),
  );

  // Get unique combinations (subcomponent + cluster + namespace)
  const uniqueCombinations = useDeepCompareMemoize(
    useMemo(() => {
      const seen = new Set<string>();
      const combinations: Array<{
        subcomponent: string;
        cluster: string;
        namespace: string;
      }> = [];

      subcomponentConfigs.forEach(config => {
        const key = `${config.subcomponent}:${config.cluster}:${config.namespace}`;
        if (!seen.has(key)) {
          seen.add(key);
          combinations.push({
            subcomponent: config.subcomponent,
            cluster: config.cluster,
            namespace: config.namespace,
          });
        }
      });

      return combinations;
    }, [subcomponentConfigs]),
  );

  const filteredReleases = useMemo(() => {
    if (!releases) return [];

    const res: ReleaseResource[] = [];

    uniqueCombinations?.forEach(combination => {
      const latestRelease = getLatestRelease(
        combination,
        subcomponentConfigs,
        releases,
      );

      if (latestRelease) {
        res.push(latestRelease);
      }
    });

    return res;
  }, [releases, uniqueCombinations, subcomponentConfigs]);

  const columns = useMemo(() => {
    const c: string[] = [];
    if (hasSubcomponents) {
      c.push('SUBCOMPONENT');
    }
    c.push('APPLICATION', 'RELEASE', 'CREATION TIME', 'STATUS');
    return c;
  }, [hasSubcomponents]);

  const data = useMemo<LatestReleaseItemRowWithPropsProps[]>(
    () =>
      filteredReleases?.map(release => ({
        ...release,
        itemKey: `${release.metadata?.name}-${release.metadata?.namespace}-${release.cluster.name}`,
        hasSubcomponents,
        entity,
      })) ?? [],
    [entity, filteredReleases, hasSubcomponents],
  );

  if (loaded && error) {
    return (
      <InfoCard title="Konflux Latest Releases">
        <ResponseErrorPanel
          error={new Error(error)}
          title="Failed to fetch releases"
        />
      </InfoCard>
    );
  }

  // show cluster errors only when all clusters failed
  const allClustersFailed =
    loaded &&
    (!releases || releases.length === 0) &&
    clusterErrors &&
    clusterErrors.length > 0;

  return (
    <InfoCard title="Konflux Latest Releases">
      <ResourceListContent
        loaded={loaded && !loading}
        allClustersFailed={!!allClustersFailed}
        clusterErrors={clusterErrors}
        data={data}
        emptyStateTitle="No releases found"
        emptyStateDescription="No releases match the current configuration."
        columns={columns}
        ItemRow={LatestReleaseItemRowWithProps}
      />
    </InfoCard>
  );
};
