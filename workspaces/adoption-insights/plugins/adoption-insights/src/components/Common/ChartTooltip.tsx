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
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { formatInTimeZone } from 'date-fns-tz';
import {
  formatHourlyBucket,
  formatDateWithRange,
  formatTooltipHeaderLabel,
  formatWeeklyBucket,
} from '../../utils/utils';
import { useDateRange } from '../Header/DateRangeContext';

const labelOverrides: Record<string, string> = {
  count: 'Number of searches',
};

const ChartTooltip = ({
  active,
  payload,
  label,
  grouping,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  grouping?: string;
}) => {
  const theme = useTheme();
  const { startDateRange, endDateRange } = useDateRange();

  const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;

  const getLabel = (key: string) =>
    labelOverrides[key] || formatTooltipHeaderLabel(key);
  const formatBucketLabel = (date: Date) => {
    switch (grouping) {
      case 'hourly':
        return formatHourlyBucket(date);
      case 'weekly':
        return formatWeeklyBucket(date);
      case 'monthly':
        return formatDateWithRange(date, startDateRange, endDateRange);
      default:
        return formatInTimeZone(date, timeZone, 'MMMM d, yyyy');
    }
  };

  if (!active || !payload || payload?.length === 0) {
    return null;
  }

  const date = label
    ? new Date(formatInTimeZone(label, timeZone, "yyyy-MM-dd'T'HH:mm:ssXXX"))
    : new Date();
  return (
    <Paper
      elevation={1}
      sx={{
        padding: '12px 16px',
        boxShadow: 4,
        borderRadius: 2,
      }}
    >
      <Typography
        sx={{
          fontSize: '0.875rem',
          fontWeight: 500,
          marginBottom: '12px',
        }}
      >
        {formatBucketLabel(date)
          .split('\n')
          .map((line, i) => (
            <div key={i}>{line}</div>
          ))}
      </Typography>

      <Box display="flex" justifyContent="space-between" alignItems="center">
        {payload.map(({ dataKey, value }, index) => (
          <Box mr={index === payload.length - 1 ? 0 : 3}>
            <Typography
              sx={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: theme.palette.text.secondary,
              }}
            >
              {getLabel(dataKey)}
            </Typography>
            <Typography
              sx={{
                fontSize: '2.5rem',
                fontWeight: 500,
                color: '#009596',
                lineHeight: 1.2,
              }}
            >
              {value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default ChartTooltip;
