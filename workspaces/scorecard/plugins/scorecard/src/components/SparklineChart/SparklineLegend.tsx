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
import Typography from '@mui/material/Typography';

import type { SparklineLegendItem } from '../../utils/sparklineLegend';

export type SparklineLegendProps = {
  items: SparklineLegendItem[];
  testId?: string;
};

export const SparklineLegend = ({ items, testId }: SparklineLegendProps) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <Box
      data-testid={testId}
      display="flex"
      flexDirection="column"
      alignItems="flex-start"
      gap={1}
      sx={{ px: 2, pb: 1 }}
    >
      {items.map(item => (
        <Box
          key={item.key}
          display="flex"
          alignItems="center"
          gap={1}
          data-testid={`sparkline-threshold-legend-item-${item.key}`}
        >
          <svg
            aria-hidden
            width="20"
            height="8"
            viewBox="0 0 20 8"
            style={{ flexShrink: 0, display: 'block' }}
          >
            <line
              data-testid="sparkline-threshold-color"
              x1={0}
              y1={4}
              x2={20}
              y2={4}
              stroke={item.color}
              strokeWidth={2}
              strokeDasharray={item.strokeDasharray}
            />
          </svg>
          <Typography variant="body2" color="text.primary">
            {item.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};
