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

import type { MetricResult } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import Box from '@mui/material/Box';

import { useTranslation } from '../../hooks/useTranslation';
import { getStatusConfig, resolveMetricTranslation } from '../../utils';
import { isSparklineVisualization } from '../../utils/metricVisualization';
import { hasMetricDataError, hasThresholdError } from '../../utils/statusUtils';
import { EntitySparklineCard } from './EntitySparklineCard';
import Scorecard from './Scorecard';

export const EntityMetricCard = ({ metric }: { metric: MetricResult }) => {
  const { t } = useTranslation();
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

  if (isSparklineVisualization(metric.metadata.defaultVisualization)) {
    return (
      <Box sx={{ height: 'fit-content' }}>
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
    <Box sx={{ height: 'fit-content' }}>
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
      />
    </Box>
  );
};
