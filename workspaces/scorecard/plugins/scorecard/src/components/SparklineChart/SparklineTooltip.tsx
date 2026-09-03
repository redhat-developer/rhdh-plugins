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

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

import { formatWithMetricUnit } from '../../utils/formatMetricUnit';
import type { SparklineChartPoint } from '../../utils/timeSeriesChartData';

export const SPARKLINE_TOOLTIP_SEPARATOR = ' · ';

export const getSparklineTooltipLabel = (
  point: SparklineChartPoint,
  unit?: string,
): string => {
  if (point.error) {
    return `${point.error}${SPARKLINE_TOOLTIP_SEPARATOR}${point.date}`;
  }
  return `${formatWithMetricUnit(
    String(point.value),
    unit,
  )}${SPARKLINE_TOOLTIP_SEPARATOR}${point.date}`;
};

export const SparklineTooltip = ({
  active,
  payload,
  unit,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: SparklineChartPoint }>;
  unit?: string;
}) => {
  const theme = useTheme();
  const point = payload?.[0]?.payload as SparklineChartPoint | undefined;

  if (!active || !point) {
    return null;
  }

  return (
    <Box
      data-testid="sparkline-hover-tooltip"
      sx={{
        backgroundColor: theme.palette.grey[900],
        color: theme.palette.common.white,
        borderRadius: '6px',
        px: 1.5,
        py: 0.5,
        fontSize: '0.875rem',
        fontWeight: 500,
        lineHeight: 1.4,
        textAlign: 'left',
        width: '100%',
        boxSizing: 'border-box',
        whiteSpace: 'nowrap',
        boxShadow: theme.shadows[2],
      }}
    >
      {getSparklineTooltipLabel(point, unit)}
    </Box>
  );
};
