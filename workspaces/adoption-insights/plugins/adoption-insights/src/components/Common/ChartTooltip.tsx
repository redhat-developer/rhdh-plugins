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
import { TranslationFunction } from '@backstage/core-plugin-api/alpha';
import {
  formatHourlyBucket,
  formatDateWithRange,
  formatTooltipHeaderLabel,
  formatWeeklyBucket,
  formatLongDate,
  safeDate,
} from '../../utils/utils';
import { useDateRange } from '../Header/DateRangeContext';

import { useTranslation } from '../../hooks/useTranslation';
import { useLanguage } from '../../hooks/useLanguage';
import { adoptionInsightsTranslationRef } from '../../translations';

const getLabelOverrides = (
  t: TranslationFunction<typeof adoptionInsightsTranslationRef.T>,
) => ({
  count: t('common.numberOfSearches'),
  new_users: t('activeUsers.legend.newUsers'),
  returning_users: t('activeUsers.legend.returningUsers'),
});

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
  const { t } = useTranslation();
  const locale = useLanguage();
  const labelOverrides = getLabelOverrides(t);

  const getLabel = (key: string) =>
    (labelOverrides as any)[key] || formatTooltipHeaderLabel(key);

  const formatBucketLabel = (date: Date) => {
    switch (grouping) {
      case 'hourly':
        return formatHourlyBucket(date, locale);
      case 'weekly':
        return formatWeeklyBucket(date, locale);
      case 'monthly':
        return formatDateWithRange(
          date,
          startDateRange,
          endDateRange,
          t,
          locale,
        );
      default:
        return formatLongDate(date, locale);
    }
  };

  if (!active || !payload || payload?.length === 0) {
    return null;
  }

  // Parse date from chart label - chart data typically provides ISO strings or timestamps
  const date = label ? safeDate(label) : new Date();

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
          .map((line, index) => (
            <div key={`tooltip-line-${line.substring(0, 10)}-${index}`}>
              {line}
            </div>
          ))}
      </Typography>

      <Box display="flex" justifyContent="space-between" alignItems="center">
        {payload.map(({ dataKey, value }, index) => (
          <Box
            key={`tooltip-value-${dataKey}-${value}-${index}`}
            mr={index === payload.length - 1 ? 0 : 3}
          >
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
