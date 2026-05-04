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
import Tooltip from '@mui/material/Tooltip';
import { useTheme, alpha } from '@mui/material/styles';
import type { ChatAgent } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { STATUS_COLORS } from './commandcenter.constants';

interface HealthMosaicProps {
  agents: ChatAgent[];
  title?: string;
}

function getAgentColor(status?: string): string {
  const s = status?.toLowerCase() ?? '';
  if (s === 'ready' || s === 'running') return STATUS_COLORS.healthy;
  if (s === 'pending' || s === 'building' || s === 'not ready') return STATUS_COLORS.warning;
  if (s === 'failed' || s === 'error') return STATUS_COLORS.critical;
  return STATUS_COLORS.neutral;
}

/**
 * Agent fleet heatmap -- a mosaic of colored tiles representing each agent's health.
 * Each tile is a small square showing the first letter + status color.
 * Gives instant visual overview of entire fleet health at a glance.
 */
export function HealthMosaic({ agents, title = 'Fleet Health', onAgentClick }: HealthMosaicProps & { onAgentClick?: (id: string) => void }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const sorted = [...agents].sort((a, b) => {
    const order = (s?: string) => {
      const sl = s?.toLowerCase() ?? '';
      if (sl === 'ready' || sl === 'running') return 0;
      if (sl === 'pending' || sl === 'building' || sl === 'not ready') return 1;
      return 2;
    };
    return order(a.status) - order(b.status);
  });

  const readyCount = agents.filter(a => ['ready', 'running'].includes(a.status?.toLowerCase() ?? '')).length;
  const warningCount = agents.filter(a => ['pending', 'building', 'not ready'].includes(a.status?.toLowerCase() ?? '')).length;
  const errorCount = agents.length - readyCount - warningCount;

  return (
    <Box>
      {/* Title + Legend */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.85rem' }}
        >
          {title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {readyCount > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: STATUS_COLORS.healthy }} />
              <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>Ready ({readyCount})</Typography>
            </Box>
          )}
          {warningCount > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: STATUS_COLORS.warning }} />
              <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>Building ({warningCount})</Typography>
            </Box>
          )}
          {errorCount > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: STATUS_COLORS.critical }} />
              <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>Error ({errorCount})</Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Mosaic Grid */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0.75,
        }}
      >
        {sorted.map(agent => {
          const color = getAgentColor(agent.status);
          const isHealthy = agent.status?.toLowerCase() === 'ready';
          return (
            <Tooltip
              key={agent.id}
              title={`${agent.name} — ${agent.status || 'Unknown'}`}
              placement="top"
              arrow
            >
              <Box
                onClick={() => onAgentClick?.(agent.id)}
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 1.5,
                  bgcolor: alpha(color, isDark ? 0.15 : 0.08),
                  border: `1px solid ${alpha(color, isDark ? 0.3 : 0.2)}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: onAgentClick ? 'pointer' : 'default',
                  transition: 'all 0.15s ease',
                  boxShadow: isHealthy ? `0 0 6px ${alpha(color, 0.3)}` : undefined,
                  '&:hover': {
                    transform: 'scale(1.12)',
                    boxShadow: `0 0 12px ${alpha(color, 0.5)}`,
                    zIndex: 1,
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color,
                    fontFamily: '"SF Mono", "JetBrains Mono", monospace',
                    lineHeight: 1,
                  }}
                >
                  {agent.name.charAt(0).toUpperCase()}
                </Typography>
                <Box
                  sx={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    bgcolor: color,
                    mt: 0.3,
                    opacity: 0.8,
                  }}
                />
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}
