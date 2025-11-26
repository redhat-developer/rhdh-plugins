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

export const CustomTooltip = ({
  payload,
  pieData,
}: {
  payload: any;
  pieData: any;
}) => {
  const getPercentage = () => {
    if (!Array.isArray(pieData) || pieData.length === 0) return 0;
    if (!payload || payload.length === 0) return 0;

    const total = pieData.reduce(
      (acc: number, curr: any) => acc + (curr.value || 0),
      0,
    );
    const threshold = pieData.find(
      (item: any) => item.name === payload?.[0]?.name,
    );

    const thresholdValue = threshold?.value || 0;

    return total > 0 ? Math.round((thresholdValue / total) * 100) : 0;
  };

  let content = null;

  if (payload?.[0]?.value === 0 || payload?.[0]?.value === undefined) {
    content = (
      <Typography sx={{ fontSize: '0.875rem', margin: 0, fontWeight: '500' }}>
        No entities in {payload?.[0]?.name} state
      </Typography>
    );
  } else {
    content = (
      <>
        <Typography sx={{ fontSize: '0.875rem', margin: 0, fontWeight: '500' }}>
          {payload?.[0]?.value} entities
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
