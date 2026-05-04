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

import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme, alpha } from '@mui/material/styles';
import type { ChatAgent } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { STATUS_COLORS, LIFECYCLE_COLORS } from './commandcenter.constants';

interface ActivityItem {
  id: string;
  text: string;
  color: string;
  time?: string;
}

function relativeTime(iso?: string): string | undefined {
  if (!iso) return undefined;
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

interface ActivityFeedProps {
  agents: ChatAgent[];
}

/**
 * Recent activity timeline synthesized from agent data.
 * Shows lifecycle changes, deployments, and review submissions.
 */
export function ActivityFeed({ agents }: ActivityFeedProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const items = useMemo<ActivityItem[]>(() => {
    const feed: ActivityItem[] = [];

    const deployed = agents.filter(a => a.lifecycleStage === 'deployed');
    const registered = agents.filter(a => a.lifecycleStage === 'registered');
    const drafts = agents.filter(a => !a.lifecycleStage || a.lifecycleStage === 'draft');
    const ready = agents.filter(a => a.status?.toLowerCase() === 'ready');
    const notReady = agents.filter(a => a.status && a.status.toLowerCase() !== 'ready');

    if (registered.length > 0) {
      feed.push({
        id: 'review',
        text: `${registered.length} agent${registered.length > 1 ? 's' : ''} awaiting review`,
        color: LIFECYCLE_COLORS.registered,
      });
    }

    if (deployed.length > 0) {
      const recent = deployed.sort((a, b) => (b.promotedAt ?? '').localeCompare(a.promotedAt ?? '')).slice(0, 2);
      for (const a of recent) {
        feed.push({
          id: `deployed-${a.id}`,
          text: `${a.name} published to catalog`,
          color: LIFECYCLE_COLORS.deployed,
          time: relativeTime(a.promotedAt),
        });
      }
    }

    if (notReady.length > 0) {
      feed.push({
        id: 'not-ready',
        text: `${notReady.length} agent${notReady.length > 1 ? 's' : ''} not ready`,
        color: STATUS_COLORS.warning,
      });
    }

    if (ready.length > 0 && ready.length === agents.length) {
      feed.push({
        id: 'all-ready',
        text: 'All agents running healthy',
        color: STATUS_COLORS.healthy,
      });
    }

    if (drafts.length > 0) {
      const recent = drafts.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')).slice(0, 2);
      for (const a of recent) {
        feed.push({
          id: `draft-${a.id}`,
          text: `${a.name} created as draft`,
          color: STATUS_COLORS.neutral,
          time: relativeTime(a.createdAt),
        });
      }
    }

    return feed.slice(0, 6);
  }, [agents]);

  if (items.length === 0) return null;

  return (
    <Box>
      <Typography
        variant="subtitle2"
        sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.85rem', mb: 1.5 }}
      >
        Recent Activity
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {items.map(item => (
          <Box
            key={item.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              py: 0.75,
              px: 1.5,
              borderRadius: 1.5,
              bgcolor: alpha(item.color, isDark ? 0.04 : 0.02),
              border: `1px solid ${alpha(item.color, isDark ? 0.1 : 0.06)}`,
              transition: 'all 0.15s ease',
              '&:hover': {
                bgcolor: alpha(item.color, isDark ? 0.08 : 0.04),
              },
            }}
          >
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: item.color,
                flexShrink: 0,
              }}
            />
            <Typography sx={{ fontSize: '0.75rem', color: 'text.primary', flex: 1 }}>
              {item.text}
            </Typography>
            {item.time && (
              <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled', flexShrink: 0 }}>
                {item.time}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
