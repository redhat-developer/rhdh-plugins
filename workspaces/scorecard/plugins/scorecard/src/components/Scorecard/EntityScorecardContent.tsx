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

import NoScorecardsState from './NoScorecardsState';
import Scorecard from './Scorecard';
import { useScorecards } from '../../hooks/useScorecards';
import { getStatusConfig } from '../../utils/utils';

export const EntityScorecardContent = () => {
  const { scorecards, loadingData, error } = useScorecards();

  if (loadingData) {
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
        if (metric.status === 'error') {
          return null;
        }

        const statusConfig = getStatusConfig(
          metric.result.thresholdResult?.evaluation,
        );

        return (
          <Scorecard
            key={metric.id}
            cardTitle={metric.metadata.title}
            description={metric.metadata.description}
            loading={false}
            statusColor={statusConfig.color}
            StatusIcon={statusConfig.icon}
            value={metric.result.value}
            thresholds={metric.result.thresholdResult}
          />
        );
      })}
    </Box>
  );
};
