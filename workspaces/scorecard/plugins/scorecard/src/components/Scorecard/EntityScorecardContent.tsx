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

import { MetricResult } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { ResponseErrorPanel } from '@backstage/core-components';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import NoScorecardsState from '../Common/NoScorecardsState';
import Scorecard from './Scorecard';
import { useScorecards } from '../../hooks/useScorecards';
import { getStatusConfig } from '../../utils/utils';
import { useScorecardMetricsReadPermission } from '../../hooks/useScorecardMetricsReadPermission';
import PermissionRequiredState from '../Common/PermissionRequiredState';

export const EntityScorecardContent = () => {
  const { scorecards, loadingData, error } = useScorecards();

  const {
    allowed: hasReadScorecardMetricsPermission,
    loading: loadingPermission,
  } = useScorecardMetricsReadPermission();

  if (loadingData || loadingPermission) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!hasReadScorecardMetricsPermission) {
    return <PermissionRequiredState />;
  }

  if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  if (!loadingData && scorecards?.length === 0) {
    return <NoScorecardsState />;
  }

  return (
    <Box
      display="flex"
      flexWrap="wrap"
      gap={2}
      sx={{ alignItems: 'flex-start' }}
    >
      {scorecards?.map((metric: MetricResult) => {
        // Check if metric data unavailable
        const isMetricDataError =
          metric.status === 'error' || metric.result?.value === undefined;

        // Check if threshold has an error
        const isThresholdError =
          metric.result?.thresholdResult?.status === 'error';

        const statusConfig = getStatusConfig({
          evaluation: metric.result?.thresholdResult?.evaluation,
          thresholdStatus: metric.result?.thresholdResult?.status,
          metricStatus: metric.status,
        });

        return (
          <Scorecard
            key={metric.id}
            cardTitle={metric.metadata.title}
            description={metric.metadata.description}
            loading={false}
            statusColor={statusConfig.color}
            StatusIcon={statusConfig.icon ?? (() => null)}
            value={metric.result?.value}
            thresholds={metric.result?.thresholdResult}
            isThresholdError={isThresholdError}
            thresholdError={metric.result?.thresholdResult?.error}
            isMetricDataError={isMetricDataError}
            metricDataError={metric?.error}
          />
        );
      })}
    </Box>
  );
};
