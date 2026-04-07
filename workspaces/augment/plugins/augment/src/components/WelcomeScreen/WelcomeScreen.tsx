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
import ExploreIcon from '@mui/icons-material/Explore';
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
          gap: 3,
        }}
      >
        {/* Agent identity */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1.5,
            maxWidth: 560,
            textAlign: 'center',
          }}
        >
          {selectedAgent.avatarUrl ? (
            <Box
              component="img"
              src={selectedAgent.avatarUrl}
              alt={selectedAgent.name}
              sx={{
                width: 64,
                height: 64,
                borderRadius: 3,
                objectFit: 'cover',
              }}
            />
          ) : (
            <Box
              sx={{
                width: 64,
                height: 64,
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

          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {selectedAgent.name}
          </Typography>

          {cleanDesc && (
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                lineHeight: 1.6,
                maxWidth: 480,
              }}
            >
              {cleanDesc}
            </Typography>
          )}
        </Box>

        {/* Conversation starters as large tiles */}
        {selectedAgent.starters.length > 0 && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm:
                  selectedAgent.starters.length === 1
                    ? '1fr'
                    : 'repeat(2, 1fr)',
              },
              gap: 1.5,
              maxWidth: 560,
              width: '100%',
            }}
          >
            {selectedAgent.starters.map((starter: string, idx: number) => (
              <Card
                key={idx}
                variant="outlined"
                sx={{
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

        {/* Change agent */}
        {onChangeAgent && (
          <Button
            size="small"
            startIcon={<SwapHorizIcon sx={{ fontSize: 16 }} />}
            onClick={onChangeAgent}
            sx={{
              textTransform: 'none',
              fontSize: '0.8rem',
              color: theme.palette.text.secondary,
              '&:hover': { color: theme.palette.primary.main },
            }}
          >
            Change agent
          </Button>
        )}
      </Box>
    );
  }

  // ── State 1: No agent selected ────────────────────────────────────────
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
        <Typography variant="h5" sx={titleSx}>
          {branding.appName}
        </Typography>
        <Typography variant="body2" sx={TAGLINE_SX}>
          {branding.tagline}
        </Typography>
      </Box>

      {/* Featured Agents */}
      {hasFeatured && (
        <FeaturedAgents
          agents={allAgents}
          chatAgentConfigs={chatAgentConfigs}
          onAgentSelect={onAgentSelect!}
          onStarterClick={handleStarterClick}
        />
      )}

      {/* Prompt Groups */}
      <Box sx={getPromptGroupsContainerSx(isDark, theme)}>
        {effectivePromptGroups.length > 0 &&
          effectivePromptGroups.map(group => (
            <PromptGroupRow
              key={group.id}
              promptGroup={group}
              onCardClick={handleCardClick}
              isDark={isDark}
            />
          ))}
        {effectivePromptGroups.length === 0 && !hasFeatured && (
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

      {/* Browse All Agents */}
      {hasFeatured && onBrowseCatalog && (
        <Box sx={{ textAlign: 'center', py: 1, pb: 2 }}>
          <Button
            size="small"
            startIcon={<ExploreIcon sx={{ fontSize: 16 }} />}
            onClick={onBrowseCatalog}
            sx={{
              textTransform: 'none',
              fontSize: '0.8rem',
              color: theme.palette.text.secondary,
              '&:hover': { color: theme.palette.primary.main },
            }}
          >
            Browse all agents
          </Button>
        </Box>
      )}
    </Box>
  );
};
