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
import { useTheme } from '@mui/material/styles';
import { useBranding } from '../../hooks';
import { useTranslation } from '../../hooks/useTranslation';
import { sanitizeBrandingUrl } from '../../theme/branding';
import type {
  PromptGroup,
  PromptCard,
  Workflow,
  QuickAction,
} from '../../types';
import { PromptGroupRow } from './PromptGroupRow';
import { AgentGallery } from './AgentGallery';
import type { AgentWithCard } from './agentUtils';
import { OnboardingBanner } from './OnboardingBanner';
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
}

const EMPTY_STATE_SX = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'text.secondary',
} as const;

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
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { branding } = useBranding();
  const { t } = useTranslation();
  const [logoError, setLogoError] = useState(false);
  const [drawerAgent, setDrawerAgent] = useState<AgentWithCard | null>(null);

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
      onQuickActionSelect({
        title: card.title,
        description: card.description,
        prompt: card.prompt,
        icon: card.icon,
      });
    },
    [onQuickActionSelect],
  );

  const titleSx = useMemo(
    () => getTitleSx(branding.primaryColor),
    [branding.primaryColor],
  );

  return (
    <Box sx={getContainerSx(theme)}>
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

      {showAgentGallery && onAgentSelect && (
        <>
          <OnboardingBanner
            appName={branding.appName}
            primaryColor={branding.primaryColor}
          />
          <AgentGallery
            onAgentSelect={onAgentSelect}
            onAgentInfo={setDrawerAgent}
          />
          <AgentDetailDrawer
            agent={drawerAgent}
            open={!!drawerAgent}
            onClose={() => setDrawerAgent(null)}
            onStartConversation={onAgentSelect}
          />
        </>
      )}

      <Box sx={getPromptGroupsContainerSx(isDark, theme)}>
        {effectivePromptGroups.length > 0 ? (
          effectivePromptGroups.map(group => (
            <PromptGroupRow
              key={group.id}
              promptGroup={group}
              onCardClick={handleCardClick}
              isDark={isDark}
            />
          ))
        ) : (
          <Box sx={EMPTY_STATE_SX}>
            <Typography variant="body2">
              {t('welcomeScreen.emptyPromptHint')}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};
