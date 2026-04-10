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

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { useTheme } from '@mui/material/styles';
import { Message } from '../../types';
import { WelcomeScreen, AgentCatalogDialog } from '../WelcomeScreen';
import type { SelectedAgentInfo } from '../WelcomeScreen';
import { VirtualizedMessageList } from './VirtualizedMessageList';
import { StreamingMessage } from '../StreamingMessage';
import { ToolApprovalDialog } from '../ToolApprovalDialog';
import { ChatInput } from '../ChatInput';
import { useApi } from '@backstage/core-plugin-api';
import { augmentApiRef } from '../../api';
import { debugError, exportConversation } from '../../utils';
import { useBranding, useStreamingChat, useToolApproval } from '../../hooks';
import {
  useWelcomeData,
  useChatKeyboardShortcuts,
  useScrollToBottom,
  useStatus,
  useChatAgentConfig,
} from '../../hooks';
import { ThinkingIndicator } from './ThinkingIndicator';
import { ChatScrollArea } from './ChatScrollArea';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { ChatHeader } from './ChatHeader';
import { useChatActions } from './useChatActions';
import { useTranslation } from '../../hooks/useTranslation';
import { ExecutionTracePanel } from '../ExecutionTrace';

// ============================================================================
// Main Component
// ============================================================================

interface ChatContainerProps {
  rightPaneCollapsed: boolean;
  messages: Message[];
  onMessagesChange: (messages: Message[]) => void;
  onNewChat?: () => void;
  onSessionCreated?: (sessionId: string) => void;
  loadingConversation?: boolean;
  /** Session had a conversation but messages could not be loaded */
  messagesUnavailable?: boolean;
  onCurrentAgentChange?: (agent: string | undefined) => void;
  activeSessionId?: string;
}

export interface ChatContainerRef {
  cancelOngoingRequest: () => void;
  resetConversation: () => void;
  setPreviousResponseId: (id: string | undefined) => void;
  setConversationId: (id: string | undefined) => void;
  setSessionId: (id: string | undefined) => void;
  isStreaming: () => boolean;
  clearInput: () => void;
  setSelectedModel: (model: string | undefined) => void;
}

