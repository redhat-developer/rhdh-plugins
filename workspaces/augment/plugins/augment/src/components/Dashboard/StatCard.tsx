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
import Tooltip from '@mui/material/Tooltip';
import { useTheme, alpha } from '@mui/material/styles';
import { glassSurface, borderRadius, transitions, typeScale } from '../../theme/tokens';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  accent?: string;
  tip?: string;
  loading?: boolean;
  onClick?: () => void;
}

/**
 * A compact stat card with glassmorphism styling.
 * Shows a metric label, value, and icon.
 */
export function StatCard({
  label,
  value,
  icon,
  accent,
  tip,
  loading,
  onClick,
}: StatCardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const glass = glassSurface(theme, 6, isDark ? 0.5 : 0.75);
  const accentColor = accent ?? theme.palette.primary.main;

  const content = (
    <Box
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e => { if (e.key === 'Enter') onClick(); }) : undefined}
      sx={{
        ...glass,
        p: 2,
        borderRadius: borderRadius.md,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75,
        cursor: onClick ? 'pointer' : undefined,
        transition: transitions.fast,
        borderLeft: `3px solid ${accentColor}`,
        '&:hover': onClick
          ? {
              transform: 'translateY(-1px)',
              boxShadow: `0 6px 20px ${alpha(accentColor, isDark ? 0.2 : 0.12)}`,
            }
          : undefined,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography
          variant="caption"
          sx={{
            fontSize: typeScale.caption.fontSize,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
            color: theme.palette.text.secondary,
          }}
        >
          {label}
        </Typography>
        <Box sx={{ color: alpha(accentColor, 0.7), display: 'flex' }}>{icon}</Box>
      </Box>
      {loading ? (
        <Skeleton variant="text" width={60} height={32} />
      ) : (
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            fontSize: '1.5rem',
            lineHeight: 1.2,
            color: theme.palette.text.primary,
          }}
        >
          {value}
        </Typography>
      )}
    </Box>
  );

  if (tip) {
    return (
      <Tooltip title={tip} placement="top" arrow>
        {content}
      </Tooltip>
    );
  }

  return content;
}
