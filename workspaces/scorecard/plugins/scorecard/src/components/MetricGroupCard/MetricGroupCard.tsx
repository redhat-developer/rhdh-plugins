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

import { useState, useCallback, useMemo } from 'react';

import Box from '@mui/material/Box';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { useLanguage } from '../../hooks/useLanguage';
import { useTranslation } from '../../hooks/useTranslation';
import {
  buildThresholdBuckets,
  dedupeMetricsById,
} from './thresholdBucketUtils';
import { ThresholdBucketTile } from './ThresholdBucketTile';
import { CardActionsMenu } from '../DataSources/CardActionsMenu';
import type { MenuAction } from '../DataSources/CardActionsMenu';
import { DataSourcesDialog } from '../DataSources/DataSourcesDialog';
import { toMetricSourceRows } from '../DataSources/metricSourceRows';
import { CardInfoButton } from '../Common/CardInfoButton';
import type { MetricGroupCardProps } from './types';
import { CardWrapper } from '../Common/CardWrapper';

const MAX_TILES_PER_ROW = 3;

export const MetricGroupCard = ({
  title,
  description,
  metrics,
}: MetricGroupCardProps) => {
  const { t } = useTranslation();
  const locale = useLanguage();
  const [dataSourcesOpen, setDataSourcesOpen] = useState(false);
  const [initialFilters, setInitialFilters] = useState<string[]>([]);
  const uniqueMetrics = useMemo(() => dedupeMetricsById(metrics), [metrics]);
  const buckets = useMemo(
    () => buildThresholdBuckets(uniqueMetrics, t),
    [uniqueMetrics, t],
  );
  const sourceRows = useMemo(
    () => toMetricSourceRows(uniqueMetrics, { t, locale }),
    [uniqueMetrics, t, locale],
  );
  const latestTimestamp = useMemo(() => {
    const timestamps = uniqueMetrics
      .map(m => m.result?.timestamp)
      .filter((ts): ts is string => Boolean(ts));
    return timestamps.length > 0
      ? timestamps.reduce((a, b) => (a > b ? a : b))
      : undefined;
  }, [uniqueMetrics]);

  const handleOpenDataSources = useCallback(() => {
    setInitialFilters([]);
    setDataSourcesOpen(true);
  }, []);

  const handleOpenWithFilter = useCallback((filterKey: string) => {
    setInitialFilters([filterKey]);
    setDataSourcesOpen(true);
  }, []);

  const handleCloseDataSources = useCallback(
    () => setDataSourcesOpen(false),
    [],
  );

  const menuActions = useMemo<MenuAction[]>(
    () => [
      {
        id: 'view-data-sources',
        label: t('card.viewDataSources'),
        icon: <InfoOutlinedIcon fontSize="small" />,
        onClick: handleOpenDataSources,
      },
    ],
    [t, handleOpenDataSources],
  );

  return (
    <>
      <Box sx={{ height: 'fit-content' }}>
        <CardWrapper
          role="article"
          title={title}
          description={description}
          width="100%"
          childrenHeight="auto"
          info={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {latestTimestamp && (
                <CardInfoButton timestamp={latestTimestamp} marginRight={0} />
              )}
              <CardActionsMenu
                ariaLabel={t('card.menuAriaLabel')}
                actions={menuActions}
              />
            </Box>
          }
        >
          <Box
            display="grid"
            gridTemplateColumns={`repeat(${Math.min(
              buckets.length,
              MAX_TILES_PER_ROW,
            )}, 1fr)`}
            gap={1}
          >
            {buckets.map(bucket => (
              <ThresholdBucketTile
                key={bucket.key}
                bucket={bucket}
                onClick={() => handleOpenWithFilter(bucket.key)}
              />
            ))}
          </Box>
        </CardWrapper>
      </Box>
      {dataSourcesOpen && (
        <DataSourcesDialog
          open={dataSourcesOpen}
          onClose={handleCloseDataSources}
          title={title}
          rows={sourceRows}
          buckets={buckets}
          initialFilters={initialFilters}
        />
      )}
    </>
  );
};
