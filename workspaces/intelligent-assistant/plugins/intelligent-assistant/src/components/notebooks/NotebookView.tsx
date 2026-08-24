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
import {
  ChatbotContent,
  ChatbotFooter,
  MessageBar,
  MessageProps,
} from '@patternfly/chatbot';
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
import { CreateMessageVariables } from '../../hooks/useCreateCoversationMessage';
import { useNotebookWelcomePrompts } from '../../hooks/useNotebookWelcomePrompts';
import { useStopConversation } from '../../hooks/useStopConversation';
import { useTranslation } from '../../hooks/useTranslation';
import {
  NotebookSession,
  NotebookSessionMetadata,
  SessionDocument,
} from '../../types';
import { ChatbotFootnoteWithIcon } from '../../utils/lightspeed-chatbox-utils';
import { runFileUploads } from '../../utils/notebook-upload-runner';
import { LightspeedChatBox } from '../LightspeedChatBox';
import { ToastAlertGroup } from '../ToastAlertGroup';
import { AddDocumentModal } from './AddDocumentModal';
import { DeleteDocumentModal } from './DeleteDocumentModal';
import { DocumentSidebar } from './DocumentSidebar';
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
    backgroundColor: 'var(--pf-t--global--background--color--primary--default)',
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
    backgroundColor: 'var(--pf-t--global--background--color--primary--default)',
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
  modeSwitchRef?: React.MutableRefObject<boolean>;
};

// Module-level cache for preserving notebook streaming state across display mode switches.
// When the user switches modes mid-stream, the component unmounts but the async streaming
// loop continues in the background. This cache bridges the gap so the remounted component
// can show the accumulated messages while waiting for the background stream to complete.
const notebookStreamCache = new Map<
  string,
  {
    messages: MessageProps[];
    conversationId: string;
    wasStreaming: boolean;
  }
>();

// Module-level store for relaying live streaming tokens across display mode
// switches. The background streaming loop writes here via onConversationsUpdate;
// the remounted component subscribes and displays tokens in real-time.
type StreamListener = (messages: MessageProps[]) => void;
const notebookLiveStreamMessages = new Map<string, MessageProps[]>();
const notebookLiveStreamListeners = new Map<string, Set<StreamListener>>();

function emitLiveStreamUpdate(sessionId: string, messages: MessageProps[]) {
  notebookLiveStreamMessages.set(sessionId, messages);
  notebookLiveStreamListeners.get(sessionId)?.forEach(l => l(messages));
}

function subscribeLiveStream(
  sessionId: string,
  listener: StreamListener,
): () => void {
  if (!notebookLiveStreamListeners.has(sessionId)) {
    notebookLiveStreamListeners.set(sessionId, new Set());
  }
  notebookLiveStreamListeners.get(sessionId)!.add(listener);
  const current = notebookLiveStreamMessages.get(sessionId);
  if (current && current.length > 0) listener(current);
  return () => {
    notebookLiveStreamListeners.get(sessionId)?.delete(listener);
  };
}

function clearLiveStream(sessionId: string) {
  notebookLiveStreamMessages.delete(sessionId);
  notebookLiveStreamListeners.delete(sessionId);
}

// Module-level metadata for the background stream (requestId, completion).
// Callbacks on the dead instance write here; the remounted instance reads
// and subscribes so it can stop the stream and know when it finishes.
type StreamMeta = { requestId: string; complete: boolean };
type MetaListener = (meta: StreamMeta) => void;
const notebookStreamMeta = new Map<string, StreamMeta>();
const notebookStreamMetaListeners = new Map<string, Set<MetaListener>>();

function setStreamMeta(sessionId: string, update: Partial<StreamMeta>) {
  const prev = notebookStreamMeta.get(sessionId) ?? {
    requestId: '',
    complete: false,
  };
  const next = { ...prev, ...update };
  notebookStreamMeta.set(sessionId, next);
  notebookStreamMetaListeners.get(sessionId)?.forEach(l => l(next));
}

function subscribeStreamMeta(
  sessionId: string,
  listener: MetaListener,
): () => void {
  if (!notebookStreamMetaListeners.has(sessionId)) {
    notebookStreamMetaListeners.set(sessionId, new Set());
  }
  notebookStreamMetaListeners.get(sessionId)!.add(listener);
  const current = notebookStreamMeta.get(sessionId);
  if (current) listener(current);
  return () => {
    notebookStreamMetaListeners.get(sessionId)?.delete(listener);
  };
}

