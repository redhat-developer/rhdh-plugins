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

import type { AggregatedMetricResult } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { StatusGroupedCardComponent } from './StatusGroupedCard/StatusGroupedCardComponent';
import { WeightedStatusScoreCardComponent } from './WeightedStatusScoreCard/WeightedStatusScoreCardComponent';
import { ScalarStatCard } from './ScalarStatCard/ScalarStatCard';
import { UnsupportedAggregationType } from './UnsupportedAggregationType';
import {
  isDistributionAggregationResult,
  isScalarAggregationResult,
  isWeightedStatusScoreResult,
} from '../../utils';

import type { WeightedStatusScoreCardComponentProps } from './WeightedStatusScoreCard/types';
import type { StatusGroupedCardComponentProps } from './StatusGroupedCard/types';
import type { ScalarStatCardProps } from './ScalarStatCard/types';
import type { AggregatedMetricCardBaseProps } from './types';

type AggregatedMetricCardProps = AggregatedMetricCardBaseProps & {
  scorecard: AggregatedMetricResult;
};

const isScalarStatCardProps = (
  props: AggregatedMetricCardProps,
): props is ScalarStatCardProps =>
  isScalarAggregationResult(props.scorecard.result);

const isWeightedStatusScoreCardProps = (
  props: AggregatedMetricCardProps,
): props is WeightedStatusScoreCardComponentProps =>
  isWeightedStatusScoreResult(props.scorecard.result);

const isStatusGroupedCardProps = (
  props: AggregatedMetricCardProps,
): props is StatusGroupedCardComponentProps =>
  isDistributionAggregationResult(props.scorecard.result);

export const AggregatedMetricCard = (props: AggregatedMetricCardProps) => {
  const { cardTitle, description, dataTestId, scorecard } = props;

  if (isScalarStatCardProps(props)) {
    return <ScalarStatCard {...props} />;
  }
  if (isWeightedStatusScoreCardProps(props)) {
    return <WeightedStatusScoreCardComponent {...props} />;
  }
  if (isStatusGroupedCardProps(props)) {
    return <StatusGroupedCardComponent {...props} />;
  }
  return (
    <UnsupportedAggregationType
      cardTitle={cardTitle}
      description={description}
      dataTestId={dataTestId}
      aggregationType={String(scorecard.metadata.aggregationType)}
    />
  );
};
