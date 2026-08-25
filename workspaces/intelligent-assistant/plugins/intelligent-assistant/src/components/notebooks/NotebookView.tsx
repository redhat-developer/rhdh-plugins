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

import { configApiRef, useApi } from '@backstage/core-plugin-api';

import { makeStyles, Typography } from '@material-ui/core';
import { useTheme } from '@material-ui/core/styles';
import { ChatbotContent, ChatbotFooter, MessageBar } from '@patternfly/chatbot';
import {
  Alert,
  Button,
  Drawer,
  DrawerContent,
  DrawerContentBody,
  DrawerPanelContent,
  Tooltip,
  type AlertProps,
} from '@patternfly/react-core';
import { PlusIcon, TimesIcon } from '@patternfly/react-icons';
import { useQueryClient } from '@tanstack/react-query';

import { notebooksApiRef } from '../../api/notebooksApi';
import {
  NOTEBOOK_MAX_FILES,
  TEMP_CONVERSATION_ID,
  UNTITLED_NOTEBOOK_NAME,
} from '../../const';
import { useCreateNotebookMessage } from '../../hooks/notebooks/useCreateNotebookMessage';
import {
  useDocumentStatusPolling,
  type PendingUpload,
} from '../../hooks/notebooks/useDocumentStatusPolling';
import { useRenameDocument } from '../../hooks/notebooks/useRenameDocument';
import { useRenameNotebookWithAlert } from '../../hooks/notebooks/useRenameNotebookWithAlert';
import { useUploadDocument } from '../../hooks/notebooks/useUploadDocument';
import { useConversationMessages } from '../../hooks/useConversationMessages';
import { useNotebookWelcomePrompts } from '../../hooks/useNotebookWelcomePrompts';
import { useStopConversation } from '../../hooks/useStopConversation';
import { useTranslation } from '../../hooks/useTranslation';
import botAvatarDark from '../../images/bot-avatar-dark.svg';
import botAvatarLight from '../../images/bot-avatar.svg';
import userAvatar from '../../images/user-avatar.svg';
import { NotebookSessionMetadata, SessionDocument } from '../../types';
import { ChatbotFootnoteWithIcon } from '../../utils/lightspeed-chatbox-utils';
import { runFileUploads } from '../../utils/notebook-upload-runner';
import { LightspeedChatBox } from '../LightspeedChatBox';
import { ToastAlertGroup } from '../ToastAlertGroup';
import { AddDocumentModal } from './AddDocumentModal';
import { DeleteDocumentModal } from './DeleteDocumentModal';
import { DocumentSidebar } from './DocumentSidebar';
import { useNotebookStream } from './NotebookStreamProvider';
import { OverwriteConfirmModal } from './OverwriteConfirmModal';
import { AddCircleFilledIcon, SidebarExpandIcon } from './SidebarCollapseIcon';
import { UploadResourceScreen } from './UploadResourceScreen';

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    width: '100%',
    overflow: 'hidden',
    backgroundColor:
      'var(--pf-t--global--background--color--floating--default)',
  },
  drawerContent: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  drawerContainer: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    '& .pf-v6-c-drawer__panel, & .pf-v5-c-drawer__panel': {
      backgroundColor:
        'var(--pf-t--global--background--color--floating--default)',
    },
  },
  expandStrip: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: theme.spacing(1.5),
    gap: theme.spacing(1),
    borderRight: '1px solid var(--pf-t--global--border--color--default)',
    backgroundColor:
      'var(--pf-t--global--background--color--floating--default)',
  },
  addIconButton: {
    padding: 0,
    minWidth: 0,
    lineHeight: 1,
  },
  mainArea: {
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
    minHeight: 0,
    minWidth: 0,
  },
  topBar: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: `${theme.spacing(1.5)}px ${theme.spacing(2)}px`,
    backgroundColor:
      'var(--pf-t--global--background--color--floating--default)',
  },
  closeButton: {
    textTransform: 'none',
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    minWidth: 0,
  },
  drawerContentBody: {
    backgroundColor:
      'var(--pf-t--global--background--color--floating--default)',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    minWidth: 0,
  },
  contentColumn: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    overflow: 'hidden',
  },
  notebookDisclaimerStrip: {
    width: '100%',
    maxWidth: 'unset',
    margin: 0,
    padding: `0 0 ${theme.spacing(1)}px`,
    boxSizing: 'border-box',
    backgroundColor:
      'var(--pf-t--global--background--color--floating--default)',
  },
  notebookDisclaimerInner: {
    width: '95%',
    maxWidth: 'unset',
    margin: '0 auto',
  },
  welcomeContainer: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    backgroundColor:
      'var(--pf-t--global--background--color--floating--default)',
  },
  notebookEmptyUpload: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    minWidth: 0,
    backgroundColor:
      'var(--pf-t--global--background--color--floating--default)',
  },
  notebookContentArea: {
    width: '95%',
    maxWidth: 'unset',
    margin: `${theme.spacing(3)}px auto 0 auto`,
    padding: 0,
  },
  notebookHeading: {
    fontSize: '2rem',
    fontWeight: 500,
    lineHeight: 1.25,
    padding: `${theme.spacing(1)}px 0`,
  },
  notebookSummary: {
    fontSize: '1rem',
    lineHeight: 2,
    color: 'var(--pf-t--global--text--color--regular)',
    paddingTop: theme.spacing(0.5),
  },
  promptSuggestions: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: theme.spacing(1),
    width: '95%',
    maxWidth: 'unset',
    margin: `${theme.spacing(3)}px auto ${theme.spacing(3)}px auto`,
    justifyContent: 'flex-start',
  },
  promptPill: {
    appearance: 'none' as const,
    background: 'transparent',
    border: `1px solid var(--pf-t--global--border--color--default)`,
    borderRadius: '999px',
    padding: `${theme.spacing(1)}px ${theme.spacing(2.5)}px`,
    fontSize: '0.875rem',
    color: 'var(--pf-t--global--text--color--regular)',
    cursor: 'pointer',
    transition: 'background-color 0.15s, border-color 0.15s',
    '&:hover': {
      backgroundColor:
        'var(--pf-t--global--background--color--secondary--default)',
      borderColor: 'var(--pf-t--global--border--color--hover)',
    },
  },
  footer: {
    backgroundColor:
      'var(--pf-t--global--background--color--floating--default) !important',
    '&>.pf-chatbot__footer-container': {
      width: '95% !important',
      maxWidth: 'unset !important',
    },
    '& .pf-chatbot__message-bar': {
      backgroundColor:
        theme.palette.type === 'light'
          ? theme.palette.grey[100]
          : 'var(--pf-t--global--background--color--secondary--default)',
    },
  },
  chatContent: {
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'auto',
    backgroundColor:
      'var(--pf-t--global--background--color--floating--default)',
    '& .pf-chatbot__message-contents': {
      overflowX: 'hidden',
      overflowWrap: 'break-word',
      wordBreak: 'break-word',
    },
  },
}));

