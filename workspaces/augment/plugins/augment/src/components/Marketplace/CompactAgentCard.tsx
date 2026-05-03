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
import IconButton from '@mui/material/IconButton';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useTheme, alpha } from '@mui/material/styles';
import type { ChatAgent } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { getAvatarColor, getFrameworkColor, LIFECYCLE_STAGE_CONFIG } from './marketplace.constants';
import { cardSx, cardAccentSx, avatarSx } from './marketplace.styles';

interface CompactAgentCardProps {
  agent: ChatAgent;
  onClick: () => void;
}

/**
 * Compact agent card (~88px) showing avatar, name, description, status, and chat action.
 * Designed for high-density 4-column grids where 16 agents are visible at once.
 */
export function CompactAgentCard({ agent, onClick }: CompactAgentCardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const avatarColor = getAvatarColor(agent.name);
  const fwColor = getFrameworkColor(agent.framework);
  const isReady = agent.status?.toLowerCase() === 'ready';
  const stageConfig = LIFECYCLE_STAGE_CONFIG[agent.lifecycleStage ?? 'draft'];

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter') onClick(); }}
      sx={cardSx(theme, isDark, avatarColor)}
    >
      {/* Left accent */}
      <Box sx={cardAccentSx(avatarColor, isReady)} />

      {/* Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1, px: 3, py: 2.5, minWidth: 0 }}>
        {/* Top row: Avatar + Name + Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={avatarSx(isDark, avatarColor)}>
            {agent.name.charAt(0).toUpperCase()}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body1"
              noWrap
              title={agent.name}
              sx={{ fontWeight: 700, fontSize: '0.9rem', color: theme.palette.text.primary, lineHeight: 1.3 }}
            >
              {agent.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
              {stageConfig && (
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.6rem',
                    fontWeight: 600,
                    color: stageConfig.color,
                    bgcolor: alpha(stageConfig.color, isDark ? 0.15 : 0.08),
                    px: 0.5,
                    borderRadius: 0.5,
                    lineHeight: 1.5,
                  }}
                >
                  {stageConfig.label}
                </Typography>
              )}
              {agent.framework && (
                <Tooltip title={agent.framework} placement="top">
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: fwColor, flexShrink: 0 }} />
                </Tooltip>
              )}
              {isReady && (
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: theme.palette.success.main, flexShrink: 0, boxShadow: `0 0 5px ${alpha(theme.palette.success.main, 0.5)}` }} />
              )}
            </Box>
          </Box>
          <Tooltip title="Start Chat" placement="left">
            <IconButton
              size="small"
              onClick={e => { e.stopPropagation(); onClick(); }}
              sx={{
                color: theme.palette.text.disabled,
                transition: 'all 0.15s',
                '&:hover': { color: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.08) },
              }}
            >
              <ChatBubbleOutlineIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Description -- 2 lines */}
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            fontSize: '0.83rem',
            lineHeight: 1.6,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            pl: 7,
          }}
        >
          {agent.description || `${agent.name} — an AI agent ready to assist you.`}
        </Typography>
      </Box>
    </Box>
  );
}
