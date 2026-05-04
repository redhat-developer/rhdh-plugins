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

import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import { useTheme, alpha } from '@mui/material/styles';

interface MetricTileProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  color: string;
  loading?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

/**
 * A cockpit-style metric tile with optional animated glow border.
 * Dark glass background, large centered value, contextual subtitle.
 */
export function MetricTile({ label, value, subtitle, icon, color, loading, glow, onClick }: MetricTileProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e => { if (e.key === 'Enter') onClick(); }) : undefined}
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: isDark ? alpha(theme.palette.background.paper, 0.4) : theme.palette.background.paper,
        border: `1px solid ${alpha(color, isDark ? 0.2 : 0.1)}`,
        cursor: onClick ? 'pointer' : undefined,
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
        minWidth: 0,
        // Glow effect
        ...(glow ? {
          boxShadow: `0 0 16px ${alpha(color, isDark ? 0.2 : 0.1)}, inset 0 0 12px ${alpha(color, isDark ? 0.05 : 0.02)}`,
          animation: 'tileGlow 3s ease-in-out infinite alternate',
          '@keyframes tileGlow': {
            '0%': { boxShadow: `0 0 12px ${alpha(color, isDark ? 0.15 : 0.08)}` },
            '100%': { boxShadow: `0 0 20px ${alpha(color, isDark ? 0.25 : 0.12)}` },
          },
        } : {
          boxShadow: isDark ? `0 1px 4px ${alpha('#000', 0.2)}` : `0 1px 4px ${alpha('#000', 0.04)}`,
        }),
        '&:hover': onClick ? {
          borderColor: alpha(color, 0.4),
          transform: 'translateY(-1px)',
        } : {},
      }}
    >
      {/* Icon top-right */}
      {icon && (
        <Box sx={{ position: 'absolute', top: 12, right: 12, color: alpha(color, 0.5), opacity: 0.7 }}>
          {icon}
        </Box>
      )}

      {/* Label */}
      <Typography
        variant="caption"
        sx={{
          fontSize: '0.68rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'text.secondary',
          mb: 1,
          display: 'block',
        }}
      >
        {label}
      </Typography>

      {/* Value */}
      {loading ? (
        <Skeleton variant="text" width={60} height={36} />
      ) : (
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            fontSize: '1.75rem',
            lineHeight: 1,
            color: 'text.primary',
            fontFamily: '"SF Mono", "JetBrains Mono", monospace',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </Typography>
      )}

      {/* Contextual subtitle */}
      {subtitle && (
        <Typography
          sx={{
            fontSize: '0.65rem',
            color: 'text.secondary',
            mt: 0.75,
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {subtitle}
        </Typography>
      )}

      {/* Click hint */}
      {onClick && (
        <Typography
          sx={{
            fontSize: '0.6rem',
            color: alpha(color, 0.7),
            mt: 0.5,
            fontWeight: 600,
          }}
        >
          View &rarr;
        </Typography>
      )}
    </Box>
  );
}
