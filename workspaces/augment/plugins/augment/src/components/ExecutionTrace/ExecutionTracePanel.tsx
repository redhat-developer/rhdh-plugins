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

import { useState, useMemo, memo } from 'react';
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
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { useTheme, alpha } from '@mui/material/styles';
import type { StreamingState } from '../StreamingMessage/StreamingMessage.types';
import { getAgentColor } from '../../utils/agentColors';

interface TraceSpan {
  id: string;
  label: string;
  type: 'reasoning' | 'tool' | 'handoff' | 'generation';
  status: 'running' | 'completed' | 'failed';
  agentName?: string;
  detail?: string;
  durationMs?: number;
}

function buildTraceSpans(state: StreamingState): TraceSpan[] {
  const spans: TraceSpan[] = [];

  if (state.reasoning || state.reasoningDuration) {
    spans.push({
      id: 'reasoning',
      label: 'Reasoning',
      type: 'reasoning',
      status: state.reasoningDuration ? 'completed' : 'running',
      durationMs: state.reasoningDuration
        ? state.reasoningDuration * 1000
        : undefined,
    });
  }

  for (const handoff of state.handoffs) {
    spans.push({
      id: `handoff-${handoff.from}-${handoff.to}`,
      label: `${handoff.from} → ${handoff.to}`,
      type: 'handoff',
      status: 'completed',
      agentName: handoff.to,
      detail: handoff.reason,
    });
  }

  for (const tc of state.toolCalls) {
    const failed = tc.status === 'failed' || !!tc.error;
    const completed = tc.status === 'completed' || !!tc.output || failed;
    spans.push({
      id: `tool-${tc.id}`,
      label: tc.name || tc.type || 'tool',
      type: 'tool',
      // eslint-disable-next-line no-nested-ternary
      status: failed ? 'failed' : completed ? 'completed' : 'running',
      detail: tc.serverLabel,
    });
  }

  if (state.text && state.phase !== 'completed') {
    spans.push({
      id: 'generation',
      label: 'Generating response',
      type: 'generation',
      status: 'running',
    });
  } else if (state.text && state.completed) {
    spans.push({
      id: 'generation',
      label: 'Response generated',
      type: 'generation',
      status: 'completed',
    });
  }

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
      return <HourglassEmptyIcon sx={sx} />;
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

function TraceSpanRow({ span }: { span: TraceSpan }) {
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
          flex: 1,
          fontSize: '0.7rem',
          fontWeight: 500,
          color: 'text.primary',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
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
      {span.durationMs !== undefined && (
        <Typography
          variant="caption"
          sx={{ fontSize: '0.6rem', color: 'text.disabled', flexShrink: 0 }}
        >
          {span.durationMs >= 1000
            ? `${(span.durationMs / 1000).toFixed(1)}s`
            : `${Math.round(span.durationMs)}ms`}
        </Typography>
      )}
      {span.detail && (
        <Tooltip title={span.detail} placement="left">
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.55rem',
              color: 'text.disabled',
              maxWidth: 80,
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
}

export const ExecutionTracePanel = memo(function ExecutionTracePanel({
  streamingState,
  lastCompletedState,
}: ExecutionTracePanelProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  const activeState = streamingState || lastCompletedState;
  const spans = useMemo(
    () => (activeState ? buildTraceSpans(activeState) : []),
    [activeState],
  );

  if (spans.length === 0) return null;

  const runningCount = spans.filter(s => s.status === 'running').length;
  const completedCount = spans.filter(s => s.status === 'completed').length;
  const failedCount = spans.filter(s => s.status === 'failed').length;

  return (
    <Box
      sx={{
        mx: { xs: 2, sm: 3, md: 4 },
        mb: 0.5,
        borderRadius: 1.5,
        border: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
        overflow: 'hidden',
        backgroundColor: alpha(theme.palette.background.paper, 0.5),
      }}
    >
      <Box
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={`Execution trace: ${spans.length} steps`}
        onClick={() => setExpanded(prev => !prev)}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded(prev => !prev);
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
            <TraceSpanRow key={span.id} span={span} />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
});
