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
export function HealthMosaic({ agents, title = 'Fleet Health' }: HealthMosaicProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box>
      <Typography
        variant="subtitle2"
        sx={{ fontWeight: 700, mb: 1.5, color: 'text.primary', fontSize: '0.85rem' }}
      >
        {title}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0.75,
        }}
      >
        {agents.map(agent => {
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
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  bgcolor: alpha(color, isDark ? 0.15 : 0.08),
                  border: `1px solid ${alpha(color, isDark ? 0.3 : 0.2)}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'default',
                  transition: 'all 0.15s ease',
                  boxShadow: isHealthy ? `0 0 6px ${alpha(color, 0.3)}` : undefined,
                  '&:hover': {
                    transform: 'scale(1.15)',
                    boxShadow: `0 0 12px ${alpha(color, 0.5)}`,
                    zIndex: 1,
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color,
                    fontFamily: '"SF Mono", "JetBrains Mono", monospace',
                  }}
                >
                  {agent.name.charAt(0).toUpperCase()}
                </Typography>
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}
