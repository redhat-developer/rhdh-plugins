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

import { useTranslation } from '../../hooks/useTranslation';
import { buildThresholdBuckets } from './thresholdBucketUtils';
import { ThresholdBucketTile } from './ThresholdBucketTile';
import { MetricGroupCardMenu } from './MetricGroupCardMenu';
import type { MenuAction } from './MetricGroupCardMenu';
import { DataSourcesDialog } from './DataSourcesDialog';
import type { MetricGroupCardProps } from './types';
import { CardWrapper } from '../Common/CardWrapper';

const MAX_TILES_PER_ROW = 3;

export const MetricGroupCard = ({
  title,
  description,
  metrics,
}: MetricGroupCardProps) => {
  const { t } = useTranslation();
  const [dataSourcesOpen, setDataSourcesOpen] = useState(false);
  const [initialFilters, setInitialFilters] = useState<string[]>([]);
  const buckets = useMemo(
    () => buildThresholdBuckets(metrics, t),
    [metrics, t],
  );

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
        label: t('metricGroupCard.viewDataSources'),
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
            <MetricGroupCardMenu
              ariaLabel={t('metricGroupCard.menuAriaLabel')}
              actions={menuActions}
            />
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
          metrics={metrics}
          initialFilters={initialFilters}
        />
      )}
    </>
  );
};
