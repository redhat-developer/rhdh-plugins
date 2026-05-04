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

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useTheme, alpha } from '@mui/material/styles';
import {
  glassSurface,
  glassHoverGlow,
  borderRadius,
  transitions,
  typeScale,
  animations,
  staggerDelay,
  reducedMotion,
} from '../../../theme/tokens';
import type { KagentiAgentSummary } from '@red-hat-developer-hub/backstage-plugin-augment-common';

interface AgentCatalogCardProps {
  id: string;
  name: string;
  namespace?: string;
  description: string;
  status: string;
  labels: { protocol?: string | string[]; framework?: string };
  source: 'kagenti' | 'orchestration';
  agentRole?: string;
  createdAt?: string;
  kagentiAgent?: KagentiAgentSummary;
  index: number;
  onClick: () => void;
  onChat?: () => void;
  onDelete?: () => void;
}

function statusDot(status: string, palette: { success: { main: string }; warning: { main: string }; error: { main: string }; text: { disabled: string } }) {
  const s = status?.toLowerCase() ?? '';
  if (s === 'ready' || s === 'running') return palette.success.main;
  if (s === 'pending' || s === 'building' || s === 'not ready') return palette.warning.main;
  if (s === 'failed' || s === 'error') return palette.error.main;
  return palette.text.disabled;
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 0) return 'just now';
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/**
 * A visually rich agent card for the catalog grid view.
 * Shows status, framework, protocol badges, and quick actions.
 */
export function AgentCatalogCard({
  name,
  namespace,
  description,
  status,
  labels,
  source,
  agentRole,
  createdAt,
  index,
  onClick,
  onChat,
  onDelete,
}: AgentCatalogCardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const glass = glassSurface(theme, 6, isDark ? 0.55 : 0.8);
  const hoverGlow = glassHoverGlow(theme);
  const dotColor = statusDot(status, theme.palette);
  const isReady = status?.toLowerCase() === 'ready';

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter') onClick(); }}
      sx={{
        ...glass,
        ...animations.fadeSlideIn,
        animationDelay: staggerDelay(index, 40),
        animationFillMode: 'both',
        '@media (prefers-reduced-motion: reduce)': reducedMotion,
        borderRadius: borderRadius.lg,
        p: 2.5,
        cursor: 'pointer',
        transition: transitions.normal,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          ...hoverGlow,
          transform: 'translateY(-2px)',
        },
        '&:focus-visible': {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: -2,
        },
      }}
    >
      {/* Top row: status dot + name + quick actions */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        {/* Status indicator */}
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            bgcolor: dotColor,
            mt: 0.5,
            flexShrink: 0,
            boxShadow: isReady ? `0 0 8px ${alpha(dotColor, 0.6)}` : undefined,
            animation: isReady ? 'augmentPulse 2s infinite' : undefined,
            '@keyframes augmentPulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.5 },
            },
          }}
        />

        {/* Name and namespace */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle2"
            noWrap
            sx={{
              fontWeight: 700,
              fontSize: typeScale.body.fontSize,
              color: theme.palette.text.primary,
              lineHeight: 1.3,
            }}
          >
            {name}
          </Typography>
          {namespace && (
            <Typography
              variant="caption"
              noWrap
              sx={{ color: theme.palette.text.secondary, fontSize: typeScale.caption.fontSize }}
            >
              {namespace}
            </Typography>
          )}
        </Box>

        {/* Quick actions (stop propagation so card click doesn't fire) */}
        <Box
          sx={{ display: 'flex', gap: 0.25, flexShrink: 0 }}
          onClick={e => e.stopPropagation()}
        >
          {onChat && (
            <Tooltip title="Chat with agent">
              <IconButton size="small" onClick={onChat} aria-label="Chat">
                <ChatOutlinedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
          {source === 'kagenti' && onDelete && (
            <Tooltip title="Delete">
              <IconButton size="small" onClick={onDelete} aria-label="Delete">
                <DeleteOutlineIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Description */}
      <Typography
        variant="body2"
        sx={{
          color: theme.palette.text.secondary,
          fontSize: typeScale.bodySmall.fontSize,
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: '2.5em',
        }}
      >
        {description || 'No description'}
      </Typography>

      {/* Badges row */}
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 'auto' }}>
        <Chip
          label={status}
          size="small"
          sx={{
            height: 22,
            fontSize: '0.7rem',
            fontWeight: 600,
            bgcolor: alpha(dotColor, isDark ? 0.2 : 0.12),
            color: dotColor,
            border: 'none',
          }}
        />
        {labels?.framework && (
          <Chip
            label={labels.framework}
            size="small"
            variant="outlined"
            sx={{
              height: 22,
              fontSize: '0.7rem',
              borderColor: alpha(theme.palette.info.main, 0.4),
              color: theme.palette.info.main,
            }}
          />
        )}
        {labels?.protocol && (
          <Chip
            label={[labels.protocol].flat().join(', ').toUpperCase()}
            size="small"
            variant="outlined"
            sx={{
              height: 22,
              fontSize: '0.7rem',
              borderColor: alpha(theme.palette.primary.main, 0.4),
              color: theme.palette.primary.main,
            }}
          />
        )}
        {agentRole && (
          <Chip
            label={agentRole.charAt(0).toUpperCase() + agentRole.slice(1)}
            size="small"
            variant="outlined"
            sx={{
              height: 22,
              fontSize: '0.7rem',
              borderColor: alpha(theme.palette.secondary.main, 0.4),
              color: theme.palette.secondary.main,
            }}
          />
        )}
      </Box>

      {/* Footer: source + time */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography
          variant="caption"
          sx={{ color: alpha(theme.palette.text.secondary, 0.7), fontSize: '0.68rem' }}
        >
          {source === 'orchestration' ? 'Responses API' : 'Platform Agent'}
        </Typography>
        {createdAt && (
          <Typography
            variant="caption"
            sx={{ color: alpha(theme.palette.text.secondary, 0.6), fontSize: '0.68rem' }}
          >
            {timeAgo(createdAt)}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
