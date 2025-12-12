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

import { ResponseErrorPanel } from '@backstage/core-components';

import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { ScorecardHomepageCard } from './ScorecardHomepageCard';
import PermissionRequiredState from '../Common/PermissionRequiredState';
import { useAggregatedScorecards } from '../../hooks/useAggregatedScorecards';
import type { AggregatedMetricResult } from '../../utils/utils';

export const ScorecardHomepageSection = () => {
  const { aggregatedScorecards, loadingData, error } =
    useAggregatedScorecards();

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
    if (error.message?.includes('NotAllowedError')) {
      return <PermissionRequiredState />;
    }
    return <ResponseErrorPanel error={error} />;
  }

  return (
    <Box sx={{ padding: '8px 8px 8px 0' }}>
      <Grid container spacing={2}>
        {aggregatedScorecards
          ?.slice(0, 2)
          .map((scorecard: AggregatedMetricResult) => (
            <Grid item key={scorecard.id}>
              <ScorecardHomepageCard scorecard={scorecard} />
            </Grid>
          ))}
      </Grid>
    </Box>
  );
};
