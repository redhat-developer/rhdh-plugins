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

import { useCallback, useId, useState } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import ExtensionOutlinedIcon from '@mui/icons-material/ExtensionOutlined';
import DashboardCustomizeOutlinedIcon from '@mui/icons-material/DashboardCustomizeOutlined';
import CodeIcon from '@mui/icons-material/Code';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { alpha, useTheme } from '@mui/material/styles';
import type { DeploymentMethod } from './agentWizardTypes';
import { AgentTemplateBrowser } from './AgentTemplateBrowser';
import { DevSpacesLaunchForm } from './DevSpacesLaunchForm';
import { DialogHeader } from './IntentDialogParts';
import {
  glassSurface,
  borderRadius,
  transitions,
  typeScale,
  animations,
  staggerDelay,
  reducedMotion,
} from '../../../theme/tokens';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AgentCreateIntentDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSelectDeploy: (method?: DeploymentMethod) => void;
  readonly onSelectConfigure?: () => void;
  readonly onSelectSkills?: () => void;
}

type View = 'intent' | 'create-sub' | 'templates' | 'devspaces';

interface SubOption {
  readonly id: string;
  readonly icon: React.ReactElement;
  readonly title: string;
  readonly subtitle: string;
  readonly color: string;
}

// ---------------------------------------------------------------------------
// AccentCard — reusable clickable card with an accent color strip
// ---------------------------------------------------------------------------