type NotebookViewProps = {
  sessionId: string;
  notebookName?: string;
  documents?: SessionDocument[];
  isDocumentsFetching?: boolean;
  metadata?: NotebookSessionMetadata;
  topicSummary?: string;
  userName?: string;
  avatar?: string;
  profileLoading: boolean;
  topicRestrictionEnabled: boolean;
  onClose: () => void;
  isCompact?: boolean;
  sidebarCollapsed: boolean;
  onSidebarCollapsedChange: (collapsed: boolean) => void;
  isUploadModalOpen: boolean;
  onUploadModalOpenChange: (open: boolean) => void;
  onUploadsInProgressChange?: (inProgress: boolean) => void;
};

export const NotebookView = ({
  sessionId,
  notebookName = UNTITLED_NOTEBOOK_NAME,
  documents = [],
  isDocumentsFetching = false,
  metadata,
  topicSummary,
  userName,
  avatar,
  profileLoading,
  topicRestrictionEnabled,
  onClose,
  isCompact = false,
  sidebarCollapsed,
  onSidebarCollapsedChange,
  isUploadModalOpen,
  onUploadModalOpenChange,
  onUploadsInProgressChange,
}: NotebookViewProps) => {
  const classes = useStyles();
  const theme = useTheme();
  const botAvatar =
    theme.palette.type === 'dark' ? botAvatarDark : botAvatarLight;
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const configApi = useApi(configApiRef);
  const notebooksApi = useApi(notebooksApiRef);
  const { mutateAsync: notebookCreateMessage } = useCreateNotebookMessage();

  // Use notebook-specific model from config instead of chat's selected model
  const notebookModel =
    configApi.getOptionalString(
      'intelligent-assistant.notebooks.queryDefaults.model',
    ) || '';

  const [conversationId, setConversationId] = useState(
    metadata?.conversation_id ?? TEMP_CONVERSATION_ID,
  );
  const { mutate: stopConversation } = useStopConversation();

  // Streaming lives in a store above the display-mode remount boundary, so it
  // survives overlay/docked/fullscreen switches. This view only subscribes.
  const {
    messages: streamMessages,
    status: streamStatus,
    requestId,
    send: sendNotebookStream,
    stop: stopNotebookStream,
  } = useNotebookStream(sessionId);
  const isStreaming = streamStatus === 'streaming';

  const [announcement, setAnnouncement] = useState<string | undefined>(
    undefined,
  );
  const [deletingDocumentIds, setDeletingDocumentIds] = useState<Set<string>>(
    new Set(),
  );
  const [deleteDocumentTarget, setDeleteDocumentTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleDeleteDocument = useCallback((documentId: string) => {
    setDeleteDocumentTarget({ id: documentId, name: documentId });
  }, []);

  const { mutateAsync: renameDocument } = useRenameDocument();

  // Read-only: persisted (server) messages + transform. Displayed when the
  // store has no live/finished stream for this session. Sending is handled by
  // the stream store, not this hook.
  const { conversationMessages, scrollToBottomRef } = useConversationMessages(
    conversationId,
    userName,
    notebookModel,
    '',
    avatar,
  );

  // Show the store's transcript whenever there is an active or finished stream
  // for this session; otherwise fall back to persisted server messages.
  const messages =
    streamStatus === 'idle' ? conversationMessages : streamMessages;

  // Keep the local conversation id in sync when the store resolves a temp
  // conversation to its real id (written into the session query cache).
  useEffect(() => {
    if (
      metadata?.conversation_id &&
      metadata.conversation_id !== conversationId
    ) {
      setConversationId(metadata.conversation_id);
    }
  }, [metadata?.conversation_id, conversationId]);

  // Announce the completed bot response for screen readers.
  const prevStatusRef = useRef(streamStatus);
  useEffect(() => {
    if (prevStatusRef.current === 'streaming' && streamStatus === 'complete') {
      const last = streamMessages[streamMessages.length - 1];
      if (last?.role === 'bot' && last.content) {
        setAnnouncement(`Message from Bot: ${last.content}`);
      }
    }
    prevStatusRef.current = streamStatus;
  }, [streamStatus, streamMessages]);

  const sendMessage = useCallback(
    (message: string | number) => {
      const text = message.toString();
      if (!text.trim()) return;
      setAnnouncement(
        t('conversation.announcement.userMessage' as any, { prompt: text }),
      );
      sendNotebookStream({
        prompt: text,
        seedMessages: messages,
        conversationId,
        userName,
        avatar: avatar || userAvatar,
        botAvatar,
        selectedModel: notebookModel,
        createMessage: (prompt: string, options?: { signal?: AbortSignal }) =>
          notebookCreateMessage({ prompt, sessionId, signal: options?.signal }),
      });
    },
    [
      sendNotebookStream,
      messages,
      conversationId,
      userName,
      avatar,
      botAvatar,
      notebookModel,
      notebookCreateMessage,
      sessionId,
      t,
    ],
  );

  const handleStopButton = useCallback(() => {
    if (requestId) {
      stopConversation(requestId);
    }
    stopNotebookStream();
    setAnnouncement(t('conversation.announcement.responseStopped'));
  }, [requestId, stopConversation, stopNotebookStream, t]);

  const notebookPrompts = useNotebookWelcomePrompts();
  const welcomePrompts = notebookPrompts.map(title => ({
    title,
    onClick: () => sendMessage(title),
  }));

  const uploadMutation = useUploadDocument();

  const [uploadingFileNames, setUploadingFileNames] = useState<string[]>([]);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [toastAlerts, setToastAlerts] = useState<Partial<AlertProps>[]>([]);
  const processedIds = useRef<Set<string>>(new Set());
  const [completedFileNames, setCompletedFileNames] = useState<Set<string>>(
    new Set(),
  );
  const [filesToOverwrite, setFilesToOverwrite] = useState<File[]>([]);
  const [allFilesForOverwrite, setAllFilesForOverwrite] = useState<File[]>([]);
  const [isOverwriteModalOpen, setIsOverwriteModalOpen] = useState(false);
  const [filesToAddToModal, setFilesToAddToModal] = useState<File[]>([]);

  const handleRenameDocument = useCallback(
    async (documentId: string, newTitle: string) => {
      try {
        await renameDocument({ sessionId, documentId, newTitle });
      } catch {
        setToastAlerts(prev => [
          {
            key: Date.now() + documentId,
            title: (t as Function)('notebook.document.rename.error', {
              documentName: documentId,
            }) as string,
            variant: 'danger',
          },
          ...prev,
        ]);
      }
    },
    [renameDocument, sessionId, t],
  );
  const handleRenameNotebook = useRenameNotebookWithAlert({
    setAlerts: setToastAlerts,
    getNotebookName: () => notebookName,
  });

  const confirmDeleteDocument = useCallback(async () => {
    if (!deleteDocumentTarget) return;
    const { id: documentId, name: documentName } = deleteDocumentTarget;
    setDeleteDocumentTarget(null);
    setDeletingDocumentIds(prev => new Set(prev).add(documentId));
    try {
      await notebooksApi.deleteDocument(sessionId, documentId);
      queryClient.invalidateQueries({
        queryKey: ['notebooks', 'documents', sessionId],
      });
      setToastAlerts(prev => [
        {
          key: Date.now() + documentId,
          title: (t as Function)('notebook.document.delete.success', {
            documentName,
          }) as string,
          variant: 'success',
        },
        ...prev,
      ]);
    } finally {
      setDeletingDocumentIds(prev => {
        const next = new Set(prev);
        next.delete(documentId);
        return next;
      });
    }
  }, [deleteDocumentTarget, notebooksApi, sessionId, queryClient, t]);

  const handleOpenUploadModal = () => onUploadModalOpenChange(true);
  const handleCloseUploadModal = () => onUploadModalOpenChange(false);

  const handleCloseNotebook = () => {
    onClose();
  };

  const handleFilesUploading = (files: File[]) => {
    setUploadingFileNames(prev => {
      const newNames = files
        .map(f => f.name)
        .filter(name => !prev.includes(name));
      return [...prev, ...newNames];
    });
  };

  const handleUploadStarted = (info: {
    fileName: string;
    documentId: string;
  }) => {
    processedIds.current.delete(info.documentId);
    setPendingUploads(prev => [
      ...prev,
      { fileName: info.fileName, documentId: info.documentId },
    ]);
  };

  const handleUploadFailed = (fileName: string) => {
    setUploadingFileNames(prev => prev.filter(n => n !== fileName));
    setToastAlerts(prev => [
      {
        key: Date.now() + fileName,
        title: (t as Function)('notebook.upload.failed', {
          fileName,
        }) as string,
        variant: 'danger',
      },
      ...prev,
    ]);
  };

  const handleDuplicatesFound = (duplicateFiles: File[], allFiles: File[]) => {
    setFilesToOverwrite(duplicateFiles);
    setAllFilesForOverwrite(allFiles);
    onUploadModalOpenChange(false);
    setIsOverwriteModalOpen(true);
  };

  const handleOverwriteConfirm = (filesToUpload: File[]) => {
    setIsOverwriteModalOpen(false);
    setFilesToOverwrite([]);
    setAllFilesForOverwrite([]);

    if (filesToUpload.length === 0) return;

    runFileUploads(uploadMutation, sessionId, filesToUpload, {
      onUploading: handleFilesUploading,
      onStarted: handleUploadStarted,
      onFailed: handleUploadFailed,
    });
  };

  const handleFilesAddedToModal = () => {
    setFilesToAddToModal([]);
  };

  const handleOverwriteBack = () => {
    setIsOverwriteModalOpen(false);
    setFilesToAddToModal(allFilesForOverwrite);
    setFilesToOverwrite([]);
    setAllFilesForOverwrite([]);
    onUploadModalOpenChange(true);
  };

  const handleOverwriteCancel = () => {
    setIsOverwriteModalOpen(false);
    setFilesToOverwrite([]);
    setAllFilesForOverwrite([]);
  };

  const pollingResults = useDocumentStatusPolling(sessionId, pendingUploads);

  useEffect(() => {
    const completedOrFailed = pollingResults.filter(
      r =>
        (r.status === 'completed' ||
          r.status === 'failed' ||
          r.status === 'cancelled') &&
        !processedIds.current.has(r.documentId),
    );

    if (completedOrFailed.length === 0) return;

    const idsToRemove = new Set<string>();
    const namesToRemove = new Set<string>();
    const newAlerts: Partial<AlertProps>[] = [];

    const newCompletedNames = new Set<string>();

    for (const result of completedOrFailed) {
      processedIds.current.add(result.documentId);
      idsToRemove.add(result.documentId);
      namesToRemove.add(result.fileName);
      if (result.status === 'completed') {
        newCompletedNames.add(result.fileName);
      }

      if (result.status !== 'completed') {
        const errorDetail = result.error ? ` ${result.error}` : '';
        newAlerts.push({
          key: Date.now() + result.documentId,
          title: `${
            (t as Function)('notebook.upload.failed', {
              fileName: result.fileName,
            }) as string
          }${errorDetail}`,
          variant: 'danger',
        });
      }
    }

    setPendingUploads(prev => prev.filter(u => !idsToRemove.has(u.documentId)));
    setUploadingFileNames(prev =>
      prev.filter(name => !namesToRemove.has(name)),
    );
    if (newCompletedNames.size > 0) {
      setCompletedFileNames(prev => new Set([...prev, ...newCompletedNames]));
      queryClient.invalidateQueries({
        queryKey: ['notebooks', 'documents', sessionId],
      });
    }
    setToastAlerts(prev => [...newAlerts, ...prev]);
  }, [pollingResults, t, queryClient, sessionId]);

  const handleRemoveToastAlert = (key: React.Key) => {
    setToastAlerts(prev => prev.filter(a => a.key !== key));
  };

  const totalDocumentCount = documents.length + uploadingFileNames.length;
  const hasUploadsInProgress = pendingUploads.length > 0 || isDocumentsFetching;
  const hasNoDocuments = documents.length === 0;
  const isAddDisabled =
    totalDocumentCount >= NOTEBOOK_MAX_FILES || hasUploadsInProgress;

  useEffect(() => {
    onUploadsInProgressChange?.(hasUploadsInProgress);
  }, [hasUploadsInProgress, onUploadsInProgressChange]);

  const panelContent = (
    <DrawerPanelContent
      isResizable={!isCompact}
      defaultSize={isCompact ? '100%' : '310px'}
      minSize={isCompact ? '100%' : '232px'}
      maxSize={isCompact ? '100%' : '50%'}
      resizeAriaLabel={t('notebook.view.sidebar.resize')}
    >
      <DocumentSidebar
        notebookName={notebookName}
        documents={documents}
        uploadingFileNames={uploadingFileNames}
        completedFileNames={completedFileNames}
        deletingDocumentIds={deletingDocumentIds}
        collapsed={sidebarCollapsed}
        hasUploadsInProgress={hasUploadsInProgress}
        onToggleCollapse={() => onSidebarCollapsedChange(!sidebarCollapsed)}
        onAddDocument={handleOpenUploadModal}
        onDeleteDocument={handleDeleteDocument}
        onRenameDocument={handleRenameDocument}
        onRenameNotebook={newName => handleRenameNotebook(sessionId, newName)}
      />
    </DrawerPanelContent>
  );

  const renderNotebookDisclaimerAlert = () => (
    <div className={classes.notebookDisclaimerStrip}>
      <div className={classes.notebookDisclaimerInner}>
        <Alert isInline variant="info" title={t('aria.important')}>
          {t('disclaimer.withoutValidation')}
        </Alert>
      </div>
    </div>
  );

  const renderMainContent = () => {
    if (hasNoDocuments && messages.length === 0) {
      return (
        <Typography component="span" className={classes.notebookEmptyUpload}>
          <UploadResourceScreen
            onUploadClick={handleOpenUploadModal}
            isProcessing={uploadingFileNames.length > 0}
          />
        </Typography>
      );
    }
    if (messages.length > 0) {
      return (
        <ChatbotContent className={classes.chatContent}>
          <LightspeedChatBox
            userName={userName}
            messages={messages}
            profileLoading={profileLoading}
            announcement={announcement}
            ref={scrollToBottomRef}
            welcomePrompts={[]}
            conversationId={conversationId}
            isStreaming={isStreaming}
            topicRestrictionEnabled={topicRestrictionEnabled}
            showSourcesChipPopover
          />
        </ChatbotContent>
      );
    }
    return (
      <div className={classes.welcomeContainer}>
        <div style={{ flex: 1 }} />
        {renderNotebookDisclaimerAlert()}
        <div className={classes.notebookContentArea}>
          <Typography className={classes.notebookHeading}>
            {notebookName}
          </Typography>
          {topicSummary && (
            <Typography className={classes.notebookSummary}>
              {topicSummary}
            </Typography>
          )}
        </div>
        {welcomePrompts.length > 0 && (
          <div className={classes.promptSuggestions}>
            {welcomePrompts.map(prompt => (
              <button
                key={prompt.title}
                type="button"
                className={classes.promptPill}
                onClick={prompt.onClick}
              >
                {prompt.title}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={classes.root}
      style={isCompact ? { position: 'relative' as const } : undefined}
    >
      <ToastAlertGroup
        alerts={toastAlerts}
        onRemoveAlert={handleRemoveToastAlert}
      />
      <Drawer
        isExpanded={!sidebarCollapsed}
        isInline
        position="start"
        className={classes.drawerContainer}
      >
        <DrawerContent
          panelContent={!sidebarCollapsed ? panelContent : undefined}
          className={classes.drawerContent}
        >
          <DrawerContentBody className={classes.drawerContentBody}>
            <div className={classes.mainArea}>
              {sidebarCollapsed && !isCompact && (
                <div className={classes.expandStrip}>
                  <Tooltip
                    content={t('notebook.view.sidebar.expand')}
                    position="right"
                  >
                    <Button
                      variant="plain"
                      onClick={() => onSidebarCollapsedChange(false)}
                      aria-label={t('notebook.view.sidebar.expand')}
                      size="sm"
                    >
                      <SidebarExpandIcon />
                    </Button>
                  </Tooltip>
                  <Tooltip
                    content={(() => {
                      if (hasUploadsInProgress)
                        return t('notebook.view.documents.uploadsInProgress');
                      if (isAddDisabled)
                        return t('notebook.view.documents.maxReached');
                      return t('notebook.view.documents.add');
                    })()}
                    position="right"
                  >
                    <Typography component="span">
                      <Button
                        variant="plain"
                        className={classes.addIconButton}
                        onClick={
                          isAddDisabled ? undefined : handleOpenUploadModal
                        }
                        aria-label={t('notebook.view.documents.add')}
                        isDisabled={isAddDisabled}
                      >
                        <AddCircleFilledIcon disabled={isAddDisabled} />
                      </Button>
                    </Typography>
                  </Tooltip>
                </div>
              )}

              <div className={classes.contentColumn}>
                {!isCompact && (
                  <div className={classes.topBar}>
                    <Button
                      variant="link"
                      className={classes.closeButton}
                      onClick={handleCloseNotebook}
                      icon={<TimesIcon />}
                      iconPosition="end"
                    >
                      {t('notebook.view.close')}
                    </Button>
                  </div>
                )}

                <div className={classes.mainContent}>{renderMainContent()}</div>

                {hasNoDocuments &&
                  messages.length === 0 &&
                  renderNotebookDisclaimerAlert()}

                <ChatbotFooter className={classes.footer}>
                  {(() => {
                    const addResourceAction = (
                      <Button
                        variant="plain"
                        onClick={handleOpenUploadModal}
                        aria-label={t('notebook.view.documents.add')}
                        size="sm"
                      >
                        <PlusIcon />
                      </Button>
                    );
                    return hasNoDocuments ? (
                      <Tooltip
                        content={t('notebook.view.input.disabledTooltip')}
                        position="top"
                      >
                        <div>
                          <MessageBar
                            hasAttachButton={false}
                            hasMicrophoneButton={false}
                            hasStopButton={false}
                            isSendButtonDisabled
                            isDisabled
                            onSendMessage={sendMessage}
                            placeholder={t('notebook.view.input.placeholder')}
                            forceMultilineLayout
                            additionalActions={addResourceAction}
                            buttonProps={{
                              send: {
                                tooltipContent: t('tooltip.send'),
                              },
                            }}
                          />
                        </div>
                      </Tooltip>
                    ) : (
                      <MessageBar
                        hasAttachButton={false}
                        hasMicrophoneButton
                        hasStopButton={isStreaming}
                        handleStopButton={
                          isStreaming ? handleStopButton : undefined
                        }
                        isSendButtonDisabled={isStreaming}
                        onSendMessage={sendMessage}
                        placeholder={t('notebook.view.input.placeholder')}
                        forceMultilineLayout
                        additionalActions={addResourceAction}
                        buttonProps={{
                          microphone: {
                            tooltipContent: {
                              active: t('tooltip.microphone.active'),
                              inactive: t('tooltip.microphone.inactive'),
                            },
                          },
                          send: {
                            tooltipContent: t('tooltip.send'),
                          },
                        }}
                      />
                    );
                  })()}
                  <ChatbotFootnoteWithIcon label={t('footer.accuracy.label')} />
                </ChatbotFooter>
              </div>
            </div>
          </DrawerContentBody>
        </DrawerContent>
      </Drawer>

      <AddDocumentModal
        isOpen={isUploadModalOpen}
        onClose={handleCloseUploadModal}
        sessionId={sessionId}
        existingDocumentNames={documents.map(d => d.title)}
        hasUploadsInProgress={hasUploadsInProgress}
        onFilesUploading={handleFilesUploading}
        onUploadStarted={handleUploadStarted}
        onUploadFailed={handleUploadFailed}
        onDuplicatesFound={handleDuplicatesFound}
        filesToAdd={filesToAddToModal}
        onFilesAdded={handleFilesAddedToModal}
        isCompact={isCompact}
      />

      <OverwriteConfirmModal
        isOpen={isOverwriteModalOpen}
        onClose={handleOverwriteCancel}
        onConfirm={handleOverwriteConfirm}
        onBack={handleOverwriteBack}
        allFiles={allFilesForOverwrite}
        duplicateFileNames={filesToOverwrite.map(f => f.name)}
        isCompact={isCompact}
      />

      <DeleteDocumentModal
        isOpen={deleteDocumentTarget !== null}
        onClose={() => setDeleteDocumentTarget(null)}
        onConfirm={confirmDeleteDocument}
        documentName={deleteDocumentTarget?.name ?? ''}
        isCompact={isCompact}
      />
    </div>
  );
};
