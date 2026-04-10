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

import { useState, memo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Collapse from '@mui/material/Collapse';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useTheme, alpha } from '@mui/material/styles';
import { useStatus } from '../../hooks';

interface SessionStateInspectorProps {
  activeSessionId?: string;
  messageCount?: number;
  currentAgent?: string;
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
}: SessionStateInspectorProps) {
  const theme = useTheme();
  const { status, loading } = useStatus();
  const [expanded, setExpanded] = useState(false);

  const providerId = status?.providerId;
  const providerConnected = status?.provider.connected;
  const model = status?.provider.model;

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
        </Box>
      </Collapse>
    </Box>
  );
});
