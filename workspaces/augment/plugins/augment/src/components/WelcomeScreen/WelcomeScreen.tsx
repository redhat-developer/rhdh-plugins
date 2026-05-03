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
import { useMemo, useCallback, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Fade from '@mui/material/Fade';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useTheme, alpha } from '@mui/material/styles';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import { useApi } from '@backstage/core-plugin-api';
import { augmentApiRef } from '../../api';
import { useBranding } from '../../hooks';
import { useTranslation } from '../../hooks/useTranslation';
import { sanitizeBrandingUrl } from '../../theme/branding';
import { typeScale, iconSize } from '../../theme/tokens';
import { useAgentGalleryData } from './useAgentGalleryData';
import type {
  PromptGroup,
  PromptCard,
  Workflow,
  QuickAction,
  ChatAgentConfig,
} from '../../types';
import { PromptGroupRow } from './PromptGroupRow';
import {
  getAgentAvatarColor,
  isAgentReady,
  sanitizeDescription,
  sortAgents,
} from './agentUtils';
import type { AgentWithCard } from './agentUtils';
import { buildEffectivePromptGroups } from './buildEffectivePromptGroups';
import { stripMarkdown } from './stripMarkdown';
import {
  getContainerSx,
  getHeroSx,
  getTitleSx,
  getPromptGroupsContainerSx,
  getPlaygroundHeroSx,
  getSearchBarSx,
  getAgentGridSx,
  getGridScrollAreaSx,
} from './styles';

export interface SelectedAgentInfo {
  id: string;
  name: string;
  description?: string;
  starters: string[];
  avatarColor?: string;
  avatarUrl?: string;
}

interface WelcomeScreenProps {
  readonly workflows: readonly Workflow[];
  readonly quickActions: readonly QuickAction[];
  readonly onQuickActionSelect: (action: QuickAction) => void;
  readonly promptGroups?: readonly PromptGroup[];
  readonly onAgentSelect?: (agentId: string, agentName: string) => void;
  readonly showAgentGallery?: boolean;
  readonly chatAgentConfigs?: ChatAgentConfig[];
  readonly selectedAgent?: SelectedAgentInfo;
  readonly onChangeAgent?: () => void;
  readonly onStarterSelect?: (prompt: string) => void;
}

const TAGLINE_SX = {
  color: 'text.secondary',
  fontSize: typeScale.bodySmall.fontSize,
} as const;

