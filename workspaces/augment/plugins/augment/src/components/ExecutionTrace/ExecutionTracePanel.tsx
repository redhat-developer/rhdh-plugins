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

import { useState, useMemo, useRef, useEffect, useCallback, memo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Collapse from '@mui/material/Collapse';
import Tooltip from '@mui/material/Tooltip';
import TimelineIcon from '@mui/icons-material/Timeline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PsychologyIcon from '@mui/icons-material/Psychology';
import BuildIcon from '@mui/icons-material/Build';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { useTheme, alpha } from '@mui/material/styles';
import type {
  StreamingState,
  ReasoningSpanInfo,
} from '../StreamingMessage/StreamingMessage.types';
import { getAgentColor } from '../../utils/agentColors';
import { useChatViewMode } from '../../hooks/useChatViewMode';

/** @internal Exported for testing. */
export interface TraceSpan {
  id: string;
  label: string;
  type: 'reasoning' | 'tool' | 'handoff' | 'generation';
  status: 'running' | 'completed' | 'failed';
  agentName?: string;
  detail?: string;
  startedAt?: number;
  endedAt?: number;
  durationMs?: number;
}

function buildReasoningSpan(rs: ReasoningSpanInfo, idx: number): TraceSpan {
  return {
    id: `reasoning-${idx}`,
    label: rs.agentName ? `${rs.agentName} reasoning` : 'Reasoning',
    type: 'reasoning',
    status: 'completed',
    agentName: rs.agentName,
    startedAt: rs.startedAt,
    endedAt: rs.endedAt,
    durationMs: rs.durationMs,
  };
}

function getToolStatus(
  failed: boolean,
  completed: boolean,
): TraceSpan['status'] {
  if (failed) return 'failed';
  if (completed) return 'completed';
  return 'running';
}

/** @internal Exported for testing. */
export function buildTraceSpans(state: StreamingState): TraceSpan[] {
  const spans: TraceSpan[] = [];

  // 1. Completed reasoning spans (preserved across handoffs)
  state.reasoningSpans.forEach((rs, idx) => {
    spans.push(buildReasoningSpan(rs, idx));
  });

  // 2. Current in-progress reasoning (not yet snapshotted)
  if (state.reasoning && state.reasoningStartTime) {
    const durationMs = state.reasoningDuration
      ? state.reasoningDuration * 1000
      : Date.now() - state.reasoningStartTime;
    spans.push({
      id: `reasoning-${state.reasoningSpans.length}`,
      label: state.currentAgent
        ? `${state.currentAgent} reasoning`
        : 'Reasoning',
      type: 'reasoning',
      status: state.reasoningDuration ? 'completed' : 'running',
      agentName: state.currentAgent,
      startedAt: state.reasoningStartTime,
      durationMs,
    });
  }

  // 3. Tool calls
  for (const tc of state.toolCalls) {
    const failed = tc.status === 'failed' || !!tc.error;
    const completed = tc.status === 'completed' || !!tc.output || failed;
    let durationMs: number | undefined;
    if (tc.startedAt && tc.endedAt) {
      durationMs = tc.endedAt - tc.startedAt;
    } else if (tc.startedAt && !completed) {
      durationMs = Date.now() - tc.startedAt;
    }
    spans.push({
      id: `tool-${tc.id}`,
      label: tc.name || tc.type || 'tool',
      type: 'tool',
      status: getToolStatus(failed, completed),
      detail: tc.serverLabel,
      startedAt: tc.startedAt,
      endedAt: tc.endedAt,
      durationMs,
    });
  }

  // 4. Handoffs
  state.handoffs.forEach((handoff, idx) => {
    spans.push({
      id: `handoff-${idx}-${handoff.to}`,
      label: handoff.from
        ? `${handoff.from} \u2192 ${handoff.to}`
        : `\u2192 ${handoff.to}`,
      type: 'handoff',
      status: 'completed',
      agentName: handoff.to,
      detail: handoff.reason,
      startedAt: handoff.timestamp,
    });
  });

  // 5. Generation span with timing data
  if (state.text && !state.completed) {
    const genDurationMs = state.textStartedAt
      ? Date.now() - state.textStartedAt
      : undefined;
    spans.push({
      id: 'generation',
      label: 'Generating response',
      type: 'generation',
      status: 'running',
      startedAt: state.textStartedAt,
      durationMs: genDurationMs,
    });
  } else if (state.text && state.completed) {
    const genDurationMs = state.textStartedAt
      ? Date.now() - state.textStartedAt
      : undefined;
    spans.push({
      id: 'generation',
      label: 'Response generated',
      type: 'generation',
      status: 'completed',
      startedAt: state.textStartedAt,
      durationMs: genDurationMs,
    });
  }

  // 6. Sort all spans chronologically by startedAt
  spans.sort((a, b) => {
    if (a.startedAt === undefined && b.startedAt === undefined) return 0;
    if (a.startedAt === undefined) return 1;
    if (b.startedAt === undefined) return -1;
    return a.startedAt - b.startedAt;
  });

  return spans;
}

function SpanIcon({ type }: { type: TraceSpan['type'] }) {
  const sx = { fontSize: 14 };
  switch (type) {
    case 'reasoning':
      return <PsychologyIcon sx={sx} />;
    case 'tool':
      return <BuildIcon sx={sx} />;
    case 'handoff':
      return <SwapHorizIcon sx={sx} />;
    case 'generation':
      return <EditIcon sx={sx} />;
    default:
      return null;
  }
}

function StatusIcon({ status }: { status: TraceSpan['status'] }) {
  switch (status) {
    case 'completed':
      return (
        <CheckCircleOutlineIcon sx={{ fontSize: 12, color: 'success.main' }} />
      );
    case 'failed':
      return <ErrorOutlineIcon sx={{ fontSize: 12, color: 'error.main' }} />;
    case 'running':
      return (
        <HourglassEmptyIcon
          sx={{
            fontSize: 12,
            color: 'info.main',
            animation: 'spin 1.5s linear infinite',
            '@keyframes spin': {
              '100%': { transform: 'rotate(360deg)' },
            },
          }}
        />
      );
    default:
      return null;
  }
}

function formatDuration(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
}

function DurationBar({ span, totalMs }: { span: TraceSpan; totalMs: number }) {
  const theme = useTheme();
  if (!span.durationMs || !totalMs) return null;

  const widthPct = Math.max(2, (span.durationMs / totalMs) * 100);
  const colorMap: Record<string, string> = {
    reasoning: theme.palette.info.main,
    tool: theme.palette.warning.main,
    handoff: theme.palette.secondary.main,
    generation: theme.palette.success.main,
  };
  const color = colorMap[span.type] || theme.palette.primary.main;

  return (
    <Box
      sx={{
        height: 3,
        borderRadius: 1.5,
        bgcolor: alpha(color, 0.35),
        width: `${widthPct}%`,
        minWidth: 4,
        transition: 'width 0.3s ease',
      }}
    />
  );
}

function TraceSpanRow({ span, totalMs }: { span: TraceSpan; totalMs: number }) {
  const theme = useTheme();
  const agentColor = span.agentName
    ? getAgentColor(span.agentName, theme.palette.mode)
    : null;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        py: 0.375,
        px: 1,
        borderRadius: 0.5,
        '&:hover': {
          backgroundColor: alpha(theme.palette.action.hover, 0.5),
        },
      }}
    >
      <Box sx={{ color: 'text.secondary', display: 'flex' }}>
        <SpanIcon type={span.type} />
      </Box>
      <Typography
        variant="caption"
        sx={{
          fontSize: '0.7rem',
          fontWeight: 500,
          color: 'text.primary',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minWidth: 60,
          maxWidth: 120,
          flexShrink: 0,
        }}
      >
        {span.label}
      </Typography>
      {agentColor && (
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: agentColor.fg,
            flexShrink: 0,
          }}
        />
      )}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', px: 0.5 }}>
        <DurationBar span={span} totalMs={totalMs} />
      </Box>
      {span.durationMs !== undefined && (
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.6rem',
            color: 'text.disabled',
            flexShrink: 0,
            fontFamily: 'monospace',
            minWidth: 36,
            textAlign: 'right',
          }}
        >
          {formatDuration(span.durationMs)}
        </Typography>
      )}
      {span.detail && (
        <Tooltip title={span.detail} placement="left">
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.55rem',
              color: 'text.disabled',
              maxWidth: 70,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {span.detail}
          </Typography>
        </Tooltip>
      )}
      <StatusIcon status={span.status} />
    </Box>
  );
}

