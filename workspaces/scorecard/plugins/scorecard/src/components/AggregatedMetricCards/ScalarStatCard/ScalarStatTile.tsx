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
import { alpha, darken } from '@mui/material/styles';

type ScalarStatTileProps = {
  displayValue: string;
  label: string;
  resolvedColor: string;
  thresholdStatus?: string;
};

export const ScalarStatTile = ({
  displayValue,
  label,
  resolvedColor,
  thresholdStatus,
}: ScalarStatTileProps) => {
  const textColor = darken(resolvedColor, 0.3);

  return (
    <Box
      data-testid="scalar-stat-tile"
      data-threshold-status={thresholdStatus ?? ''}
      aria-label={`${label} ${displayValue}`}
      sx={{
        width: '100%',
        minHeight: 140,
        py: 4,
        px: 2,
        borderRadius: 2,
        backgroundColor: alpha(resolvedColor, 0.16),
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography
        data-testid="scalar-stat-value"
        variant="h3"
        sx={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: textColor,
          lineHeight: 1.2,
        }}
      >
        {displayValue}
      </Typography>
      <Typography
        data-testid="scalar-stat-label"
        variant="body1"
        sx={{
          fontSize: '1rem',
          fontWeight: 500,
          color: textColor,
          lineHeight: 1.3,
          mt: 0.5,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
};
