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
import { useTheme, alpha } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChatIcon from '@mui/icons-material/Chat';
import PublishIcon from '@mui/icons-material/Publish';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  getLifecycleTransition,
  getLifecycleStep,
} from './lifecycleTransitions';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useApi } from '@backstage/core-plugin-api';
import type { KagentiAgentSummary } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { normalizeLifecycleStage } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { augmentApiRef } from '../../../api';
import { statusChipColor as statusColor } from './kagentiDisplayUtils';
import { AgentDetailsTab } from './AgentDetailsTab';
import { AgentStatusTab } from './AgentStatusTab';
import { AgentResourceTab } from './AgentResourceTab';
import { AgentCardTab } from './AgentCardTab';
import { useKagentiAgentDetail } from './useKagentiAgentDetail';
import {
  glassSurface,
  borderRadius,
  typeScale,
  animations,
  reducedMotion,
} from '../../../theme/tokens';
import { CONTENT_MAX_WIDTH } from '../shared/commandCenterStyles';
import { InlineAgentChat } from '../shared/InlineAgentChat';

type LifecycleTab = 'overview' | 'design' | 'test' | 'build' | 'card';

const LIFECYCLE_STAGES = ['Draft', 'Pending', 'Published', 'Archived'];

export interface AgentLifecycleDetailProps {
  agent: KagentiAgentSummary;
  onBack: () => void;
  onChatWithAgent?: (agentId: string) => void;
  onDeleted?: () => void;
  isAdmin?: boolean;
}

/**
 * Agent Detail view structured around the development lifecycle.
 * Tabs: Overview | Design | Test | Build | Agent Card
 */
