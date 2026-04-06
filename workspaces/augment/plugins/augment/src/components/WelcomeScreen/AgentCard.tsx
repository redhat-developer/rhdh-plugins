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
import type { Theme } from '@mui/material/styles';
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
  borderRadius: '50%',
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

function statusDotColor(color: string, theme: Theme): string {
  const map: Record<string, string> = {
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
  };
  return map[color] || theme.palette.text.disabled;
}

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

  const starters = (card?.skills || [])
    .flatMap(s => s.examples || [])
    .slice(0, 2);

  const handleCardClick = () => {
    if (onInfo) {
      onInfo(agent);
    } else {
      onSelect(agent);
    }
  };

  return (
    <Fade in timeout={200 + index * 50}>
      <Card
        variant="outlined"
        role="listitem"
        sx={{
          borderRadius: 3,
          transition: 'all 0.2s ease',
          position: 'relative',
          opacity: ready ? 1 : 0.6,
          '&:hover': {
            borderColor: theme.palette.primary.main,
            boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, isDark ? 0.15 : 0.1)}`,
            transform: ready ? 'translateY(-2px)' : undefined,
            '& .agent-actions': { opacity: 1 },
          },
        }}
      >
        {/* Pin action (top-right) */}
        <Box
          className="agent-actions"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 2,
            opacity: isPinned ? 1 : 0,
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
                bgcolor: alpha(theme.palette.background.paper, 0.9),
                '&:hover': {
                  bgcolor: theme.palette.background.paper,
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
          <CardActionArea onClick={handleCardClick}>
            <CardContent sx={CARD_CONTENT_SX}>
              {/* Avatar + Name */}
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}
              >
                <Box
                  sx={{
                    ...AVATAR_SX_STATIC,
                    bgcolor: alpha(avatarColor, isDark ? 0.2 : 0.12),
                    color: avatarColor,
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
                </Box>
              </Box>

              {/* Clean description */}
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: '0.75rem',
                  mb: 1,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  minHeight: 32,
                  lineHeight: 1.5,
                }}
              >
                {cleanDesc}
              </Typography>

              {/* Conversation starters */}
              {starters.length > 0 && (
                <Box
                  sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}
                >
                  {starters.map((s, si) => (
                    <Chip
                      key={si}
                      label={s}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: '0.65rem',
                        borderRadius: 1.5,
                        bgcolor: alpha(
                          theme.palette.text.primary,
                          isDark ? 0.06 : 0.04,
                        ),
                        color: theme.palette.text.secondary,
                        '& .MuiChip-label': { px: 0.75 },
                      }}
                    />
                  ))}
                </Box>
              )}

              {/* Status + capabilities footer */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  mt: 'auto',
                }}
              >
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: statusDotColor(statusColor, theme),
                    flexShrink: 0,
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.65rem',
                    color: theme.palette.text.secondary,
                  }}
                >
                  {agent.status}
                </Typography>
                <Box sx={{ flex: 1 }} />
                {card?.streaming && (
                  <Tooltip title="Streaming">
                    <StreamIcon
                      sx={{
                        fontSize: 13,
                        color: theme.palette.text.disabled,
                      }}
                    />
                  </Tooltip>
                )}
                {agent.labels?.protocol && (
                  <Tooltip title="A2A Protocol">
                    <SyncAltIcon
                      sx={{
                        fontSize: 13,
                        color: theme.palette.text.disabled,
                      }}
                    />
                  </Tooltip>
                )}
              </Box>
            </CardContent>
          </CardActionArea>
        </Tooltip>
      </Card>
    </Fade>
  );
};
