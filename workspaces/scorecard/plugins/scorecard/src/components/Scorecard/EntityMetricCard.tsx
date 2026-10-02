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

import Box from '@mui/material/Box';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { useLanguage } from '../../hooks/useLanguage';
import { useTranslation } from '../../hooks/useTranslation';
import { getStatusConfig, resolveMetricTranslation } from '../../utils';
import { isSparklineVisualization } from '../../utils/metricVisualization';
import { hasMetricDataError, hasThresholdError } from '../../utils/statusUtils';
import { CardInfoButton } from '../Common/CardInfoButton';
import { DataSourcesDialog } from '../DataSources/DataSourcesDialog';
import { CardActionsMenu } from '../DataSources/CardActionsMenu';
import type { MenuAction } from '../DataSources/CardActionsMenu';
import { toMetricSourceRows } from '../DataSources/metricSourceRows';
import { buildThresholdBuckets } from '../MetricGroupCard/thresholdBucketUtils';
import { EntitySparklineCard } from './EntitySparklineCard';
import Scorecard from './Scorecard';

export const EntityMetricCard = ({ metric }: { metric: MetricResult }) => {
  const { t } = useTranslation();
  const locale = useLanguage();
  const [dataSourcesOpen, setDataSourcesOpen] = useState(false);

  const title = resolveMetricTranslation(
    t,
    metric.id,
    'title',
    metric.metadata.title,
  );
  const description = resolveMetricTranslation(
    t,
    metric.id,
    'description',
    metric.metadata.description,
  );

  const sourceRows = useMemo(
    () => toMetricSourceRows([metric], { t, locale }),
    [metric, t, locale],
  );

  const buckets = useMemo(
    () => buildThresholdBuckets([metric], t),
    [metric, t],
  );

  const handleOpen = useCallback(() => setDataSourcesOpen(true), []);
  const handleClose = useCallback(() => setDataSourcesOpen(false), []);

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

  if (isSparklineVisualization(metric.metadata.defaultVisualization)) {
    return (
      <Box sx={{ height: 'fit-content', minWidth: 0, maxWidth: '100%' }}>
        <EntitySparklineCard
          metric={metric}
          title={title}
          description={description}
        />
      </Box>
    );
  }

  const isMetricDataError = hasMetricDataError(metric);
  const isThresholdError = hasThresholdError(metric);
  const statusConfig = getStatusConfig({
    evaluation: metric.result?.thresholdResult?.evaluation,
    thresholdStatus: metric.result?.thresholdResult?.status,
    metricStatus: metric.status,
    thresholdRules: metric.result?.thresholdResult?.definition?.rules,
  });

  return (
    <Box sx={{ height: 'fit-content', minWidth: 0, maxWidth: '100%' }}>
      <Scorecard
        cardTitle={title}
        description={description}
        statusColor={statusConfig.color}
        statusIcon={statusConfig.icon ?? ''}
        value={metric.result?.value}
        metricType={metric.metadata.type}
        thresholds={metric.result?.thresholdResult}
        unit={metric.metadata.unit}
        isMetricDataError={isMetricDataError}
        metricDataError={metric?.error}
        isThresholdError={isThresholdError}
        thresholdError={metric.result?.thresholdResult?.error}
        info={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {metric.result?.timestamp && (
              <CardInfoButton
                timestamp={metric.result.timestamp}
                marginRight={0}
              />
            )}
            <CardActionsMenu
              ariaLabel={t('card.menuAriaLabel')}
              actions={menuActions}
            />
          </Box>
        }
      />
      {dataSourcesOpen && (
        <DataSourcesDialog
          open={dataSourcesOpen}
          onClose={handleClose}
          title={title}
          rows={sourceRows}
          buckets={buckets}
        />
      )}
    </Box>
  );
};
