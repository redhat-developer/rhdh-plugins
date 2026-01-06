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

import type { TooltipProps } from 'recharts';

import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import type { PieData } from '../../utils/utils';
import { useTranslation } from '../../hooks/useTranslation';

type CustomTooltipPayload = {
  name?: string;
  value?: number;
  payload?: PieData;
};

type CustomTooltipProps = TooltipProps<number, string> & {
  payload?: readonly CustomTooltipPayload[];
  pieData: PieData[];
  isMissingPermission?: boolean;
};

export const CustomTooltip = ({
  payload,
  pieData,
  isMissingPermission = false,
}: CustomTooltipProps) => {
  const { t } = useTranslation();

  const getPercentage = () => {
    if (!Array.isArray(pieData) || pieData.length === 0) return 0;
    if (!payload || payload.length === 0) return 0;

    const total = pieData.reduce(
      (acc: number, curr: PieData) => acc + (curr.value || 0),
      0,
    );
    const threshold = pieData.find(
      (item: PieData) => item.name === payload?.[0]?.name,
    );

    const thresholdValue = threshold?.value || 0;

    return total > 0 ? Math.round((thresholdValue / total) * 100) : 0;
  };

  let content = null;

  if (isMissingPermission) {
    content = (
      <Typography sx={{ fontSize: '0.875rem', margin: 0, fontWeight: '500' }}>
        {t('errors.missingPermissionMessage')}
      </Typography>
    );
  } else if (payload?.[0]?.value === 0 || payload?.[0]?.value === undefined) {
    const translatedState = t(`thresholds.${payload?.[0]?.name}` as any, {});
    content = (
      <Typography sx={{ fontSize: '0.875rem', margin: 0, fontWeight: '500' }}>
        {t('thresholds.noEntities', { category: translatedState } as any)}
      </Typography>
    );
  } else {
    content = (
      <>
        <Typography sx={{ fontSize: '0.875rem', margin: 0, fontWeight: '500' }}>
          {t('thresholds.entities', { count: payload?.[0]?.value })}
        </Typography>
        <Typography
          sx={{
            fontSize: '2.5rem',
            margin: 0,
            color: '#37a3a3',
            fontWeight: 500,
          }}
        >
          {getPercentage()}%
        </Typography>
      </>
    );
  }

  return (
    <Paper
      elevation={1}
      sx={{
        width:
          payload?.[0]?.value === 0 || payload?.[0]?.value === undefined
            ? '220px'
            : 'auto',
        padding: '16px',
        borderRadius: '12px',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.50)',
        border: theme => `1px solid ${theme.palette.grey[300]}`,
      }}
    >
      {content}
    </Paper>
  );
};
