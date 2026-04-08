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
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BuildCircleOutlinedIcon from '@mui/icons-material/BuildCircleOutlined';
import CodeIcon from '@mui/icons-material/Code';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import LaptopMacOutlinedIcon from '@mui/icons-material/LaptopMacOutlined';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import { alpha, useTheme } from '@mui/material/styles';
import type { DeploymentMethod } from './agentWizardTypes';
import { AgentTemplateBrowser } from './AgentTemplateBrowser';
import { DevSpacesLaunchForm } from './DevSpacesLaunchForm';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AgentCreateIntentDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectBuildDeploy: (method: DeploymentMethod) => void;
}

type View = 'intent' | 'develop-sub' | 'templates' | 'devspaces';

interface IntentCard {
  id: string;
  icon: React.ReactElement;
  title: string;
  subtitle: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Card definitions
// ---------------------------------------------------------------------------

const INTENT_CARDS: IntentCard[] = [
  {
    id: 'develop',
    icon: <CodeIcon />,
    title: 'Develop',
    subtitle: 'Start building your agent',
    description:
      'Scaffold from a template or launch a cloud workspace to develop your agent with full tooling.',
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

const DEVELOP_SUB_CARDS: IntentCard[] = [
  {
    id: 'templates',
    icon: <DescriptionOutlinedIcon />,
    title: 'From Template',
    subtitle: 'Use a software template',
    description:
      'Scaffold a new agent project from a pre-configured software template with best-practice structure and dependencies.',
  },
  {
    id: 'devspaces',
    icon: <LaptopMacOutlinedIcon />,
    title: 'Agent DevSpace',
    subtitle: 'Cloud IDE workspace',
    description:
      'Launch a ready-to-code cloud IDE with your agent\u2019s repository, tools, and runtime pre-configured.',
  },
];

// ---------------------------------------------------------------------------
// Shared card renderer
// ---------------------------------------------------------------------------

function CardGrid({
  cards,
  onCardClick,
  columns,
}: {
  cards: IntentCard[];
  onCardClick: (id: string) => void;
  columns: number;
}) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 2,
      }}
    >
      {cards.map(card => (
        <ButtonBase
          key={card.id}
          onClick={() => onCardClick(card.id)}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            textAlign: 'left',
            p: 2.5,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper,
            transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.1s',
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
  );
}

// ---------------------------------------------------------------------------
// Dialog header (reused across views)
// ---------------------------------------------------------------------------

function DialogHeader({
  titleId,
  title,
  subtitle,
  onBack,
}: {
  titleId: string;
  title: string;
  subtitle: string;
  onBack?: () => void;
}) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        px: 3,
        pt: 3,
        pb: 2,
        background: alpha(theme.palette.primary.main, 0.03),
        borderBottom: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1,
      }}
    >
      {onBack && (
        <IconButton
          onClick={onBack}
          size="small"
          sx={{ mt: 0.25 }}
          aria-label="Back"
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
      )}
      <Box>
        <Typography
          id={titleId}
          variant="h6"
          sx={{ fontWeight: 700, mb: 0.5 }}
        >
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AgentCreateIntentDialog({
  open,
  onClose,
  onSelectBuildDeploy,
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

  const handleIntentCardClick = useCallback(
    (cardId: string) => {
      if (cardId === 'develop') {
        setView('develop-sub');
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

  const handleDevelopSubClick = useCallback((cardId: string) => {
    if (cardId === 'templates') {
      setView('templates');
    } else if (cardId === 'devspaces') {
      setView('devspaces');
    }
  }, []);

  const handleOpenInDevSpace = useCallback((gitRepoUrl: string) => {
    setDevSpacesGitRepo(gitRepoUrl);
    setView('devspaces');
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
      {/* --- Top-level intent selection --- */}
      {view === 'intent' && (
        <>
          <DialogHeader
            titleId={titleId}
            title="Create Agent"
            subtitle="Choose how you want to get started with your new agent."
          />
          <DialogContent sx={{ px: 3, pt: 3, pb: 3 }}>
            <CardGrid
              cards={INTENT_CARDS}
              onCardClick={handleIntentCardClick}
              columns={3}
            />
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

      {/* --- Develop sub-options --- */}
      {view === 'develop-sub' && (
        <>
          <DialogHeader
            titleId={titleId}
            title="Develop"
            subtitle="Choose your development path."
            onBack={() => setView('intent')}
          />
          <DialogContent sx={{ px: 3, pt: 3, pb: 3 }}>
            <CardGrid
              cards={DEVELOP_SUB_CARDS}
              onCardClick={handleDevelopSubClick}
              columns={2}
            />
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
            onBack={() => setView('develop-sub')}
            onOpenInDevSpace={handleOpenInDevSpace}
          />
        </DialogContent>
      )}

      {/* --- DevSpaces launch form --- */}
      {view === 'devspaces' && (
        <DialogContent sx={{ px: 3, pt: 3, pb: 3 }}>
          <DevSpacesLaunchForm
            onBack={() => {
              setDevSpacesGitRepo(undefined);
              setView('develop-sub');
            }}
            initialGitRepo={devSpacesGitRepo}
          />
        </DialogContent>
      )}
    </Dialog>
  );
}
