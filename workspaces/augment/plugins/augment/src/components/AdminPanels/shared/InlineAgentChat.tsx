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

import { useState, useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTheme, alpha } from '@mui/material/styles';
import { useApi, configApiRef, fetchApiRef } from '@backstage/core-plugin-api';

export interface InlineAgentChatProps {
  readonly agentId: string;
  readonly agentName: string;
}

export function InlineAgentChat({ agentId, agentName }: InlineAgentChatProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const configApi = useApi(configApiRef);
  const { fetch: authFetch } = useApi(fetchApiRef);
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: 'user' | 'agent'; text: string }>
  >([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const streamingTextRef = useRef('');

  const handleSend = useCallback(async () => {
    if (!input.trim() || sending) return;
    const userMsg = input.trim();
    setInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setSending(true);
    streamingTextRef.current = '';

    const agentMsgIndex = chatMessages.length + 1;

    try {
      const backendUrl = configApi.getString('backend.baseUrl');
      const resp = await authFetch(`${backendUrl}/api/augment/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Backstage-Request': 'augment',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userMsg }],
          model: agentId,
          sessionId,
        }),
      });
      if (!resp.ok) {
        const errText = await resp.text().catch(() => `HTTP ${resp.status}`);
        throw new Error(errText || `HTTP ${resp.status}`);
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error('No readable stream in response');

      const decoder = new TextDecoder();
      let buffer = '';

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (!payload || payload === '[DONE]') continue;

          let evt: {
            type?: string;
            delta?: string;
            responseId?: string;
            error?: string;
          };
          try {
            evt = JSON.parse(payload);
          } catch {
            continue;
          }

          if (evt.type === 'stream.text.delta' && evt.delta) {
            streamingTextRef.current += evt.delta;
            const snapshot = streamingTextRef.current;
            setChatMessages(prev => {
              const updated = [...prev];
              if (updated.length > agentMsgIndex) {
                updated[agentMsgIndex] = { role: 'agent', text: snapshot };
              } else {
                updated.push({ role: 'agent', text: snapshot });
              }
              return updated;
            });
          } else if (evt.type === 'stream.started' && evt.responseId) {
            setSessionId(evt.responseId);
          } else if (evt.type === 'stream.error') {
            throw new Error(evt.error ?? 'Stream error');
          }
        }
      }

      if (streamingTextRef.current) {
        const finalText = streamingTextRef.current;
        setChatMessages(prev => {
          const updated = [...prev];
          if (updated.length > agentMsgIndex) {
            updated[agentMsgIndex] = { role: 'agent', text: finalText };
          } else {
            updated.push({ role: 'agent', text: finalText });
          }
          return updated;
        });
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      const isNetwork =
        errMsg.includes('fetch') ||
        errMsg.includes('network') ||
        errMsg.includes('ECONNREFUSED');
      setChatMessages(prev => [
        ...prev.filter((_m, i) => i !== agentMsgIndex),
        {
          role: 'error' as 'agent',
          text: isNetwork
            ? 'Unable to reach the agent. The pod may still be starting up, or K8s credentials may need to be configured. Try again in a moment.'
            : `Something went wrong: ${errMsg}`,
        },
      ]);
    } finally {
      setSending(false);
    }
  }, [
    agentId,
    input,
    sending,
    sessionId,
    chatMessages.length,
    configApi,
    authFetch,
  ]);

  return (
    <Box
      sx={{
        height: 420,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: isDark
          ? alpha(theme.palette.background.paper, 0.4)
          : theme.palette.background.paper,
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        {chatMessages.length === 0 && (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="body2" color="text.disabled">
              Send a message to test {agentName}
            </Typography>
          </Box>
        )}
        {chatMessages.map((msg, i) => {
          const isError =
            msg.text.startsWith('Unable to reach') ||
            msg.text.startsWith('Something went wrong');
          return (
            <Box
              key={`${msg.role}-${i}`}
              sx={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                px: 2,
                py: 1,
                borderRadius: 2,
                // eslint-disable-next-line no-nested-ternary
                bgcolor: isError
                  ? alpha(theme.palette.error.main, isDark ? 0.15 : 0.08)
                  : msg.role === 'user'
                    ? alpha(theme.palette.primary.main, isDark ? 0.2 : 0.1)
                    : alpha(
                        theme.palette.background.default,
                        isDark ? 0.6 : 0.8,
                      ),
                // eslint-disable-next-line no-nested-ternary
                border: isError
                  ? `1px solid ${alpha(theme.palette.error.main, 0.3)}`
                  : msg.role === 'agent'
                    ? `1px solid ${alpha(theme.palette.divider, 0.3)}`
                    : undefined,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.85rem',
                  color: isError ? theme.palette.error.main : 'text.primary',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {msg.text}
              </Typography>
            </Box>
          );
        })}
        {sending && (
          <Box sx={{ alignSelf: 'flex-start', px: 2, py: 1 }}>
            <Typography
              variant="body2"
              color="text.disabled"
              sx={{ fontStyle: 'italic' }}
            >
              {agentName} is thinking...
            </Typography>
          </Box>
        )}
      </Box>
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          p: 1.5,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <TextField
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={`Message ${agentName}...`}
          disabled={sending}
          size="small"
          fullWidth
          sx={{ flex: 1 }}
        />
        <Button
          variant="contained"
          size="small"
          onClick={handleSend}
          disabled={!input.trim() || sending}
          sx={{
            textTransform: 'none',
            borderRadius: 2,
            minWidth: 60,
            boxShadow: 'none',
          }}
        >
          Send
        </Button>
      </Box>
    </Box>
  );
}
