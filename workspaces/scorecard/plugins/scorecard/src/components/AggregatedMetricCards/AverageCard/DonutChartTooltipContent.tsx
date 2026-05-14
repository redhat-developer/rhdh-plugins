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

import type { AggregatedMetricValue } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { TooltipContent, formatAggregationScoreDetail } from './TooltipContent';
import { useTranslation } from '../../../hooks/useTranslation';

export const DonutChartTooltipContent = ({
  weightedSum,
  maxPossible,
  statusValues = [],
}: {
  weightedSum: number | undefined;
  maxPossible: number | undefined;
  statusValues?: AggregatedMetricValue[];
}) => {
  const { t } = useTranslation();

  return (
    <Stack spacing={0.5} sx={{ minWidth: 220 }}>
      <Stack direction="row" spacing={3}>
        <TooltipContent
          label={t('metric.averageCenterTooltipTotalLabel')}
          value={weightedSum}
        />
        <TooltipContent
          label={t('metric.averageCenterTooltipMaxLabel')}
          value={maxPossible}
        />
      </Stack>
      {statusValues.length > 0 ? (
        <Box
          sx={{
            borderTop: 1,
            borderColor: 'divider',
            pt: 1.5,
          }}
        >
          <Stack spacing={0.75}>
            {statusValues.map(row => (
              <Typography
                key={row.name}
                variant="body2"
                sx={{ color: 'text.primary', fontWeight: 500 }}
              >
                {t('metric.averageCenterTooltipBreakdownRow', {
                  count: row.count,
                  status: row.name.charAt(0).toUpperCase() + row.name.slice(1),
                  score: formatAggregationScoreDetail(row.score ?? 0),
                } as any)}
              </Typography>
            ))}
          </Stack>
        </Box>
      ) : null}
    </Stack>
  );
};
