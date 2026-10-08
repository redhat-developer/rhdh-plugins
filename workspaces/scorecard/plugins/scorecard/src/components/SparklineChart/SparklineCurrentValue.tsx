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

import { useTranslation } from '../../hooks/useTranslation';
import { formatNumericMetricValue } from '../../utils/formatMetricUnit';

export const SparklineCurrentValue = ({
  value,
  color,
}: {
  value: number;
  color: string;
}) => {
  const { t } = useTranslation();
  const displayValue = formatNumericMetricValue(value);
  const currentLabel = t('common.current');

  return (
    <Box
      data-testid="sparkline-current-value"
      aria-label={`${displayValue} ${currentLabel}`}
      sx={{
        display: 'flex',
        alignItems: 'baseline',
        columnGap: 1,
      }}
    >
      <Typography
        component="span"
        data-testid="sparkline-current-value-number"
        sx={{
          fontSize: '1.25rem',
          fontWeight: 700,
          lineHeight: 1.2,
          color,
        }}
      >
        {displayValue}
      </Typography>
      <Typography
        component="span"
        variant="body2"
        color="text.secondary"
        sx={{ fontWeight: 400, lineHeight: 1.2 }}
      >
        {currentLabel}
      </Typography>
    </Box>
  );
};
