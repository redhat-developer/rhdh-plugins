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
import CodeIcon from '@mui/icons-material/Code';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { useTheme, alpha } from '@mui/material/styles';
import { Message } from '../../types';
import { WelcomeScreen, AgentCatalogDialog } from '../WelcomeScreen';
import type { SelectedAgentInfo } from '../WelcomeScreen';
import { VirtualizedMessageList } from './VirtualizedMessageList';
import { StreamingMessage } from '../StreamingMessage';
import { ToolApprovalDialog } from '../ToolApprovalDialog';
import { ChatInput } from '../ChatInput';
import { useApi } from '@backstage/core-plugin-api';
import { augmentApiRef } from '../../api';
import { exportConversation } from '../../utils';
import {
  useBranding,
  useStreamingChat,
  useToolApproval,
  useChatViewMode,
} from '../../hooks';
import {
  useWelcomeData,
  useChatKeyboardShortcuts,
  useScrollToBottom,
  useStatus,
  useChatAgentConfig,
} from '../../hooks';
import { useAgentSelection } from '../../hooks/useAgentSelection';
import { useInteractivePhases } from '../../hooks/useInteractivePhases';
import { ThinkingIndicator } from './ThinkingIndicator';
import { ChatScrollArea } from './ChatScrollArea';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { ChatHeader } from './ChatHeader';
import { MessageInspectorPanel } from './MessageInspectorPanel';
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
    const isDark = theme.palette.mode === 'dark';
    const { t } = useTranslation();
    const api = useApi(augmentApiRef);
    const { branding } = useBranding();
    const { isDev, toggleMode } = useChatViewMode();

    const [inputValue, setInputValue] = useState('');
    const [inspectedMessage, setInspectedMessage] = useState<
      import('../../types').Message | null
    >(null);
    const { workflows, quickActions, promptGroups } = useWelcomeData();
    const { status } = useStatus();
    const isKagenti = status?.providerId === 'kagenti';
    const providerId = status?.providerId;
    const { configs: chatAgentConfigs } = useChatAgentConfig();
    const chatInputRef = useRef<HTMLTextAreaElement | null>(null);

    const {
      selectedModel,
      setSelectedModel,
      agentHealthWarning,
      agentStarters,
      agentDescription,
      handleAgentSelect,
      resetAgentSelection,
    } = useAgentSelection({
      api,
      isKagenti,
      chatAgentConfigs,
      messages,
      onMessagesChange,
      chatInputRef,
    });

    const handleChangeAgent = useCallback(() => {
      resetAgentSelection();
      if (messages.length > 0 && onNewChat) {
        onNewChat();
      }
    }, [messages.length, onNewChat, resetAgentSelection]);

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
      lastCompletedState,
      isTyping,
      sendMessage,
      cancelRequest,
      resetConversation,
      setStreamingState,
      setIsTyping,
      setPreviousResponseId,
      setConversationId,
      setSessionId,
      setLastCompletedState,
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
        resetAgentSelection();
        setInputValue('');
        onNewChat?.();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [providerId]);

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
      onClearStreamingState: () => {
        setLastCompletedState(streamingState);
        setStreamingState(null);
      },
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const handleFeedback = useCallback(
      (data: import('../ChatMessage/MessageFeedback').MessageFeedbackData) => {
        api.submitMessageFeedback({
          messageId: data.messageId,
          sessionId: activeSessionId ?? undefined,
          direction: data.direction,
          reasons: data.reasons,
          comment: data.comment,
        });
      },
      [api, activeSessionId],
    );

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

    const {
      handleFormSubmit,
      handleFormCancel,
      handleAuthConfirm,
      handleSecretsSubmit,
    } = useInteractivePhases({
      api,
      streamingState,
      messages,
      onMessagesChange,
      setStreamingState,
      setIsTyping,
      setLastCompletedState,
    });

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
            onExport={
              messages.length > 0 && !showWelcome
                ? () =>
                    exportConversation(messages, activeSessionId ?? undefined)
                : undefined
            }
          />
        )}

        {/* Standalone export toolbar — only when no ChatHeader is visible */}
        {messages.length > 0 &&
          !showWelcome &&
          !(isKagenti && selectedModel) && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 0.5,
                px: { xs: 2, sm: 3, md: 4 },
                py: 0.25,
              }}
            >
              <Tooltip
                title={isDev ? 'Switch to User mode' : 'Switch to Dev mode'}
                placement="bottom"
              >
                <IconButton
                  size="small"
                  onClick={toggleMode}
                  aria-label={
                    isDev ? 'Switch to User mode' : 'Switch to Dev mode'
                  }
                  sx={{
                    p: 0.5,
                    borderRadius: 1.5,
                    color: isDev
                      ? theme.palette.warning.main
                      : theme.palette.text.secondary,
                    bgcolor: isDev
                      ? alpha(theme.palette.warning.main, isDark ? 0.15 : 0.08)
                      : 'transparent',
                    '&:hover': {
                      color: isDev
                        ? theme.palette.warning.dark
                        : theme.palette.primary.main,
                      bgcolor: isDev
                        ? alpha(theme.palette.warning.main, 0.2)
                        : alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  {isDev ? (
                    <CodeIcon sx={{ fontSize: 16 }} />
                  ) : (
                    <PersonOutlineIcon sx={{ fontSize: 16 }} />
                  )}
                </IconButton>
              </Tooltip>
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
                  onFeedback={handleFeedback}
                  onInspect={isDev ? setInspectedMessage : undefined}
                  selectedMessageIndex={selectedMessageIndex}
                  scrollRoot={scrollContainerRef}
                />
                {/* Execution Trace — inline with the conversation, above the active response */}
                {(streamingState || lastCompletedState) && (
                  <ExecutionTracePanel
                    streamingState={streamingState}
                    lastCompletedState={lastCompletedState}
                    isStreaming={!!streamingState}
                  />
                )}
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

        {/* Message Inspector (dev mode only) */}
        {isDev && (
          <MessageInspectorPanel
            message={inspectedMessage}
            open={!!inspectedMessage}
            onClose={() => setInspectedMessage(null)}
          />
        )}
      </Box>
    );
  },
);

ChatContainer.displayName = 'ChatContainer';