function AccentCard({
  icon,
  title,
  subtitle,
  accentColor,
  gradient,
  onClick,
  tourId,
  animIndex,
}: {
  readonly icon: React.ReactElement;
  readonly title: string;
  readonly subtitle: string;
  readonly accentColor: string;
  readonly gradient?: boolean;
  readonly onClick: () => void;
  readonly tourId?: string;
  readonly animIndex: number;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <ButtonBase
      data-tour={tourId}
      onClick={onClick}
      sx={{
        ...glassSurface(theme, 6, isDark ? 0.5 : 0.75),
        ...animations.fadeSlideIn,
        animationDelay: staggerDelay(animIndex, 60),
        animationFillMode: 'both',
        '@media (prefers-reduced-motion: reduce)': reducedMotion,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        textAlign: 'left',
        p: 3,
        borderRadius: borderRadius.lg,
        borderTop: `3px solid ${accentColor}`,
        transition: transitions.normal,
        ...(gradient && {
          background: `linear-gradient(135deg, ${alpha(accentColor, isDark ? 0.12 : 0.06)} 0%, ${alpha(theme.palette.background.paper, isDark ? 0.85 : 1)} 60%)`,
        }),
        '&:hover': {
          borderColor: alpha(accentColor, 0.7),
          boxShadow: `0 0 0 1px ${alpha(accentColor, 0.2)}, 0 8px 24px ${alpha(accentColor, isDark ? 0.15 : 0.08)}`,
          transform: 'translateY(-3px) scale(1.01)',
        },
        '&:focus-visible': {
          outline: `2px solid ${accentColor}`,
          outlineOffset: -2,
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 48,
          height: 48,
          borderRadius: borderRadius.md,
          bgcolor: alpha(accentColor, isDark ? 0.15 : 0.08),
          color: accentColor,
          mb: 2,
          '& .MuiSvgIcon-root': { fontSize: 26 },
        }}
      >
        {icon}
      </Box>
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 700,
          mb: 0.5,
          lineHeight: 1.3,
          fontSize: typeScale.sectionTitle.fontSize,
        }}
      >
        {title}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ lineHeight: 1.5, fontSize: typeScale.bodySmall.fontSize }}
      >
        {subtitle}
      </Typography>
    </ButtonBase>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AgentCreateIntentDialog({
  open,
  onClose,
  onSelectDeploy,
  onSelectConfigure,
  onSelectSkills,
}: AgentCreateIntentDialogProps) {
  const theme = useTheme();
  const titleId = useId();
  const [view, setView] = useState<View>('intent');
  const [devSpacesGitRepo, setDevSpacesGitRepo] = useState<string | undefined>(
    undefined,
  );

  const handleClose = useCallback(() => {
    setView('intent');
    setDevSpacesGitRepo(undefined);
    onClose();
  }, [onClose]);

  const handleOpenInDevSpace = useCallback((gitRepoUrl: string) => {
    setDevSpacesGitRepo(gitRepoUrl);
    setView('devspaces');
  }, []);

  const SUB_OPTIONS: readonly SubOption[] = [
    {
      id: 'skills',
      icon: <ExtensionOutlinedIcon />,
      title: 'Create using Skills',
      subtitle: 'Compose an agent from reusable skills',
      color: theme.palette.success.main,
    },
    {
      id: 'configure',
      icon: <DashboardCustomizeOutlinedIcon />,
      title: 'Create with Visual Canvas',
      subtitle: 'Design with the no-code workflow builder',
      color: theme.palette.info.dark,
    },
    {
      id: 'code',
      icon: <CodeIcon />,
      title: 'Code Your Agent',
      subtitle: 'Scaffold from a template or cloud workspace',
      color: theme.palette.primary.dark,
    },
    {
      id: 'template',
      icon: <DescriptionOutlinedIcon />,
      title: 'Create from Template',
      subtitle: 'Start from a pre-configured software template',
      color: theme.palette.warning.main,
    },
  ];

  const handleSubOptionClick = useCallback(
    (id: string) => {
      if (id === 'skills') {
        handleClose();
        onSelectSkills?.();
      } else if (id === 'configure') {
        handleClose();
        onSelectConfigure?.();
      } else if (id === 'code') {
        setView('devspaces');
      } else if (id === 'template') {
        setView('templates');
      }
    },
    [handleClose, onSelectSkills, onSelectConfigure],
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      aria-labelledby={titleId}
      PaperProps={
        {
          'data-tour': 'intent-dialog',
          sx: { borderRadius: 3, overflow: 'hidden' },
        } as Record<string, unknown>
      }
    >
      {/* --- Top-level intent selection --- */}
      {view === 'intent' && (
        <>
          <DialogHeader
            titleId={titleId}
            title="New Agent"
            subtitle="Choose how you want to get started with your new agent."
          />
          <DialogContent sx={{ px: 3, pt: 3, pb: 3 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 2.5,
              }}
            >
              <AccentCard
                tourId="intent-create"
                icon={<AddCircleOutlineIcon />}
                title="Create Agent"
                subtitle="Build a new agent from scratch using skills, visual canvas, code, or templates."
                accentColor={theme.palette.primary.main}
                gradient
                onClick={() => setView('create-sub')}
                animIndex={0}
              />
              <AccentCard
                tourId="intent-import"
                icon={<CloudUploadOutlinedIcon />}
                title="BYO Agent"
                subtitle="Import an existing agent from a container image or Git repository."
                accentColor={theme.palette.warning.dark}
                onClick={() => onSelectDeploy()}
                animIndex={1}
              />
            </Box>
          </DialogContent>
          <DialogActions
            sx={{
              px: 3,
              pb: 2,
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Button onClick={handleClose} sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
          </DialogActions>
        </>
      )}

      {/* --- Create sub-options (2×2 grid) --- */}
      {view === 'create-sub' && (
        <>
          <DialogHeader
            titleId={titleId}
            title="Create Agent"
            subtitle="Pick a creation method."
            onBack={() => setView('intent')}
          />
          <DialogContent sx={{ px: 3, pt: 3, pb: 3 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 2.5,
              }}
            >
              {SUB_OPTIONS.map((opt, idx) => (
                <AccentCard
                  key={opt.id}
                  icon={opt.icon}
                  title={opt.title}
                  subtitle={opt.subtitle}
                  accentColor={opt.color}
                  onClick={() => handleSubOptionClick(opt.id)}
                  animIndex={idx}
                />
              ))}
            </Box>
          </DialogContent>
          <DialogActions
            sx={{
              px: 3,
              pb: 2,
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Button onClick={handleClose} sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
          </DialogActions>
        </>
      )}

      {/* --- Template browser --- */}
      {view === 'templates' && (
        <DialogContent sx={{ px: 3, pt: 3, pb: 3 }}>
          <AgentTemplateBrowser
            onBack={() => setView('create-sub')}
            onOpenInDevSpace={handleOpenInDevSpace}
            specType="agent"
          />
        </DialogContent>
      )}

      {/* --- DevSpaces launch form --- */}
      {view === 'devspaces' && (
        <DialogContent sx={{ px: 3, pt: 3, pb: 3 }}>
          <DevSpacesLaunchForm
            onBack={() => {
              setDevSpacesGitRepo(undefined);
              setView('create-sub');
            }}
            initialGitRepo={devSpacesGitRepo}
          />
        </DialogContent>
      )}
    </Dialog>
  );
}
