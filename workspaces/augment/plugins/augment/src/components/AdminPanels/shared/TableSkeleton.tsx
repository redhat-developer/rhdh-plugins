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
import Skeleton from '@mui/material/Skeleton';
import { useTheme, alpha } from '@mui/material/styles';
import { borderRadius } from '../../../theme/tokens';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

/**
 * Skeleton placeholder mimicking a data table layout.
 * Displays animated rows with column-like blocks.
 */
export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        border: `1px solid ${alpha(theme.palette.divider, isDark ? 0.2 : 0.12)}`,
        borderRadius: borderRadius.sm,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          px: 2,
          py: 1.5,
          bgcolor: alpha(theme.palette.background.default, 0.5),
          borderBottom: `1px solid ${alpha(theme.palette.divider, isDark ? 0.15 : 0.08)}`,
        }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton
            key={i}
            variant="text"
            width={`${100 / columns - 5}%`}
            height={16}
          />
        ))}
      </Box>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <Box
          key={rowIdx}
          sx={{
            display: 'flex',
            gap: 2,
            px: 2,
            py: 1.5,
            borderBottom:
              rowIdx < rows - 1
                ? `1px solid ${alpha(theme.palette.divider, isDark ? 0.1 : 0.06)}`
                : undefined,
          }}
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton
              key={colIdx}
              variant="text"
              width={colIdx === 0 ? '30%' : `${70 / (columns - 1)}%`}
              height={20}
            />
          ))}
        </Box>
      ))}
    </Box>
  );
}
