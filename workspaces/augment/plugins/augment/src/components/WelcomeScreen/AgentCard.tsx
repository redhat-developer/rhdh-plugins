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
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Fade from '@mui/material/Fade';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StreamIcon from '@mui/icons-material/Stream';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import { useTheme, alpha } from '@mui/material/styles';
import type { FC, MouseEvent } from 'react';
import {
  type AgentWithCard,
  getAgentAvatarColor,
  STATUS_COLORS,
  isAgentReady,
  sanitizeDescription,
} from './agentUtils';

const AVATAR_SX_STATIC = {
  width: 40,
  height: 40,
  borderRadius: 2.5,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
  fontSize: '1rem',
  flexShrink: 0,
} as const;

const CARD_CONTENT_SX = {
  p: 2,
  '&:last-child': { pb: 2 },
} as const;

export interface AgentCardProps {
  agent: AgentWithCard;
  isPinned: boolean;
  onSelect: (agent: AgentWithCard) => void;
  onTogglePin: (agentId: string, e: MouseEvent) => void;
  onInfo?: (agent: AgentWithCard) => void;
  index: number;
}

export const AgentCard: FC<AgentCardProps> = ({
  agent,
  isPinned,
  onSelect,
  onTogglePin,
  onInfo,
  index,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const card = agent.agentCard;
  const statusColor = STATUS_COLORS[agent.status] || 'default';
  const agentId = `${agent.namespace}/${agent.name}`;
  const displayName = card?.name || agent.name;
  const avatarColor = getAgentAvatarColor(displayName);
  const ready = isAgentReady(agent.status);

  const rawDesc = card?.description || agent.description || '';
  const cleanDesc = sanitizeDescription(rawDesc, 120);

  const handleCardClick = () => {
    if (onInfo) {
      onInfo(agent);
    } else {
      onSelect(agent);
    }
  };

  return (
    <Fade in timeout={100 + index * 30}>
      <Card
        variant="outlined"
        role="listitem"
        sx={{
          borderRadius: 4,
          transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
          position: 'relative',
          height: 180,
          display: 'flex',
          flexDirection: 'column',
          opacity: ready ? 1 : 0.6,
          borderColor: alpha(theme.palette.divider, isDark ? 0.15 : 0.18),
          borderTop: `3px solid ${alpha(avatarColor, isDark ? 0.4 : 0.3)}`,
          bgcolor: alpha(theme.palette.background.paper, isDark ? 0.6 : 0.9),
          backdropFilter: 'blur(12px)',
          boxShadow: isDark
            ? `0 2px 8px ${alpha('#000', 0.3)}, 0 0 1px ${alpha('#fff', 0.05)} inset`
            : `0 2px 8px ${alpha('#000', 0.06)}, 0 0 1px ${alpha('#fff', 0.7)} inset`,
          '&:hover': {
            borderColor: alpha(avatarColor, 0.5),
            borderTopColor: avatarColor,
            boxShadow: isDark
              ? `0 12px 40px ${alpha(avatarColor, 0.2)}, 0 4px 12px ${alpha('#000', 0.3)}, 0 0 1px ${alpha('#fff', 0.08)} inset`
              : `0 12px 40px ${alpha(avatarColor, 0.15)}, 0 4px 12px ${alpha('#000', 0.06)}, 0 0 1px ${alpha('#fff', 0.8)} inset`,
            transform: ready ? 'translateY(-3px) scale(1.02)' : undefined,
            '& .agent-actions': { opacity: 1 },
          },
          '&:focus-within': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
          },
        }}
      >
        <Box
          className="agent-actions"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 2,
            opacity: isPinned ? 1 : 0.3,
            transition: 'opacity 0.15s ease',
          }}
        >
          <Tooltip title={isPinned ? 'Unpin agent' : 'Pin agent'}>
            <IconButton
              size="small"
              onClick={e => onTogglePin(agentId, e)}
              sx={{
                p: 0.5,
                color: isPinned
                  ? theme.palette.warning.main
                  : theme.palette.text.secondary,
                bgcolor: alpha(theme.palette.background.paper, 0.85),
                backdropFilter: 'blur(8px)',
                borderRadius: 2,
                boxShadow: `0 1px 4px ${alpha('#000', isDark ? 0.3 : 0.1)}`,
                '&:hover': {
                  bgcolor: theme.palette.background.paper,
                  boxShadow: `0 2px 8px ${alpha('#000', isDark ? 0.4 : 0.12)}`,
                },
              }}
            >
              {isPinned ? (
                <StarIcon sx={{ fontSize: 16 }} />
              ) : (
                <StarBorderIcon sx={{ fontSize: 16 }} />
              )}
            </IconButton>
          </Tooltip>
        </Box>

        <Tooltip
          title={
            ready
              ? ''
              : `This agent is ${agent.status.toLowerCase()} and may not respond`
          }
          placement="top"
          arrow
        >
          <CardActionArea
            onClick={handleCardClick}
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
            }}
          >
            <CardContent
              sx={{
                ...CARD_CONTENT_SX,
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}
              >
                <Box
                  sx={{
                    ...AVATAR_SX_STATIC,
                    bgcolor: alpha(avatarColor, isDark ? 0.2 : 0.12),
                    color: avatarColor,
                    boxShadow: `0 2px 6px ${alpha(avatarColor, 0.2)}, 0 0 0 1px ${alpha(avatarColor, 0.1)} inset`,
                  }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="subtitle2"
                    noWrap
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      lineHeight: 1.3,
                    }}
                  >
                    {displayName}
                  </Typography>
                  <Chip
                    label={ready ? 'Ready' : agent.status}
                    size="small"
                    color={ready ? 'success' : statusColor}
                    variant="outlined"
                    sx={{ height: 18, fontSize: '0.7rem', mt: 0.25 }}
                  />
                </Box>
              </Box>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: '0.75rem',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: 1.5,
                  flex: 1,
                }}
              >
                {cleanDesc}
              </Typography>

              {/* Capability badges */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  mt: 1,
                  flexWrap: 'wrap',
                }}
              >
                {card?.streaming && (
                  <Chip
                    icon={<StreamIcon sx={{ fontSize: '12px !important' }} />}
                    label="Streaming"
                    size="small"
                    variant="outlined"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      '& .MuiChip-label': { px: 0.5 },
                    }}
                  />
                )}
                {agent.labels?.protocol && (
                  <Chip
                    icon={<SyncAltIcon sx={{ fontSize: '12px !important' }} />}
                    label="A2A"
                    size="small"
                    variant="outlined"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      '& .MuiChip-label': { px: 0.5 },
                    }}
                  />
                )}
              </Box>
            </CardContent>
          </CardActionArea>
        </Tooltip>
      </Card>
    </Fade>
  );
};
