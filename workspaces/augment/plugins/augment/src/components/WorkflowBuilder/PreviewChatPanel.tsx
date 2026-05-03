import { useState, useCallback, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Fade from '@mui/material/Fade';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { alpha, useTheme, keyframes } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SendIcon from '@mui/icons-material/Send';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ReplayIcon from '@mui/icons-material/Replay';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import BuildCircleOutlinedIcon from '@mui/icons-material/BuildCircleOutlined';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import { InlineCode, PreBlock } from '../CodeBlock';
import { SPACING } from './theme/tokens';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface StreamStatus {
  phase: 'connecting' | 'node_running' | 'tool_calling' | 'streaming' | 'done';
  nodeName?: string;
  toolName?: string;
}

interface PreviewChatPanelProps {
  workflowId: string;
  onClose?: () => void;
}

const REMARK_PLUGINS = [remarkGfm];

const ScrollableTable = (props: React.HTMLAttributes<HTMLTableElement>) => (
  <div style={{ overflowX: 'auto', width: '100%' }}>
    <table {...props} />
  </div>
);

const MARKDOWN_COMPONENTS: Components = {
  code: InlineCode as Components['code'],
  pre: PreBlock as Components['pre'],
  table: ScrollableTable as Components['table'],
};

const pulseAnimation = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
`;

const dotAnimation = keyframes`
  0% { content: ''; }
  25% { content: '.'; }
  50% { content: '..'; }
  75% { content: '...'; }
`;

function parseSSELines(chunk: string, buffer: string): { events: string[]; remaining: string } {
  const text = buffer + chunk;
  const lines = text.split('\n');
  const remaining = lines.pop() || '';
  const events: string[] = [];

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6).trim();
      if (data && data !== '[DONE]') {
        events.push(data);
      }
    }
  }
  return { events, remaining };
}

export function PreviewChatPanel({ workflowId, onClose }: PreviewChatPanelProps) {
  const configApi = useApi(configApiRef);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamStatus, setStreamStatus] = useState<StreamStatus | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [hoveredMsg, setHoveredMsg] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingText, streamStatus]);

  const resetChat = useCallback(() => {
    if (messages.length > 0 && !clearConfirm) {
      setClearConfirm(true);
      return;
    }
    if (abortRef.current) abortRef.current.abort();
    setMessages([]);
    setInput('');
    setLoading(false);
    setStreamStatus(null);
    setStreamingText('');
    setClearConfirm(false);
  }, [messages.length, clearConfirm]);

  const confirmClear = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setMessages([]);
    setInput('');
    setLoading(false);
    setStreamStatus(null);
    setStreamingText('');
    setClearConfirm(false);
  }, []);

  const handleCopyMessage = useCallback(async (idx: number) => {
    try {
      await navigator.clipboard.writeText(messages[idx].content);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    } catch { /* ignore */ }
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const userMsg: Message = { role: 'user', content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setStreamingText('');
    setStreamStatus({ phase: 'connecting' });

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const backendUrl = configApi.getString('backend.baseUrl');
      const res = await fetch(`${backendUrl}/api/augment/workflows/${workflowId}/run/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: text }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        throw new Error(`Run failed: ${res.status} ${errBody}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = '';
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const { events, remaining } = parseSSELines(chunk, sseBuffer);
        sseBuffer = remaining;

        for (const eventData of events) {
          try {
            const evt = JSON.parse(eventData);
            switch (evt.type) {
              case 'workflow.started':
                setStreamStatus({ phase: 'connecting' });
                break;

              case 'node.started':
                if (evt.data?.nodeType === 'agent') {
                  setStreamStatus({
                    phase: 'node_running',
                    nodeName: evt.data.nodeName || 'Agent',
                  });
                } else if (evt.data?.nodeType === 'mcp') {
                  setStreamStatus({
                    phase: 'node_running',
                    nodeName: evt.data.nodeName || 'MCP',
                  });
                } else {
                  setStreamStatus({
                    phase: 'node_running',
                    nodeName: evt.data?.nodeName || evt.data?.nodeId,
                  });
                }
                break;

              case 'node.tool_call.started':
                setStreamStatus({
                  phase: 'tool_calling',
                  toolName: evt.data?.toolName,
                  nodeName: evt.data?.serverLabel,
                });
                break;

              case 'node.tool_call.completed':
                setStreamStatus(prev =>
                  prev?.phase === 'tool_calling'
                    ? { ...prev, phase: 'node_running', toolName: undefined }
                    : prev,
                );
                break;

              case 'node.delta':
                if (evt.data?.delta) {
                  accumulatedText += evt.data.delta;
                  setStreamingText(accumulatedText);
                  setStreamStatus({ phase: 'streaming' });
                }
                break;

              case 'node.completed':
                break;

              case 'node.failed':
                accumulatedText = `Error: ${evt.data?.error || 'Node execution failed'}`;
                setStreamingText(accumulatedText);
                break;

              case 'workflow.completed':
                setStreamStatus({ phase: 'done' });
                break;
            }
          } catch {
            // Skip unparseable events
          }
        }
      }

      const finalContent = accumulatedText || streamingText;
      if (finalContent) {
        setMessages(prev => [...prev, { role: 'assistant', content: finalContent, timestamp: Date.now() }]);
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      const errorMsg = `Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg, timestamp: Date.now() }]);
    } finally {
      setLoading(false);
      setStreamStatus(null);
      setStreamingText('');
      abortRef.current = null;
    }
  }, [input, loading, workflowId, configApi, streamingText]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const renderStatusIndicator = () => {
    if (!streamStatus || streamStatus.phase === 'done') return null;

    let statusText = '';
    let icon = <CircularProgress size={12} thickness={5} sx={{ color: theme.palette.primary.main }} />;

    switch (streamStatus.phase) {
      case 'connecting':
        statusText = 'Starting workflow';
        break;
      case 'node_running':
        statusText = streamStatus.nodeName
          ? `Running ${streamStatus.nodeName}`
          : 'Processing';
        break;
      case 'tool_calling':
        statusText = streamStatus.toolName
          ? `Calling ${streamStatus.toolName}`
          : 'Calling tool';
        icon = <BuildCircleOutlinedIcon sx={{ fontSize: 14, color: theme.palette.warning.main, animation: `${pulseAnimation} 1.5s ease-in-out infinite` }} />;
        break;
      case 'streaming':
        statusText = 'Generating response';
        icon = <CheckCircleOutlineIcon sx={{ fontSize: 14, color: theme.palette.success.main }} />;
        break;
    }

    return (
      <Fade in>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1,
            py: 0.5,
            mb: 0.75,
            borderRadius: 1,
            bgcolor: isDark
              ? alpha(theme.palette.common.white, 0.04)
              : alpha(theme.palette.common.black, 0.03),
          }}
        >
          {icon}
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.72rem',
              color: theme.palette.text.secondary,
              fontWeight: 500,
              '&::after': streamStatus.phase !== 'streaming' ? {
                content: '""',
                animation: `${dotAnimation} 1.2s steps(4, end) infinite`,
              } : undefined,
            }}
          >
            {statusText}
          </Typography>
        </Box>
      </Fade>
    );
  };

  const markdownSx = {
    fontSize: '0.875rem',
    lineHeight: 1.7,
    color: theme.palette.text.primary,
    wordBreak: 'break-word',
    '& p': { margin: 0 },
    '& p + p': { mt: 1.25 },
    '& ul, & ol': {
      pl: 2.5,
      my: 1,
      '& li': { mb: 0.4, lineHeight: 1.6 },
    },
    '& code': {
      backgroundColor: isDark
        ? alpha(theme.palette.common.white, 0.1)
        : alpha(theme.palette.common.black, 0.06),
      padding: '2px 5px',
      borderRadius: '4px',
      fontFamily: '"SF Mono", "JetBrains Mono", "Fira Code", monospace',
      fontSize: '0.8em',
    },
    '& pre': {
      backgroundColor: 'transparent',
      padding: 0,
      margin: 0,
      border: 'none',
      overflowX: 'auto',
      '& code': {
        backgroundColor: 'transparent',
        padding: 0,
        fontSize: '0.8rem',
      },
    },
    '& strong': { fontWeight: 600, color: theme.palette.text.primary },
    '& a': {
      color: theme.palette.primary.main,
      textDecoration: 'underline',
      textUnderlineOffset: '2px',
    },
    '& blockquote': {
      borderLeft: `3px solid ${alpha(theme.palette.primary.main, 0.4)}`,
      pl: 1.5,
      ml: 0,
      my: 1,
      color: theme.palette.text.secondary,
    },
    '& table': {
      borderCollapse: 'collapse',
      width: '100%',
      fontSize: '0.8rem',
      my: 1,
    },
    '& th, & td': {
      border: `1px solid ${theme.palette.divider}`,
      padding: theme.spacing(0.5, 1),
      textAlign: 'left',
    },
    '& th': {
      fontWeight: 600,
      backgroundColor: isDark
        ? alpha(theme.palette.common.white, 0.05)
        : alpha(theme.palette.common.black, 0.03),
    },
  };

  return (
    <Box
      sx={{
        width: SPACING.previewWidth,
        flexShrink: 0,
        borderLeft: '1px solid',
        borderColor: 'divider',
        bgcolor: isDark ? alpha(theme.palette.background.paper, 0.6) : 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, pt: 1 }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ color: 'text.primary', fontSize: '0.85rem' }}>
          Preview
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="body2"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              cursor: 'pointer',
              fontSize: '0.82rem',
              color: theme.palette.primary.main,
              '&:hover': { opacity: 0.8 },
            }}
            onClick={resetChat}
          >
            New chat <EditIcon sx={{ fontSize: 14 }} />
          </Typography>
          {onClose && (
            <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary', p: 0.5 }} aria-label="Close preview">
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Messages or empty state */}
      <Box ref={scrollRef} sx={{ flex: 1, overflowY: 'auto', px: 2, py: 2, scrollbarWidth: 'thin' }}>
        {messages.length === 0 && !loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 1.5 }}>
            <AutoFixHighIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
            <Typography variant="subtitle1" fontWeight={600} color="text.primary">
              Preview your agent
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ maxWidth: 220 }}>
              Prompt the agent as if you're the user.
            </Typography>
          </Box>
        ) : (
          <>
            {messages.map((msg, i) => {
              const isError = msg.role === 'assistant' && msg.content.startsWith('Error:');
              const isHovered = hoveredMsg === i;
              const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <Box
                  key={i}
                  onMouseEnter={() => setHoveredMsg(i)}
                  onMouseLeave={() => setHoveredMsg(null)}
                  sx={{
                    mb: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  {/* Role label with icon */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5, px: 0.5 }}>
                    {msg.role === 'user' ? (
                      <PersonOutlineIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                    ) : (
                      <SmartToyOutlinedIcon sx={{ fontSize: 14, color: theme.palette.primary.main }} />
                    )}
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        color: msg.role === 'user' ? theme.palette.text.secondary : theme.palette.primary.main,
                        textTransform: 'capitalize',
                      }}
                    >
                      {msg.role === 'user' ? 'You' : 'Assistant'}
                    </Typography>
                    {/* Timestamp on hover */}
                    <Fade in={isHovered}>
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.disabled', ml: 0.5 }}>
                        {timeStr}
                      </Typography>
                    </Fade>
                  </Box>

                  {/* Message bubble */}
                  <Box
                    sx={{
                      maxWidth: '95%',
                      p: 1.5,
                      borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      bgcolor: msg.role === 'user'
                        ? (isDark ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.primary.main, 0.08))
                        : (isDark ? alpha(theme.palette.common.white, 0.05) : alpha(theme.palette.common.black, 0.03)),
                      border: '1px solid',
                      borderColor: msg.role === 'user'
                        ? (isDark ? alpha(theme.palette.primary.main, 0.3) : alpha(theme.palette.primary.main, 0.2))
                        : (isDark ? alpha(theme.palette.common.white, 0.1) : alpha(theme.palette.common.black, 0.08)),
                    }}
                  >
                    {msg.role === 'assistant' ? (
                      <Box sx={markdownSx}>
                        <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={MARKDOWN_COMPONENTS}>
                          {msg.content}
                        </ReactMarkdown>
                      </Box>
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem', lineHeight: 1.6, color: 'text.primary' }}
                      >
                        {msg.content}
                      </Typography>
                    )}
                  </Box>

                  {/* Action buttons on hover */}
                  {isHovered && msg.role === 'assistant' && (
                    <Box sx={{ display: 'flex', gap: 0.25, mt: 0.25, px: 0.5 }}>
                      <Tooltip title={copiedIdx === i ? 'Copied!' : 'Copy'}>
                        <IconButton size="small" onClick={() => handleCopyMessage(i)} sx={{ p: 0.25 }}>
                          <ContentCopyIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                        </IconButton>
                      </Tooltip>
                      {isError && (
                        <Tooltip title="Retry">
                          <IconButton
                            size="small"
                            onClick={() => {
                              const lastUserMsg = [...messages].slice(0, i).reverse().find(m => m.role === 'user');
                              if (lastUserMsg) {
                                setMessages(prev => prev.slice(0, i));
                                setInput(lastUserMsg.content);
                              }
                            }}
                            sx={{ p: 0.25 }}
                          >
                            <ReplayIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  )}
                </Box>
              );
            })}

            {/* Live streaming assistant message */}
            {loading && (streamingText || streamStatus) && (
              <Box
                sx={{
                  mb: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5, px: 0.5 }}>
                  <SmartToyOutlinedIcon sx={{ fontSize: 14, color: theme.palette.primary.main }} />
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 600, fontSize: '0.75rem', color: theme.palette.primary.main }}
                  >
                    Assistant
                  </Typography>
                </Box>

                <Box
                  sx={{
                    maxWidth: '95%',
                    p: 1.5,
                    borderRadius: '12px 12px 12px 2px',
                    bgcolor: isDark
                      ? alpha(theme.palette.common.white, 0.05)
                      : alpha(theme.palette.common.black, 0.03),
                    border: '1px solid',
                    borderColor: isDark
                      ? alpha(theme.palette.common.white, 0.1)
                      : alpha(theme.palette.common.black, 0.08),
                  }}
                >
                  {renderStatusIndicator()}

                  {streamingText && (
                    <Box sx={markdownSx}>
                      <ReactMarkdown
                        remarkPlugins={REMARK_PLUGINS}
                        components={MARKDOWN_COMPONENTS}
                      >
                        {streamingText}
                      </ReactMarkdown>
                    </Box>
                  )}

                  {!streamingText && streamStatus?.phase !== 'done' && (
                    <Box
                      sx={{
                        width: 8,
                        height: 16,
                        bgcolor: theme.palette.primary.main,
                        borderRadius: '2px',
                        animation: `${pulseAnimation} 1s ease-in-out infinite`,
                        mt: streamStatus ? 0 : 0.5,
                      }}
                    />
                  )}
                </Box>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Input */}
      <Box sx={{ px: 1.5, pb: 1.5, pt: 0.5, flexShrink: 0 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 0.5,
            border: '1px solid',
            borderColor: isDark
              ? alpha(theme.palette.common.white, 0.15)
              : alpha(theme.palette.common.black, 0.15),
            borderRadius: 2.5,
            px: 1.25,
            py: 0.75,
            bgcolor: isDark
              ? alpha(theme.palette.common.white, 0.03)
              : alpha(theme.palette.common.black, 0.02),
            transition: 'border-color 0.2s',
            '&:focus-within': {
              borderColor: theme.palette.primary.main,
            },
          }}
        >
          <Tooltip title="Attach file (coming soon)">
            <span>
              <IconButton size="small" disabled sx={{ p: 0.5, color: theme.palette.text.secondary }}>
                <AttachFileIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </span>
          </Tooltip>
          <TextField
            variant="standard"
            fullWidth
            multiline
            maxRows={4}
            placeholder="Send a message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            InputProps={{ disableUnderline: true }}
            sx={{
              '& .MuiInputBase-input': {
                fontSize: '0.875rem',
                color: theme.palette.text.primary,
                '&::placeholder': { color: theme.palette.text.secondary, opacity: 0.8 },
              },
            }}
          />
          <IconButton
            size="small"
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            sx={{
              p: 0.5,
              color: input.trim() && !loading
                ? theme.palette.primary.main
                : theme.palette.text.disabled,
              bgcolor: input.trim() && !loading
                ? alpha(theme.palette.primary.main, 0.1)
                : 'transparent',
              borderRadius: 1.5,
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.2),
              },
            }}
          >
            <SendIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Box>

      {/* Clear chat confirmation */}
      <Dialog open={clearConfirm} onClose={() => setClearConfirm(false)} maxWidth="xs">
        <DialogTitle>Clear conversation?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This will remove all messages from the preview. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearConfirm(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={confirmClear}>Clear</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
