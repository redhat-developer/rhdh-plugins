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
import { useTheme } from '@mui/material/styles';
import { AgentTemplateBrowser } from './AgentTemplateBrowser';
import { DevSpacesLaunchForm } from './DevSpacesLaunchForm';
import { CardGrid, DialogHeader } from './IntentDialogParts';
import type { IntentCard } from './IntentDialogParts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ToolCreateIntentDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectDeploy: () => void;
}

type View = 'intent' | 'develop-sub' | 'templates' | 'devspaces';

// ---------------------------------------------------------------------------
// Card definitions
// ---------------------------------------------------------------------------

const INTENT_CARDS: IntentCard[] = [
  {
    id: 'develop',
    tourId: 'tool-intent-develop',
    icon: <CodeIcon />,
    title: 'Develop',
    subtitle: 'Start building your MCP tool',
    description:
      'Scaffold from a template or launch a cloud workspace to develop your tool with full tooling.',
  },
  {
    id: 'deploy',
    tourId: 'tool-intent-deploy',
    icon: <RocketLaunchOutlinedIcon />,
    title: 'Deploy',
    subtitle: 'Deploy your tool to the platform',
    description:
      'Deploy a tool from a container image or a Git repository. The platform handles building, containerizing, and running it.',
  },
];

const DEVELOP_SUB_CARDS: IntentCard[] = [
  {
    id: 'templates',
    icon: <DescriptionOutlinedIcon />,
    title: 'From Template',
    subtitle: 'Use a software template',
    description:
      'Scaffold a new MCP tool project from a pre-configured software template with best-practice structure and dependencies.',
  },
  {
    id: 'devspaces',
    icon: <LaptopMacOutlinedIcon />,
    title: 'Tool DevSpace',
    subtitle: 'Cloud IDE workspace',
    description:
      'Launch a cloud IDE to develop your MCP tool with full tooling and runtime support.',
  },
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ToolCreateIntentDialog({
  open,
  onClose,
  onSelectDeploy,
}: ToolCreateIntentDialogProps) {
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
        setView('intent');
        onSelectDeploy();
      }
    },
    [onSelectDeploy],
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
      {view === 'intent' && (
        <>
          <DialogHeader
            titleId={titleId}
            title="New Tool"
            subtitle="Choose how you want to get started with your new MCP tool."
          />
          <DialogContent sx={{ px: 3, pt: 3, pb: 3 }}>
            <CardGrid
              cards={INTENT_CARDS}
              onCardClick={handleIntentCardClick}
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

      {view === 'templates' && (
        <DialogContent sx={{ px: 3, pt: 3, pb: 3 }}>
          <AgentTemplateBrowser
            onBack={() => setView('develop-sub')}
            onOpenInDevSpace={handleOpenInDevSpace}
            tag="kagenti-tool"
            title="Tool Templates"
            description="Choose a software template to scaffold a new MCP tool project. Templates are discovered from the catalog automatically."
            emptyTitle="No tool templates found"
            devSpaceLabel="Open in Tool DevSpace"
          />
        </DialogContent>
      )}

      {view === 'devspaces' && (
        <DialogContent sx={{ px: 3, pt: 3, pb: 3 }}>
          <DevSpacesLaunchForm
            onBack={() => {
              setDevSpacesGitRepo(undefined);
              setView('develop-sub');
            }}
            initialGitRepo={devSpacesGitRepo}
            resourceKind="tool"
          />
        </DialogContent>
      )}
    </Dialog>
  );
}