export const ChatContainer = forwardRef<ChatContainerRef, ChatContainerProps>(
  (
    {
      rightPaneCollapsed,
      messages,
      onMessagesChange,
      onNewChat,
      onSessionCreated,
      loadingConversation = false,
      messagesUnavailable = false,
      onCurrentAgentChange,
      activeSessionId,
    },
    ref,
  ) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const api = useApi(augmentApiRef);
    const { branding } = useBranding();

    const [inputValue, setInputValue] = useState('');
    const [selectedModel, setSelectedModel] = useState<string | undefined>();
    const [agentHealthWarning, setAgentHealthWarning] = useState<string | null>(
      null,
    );
    const [agentStarters, setAgentStarters] = useState<string[]>([]);
    const [agentDescription, setAgentDescription] = useState<
      string | undefined
    >();
    const approvalMsgCounter = useRef(0);
    const kagentiFetchRef = useRef<AbortController | null>(null);
    const { workflows, quickActions, promptGroups } = useWelcomeData();
    const { status } = useStatus();
    const isKagenti = status?.providerId === 'kagenti';
    const providerId = status?.providerId;
    const { configs: chatAgentConfigs } = useChatAgentConfig();
    const chatInputRef = useRef<HTMLTextAreaElement | null>(null);

    const handleAgentSelect = useCallback(
      (agentId: string, _agentName: string) => {
        setSelectedModel(agentId);
        setAgentHealthWarning(null);

        const adminCfg = chatAgentConfigs.find(c => c.agentId === agentId);

        // Set description from admin config first
        setAgentDescription(adminCfg?.description);

        if (adminCfg?.conversationStarters?.length) {
          setAgentStarters(adminCfg.conversationStarters.slice(0, 4));
        } else {
          setAgentStarters([]);
        }

        if (adminCfg?.greeting && messages.length === 0) {
          onMessagesChange([
            {
              id: `greeting-${Date.now()}`,
              text: adminCfg.greeting,
              isUser: false,
              timestamp: new Date(),
              agentName: adminCfg.displayName || _agentName,
            },
          ]);
        }

        chatInputRef.current?.focus();

        if (isKagenti && agentId.includes('/')) {
          const [ns, name] = agentId.split('/');
          kagentiFetchRef.current?.abort();
          const ctrl = new AbortController();
          kagentiFetchRef.current = ctrl;
          api
            .getKagentiAgent(ns, name)
            .then(detail => {
              if (ctrl.signal.aborted) return;
              const statusStr =
                typeof detail.status === 'string'
                  ? detail.status
                  : String(
                      (detail.status as Record<string, unknown>)?.phase ?? '',
                    );
              if (statusStr && statusStr.toLowerCase() !== 'ready') {
                setAgentHealthWarning(`Agent status: ${statusStr}`);
              }
              const card = (
                detail as {
                  agentCard?: {
                    description?: string;
                    skills?: Array<{ examples?: string[] }>;
                  };
                }
              ).agentCard;
              if (!adminCfg?.description && card?.description) {
                setAgentDescription(card.description);
              }
              if (!adminCfg?.conversationStarters?.length && card?.skills) {
                const examples = card.skills
                  .flatMap(s => s.examples || [])
                  .slice(0, 4);
                if (examples.length > 0) setAgentStarters(examples);
              }
            })
            .catch(() => {
              if (ctrl.signal.aborted) return;
              setAgentHealthWarning('Unable to verify agent health');
            });
        }
      },
      [api, isKagenti, chatAgentConfigs, messages.length, onMessagesChange],
    );

    const handleChangeAgent = useCallback(() => {
      setSelectedModel(undefined);
      setAgentHealthWarning(null);
      setAgentStarters([]);
      setAgentDescription(undefined);
      if (messages.length > 0 && onNewChat) {
        onNewChat();
      }
    }, [messages.length, onNewChat]);

    const handleStarterClick = useCallback((prompt: string) => {
      setInputValue(prompt);
      chatInputRef.current?.focus();
    }, []);

    // ── Agent Catalog Dialog ──────────────────────────────────
    const [catalogOpen, setCatalogOpen] = useState(false);
    const catalogAutoOpened = useRef(false);

    const handleOpenCatalog = useCallback(() => setCatalogOpen(true), []);
    const handleCloseCatalog = useCallback(() => setCatalogOpen(false), []);

    const handleCatalogAgentSelect = useCallback(
      (agentId: string, agentName: string) => {
        handleAgentSelect(agentId, agentName);
        setCatalogOpen(false);
      },
      [handleAgentSelect],
    );

    const handleCatalogStarterSelect = useCallback(
      (agentId: string, prompt: string) => {
        const name = agentId.includes('/')
          ? agentId.split('/').pop()!
          : agentId;
        handleAgentSelect(agentId, name);
        setInputValue(prompt);
        setCatalogOpen(false);
        setTimeout(() => chatInputRef.current?.focus(), 100);
      },
      [handleAgentSelect],
    );

    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);

    const { showScrollFab, scrollToBottom, handleScroll } = useScrollToBottom(
      scrollContainerRef,
      messagesEndRef,
      [messages],
    );

    // Streaming chat hook
    const {
      streamingState,
      isTyping,
      sendMessage,
      cancelRequest,
      resetConversation,
      setStreamingState,
      setIsTyping,
      setPreviousResponseId,
      setConversationId,
      setSessionId,
    } = useStreamingChat({
      enableRAG: true,
      onMessagesChange,
      onScrollToBottom: scrollToBottom,
      onSessionCreated,
      model: selectedModel,
      providerId,
    });

    // Full reset when the active provider changes — clear messages,
    // cancel in-flight streams, and reset conversation identity so
    // state from Provider A never leaks into Provider B.
    const prevProviderIdRef = useRef(providerId);
    useEffect(() => {
      if (providerId && providerId !== prevProviderIdRef.current) {
        prevProviderIdRef.current = providerId;
        cancelRequest();
        resetConversation();
        onMessagesChange([]);
        setSelectedModel(undefined);
        setAgentStarters([]);
        setAgentDescription(undefined);
        setAgentHealthWarning(null);
        setInputValue('');
        onNewChat?.();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [providerId]);

    // Track last completed streaming state for the execution trace panel.
    const lastCompletedStateRef = useRef(streamingState);
    if (streamingState) {
      lastCompletedStateRef.current = streamingState;
    }

    // Tool approval hook (HITL)
    const {
      pendingApproval,
      isApprovalSubmitting,
      approvalError,
      handleApprove,
      handleReject,
    } = useToolApproval({
      streamingState,
      messages,
      onMessagesChange,
      onClearStreamingState: () => setStreamingState(null),
      onSetTyping: setIsTyping,
    });

    // Track isTyping in a ref so the imperative handle stays current
    const isTypingRef = useRef(isTyping);
    isTypingRef.current = isTyping;

    // Expose methods via ref
    useImperativeHandle(
      ref,
      () => ({
        cancelOngoingRequest: cancelRequest,
        resetConversation,
        setPreviousResponseId,
        setConversationId,
        setSessionId,
        isStreaming: () => isTypingRef.current,
        clearInput: () => setInputValue(''),
        setSelectedModel,
      }),
      [
        cancelRequest,
        resetConversation,
        setPreviousResponseId,
        setConversationId,
        setSessionId,
      ],
    );

    const [shortcutsOpen, setShortcutsOpen] = useState(false);
    const handleShowShortcuts = useCallback(() => setShortcutsOpen(true), []);

    const {
      handleQuickActionSelect,
      handleRegenerate,
      handleEditMessage,
      handleSendMessage,
      handleStopGeneration,
    } = useChatActions({
      sendMessage,
      cancelRequest,
      messages,
      onMessagesChange,
      inputValue,
      setInputValue,
    });

    const { selectedMessageIndex } = useChatKeyboardShortcuts({
      onNewChat,
      isTyping,
      cancelRequest,
      chatInputRef,
      isApprovalDialogOpen: !!pendingApproval,
      onShowShortcuts: handleShowShortcuts,
      messageCount: messages.length,
    });

    useEffect(() => {
      if (!isTyping) {
        chatInputRef.current?.focus();
      }
    }, [isTyping]);

    useEffect(() => {
      if (!isTyping) return undefined;
      const handler = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = '';
      };
      window.addEventListener('beforeunload', handler);
      return () => window.removeEventListener('beforeunload', handler);
    }, [isTyping]);

    useEffect(() => {
      const agentToReport = streamingState?.currentAgent || selectedModel;
      onCurrentAgentChange?.(agentToReport);
    }, [streamingState?.currentAgent, selectedModel, onCurrentAgentChange]);

    const handleFormSubmit = useCallback(
      async (values: Record<string, unknown>) => {
        const pending = streamingState?.pendingForm;
        if (!pending) return;
        try {
          const result = await api.submitToolApproval(
            pending.contextId || streamingState?.responseId || '',
            pending.taskId || '',
            true,
            'form_response',
            JSON.stringify(values),
          );
          const text = result?.content || 'Request processed successfully.';
          const botMsg: Message = {
            id: `msg-approval-${approvalMsgCounter.current++}`,
            text,
            isUser: false,
            timestamp: new Date(),
            responseId: result?.responseId,
          };
          onMessagesChange([...messages, botMsg]);
        } catch (err) {
          debugError('Form submission failed:', err);
          const errorMsg: Message = {
            id: `msg-error-${approvalMsgCounter.current++}`,
            text: `Form submission failed: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`,
            isUser: false,
            timestamp: new Date(),
            errorCode: 'form_submission_error',
          };
          onMessagesChange([...messages, errorMsg]);
        } finally {
          setStreamingState(null);
          setIsTyping(false);
        }
      },
      [
        api,
        streamingState,
        setStreamingState,
        setIsTyping,
        messages,
        onMessagesChange,
      ],
    );

    const handleFormCancel = useCallback(async () => {
      const pending = streamingState?.pendingForm;
      if (!pending) return;
      setStreamingState(null);
      setIsTyping(false);
      try {
        await api.submitToolApproval(
          pending.contextId || streamingState?.responseId || '',
          pending.taskId || '',
          false,
        );
      } catch (err) {
        debugError('Form cancellation failed:', err);
      }
    }, [api, streamingState, setStreamingState, setIsTyping]);

    const handleAuthConfirm = useCallback(async () => {
      const pending = streamingState?.pendingAuth;
      if (!pending) return;
      try {
        const result = await api.submitToolApproval(
          streamingState?.responseId || pending.taskId || '',
          pending.taskId || '',
          true,
          'oauth_confirm',
        );
        const text = result?.content || 'Authentication confirmed.';
        const botMsg: Message = {
          id: `msg-approval-${approvalMsgCounter.current++}`,
          text,
          isUser: false,
          timestamp: new Date(),
          responseId: result?.responseId,
        };
        onMessagesChange([...messages, botMsg]);
      } catch (err) {
        debugError('OAuth confirmation failed:', err);
        const errorMsg: Message = {
          id: `msg-error-${approvalMsgCounter.current++}`,
          text: `Authentication failed: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`,
          isUser: false,
          timestamp: new Date(),
          errorCode: 'auth_confirmation_error',
        };
        onMessagesChange([...messages, errorMsg]);
      } finally {
        setStreamingState(null);
        setIsTyping(false);
      }
    }, [
      api,
      streamingState,
      setStreamingState,
      setIsTyping,
      messages,
      onMessagesChange,
    ]);

    const handleSecretsSubmit = useCallback(
      async (secrets: Record<string, string>) => {
        const pending = streamingState?.pendingAuth;
        if (!pending) return;
        try {
          const result = await api.submitToolApproval(
            streamingState?.responseId || pending.taskId || '',
            pending.taskId || '',
            true,
            'secrets_response',
            JSON.stringify(secrets),
          );
          const text = result?.content || 'Secrets submitted successfully.';
          const botMsg: Message = {
            id: `msg-approval-${approvalMsgCounter.current++}`,
            text,
            isUser: false,
            timestamp: new Date(),
            responseId: result?.responseId,
          };
          onMessagesChange([...messages, botMsg]);
        } catch (err) {
          debugError('Secrets submission failed:', err);
          const errorMsg: Message = {
            id: `msg-error-${approvalMsgCounter.current++}`,
            text: `Secrets submission failed: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`,
            isUser: false,
            timestamp: new Date(),
            errorCode: 'secrets_submission_error',
          };
          onMessagesChange([...messages, errorMsg]);
        } finally {
          setStreamingState(null);
          setIsTyping(false);
        }
      },
      [
        api,
        streamingState,
        setStreamingState,
        setIsTyping,
        messages,
        onMessagesChange,
      ],
    );

    // Determine what to show in the message area.
    const showWelcome =
      messages.length === 0 &&
      !isTyping &&
      !streamingState &&
      !activeSessionId &&
      !loadingConversation;
    // A session is selected but has no messages — either brand-new or data was lost.
    const showEmptySession =
      !showWelcome &&
      messages.length === 0 &&
      !isTyping &&
      !streamingState &&
      !!activeSessionId &&
      !loadingConversation;
    // Show streaming message during generation OR while waiting for approval
    const showStreaming = !!streamingState;

    // Auto-open catalog on first load when Kagenti provider is active
    useEffect(() => {
      if (
        isKagenti &&
        showWelcome &&
        !selectedModel &&
        !catalogAutoOpened.current
      ) {
        catalogAutoOpened.current = true;
        setCatalogOpen(true);
      }
    }, [isKagenti, showWelcome, selectedModel]);

    const activeAgentConfig = useMemo(
      () => chatAgentConfigs.find(c => c.agentId === selectedModel),
      [chatAgentConfigs, selectedModel],
    );

    const selectedAgentInfo: SelectedAgentInfo | undefined = useMemo(() => {
      if (!selectedModel || !isKagenti) return undefined;
      const shortName = selectedModel.includes('/')
        ? selectedModel.split('/').pop()!
        : selectedModel;
      return {
        id: selectedModel,
        name: activeAgentConfig?.displayName || shortName,
        description: agentDescription,
        starters: agentStarters,
        avatarColor: activeAgentConfig?.accentColor,
        avatarUrl: activeAgentConfig?.avatarUrl,
      };
    }, [
      selectedModel,
      isKagenti,
      activeAgentConfig,
      agentDescription,
      agentStarters,
    ]);

    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          marginRight: rightPaneCollapsed ? '56px' : '340px',
          transition: 'margin-right 0.3s ease',
          willChange: 'margin-right',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        {/* Agent Header -- shown whenever an agent is selected, including on welcome */}
        {isKagenti && selectedModel && (
          <ChatHeader
            selectedModel={selectedModel}
            currentAgent={streamingState?.currentAgent}
            onChangeAgent={handleChangeAgent}
            onBrowseAgents={handleOpenCatalog}
            healthWarning={agentHealthWarning ?? undefined}
            agentConfig={activeAgentConfig}
          />
        )}

        {/* Conversation toolbar — export, etc. */}
        {messages.length > 0 && !showWelcome && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              px: { xs: 2, sm: 3, md: 4 },
              py: 0.25,
            }}
          >
            <Tooltip title="Export conversation as JSON" placement="left">
              <IconButton
                size="small"
                onClick={() =>
                  exportConversation(messages, activeSessionId ?? undefined)
                }
                aria-label="Export conversation"
                sx={{
                  p: 0.5,
                  color: 'text.secondary',
                  '&:hover': { color: 'primary.main' },
                }}
              >
                <FileDownloadOutlinedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Execution Trace — live view of agent steps */}
        {(streamingState || lastCompletedStateRef.current) &&
          messages.length > 0 &&
          !showWelcome && (
            <ExecutionTracePanel
              streamingState={streamingState}
              lastCompletedState={lastCompletedStateRef.current}
            />
          )}

        {/* Messages Area */}
        <ChatScrollArea
          scrollContainerRef={scrollContainerRef}
          messagesEndRef={messagesEndRef}
          onScroll={handleScroll}
          showScrollFab={showScrollFab}
          onScrollToBottom={scrollToBottom}
        >
          {/* eslint-disable-next-line no-nested-ternary */}
          {showWelcome ? (
            <WelcomeScreen
              workflows={workflows}
              quickActions={quickActions}
              onQuickActionSelect={handleQuickActionSelect}
              promptGroups={promptGroups}
              showAgentGallery={isKagenti}
              onAgentSelect={handleAgentSelect}
              chatAgentConfigs={chatAgentConfigs}
              selectedAgent={selectedAgentInfo}
              onChangeAgent={handleChangeAgent}
              onStarterSelect={handleStarterClick}
              onBrowseCatalog={handleOpenCatalog}
            />
          ) : showEmptySession ? (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                p: 4,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                }}
              >
                {messagesUnavailable
                  ? t('chat.messagesUnavailableTitle')
                  : t('chat.emptySessionTitle')}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: theme.palette.text.disabled }}
              >
                {messagesUnavailable
                  ? t('chat.messagesUnavailableHint')
                  : t('chat.emptySessionHint')}
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                px: { xs: 2, sm: 3, md: 4 },
                py: 2,
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
              }}
            >
              <Box
                sx={{
                  maxWidth: '1200px',
                  width: '100%',
                  mx: 'auto',
                }}
              >
                <VirtualizedMessageList
                  messages={messages}
                  onRegenerate={handleRegenerate}
                  onEditMessage={isTyping ? undefined : handleEditMessage}
                  selectedMessageIndex={selectedMessageIndex}
                />
                {showStreaming && (
                  <StreamingMessage
                    state={streamingState}
                    onFormSubmit={handleFormSubmit}
                    onFormCancel={handleFormCancel}
                    onAuthConfirm={handleAuthConfirm}
                    onSecretsSubmit={handleSecretsSubmit}
                  />
                )}
                {isTyping && !streamingState && <ThinkingIndicator />}
              </Box>
            </Box>
          )}
        </ChatScrollArea>

        {/* Tool Approval Dialog (HITL) - centered modal */}
        <Dialog
          open={!!pendingApproval}
          maxWidth="sm"
          fullWidth
          disableEscapeKeyDown
          PaperProps={{
            sx: {
              bgcolor: 'transparent',
              boxShadow: 'none',
              overflow: 'visible',
            },
          }}
        >
          {pendingApproval && (
            <ToolApprovalDialog
              pendingApproval={pendingApproval}
              onApprove={handleApprove}
              onReject={handleReject}
              isSubmitting={isApprovalSubmitting}
              error={approvalError}
            />
          )}
        </Dialog>

        {/* Input Area */}
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSendMessage}
          onStop={handleStopGeneration}
          onNewChat={onNewChat}
          placeholder={
            activeAgentConfig?.displayName
              ? `Ask ${activeAgentConfig.displayName} anything...`
              : branding.inputPlaceholder
          }
          isTyping={isTyping || loadingConversation}
          showNewChatButton={messages.length > 0}
          inputRef={chatInputRef}
          activeAgentName={streamingState?.currentAgent}
          selectedModel={selectedModel}
          isKagenti={isKagenti}
          onClearAgent={handleChangeAgent}
          requireAgent={isKagenti && !selectedModel}
        />

        {/* Disclosure Footer */}
        <Typography
          variant="caption"
          sx={{
            textAlign: 'center',
            color: theme.palette.text.disabled,
            fontSize: '0.6875rem',
            py: 0.5,
            px: 2,
            flexShrink: 0,
          }}
        >
          {t('chat.disclaimer')}
        </Typography>

        <KeyboardShortcutsDialog
          open={shortcutsOpen}
          onClose={() => setShortcutsOpen(false)}
        />

        {/* Agent Catalog Dialog */}
        {isKagenti && (
          <AgentCatalogDialog
            open={catalogOpen}
            onClose={handleCloseCatalog}
            onAgentSelect={handleCatalogAgentSelect}
            onStarterSelect={handleCatalogStarterSelect}
            chatAgentConfigs={chatAgentConfigs}
          />
        )}
      </Box>
    );
  },
);

ChatContainer.displayName = 'ChatContainer';
