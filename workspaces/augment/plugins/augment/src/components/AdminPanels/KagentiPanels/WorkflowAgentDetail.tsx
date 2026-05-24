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
import {
  getLifecycleTransition,
  getLifecycleStep,
} from './lifecycleTransitions';
import { useApi, configApiRef, fetchApiRef } from '@backstage/core-plugin-api';
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

type DetailTab = 'overview' | 'test';

const LIFECYCLE_STAGES = ['Draft', 'Pending', 'Published', 'Archived'];

export interface WorkflowAgentDetailProps {
  agentId: string;
  onBack: () => void;
  onChatWithAgent?: (agentId: string) => void;
}

/**
 * Detail view for workflow-builder agents (created via the no-code UI
 * with the Responses API). Mirrors the structure and styling of
 * AgentLifecycleDetail but without Kagenti-specific tabs (Build,
 * Design, Agent Card) since those are for Kagenti-managed agents.
 */
export function WorkflowAgentDetail({
  agentId,
  onBack,
  onChatWithAgent,
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
                label={
                  agent.framework === 'workflow-builder'
                    ? 'Workflow Agent'
                    : 'Responses API'
                }
                size="small"
                variant="outlined"
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
              {agent.framework === 'workflow-builder'
                ? 'Workflow Agent (No-Code Builder)'
                : 'Responses API Agent'}
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

function InlineAgentChat({
  agentId,
  agentName,
}: {
  agentId: string;
  agentName: string;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const configApi = useApi(configApiRef);
  const { fetch: authFetch } = useApi(fetchApiRef);
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: 'user' | 'agent'; text: string }>
  >([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();

  const handleSend = useCallback(async () => {
    if (!input.trim() || sending) return;
    const userMsg = input.trim();
    setInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setSending(true);
    try {
      const backendUrl = configApi.getString('backend.baseUrl');
      const resp = await authFetch(`${backendUrl}/api/augment/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userMsg }],
          model: agentId,
          sessionId,
        }),
      });
      if (!resp.ok) {
        const errText = await resp.text().catch(() => `HTTP ${resp.status}`);
        throw new Error(errText || `HTTP ${resp.status}`);
      }
      const data = await resp.json();
      const content =
        data?.choices?.[0]?.message?.content ||
        data?.content ||
        data?.message ||
        JSON.stringify(data);
      setChatMessages(prev => [...prev, { role: 'agent', text: content }]);
      if (data?.sessionId) setSessionId(data.sessionId);
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        {
          role: 'agent',
          text: `Error: ${err instanceof Error ? err.message : 'Failed to reach agent'}`,
        },
      ]);
    } finally {
      setSending(false);
    }
  }, [agentId, input, sending, sessionId, configApi, authFetch]);

  return (
    <Box
      sx={{
        height: 420,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: isDark
          ? alpha(theme.palette.background.paper, 0.4)
          : theme.palette.background.paper,
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        {chatMessages.length === 0 && (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="body2" color="text.disabled">
              Send a message to test {agentName}
            </Typography>
          </Box>
        )}
        {chatMessages.map((msg, i) => (
          <Box
            key={i}
            sx={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              px: 2,
              py: 1,
              borderRadius: 2,
              bgcolor:
                msg.role === 'user'
                  ? alpha(theme.palette.primary.main, isDark ? 0.2 : 0.1)
                  : alpha(theme.palette.background.default, isDark ? 0.6 : 0.8),
              border:
                msg.role === 'agent'
                  ? `1px solid ${alpha(theme.palette.divider, 0.3)}`
                  : undefined,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.85rem',
                color: 'text.primary',
                whiteSpace: 'pre-wrap',
              }}
            >
              {msg.text}
            </Typography>
          </Box>
        ))}
        {sending && (
          <Box sx={{ alignSelf: 'flex-start', px: 2, py: 1 }}>
            <Typography
              variant="body2"
              color="text.disabled"
              sx={{ fontStyle: 'italic' }}
            >
              {agentName} is thinking...
            </Typography>
          </Box>
        )}
      </Box>
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          p: 1.5,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={`Message ${agentName}...`}
          disabled={sending}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: theme.palette.text.primary,
            fontSize: '0.875rem',
            padding: '8px 12px',
            borderRadius: 8,
            backgroundColor: alpha(
              theme.palette.background.default,
              isDark ? 0.5 : 0.8,
            ),
          }}
        />
        <Button
          variant="contained"
          size="small"
          onClick={handleSend}
          disabled={!input.trim() || sending}
          sx={{
            textTransform: 'none',
            borderRadius: 2,
            minWidth: 60,
            boxShadow: 'none',
          }}
        >
          Send
        </Button>
      </Box>
    </Box>
  );
}