export function AgentLifecycleDetail({
  agent,
  onBack,
  onChatWithAgent,
  onDeleted,
  isAdmin = false,
}: AgentLifecycleDetailProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const api = useApi(augmentApiRef);
  const [activeTab, setActiveTab] = useState<LifecycleTab>('overview');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    agentCard,
    agentDetail,
    buildInfo,
    routeStatus,
    loading,
    error,
    setError,
    buildTriggering,
    copied,
    hasBuild,
    loadBuildInfo,
    handleTriggerBuild,
    handleCopy,
  } = useKagentiAgentDetail(api, agent);

  const agentId = `${agent.namespace}/${agent.name}`;
  const displayName = agentCard?.name || agent.name;

  const [lifecycleStage, setLifecycleStage] = useState<string>('draft');
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishToast, setPublishToast] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | undefined>();
  const [rejectedBy, setRejectedBy] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    api
      .listAgents()
      .then(agents => {
        if (cancelled) return;
        const match = agents.find(a => a.id === agentId);
        setLifecycleStage(normalizeLifecycleStage(match?.lifecycleStage));
        setRejectionReason(match?.rejectionReason);
        setRejectedBy(match?.rejectedBy);
      })
      .catch(() => setLifecycleStage('draft'));
    return () => {
      cancelled = true;
    };
  }, [api, agentId]);

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
        setLifecycleStage(result.lifecycleStage);
        setPublishToast(`Agent moved to ${result.lifecycleStage}`);
      } else {
        const result = await api.promoteAgent(agentId, nextTransition.target);
        setLifecycleStage(result.lifecycleStage);
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
      await api.deleteKagentiAgent(agent.namespace, agent.name);
      await api.deleteAgentConfig(agentId).catch(() => {});
      setPublishToast('Agent deleted');
      onDeleted?.();
    } catch (err) {
      setPublishToast(
        `Delete failed: ${err instanceof Error ? err.message : 'Unknown'}`,
      );
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
    }
  }, [api, agent.namespace, agent.name, agentId, onDeleted]);

  const canDelete = lifecycleStage === 'draft';

  const currentStep = getLifecycleStep(lifecycleStage);
  const glass = glassSurface(theme, 6);

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
      {/* Breadcrumb back */}
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
        {/* Top: Name + Status + Actions */}
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
                {displayName}
              </Typography>
              <Chip
                label={agent.status}
                size="small"
                color={statusColor(agent.status)}
              />
              {lifecycleStage && (
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
              )}
            </Box>
            <Box
              sx={{
                display: 'flex',
                gap: 0.75,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {agent.namespace}
              </Typography>
              {agent.labels?.framework && (
                <Chip
                  label={agent.labels.framework}
                  size="small"
                  variant="outlined"
                  color="info"
                  sx={{ height: 22, fontSize: '0.7rem' }}
                />
              )}
              {agent.labels?.protocol && (
                <Chip
                  label={[agent.labels.protocol]
                    .flat()
                    .join(', ')
                    .toUpperCase()}
                  size="small"
                  variant="outlined"
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
            {isAdmin ? (
              <>
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
                {hasBuild && (
                  <Tooltip title="Trigger a new container image build">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PlayArrowIcon />}
                      disabled={buildTriggering}
                      onClick={() => void handleTriggerBuild()}
                      sx={{
                        textTransform: 'none',
                        borderRadius: borderRadius.sm,
                      }}
                    >
                      {buildTriggering ? 'Building...' : 'Rebuild'}
                    </Button>
                  </Tooltip>
                )}
              </>
            ) : (
              <>
                {lifecycleStage === 'draft' && (
                  <Tooltip title="Submit this agent for admin review">
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
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
                      Submit for Review
                    </Button>
                  </Tooltip>
                )}
                {lifecycleStage !== 'draft' && (
                  <Chip
                    label={lifecycleStage}
                    size="small"
                    color="default"
                    sx={{
                      textTransform: 'capitalize',
                      fontWeight: 600,
                    }}
                  />
                )}
              </>
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
            {canDelete && (
              <Tooltip title="Delete this draft agent">
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={
                    deleteLoading ? (
                      <CircularProgress size={14} />
                    ) : (
                      <DeleteIcon />
                    )
                  }
                  disabled={deleteLoading}
                  onClick={() => setDeleteDialogOpen(true)}
                  sx={{ textTransform: 'none', borderRadius: borderRadius.sm }}
                >
                  Delete
                </Button>
              </Tooltip>
            )}
          </Box>
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

      {lifecycleStage === 'draft' && rejectionReason && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Rejected{rejectedBy ? ` by ${rejectedBy}` : ''}
          </Typography>
          <Typography variant="body2">{rejectionReason}</Typography>
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Lifecycle Tabs */}
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
          <Tab label="Design" value="design" />
          <Tab label="Test" value="test" />
          <Tab label="Build" value="build" />
          <Tab label="Agent Card" value="card" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <AgentDetailsTab
          agent={agent}
          agentDetail={agentDetail}
          loading={loading}
          routeStatus={routeStatus}
          copied={copied}
          onCopy={handleCopy}
        />
      )}

      {activeTab === 'design' && (
        <AgentResourceTab
          agentDetail={agentDetail}
          loading={loading}
          copied={copied}
          onCopy={handleCopy}
        />
      )}

      {activeTab === 'test' && (
        <InlineAgentChat agentId={agentId} agentName={displayName} />
      )}

      {activeTab === 'build' && (
        <AgentStatusTab
          agent={agent}
          agentDetail={agentDetail}
          buildInfo={buildInfo}
          loading={loading}
          buildTriggering={buildTriggering}
          hasBuild={hasBuild}
          onRefreshBuild={() => void loadBuildInfo()}
          onTriggerBuild={() => void handleTriggerBuild()}
        />
      )}

      {activeTab === 'card' && (
        <AgentCardTab agentCard={agentCard} loading={loading} />
      )}

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Agent</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete agent <strong>{displayName}</strong> ({agent.namespace}/
            {agent.name})? This will remove the Kagenti deployment and its
            lifecycle config entry. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

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
