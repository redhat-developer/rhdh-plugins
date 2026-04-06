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
import Drawer from '@mui/material/Drawer';
import { useTheme } from '@mui/material/styles';
import ExploreIcon from '@mui/icons-material/Explore';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
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
import { AgentGallery } from './AgentGallery';
import { FeaturedAgents } from './FeaturedAgents';
import type { AgentWithCard } from './agentUtils';
import { AgentDetailDrawer } from './AgentDetailDrawer';
import { buildEffectivePromptGroups } from './buildEffectivePromptGroups';
import {
  getContainerSx,
  getHeroSx,
  getTitleSx,
  getPromptGroupsContainerSx,
} from './styles';

interface WelcomeScreenProps {
  readonly workflows: readonly Workflow[];
  readonly quickActions: readonly QuickAction[];
  readonly onQuickActionSelect: (action: QuickAction) => void;
  readonly promptGroups?: readonly PromptGroup[];
  readonly onAgentSelect?: (agentId: string, agentName: string) => void;
  readonly showAgentGallery?: boolean;
  readonly chatAgentConfigs?: ChatAgentConfig[];
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
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const api = useApi(augmentApiRef);
  const { branding } = useBranding();
  const { t } = useTranslation();
  const [logoError, setLogoError] = useState(false);
  const [drawerAgent, setDrawerAgent] = useState<AgentWithCard | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
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

      {/* Featured Agents (replaces the full gallery on the welcome screen) */}
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

        {/* "Explore all agents" link */}
        {hasFeatured && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Button
              size="small"
              startIcon={<ExploreIcon sx={{ fontSize: 16 }} />}
              onClick={() => setGalleryOpen(true)}
              sx={{
                textTransform: 'none',
                fontSize: '0.8rem',
                color: theme.palette.text.secondary,
                '&:hover': { color: theme.palette.primary.main },
              }}
            >
              Explore all agents
            </Button>
          </Box>
        )}
      </Box>

      {/* Full Agent Gallery Drawer */}
      {hasFeatured && (
        <>
          <Drawer
            anchor="right"
            open={galleryOpen}
            onClose={() => setGalleryOpen(false)}
            PaperProps={{
              sx: {
                width: { xs: '100%', sm: 520 },
                bgcolor: theme.palette.background.default,
              },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 2,
                py: 1.5,
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                All Agents
              </Typography>
              <IconButton size="small" onClick={() => setGalleryOpen(false)}>
                <CloseIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
            <Box sx={{ overflow: 'auto', flex: 1, py: 1 }}>
              <AgentGallery
                onAgentSelect={(id, name) => {
                  setGalleryOpen(false);
                  onAgentSelect!(id, name);
                }}
                onAgentInfo={setDrawerAgent}
              />
            </Box>
          </Drawer>
          <AgentDetailDrawer
            agent={drawerAgent}
            open={!!drawerAgent}
            onClose={() => setDrawerAgent(null)}
            onStartConversation={onAgentSelect}
          />
        </>
      )}
    </Box>
  );
};
