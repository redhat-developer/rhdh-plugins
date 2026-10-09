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

import { MetricResult } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { ResponseErrorPanel } from '@backstage/core-components';

import NoScorecardsState from '../Common/NoScorecardsState';
import { useScorecards } from '../../hooks/useScorecards';
import PermissionRequiredState from '../Common/PermissionRequiredState';
import { CardLoading } from '../Common/CardLoading';
import { EntityMetricCard } from './EntityMetricCard';
import { EntityScorecardGrid } from './entityScorecardGridSx';

const EntityScorecardContentInner = () => {
  const { data: scorecards, isLoading, error } = useScorecards();

  if (isLoading) {
    return <CardLoading />;
  }

  if (error) {
    if (error.message?.includes('NotAllowedError')) {
      return <PermissionRequiredState />;
    }
    return <ResponseErrorPanel error={error} />;
  }

  if (!isLoading && scorecards?.length === 0) {
    return <NoScorecardsState />;
  }

  return (
    <EntityScorecardGrid>
      {scorecards?.map((metric: MetricResult) => (
        <EntityMetricCard key={metric.id} metric={metric} />
      ))}
    </EntityScorecardGrid>
  );
};

export const EntityScorecardContent = () => <EntityScorecardContentInner />;
