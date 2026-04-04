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

import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import Divider from '@mui/material/Divider';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TuneIcon from '@mui/icons-material/Tune';
import PaletteIcon from '@mui/icons-material/Palette';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import BuildIcon from '@mui/icons-material/Build';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ScienceIcon from '@mui/icons-material/Science';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { useTheme, alpha } from '@mui/material/styles';
import type { AdminPanel } from '../../hooks';
import { useTranslation } from '../../hooks/useTranslation';
import { useStatus } from '../../hooks';
import { NamespacePicker } from '../AdminPanels/KagentiPanels';

export interface CommandCenterHeaderProps {
  adminPanel: AdminPanel;
  onAdminPanelChange: (panel: AdminPanel) => void;
  onBackToChat: () => void;
  kagentiNamespace?: string;
  onKagentiNamespaceChange?: (ns: string) => void;
}

/**
 * Command center header with title, back button, and admin sub-tabs.
 */
export function CommandCenterHeader({
  adminPanel,
  onAdminPanelChange,
  onBackToChat,
  kagentiNamespace,
  onKagentiNamespaceChange,
}: CommandCenterHeaderProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { status } = useStatus();
  const isKagenti = status?.providerId === 'kagenti';

  const panelLabels = useMemo<Record<AdminPanel, string>>(
    () => ({
      platform: t('commandCenter.platform'),
      agents: t('commandCenter.agents'),
      branding: t('commandCenter.branding'),
      'kagenti-agents': t('commandCenter.kagentiAgents', { defaultValue: 'Agents' }),
      'kagenti-tools': t('commandCenter.kagentiTools', { defaultValue: 'Tools' }),
      'kagenti-builds': t('commandCenter.kagentiBuilds', { defaultValue: 'Builds' }),
      'kagenti-sandbox': t('commandCenter.kagentiSandbox', { defaultValue: 'Sandbox' }),
      'kagenti-admin': t('commandCenter.kagentiAdmin', { defaultValue: 'Admin' }),
      'kagenti-dashboards': t('commandCenter.kagentiDashboards', { defaultValue: 'Dashboards' }),
    }),
    [t],
  );

  const isDark = theme.palette.mode === 'dark';

  return (
    <>
      {/* Command Center Header — visually mirrors Backstage Header weight */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          px: 3,
          py: 2,
          background: isDark
            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.35)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`
            : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${theme.palette.background.paper} 100%)`,
          borderBottom: `1px solid ${theme.palette.divider}`,
          flexShrink: 0,
          minHeight: 64,
        }}
      >
        <AdminPanelSettingsIcon
          sx={{
            fontSize: 28,
            color: theme.palette.primary.main,
          }}
        />
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: '1.125rem',
              color: theme.palette.text.primary,
              lineHeight: 1.2,
            }}
          >
            {t('commandCenter.title')}
          </Typography>
          <Breadcrumbs
            separator={<NavigateNextIcon sx={{ fontSize: 14 }} />}
            aria-label="Admin navigation"
            sx={{
              mt: 0.25,
              '& .MuiBreadcrumbs-separator': { mx: 0.5 },
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.75rem',
                color: theme.palette.text.secondary,
                fontWeight: 500,
              }}
            >
              {t('commandCenter.title')}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.75rem',
                color: theme.palette.text.primary,
                fontWeight: 600,
              }}
            >
              {panelLabels[adminPanel]}
            </Typography>
          </Breadcrumbs>
        </Box>
        {isKagenti && onKagentiNamespaceChange && (
          <Box sx={{ width: 200 }}>
            <NamespacePicker
              value={kagentiNamespace || ''}
              onChange={onKagentiNamespaceChange}
            />
          </Box>
        )}
        <Button
          size="small"
          variant="outlined"
          startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
          onClick={onBackToChat}
          sx={{
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.8125rem',
            borderColor: alpha(theme.palette.divider, 0.6),
            color: theme.palette.text.secondary,
            '&:hover': {
              color: theme.palette.text.primary,
              borderColor: theme.palette.text.secondary,
              backgroundColor: alpha(theme.palette.action.hover, 0.8),
            },
          }}
        >
          {t('commandCenter.backToChat')}
        </Button>
      </Box>

      {/* Command Center Sub-tabs */}
      <Box
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: theme.palette.background.paper,
          flexShrink: 0,
        }}
      >
        <Tabs
          value={adminPanel}
          onChange={(_, v) => onAdminPanelChange(v as AdminPanel)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            minHeight: 44,
            '& .MuiTab-root': {
              minHeight: 44,
              textTransform: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              minWidth: 'auto',
              px: 2.5,
              mr: 0.5,
            },
          }}
        >
          <Tab
            icon={<TuneIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={t('commandCenter.platform')}
            value="platform"
          />
          <Tab
            icon={<AutoFixHighIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={t('commandCenter.agents')}
            value="agents"
          />
          <Tab
            icon={<PaletteIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={t('commandCenter.branding')}
            value="branding"
          />
          {isKagenti && <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />}
          {isKagenti && (
            <Tab
              icon={<SmartToyIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label={panelLabels['kagenti-agents']}
              value="kagenti-agents"
            />
          )}
          {isKagenti && (
            <Tab
              icon={<BuildIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label={panelLabels['kagenti-tools']}
              value="kagenti-tools"
            />
          )}
          {isKagenti && (
            <Tab
              icon={<AccountTreeIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label={panelLabels['kagenti-builds']}
              value="kagenti-builds"
            />
          )}
          {isKagenti && (
            <Tab
              icon={<ScienceIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label={panelLabels['kagenti-sandbox']}
              value="kagenti-sandbox"
            />
          )}
          {isKagenti && (
            <Tab
              icon={<AdminPanelSettingsOutlinedIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label={panelLabels['kagenti-admin']}
              value="kagenti-admin"
            />
          )}
          {isKagenti && (
            <Tab
              icon={<DashboardIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label={panelLabels['kagenti-dashboards']}
              value="kagenti-dashboards"
            />
          )}
        </Tabs>
      </Box>
    </>
  );
}
