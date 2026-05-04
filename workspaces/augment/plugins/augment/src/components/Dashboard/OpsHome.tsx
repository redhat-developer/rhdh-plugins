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

import { useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import StorefrontIcon from '@mui/icons-material/Storefront';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import TuneIcon from '@mui/icons-material/Tune';
import PaletteIcon from '@mui/icons-material/Palette';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import { useTheme } from '@mui/material/styles';
import { QuickActions } from './QuickActions';
import { typeScale, iconSize } from '../../theme/tokens';
import type { AdminPanel } from '../../hooks';

interface OpsHomeProps {
  onNavigate: (panel: AdminPanel) => void;
}

/**
 * Home dashboard tailored for the Agent Ops persona.
 * Focused on operations: registry, observability, platform config, admin.
 */
export function OpsHome({ onNavigate }: OpsHomeProps) {
  const theme = useTheme();

  const actions = useCallback(() => [
    {
      id: 'registry',
      label: 'Agent Registry',
      description: 'Agent lifecycle — promote from draft to deployment',
      icon: <StorefrontIcon sx={{ fontSize: iconSize.xl }} />,
      onClick: () => onNavigate('kagenti-registry' as AdminPanel),
    },
    {
      id: 'observability',
      label: 'Observability',
      description: 'Dashboards for traces, metrics, and monitoring',
      icon: <MonitorHeartIcon sx={{ fontSize: iconSize.xl }} />,
      onClick: () => onNavigate('kagenti-dashboards' as AdminPanel),
    },
    {
      id: 'platform',
      label: 'Platform Config',
      description: 'Model, tools, RAG, and safety settings',
      icon: <TuneIcon sx={{ fontSize: iconSize.xl }} />,
      onClick: () => onNavigate('kagenti-platform' as AdminPanel),
    },
    {
      id: 'branding',
      label: 'Branding',
      description: 'Appearance, prompt groups, and chat experience',
      icon: <PaletteIcon sx={{ fontSize: iconSize.xl }} />,
      onClick: () => onNavigate('kagenti-branding' as AdminPanel),
    },
    {
      id: 'admin',
      label: 'Administration',
      description: 'Users, namespaces, and system configuration',
      icon: <AdminPanelSettingsOutlinedIcon sx={{ fontSize: iconSize.xl }} />,
      onClick: () => onNavigate('kagenti-admin' as AdminPanel),
    },
  ], [onNavigate]);

  return (
    <Box sx={{ maxWidth: 900 }}>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            fontSize: typeScale.pageTitle.fontSize,
            color: theme.palette.text.primary,
            mb: 0.5,
          }}
        >
          Operations
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: theme.palette.text.secondary }}
        >
          Monitor, configure, and manage the agent platform.
        </Typography>
      </Box>

      <QuickActions actions={actions()} title="Operations" />
    </Box>
  );
}
