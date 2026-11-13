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
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { useLanguage } from './useLanguage';
import { useMetricCollectors } from './useMetricCollectors';
import { useTranslation } from './useTranslation';
import { getLastUpdatedLabel } from '../utils';
import { toCollectorSourceRows } from '../components/DataSources/collectorSourceRows';
import { toMetricSourceRows } from '../components/DataSources/metricSourceRows';
import type { MenuAction } from '../components/DataSources/CardActionsMenu';
import {
  buildThresholdBuckets,
  hasMetricEvaluation,
  MISSING_EVALUATION_LABEL,
} from '../components/MetricGroupCard/thresholdBucketUtils';
import type { DataSourcesDialogProps } from '../components/DataSources/DataSourcesDialog';
import type { SourceRow } from '../components/DataSources/DataSourcesDialogColumns';

export type UseMetricDataSourcesOptions = {
  metricId: string;
  lastSyncedTimestamp?: string;
  /** When true the hook fetches collector metadata via the collectors API when the dialog opens (composite metrics like DORA). Defaults to false. Empty lists and fetch errors fall back to the metric snapshot. */
  fetchEnabled?: boolean;
  /** Full metric result — used to show actual value/status/evaluation in the dialog for non-composite metrics. */
  metric?: MetricResult;
  /** Shown when the snapshot has no value (e.g. statusGrouped aggregations). */
  unavailableValueLabel?: string;
  /** Shown when the snapshot has no threshold evaluation. */
  unavailableStatusLabel?: string;
  /** When false, hide the dialog threshold legend. Defaults to true when a metric snapshot is present. */
  showThresholdLegend?: boolean;
};

const applyUnavailableLabels = (
  rows: SourceRow[],
  metric: MetricResult,
  unavailableValueLabel?: string,
  unavailableStatusLabel?: string,
): SourceRow[] => {
  const missingValue =
    metric.result?.value === null || metric.result?.value === undefined;
  const missingStatus = !hasMetricEvaluation(metric);

  if (
    (!missingValue || !unavailableValueLabel) &&
    (!missingStatus || !unavailableStatusLabel)
  ) {
    return rows;
  }

  return rows.map(row => ({
    ...row,
    value:
      missingValue && unavailableValueLabel ? unavailableValueLabel : row.value,
    statusLabel:
      missingStatus && unavailableStatusLabel
        ? unavailableStatusLabel
        : row.statusLabel,
    statusIcon: missingStatus && unavailableStatusLabel ? '' : row.statusIcon,
  }));
};

export const useMetricDataSources = ({
  metricId,
  lastSyncedTimestamp,
  fetchEnabled = false,
  metric,
  unavailableValueLabel,
  unavailableStatusLabel,
  showThresholdLegend = true,
}: UseMetricDataSourcesOptions) => {
  const { t } = useTranslation();
  const locale = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const handleOpen = useCallback(() => setIsOpen(true), []);
  const handleClose = useCallback(() => setIsOpen(false), []);

  const menuActions = useMemo<MenuAction[]>(
    () => [
      {
        id: 'view-data-sources',
        label: t('card.viewDataSources'),
        icon: <InfoOutlinedIcon fontSize="small" />,
        onClick: handleOpen,
      },
    ],
    [t, handleOpen],
  );

  const shouldFetch = isOpen && fetchEnabled && Boolean(metricId?.trim());
  const {
    data: collectors,
    isLoading,
    error,
  } = useMetricCollectors(metricId, shouldFetch);

  const sourceRows = useMemo(() => {
    if (fetchEnabled && collectors && collectors.length > 0) {
      return toCollectorSourceRows(collectors, {
        metricId,
        lastSynced: lastSyncedTimestamp
          ? getLastUpdatedLabel(lastSyncedTimestamp, locale)
          : MISSING_EVALUATION_LABEL,
        emptyValue: t('dataSourcesDialog.collectorEmptyValue'),
        unavailableStatus: t('dataSourcesDialog.collectorUnavailableStatus'),
        statusColor: '',
      });
    }

    if (metric) {
      return applyUnavailableLabels(
        toMetricSourceRows([metric], { t, locale }),
        metric,
        unavailableValueLabel,
        unavailableStatusLabel,
      );
    }

    return [];
  }, [
    fetchEnabled,
    collectors,
    metric,
    metricId,
    lastSyncedTimestamp,
    locale,
    t,
    unavailableValueLabel,
    unavailableStatusLabel,
  ]);

  const buckets = useMemo(
    () =>
      metric && showThresholdLegend
        ? buildThresholdBuckets([metric], t)
        : undefined,
    [metric, showThresholdLegend, t],
  );

  const dialogProps: Pick<
    DataSourcesDialogProps,
    'open' | 'onClose' | 'rows' | 'isLoading' | 'error' | 'buckets'
  > = {
    open: isOpen,
    onClose: handleClose,
    rows: sourceRows,
    isLoading: shouldFetch && isLoading && !metric,
    error: shouldFetch && !metric ? error : undefined,
    buckets,
  };

  return {
    isOpen,
    menuActions,
    menuAriaLabel: t('card.menuAriaLabel'),
    dialogProps,
  };
};
