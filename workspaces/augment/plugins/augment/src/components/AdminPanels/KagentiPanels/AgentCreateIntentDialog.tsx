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

import { useCallback, useId, useState, useRef } from 'react';
import {
  useApi,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import ExtensionOutlinedIcon from '@mui/icons-material/ExtensionOutlined';
import DashboardCustomizeOutlinedIcon from '@mui/icons-material/DashboardCustomizeOutlined';
import CodeIcon from '@mui/icons-material/Code';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { alpha, useTheme } from '@mui/material/styles';
import type { DeploymentMethod } from './agentWizardTypes';
import { AgentTemplateBrowser } from './AgentTemplateBrowser';
import {
  DevSpacesFrameworkPicker,
  type FrameworkOption,
} from './DevSpacesFrameworkPicker';
import { DevSpacesLaunchForm } from './DevSpacesLaunchForm';
import { DialogHeader } from './IntentDialogParts';
import { RuntimePicker } from '../../SkillsAgentCreation/RuntimePicker';
import {
  SkillBrowser,
  type SkillDefinition,
} from '../../SkillsAgentCreation/SkillBrowser';
import { SkillAgentConfigForm } from '../../SkillsAgentCreation/SkillAgentConfigForm';
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
  readonly onCreated?: () => void;
}

type SkillsStep = 'runtime' | 'skills' | 'config' | 'deploying';
type View = 'intent' | 'create-sub' | 'templates' | 'devspaces';

type DeployPhase = 'applying' | 'waiting-for-pod' | 'ready' | 'failed';

