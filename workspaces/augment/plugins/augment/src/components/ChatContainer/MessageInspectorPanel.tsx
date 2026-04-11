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
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Tooltip from '@mui/material/Tooltip';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useTheme, alpha } from '@mui/material/styles';
import type { Message } from '../../types';

interface MessageInspectorPanelProps {
  message: Message | null;
  open: boolean;
  onClose: () => void;
}

function OverviewTab({ message }: { message: Message }) {
  const theme = useTheme();
  const fields = useMemo(() => {
    const items: Array<{ label: string; value: string }> = [
      { label: 'ID', value: message.id },
      { label: 'Role', value: message.isUser ? 'user' : 'assistant' },
      {
        label: 'Timestamp',
        value: message.timestamp?.toISOString() || 'N/A',
      },
    ];
    if (message.agentName) {
      items.push({ label: 'Agent', value: message.agentName });
    }
    if (message.responseId) {
      items.push({ label: 'Response ID', value: message.responseId });
    }
    if (message.conversationId) {
      items.push({ label: 'Conversation ID', value: message.conversationId });
    }
    if (message.usage) {
      items.push({
        label: 'Tokens',
        value: `${message.usage.input_tokens ?? 0} in / ${message.usage.output_tokens ?? 0} out / ${message.usage.total_tokens ?? 0} total`,
      });
    }
    if (message.errorCode) {
      items.push({ label: 'Error Code', value: message.errorCode });
    }
    const reasoningText =
      message.reasoning ||
      (message.reasoningSummaries?.length
        ? message.reasoningSummaries.map(r => r.text).join('\n\n')
        : '');
    if (reasoningText) {
      items.push({
        label: 'Reasoning',
        value: `${reasoningText.length} chars${message.reasoningDuration ? ` (${message.reasoningDuration}s)` : ''}`,
      });
    }
    if (message.toolCalls?.length) {
      items.push({
        label: 'Tool Calls',
        value: `${message.toolCalls.length}`,
      });
    }
    if (message.ragSources?.length) {
      items.push({
        label: 'RAG Sources',
        value: `${message.ragSources.length}`,
      });
    }
    if (message.artifacts?.length) {
      items.push({
        label: 'Artifacts',
        value: `${message.artifacts.length}`,
      });
    }
    if (message.citations?.length) {
      items.push({
        label: 'Citations',
        value: `${message.citations.length}`,
      });
    }
    return items;
  }, [message]);

  return (
    <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
      {fields.map(f => (
        <Box key={f.label}>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.disabled,
              fontSize: '0.6rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {f.label}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              wordBreak: 'break-all',
              color: theme.palette.text.primary,
            }}
          >
            {f.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function ToolsTab({ message }: { message: Message }) {
  const theme = useTheme();
  if (!message.toolCalls?.length) {
    return (
      <Typography
        variant="caption"
        sx={{ p: 2, color: theme.palette.text.disabled }}
      >
        No tool calls in this message
      </Typography>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      {message.toolCalls.map(tc => (
        <Box
          key={tc.id}
          sx={{
            mb: 1,
            p: 1,
            borderRadius: 1,
            bgcolor: alpha(theme.palette.background.default, 0.5),
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              fontFamily: 'monospace',
              fontSize: '0.75rem',
            }}
          >
            {tc.name}
          </Typography>
          {tc.serverLabel && (
            <Typography
              variant="caption"
              sx={{
                ml: 0.5,
                fontSize: '0.6rem',
                color: theme.palette.text.disabled,
              }}
            >
              ({tc.serverLabel})
            </Typography>
          )}
          {tc.arguments && (
            <Box sx={{ mt: 0.5 }}>
              <Typography
                variant="caption"
                sx={{ fontSize: '0.6rem', color: theme.palette.text.disabled }}
              >
                Arguments
              </Typography>
              <Typography
                component="pre"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.65rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  m: 0,
                  mt: 0.25,
                  maxHeight: 120,
                  overflow: 'auto',
                }}
              >
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(tc.arguments!), null, 2);
                  } catch {
                    return tc.arguments;
                  }
                })()}
              </Typography>
            </Box>
          )}
          {tc.output && (
            <Box sx={{ mt: 0.5 }}>
              <Typography
                variant="caption"
                sx={{ fontSize: '0.6rem', color: theme.palette.text.disabled }}
              >
                Output
              </Typography>
              <Typography
                component="pre"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.65rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  m: 0,
                  mt: 0.25,
                  maxHeight: 120,
                  overflow: 'auto',
                }}
              >
                {tc.output}
              </Typography>
            </Box>
          )}
          {tc.error && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mt: 0.5,
                color: theme.palette.error.main,
                fontSize: '0.65rem',
              }}
            >
              Error: {tc.error}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
}

function RawTab({ message }: { message: Message }) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);
  const json = useMemo(() => {
    try {
      return JSON.stringify(message, null, 2);
    } catch {
      return '{ "error": "Unable to serialize message (possible circular reference)" }';
    }
  }, [message]);

  const handleCopy = async () => {
    try {
      await window.navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <Box sx={{ position: 'relative', p: 1 }}>
      <Tooltip title={copied ? 'Copied' : 'Copy JSON'}>
        <IconButton
          size="small"
          onClick={handleCopy}
          sx={{ position: 'absolute', top: 4, right: 4 }}
        >
          <ContentCopyIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Tooltip>
      <Typography
        component="pre"
        sx={{
          fontFamily: 'monospace',
          fontSize: '0.65rem',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          m: 0,
          maxHeight: 'calc(100vh - 200px)',
          overflow: 'auto',
          color: theme.palette.text.secondary,
        }}
      >
        {json}
      </Typography>
    </Box>
  );
}

export const MessageInspectorPanel = memo(function MessageInspectorPanel({
  message,
  open,
  onClose,
}: MessageInspectorPanelProps) {
  const theme = useTheme();
  const [tab, setTab] = useState(0);

  if (!message) return null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="temporary"
      PaperProps={{
        sx: {
          width: 360,
          maxWidth: '90vw',
          bgcolor: theme.palette.background.default,
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5,
          py: 1,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
        }}
      >
        <Typography
          variant="body2"
          sx={{ fontWeight: 600, fontSize: '0.8rem' }}
        >
          Message Inspector
        </Typography>
        <IconButton size="small" onClick={onClose} aria-label="Close inspector">
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="fullWidth"
        sx={{
          minHeight: 32,
          '& .MuiTab-root': {
            minHeight: 32,
            fontSize: '0.7rem',
            textTransform: 'none',
            py: 0.5,
          },
        }}
      >
        <Tab label="Overview" />
        <Tab label="Tools" />
        <Tab label="Raw" />
      </Tabs>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {tab === 0 && <OverviewTab message={message} />}
        {tab === 1 && <ToolsTab message={message} />}
        {tab === 2 && <RawTab message={message} />}
      </Box>
    </Drawer>
  );
});
