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
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import StreamIcon from '@mui/icons-material/Stream';
import { useTheme, alpha } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import type { FC, MouseEvent } from 'react';
import {
  type AgentWithCard,
  getAgentAvatarColor,
  STATUS_COLORS,
  isAgentReady,
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
  const skills = card?.skills || [];
  const statusColor = STATUS_COLORS[agent.status] || 'default';
  const agentId = `${agent.namespace}/${agent.name}`;
  const displayName = card?.name || agent.name;
  const avatarColor = getAgentAvatarColor(displayName);
  const ready = isAgentReady(agent.status);
  const protocol = agent.labels?.protocol;
  const protocolLabel = protocol
    ? (Array.isArray(protocol) ? protocol.join(', ') : protocol).toUpperCase()
    : null;

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
        <Box
          className="agent-actions"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            gap: 0.25,
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
          {onInfo && (
            <Tooltip title="Agent details">
              <IconButton
                size="small"
                onClick={e => {
                  e.stopPropagation();
                  onInfo(agent);
                }}
                sx={{
                  p: 0.5,
                  color: theme.palette.text.secondary,
                  bgcolor: alpha(theme.palette.background.paper, 0.9),
                  '&:hover': { bgcolor: theme.palette.background.paper },
                }}
              >
                <InfoOutlinedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
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
          <CardActionArea onClick={() => onSelect(agent)}>
            <CardContent sx={CARD_CONTENT_SX}>
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
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: statusDotColor(statusColor, theme),
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
                    {card?.version && (
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.6rem',
                          color: theme.palette.text.disabled,
                          ml: 0.5,
                        }}
                      >
                        v{card.version}
                      </Typography>
                    )}
                    {card?.streaming && (
                      <Tooltip title="Supports streaming">
                        <StreamIcon
                          sx={{
                            fontSize: 12,
                            color: theme.palette.info.main,
                            ml: 0.5,
                          }}
                        />
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              </Box>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: '0.75rem',
                  mb: 1,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  minHeight: 42,
                  lineHeight: 1.4,
                }}
              >
                {card?.description ||
                  agent.description ||
                  'No description available'}
              </Typography>

              {skills.length > 0 && (
                <Box
                  sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 0.75 }}
                >
                  {skills.slice(0, 3).map((skill, sidx) => (
                    <Chip
                      key={skill.id || sidx}
                      label={skill.name || skill.id || 'skill'}
                      size="small"
                      variant="outlined"
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        borderRadius: 1,
                        '& .MuiChip-label': { px: 0.75 },
                      }}
                    />
                  ))}
                  {skills.length > 3 && (
                    <Chip
                      label={`+${skills.length - 3}`}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        borderRadius: 1,
                        bgcolor: alpha(theme.palette.text.primary, 0.06),
                        '& .MuiChip-label': { px: 0.75 },
                      }}
                    />
                  )}
                </Box>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography
                  variant="caption"
                  color="text.disabled"
                  sx={{ fontSize: '0.6rem' }}
                >
                  {agent.namespace}
                  {agent.labels?.framework
                    ? ` · ${agent.labels.framework}`
                    : ''}
                </Typography>
                {protocolLabel && (
                  <Chip
                    label={protocolLabel}
                    size="small"
                    sx={{
                      height: 16,
                      fontSize: '0.55rem',
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      borderRadius: 0.75,
                      ml: 'auto',
                      bgcolor: alpha(
                        theme.palette.info.main,
                        isDark ? 0.15 : 0.08,
                      ),
                      color: theme.palette.info.main,
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
