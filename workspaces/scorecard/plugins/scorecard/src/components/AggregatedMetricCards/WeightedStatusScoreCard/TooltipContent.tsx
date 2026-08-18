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

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export const formatAggregationScoreDetail = (
  value?: number | string,
): string => {
  if (typeof value === 'string') {
    return value;
  }

  if (value === undefined || !Number.isFinite(value)) {
    return '—';
  }

  return Number.isInteger(value)
    ? String(value)
    : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

export const TooltipContent = ({
  label,
  value,
}: {
  label: string;
  value?: number | string;
}) => {
  return (
    <Stack>
      <Typography sx={{ fontSize: '0.875rem', margin: 0, fontWeight: 500 }}>
        {label}
      </Typography>
      {value !== undefined && value !== null && (
        <Typography
          sx={{
            fontSize: '2.5rem',
            margin: 0,
            color: '#37a3a3',
            fontWeight: 500,
          }}
        >
          {formatAggregationScoreDetail(value)}
        </Typography>
      )}
    </Stack>
  );
};
