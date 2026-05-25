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

import { useState, useCallback, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Tooltip from '@mui/material/Tooltip';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Skeleton from '@mui/material/Skeleton';
import { useTheme, alpha } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChatIcon from '@mui/icons-material/Chat';
import PublishIcon from '@mui/icons-material/Publish';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import {
  getLifecycleTransition,
  getLifecycleStep,
} from './lifecycleTransitions';
import {
  useApi,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import type {
  ChatAgent,
  AgentLifecycleStage,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { normalizeLifecycleStage } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { augmentApiRef } from '../../../api';
import {
  glassSurface,
  borderRadius,
  typeScale,
  animations,
  reducedMotion,
} from '../../../theme/tokens';
import { CONTENT_MAX_WIDTH } from '../shared/commandCenterStyles';
import { InlineAgentChat } from '../shared/InlineAgentChat';

type DetailTab = 'overview' | 'test';

const LIFECYCLE_STAGES = ['Draft', 'Pending', 'Published', 'Archived'];

export interface WorkflowAgentDetailProps {
  agentId: string;
  onBack: () => void;
  onChatWithAgent?: (agentId: string) => void;
  onEditInBuilder?: (agentId: string) => void;
}

/**
 * Detail view for workflow-builder agents (created via the no-code UI
 * with the Responses API). Mirrors the structure and styling of
 * AgentLifecycleDetail but without Kagenti-specific tabs (Build,
 * Design, Agent Card) since those are for Kagenti-managed agents.
 */
function getAgentTypeLabel(framework?: string): string {
  if (framework === 'docsclaw') return 'Skill Agent (DocsClaw)';
  if (framework === 'workflow-builder')
    return 'Workflow Agent (No-Code Builder)';
  return 'Responses API Agent';
}

function getAgentChipLabel(framework?: string): string {
  if (framework === 'docsclaw') return 'Skill Agent';
  if (framework === 'workflow-builder') return 'Workflow Agent';
  return 'Responses API';
}

export function WorkflowAgentDetail({
  agentId,
  onBack,
  onChatWithAgent,
  onEditInBuilder,
}: WorkflowAgentDetailProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const api = useApi(augmentApiRef);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  const [agent, setAgent] = useState<ChatAgent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishToast, setPublishToast] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [liveInfo, setLiveInfo] = useState<{
    health?: { status?: string; error?: string };
    models?: unknown;
    skills?: { skills?: Array<{ id?: string; name?: string }> };
    systemPrompt?: string;
  } | null>(null);

  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .listAgents()
      .then(agents => {
        if (cancelled) return;
        const match = agents.find(a => a.id === agentId);
        if (match) {
          setAgent(match);
        } else {
          setError(`Agent "${agentId}" not found`);
        }
      })
      .catch(err => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : 'Failed to load agent');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api, agentId]);

  useEffect(() => {
    if (!agent?.chatEndpoint) return undefined;
    let cancelled = false;
    discoveryApi
      .getBaseUrl('augment')
      .then(baseUrl =>
        fetchApi.fetch(
          `${baseUrl}/skills/agents/${encodeURIComponent(agentId)}/info`,
          { headers: { 'X-Backstage-Request': 'augment' } },
        ),
      )
      .then(r => r.json())
      .then(data => {
        if (!cancelled) setLiveInfo(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [agent?.chatEndpoint, agentId, discoveryApi, fetchApi]);

  const lifecycleStage = normalizeLifecycleStage(agent?.lifecycleStage);

  const nextTransition = useMemo(() => {
    const t = getLifecycleTransition(lifecycleStage);
    return {
      ...t,
      icon: t.iconType === 'promote' ? <PublishIcon /> : <CloudOffIcon />,
    };
  }, [lifecycleStage]);

  const handleLifecycleAction = useCallback(async () => {
    setPublishLoading(true);
    try {
      if (nextTransition.action === 'demote') {
        const result = await api.demoteAgent(agentId, nextTransition.target);
        setAgent(prev =>
          prev
            ? {
                ...prev,
                lifecycleStage: result.lifecycleStage as AgentLifecycleStage,
              }
            : prev,
        );
        setPublishToast(`Agent moved to ${result.lifecycleStage}`);
      } else {
        const result = await api.promoteAgent(agentId, nextTransition.target);
        setAgent(prev =>
          prev
            ? {
                ...prev,
                lifecycleStage: result.lifecycleStage as AgentLifecycleStage,
              }
            : prev,
        );
        setPublishToast(
          `Agent moved to ${result.lifecycleStage} (v${result.version})`,
        );
      }
    } catch (err) {
      setPublishToast(
        `Failed: ${err instanceof Error ? err.message : 'Unknown'}`,
      );
    } finally {
      setPublishLoading(false);
    }
  }, [api, agentId, nextTransition]);

  const handleDelete = useCallback(async () => {
    setDeleteLoading(true);
    try {
      await api.deleteAgentConfig(agentId);
      setPublishToast('Agent deleted successfully');
      onBack();
    } catch (err) {
      setPublishToast(
        `Delete failed: ${err instanceof Error ? err.message : 'Unknown'}`,
      );
    } finally {
      setDeleteLoading(false);
      setDeleteConfirm(false);
    }
  }, [api, agentId, onBack]);

  const currentStep = getLifecycleStep(lifecycleStage);
  const glass = glassSurface(theme, 6);

  if (loading) {
    return (
      <Box
        sx={{
          maxWidth: CONTENT_MAX_WIDTH,
          width: '100%',
          ...animations.fadeSlideIn,
        }}
      >
        <Button
          size="small"
          startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
          onClick={onBack}
          sx={{
            textTransform: 'none',
            mb: 1.5,
            color: theme.palette.primary.main,
            fontWeight: 500,
          }}
        >
          Agents
        </Button>
        <Box sx={{ ...glass, borderRadius: borderRadius.lg, p: 3, mb: 3 }}>
          <Skeleton variant="text" width={200} height={32} />
          <Skeleton variant="text" width={300} height={20} sx={{ mt: 1 }} />
          <Skeleton
            variant="rectangular"
            height={60}
            sx={{ mt: 2, borderRadius: 1 }}
          />
        </Box>
      </Box>
    );
  }

  if (error || !agent) {
    return (
      <Box
        sx={{
          maxWidth: CONTENT_MAX_WIDTH,
          width: '100%',
          ...animations.fadeSlideIn,
        }}
      >
        <Button
          size="small"
          startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
          onClick={onBack}
          sx={{
            textTransform: 'none',
            mb: 1.5,
            color: theme.palette.primary.main,
            fontWeight: 500,
          }}
        >
          Agents
        </Button>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Agent not found'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        maxWidth: CONTENT_MAX_WIDTH,
        width: '100%',
        minWidth: 0,
        ...animations.fadeSlideIn,
        '@media (prefers-reduced-motion: reduce)': reducedMotion,
      }}
    >
      <Button
        size="small"
        startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
        onClick={onBack}
        sx={{
          textTransform: 'none',
          mb: 1.5,
          color: theme.palette.primary.main,
          fontWeight: 500,
        }}
      >
        Agents
      </Button>

      {/* Agent Header Card */}
      <Box
        sx={{
          ...glass,
          borderRadius: borderRadius.lg,
          p: 3,
          mb: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  fontSize: typeScale.pageTitle.fontSize,
                  color: 'text.primary',
                }}
              >
                {agent.name}
              </Typography>
              {agent.status && (
                <Chip
                  label={agent.status}
                  size="small"
                  color={
                    agent.status.toLowerCase() === 'ready'
                      ? 'success'
                      : 'default'
                  }
                />
              )}
              <Chip
                label={lifecycleStage}
                size="small"
                variant="outlined"
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  textTransform: 'capitalize',
                }}
              />
            </Box>
            <Box
              sx={{
                display: 'flex',
                gap: 0.75,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Chip
                label={getAgentChipLabel(agent.framework)}
                size="small"
                variant="outlined"
                color={agent.framework === 'docsclaw' ? 'info' : 'default'}
                sx={{ height: 22, fontSize: '0.7rem' }}
              />
              {agent.framework && (
                <Chip
                  label={agent.framework}
                  size="small"
                  variant="outlined"
                  color="info"
                  sx={{ height: 22, fontSize: '0.7rem' }}
                />
              )}
            </Box>
          </Box>

          {/* Action buttons */}
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            {lifecycleStage !== 'archived' && (
              <Tooltip title={nextTransition.label}>
                <Button
                  size="small"
                  variant={nextTransition.variant}
                  color={nextTransition.color}
                  startIcon={
                    publishLoading ? (
                      <CircularProgress size={14} />
                    ) : (
                      nextTransition.icon
                    )
                  }
                  disabled={publishLoading}
                  onClick={handleLifecycleAction}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    borderRadius: borderRadius.sm,
                  }}
                >
                  {nextTransition.label}
                </Button>
              </Tooltip>
            )}
            {lifecycleStage === 'archived' && (
              <Tooltip title="Reactivate this agent to draft status">
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  startIcon={
                    publishLoading ? (
                      <CircularProgress size={14} />
                    ) : (
                      <PublishIcon />
                    )
                  }
                  disabled={publishLoading}
                  onClick={handleLifecycleAction}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    borderRadius: borderRadius.sm,
                  }}
                >
                  Reactivate
                </Button>
              </Tooltip>
            )}
            {lifecycleStage === 'draft' &&
              onEditInBuilder &&
              agent?.framework === 'workflow-builder' && (
                <Tooltip title="Open in the visual workflow builder">
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    startIcon={<EditIcon />}
                    onClick={() => onEditInBuilder(agentId)}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      borderRadius: borderRadius.sm,
                    }}
                  >
                    Edit in Builder
                  </Button>
                </Tooltip>
              )}
            {lifecycleStage === 'draft' && (
              <Tooltip title="Delete this draft agent">
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={
                    deleteLoading ? (
                      <CircularProgress size={14} />
                    ) : (
                      <DeleteOutlineIcon />
                    )
                  }
                  disabled={deleteLoading || publishLoading}
                  onClick={() => setDeleteConfirm(true)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    borderRadius: borderRadius.sm,
                  }}
                >
                  Delete
                </Button>
              </Tooltip>
            )}
            {onChatWithAgent && (
              <Button
                size="small"
                variant="contained"
                startIcon={<ChatIcon />}
                onClick={() => setActiveTab('test')}
                sx={{ textTransform: 'none', borderRadius: borderRadius.sm }}
              >
                Test
              </Button>
            )}
          </Box>

          {/* Delete confirmation */}
          {deleteConfirm && (
            <Alert
              severity="warning"
              sx={{ mt: 1 }}
              action={
                <Box display="flex" gap={1}>
                  <Button
                    size="small"
                    color="inherit"
                    onClick={() => setDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color="error"
                    onClick={handleDelete}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? 'Deleting...' : 'Confirm Delete'}
                  </Button>
                </Box>
              }
            >
              This will permanently delete the agent and its cluster resources
              (Deployment, Service, ConfigMap).
            </Alert>
          )}
        </Box>

        {/* Lifecycle Progress Stepper */}
        <Box sx={{ mt: 1 }}>
          <Stepper
            activeStep={currentStep}
            alternativeLabel
            sx={{
              '& .MuiStepLabel-label': {
                fontSize: typeScale.caption.fontSize,
                fontWeight: 500,
              },
              '& .MuiStepConnector-line': {
                borderColor: alpha(theme.palette.divider, isDark ? 0.3 : 0.2),
              },
            }}
          >
            {LIFECYCLE_STAGES.map(label => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            minHeight: 40,
            '& .MuiTab-root': {
              minHeight: 40,
              minWidth: 'auto',
              px: 2.5,
              textTransform: 'none',
              fontSize: typeScale.body.fontSize,
              fontWeight: 500,
            },
          }}
        >
          <Tab label="Overview" value="overview" />
          <Tab label="Test" value="test" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <Box sx={{ ...glass, borderRadius: borderRadius.lg, p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <InfoOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Agent Information
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '140px 1fr',
              gap: 1.5,
              rowGap: 1,
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600 }}
            >
              ID
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
            >
              {agent.id}
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600 }}
            >
              Name
            </Typography>
            <Typography variant="body2">{agent.name}</Typography>

            {agent.description && (
              <>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600 }}
                >
                  Description
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {agent.description}
                </Typography>
              </>
            )}

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600 }}
            >
              Type
            </Typography>
            <Typography variant="body2">
              {getAgentTypeLabel(agent.framework)}
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600 }}
            >
              Lifecycle Stage
            </Typography>
            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
              {lifecycleStage}
            </Typography>

            {agent.promotedAt && (
              <>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600 }}
                >
                  Last Promoted
                </Typography>
                <Typography variant="body2">
                  {new Date(agent.promotedAt).toLocaleString()}
                </Typography>
              </>
            )}

            {agent.promotedBy && (
              <>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600 }}
                >
                  Promoted By
                </Typography>
                <Typography variant="body2">{agent.promotedBy}</Typography>
              </>
            )}

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600 }}
            >
              Default Agent
            </Typography>
            <Typography variant="body2">
              {agent.isDefault ? 'Yes' : 'No'}
            </Typography>

            {agent.chatEndpoint && (
              <>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600 }}
                >
                  Chat Endpoint
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                >
                  {agent.chatEndpoint}
                </Typography>
              </>
            )}

            {liveInfo?.health && (
              <>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600 }}
                >
                  Pod Health
                </Typography>
                <Typography variant="body2">
                  {liveInfo.health.status === 'healthy' ? (
                    <Chip
                      label="Healthy"
                      size="small"
                      color="success"
                      sx={{ height: 22, fontSize: '0.75rem' }}
                    />
                  ) : (
                    <Chip
                      label={String(
                        liveInfo.health.status ??
                          liveInfo.health.error ??
                          'Unknown',
                      )}
                      size="small"
                      color="warning"
                      sx={{ height: 22, fontSize: '0.75rem' }}
                    />
                  )}
                </Typography>
              </>
            )}

            {liveInfo?.skills?.skills && liveInfo.skills.skills.length > 0 && (
              <>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600 }}
                >
                  Loaded Skills
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={0.5}>
                  {liveInfo.skills.skills.map((s, i) => (
                    <Chip
                      key={s.id ?? i}
                      label={s.name ?? s.id ?? 'unknown'}
                      size="small"
                      variant="outlined"
                      sx={{ height: 22, fontSize: '0.75rem' }}
                    />
                  ))}
                </Box>
              </>
            )}

            {liveInfo?.systemPrompt && (
              <>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600, gridColumn: '1 / -1', mt: 1 }}
                >
                  Agent Instructions (system-prompt.txt)
                </Typography>
                <Box
                  sx={{
                    gridColumn: '1 / -1',
                    bgcolor: isDark
                      ? 'rgba(255,255,255,0.04)'
                      : 'rgba(0,0,0,0.03)',
                    borderRadius: borderRadius.sm,
                    p: 2,
                    maxHeight: 200,
                    overflowY: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: 'text.primary',
                  }}
                >
                  {liveInfo.systemPrompt}
                </Box>
              </>
            )}

            {agent.agentRole && (
              <>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600 }}
                >
                  Role
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ textTransform: 'capitalize' }}
                >
                  {agent.agentRole}
                </Typography>
              </>
            )}
          </Box>
        </Box>
      )}

      {activeTab === 'test' && (
        <InlineAgentChat agentId={agentId} agentName={agent.name} />
      )}

      <Snackbar
        open={!!publishToast}
        autoHideDuration={3000}
        onClose={() => setPublishToast(null)}
        message={publishToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}

// InlineAgentChat is now shared -- imported from ../shared/InlineAgentChat
