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

import React, { useMemo } from 'react';
import { InfoCard } from '@backstage/core-components';
import type { RecommendationBoxPlots } from '@red-hat-developer-hub/plugin-redhat-resource-optimization-common/models';
import {
  UsageType,
  RecommendationType,
  OptimizationType,
  Interval,
} from '../../../../models/ChartEnums';
import { InfoCardTitle } from '../../../../../../components/InfoCardTitle';
import { IntlBreakdownChart } from './components/IntlBreakdownChart';

interface ChartInfoCardProps {
  title: React.ReactNode;
  recommendationTerm: Interval;
  chartData: RecommendationBoxPlots;
  resourceType: RecommendationType;
  optimizationType: OptimizationType;
}

export const ChartInfoCard = (props: ChartInfoCardProps) => {
  const usageType = useMemo(
    () =>
      props.resourceType === 'cpu' ? UsageType.cpuUsage : UsageType.memoryUsage,
    [props.resourceType],
  );

  return (
    <InfoCard title={<InfoCardTitle title={props.title} />}>
      <IntlBreakdownChart
        recommendationTerm={props.recommendationTerm}
        value={props.chartData}
        usageType={usageType}
        recommendationType={props.resourceType}
        optimizationType={props.optimizationType}
      />
    </InfoCard>
  );
};
ChartInfoCard.displayName = 'ChartInfoCard';
