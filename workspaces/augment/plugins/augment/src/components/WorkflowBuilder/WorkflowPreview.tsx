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

import { useCallback, useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme, alpha } from '@mui/material/styles';
import { useApi, configApiRef, fetchApiRef } from '@backstage/core-plugin-api';
import type { NodeExecutionRecord } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { ExecutionTrace } from './ExecutionTrace';

interface PreviewMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  activeNode?: string;
}

interface WorkflowPreviewProps {
  workflowId: string;
  onClose: () => void;
  onRun?: (input: string) => Promise<{
    response: string;
    trace: NodeExecutionRecord[];
  }>;
  onHighlightNode?: (nodeId: string | null) => void;
}

export function WorkflowPreview({
  workflowId,
  onClose,
  onRun,
  onHighlightNode,
}: WorkflowPreviewProps) {
  const theme = useTheme();
  const configApi = useApi(configApiRef);
  const { fetch: authFetch } = useApi(fetchApiRef);
  const [messages, setMessages] = useState<PreviewMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentTrace, setCurrentTrace] = useState<NodeExecutionRecord[]>([]);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const backendUrl = configApi.getString('backend.baseUrl');

  useEffect(() => {
    onHighlightNode?.(activeNodeId);
  }, [activeNodeId, onHighlightNode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const defaultOnRun = useCallback(async (text: string) => {
    const resp = await authFetch(`${backendUrl}/api/augment/workflows/${workflowId}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: text }),
    });
    if (!resp.ok) {
      throw new Error(`Backend returned ${resp.status}: ${await resp.text()}`);
    }
    const data = await resp.json();
    return {
      response: data.response || data.output || 'No response',
      trace: data.trace || [],
    };
  }, [backendUrl, workflowId]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    const userMsg: PreviewMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setCurrentTrace([]);
    setActiveNodeId(null);

    try {
      const runFn = onRun || defaultOnRun;
      const result = await runFn(text);
      const assistantMsg: PreviewMessage = {
        role: 'assistant',
        content: result.response,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      setCurrentTrace(result.trace);

      if (result.trace.length > 0) {
        const lastActive = result.trace[result.trace.length - 1];
        setActiveNodeId(lastActive.nodeId);
      }
    } catch (err) {
      const errMsg: PreviewMessage = {
        role: 'assistant',
        content: `Error: ${err instanceof Error ? err.message : String(err)}`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, onRun, defaultOnRun]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <Paper
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      elevation={0}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5, gap: 1 }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>
          Preview
        </Typography>
        {activeNodeId && (
          <Chip
            label={activeNodeId}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.65rem',
              bgcolor: alpha(theme.palette.success.main, 0.15),
              color: theme.palette.success.main,
            }}
          />
        )}
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Divider />

      <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
        {messages.length === 0 && (
          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Typography variant="body2" color="text.secondary">
              Send a message to test this workflow
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
              {workflowId}
            </Typography>
          </Box>
        )}
        {messages.map((msg, i) => (
          <Box
            key={i}
            sx={{
              mb: 1.5,
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <Box
              sx={{
                maxWidth: '85%',
                px: 1.5,
                py: 1,
                borderRadius: 2,
                bgcolor: msg.role === 'user'
                  ? theme.palette.primary.main
                  : alpha(theme.palette.action.hover, 0.5),
                color: msg.role === 'user'
                  ? theme.palette.primary.contrastText
                  : theme.palette.text.primary,
              }}
            >
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
                {msg.content}
              </Typography>
            </Box>
          </Box>
        ))}
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="caption" color="text.secondary">Processing...</Typography>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {currentTrace.length > 0 && (
        <>
          <Divider />
          <Box sx={{ maxHeight: 180, overflow: 'auto' }}>
            <ExecutionTrace
              records={currentTrace}
              onNodeClick={(nodeId) => {
                setActiveNodeId(nodeId);
              }}
            />
          </Box>
        </>
      )}

      <Divider />
      <Box sx={{ display: 'flex', alignItems: 'center', p: 1, gap: 0.5 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Type a message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          sx={{
            '& .MuiOutlinedInput-root': { borderRadius: 2 },
          }}
        />
        <IconButton
          color="primary"
          onClick={handleSend}
          disabled={!input.trim() || loading}
          size="small"
        >
          <SendIcon fontSize="small" />
        </IconButton>
      </Box>
    </Paper>
  );
}
