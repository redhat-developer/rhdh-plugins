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

import { useCallback, useMemo, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import type { AggregatedMetricTimeSeriesResponse } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import Box from '@mui/material/Box';

import { CardWrapper } from '../Common/CardWrapper';
import { SparklineChart } from '../SparklineChart';
import { DataSourcesDialog } from '../MetricGroupCard/DataSourcesDialog';
import { MetricGroupCardMenu } from '../MetricGroupCard/MetricGroupCardMenu';
import { CardInfoButton } from './components/CardInfoButton';
import { CardSubheader } from './components/CardSubheader';
import { useLanguage } from '../../hooks/useLanguage';
import { useMetricCollectors } from '../../hooks/useMetricCollectors';
import { useTranslation } from '../../hooks/useTranslation';
import { formatDate } from '../../utils/entityTableUtils';
import {
  getLastUpdatedLabel,
  getStatusConfig,
  getThresholdRuleColor,
  resolveStatusColor,
  SCORECARD_ERROR_STATE_COLOR,
  toAggregationSparklinePoints,
} from '../../utils';
import { toSparklineChartModel } from '../../utils/sparklineChartModel';
import { toCollectorSourceRows } from '../MetricGroupCard/collectorSourceRows';
import { MISSING_EVALUATION_LABEL } from '../MetricGroupCard/thresholdBucketUtils';
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
  const [dataSourcesOpen, setDataSourcesOpen] = useState(false);
  const handleOpenDataSources = useCallback(() => setDataSourcesOpen(true), []);
  const handleCloseDataSources = useCallback(
    () => setDataSourcesOpen(false),
    [],
  );
  const menuActions = useMemo(
    () => [
      {
        id: 'view-data-sources',
        label: t('metricGroupCard.viewDataSources'),
        icon: <InfoOutlinedIcon fontSize="small" />,
        onClick: handleOpenDataSources,
      },
    ],
    [t, handleOpenDataSources],
  );

  const lastPoint = series.points[series.points.length - 1];
  const thresholdRules = series.thresholds?.rules;
  const chartColorToken = series.aggregationChartDisplayColor;
  const matchingThresholdKey = chartColorToken
    ? thresholdRules?.find(
        rule =>
          getThresholdRuleColor(thresholdRules, rule.key) === chartColorToken,
      )?.key
    : undefined;
  const chartColor = resolveStatusColor(
    theme,
    chartColorToken ?? SCORECARD_ERROR_STATE_COLOR,
  );

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

  const shouldFetchCollectors = dataSourcesOpen && Boolean(series.metricId);
  const {
    data: collectors,
    isLoading: collectorsLoading,
    error: collectorsError,
  } = useMetricCollectors(series.metricId, shouldFetchCollectors);

  const sourceRows = useMemo(() => {
    const unevaluatedStatus = getStatusConfig({
      evaluation: null,
      thresholdStatus: undefined,
      metricStatus: undefined,
      thresholdRules: [],
    });

    return toCollectorSourceRows(collectors ?? [], {
      metricId: series.metricId,
      lastSynced: lastPoint?.timestamp
        ? getLastUpdatedLabel(lastPoint.timestamp, locale)
        : MISSING_EVALUATION_LABEL,
      emptyValue: t('dataSourcesDialog.collectorEmptyValue'),
      unavailableStatus: t('dataSourcesDialog.collectorUnavailableStatus'),
      statusColor: unevaluatedStatus.color,
    });
  }, [collectors, series.metricId, lastPoint?.timestamp, locale, t]);

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

  const info = showInfo ? (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {lastPoint ? (
        <CardInfoButton timestamp={lastPoint.timestamp} marginRight={0} />
      ) : null}
      <MetricGroupCardMenu
        ariaLabel={t('metricGroupCard.menuAriaLabel')}
        actions={menuActions}
      />
    </Box>
  ) : null;

  return (
    <>
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
      {dataSourcesOpen && (
        <DataSourcesDialog
          open={dataSourcesOpen}
          onClose={handleCloseDataSources}
          title={cardTitle}
          rows={sourceRows}
          isLoading={shouldFetchCollectors && collectorsLoading}
          error={shouldFetchCollectors ? collectorsError : undefined}
        />
      )}
    </>
  );
};
