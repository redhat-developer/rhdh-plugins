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

import { useMemo, type FC, type MouseEvent } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Fade from '@mui/material/Fade';
import { useTheme, alpha } from '@mui/material/styles';
import ExploreIcon from '@mui/icons-material/Explore';
import type { ChatAgentConfig } from '../../types';
import type { AgentWithCard } from './agentUtils';
import {
  getAgentAvatarColor,
  isAgentReady,
  sanitizeDescription,
} from './agentUtils';

interface FeaturedAgentsProps {
  agents: AgentWithCard[];
  chatAgentConfigs: ChatAgentConfig[];
  onAgentSelect: (agentId: string, agentName: string) => void;
  onStarterClick?: (agentId: string, prompt: string) => void;
  onBrowseCatalog?: () => void;
}

export const FeaturedAgents: FC<FeaturedAgentsProps> = ({
  agents,
  chatAgentConfigs,
  onAgentSelect,
  onStarterClick,
  onBrowseCatalog,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const featured = useMemo(() => {
    const hasAnyConfig = chatAgentConfigs.length > 0;
    const featuredConfigs = chatAgentConfigs
      .filter(c => c.featured && c.visible !== false)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

    if (featuredConfigs.length > 0) {
      return featuredConfigs
        .map(cfg => {
          const agent = agents.find(
            a => `${a.namespace}/${a.name}` === cfg.agentId,
          );
          return agent ? { agent, config: cfg } : null;
        })
        .filter(Boolean) as Array<{
        agent: AgentWithCard;
        config: ChatAgentConfig;
      }>;
    }

    // When configs exist but none are featured, show visible agents
    if (hasAnyConfig) {
      const visibleIds = new Set(
        chatAgentConfigs.filter(c => c.visible).map(c => c.agentId),
      );
      return agents
        .filter(
          a =>
            visibleIds.has(`${a.namespace}/${a.name}`) &&
            isAgentReady(a.status),
        )
        .slice(0, 3)
        .map(agent => ({
          agent,
          config: chatAgentConfigs.find(
            c => c.agentId === `${agent.namespace}/${agent.name}`,
          ),
        }));
    }

    // No config at all: show first 3 ready agents
    return agents
      .filter(a => isAgentReady(a.status))
      .slice(0, 3)
      .map(agent => ({
        agent,
        config: undefined as ChatAgentConfig | undefined,
      }));
  }, [agents, chatAgentConfigs]);

  const CARD_WIDTH = 300;

  if (featured.length === 0 && !onBrowseCatalog) return null;

  return (
    <Box sx={{ pb: 1 }}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 2,
          maxWidth: 960,
          mx: 'auto',
        }}
      >
        {featured.map(({ agent, config }, idx) => {
          const agentId = `${agent.namespace}/${agent.name}`;
          const displayName =
            config?.displayName || agent.agentCard?.name || agent.name;
          const description =
            config?.description ||
            agent.agentCard?.description ||
            agent.description;
          const avatarColor =
            config?.accentColor || getAgentAvatarColor(displayName);
          const avatarUrl = config?.avatarUrl;
          const starters =
            config?.conversationStarters ||
            (agent.agentCard?.skills || [])
              .flatMap(s => s.examples || [])
              .slice(0, 3);
          const ready = isAgentReady(agent.status);

          return (
            <Fade in timeout={200 + idx * 100} key={agentId}>
              <Card
                variant="outlined"
                sx={{
                  width: CARD_WIDTH,
                  flexShrink: 0,
                  borderRadius: 4,
                  transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                  opacity: ready ? 1 : 0.6,
                  overflow: 'visible',
                  display: 'flex',
                  flexDirection: 'column',
                  borderColor: alpha(
                    theme.palette.divider,
                    isDark ? 0.15 : 0.18,
                  ),
                  borderTop: `3px solid ${alpha(avatarColor, isDark ? 0.5 : 0.4)}`,
                  bgcolor: alpha(
                    theme.palette.background.paper,
                    isDark ? 0.6 : 0.9,
                  ),
                  backdropFilter: 'blur(12px)',
                  boxShadow: isDark
                    ? `0 4px 12px ${alpha('#000', 0.25)}, 0 0 1px ${alpha('#fff', 0.05)} inset`
                    : `0 4px 12px ${alpha('#000', 0.06)}, 0 0 1px ${alpha('#fff', 0.6)} inset`,
                  '&:hover': {
                    borderColor: alpha(avatarColor, 0.5),
                    borderTopColor: avatarColor,
                    boxShadow: isDark
                      ? `0 16px 48px ${alpha(avatarColor, 0.22)}, 0 4px 12px ${alpha('#000', 0.3)}, 0 0 1px ${alpha('#fff', 0.08)} inset`
                      : `0 16px 48px ${alpha(avatarColor, 0.18)}, 0 4px 12px ${alpha('#000', 0.06)}, 0 0 1px ${alpha('#fff', 0.8)} inset`,
                    transform: ready
                      ? 'translateY(-3px) scale(1.02)'
                      : undefined,
                  },
                }}
              >
                <CardActionArea
                  onClick={() => onAgentSelect(agentId, displayName)}
                  sx={{
                    borderRadius: 4,
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                  }}
                >
                  <CardContent
                    sx={{
                      p: 2.5,
                      '&:last-child': { pb: 2.5 },
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        mb: 1.5,
                      }}
                    >
                      {avatarUrl ? (
                        <Box
                          component="img"
                          src={avatarUrl}
                          alt={displayName}
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2.5,
                            objectFit: 'cover',
                            boxShadow: `0 2px 8px ${alpha(avatarColor, 0.25)}`,
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            bgcolor: alpha(avatarColor, isDark ? 0.2 : 0.12),
                            color: avatarColor,
                            boxShadow: `0 2px 8px ${alpha(avatarColor, 0.2)}, 0 0 0 1px ${alpha(avatarColor, 0.1)} inset`,
                          }}
                        >
                          {displayName.charAt(0).toUpperCase()}
                        </Box>
                      )}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="subtitle1"
                          noWrap
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            lineHeight: 1.3,
                          }}
                        >
                          {displayName}
                        </Typography>
                        <Chip
                          label={ready ? 'Ready' : agent.status}
                          size="small"
                          color={ready ? 'success' : 'warning'}
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
                        minHeight: 48,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.5,
                        flex: 1,
                      }}
                    >
                      {description
                        ? sanitizeDescription(description)
                        : '\u00A0'}
                    </Typography>
                  </CardContent>
                </CardActionArea>

                <Box
                  sx={{
                    px: 2.5,
                    pb: 2,
                    pt: 0,
                    minHeight: 40,
                    display: 'flex',
                    gap: 0.5,
                    flexWrap: 'wrap',
                    alignItems: 'flex-start',
                  }}
                >
                  {starters.map((starter: string, si: number) => (
                    <Chip
                      key={si}
                      label={starter}
                      size="small"
                      variant="outlined"
                      onClick={(e: MouseEvent) => {
                        e.stopPropagation();
                        onStarterClick?.(agentId, starter);
                      }}
                      sx={{
                        fontSize: '0.7rem',
                        height: 24,
                        borderRadius: 1.5,
                        borderStyle: 'dashed',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          borderStyle: 'solid',
                          borderColor: avatarColor,
                          bgcolor: alpha(avatarColor, 0.06),
                        },
                      }}
                    />
                  ))}
                </Box>
              </Card>
            </Fade>
          );
        })}

        {/* Browse All Agents CTA — integrated as the last card */}
        {onBrowseCatalog && (
          <Fade in timeout={200 + featured.length * 100}>
            <Card
              variant="outlined"
              sx={{
                width: CARD_WIDTH,
                flexShrink: 0,
                borderRadius: 4,
                borderStyle: 'dashed',
                borderColor: alpha(
                  theme.palette.primary.main,
                  isDark ? 0.3 : 0.25,
                ),
                transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(
                  theme.palette.background.paper,
                  isDark ? 0.4 : 0.7,
                ),
                backdropFilter: 'blur(12px)',
                boxShadow: isDark
                  ? `0 2px 8px ${alpha('#000', 0.2)}, 0 0 1px ${alpha('#fff', 0.03)} inset`
                  : `0 2px 8px ${alpha('#000', 0.04)}, 0 0 1px ${alpha('#fff', 0.5)} inset`,
                minHeight: featured.length > 0 ? undefined : 120,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 4,
                  border: `2px solid transparent`,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.3)}, transparent 60%) border-box`,
                  WebkitMask:
                    'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                  animation: 'rotateBorder 4s linear infinite',
                  opacity: 0.5,
                  '@keyframes rotateBorder': {
                    '0%': {
                      background: `linear-gradient(0deg, ${alpha(theme.palette.primary.main, 0.3)}, transparent 60%) border-box`,
                    },
                    '25%': {
                      background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.3)}, transparent 60%) border-box`,
                    },
                    '50%': {
                      background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.3)}, transparent 60%) border-box`,
                    },
                    '75%': {
                      background: `linear-gradient(270deg, ${alpha(theme.palette.primary.main, 0.3)}, transparent 60%) border-box`,
                    },
                    '100%': {
                      background: `linear-gradient(360deg, ${alpha(theme.palette.primary.main, 0.3)}, transparent 60%) border-box`,
                    },
                  },
                },
                '&:hover': {
                  borderStyle: 'solid',
                  borderColor: theme.palette.primary.main,
                  bgcolor: alpha(
                    theme.palette.primary.main,
                    isDark ? 0.06 : 0.03,
                  ),
                  transform: 'translateY(-3px) scale(1.02)',
                  boxShadow: isDark
                    ? `0 12px 40px ${alpha(theme.palette.primary.main, 0.2)}, 0 0 1px ${alpha('#fff', 0.08)} inset`
                    : `0 12px 40px ${alpha(theme.palette.primary.main, 0.12)}, 0 0 1px ${alpha('#fff', 0.8)} inset`,
                },
              }}
            >
              <CardActionArea
                onClick={onBrowseCatalog}
                sx={{
                  borderRadius: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1.5,
                  py: 4,
                  px: 3,
                  height: '100%',
                }}
              >
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(
                      theme.palette.primary.main,
                      isDark ? 0.15 : 0.08,
                    ),
                    color: theme.palette.primary.main,
                    animation: 'pulse 2.5s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { transform: 'scale(1)' },
                      '50%': { transform: 'scale(1.05)' },
                    },
                  }}
                >
                  <ExploreIcon sx={{ fontSize: 26 }} />
                </Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.primary.main,
                    textAlign: 'center',
                    fontSize: '0.9rem',
                  }}
                >
                  Browse all agents
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    textAlign: 'center',
                  }}
                >
                  Explore the full catalog
                </Typography>
              </CardActionArea>
            </Card>
          </Fade>
        )}
      </Box>
    </Box>
  );
};
