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
  aggregationTypes,
  type AggregatedMetricResult,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { StatusGroupedCardComponent } from './StatusGroupedCard/StatusGroupedCardComponent';
import { WeightedStatusScoreCardComponent } from './WeightedStatusScoreCard/WeightedStatusScoreCardComponent';
import { UnsupportedAggregationType } from './UnsupportedAggregationType';

import type { WeightedStatusScoreCardComponentProps } from './WeightedStatusScoreCard/types';
import type { StatusGroupedCardComponentProps } from './StatusGroupedCard/types';
import type { AggregatedMetricCardBaseProps } from './types';

type AggregatedMetricCardProps = AggregatedMetricCardBaseProps & {
  scorecard: AggregatedMetricResult;
};

const isStatusGroupedCardProps = (
  props: AggregatedMetricCardProps,
): props is StatusGroupedCardComponentProps =>
  props.scorecard.metadata.aggregationType === aggregationTypes.statusGrouped;

const isWeightedStatusScoreCardProps = (
  props: AggregatedMetricCardProps,
): props is WeightedStatusScoreCardComponentProps =>
  props.scorecard.metadata.aggregationType ===
  aggregationTypes.weightedStatusScore;

export const AggregatedMetricCard = (props: AggregatedMetricCardProps) => {
  const { cardTitle, description, dataTestId, scorecard } = props;

  if (isStatusGroupedCardProps(props)) {
    return <StatusGroupedCardComponent {...props} />;
  }
  if (isWeightedStatusScoreCardProps(props)) {
    return <WeightedStatusScoreCardComponent {...props} />;
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
