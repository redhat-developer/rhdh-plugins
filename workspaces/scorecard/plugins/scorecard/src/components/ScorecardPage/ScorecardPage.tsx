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

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DangerousOutlinedIcon from '@mui/icons-material/DangerousOutlined';

import ScorecardEmptyState from './ScorecardEmptyState';
import { fetchMockData } from './mockData';
import Scorecard from './Scorecard';

export const ScorecardPage = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMockData()
      .then(metrics => {
        setData(metrics);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if ((!loading && data?.metrics?.length === 0) || error) {
    return <ScorecardEmptyState />;
  }

  return (
    <Box
      display="flex"
      flexWrap="wrap"
      gap={2}
      sx={{ alignItems: 'flex-start' }}
    >
      {data?.metrics?.map((metric: any) => (
        <Scorecard
          key={metric.id}
          cardTitle={metric.metadata.title}
          description={metric.metadata.description}
          loading={false}
          statusColor={(() => {
            const label = metric.result.thresholdResult.evaluation;
            if (label === 'error') return 'red';
            if (label === 'warning') return 'orange';
            return 'green';
          })()}
          StatusIcon={(() => {
            const label = metric.result.thresholdResult.evaluation;
            if (label === 'error') return DangerousOutlinedIcon;
            if (label === 'warning') return WarningAmberIcon;
            return CheckCircleOutlineIcon;
          })()}
          value={metric.result.value}
          thresholds={metric.result.thresholdResult.definition.rules}
        />
      ))}
    </Box>
  );
};
