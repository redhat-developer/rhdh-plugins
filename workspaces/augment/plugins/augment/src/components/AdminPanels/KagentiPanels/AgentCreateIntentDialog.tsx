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
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Button from '@mui/material/Button';
import CodeIcon from '@mui/icons-material/Code';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import LaptopMacOutlinedIcon from '@mui/icons-material/LaptopMacOutlined';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import TuneIcon from '@mui/icons-material/Tune';
import { useTheme } from '@mui/material/styles';
import type { DeploymentMethod } from './agentWizardTypes';
import { AgentTemplateBrowser } from './AgentTemplateBrowser';
import { DevSpacesLaunchForm } from './DevSpacesLaunchForm';
import { CardGrid, DialogHeader } from './IntentDialogParts';
import type { IntentCard } from './IntentDialogParts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AgentCreateIntentDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectDeploy: (method?: DeploymentMethod) => void;
  onSelectConfigure?: () => void;
}

type View = 'intent' | 'develop-sub' | 'templates' | 'devspaces';

// ---------------------------------------------------------------------------
// Card definitions
// ---------------------------------------------------------------------------

const INTENT_CARDS: IntentCard[] = [
  {
    id: 'develop',
    tourId: 'intent-develop',
    icon: <CodeIcon />,
    title: 'Develop',
    subtitle: 'Start building your agent',
    description:
      'Scaffold from a template or launch a cloud workspace to develop your agent.',
  },
  {
    id: 'deploy',
    tourId: 'intent-import',
    icon: <RocketLaunchOutlinedIcon />,
    title: 'Import',
    subtitle: 'Bring an existing agent',
    description:
      'Import from a container image or Git repository. The platform handles building and running it.',
  },
  {
    id: 'configure',
    tourId: 'intent-configure',
    icon: <TuneIcon />,
    title: 'Configure',
    subtitle: 'Visual agent builder',
    description:
      'Design an agent with instructions, tools, handoffs, and guardrails using the visual workflow builder.',
  },
];

const DEVELOP_SUB_CARDS: IntentCard[] = [
  {
    id: 'templates',
    tourId: 'intent-templates',
    icon: <DescriptionOutlinedIcon />,
    title: 'From Template',
    subtitle: 'Use a software template',
    description:
      'Scaffold a new agent project from a pre-configured software template with best-practice structure and dependencies.',
  },
  {
    id: 'devspaces',
    tourId: 'intent-devspaces',
    icon: <LaptopMacOutlinedIcon />,
    title: 'Agent DevSpace',
    subtitle: 'Cloud IDE workspace',
    description:
      'Launch a ready-to-code cloud IDE with your agent\u2019s repository, tools, and runtime pre-configured.',
  },
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AgentCreateIntentDialog({
  open,
  onClose,
  onSelectDeploy,
  onSelectConfigure,
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
      } else if (cardId === 'deploy') {
        onSelectDeploy();
      } else if (cardId === 'configure') {
        onSelectConfigure?.();
      }
    },
    [onSelectDeploy, onSelectConfigure],
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
        'data-tour': 'intent-dialog',
        sx: { borderRadius: 3, overflow: 'hidden' },
      } as Record<string, unknown>}
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
