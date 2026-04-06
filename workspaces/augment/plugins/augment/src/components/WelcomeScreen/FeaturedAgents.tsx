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
}

export const FeaturedAgents: FC<FeaturedAgentsProps> = ({
  agents,
  chatAgentConfigs,
  onAgentSelect,
  onStarterClick,
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

  if (featured.length === 0) return null;

  return (
    <Box sx={{ px: 2, pb: 2 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm:
              featured.length === 1
                ? '1fr'
                : 'repeat(auto-fit, minmax(280px, 1fr))',
          },
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
            <Fade in timeout={200 + idx * 80} key={agentId}>
              <Card
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  transition: 'all 0.2s ease',
                  opacity: ready ? 1 : 0.6,
                  overflow: 'visible',
                  '&:hover': {
                    borderColor: avatarColor,
                    boxShadow: `0 6px 24px ${alpha(avatarColor, isDark ? 0.2 : 0.12)}`,
                    transform: ready ? 'translateY(-2px)' : undefined,
                  },
                }}
              >
                <CardActionArea
                  onClick={() => onAgentSelect(agentId, displayName)}
                  sx={{ borderRadius: 3 }}
                >
                  <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
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
                            borderRadius: 2,
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            bgcolor: alpha(avatarColor, isDark ? 0.2 : 0.12),
                            color: avatarColor,
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
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                          }}
                        >
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              bgcolor: ready
                                ? theme.palette.success.main
                                : theme.palette.warning.main,
                            }}
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: '0.65rem',
                              color: theme.palette.text.disabled,
                            }}
                          >
                            {ready ? 'Ready' : agent.status}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          fontSize: '0.8rem',
                          mb: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.5,
                        }}
                      >
                        {sanitizeDescription(description)}
                      </Typography>
                    )}
                  </CardContent>
                </CardActionArea>

                {starters.length > 0 && (
                  <Box
                    sx={{
                      px: 2.5,
                      pb: 2,
                      display: 'flex',
                      gap: 0.75,
                      flexWrap: 'wrap',
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
                          height: 26,
                          borderRadius: 2,
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
                )}
              </Card>
            </Fade>
          );
        })}
      </Box>
    </Box>
  );
};