interface ExecutionTracePanelProps {
  streamingState: StreamingState | null;
  lastCompletedState?: StreamingState | null;
  isStreaming?: boolean;
}

export const ExecutionTracePanel = memo(function ExecutionTracePanel({
  streamingState,
  lastCompletedState,
  isStreaming: isStreamingProp,
}: ExecutionTracePanelProps) {
  const theme = useTheme();
  const { isDev } = useChatViewMode();
  const [expanded, setExpanded] = useState(false);
  const manualOverrideRef = useRef(false);

  const isStreaming = streamingState !== null;
  const prevStreamingRef = useRef(isStreaming);

  useEffect(() => {
    const wasStreaming = prevStreamingRef.current;
    prevStreamingRef.current = isStreaming;

    if (isStreaming && !wasStreaming) {
      manualOverrideRef.current = false;
      setExpanded(true);
    }
    if (!isStreaming && wasStreaming && !manualOverrideRef.current) {
      setExpanded(false);
    }
  }, [isStreaming]);

  const toggleExpanded = useCallback(() => {
    setExpanded(prev => {
      if (isStreaming) manualOverrideRef.current = true;
      return !prev;
    });
  }, [isStreaming]);

  const activeState = streamingState || lastCompletedState;
  const spans = useMemo(
    () => (activeState ? buildTraceSpans(activeState) : []),
    [activeState],
  );

  // Only show in dev mode
  if (!isDev || spans.length === 0) return null;

  const runningCount = spans.filter(s => s.status === 'running').length;
  const completedCount = spans.filter(s => s.status === 'completed').length;
  const failedCount = spans.filter(s => s.status === 'failed').length;
  const totalMs = spans.reduce((max, s) => Math.max(max, s.durationMs || 0), 0);

  return (
    <Box
      sx={{
        mb: 0.5,
        mt: 1,
        borderRadius: 1.5,
        border: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
        overflow: 'hidden',
        backgroundColor: alpha(theme.palette.background.paper, 0.85),
        backdropFilter: 'blur(8px)',
        ...(isStreamingProp && {
          position: 'sticky' as const,
          bottom: 0,
          zIndex: 5,
        }),
      }}
    >
      <Box
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={`Execution trace: ${spans.length} steps`}
        onClick={toggleExpanded}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleExpanded();
          }
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.25,
          py: 0.5,
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: alpha(theme.palette.action.hover, 0.3),
          },
        }}
      >
        <TimelineIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.7rem',
            fontWeight: 500,
            color: 'text.secondary',
            flex: 1,
          }}
        >
          Execution Trace
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          {runningCount > 0 && (
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.6rem',
                color: 'info.main',
                fontWeight: 600,
              }}
            >
              {runningCount} active
            </Typography>
          )}
          {completedCount > 0 && (
            <Typography
              variant="caption"
              sx={{ fontSize: '0.6rem', color: 'success.main' }}
            >
              {completedCount} done
            </Typography>
          )}
          {failedCount > 0 && (
            <Typography
              variant="caption"
              sx={{ fontSize: '0.6rem', color: 'error.main' }}
            >
              {failedCount} failed
            </Typography>
          )}
        </Box>
        {expanded ? (
          <ExpandLessIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
        ) : (
          <ExpandMoreIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
        )}
      </Box>

      <Collapse in={expanded}>
        <Box
          sx={{
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
            maxHeight: 200,
            overflow: 'auto',
            py: 0.25,
          }}
        >
          {spans.map(span => (
            <TraceSpanRow key={span.id} span={span} totalMs={totalMs} />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
});