const LOGO_SX = {
  maxHeight: 48,
  maxWidth: 200,
  objectFit: 'contain' as const,
  display: 'block',
  margin: '0 auto',
  mb: 1,
};

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  workflows,
  quickActions,
  onQuickActionSelect,
  promptGroups: configPromptGroups,
  onAgentSelect,
  showAgentGallery = false,
  chatAgentConfigs = [],
  selectedAgent,
  onChangeAgent,
  onStarterSelect,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const api = useApi(augmentApiRef);
  const { branding } = useBranding();
  const { t } = useTranslation();
  const [logoError, setLogoError] = useState(false);
  const [agentSearch, setAgentSearch] = useState('');
  const { agents: allAgents, loading: agentsLoading, error: agentsError, fetchAgents: retryFetchAgents } = useAgentGalleryData(api);

  const safeLogoUrl = useMemo(
    () => sanitizeBrandingUrl(branding.logoUrl),
    [branding.logoUrl],
  );

  const effectivePromptGroups = useMemo(
    () =>
      buildEffectivePromptGroups({
        configPromptGroups,
        workflows,
        quickActions,
        fallbackColor: branding.primaryColor,
      }),
    [configPromptGroups, workflows, quickActions, branding.primaryColor],
  );

  const handleCardClick = useCallback(
    (card: PromptCard) => {
      if (card.agentId && onAgentSelect) {
        const name = card.agentId.includes('/')
          ? card.agentId.split('/').pop()!
          : card.agentId;
        onAgentSelect(card.agentId, name);
      }
      onQuickActionSelect({
        title: card.title,
        description: card.description,
        prompt: card.prompt,
        icon: card.icon,
      });
    },
    [onQuickActionSelect, onAgentSelect],
  );

  const titleSx = useMemo(
    () => getTitleSx(branding.primaryColor),
    [branding.primaryColor],
  );

  const hasFeatured = showAgentGallery && onAgentSelect;

  // Visible agents filtered by admin config
  const visibleAgents = useMemo(() => {
    if (chatAgentConfigs.length === 0) return allAgents;
    const hiddenIds = new Set(
      chatAgentConfigs.filter(c => !c.visible).map(c => c.agentId),
    );
    return allAgents.filter((a: AgentWithCard) => !hiddenIds.has(`${a.namespace}/${a.name}`));
  }, [allAgents, chatAgentConfigs]);

  // Search-filtered and sorted agents
  const filteredAgents = useMemo(() => {
    let list = visibleAgents;
    if (agentSearch.trim()) {
      const q = agentSearch.toLowerCase();
      list = list.filter((a: AgentWithCard) => {
        const name = (a.agentCard?.name || a.name).toLowerCase();
        const desc = (a.agentCard?.description || a.description || '').toLowerCase();
        return name.includes(q) || desc.includes(q);
      });
    }
    return sortAgents(list, 'name');
  }, [visibleAgents, agentSearch]);

  const handleInlineAgentSelect = useCallback(
    (agent: AgentWithCard) => {
      if (!onAgentSelect) return;
      const agentId = `${agent.namespace}/${agent.name}`;
      const displayName = agent.agentCard?.name || agent.name;
      onAgentSelect(agentId, displayName);
    },
    [onAgentSelect],
  );

  // ── State 2: Agent selected, no messages ──────────────────────────────
  if (selectedAgent) {
    const avatarColor =
      selectedAgent.avatarColor || getAgentAvatarColor(selectedAgent.name);
    const cleanDesc = selectedAgent.description
      ? stripMarkdown(selectedAgent.description)
      : undefined;

    return (
      <Box
        sx={{
          ...getContainerSx(theme),
          justifyContent: 'center',
          alignItems: 'center',
          px: 3,
          gap: 2.5,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60%',
            height: '40%',
            background: `radial-gradient(ellipse at center top, ${alpha(avatarColor, isDark ? 0.08 : 0.05)}, transparent 70%)`,
            pointerEvents: 'none',
          },
        }}
      >
        {/* Agent identity */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1.5,
            maxWidth: 600,
            textAlign: 'center',
            zIndex: 1,
          }}
        >
          <Box>
            {selectedAgent.avatarUrl ? (
              <Box
                component="img"
                src={selectedAgent.avatarUrl}
                alt={selectedAgent.name}
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 3,
                  objectFit: 'cover',
                }}
              />
            ) : (
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.5rem',
                  bgcolor: alpha(avatarColor, isDark ? 0.2 : 0.12),
                  color: avatarColor,
                }}
              >
                {selectedAgent.name.charAt(0).toUpperCase()}
              </Box>
            )}
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
            {selectedAgent.name}
          </Typography>

          {cleanDesc && (
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                lineHeight: 1.6,
                maxWidth: 500,
              }}
            >
              {cleanDesc}
            </Typography>
          )}

          {/* Change agent — visible escape hatch above starters */}
          {onChangeAgent && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<SwapHorizIcon sx={{ fontSize: iconSize.sm }} />}
              onClick={onChangeAgent}
              sx={{
                textTransform: 'none',
                fontSize: typeScale.bodySmall.fontSize,
                borderColor: alpha(theme.palette.divider, 0.5),
                color: theme.palette.text.secondary,
                borderRadius: 5,
                px: 2,
                '&:hover': {
                  color: theme.palette.primary.main,
                  borderColor: theme.palette.primary.main,
                },
              }}
            >
              Change agent
            </Button>
          )}
        </Box>

        {/* Conversation starters as uniform tiles */}
        {selectedAgent.starters.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 1.5,
              maxWidth: 860,
              width: '100%',
              zIndex: 1,
            }}
          >
            {selectedAgent.starters.map((starter: string, idx: number) => (
              <Card
                key={idx}
                variant="outlined"
                sx={{
                  width: 200,
                  flexShrink: 0,
                  borderRadius: 3,
                  borderColor: alpha(avatarColor, isDark ? 0.2 : 0.15),
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: avatarColor,
                    boxShadow: `0 4px 16px ${alpha(avatarColor, isDark ? 0.15 : 0.1)}`,
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                <CardActionArea
                  onClick={() => onStarterSelect?.(starter)}
                  sx={{ px: 2, py: 1.75 }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1,
                    }}
                  >
                    <ChatBubbleOutlineIcon
                      sx={{
                        fontSize: iconSize.xs,
                        color: alpha(avatarColor, 0.5),
                        mt: 0.25,
                        flexShrink: 0,
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: typeScale.bodySmall.fontSize,
                        color: theme.palette.text.primary,
                        lineHeight: 1.5,
                      }}
                    >
                      {starter}
                    </Typography>
                  </Box>
                </CardActionArea>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    );
  }

  // ── State 1: No agent selected — full-page agent playground ─────────
  if (hasFeatured) {
    return (
      <Box sx={getContainerSx(theme)}>
        {/* Compact Hero */}
        <Box sx={getPlaygroundHeroSx()}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(branding.primaryColor || theme.palette.primary.main, isDark ? 0.15 : 0.08),
              mx: 'auto',
              mb: 1.5,
            }}
          >
            <HubOutlinedIcon
              sx={{
                fontSize: iconSize.xl,
                color: branding.primaryColor || theme.palette.primary.main,
              }}
            />
          </Box>
          <Typography variant="h5" sx={{ ...titleSx, fontSize: typeScale.pageTitle.fontSize, mb: 0.5 }}>
            Agent Playground
          </Typography>
          <Typography variant="body2" sx={TAGLINE_SX}>
            Select an agent to start a conversation
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.disabled,
              fontSize: typeScale.micro.fontSize,
              mt: 0.5,
              display: 'block',
            }}
          >
            {visibleAgents.length} {visibleAgents.length === 1 ? 'agent' : 'agents'} available
          </Typography>
        </Box>

        {/* Search Bar */}
        <Box sx={getSearchBarSx(theme)}>
          <TextField
            size="small"
            placeholder="Search agents..."
            value={agentSearch}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAgentSearch(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: iconSize.md, color: theme.palette.text.disabled }} />
                </InputAdornment>
              ),
              endAdornment: agentSearch ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setAgentSearch('')}>
                    <ClearIcon sx={{ fontSize: iconSize.sm }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{ maxWidth: 480 }}
          />
        </Box>

        {/* Agent Grid */}
        <Box sx={getGridScrollAreaSx(theme)}>
          {agentsLoading ? (
            <Box sx={getAgentGridSx(theme)}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton
                  key={i}
                  variant="rectangular"
                  height={140}
                  sx={{ borderRadius: 3 }}
                  animation="wave"
                />
              ))}
            </Box>
          ) : agentsError ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2, px: 3 }}>
              <Alert
                severity="warning"
                sx={{ maxWidth: 480, width: '100%' }}
                action={
                  <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={retryFetchAgents}>
                    Retry
                  </Button>
                }
              >
                {agentsError}
              </Alert>
            </Box>
          ) : filteredAgents.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 8,
                gap: 2,
              }}
            >
              {visibleAgents.length === 0 ? (
                <>
                  <Box
                    sx={{
                      width: 72,
                      height: 72,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: alpha(theme.palette.primary.main, isDark ? 0.1 : 0.06),
                    }}
                  >
                    <HubOutlinedIcon
                      sx={{ fontSize: 40, color: theme.palette.primary.main, opacity: 0.6 }}
                    />
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    No agents available
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.text.secondary, textAlign: 'center', maxWidth: 360 }}
                  >
                    Deploy agents via the Command Center to get started. They will appear here automatically.
                  </Typography>
                </>
              ) : (
                <>
                  <SearchIcon sx={{ fontSize: 40, color: alpha(theme.palette.text.disabled, 0.4) }} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    No matching agents
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: theme.palette.text.secondary, maxWidth: 300, textAlign: 'center' }}
                  >
                    No agents match &ldquo;{agentSearch}&rdquo;. Try a different search term.
                  </Typography>
                </>
              )}
            </Box>
          ) : (
            <Box sx={getAgentGridSx(theme)}>
              {filteredAgents.map((agent: AgentWithCard, idx: number) => {
                const displayName = chatAgentConfigs.find(
                  c => c.agentId === `${agent.namespace}/${agent.name}`,
                )?.displayName || agent.agentCard?.name || agent.name;
                const config = chatAgentConfigs.find(
                  c => c.agentId === `${agent.namespace}/${agent.name}`,
                );
                const description = config?.description || agent.agentCard?.description || agent.description;
                const avatarColor = config?.accentColor || getAgentAvatarColor(displayName);
                const avatarUrl = config?.avatarUrl;
                const ready = isAgentReady(agent.status);

                return (
                  <Fade in timeout={80 + idx * 30} key={`${agent.namespace}/${agent.name}`}>
                    <Card
                      variant="outlined"
                      sx={{
                        borderRadius: 3,
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        opacity: ready ? 1 : 0.55,
                        borderColor: alpha(theme.palette.divider, isDark ? 0.15 : 0.18),
                        bgcolor: alpha(theme.palette.background.paper, isDark ? 0.6 : 0.9),
                        boxShadow: isDark
                          ? `0 1px 4px ${alpha('#000', 0.2)}`
                          : `0 1px 4px ${alpha('#000', 0.06)}`,
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
                        onClick={() => handleInlineAgentSelect(agent)}
                        sx={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'stretch',
                          borderRadius: 3,
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
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1 }}>
                            {avatarUrl ? (
                              <Box
                                component="img"
                                src={avatarUrl}
                                alt={displayName}
                                sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 2,
                                  objectFit: 'cover',
                                  flexShrink: 0,
                                }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 2,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700,
                                  fontSize: '1rem',
                                  bgcolor: alpha(avatarColor, isDark ? 0.2 : 0.12),
                                  color: avatarColor,
                                  flexShrink: 0,
                                }}
                              >
                                {displayName.charAt(0).toUpperCase()}
                              </Box>
                            )}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <Box
                                  sx={{
                                    width: 7,
                                    height: 7,
                                    borderRadius: '50%',
                                    bgcolor: ready
                                      ? theme.palette.success.main
                                      : theme.palette.warning.main,
                                    flexShrink: 0,
                                  }}
                                />
                                <Typography
                                  variant="subtitle2"
                                  noWrap
                                  sx={{ fontWeight: 700, fontSize: typeScale.body.fontSize, lineHeight: 1.3 }}
                                >
                                  {displayName}
                                </Typography>
                              </Box>
                              <Typography
                                variant="caption"
                                noWrap
                                sx={{
                                  color: theme.palette.text.disabled,
                                  fontSize: typeScale.micro.fontSize,
                                  display: 'block',
                                }}
                              >
                                {agent.namespace}
                              </Typography>
                            </Box>
                          </Box>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              fontSize: typeScale.caption.fontSize,
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: 1.45,
                              flex: 1,
                              mb: 1,
                            }}
                          >
                            {description ? sanitizeDescription(description, 120) : '\u00A0'}
                          </Typography>

                          {/* Chips row */}
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {agent.labels?.framework && (
                              <Chip
                                label={agent.labels.framework}
                                size="small"
                                variant="outlined"
                                sx={{
                                  height: 20,
                                  fontSize: typeScale.micro.fontSize,
                                  borderRadius: 1.5,
                                  borderColor: alpha(theme.palette.divider, 0.3),
                                  color: theme.palette.text.secondary,
                                }}
                              />
                            )}
                            {agent.labels?.protocol && (
                              <Chip
                                label="A2A"
                                size="small"
                                variant="outlined"
                                sx={{
                                  height: 20,
                                  fontSize: typeScale.micro.fontSize,
                                  borderRadius: 1.5,
                                  borderColor: alpha(theme.palette.divider, 0.3),
                                  color: theme.palette.text.secondary,
                                }}
                              />
                            )}
                            {agent.agentCard?.streaming && (
                              <Chip
                                label="Streaming"
                                size="small"
                                variant="outlined"
                                sx={{
                                  height: 20,
                                  fontSize: typeScale.micro.fontSize,
                                  borderRadius: 1.5,
                                  borderColor: alpha(theme.palette.divider, 0.3),
                                  color: theme.palette.text.secondary,
                                }}
                              />
                            )}
                          </Box>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Fade>
                );
              })}
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  // ── Fallback: No agent catalog available — show prompts ──────────────
  const hasPrompts = effectivePromptGroups.length > 0;

  return (
    <Box sx={getContainerSx(theme)}>
      {/* Hero */}
      <Box sx={getHeroSx()}>
        {safeLogoUrl && !logoError && (
          <Box
            component="img"
            src={safeLogoUrl}
            alt={branding.appName || t('welcomeScreen.logoAlt')}
            role="img"
            aria-label={`${branding.appName || 'Application'} logo`}
            onError={() => setLogoError(true)}
            sx={LOGO_SX}
          />
        )}
        {safeLogoUrl && logoError && (
          <Typography
            variant="caption"
            sx={{
              color: 'warning.main',
              fontSize: typeScale.micro.fontSize,
              mb: 0.5,
            }}
          >
            {t('welcomeScreen.logoError')}
          </Typography>
        )}
        <Typography variant="h4" sx={titleSx}>
          {branding.appName}
        </Typography>
        <Typography variant="body2" sx={TAGLINE_SX}>
          {branding.tagline}
        </Typography>
      </Box>

      {/* Prompt Groups */}
      <Box sx={getPromptGroupsContainerSx(isDark, theme)}>
        {hasPrompts &&
          effectivePromptGroups.map(group => (
            <PromptGroupRow
              key={group.id}
              promptGroup={group}
              onCardClick={handleCardClick}
              isDark={isDark}
            />
          ))}
        {!hasPrompts && (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
            }}
          >
            <Typography variant="body2">
              {t('welcomeScreen.emptyPromptHint')}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};
