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

import type { MetricResult } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { ResponseErrorPanel } from '@backstage/core-components';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { ScorecardQueryProvider } from '../../api';
import { CardWrapper } from '../Common/CardWrapper';
import { CardLoading } from '../Common/CardLoading';
import { DataSourcesDialog } from '../MetricGroupCard/DataSourcesDialog';
import { MetricGroupCardMenu } from '../MetricGroupCard/MetricGroupCardMenu';
import { SparklineChart } from '../SparklineChart';
import { useLanguage } from '../../hooks/useLanguage';
import { useMetricCollectors } from '../../hooks/useMetricCollectors';
import { useMetricTimeSeries } from '../../hooks/useMetricTimeSeries';
import { useTranslation } from '../../hooks/useTranslation';
import { formatDate } from '../../utils/entityTableUtils';
import {
  getLastUpdatedLabel,
  getStatusConfig,
  resolveStatusColor,
} from '../../utils';
import { toSparklineChartModel } from '../../utils/sparklineChartModel';
import { toMetricSparklinePoints } from '../../utils/timeSeriesChartData';
import { toCollectorSourceRows } from '../MetricGroupCard/collectorSourceRows';
import { MISSING_EVALUATION_LABEL } from '../MetricGroupCard/thresholdBucketUtils';

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
  const {
    data: series,
    isLoading,
    error: seriesError,
  } = useMetricTimeSeries(metric.id);
  const collectorIds = metric.metadata.collectorIds ?? [];
  const shouldFetchCollectors = dataSourcesOpen && collectorIds.length > 0;
  const {
    data: collectors,
    isLoading: collectorsLoading,
    error: collectorsError,
  } = useMetricCollectors(metric.id, shouldFetchCollectors);

  const unit = series?.metadata.unit ?? metric.metadata.unit;
  const thresholds = metric.result?.thresholdResult;
  const matchedRule = thresholds?.definition?.rules?.find(
    rule => rule.key === thresholds.evaluation,
  );
  const fallbackErrorLabel = t('errors.metricDataUnavailable');
  const { chartData, chartColor, strokeDasharray, legendItems } = useMemo(
    () =>
      toSparklineChartModel({
        inputPoints: toMetricSparklinePoints(
          series?.points ?? [],
          fallbackErrorLabel,
        ),
        formatDateLabel: timestamp =>
          formatDate(
            new Date(timestamp),
            { month: 'short', day: 'numeric' },
            locale,
          ),
        matchingThresholdKey: matchedRule?.key,
        chartColor: resolveStatusColor(
          theme,
          getStatusConfig({
            evaluation: thresholds?.evaluation ?? null,
            thresholdStatus: thresholds?.status,
            metricStatus: metric.status,
            thresholdRules: thresholds?.definition?.rules,
          }).color,
        ),
        unit,
        theme,
        t,
        legendRules: matchedRule ? [matchedRule] : undefined,
      }),
    [
      series?.points,
      fallbackErrorLabel,
      locale,
      matchedRule,
      theme,
      thresholds?.evaluation,
      thresholds?.status,
      thresholds?.definition?.rules,
      metric.status,
      unit,
      t,
    ],
  );

  const sourceRows = useMemo(() => {
    const unevaluatedStatus = getStatusConfig({
      evaluation: null,
      thresholdStatus: undefined,
      metricStatus: undefined,
      thresholdRules: [],
    });

    return toCollectorSourceRows(collectors ?? [], {
      metricId: metric.id,
      lastSynced: metric.result?.timestamp
        ? getLastUpdatedLabel(metric.result.timestamp, locale)
        : MISSING_EVALUATION_LABEL,
      unknownPlugin: t('dataSourcesDialog.unknownPlugin'),
      emptyValue: t('dataSourcesDialog.collectorEmptyValue'),
      unavailableStatus: t('dataSourcesDialog.collectorUnavailableStatus'),
      pluginLabels: {
        github: t('dataSourcesDialog.pluginGithub'),
        jira: t('dataSourcesDialog.pluginJira'),
      },
      statusColor: unevaluatedStatus.color,
    });
  }, [collectors, metric.id, metric.result?.timestamp, locale, t]);

  const renderContent = () => {
    if (isLoading) {
      return <CardLoading />;
    }

    if (seriesError) {
      return <ResponseErrorPanel error={seriesError} />;
    }

    if (chartData.length === 0) {
      return (
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
      );
    }

    return (
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
  };

  return (
    <>
      <CardWrapper
        role="article"
        title={title}
        description={description}
        width="100%"
        childrenHeight="auto"
        info={
          <MetricGroupCardMenu
            ariaLabel={t('metricGroupCard.menuAriaLabel')}
            actions={menuActions}
          />
        }
      >
        {renderContent()}
      </CardWrapper>
      {dataSourcesOpen && (
        <DataSourcesDialog
          open={dataSourcesOpen}
          onClose={handleCloseDataSources}
          title={title}
          rows={sourceRows}
          isLoading={shouldFetchCollectors && collectorsLoading}
          error={shouldFetchCollectors ? collectorsError : undefined}
        />
      )}
    </>
  );
};

export const EntitySparklineCard = (props: EntitySparklineCardProps) => (
  <ScorecardQueryProvider>
    <EntitySparklineCardContent {...props} />
  </ScorecardQueryProvider>
);
