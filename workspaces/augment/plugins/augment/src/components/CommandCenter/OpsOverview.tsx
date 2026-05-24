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

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useTheme, alpha } from '@mui/material/styles';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ExtensionOutlinedIcon from '@mui/icons-material/ExtensionOutlined';
import { useApi } from '@backstage/core-plugin-api';
import type {
  ChatAgent,
  KagentiToolSummary,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { augmentApiRef } from '../../api';
import { OverviewHero } from './OverviewHero';
import { MetricTile } from './MetricTile';
import { HealthMosaic } from './HealthMosaic';
import { ActivityFeed } from './ActivityFeed';
import { statRowSx, sectionCardSx } from './commandcenter.styles';
import { STATUS_COLORS, LIFECYCLE_COLORS } from './commandcenter.constants';
import type { AdminPanel } from '../../hooks';

interface OpsOverviewProps {
  namespace?: string;
  onNavigate?: (panel: AdminPanel) => void;
}

/**
 * Command Center Overview -- the ops dashboard.
 * Rich visual hierarchy with hero ring, metric tiles, fleet health, activity, and quick actions.
 */
export function OpsOverview({ namespace, onNavigate }: OpsOverviewProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const api = useApi(augmentApiRef);

  const [agents, setAgents] = useState<ChatAgent[]>([]);
  const [tools, setTools] = useState<KagentiToolSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);

  const loadData = useCallback(() => {
    if (!initialLoadDone.current) {
      setLoading(true);
    }
    Promise.all([
      api.listAgents().catch(() => [] as ChatAgent[]),
      api
        .listKagentiTools(namespace)
        .then(r => r.tools ?? [])
        .catch(() => [] as KagentiToolSummary[]),
    ])
      .then(([a, t]) => {
        setAgents(a);
        setTools(t);
      })
      .finally(() => {
        initialLoadDone.current = true;
        setLoading(false);
      });
  }, [api, namespace]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30_000);
    return () => clearInterval(interval);
  }, [loadData]);

  const stats = useMemo(() => {
    const total = agents.length;
    const ready = agents.filter(
      a => a.status?.toLowerCase() === 'ready',
    ).length;
    const pendingReview = agents.filter(
      a => a.lifecycleStage === 'pending',
    ).length;
    const inStaging = agents.filter(a => a.lifecycleStage === 'pending').length;
    const production = agents.filter(
      a => a.lifecycleStage === 'published',
    ).length;
    const readyTools = tools.filter(
      t => t.status?.toLowerCase() === 'ready',
    ).length;
    const allHealthy = total > 0 && ready === total;
    return {
      total,
      ready,
      pendingReview,
      inStaging,
      production,
      readyTools,
      totalTools: tools.length,
      allHealthy,
    };
  }, [agents, tools]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        width: '100%',
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      {/* Hero -- health ring + status */}
      <OverviewHero
        ready={stats.ready}
        total={stats.total}
        pendingReview={stats.pendingReview}
        loading={loading}
      />

      {/* Metric Tiles -- 2x2 responsive grid */}
      <Box data-tour="metric-tiles" sx={statRowSx()}>
        <MetricTile
          label="Agents"
          value={loading ? '...' : stats.total}
          subtitle={
            stats.allHealthy
              ? 'All healthy'
              : `${stats.total - stats.ready} need attention`
          }
          icon={<HubOutlinedIcon />}
          color={theme.palette.primary.main}
          loading={loading}
        />
        <MetricTile
          label="Ready"
          value={loading ? '...' : `${stats.ready}/${stats.total}`}
          subtitle={
            stats.allHealthy
              ? 'Fleet fully operational'
              : `${stats.total - stats.ready} degraded`
          }
          icon={stats.allHealthy ? <CheckCircleIcon /> : <WarningAmberIcon />}
          color={
            stats.allHealthy ? STATUS_COLORS.healthy : STATUS_COLORS.warning
          }
          loading={loading}
          glow={!stats.allHealthy && stats.total > 0}
        />
        <MetricTile
          label="Production"
          value={loading ? '...' : stats.production}
          subtitle={
            stats.production > 0 ? 'Live in marketplace' : 'None in production'
          }
          icon={<CheckCircleIcon />}
          color={LIFECYCLE_COLORS.production}
          loading={loading}
        />
        <MetricTile
          label="Queue"
          value={loading ? '...' : stats.pendingReview}
          subtitle={
            stats.pendingReview > 0 ? 'Awaiting your approval' : 'All clear'
          }
          color={
            stats.pendingReview > 0
              ? LIFECYCLE_COLORS.review
              : STATUS_COLORS.neutral
          }
          loading={loading}
          glow={stats.pendingReview > 0}
          onClick={
            stats.pendingReview > 0
              ? () => onNavigate?.('ops-review-queue' as AdminPanel)
              : undefined
          }
        />
      </Box>

      {/* Bottom section -- two-column grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.5fr 1fr' },
          gap: 3,
        }}
      >
        {/* Left: Fleet Health */}
        {!loading && (
          <Box data-tour="fleet-health" sx={sectionCardSx(theme, isDark)}>
            <HealthMosaic agents={agents} />
          </Box>
        )}

        {/* Right: Activity + Quick Actions */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {!loading && (
            <Box sx={sectionCardSx(theme, isDark)}>
              <ActivityFeed agents={agents} />
            </Box>
          )}

          {/* Quick Actions */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {stats.pendingReview > 0 && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => onNavigate?.('ops-review-queue' as AdminPanel)}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  borderRadius: 2,
                  borderColor: alpha(LIFECYCLE_COLORS.review, 0.4),
                  color: LIFECYCLE_COLORS.review,
                  '&:hover': {
                    borderColor: LIFECYCLE_COLORS.review,
                    bgcolor: alpha(LIFECYCLE_COLORS.review, 0.08),
                  },
                }}
              >
                Review Queue ({stats.pendingReview})
              </Button>
            )}
            <Button
              size="small"
              variant="outlined"
              onClick={() => onNavigate?.('ops-platform' as AdminPanel)}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.72rem',
                borderRadius: 2,
                color: 'text.secondary',
                borderColor: alpha(
                  isDark
                    ? theme.palette.common.white
                    : theme.palette.common.black,
                  0.12,
                ),
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) },
              }}
            >
              Platform Config
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<ExtensionOutlinedIcon sx={{ fontSize: 14 }} />}
              onClick={() => onNavigate?.('kagenti-tools' as AdminPanel)}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.72rem',
                borderRadius: 2,
                color: 'text.secondary',
                borderColor: alpha(
                  isDark
                    ? theme.palette.common.white
                    : theme.palette.common.black,
                  0.12,
                ),
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) },
              }}
            >
              Tools ({stats.totalTools})
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
