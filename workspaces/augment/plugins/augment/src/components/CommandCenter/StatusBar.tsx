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

interface StatusBarProps {
  ready: number;
  total: number;
  pendingReview: number;
  lastDeploy?: string;
}

/**
 * Live system status strip -- 36px horizontal bar showing overall health.
 * Color-coded: green when all healthy, amber when warnings, red when critical.
 */
export function StatusBar({ ready, total, pendingReview, lastDeploy }: StatusBarProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const ratio = total > 0 ? ready / total : 1;
  const statusColor = ratio >= 0.9 ? STATUS_COLORS.healthy : ratio >= 0.5 ? STATUS_COLORS.warning : STATUS_COLORS.critical;
  const statusLabel = ratio >= 0.9 ? 'Operational' : ratio >= 0.5 ? 'Degraded' : 'Critical';

  return (
    <Box
      sx={{
        height: 36,
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        px: 2.5,
        borderRadius: 2,
        bgcolor: alpha(statusColor, isDark ? 0.08 : 0.04),
        border: `1px solid ${alpha(statusColor, isDark ? 0.2 : 0.12)}`,
      }}
    >
      {/* Status dot + label */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: statusColor,
            boxShadow: `0 0 8px ${alpha(statusColor, 0.6)}`,
            animation: ratio < 0.9 ? 'pulse 2s infinite' : undefined,
            '@keyframes pulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.5 },
            },
          }}
        />
        <Typography
          variant="caption"
          sx={{ fontWeight: 700, fontSize: '0.72rem', color: statusColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}
        >
          {statusLabel}
        </Typography>
      </Box>

      {/* Metrics */}
      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
        Agents: {ready}/{total} ready
      </Typography>
      {pendingReview > 0 && (
        <Typography variant="caption" sx={{ color: STATUS_COLORS.warning, fontSize: '0.72rem', fontWeight: 600 }}>
          Queue: {pendingReview}
        </Typography>
      )}
      {lastDeploy && (
        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.72rem', ml: 'auto' }}>
          Last deploy: {lastDeploy}
        </Typography>
      )}
    </Box>
  );
}
