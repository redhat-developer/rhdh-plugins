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

import { useTheme } from '@mui/material/styles';
import type { TranslationFunction } from '@backstage/core-plugin-api/alpha';

import { CardWrapper } from '../../Common/CardWrapper';
import {
  formatWithMetricUnit,
  getMatchingThresholdKey,
  getStatusConfig,
  resolveStatusColor,
} from '../../../utils';
import { useTranslation } from '../../../hooks/useTranslation';
import { scorecardTranslationRef } from '../../../translations';
import { CardInfoButton } from '../components/CardInfoButton';
import { CardSubheader } from '../components/CardSubheader';
import { CardChartContainer } from '../components/CardChartContainer';
import { formatAggregationScoreDetail } from '../WeightedStatusScoreCard/TooltipContent';
import { ScalarStatTile } from './ScalarStatTile';
import type { ScalarStatCardProps } from './types';

function getAggregationTypeLabel(
  aggregationType: string,
  t: TranslationFunction<typeof scorecardTranslationRef.T>,
): string {
  if (!aggregationType) {
    return '';
  }

  const key = `aggregation.${aggregationType}`;
  const translated = t(key as any, {});
  if (translated !== key) {
    return translated;
  }

  return aggregationType.charAt(0).toUpperCase() + aggregationType.slice(1);
}

export const ScalarStatCard = ({
  scorecard,
  cardTitle,
  description,
  aggregationId,
  showSubheader = true,
  showInfo = true,
  dataTestId,
}: ScalarStatCardProps) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { result, metadata, id: scorecardId } = scorecard;

  // No successful samples: value is a placeholder (often 0) and must not
  // pick up a success threshold color. Empty and all-failed both have total 0.
  const matchingThresholdKey =
    result.total > 0
      ? getMatchingThresholdKey(result.value, result.thresholds)
      : undefined;
  const statusConfig = getStatusConfig({
    evaluation: matchingThresholdKey ?? null,
    thresholdRules: result.thresholds?.rules,
  });
  const resolvedColor = matchingThresholdKey
    ? resolveStatusColor(theme, statusConfig.color)
    : theme.palette.grey[500];
  const displayValue = formatWithMetricUnit(
    formatAggregationScoreDetail(result.value),
    metadata.unit,
  );
  const aggregationLabel = getAggregationTypeLabel(metadata.aggregationType, t);

  const subheader = showSubheader ? (
    <CardSubheader
      aggregationId={aggregationId}
      scorecardId={scorecardId}
      entitiesCount={result.total}
      entitiesConsidered={result.entitiesConsidered}
      calculationErrorCount={result.calculationErrorCount}
    />
  ) : null;

  const info = showInfo ? (
    <CardInfoButton timestamp={result.timestamp} />
  ) : null;

  return (
    <CardWrapper
      title={cardTitle}
      dataTestId={dataTestId}
      subheader={subheader}
      description={description}
      info={info}
    >
      <CardChartContainer>
        <ScalarStatTile
          displayValue={displayValue}
          label={aggregationLabel}
          resolvedColor={resolvedColor}
          thresholdStatus={matchingThresholdKey}
        />
      </CardChartContainer>
    </CardWrapper>
  );
};