function clearStreamMeta(sessionId: string) {
  notebookStreamMeta.delete(sessionId);
  notebookStreamMetaListeners.delete(sessionId);
}

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
  modeSwitchRef,
}: NotebookViewProps) => {
  const classes = useStyles();
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

  const cachedStreamState = notebookStreamCache.get(sessionId);
  // When overlay→dock happens in the same React render cycle, the cleanup
  // effect that populates notebookStreamCache hasn't run yet. Fall back to
  // the live stream store which is written synchronously during streaming.
  let recoveryState = cachedStreamState;
  if (!recoveryState) {
    const liveStreamSnapshot = notebookLiveStreamMessages.get(sessionId);
    if (liveStreamSnapshot && liveStreamSnapshot.length > 0) {
      const meta = notebookStreamMeta.get(sessionId);
      recoveryState = {
        messages: liveStreamSnapshot,
        conversationId: metadata?.conversation_id ?? TEMP_CONVERSATION_ID,
        wasStreaming: !meta?.complete,
      };
    }
  }

  const [conversationId, setConversationId] = useState(
    metadata?.conversation_id ??
      recoveryState?.conversationId ??
      TEMP_CONVERSATION_ID,
  );
  const [isSendButtonDisabled, setIsSendButtonDisabled] = useState(
    recoveryState?.wasStreaming ?? false,
  );
  const [requestId, setRequestId] = useState(
    () => notebookStreamMeta.get(sessionId)?.requestId ?? '',
  );
  const { mutate: stopConversation } = useStopConversation();
  const wasStoppedByUserRef = useRef(false);
  const autoDeleteRef = useRef({
    isUntitled: false,
    isEmpty: true,
    noPending: true,
    noUploading: true,
    noChat: true,
  });
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

  const onComplete = useCallback(
    (message: string) => {
      setIsSendButtonDisabled(false);
      clearLiveStream(sessionId);
      setStreamMeta(sessionId, { complete: true });
      if (!wasStoppedByUserRef.current) {
        setAnnouncement(`Message from Bot: ${message}`);
      }
      wasStoppedByUserRef.current = false;
      queryClient.invalidateQueries({
        queryKey: ['conversationMessages', conversationId],
      });
    },
    [queryClient, conversationId, sessionId],
  );

  const onStart = useCallback(
    (conv_id: string) => {
      setConversationId(conv_id);
      queryClient.setQueryData<NotebookSession>(
        ['notebooks', 'session', sessionId],
        old =>
          old
            ? {
                ...old,
                metadata: { ...old.metadata, conversation_id: conv_id },
              }
            : old,
      );
      queryClient.invalidateQueries({
        queryKey: ['conversationMessages', conv_id],
      });
    },
    [queryClient, sessionId],
  );

  const createMessageAdapter = useCallback(
    async (vars: CreateMessageVariables) => {
      return notebookCreateMessage({
        prompt: vars.prompt,
        sessionId,
      });
    },
    [notebookCreateMessage, sessionId],
  );

  const onRequestIdReady = useCallback(
    (rid: string, convId?: string) => {
      setRequestId(rid);
      setStreamMeta(sessionId, { requestId: rid });
      if (convId) {
        queryClient.setQueryData<NotebookSession>(
          ['notebooks', 'session', sessionId],
          old =>
            old
              ? {
                  ...old,
                  metadata: { ...old.metadata, conversation_id: convId },
                }
              : old,
        );
      }
    },
    [queryClient, sessionId],
  );

  const onConversationsUpdate = useCallback(
    (msgs: MessageProps[]) => {
      emitLiveStreamUpdate(sessionId, msgs);
    },
    [sessionId],
  );

  const { conversationMessages, handleInputPrompt, scrollToBottomRef } =
    useConversationMessages(
      conversationId,
      userName,
      notebookModel,
      '',
      avatar,
      onComplete,
      onStart,
      createMessageAdapter,
      onRequestIdReady,
      onConversationsUpdate,
    );

  const [messages, setMessages] = useState<MessageProps[]>(
    () => recoveryState?.messages ?? conversationMessages,
  );

  // Refs to capture latest values for cleanup functions
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;
  const isSendButtonDisabledRef = useRef(isSendButtonDisabled);
  isSendButtonDisabledRef.current = isSendButtonDisabled;

  // Track whether we're recovering from a cached mode switch
  const isRecoveringFromCacheRef = useRef(!!recoveryState);
  const cachedMessageCountRef = useRef(recoveryState?.messages.length ?? 0);

  // Clear the cache entry after reading it on mount
  useEffect(() => {
    notebookStreamCache.delete(sessionId);
  }, [sessionId]);

  // Subscribe to live streaming updates from the background loop during recovery
  useEffect(() => {
    if (!isRecoveringFromCacheRef.current) return undefined;
    return subscribeLiveStream(sessionId, msgs => {
      if (msgs.length > 0) {
        setMessages(msgs);
      }
    });
  }, [sessionId]);

  // Subscribe to stream metadata so the new instance receives requestId
  // updates and the stream-complete signal from the old instance's callbacks.
  useEffect(() => {
    return subscribeStreamMeta(sessionId, meta => {
      if (meta.requestId) {
        setRequestId(meta.requestId);
      }
      if (meta.complete && isRecoveringFromCacheRef.current) {
        isRecoveringFromCacheRef.current = false;
        cachedMessageCountRef.current = 0;
        setIsSendButtonDisabled(false);
        clearLiveStream(sessionId);
      }
    });
  }, [sessionId]);

  // Sync messages from the hook, with recovery-aware gating
  useEffect(() => {
    if (isRecoveringFromCacheRef.current) {
      // During recovery, only switch to server data once the stream has
      // actually completed. The count check alone is insufficient because the
      // server may already have the inflight pair with empty/partial content.
      const meta = notebookStreamMeta.get(sessionId);
      if (meta?.complete) {
        isRecoveringFromCacheRef.current = false;
        cachedMessageCountRef.current = 0;
        setMessages(conversationMessages);
        setIsSendButtonDisabled(false);
        clearLiveStream(sessionId);
      }
    } else {
      setMessages(conversationMessages);
    }
  }, [conversationMessages, sessionId]);

  // Cache messages on unmount only during display mode switches so the
  // remounted instance can restore state. Tab switches, navigation, and
  // explicit close do not remount the notebook.
  useEffect(() => {
    const modeSwitchRefCurrent = modeSwitchRef;
    return () => {
      if (modeSwitchRefCurrent?.current && messagesRef.current.length > 0) {
        notebookStreamCache.set(sessionId, {
          messages: messagesRef.current,
          conversationId: conversationIdRef.current,
          wasStreaming: isSendButtonDisabledRef.current,
        });
      }
    };
  }, [sessionId, modeSwitchRef]);

  // During recovery, sync conversationId from metadata if the background
  // stream's onRequestIdReady updated the session cache after our unmount
  useEffect(() => {
    if (
      isRecoveringFromCacheRef.current &&
      metadata?.conversation_id &&
      conversationId === TEMP_CONVERSATION_ID
    ) {
      setConversationId(metadata.conversation_id);
    }
  }, [metadata?.conversation_id, conversationId]);

  const sendMessage = useCallback(
    (message: string | number) => {
      wasStoppedByUserRef.current = false;
      setStreamMeta(sessionId, { requestId: '', complete: false });
      setAnnouncement(
        t('conversation.announcement.userMessage' as any, {
          prompt: message.toString(),
        }),
      );
      handleInputPrompt(message.toString(), []);
      setIsSendButtonDisabled(true);
    },
    [handleInputPrompt, sessionId, t],
  );

  const handleStopButton = useCallback(() => {
    wasStoppedByUserRef.current = true;
    const rid = requestId || notebookStreamMeta.get(sessionId)?.requestId || '';
    if (rid) {
      stopConversation(rid);
      setRequestId('');
      setStreamMeta(sessionId, { requestId: '', complete: true });
    }
    setIsSendButtonDisabled(false);
    clearLiveStream(sessionId);
    setAnnouncement(t('conversation.announcement.responseStopped'));
  }, [requestId, sessionId, stopConversation, t]);

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

  autoDeleteRef.current = {
    isUntitled: notebookName === UNTITLED_NOTEBOOK_NAME,
    isEmpty: documents.length === 0 && completedFileNames.size === 0,
    noPending: !pendingUploads.length,
    noUploading: !uploadingFileNames.length,
    noChat: conversationId === TEMP_CONVERSATION_ID,
  };

  useEffect(() => {
    const modeSwitchRefCurrent = modeSwitchRef;
    return () => {
      // Display-mode switches remount the component but should preserve the
      // notebook and its streaming state. All other unmount reasons (tab
      // switch, navigation, explicit close) should clean up and auto-delete
      // empty untitled notebooks.
      if (modeSwitchRefCurrent?.current) {
        modeSwitchRefCurrent.current = false;
        queryClient.invalidateQueries({
          queryKey: ['notebooks', 'sessions'],
        });
        return;
      }
      notebookStreamCache.delete(sessionId);
      clearLiveStream(sessionId);
      clearStreamMeta(sessionId);
      const currentNotebook = autoDeleteRef.current;
      if (
        currentNotebook.isUntitled &&
        currentNotebook.isEmpty &&
        currentNotebook.noPending &&
        currentNotebook.noUploading &&
        currentNotebook.noChat
      ) {
        notebooksApi
          .deleteSession(sessionId)
          .then(() => {
            queryClient.invalidateQueries({
              queryKey: ['notebooks', 'sessions'],
            });
          })
          .catch(() => {});
      } else {
        queryClient.invalidateQueries({
          queryKey: ['notebooks', 'sessions'],
        });
      }
    };
  }, [notebooksApi, sessionId, queryClient, modeSwitchRef]);

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
            isStreaming={isSendButtonDisabled}
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
                        hasStopButton={isSendButtonDisabled}
                        handleStopButton={
                          isSendButtonDisabled ? handleStopButton : undefined
                        }
                        isSendButtonDisabled={isSendButtonDisabled}
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
