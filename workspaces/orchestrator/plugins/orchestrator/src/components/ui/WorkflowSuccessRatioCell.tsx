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
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { VALUE_UNAVAILABLE } from '../../constants';

const PROGRESS_SIZE = '1.5rem';

const getSuccessRatioColor = (
  percent: number,
): 'success' | 'warning' | 'error' => {
  if (percent >= 90) {
    return 'success';
  }
  if (percent >= 70) {
    return 'warning';
  }
  return 'error';
};

export const WorkflowSuccessRatioCell = ({
  successRatio,
}: {
  successRatio?: number;
}) => {
  const theme = useTheme();
  const trackColor =
    theme.palette.mode === 'light'
      ? theme.palette.grey[300]
      : theme.palette.grey[700];

  if (
    successRatio === undefined ||
    Number.isNaN(successRatio) ||
    !Number.isFinite(successRatio)
  ) {
    return <>{VALUE_UNAVAILABLE}</>;
  }

  const percent = Math.round(successRatio * 100);
  const color = getSuccessRatioColor(percent);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box
        sx={{ position: 'relative', display: 'inline-flex' }}
        aria-label={`${percent}%`}
      >
        <CircularProgress
          variant="determinate"
          value={100}
          size={PROGRESS_SIZE}
          sx={{ color: trackColor }}
        />
        <CircularProgress
          variant="determinate"
          value={percent}
          size={PROGRESS_SIZE}
          color={color}
          sx={{ position: 'absolute', left: 0 }}
        />
      </Box>
      <Typography variant="body2" component="span">
        {percent}%
      </Typography>
    </Box>
  );
};
