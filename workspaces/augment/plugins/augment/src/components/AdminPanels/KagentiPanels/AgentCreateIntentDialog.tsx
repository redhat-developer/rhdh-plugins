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
import CodeIcon from '@mui/icons-material/Code';
import BuildCircleOutlinedIcon from '@mui/icons-material/BuildCircleOutlined';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import { alpha, useTheme } from '@mui/material/styles';
import type { DeploymentMethod } from './agentWizardTypes';
import { AgentTemplateBrowser } from './AgentTemplateBrowser';

export interface AgentCreateIntentDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectBuildDeploy: (method: DeploymentMethod) => void;
}

type View = 'intent' | 'templates';

interface IntentCard {
  id: 'develop' | 'build' | 'deploy';
  icon: React.ReactElement;
  title: string;
  subtitle: string;
  description: string;
}

const INTENT_CARDS: IntentCard[] = [
  {
    id: 'develop',
    icon: <CodeIcon />,
    title: 'Develop',
    subtitle: 'Start from a template',
    description:
      'Scaffold a new agent project from a software template. Choose from pre-configured templates for popular agent frameworks.',
  },
  {
    id: 'build',
    icon: <BuildCircleOutlinedIcon />,
    title: 'Build',
    subtitle: 'Build from source',
    description:
      'Build an agent from source code in a Git repository. The platform will build, containerize, and deploy it automatically.',
  },
  {
    id: 'deploy',
    icon: <RocketLaunchOutlinedIcon />,
    title: 'Deploy',
    subtitle: 'Use an existing image',
    description:
      'Deploy an agent from an existing container image. Ideal for pre-built agents or images from your CI/CD pipeline.',
  },
];

export function AgentCreateIntentDialog({
  open,
  onClose,
  onSelectBuildDeploy,
}: AgentCreateIntentDialogProps) {
  const theme = useTheme();
  const titleId = useId();
  const [view, setView] = useState<View>('intent');

  const handleClose = useCallback(() => {
    setView('intent');
    onClose();
  }, [onClose]);

  const handleCardClick = useCallback(
    (cardId: string) => {
      if (cardId === 'develop') {
        setView('templates');
      } else if (cardId === 'build') {
        setView('intent');
        onSelectBuildDeploy('source');
      } else if (cardId === 'deploy') {
        setView('intent');
        onSelectBuildDeploy('image');
      }
    },
    [onSelectBuildDeploy],
  );

  const handleBackFromTemplates = useCallback(() => {
    setView('intent');
  }, []);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      aria-labelledby={titleId}
      PaperProps={{
        sx: { borderRadius: 2, overflow: 'hidden' },
      }}
    >
      {view === 'intent' && (
        <>
          <Box
            sx={{
              px: 3,
              pt: 3,
              pb: 2,
              background: alpha(theme.palette.primary.main, 0.03),
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography
              id={titleId}
              variant="h6"
              sx={{ fontWeight: 700, mb: 0.5 }}
            >
              Create Agent
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Choose how you want to get started with your new agent.
            </Typography>
          </Box>

          <DialogContent sx={{ px: 3, pt: 3, pb: 3 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 2,
              }}
            >
              {INTENT_CARDS.map(card => (
                <ButtonBase
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    textAlign: 'left',
                    p: 2.5,
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor: theme.palette.background.paper,
                    transition:
                      'border-color 0.15s, box-shadow 0.15s, transform 0.1s',
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.25)}, 0 4px 12px ${alpha(theme.palette.common.black, 0.08)}`,
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 44,
                      height: 44,
                      borderRadius: 1.5,
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      color: theme.palette.primary.main,
                      mb: 1.5,
                      '& .MuiSvgIcon-root': { fontSize: 24 },
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, mb: 0.25, lineHeight: 1.3 }}
                  >
                    {card.title}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.primary.main,
                      fontWeight: 600,
                      mb: 1,
                    }}
                  >
                    {card.subtitle}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.45, fontSize: '0.8125rem' }}
                  >
                    {card.description}
                  </Typography>
                </ButtonBase>
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
            <Button
              onClick={handleClose}
              sx={{ textTransform: 'none' }}
            >
              Cancel
            </Button>
          </DialogActions>
        </>
      )}

      {view === 'templates' && (
        <DialogContent sx={{ px: 3, pt: 3, pb: 3 }}>
          <AgentTemplateBrowser onBack={handleBackFromTemplates} />
        </DialogContent>
      )}
    </Dialog>
  );
}
