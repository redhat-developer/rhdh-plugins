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

import { useState, useEffect, useCallback, memo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useTheme, alpha } from '@mui/material/styles';
import { useStatus } from '../../hooks';
import { JsonTreeViewer } from './JsonTreeViewer';

interface SessionStateInspectorProps {
  activeSessionId?: string;
  messageCount?: number;
  currentAgent?: string;
  sessionState?: Record<string, unknown>;
  onRefreshState?: () => void;
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | number | undefined;
  mono?: boolean;
}) {
  if (value === undefined || value === '') return null;
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        py: 0.25,
        gap: 1,
      }}
    >
      <Typography
        variant="caption"
        sx={{ fontSize: '0.65rem', color: 'text.disabled', flexShrink: 0 }}
      >
        {label}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          fontSize: '0.65rem',
          color: 'text.secondary',
          fontFamily: mono ? 'monospace' : undefined,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textAlign: 'right',
          maxWidth: 160,
        }}
        title={typeof value === 'string' ? value : undefined}
      >
        {value}
      </Typography>
    </Box>
  );
}

export const SessionStateInspector = memo(function SessionStateInspector({
  activeSessionId,
  messageCount,
  currentAgent,
  sessionState,
  onRefreshState,
}: SessionStateInspectorProps) {
  const theme = useTheme();
  const { status, loading } = useStatus();
  const [expanded, setExpanded] = useState(false);
  const [stateExpanded, setStateExpanded] = useState(false);

  const providerId = status?.providerId;
  const providerConnected = status?.provider.connected;
  const model = status?.provider.model;

  useEffect(() => {
    if (stateExpanded && onRefreshState) {
      onRefreshState();
    }
    // Only fetch on first expand
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateExpanded]);

  const handleCopyState = useCallback(() => {
    if (sessionState) {
      window.navigator.clipboard.writeText(
        JSON.stringify(sessionState, null, 2),
      );
    }
  }, [sessionState]);

  const hasState = sessionState && Object.keys(sessionState).length > 0;

  return (
    <Box
      sx={{
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
        flexShrink: 0,
      }}
    >
      <Box
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label="Session state inspector"
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
          px: 1.5,
          py: 0.75,
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: alpha(theme.palette.action.hover, 0.3),
          },
        }}
      >
        <BugReportOutlinedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.7rem',
            fontWeight: 500,
            color: 'text.secondary',
            flex: 1,
          }}
        >
          Debug
        </Typography>
        {expanded ? (
          <ExpandLessIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
        ) : (
          <ExpandMoreIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
        )}
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ px: 1.5, pb: 1 }}>
          <InfoRow label="Session" value={activeSessionId} mono />
          <InfoRow
            label="Provider"
            value={loading ? 'loading\u2026' : providerId}
          />
          <InfoRow
            label="Status"
            value={
              // eslint-disable-next-line no-nested-ternary
              loading
                ? 'connecting'
                : providerConnected
                  ? 'connected'
                  : 'disconnected'
            }
          />
          <InfoRow label="Model" value={model} mono />
          <InfoRow label="Messages" value={messageCount} />
          <InfoRow label="Active Agent" value={currentAgent} />

          {/* Session State JSON Tree */}
          <Box
            sx={{
              mt: 0.75,
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              pt: 0.5,
            }}
          >
            <Box
              role="button"
              tabIndex={0}
              onClick={e => {
                e.stopPropagation();
                setStateExpanded(prev => !prev);
              }}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  setStateExpanded(prev => !prev);
                }
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                cursor: 'pointer',
                py: 0.25,
                '&:hover': { opacity: 0.8 },
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  color: 'text.secondary',
                  flex: 1,
                }}
              >
                Session State
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.25 }}>
                {stateExpanded && hasState && (
                  <Tooltip title="Copy state JSON" placement="top">
                    <IconButton
                      size="small"
                      onClick={e => {
                        e.stopPropagation();
                        handleCopyState();
                      }}
                      sx={{ p: 0.25 }}
                    >
                      <ContentCopyIcon
                        sx={{ fontSize: 12, color: 'text.disabled' }}
                      />
                    </IconButton>
                  </Tooltip>
                )}
                {stateExpanded && onRefreshState && (
                  <Tooltip title="Refresh state" placement="top">
                    <IconButton
                      size="small"
                      onClick={e => {
                        e.stopPropagation();
                        onRefreshState();
                      }}
                      sx={{ p: 0.25 }}
                    >
                      <RefreshIcon
                        sx={{ fontSize: 12, color: 'text.disabled' }}
                      />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              {stateExpanded ? (
                <ExpandLessIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
              ) : (
                <ExpandMoreIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
              )}
            </Box>

            <Collapse in={stateExpanded}>
              <Box
                sx={{
                  mt: 0.5,
                  maxHeight: 280,
                  overflow: 'auto',
                  bgcolor: alpha(theme.palette.background.default, 0.5),
                  borderRadius: 1,
                  p: 1,
                  border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                }}
              >
                {hasState ? (
                  <JsonTreeViewer data={sessionState} />
                ) : (
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.6rem',
                      color: 'text.disabled',
                      fontStyle: 'italic',
                    }}
                  >
                    No state data available
                  </Typography>
                )}
              </Box>
            </Collapse>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
});
