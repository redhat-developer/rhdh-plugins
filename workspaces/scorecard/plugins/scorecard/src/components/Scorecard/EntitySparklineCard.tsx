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

import type { MetricResult } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { ResponseErrorPanel } from '@backstage/core-components';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import { ScorecardQueryProvider } from '../../api';
import { CardWrapper } from '../Common/CardWrapper';
import { CardLoading } from '../Common/CardLoading';
import { SparklineChart } from '../SparklineChart';
import { SparklineDataSources } from '../SparklineChart/SparklineDataSources';
import { useLanguage } from '../../hooks/useLanguage';
import { useMetricTimeSeries } from '../../hooks/useMetricTimeSeries';
import { useTranslation } from '../../hooks/useTranslation';
import { getStatusConfig, resolveStatusColor } from '../../utils';
import {
  formatSparklineDateLabel,
  toSparklineChartModel,
} from '../../utils/sparklineChartModel';
import {
  getLatestSuccessfulThresholdEvaluation,
  toMetricSparklinePoints,
} from '../../utils/timeSeriesChartData';

export type EntitySparklineCardProps = {
  metric: MetricResult;
  title: string;
  description: string;
};

const EntitySparklineCardContent = ({
  metric,
  title,
  description,
}: EntitySparklineCardProps) => {
  const theme = useTheme();
  const locale = useLanguage();
  const { t } = useTranslation();
  const {
    data: series,
    isLoading,
    error: seriesError,
  } = useMetricTimeSeries(metric.id);
  const collectorIds = metric.metadata.collectorIds ?? [];

  const unit = series?.metadata.unit ?? metric.metadata.unit;
  const thresholdRules = series?.thresholds?.rules;
  const matchingThresholdKey = getLatestSuccessfulThresholdEvaluation(
    series?.points ?? [],
  );
  const fallbackErrorLabel = t('errors.metricDataUnavailable');
  const thresholdsResolutionError = series?.thresholdsError
    ? new Error(series.thresholdsError)
    : undefined;
  const { chartData, chartColor, strokeDasharray, legendItems } = useMemo(
    () =>
      toSparklineChartModel({
        inputPoints: toMetricSparklinePoints(
          series?.points ?? [],
          fallbackErrorLabel,
        ),
        formatDateLabel: timestamp =>
          formatSparklineDateLabel(timestamp, locale),
        matchingThresholdKey,
        chartColor: resolveStatusColor(
          theme,
          getStatusConfig({
            evaluation: matchingThresholdKey ?? null,
            thresholdRules,
          }).color,
        ),
        unit,
        theme,
        t,
        legendRules: thresholdRules,
      }),
    [
      series?.points,
      fallbackErrorLabel,
      locale,
      matchingThresholdKey,
      theme,
      thresholdRules,
      unit,
      t,
    ],
  );

  const renderContent = () => {
    if (isLoading) {
      return <CardLoading />;
    }

    if (seriesError) {
      return <ResponseErrorPanel error={seriesError} />;
    }

    const chart =
      chartData.length === 0 ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight={160}
        >
          <Typography variant="body2" color="text.secondary">
            {t('errors.noDataFound')}
          </Typography>
        </Box>
      ) : (
        <SparklineChart
          data={chartData}
          color={chartColor}
          strokeDasharray={strokeDasharray}
          unit={unit}
          testId={`sparkline-chart-${metric.id}`}
          legendItems={legendItems}
          legendTestId={`sparkline-threshold-legend-${metric.id}`}
        />
      );

    if (thresholdsResolutionError) {
      return (
        <>
          <ResponseErrorPanel error={thresholdsResolutionError} />
          {chartData.length > 0 ? chart : null}
        </>
      );
    }

    return chart;
  };

  return (
    <CardWrapper
      role="article"
      title={title}
      description={description}
      width="100%"
      childrenHeight="auto"
      info={
        <SparklineDataSources
          title={title}
          metricId={metric.id}
          lastSyncedTimestamp={metric.result?.timestamp}
          fetchEnabled={collectorIds.length > 0}
        />
      }
    >
      {renderContent()}
    </CardWrapper>
  );
};

export const EntitySparklineCard = (props: EntitySparklineCardProps) => (
  <ScorecardQueryProvider>
    <EntitySparklineCardContent {...props} />
  </ScorecardQueryProvider>
);
