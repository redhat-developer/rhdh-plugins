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
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { useLanguage } from './useLanguage';
import { useMetricCollectors } from './useMetricCollectors';
import { useTranslation } from './useTranslation';
import { getLastUpdatedLabel, getStatusConfig } from '../utils';
import { toCollectorSourceRows } from '../components/MetricGroupCard/collectorSourceRows';
import type { MenuAction } from '../components/MetricGroupCard/MetricGroupCardMenu';
import { MISSING_EVALUATION_LABEL } from '../components/MetricGroupCard/thresholdBucketUtils';
import type { DataSourcesDialogProps } from '../components/MetricGroupCard/DataSourcesDialog';

export type UseSparklineDataSourcesOptions = {
  metricId: string;
  lastSyncedTimestamp?: string;
  fetchEnabled?: boolean;
};

export const useSparklineDataSources = ({
  metricId,
  lastSyncedTimestamp,
  fetchEnabled = true,
}: UseSparklineDataSourcesOptions) => {
  const { t } = useTranslation();
  const locale = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const handleOpen = useCallback(() => setIsOpen(true), []);
  const handleClose = useCallback(() => setIsOpen(false), []);

  const menuActions = useMemo<MenuAction[]>(
    () => [
      {
        id: 'view-data-sources',
        label: t('metricGroupCard.viewDataSources'),
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
    const unevaluatedStatus = getStatusConfig({
      evaluation: null,
      thresholdStatus: undefined,
      metricStatus: undefined,
      thresholdRules: [],
    });

    return toCollectorSourceRows(collectors ?? [], {
      metricId,
      lastSynced: lastSyncedTimestamp
        ? getLastUpdatedLabel(lastSyncedTimestamp, locale)
        : MISSING_EVALUATION_LABEL,
      emptyValue: t('dataSourcesDialog.collectorEmptyValue'),
      unavailableStatus: t('dataSourcesDialog.collectorUnavailableStatus'),
      statusColor: unevaluatedStatus.color,
    });
  }, [collectors, metricId, lastSyncedTimestamp, locale, t]);

  const dialogProps: Pick<
    DataSourcesDialogProps,
    'open' | 'onClose' | 'rows' | 'isLoading' | 'error'
  > = {
    open: isOpen,
    onClose: handleClose,
    rows: sourceRows,
    isLoading: shouldFetch && isLoading,
    error: shouldFetch ? error : undefined,
  };

  return {
    isOpen,
    menuActions,
    menuAriaLabel: t('metricGroupCard.menuAriaLabel'),
    dialogProps,
  };
};
