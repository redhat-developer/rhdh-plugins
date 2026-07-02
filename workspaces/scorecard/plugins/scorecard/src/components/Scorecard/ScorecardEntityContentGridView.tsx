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
import { ResponseErrorPanel } from '@backstage/core-components';
import Box from '@mui/material/Box';
import Masonry from '@mui/lab/Masonry';

import { ScorecardLayoutProps } from '../../alpha/blueprints/ScorecardLayoutBlueprint';
import { useScorecards } from '../../hooks/useScorecards';
import { useTranslation } from '../../hooks/useTranslation';
import NoScorecardsState from '../Common/NoScorecardsState';
import PermissionRequiredState from '../Common/PermissionRequiredState';
import { CardLoading } from '../Common/CardLoading';
import { MetricGroupCard } from '../MetricGroupCard';
import { EntityScorecardContent } from './EntityScorecardContent';
import Scorecard from './Scorecard';
import { getStatusConfig, resolveMetricTranslation } from '../../utils';
import { hasMetricDataError, hasThresholdError } from '../../utils/statusUtils';

export const ScorecardEntityContentGridView = ({
  groups,
}: ScorecardLayoutProps) => {
  const { data: scorecards, isLoading, error } = useScorecards();
  const { t } = useTranslation();

  if (isLoading) return <CardLoading />;

  if (error) {
    if (error.message?.includes('NotAllowedError')) {
      return <PermissionRequiredState />;
    }
    return <ResponseErrorPanel error={error} />;
  }

  if (!scorecards || scorecards.length === 0) return <NoScorecardsState />;

  if (!groups || Object.keys(groups).length === 0) {
    return <EntityScorecardContent />;
  }

  const groupedMetricIds = new Set<string>();
  const groupedMetrics = new Map<string, MetricResult[]>();

  Object.entries(groups).forEach(([groupKey, groupConfig]) => {
    const metricsInOrder = groupConfig.metrics
      .map(id => scorecards.find(m => m.id === id))
      .filter((m): m is MetricResult => m !== undefined);

    if (metricsInOrder.length > 0) {
      groupedMetrics.set(groupKey, metricsInOrder);
      metricsInOrder.forEach(m => groupedMetricIds.add(m.id));
    }
  });

  const ungroupedMetrics = scorecards.filter(m => !groupedMetricIds.has(m.id));

  const groupCards = Object.entries(groups)
    .map(([groupKey, groupConfig]) => {
      const metricsInGroup = groupedMetrics.get(groupKey) || [];
      if (metricsInGroup.length === 0) return null;

      return (
        <MetricGroupCard
          key={groupKey}
          title={groupConfig.title}
          description={groupConfig.description}
          metrics={metricsInGroup}
        />
      );
    })
    .filter(Boolean);

  const ungroupedCards = ungroupedMetrics.map((metric: MetricResult) => {
    const metricDataError = hasMetricDataError(metric);
    const thresholdErrorState = hasThresholdError(metric);
    const statusConfig = getStatusConfig({
      evaluation: metric.result?.thresholdResult?.evaluation,
      thresholdStatus: metric.result?.thresholdResult?.status,
      metricStatus: metric.status,
      thresholdRules: metric.result?.thresholdResult?.definition?.rules,
    });

    return (
      <Box key={metric.id} sx={{ height: 'fit-content' }}>
        <Scorecard
          cardTitle={resolveMetricTranslation(
            t,
            metric.id,
            'title',
            metric.metadata.title,
          )}
          description={resolveMetricTranslation(
            t,
            metric.id,
            'description',
            metric.metadata.description,
          )}
          statusColor={statusConfig.color}
          statusIcon={statusConfig.icon ?? ''}
          value={metric.result?.value}
          metricType={metric.metadata.type}
          thresholds={metric.result?.thresholdResult}
          isMetricDataError={metricDataError}
          metricDataError={metric?.error}
          isThresholdError={thresholdErrorState}
          thresholdError={metric.result?.thresholdResult?.error}
        />
      </Box>
    );
  });

  return (
    <Masonry columns={{ xs: 1, sm: 2, lg: 3 }} spacing={2} sequential>
      {groupCards}
      {ungroupedCards}
    </Masonry>
  );
};
