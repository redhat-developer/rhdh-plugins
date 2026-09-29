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
  MISSING_EVALUATION_LABEL,
} from '../components/MetricGroupCard/thresholdBucketUtils';
import type { DataSourcesDialogProps } from '../components/DataSources/DataSourcesDialog';

export type UseMetricDataSourcesOptions = {
  metricId: string;
  lastSyncedTimestamp?: string;
  /** When true the hook fetches collector metadata via the collectors API (composite metrics like DORA). Defaults to false. */
  fetchEnabled?: boolean;
  /** Full metric result — used to show actual value/status/evaluation in the dialog for non-composite metrics. */
  metric?: MetricResult;
};

export const useMetricDataSources = ({
  metricId,
  lastSyncedTimestamp,
  fetchEnabled = false,
  metric,
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
    if (collectors && collectors.length > 0) {
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
      return toMetricSourceRows([metric], { t, locale });
    }

    return [];
  }, [collectors, metric, metricId, lastSyncedTimestamp, locale, t]);

  const buckets = useMemo(
    () => (metric ? buildThresholdBuckets([metric], t) : undefined),
    [metric, t],
  );

  const dialogProps: Pick<
    DataSourcesDialogProps,
    'open' | 'onClose' | 'rows' | 'isLoading' | 'error' | 'buckets'
  > = {
    open: isOpen,
    onClose: handleClose,
    rows: sourceRows,
    isLoading: shouldFetch && isLoading,
    error: shouldFetch ? error : undefined,
    buckets,
  };

  return {
    isOpen,
    menuActions,
    menuAriaLabel: t('card.menuAriaLabel'),
    dialogProps,
  };
};
