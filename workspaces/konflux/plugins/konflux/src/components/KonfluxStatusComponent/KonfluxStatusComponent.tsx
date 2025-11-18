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

import { InfoCard } from '@backstage/core-components';
import { usePipelineruns } from '../../hooks/resources/usePipelineruns';

import { useMemo } from 'react';
import { useEntitySubcomponents } from '../../hooks/useEntitySubcomponents';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useReleases } from '../../hooks/resources/useReleases';

import { SubcomponentLatestPipelineRunByType } from './types';
import { getLatestPLRs } from './utils';
import { SubcomponentsLatestPipelineRunByTypeComponent } from './SubcomponentsLatestPipelineRunByTypeComponent';
import { KonfluxQueryProvider } from '../../api';

export const WrappedContent = () => {
  const { data: plrs, loaded } = usePipelineruns();
  const { data: releases, loaded: loadedReleases } = useReleases();

  const { entity } = useEntity();
  const {
    subcomponentNames,
    loading: entitySubcomponentsLoading,
    subcomponentEntities,
  } = useEntitySubcomponents(entity);

  const subcomponentsLatestPipelineRunByType =
    useMemo<SubcomponentLatestPipelineRunByType>(() => {
      const result: SubcomponentLatestPipelineRunByType = {};
      subcomponentNames.forEach(subcomponentName => {
        result[subcomponentName] = getLatestPLRs(
          subcomponentName,
          plrs,
          releases,
        );
      });
      return result;
    }, [plrs, subcomponentNames, releases]);

  return (
    <InfoCard title="Konflux Status">
      <SubcomponentsLatestPipelineRunByTypeComponent
        subcomponentsLatestPipelineRunByType={
          subcomponentsLatestPipelineRunByType
        }
        isLoading={!loaded || !loadedReleases || entitySubcomponentsLoading}
        entities={subcomponentEntities}
      />
    </InfoCard>
  );
};

export const KonfluxStatusComponent = () => {
  return (
    <KonfluxQueryProvider>
      <WrappedContent />
    </KonfluxQueryProvider>
  );
};

export default KonfluxStatusComponent;
