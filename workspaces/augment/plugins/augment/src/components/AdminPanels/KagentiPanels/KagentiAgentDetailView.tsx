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
import { useTheme } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ChatIcon from '@mui/icons-material/Chat';
import PublishIcon from '@mui/icons-material/Publish';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import { useApi } from '@backstage/core-plugin-api';
import type { KagentiAgentSummary } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { normalizeLifecycleStage } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { augmentApiRef } from '../../../api';
import { statusChipColor as statusColor } from './kagentiDisplayUtils';
import { AgentDetailsTab } from './AgentDetailsTab';
import { AgentStatusTab } from './AgentStatusTab';
import { AgentResourceTab } from './AgentResourceTab';
import { AgentCardTab } from './AgentCardTab';
import {
  CONTENT_MAX_WIDTH,
  PAGE_TITLE_SX,
} from '../shared/commandCenterStyles';
import { useKagentiAgentDetail } from './useKagentiAgentDetail';

export interface KagentiAgentDetailViewProps {
  agent: KagentiAgentSummary;
  onBack: () => void;
  onChatWithAgent?: (agentId: string) => void;
}

export function KagentiAgentDetailView({
  agent,
  onBack,
  onChatWithAgent,
}: KagentiAgentDetailViewProps) {
  const theme = useTheme();
  const api = useApi(augmentApiRef);
  const [tab, setTab] = useState(0);

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
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishToast, setPublishToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .listAgents()
      .then(agents => {
        if (cancelled) return;
        const match = agents.find(a => a.id === agentId);
        setLifecycleStage(normalizeLifecycleStage(match?.lifecycleStage));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [api, agentId]);

  const nextTransition = useMemo(() => {
    const stage = lifecycleStage ?? 'draft';
    const promoteIcon = <PublishIcon />;
    const demoteIcon = <CloudOffIcon />;
    const map: Record<
      string,
      {
        target: import('@red-hat-developer-hub/backstage-plugin-augment-common').AgentLifecycleStage;
        label: string;
        action: 'promote' | 'demote';
        variant: 'outlined' | 'contained';
        color: 'inherit' | 'primary' | 'success';
        icon: React.ReactNode;
      }
    > = {
      draft: {
        target: 'review',
        label: 'Submit for Review',
        action: 'promote',
        variant: 'contained',
        color: 'primary',
        icon: promoteIcon,
      },
      review: {
        target: 'staging',
        label: 'Approve to Staging',
        action: 'promote',
        variant: 'contained',
        color: 'primary',
        icon: promoteIcon,
      },
      staging: {
        target: 'production',
        label: 'Promote to Production',
        action: 'promote',
        variant: 'contained',
        color: 'success',
        icon: promoteIcon,
      },
      production: {
        target: 'staging',
        label: 'Rollback to Staging',
        action: 'demote',
        variant: 'outlined',
        color: 'inherit',
        icon: demoteIcon,
      },
      retired: {
        target: 'draft',
        label: 'Reactivate',
        action: 'demote',
        variant: 'outlined',
        color: 'inherit',
        icon: demoteIcon,
      },
    };
    return map[stage] ?? map.draft;
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

  return (
    <Box sx={{ maxWidth: CONTENT_MAX_WIDTH, width: '100%', minWidth: 0 }}>
      <Button
        size="small"
        startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
        onClick={onBack}
        sx={{
          textTransform: 'none',
          mb: 1,
          color: theme.palette.primary.main,
          '&:hover': { color: theme.palette.primary.dark },
        }}
      >
        Agents &rsaquo; {agent.name}
      </Button>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 2,
          mb: 3,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}
          >
            <Typography variant="h5" sx={PAGE_TITLE_SX}>
              {displayName}
            </Typography>
            <Chip
              label={agent.status}
              size="small"
              color={statusColor(agent.status)}
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
            {agent.labels?.protocol && (
              <Chip
                label={[agent.labels.protocol].flat().join(', ').toUpperCase()}
                size="small"
                variant="outlined"
                sx={{ height: 24, fontSize: '0.75rem', fontWeight: 600 }}
              />
            )}
            {agent.labels?.framework && (
              <Chip
                label={agent.labels.framework}
                size="small"
                variant="outlined"
                color="info"
                sx={{ height: 24, fontSize: '0.75rem', fontWeight: 600 }}
              />
            )}
            {agent.workloadType && (
              <Chip
                label={agent.workloadType}
                size="small"
                variant="outlined"
                sx={{ height: 24, fontSize: '0.75rem' }}
              />
            )}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', pt: 0.5 }}>
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
            sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}
          >
            {nextTransition.label}
          </Button>
          {hasBuild && (
            <Button
              size="small"
              variant="text"
              startIcon={<PlayArrowIcon />}
              disabled={buildTriggering}
              onClick={() => void handleTriggerBuild()}
              sx={{
                textTransform: 'none',
                color: theme.palette.text.secondary,
                '&:hover': { color: theme.palette.text.primary },
              }}
            >
              {buildTriggering ? 'Building...' : 'Rebuild'}
            </Button>
          )}
          {onChatWithAgent && (
            <Button
              size="small"
              variant="contained"
              startIcon={<ChatIcon />}
              onClick={() => onChatWithAgent(agentId)}
              sx={{ textTransform: 'none' }}
            >
              Chat
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            minHeight: 40,
            '& .MuiTabs-flexContainer': {
              display: 'flex',
              flexDirection: 'row',
              gap: 0,
            },
            '& .MuiTab-root': {
              display: 'inline-flex',
              minHeight: 40,
              minWidth: 'auto',
              px: 2,
              textTransform: 'none',
              fontSize: '0.875rem',
            },
          }}
        >
          <Tab label="Details" />
          <Tab label="Agent Card" />
          <Tab label="Status" />
          <Tab label="Resource" />
        </Tabs>
      </Box>

      {tab === 0 && (
        <AgentDetailsTab
          agent={agent}
          agentDetail={agentDetail}
          loading={loading}
          routeStatus={routeStatus}
          copied={copied}
          onCopy={handleCopy}
        />
      )}

      {tab === 1 && <AgentCardTab agentCard={agentCard} loading={loading} />}

      {tab === 2 && (
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

      {tab === 3 && (
        <AgentResourceTab
          agentDetail={agentDetail}
          loading={loading}
          copied={copied}
          onCopy={handleCopy}
        />
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
