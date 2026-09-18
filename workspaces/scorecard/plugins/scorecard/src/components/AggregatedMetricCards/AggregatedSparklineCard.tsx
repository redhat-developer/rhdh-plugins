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
import type { AggregatedMetricTimeSeriesResponse } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import { CardWrapper } from '../Common/CardWrapper';
import { SparklineChart } from '../SparklineChart';
import { CardInfoButton } from './components/CardInfoButton';
import { CardSubheader } from './components/CardSubheader';
import { useLanguage } from '../../hooks/useLanguage';
import { useTranslation } from '../../hooks/useTranslation';
import { formatDate } from '../../utils/entityTableUtils';
import {
  getThresholdRuleColor,
  resolveStatusColor,
  SCORECARD_ERROR_STATE_COLOR,
  toAggregationSparklinePoints,
} from '../../utils';
import { toSparklineChartModel } from '../../utils/sparklineChartModel';
import type { AggregatedMetricCardBaseProps } from './types';

export type AggregatedSparklineCardProps = AggregatedMetricCardBaseProps & {
  series: AggregatedMetricTimeSeriesResponse;
  showCurrentValue?: boolean;
};

export const AggregatedSparklineCard = ({
  series,
  aggregationId,
  cardTitle,
  description,
  showSubheader = true,
  showInfo = true,
  dataTestId,
  showCurrentValue = false,
}: AggregatedSparklineCardProps) => {
  const theme = useTheme();
  const locale = useLanguage();
  const { t } = useTranslation();

  const lastPoint = series.points[series.points.length - 1];
  const thresholdRules = series.thresholds?.rules;
  const chartColorToken = series.aggregationChartDisplayColor;
  const matchingThresholdKey = chartColorToken
    ? thresholdRules?.find(
        rule =>
          getThresholdRuleColor(thresholdRules, rule.key) === chartColorToken,
      )?.key
    : undefined;
  const chartColor = chartColorToken
    ? resolveStatusColor(theme, chartColorToken)
    : SCORECARD_ERROR_STATE_COLOR;

  const unit = series.metadata.unit;
  const fallbackErrorLabel = t('errors.metricDataUnavailable');
  const { chartData, strokeDasharray, legendItems } = useMemo(
    () =>
      toSparklineChartModel({
        inputPoints: toAggregationSparklinePoints(
          series.points,
          fallbackErrorLabel,
        ),
        formatDateLabel: timestamp =>
          formatDate(
            new Date(timestamp),
            { month: 'short', day: 'numeric' },
            locale,
          ),
        matchingThresholdKey,
        chartColor,
        unit,
        theme,
        t,
        legendRules: thresholdRules,
      }),
    [
      series.points,
      thresholdRules,
      fallbackErrorLabel,
      locale,
      matchingThresholdKey,
      chartColor,
      unit,
      theme,
      t,
    ],
  );

  const subheader =
    showSubheader && lastPoint ? (
      <CardSubheader
        aggregationId={aggregationId}
        scorecardId={series.metricId}
        entitiesCount={lastPoint.successCount}
        entitiesConsidered={lastPoint.total}
        calculationErrorCount={lastPoint.errorCount}
      />
    ) : null;

  const info =
    showInfo && lastPoint ? (
      <CardInfoButton timestamp={lastPoint.timestamp} />
    ) : null;

  return (
    <CardWrapper
      title={cardTitle}
      dataTestId={dataTestId}
      subheader={subheader}
      description={description}
      info={info}
    >
      <SparklineChart
        data={chartData}
        color={chartColor}
        strokeDasharray={strokeDasharray}
        unit={unit}
        testId={`sparkline-chart-${aggregationId}`}
        legendItems={legendItems}
        legendTestId={`sparkline-threshold-legend-${aggregationId}`}
        showCurrentValue={showCurrentValue}
      />
    </CardWrapper>
  );
};
