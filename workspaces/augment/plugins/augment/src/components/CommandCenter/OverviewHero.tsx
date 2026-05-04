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
import { useTheme, alpha } from '@mui/material/styles';
import { STATUS_COLORS } from './commandcenter.constants';

interface OverviewHeroProps {
  ready: number;
  total: number;
  pendingReview: number;
  loading?: boolean;
}

/**
 * Hero section with animated SVG health ring and system status.
 * Replaces the flat title + status bar with a visually rich summary.
 */
export function OverviewHero({ ready, total, pendingReview, loading }: OverviewHeroProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const ratio = total > 0 ? ready / total : 1;
  const statusColor = ratio >= 1 ? STATUS_COLORS.healthy : ratio >= 0.7 ? STATUS_COLORS.warning : STATUS_COLORS.critical;
  const statusLabel = ratio >= 1 ? 'Healthy' : ratio >= 0.7 ? 'Degraded' : 'Critical';

  const ringSize = 100;
  const strokeWidth = 8;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - ratio);

  return (
    <Box
      data-tour="status-bar"
      sx={{
        display: 'flex',
        alignItems: { xs: 'center', sm: 'center' },
        gap: 3,
        p: 3,
        borderRadius: 3,
        bgcolor: isDark ? alpha(theme.palette.background.paper, 0.4) : theme.palette.background.paper,
        border: `1px solid ${alpha(statusColor, isDark ? 0.15 : 0.08)}`,
        boxShadow: isDark
          ? `0 2px 12px ${alpha('#000', 0.2)}, inset 0 1px 0 ${alpha(theme.palette.common.white, 0.03)}`
          : `0 2px 12px ${alpha('#000', 0.04)}`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated SVG Ring */}
      <Box sx={{ flexShrink: 0, position: 'relative', width: ringSize, height: ringSize }}>
        <svg width={ringSize} height={ringSize} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background track */}
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={radius}
            fill="none"
            stroke={alpha(isDark ? theme.palette.common.white : theme.palette.common.black, 0.06)}
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={radius}
            fill="none"
            stroke={statusColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={loading ? circumference : strokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)',
              filter: `drop-shadow(0 0 4px ${alpha(statusColor, 0.5)})`,
            }}
          />
        </svg>
        {/* Center text */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: '1.4rem',
              lineHeight: 1,
              color: 'text.primary',
              fontFamily: '"SF Mono", "JetBrains Mono", monospace',
            }}
          >
            {loading ? '...' : ready}
          </Typography>
          <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', mt: 0.25 }}>
            / {total}
          </Typography>
        </Box>
      </Box>

      {/* Status text */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: statusColor,
              boxShadow: `0 0 8px ${alpha(statusColor, 0.6)}`,
              animation: ratio < 1 ? 'heroGlow 2s infinite' : undefined,
              '@keyframes heroGlow': {
                '0%, 100%': { boxShadow: `0 0 6px ${alpha(statusColor, 0.4)}` },
                '50%': { boxShadow: `0 0 14px ${alpha(statusColor, 0.8)}` },
              },
            }}
          />
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '0.82rem',
              color: statusColor,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {statusLabel}
          </Typography>
        </Box>
        <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: 'text.primary', lineHeight: 1.3 }}>
          {loading ? 'Loading...' : `${ready} of ${total} agents ready`}
        </Typography>
        <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mt: 0.5 }}>
          {pendingReview > 0
            ? `${pendingReview} agent${pendingReview > 1 ? 's' : ''} awaiting review`
            : 'No agents pending review'}
        </Typography>
      </Box>
    </Box>
  );
}
