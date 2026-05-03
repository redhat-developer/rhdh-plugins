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

import { useEffect, useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useApi } from '@backstage/core-plugin-api';
import type { ChatAgent, KagentiToolSummary } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { augmentApiRef } from '../../api';
import { StatusBar } from './StatusBar';
import { MetricTile } from './MetricTile';
import { HealthMosaic } from './HealthMosaic';
import { statRowSx, sectionCardSx, pageTitleSx, pageSubtitleSx } from './commandcenter.styles';
import { STATUS_COLORS, LIFECYCLE_COLORS } from './commandcenter.constants';
import type { AdminPanel } from '../../hooks';

interface OpsOverviewProps {
  namespace?: string;
  onNavigate?: (panel: AdminPanel) => void;
}

/**
 * Command Center Overview -- the first thing Agent Ops sees.
 * Answers: "What needs my attention?" with actionable metrics.
 */
export function OpsOverview({ namespace, onNavigate }: OpsOverviewProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const api = useApi(augmentApiRef);

  const [agents, setAgents] = useState<ChatAgent[]>([]);
  const [tools, setTools] = useState<KagentiToolSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.listAgents().catch(() => []),
      api.listKagentiTools(namespace).then(r => r.tools ?? []).catch(() => []),
    ]).then(([a, t]) => {
      if (!cancelled) { setAgents(a as ChatAgent[]); setTools(t); }
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [api, namespace]);

  const stats = useMemo(() => {
    const total = agents.length;
    const ready = agents.filter(a => a.status?.toLowerCase() === 'ready').length;
    const pendingReview = agents.filter(a => a.lifecycleStage === 'registered').length;
    const deployed = agents.filter(a => a.lifecycleStage === 'deployed').length;
    const readyTools = tools.filter(t => t.status?.toLowerCase() === 'ready').length;
    const allHealthy = total > 0 && ready === total;
    return { total, ready, pendingReview, deployed, readyTools, totalTools: tools.length, allHealthy };
  }, [agents, tools]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', minWidth: 0, overflow: 'hidden' }}>
      {/* Header */}
      <Box>
        <Typography sx={pageTitleSx(theme)}>Overview</Typography>
        <Typography sx={pageSubtitleSx(theme)}>
          Platform health and operational status at a glance.
        </Typography>
      </Box>

      {/* Status Bar */}
      {!loading && (
        <StatusBar
          ready={stats.ready}
          total={stats.total}
          pendingReview={stats.pendingReview}
        />
      )}

      {/* Metric Tiles */}
      <Box sx={statRowSx()}>
        <MetricTile
          label="Agents"
          value={loading ? '...' : stats.total}
          icon={<HubOutlinedIcon />}
          color={theme.palette.primary.main}
          loading={loading}
        />
        <MetricTile
          label="Ready"
          value={loading ? '...' : `${stats.ready}/${stats.total}`}
          icon={stats.allHealthy ? <CheckCircleIcon /> : <WarningAmberIcon />}
          color={stats.allHealthy ? STATUS_COLORS.healthy : STATUS_COLORS.warning}
          loading={loading}
          glow={!stats.allHealthy && stats.total > 0}
        />
        <MetricTile
          label="Published"
          value={loading ? '...' : stats.deployed}
          icon={<CheckCircleIcon />}
          color={LIFECYCLE_COLORS.deployed}
          loading={loading}
        />
        <MetricTile
          label="Queue"
          value={loading ? '...' : stats.pendingReview}
          color={stats.pendingReview > 0 ? LIFECYCLE_COLORS.registered : STATUS_COLORS.neutral}
          loading={loading}
          glow={stats.pendingReview > 0}
          onClick={() => onNavigate?.('ops-review-queue' as AdminPanel)}
        />
      </Box>

      {/* Health Mosaic -- fleet heatmap */}
      {!loading && (
        <Box sx={sectionCardSx(theme, isDark)}>
          <HealthMosaic agents={agents} />
        </Box>
      )}
    </Box>
  );
}
