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

import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme, alpha, darken } from '@mui/material/styles';

import { resolveStatusColor } from '../../utils';
import type { ThresholdBucket } from './types';

interface ThresholdBucketTileProps {
  bucket: ThresholdBucket;
  onClick?: () => void;
}

export const ThresholdBucketTile = ({
  bucket,
  onClick,
}: ThresholdBucketTileProps) => {
  const theme = useTheme();
  const resolvedColor = resolveStatusColor(theme, bucket.color);
  const isInteractive = Boolean(onClick);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (onClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick();
      }
    },
    [onClick],
  );

  return (
    <Box
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      aria-label={isInteractive ? `${bucket.count} ${bucket.label}` : undefined}
      sx={{
        py: 1.5,
        px: 2,
        borderRadius: 2,
        backgroundColor: alpha(resolvedColor, 0.08),
        textAlign: 'center',
        minWidth: 0,
        cursor: isInteractive ? 'pointer' : 'default',
        transition: 'background-color 0.15s ease',
        '&:hover': isInteractive
          ? { backgroundColor: alpha(resolvedColor, 0.16) }
          : undefined,
        '&:focus-visible': isInteractive
          ? { outline: `2px solid ${resolvedColor}`, outlineOffset: 1 }
          : undefined,
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: darken(resolvedColor, 0.3),
          lineHeight: 1.3,
        }}
      >
        {bucket.count}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          fontSize: '0.75rem',
          color: darken(resolvedColor, 0.3),
          fontWeight: 500,
          display: 'block',
          lineHeight: 1.3,
          mt: 0.25,
        }}
      >
        {bucket.label}
      </Typography>
    </Box>
  );
};
