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
import SmartToyIcon from '@mui/icons-material/SmartToy';
import BuildIcon from '@mui/icons-material/Build';
import ScienceIcon from '@mui/icons-material/Science';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { useTheme } from '@mui/material/styles';
import { QuickActions } from './QuickActions';
import { typeScale, iconSize } from '../../theme/tokens';
import type { AdminPanel } from '../../hooks';

interface DeveloperHomeProps {
  onNavigate: (panel: AdminPanel) => void;
}

/**
 * Home dashboard tailored for the Agent Developer persona.
 * Focused on building: agent catalog, tools, sandbox, workflow builder.
 */
export function DeveloperHome({ onNavigate }: DeveloperHomeProps) {
  const theme = useTheme();

  const actions = useCallback(() => [
    {
      id: 'agents',
      label: 'Agent Catalog',
      description: 'Deploy, manage, and chat with AI agents',
      icon: <SmartToyIcon sx={{ fontSize: iconSize.xl }} />,
      onClick: () => onNavigate('kagenti-agents' as AdminPanel),
    },
    {
      id: 'tools',
      label: 'Tool Registry',
      description: 'Register and configure MCP tool servers',
      icon: <BuildIcon sx={{ fontSize: iconSize.xl }} />,
      onClick: () => onNavigate('kagenti-tools' as AdminPanel),
    },
    {
      id: 'sandbox',
      label: 'Sandbox',
      description: 'Test agents in an interactive session',
      icon: <ScienceIcon sx={{ fontSize: iconSize.xl }} />,
      onClick: () => onNavigate('kagenti-sandbox' as AdminPanel),
    },
    {
      id: 'builds',
      label: 'Build Pipelines',
      description: 'Trigger and monitor container image builds',
      icon: <AccountTreeOutlinedIcon sx={{ fontSize: iconSize.xl }} />,
      onClick: () => onNavigate('kagenti-builds' as AdminPanel),
    },
    {
      id: 'docs',
      label: 'Documentation',
      description: 'Guides, API reference, and how-to articles',
      icon: <MenuBookIcon sx={{ fontSize: iconSize.xl }} />,
      onClick: () => onNavigate('kagenti-docs' as AdminPanel),
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
          Agent Developer
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: theme.palette.text.secondary }}
        >
          Build, test, and deploy AI agents and tools.
        </Typography>
      </Box>

      <QuickActions actions={actions()} title="Get Started" />
    </Box>
  );
}
