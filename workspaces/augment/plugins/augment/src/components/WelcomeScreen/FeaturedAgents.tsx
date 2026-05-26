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

import { useMemo, type FC } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Fade from '@mui/material/Fade';
import { useTheme, alpha } from '@mui/material/styles';
import ExploreIcon from '@mui/icons-material/Explore';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
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
  onBrowseCatalog?: () => void;
}

export const FeaturedAgents: FC<FeaturedAgentsProps> = ({
  agents,
  chatAgentConfigs,
  onAgentSelect,
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

  const CARD_WIDTH = 240;

  if (featured.length === 0 && !onBrowseCatalog) return null;

  return (
    <Box sx={{ pb: 1 }}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 1.5,
          maxWidth: 1040,
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
          const ready = isAgentReady(agent.status);

          return (
            <Fade in timeout={150 + idx * 80} key={agentId}>
              <Card
                variant="outlined"
                sx={{
                  width: CARD_WIDTH,
                  minHeight: 110,
                  flexShrink: 0,
                  borderRadius: 3,
                  transition: 'all 0.2s ease',
                  opacity: ready ? 1 : 0.6,
                  display: 'flex',
                  flexDirection: 'column',
                  borderColor: alpha(
                    theme.palette.divider,
                    isDark ? 0.15 : 0.18,
                  ),
                  bgcolor: alpha(
                    theme.palette.background.paper,
                    isDark ? 0.6 : 0.9,
                  ),
                  boxShadow: isDark
                    ? `0 2px 8px ${alpha('#000', 0.2)}`
                    : `0 2px 8px ${alpha('#000', 0.05)}`,
                  '&:hover': {
                    borderColor: alpha(avatarColor, 0.4),
                    boxShadow: isDark
                      ? `0 8px 24px ${alpha(avatarColor, 0.15)}`
                      : `0 8px 24px ${alpha(avatarColor, 0.1)}`,
                    transform: ready ? 'translateY(-2px)' : undefined,
                  },
                }}
              >
                <CardActionArea
                  onClick={() => onAgentSelect(agentId, displayName)}
                  sx={{
                    borderRadius: 3,
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                  }}
                >
                  <CardContent
                    sx={{
                      p: 2,
                      '&:last-child': { pb: 2 },
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.25,
                        mb: 1,
                      }}
                    >
                      {avatarUrl ? (
                        <Box
                          component="img"
                          src={avatarUrl}
                          alt={displayName}
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 2,
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            bgcolor: alpha(avatarColor, isDark ? 0.2 : 0.12),
                            color: avatarColor,
                          }}
                        >
                          {displayName.charAt(0).toUpperCase()}
                        </Box>
                      )}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="subtitle2"
                          noWrap
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            lineHeight: 1.3,
                          }}
                        >
                          {displayName}
                        </Typography>
                        {!ready && (
                          <Chip
                            label={agent.status}
                            size="small"
                            color="warning"
                            variant="outlined"
                            sx={{ height: 16, fontSize: '0.65rem', mt: 0.25 }}
                          />
                        )}
                      </Box>
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        fontSize: '0.72rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.4,
                        flex: 1,
                      }}
                    >
                      {description
                        ? sanitizeDescription(description, 80)
                        : '\u00A0'}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Fade>
          );
        })}
      </Box>

      {onBrowseCatalog && (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={onBrowseCatalog}
            startIcon={<ExploreIcon sx={{ fontSize: 16 }} />}
            endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
            sx={{
              textTransform: 'none',
              fontSize: '0.8rem',
              fontWeight: 600,
              borderRadius: 5,
              px: 2.5,
              py: 0.5,
              borderColor: alpha(theme.palette.divider, 0.4),
              color: theme.palette.text.secondary,
              '&:hover': {
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                bgcolor: alpha(theme.palette.primary.main, 0.04),
              },
            }}
          >
            Browse all{agents.length > 0 ? ` ${agents.length}` : ''} agents
          </Button>
        </Box>
      )}
    </Box>
  );
};