interface DeployResult {
  phase: DeployPhase;
  deployed: boolean;
  agentName: string;
  namespace: string;
  chatEndpoint: string;
  skillCount: number;
  error?: string;
}

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
  onCreated,
}: AgentCreateIntentDialogProps) {
  const theme = useTheme();
  const titleId = useId();
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const deployAbortRef = useRef<AbortController>();
  const [view, setView] = useState<View>('intent');
  const [devSpacesGitRepo, setDevSpacesGitRepo] = useState<string | undefined>(
    undefined,
  );
  const [devSpacesFramework, setDevSpacesFramework] =
    useState<FrameworkOption | null>(null);
  const [skillsStep, setSkillsStep] = useState<SkillsStep | null>(null);
  const [skillsRuntimeId, setSkillsRuntimeId] = useState('');
  const [skillsSelected, setSkillsSelected] = useState<SkillDefinition[]>([]);
  const [skillsDeploying, setSkillsDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<DeployResult | null>(null);

  const handleClose = useCallback(() => {
    setView('intent');
    setDevSpacesGitRepo(undefined);
    setDevSpacesFramework(null);
    setSkillsStep(null);
    setSkillsRuntimeId('');
    setSkillsSelected([]);
    setDeployResult(null);
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

  const handleSkillsDeploy = useCallback(
    async (config: { name: string; systemPrompt: string }) => {
      setSkillsDeploying(true);
      setDeployResult(null);
      setSkillsStep('deploying');
      deployAbortRef.current?.abort();
      deployAbortRef.current = new AbortController();

      const makeResult = (
        phase: DeployPhase,
        overrides?: Partial<DeployResult>,
      ): DeployResult => ({
        phase,
        deployed: false,
        agentName: config.name,
        namespace: '',
        chatEndpoint: '',
        skillCount: skillsSelected.length,
        ...overrides,
      });

      try {
        const baseUrl = await discoveryApi.getBaseUrl('augment');
        setDeployResult(makeResult('applying'));

        const resp = await fetchApi.fetch(`${baseUrl}/agents/from-skills`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Backstage-Request': 'augment',
          },
          body: JSON.stringify({
            name: config.name,
            systemPrompt: config.systemPrompt,
            runtime: skillsRuntimeId,
            skills: skillsSelected.map(s => ({
              slug: s.slug ?? s.name,
              name: s.name,
              skillName: s.skillName ?? s.name,
              pluginName: s.pluginName,
              gitPath: s.gitPath ?? '',
            })),
          }),
          signal: deployAbortRef.current.signal,
        });

        if (!resp.ok) {
          const detail = await resp.text().catch(() => '');
          setDeployResult(
            makeResult('failed', {
              error: `Deploy failed: ${resp.status} ${detail.slice(0, 200)}`,
            }),
          );
          return;
        }

        const data = (await resp.json()) as {
          deployed?: boolean;
          agentName?: string;
          namespace?: string;
          chatEndpoint?: string;
          skillCount?: number;
        };

        const agentName = data.agentName ?? config.name;
        const partial = {
          deployed: data.deployed ?? false,
          agentName,
          namespace: data.namespace ?? '',
          chatEndpoint: data.chatEndpoint ?? '',
          skillCount: data.skillCount ?? skillsSelected.length,
        };

        if (!data.deployed) {
          setDeployResult(makeResult('ready', partial));
          return;
        }

        setDeployResult(makeResult('waiting-for-pod', partial));

        const pollHealth = async (): Promise<boolean> => {
          try {
            const infoResp = await fetchApi.fetch(
              `${baseUrl}/skills/agents/${encodeURIComponent(agentName)}/info`,
              { headers: { 'X-Backstage-Request': 'augment' } },
            );
            if (!infoResp.ok) return false;
            const info = (await infoResp.json()) as {
              health?: { status?: string };
            };
            return info.health?.status === 'healthy';
          } catch {
            return false;
          }
        };

        for (let i = 0; i < 12; i++) {
          if (deployAbortRef.current.signal.aborted) return;
          await new Promise(r => setTimeout(r, 5000));
          if (await pollHealth()) {
            setDeployResult(makeResult('ready', partial));
            return;
          }
        }

        setDeployResult(makeResult('ready', partial));
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setDeployResult(
            makeResult('failed', {
              error: err instanceof Error ? err.message : 'Unknown error',
            }),
          );
        }
      } finally {
        setSkillsDeploying(false);
      }
    },
    [discoveryApi, fetchApi, skillsRuntimeId, skillsSelected],
  );

  const handleSubOptionClick = useCallback(
    (id: string) => {
      setDevSpacesFramework(null);
      if (id === 'skills') {
        setSkillsStep('runtime');
      } else if (id === 'configure') {
        handleClose();
        onSelectConfigure?.();
      } else if (id === 'code') {
        setView('devspaces');
      } else if (id === 'template') {
        setView('templates');
      }
    },
    [handleClose, onSelectConfigure],
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
      {view === 'intent' && !skillsStep && (
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
      {view === 'create-sub' && !skillsStep && (
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
            onDone={handleClose}
            specType="agent"
          />
        </DialogContent>
      )}

      {/* --- DevSpaces framework picker --- */}
      {view === 'devspaces' && devSpacesFramework === null && (
        <>
          <DialogHeader
            titleId={titleId}
            title="Code Your Agent"
            subtitle="Choose a framework to launch a cloud development workspace."
            onBack={() => setView('create-sub')}
          />
          <DialogContent sx={{ px: 3, pt: 3, pb: 3 }}>
            <DevSpacesFrameworkPicker
              onSelect={fw => setDevSpacesFramework(fw)}
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

      {/* --- DevSpaces launch form --- */}
      {view === 'devspaces' && devSpacesFramework !== null && (
        <DialogContent sx={{ px: 3, pt: 3, pb: 3 }}>
          <DevSpacesLaunchForm
            onBack={() => setDevSpacesFramework(null)}
            onDone={handleClose}
            initialGitRepo={devSpacesGitRepo ?? devSpacesFramework?.starterRepo}
            frameworkName={devSpacesFramework?.name}
          />
        </DialogContent>
      )}

      {/* --- Skills wizard (3-step) --- */}
      {skillsStep === 'runtime' && (
        <>
          <DialogHeader
            titleId={titleId}
            title="Select Runtime"
            subtitle="Choose a runtime for your skill agent."
            onBack={() => {
              setSkillsStep(null);
              setView('create-sub');
            }}
          />
          <DialogContent sx={{ px: 3, pt: 3, pb: 3 }}>
            <RuntimePicker
              selectedId={skillsRuntimeId || undefined}
              onSelect={id => {
                setSkillsRuntimeId(id);
                setSkillsStep('skills');
              }}
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

      {skillsStep === 'skills' && (
        <>
          <DialogHeader
            titleId={titleId}
            title="Choose Skills"
            subtitle="Select the skills your agent will have."
            onBack={() => setSkillsStep('runtime')}
          />
          <DialogContent sx={{ px: 3, pt: 3, pb: 3 }}>
            <SkillBrowser
              selectedSkills={skillsSelected}
              onSelectionChange={setSkillsSelected}
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
            <Button
              variant="contained"
              disabled={skillsSelected.length === 0}
              onClick={() => setSkillsStep('config')}
              sx={{ textTransform: 'none' }}
            >
              Next
            </Button>
          </DialogActions>
        </>
      )}

      {skillsStep === 'config' && (
        <>
          <DialogHeader
            titleId={titleId}
            title="Configure Agent"
            subtitle="Name your agent and set a system prompt."
            onBack={() => setSkillsStep('skills')}
          />
          <DialogContent sx={{ px: 3, pt: 3, pb: 3 }}>
            <SkillAgentConfigForm
              runtimeId={skillsRuntimeId}
              selectedSkills={skillsSelected}
              onDeploy={handleSkillsDeploy}
              deploying={skillsDeploying}
            />
          </DialogContent>
        </>
      )}

      {skillsStep === 'deploying' && (
        <>
          <DialogHeader
            titleId={titleId}
            title={
              // eslint-disable-next-line no-nested-ternary
              deployResult?.phase === 'ready'
                ? 'Agent Ready'
                : deployResult?.phase === 'failed'
                  ? 'Deployment Failed'
                  : 'Deploying Agent'
            }
            subtitle={
              // eslint-disable-next-line no-nested-ternary
              deployResult?.phase === 'ready'
                ? ''
                : deployResult?.phase === 'failed'
                  ? ''
                  : 'Setting up your agent on the cluster...'
            }
          />
          <DialogContent sx={{ px: 3, pt: 3, pb: 3 }}>
            {/* Phase: applying manifests or waiting for pod */}
            {deployResult &&
              (deployResult.phase === 'applying' ||
                deployResult.phase === 'waiting-for-pod') && (
                <Box py={3}>
                  <LinearProgress sx={{ mb: 3 }} />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    textAlign="center"
                    sx={{ mb: 1 }}
                  >
                    {deployResult.phase === 'applying'
                      ? 'Creating namespace, applying manifests...'
                      : `Waiting for ${deployResult.agentName} pod to become ready...`}
                  </Typography>
                  {deployResult.phase === 'waiting-for-pod' && (
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '100px 1fr',
                        gap: 1,
                        mt: 2,
                        px: 2,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Agent
                      </Typography>
                      <Typography variant="body2">
                        {deployResult.agentName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Namespace
                      </Typography>
                      <Typography variant="body2">
                        {deployResult.namespace}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Skills
                      </Typography>
                      <Typography variant="body2">
                        {deployResult.skillCount} skill
                        {deployResult.skillCount !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

            {/* Phase: ready */}
            {deployResult?.phase === 'ready' && (
              <Box>
                <Alert
                  severity="success"
                  icon={<CheckCircleOutlineIcon />}
                  sx={{ mb: 3 }}
                >
                  Agent <strong>{deployResult.agentName}</strong> is{' '}
                  {deployResult.deployed ? 'deployed and ready' : 'registered'}.
                </Alert>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '120px 1fr',
                    gap: 1.5,
                    mb: 2,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Agent
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {deployResult.agentName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Namespace
                  </Typography>
                  <Typography variant="body2">
                    {deployResult.namespace}
                  </Typography>
                  {deployResult.chatEndpoint && (
                    <>
                      <Typography variant="caption" color="text.secondary">
                        Endpoint
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                      >
                        {deployResult.chatEndpoint}
                      </Typography>
                    </>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    Skills
                  </Typography>
                  <Typography variant="body2">
                    {deployResult.skillCount} skill
                    {deployResult.skillCount !== 1 ? 's' : ''} mounted
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Phase: failed */}
            {deployResult?.phase === 'failed' && (
              <Alert
                severity="error"
                icon={<ErrorOutlineIcon />}
                sx={{ mb: 2 }}
              >
                {deployResult.error ?? 'Deployment failed. Please try again.'}
              </Alert>
            )}

            {/* Initial state (before first API response) */}
            {!deployResult && (
              <Box py={4}>
                <LinearProgress sx={{ mb: 3 }} />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                >
                  Preparing deployment...
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions
            sx={{
              px: 3,
              pb: 2,
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          >
            {deployResult?.phase === 'ready' && (
              <>
                <Button
                  onClick={() => {
                    setSkillsStep('runtime');
                    setSkillsRuntimeId('');
                    setSkillsSelected([]);
                    setDeployResult(null);
                  }}
                  sx={{ textTransform: 'none' }}
                >
                  Create Another
                </Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    onCreated?.();
                    handleClose();
                  }}
                  sx={{ textTransform: 'none' }}
                >
                  Go to My Agents
                </Button>
              </>
            )}
            {deployResult?.phase === 'failed' && (
              <>
                <Button onClick={handleClose} sx={{ textTransform: 'none' }}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    setSkillsStep('config');
                    setDeployResult(null);
                  }}
                  sx={{ textTransform: 'none' }}
                >
                  Try Again
                </Button>
              </>
            )}
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
