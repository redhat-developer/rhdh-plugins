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
import { useTheme, alpha } from '@mui/material/styles';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { useApi } from '@backstage/core-plugin-api';
import { augmentApiRef } from '../../api';
import { useBranding } from '../../hooks';
import { useTranslation } from '../../hooks/useTranslation';
import { sanitizeBrandingUrl } from '../../theme/branding';
import { useAgentGalleryData } from './useAgentGalleryData';
import type {
  PromptGroup,
  PromptCard,
  Workflow,
  QuickAction,
  ChatAgentConfig,
} from '../../types';
import { PromptGroupRow } from './PromptGroupRow';
import { FeaturedAgents } from './FeaturedAgents';
import { getAgentAvatarColor } from './agentUtils';
import { buildEffectivePromptGroups } from './buildEffectivePromptGroups';
import { stripMarkdown } from './stripMarkdown';
import {
  getContainerSx,
  getHeroSx,
  getTitleSx,
  getPromptGroupsContainerSx,
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
  readonly onBrowseCatalog?: () => void;
}

const TAGLINE_SX = {
  color: 'text.secondary',
  fontSize: '0.8rem',
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
  onBrowseCatalog,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const api = useApi(augmentApiRef);
  const { branding } = useBranding();
  const { t } = useTranslation();
  const [logoError, setLogoError] = useState(false);
  const { agents: allAgents } = useAgentGalleryData(api);

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

  const handleStarterClick = useCallback(
    (agentId: string, prompt: string) => {
      if (onAgentSelect) {
        const name = agentId.includes('/')
          ? agentId.split('/').pop()!
          : agentId;
        onAgentSelect(agentId, name);
      }
      onQuickActionSelect({
        title: prompt,
        prompt,
      });
    },
    [onAgentSelect, onQuickActionSelect],
  );

  const titleSx = useMemo(
    () => getTitleSx(branding.primaryColor),
    [branding.primaryColor],
  );

  const hasFeatured = showAgentGallery && onAgentSelect;

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
          {/* Avatar with glow ring */}
          <Box
            sx={{
              position: 'relative',
              width: 88,
              height: 88,
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: -4,
                borderRadius: 4,
                border: `2px solid ${alpha(avatarColor, isDark ? 0.3 : 0.2)}`,
                animation: 'pulseRing 2s ease-in-out infinite',
                '@keyframes pulseRing': {
                  '0%, 100%': { opacity: 0.6, transform: 'scale(1)' },
                  '50%': { opacity: 1, transform: 'scale(1.03)' },
                },
              },
            }}
          >
            {selectedAgent.avatarUrl ? (
              <Box
                component="img"
                src={selectedAgent.avatarUrl}
                alt={selectedAgent.name}
                sx={{
                  width: 88,
                  height: 88,
                  borderRadius: 3.5,
                  objectFit: 'cover',
                }}
              />
            ) : (
              <Box
                sx={{
                  width: 88,
                  height: 88,
                  borderRadius: 3.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '2rem',
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
              startIcon={<SwapHorizIcon sx={{ fontSize: 16 }} />}
              onClick={onChangeAgent}
              sx={{
                textTransform: 'none',
                fontSize: '0.8rem',
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
              maxWidth: 640,
              width: '100%',
              zIndex: 1,
            }}
          >
            {selectedAgent.starters.map((starter: string, idx: number) => (
              <Card
                key={idx}
                variant="outlined"
                sx={{
                  width: 240,
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
                  sx={{ px: 2.5, py: 2 }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.85rem',
                      color: theme.palette.text.primary,
                      lineHeight: 1.5,
                    }}
                  >
                    {starter}
                  </Typography>
                </CardActionArea>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    );
  }

  // ── State 1: No agent selected ────────────────────────────────────────
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
              fontSize: '0.7rem',
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

        {/* Agent strip — primary CTA, directly below tagline */}
        {hasFeatured && (
          <Box sx={{ mt: 3 }}>
            <FeaturedAgents
              agents={allAgents}
              chatAgentConfigs={chatAgentConfigs}
              onAgentSelect={onAgentSelect!}
              onStarterClick={handleStarterClick}
              onBrowseCatalog={onBrowseCatalog}
            />
          </Box>
        )}
      </Box>

      {/* Divider between agents and prompts */}
      {hasFeatured && hasPrompts && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            px: { xs: 3, sm: 4, md: 6 },
            py: 1,
            maxWidth: 960,
            width: '100%',
            mx: 'auto',
            boxSizing: 'border-box',
          }}
        >
          <Box
            sx={{
              flex: 1,
              height: '1px',
              bgcolor: alpha(theme.palette.divider, 0.4),
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: 'text.disabled',
              fontSize: '0.7rem',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              whiteSpace: 'nowrap',
            }}
          >
            or start with a prompt
          </Typography>
          <Box
            sx={{
              flex: 1,
              height: '1px',
              bgcolor: alpha(theme.palette.divider, 0.4),
            }}
          />
        </Box>
      )}

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
        {!hasPrompts && !hasFeatured && (
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
