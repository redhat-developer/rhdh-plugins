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

import { useState, useCallback, useEffect } from 'react';
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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChatIcon from '@mui/icons-material/Chat';
import PublishIcon from '@mui/icons-material/Publish';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useApi, configApiRef, fetchApiRef } from '@backstage/core-plugin-api';
import type { KagentiAgentSummary } from '@red-hat-developer-hub/backstage-plugin-augment-common';
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

type LifecycleTab = 'overview' | 'design' | 'test' | 'build' | 'card';

const LIFECYCLE_STAGES = ['Draft', 'In Review', 'Published'];

function getLifecycleStep(_status: string, lifecycleStage?: string | null): number {
  if (lifecycleStage === 'deployed') return 2;
  if (lifecycleStage === 'registered') return 1;
  return 0;
}

export interface AgentLifecycleDetailProps {
  agent: KagentiAgentSummary;
  onBack: () => void;
  onChatWithAgent?: (agentId: string) => void;
}

/**
 * Agent Detail view structured around the development lifecycle.
 * Tabs: Overview | Design | Test | Build | Agent Card
 */
export function AgentLifecycleDetail({
  agent,
  onBack,
  onChatWithAgent,
}: AgentLifecycleDetailProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const api = useApi(augmentApiRef);
  const [activeTab, setActiveTab] = useState<LifecycleTab>('overview');

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

  const [lifecycleStage, setLifecycleStage] = useState<string | null>(null);
  const isPublished = lifecycleStage === 'deployed';
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishToast, setPublishToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.listAgents().then(agents => {
      if (cancelled) return;
      const match = agents.find(a => a.id === agentId);
      if (match) setLifecycleStage(match.lifecycleStage ?? 'draft');
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [api, agentId]);

  const handleTogglePublish = useCallback(async () => {
    setPublishLoading(true);
    try {
      if (isPublished) {
        const result = await api.demoteAgent(agentId, 'draft');
        setLifecycleStage(result.lifecycleStage);
        setPublishToast('Agent withdrawn from marketplace');
      } else if (lifecycleStage === 'draft') {
        const result = await api.promoteAgent(agentId, 'registered');
        setLifecycleStage(result.lifecycleStage);
        setPublishToast('Agent submitted for review — Agent Ops will approve and publish it');
      }
    } catch (err) {
      setPublishToast(`Failed: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setPublishLoading(false);
    }
  }, [api, agentId, isPublished, lifecycleStage]);

  const currentStep = getLifecycleStep(agent.status, lifecycleStage);
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
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, fontSize: typeScale.pageTitle.fontSize, color: 'text.primary' }}
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
                  sx={{ height: 22, fontSize: '0.7rem', textTransform: 'capitalize' }}
                />
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="caption" color="text.secondary">
                {agent.namespace}
              </Typography>
              {agent.labels?.framework && (
                <Chip label={agent.labels.framework} size="small" variant="outlined" color="info" sx={{ height: 22, fontSize: '0.7rem' }} />
              )}
              {agent.labels?.protocol && (
                <Chip label={[agent.labels.protocol].flat().join(', ').toUpperCase()} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
              )}
            </Box>
          </Box>

          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0 }}>
            {lifecycleStage === 'draft' && (
              <Tooltip title="Submit this agent for review by Agent Ops before it can be published to the Marketplace">
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  startIcon={publishLoading ? <CircularProgress size={14} /> : <PublishIcon />}
                  disabled={publishLoading}
                  onClick={handleTogglePublish}
                  sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', borderRadius: borderRadius.sm }}
                >
                  Submit for Review
                </Button>
              </Tooltip>
            )}
            {lifecycleStage === 'registered' && (
              <Chip
                label="Pending Review"
                size="small"
                color="warning"
                variant="filled"
                sx={{ fontWeight: 600 }}
              />
            )}
            {isPublished && (
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                startIcon={publishLoading ? <CircularProgress size={14} /> : <CloudOffIcon />}
                disabled={publishLoading}
                onClick={handleTogglePublish}
                sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', borderRadius: borderRadius.sm }}
              >
                Withdraw
              </Button>
            )}
            {hasBuild && (
              <Tooltip title="Trigger a new container image build">
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PlayArrowIcon />}
                  disabled={buildTriggering}
                  onClick={() => void handleTriggerBuild()}
                  sx={{ textTransform: 'none', borderRadius: borderRadius.sm }}
                >
                  {buildTriggering ? 'Building...' : 'Rebuild'}
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

      {activeTab === 'card' && <AgentCardTab agentCard={agentCard} loading={loading} />}

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

// ---------------------------------------------------------------------------
// Inline chat for the Test tab
// ---------------------------------------------------------------------------

function InlineAgentChat({ agentId, agentName }: { agentId: string; agentName: string }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const configApi = useApi(configApiRef);
  const { fetch: authFetch } = useApi(fetchApiRef);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'agent'; text: string }>>([]);
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
      const data = await resp.json();
      const content = data?.choices?.[0]?.message?.content || data?.content || data?.message || JSON.stringify(data);
      setChatMessages(prev => [...prev, { role: 'agent', text: content }]);
      if (data?.sessionId) setSessionId(data.sessionId);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'agent', text: `Error: ${err instanceof Error ? err.message : 'Failed to reach agent'}` }]);
    } finally {
      setSending(false);
    }
  }, [agentId, input, sending, sessionId, configApi, authFetch]);

  return (
    <Box
      sx={{
        height: 420,
        border: `1px solid`,
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: isDark ? alpha(theme.palette.background.paper, 0.4) : theme.palette.background.paper,
      }}
    >
      {/* Messages area */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {chatMessages.length === 0 && (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
              bgcolor: msg.role === 'user'
                ? alpha(theme.palette.primary.main, isDark ? 0.2 : 0.1)
                : alpha(theme.palette.background.default, isDark ? 0.6 : 0.8),
              border: msg.role === 'agent' ? `1px solid ${alpha(theme.palette.divider, 0.3)}` : undefined,
            }}
          >
            <Typography variant="body2" sx={{ fontSize: '0.85rem', color: 'text.primary', whiteSpace: 'pre-wrap' }}>
              {msg.text}
            </Typography>
          </Box>
        ))}
        {sending && (
          <Box sx={{ alignSelf: 'flex-start', px: 2, py: 1 }}>
            <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
              {agentName} is thinking...
            </Typography>
          </Box>
        )}
      </Box>

      {/* Input area */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          p: 1.5,
          borderTop: `1px solid`,
          borderColor: 'divider',
        }}
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
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
            backgroundColor: alpha(theme.palette.background.default, isDark ? 0.5 : 0.8),
          }}
        />
        <Button
          variant="contained"
          size="small"
          onClick={handleSend}
          disabled={!input.trim() || sending}
          sx={{ textTransform: 'none', borderRadius: 2, minWidth: 60, boxShadow: 'none' }}
        >
          Send
        </Button>
      </Box>
    </Box>
  );
}
