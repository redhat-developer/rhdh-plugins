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

import { useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import type { TranslationFunction } from '@backstage/core-plugin-api/alpha';

import { CardWrapper } from '../../Common/CardWrapper';
import { formatWithMetricUnit, resolveStatusColor } from '../../../utils';
import { useTranslation } from '../../../hooks/useTranslation';
import { scorecardTranslationRef } from '../../../translations';
import { MetricDataSources } from '../../DataSources/MetricDataSources';
import {
  getEvaluationKeyFromChartColor,
  toAggregatedDialogMetricResult,
} from '../../DataSources/toAggregatedDialogMetricResult';
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

  return (
    aggregationType.charAt(0).toLocaleUpperCase('en-US') +
    aggregationType.slice(1)
  );
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

  const resolvedColor = result.aggregationChartDisplayColor
    ? resolveStatusColor(theme, result.aggregationChartDisplayColor)
    : theme.palette.grey[300];
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

  const evaluation = getEvaluationKeyFromChartColor(
    result.aggregationChartDisplayColor,
    result.thresholds?.rules,
  );

  const metricSnapshot = useMemo(
    () =>
      toAggregatedDialogMetricResult({
        t,
        metricId: scorecardId,
        cardTitle,
        type: metadata.type,
        unit: metadata.unit,
        value: result.value,
        timestamp: result.timestamp,
        evaluation,
        thresholds: result.thresholds,
      }),
    [t, scorecardId, cardTitle, metadata, result, evaluation],
  );

  const info = showInfo ? (
    <MetricDataSources
      title={cardTitle}
      metricId={scorecardId}
      lastSyncedTimestamp={result.timestamp}
      metric={metricSnapshot}
      unavailableStatusLabel={t('dataSourcesDialog.collectorUnavailableStatus')}
    />
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
        />
      </CardChartContainer>
    </CardWrapper>
  );
};
