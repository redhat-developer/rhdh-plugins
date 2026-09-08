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
  getMatchingThresholdKey,
  getStatusConfig,
  resolveStatusColor,
  toAggregationSparklinePoints,
} from '../../utils';
import { toSparklineChartModel } from '../../utils/sparklineChartModel';
import type { AggregatedMetricCardBaseProps } from './types';

export type AggregatedSparklineCardProps = AggregatedMetricCardBaseProps & {
  series: AggregatedMetricTimeSeriesResponse;
};

export const AggregatedSparklineCard = ({
  series,
  aggregationId,
  cardTitle,
  description,
  showSubheader = true,
  showInfo = true,
  dataTestId,
}: AggregatedSparklineCardProps) => {
  const theme = useTheme();
  const locale = useLanguage();
  const { t } = useTranslation();

  const lastPoint = series.points[series.points.length - 1];
  const lastSuccessful = [...series.points]
    .reverse()
    .find(point => point.status === 'success' && point.value !== null);
  const matchingThresholdKey =
    lastSuccessful?.value !== undefined && lastSuccessful?.value !== null
      ? getMatchingThresholdKey(lastSuccessful.value, series.thresholds)
      : undefined;
  const statusConfig = getStatusConfig({
    evaluation: matchingThresholdKey ?? null,
    thresholdRules: series.thresholds?.rules,
  });
  let chartColor: string;
  if (series.aggregationChartDisplayColor) {
    chartColor = resolveStatusColor(theme, series.aggregationChartDisplayColor);
  } else if (matchingThresholdKey) {
    chartColor = resolveStatusColor(theme, statusConfig.color);
  } else {
    chartColor = theme.palette.grey[500];
  }

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
        legendRules: series.thresholds?.rules,
      }),
    [
      series.points,
      series.thresholds?.rules,
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
      />
    </CardWrapper>
  );
};
