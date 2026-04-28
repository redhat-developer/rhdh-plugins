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

import { useApi } from '@backstage/core-plugin-api';

import { makeStyles, Typography } from '@material-ui/core';
import {
  ChatbotContent,
  ChatbotFooter,
  ChatbotFootnote,
  ChatbotWelcomePrompt,
  MessageBar,
  MessageProps,
} from '@patternfly/chatbot';
import {
  Alert,
  AlertActionCloseButton,
  AlertGroup,
  AlertVariant,
  Button,
  Drawer,
  DrawerContent,
  DrawerContentBody,
  DrawerPanelContent,
  Tooltip,
  type AlertProps,
} from '@patternfly/react-core';
import { TimesIcon } from '@patternfly/react-icons';
import { useQueryClient } from '@tanstack/react-query';

import { notebooksApiRef } from '../../api/notebooksApi';
import { TEMP_CONVERSATION_ID, UNTITLED_NOTEBOOK_NAME } from '../../const';
import { useCreateNotebookMessage } from '../../hooks/notebooks/useCreateNotebookMessage';
import {
  useDocumentStatusPolling,
  type PendingUpload,
} from '../../hooks/notebooks/useDocumentStatusPolling';
import { useUploadDocument } from '../../hooks/notebooks/useUploadDocument';
import { useConversationMessages } from '../../hooks/useConversationMessages';
import { CreateMessageVariables } from '../../hooks/useCreateCoversationMessage';
import { useTranslation } from '../../hooks/useTranslation';
import { useWelcomePrompts } from '../../hooks/useWelcomePrompts';
import { NotebookSessionMetadata, SessionDocument } from '../../types';
import { LightspeedChatBox } from '../LightspeedChatBox';
import { AddDocumentModal } from './AddDocumentModal';
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
    height: '100%',
    backgroundColor: 'var(--pf-t--global--background--color--primary--default)',
  },
  drawerContainer: {
    flex: 1,
    minHeight: 0,
  },
  expandStrip: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: theme.spacing(1.5),
    gap: theme.spacing(1),
    borderRight: '1px solid var(--pf-t--global--border--color--default)',
  },
  addIconButton: {
    padding: 0,
    minWidth: 0,
    lineHeight: 1,
  },
  mainArea: {
    display: 'flex',
    flexDirection: 'row',
    height: '100%',
    minWidth: 0,
  },
  topBar: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: `${theme.spacing(1.5)}px ${theme.spacing(2)}px`,
  },
  closeButton: {
    textTransform: 'none',
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
  },
  drawerContentBody: {
    backgroundColor:
      'var(--pf-t--global--background--color--secondary--default)',
    height: '100%',
  },
  contentColumn: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    overflow: 'hidden',
  },
  alertContainer: {
    width: '95%',
    maxWidth: 'unset',
    margin: '0 auto',
    padding: `0 0 ${theme.spacing(1)}px`,
  },
  toastAlertGroup: {
    '--pf-v6-c-alert-group--m-toast--InsetInlineEnd': `${theme.spacing(2.5)}px`,
    '--pf-v6-c-alert-group--m-toast--InsetBlockStart': `${theme.spacing(2.5)}px`,
    '--pf-v6-c-alert-group--m-toast--MaxWidth': '350px',
  },
  toastAlert: {
    maxWidth: '350px',
    '& .pf-v6-c-alert__title': {
      margin: 0,
    },
  },
  welcomeContainer: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
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
    width: '95%',
    maxWidth: 'unset',
    margin: '0 auto',
  },
  footerAlignedAlert: {
    maxWidth: 'unset',
    width: '95%',
    margin: '0 auto',
    padding: `0 0 ${theme.spacing(1)}px`,
  },
  footer: {
    '&>.pf-chatbot__footer-container': {
      width: '95% !important',
      maxWidth: 'unset !important',
    },
  },
  chatContent: {
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'auto',
  },
}));

type NotebookViewProps = {
  sessionId: string;
  notebookName?: string;
  documents?: SessionDocument[];
  metadata?: NotebookSessionMetadata;
  topicSummary?: string;
  userName?: string;
  avatar?: string;
  profileLoading: boolean;
  topicRestrictionEnabled: boolean;
  onClose: () => void;
};

export const NotebookView = ({
  sessionId,
  notebookName = UNTITLED_NOTEBOOK_NAME,
  documents = [],
  metadata,
  topicSummary,
  userName,
  avatar,
  profileLoading,
  topicRestrictionEnabled,
  onClose,
}: NotebookViewProps) => {
  const classes = useStyles();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const notebooksApi = useApi(notebooksApiRef);
  const uploadMutation = useUploadDocument();
  const { mutateAsync: notebookCreateMessage } = useCreateNotebookMessage();

  const [conversationId, setConversationId] = useState(
    metadata?.conversation_id ?? TEMP_CONVERSATION_ID,
  );
  const [isSendButtonDisabled, setIsSendButtonDisabled] = useState(false);
  const [announcement, setAnnouncement] = useState<string | undefined>(
    undefined,
  );
  const [deletingDocumentIds, setDeletingDocumentIds] = useState<Set<string>>(
    new Set(),
  );

  const handleDeleteDocument = useCallback(
    async (documentId: string) => {
      setDeletingDocumentIds(prev => new Set(prev).add(documentId));
      try {
        await notebooksApi.deleteDocument(sessionId, documentId);
        queryClient.invalidateQueries({
          queryKey: ['notebooks', 'documents', sessionId],
        });
      } finally {
        setDeletingDocumentIds(prev => {
          const next = new Set(prev);
          next.delete(documentId);
          return next;
        });
      }
    },
    [notebooksApi, sessionId, queryClient],
  );

  const onComplete = useCallback(
    (message: string) => {
      setIsSendButtonDisabled(false);
      setAnnouncement(`Message from Bot: ${message}`);
      queryClient.invalidateQueries({
        queryKey: ['conversationMessages', conversationId],
      });
    },
    [queryClient, conversationId],
  );

  const onStart = useCallback((conv_id: string) => {
    setConversationId(conv_id);
  }, []);

  const createMessageAdapter = useCallback(
    async (vars: CreateMessageVariables) => {
      return notebookCreateMessage({
        prompt: vars.prompt,
        sessionId,
      });
    },
    [notebookCreateMessage, sessionId],
  );

  const { conversationMessages, handleInputPrompt, scrollToBottomRef } =
    useConversationMessages(
      conversationId,
      userName,
      '',
      '',
      avatar,
      onComplete,
      onStart,
      createMessageAdapter,
    );

  const [messages, setMessages] =
    useState<MessageProps[]>(conversationMessages);

  useEffect(() => {
    setMessages(conversationMessages);
  }, [conversationMessages]);

  const sendMessage = useCallback(
    (message: string | number) => {
      setAnnouncement(
        t('conversation.announcement.userMessage' as any, {
          prompt: message.toString(),
        }),
      );
      handleInputPrompt(message.toString(), []);
      setIsSendButtonDisabled(true);
    },
    [handleInputPrompt, t],
  );

  const samplePrompts = useWelcomePrompts();
  const welcomePrompts =
    samplePrompts?.map(prompt => {
      const p = prompt as { title: string; message: string };
      return {
        title: p.title,
        message: p.message,
        onClick: () => sendMessage(p.message),
      };
    }) ?? [];

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadingFileNames, setUploadingFileNames] = useState<string[]>([]);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [toastAlerts, setToastAlerts] = useState<Partial<AlertProps>[]>([]);
  const processedIds = useRef<Set<string>>(new Set());
  const [completedFileNames, setCompletedFileNames] = useState<Set<string>>(
    new Set(),
  );
  const [filesToOverwrite, setFilesToOverwrite] = useState<File[]>([]);
  const [isOverwriteModalOpen, setIsOverwriteModalOpen] = useState(false);

  const handleOpenUploadModal = () => setIsUploadModalOpen(true);
  const handleCloseUploadModal = () => setIsUploadModalOpen(false);

  const handleFilesUploading = (files: File[]) => {
    setUploadingFileNames(prev => [...prev, ...files.map(f => f.name)]);
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

  const handleDuplicatesFound = (files: File[]) => {
    setFilesToOverwrite(files);
    setIsOverwriteModalOpen(true);
  };

  const handleOverwriteConfirm = () => {
    const files = filesToOverwrite;
    setIsOverwriteModalOpen(false);
    setFilesToOverwrite([]);

    if (files.length === 0) return;

    setUploadingFileNames(prev => [...prev, ...files.map(f => f.name)]);
    for (const file of files) {
      uploadMutation
        .mutateAsync({ sessionId, file })
        .then(data => {
          handleUploadStarted({
            fileName: file.name,
            documentId: data.document_id,
          });
        })
        .catch(() => {
          handleUploadFailed(file.name);
        });
    }
  };

  const handleOverwriteCancel = () => {
    setIsOverwriteModalOpen(false);
    setFilesToOverwrite([]);
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
      if (result.status !== 'completed') {
        namesToRemove.add(result.fileName);
      } else {
        newCompletedNames.add(result.fileName);
      }

      if (result.status === 'completed') {
        newAlerts.push({
          key: Date.now() + result.documentId,
          title: (t as Function)('notebook.upload.success', {
            fileName: result.fileName,
          }) as string,
          variant: 'success',
        });
      } else {
        newAlerts.push({
          key: Date.now() + result.documentId,
          title: (t as Function)('notebook.upload.failed', {
            fileName: result.fileName,
          }) as string,
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

  const hasDocuments = documents.length > 0 || uploadingFileNames.length > 0;

  const panelContent = (
    <DrawerPanelContent
      isResizable
      defaultSize="310px"
      minSize="232px"
      maxSize="50%"
      resizeAriaLabel={t('notebook.view.sidebar.resize')}
    >
      <DocumentSidebar
        notebookName={notebookName}
        documents={documents}
        uploadingFileNames={uploadingFileNames}
        completedFileNames={completedFileNames}
        deletingDocumentIds={deletingDocumentIds}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
        onAddDocument={handleOpenUploadModal}
        onDeleteDocument={handleDeleteDocument}
      />
    </DrawerPanelContent>
  );

  const renderMainContent = () => {
    if (!hasDocuments && messages.length === 0) {
      return <UploadResourceScreen onUploadClick={handleOpenUploadModal} />;
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
          />
        </ChatbotContent>
      );
    }
    return (
      <div className={classes.welcomeContainer}>
        <div className={classes.alertContainer}>
          <Alert isInline variant="info" title={t('aria.important')}>
            {t('disclaimer.withoutValidation')}
          </Alert>
        </div>
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
            <ChatbotWelcomePrompt
              title=""
              description=""
              prompts={welcomePrompts}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={classes.root}>
      {toastAlerts.length > 0 && (
        <AlertGroup
          hasAnimations
          isToast
          isLiveRegion
          className={classes.toastAlertGroup}
        >
          {toastAlerts.map(({ key, title, variant }) => (
            <Alert
              key={key}
              variant={AlertVariant[variant ?? 'success']}
              title={title}
              className={classes.toastAlert}
              timeout={2000}
              onTimeout={() => handleRemoveToastAlert(key as React.Key)}
              actionClose={
                <AlertActionCloseButton
                  title={title as string}
                  variantLabel={`${variant ?? 'success'} alert`}
                  onClose={() => handleRemoveToastAlert(key as React.Key)}
                />
              }
            />
          ))}
        </AlertGroup>
      )}
      <Drawer
        isExpanded={!sidebarCollapsed}
        isInline
        position="start"
        className={classes.drawerContainer}
      >
        <DrawerContent
          panelContent={!sidebarCollapsed ? panelContent : undefined}
        >
          <DrawerContentBody className={classes.drawerContentBody}>
            <div className={classes.mainArea}>
              {sidebarCollapsed && (
                <div className={classes.expandStrip}>
                  <Tooltip
                    content={t('notebook.view.sidebar.expand')}
                    position="right"
                  >
                    <Button
                      variant="plain"
                      onClick={() => setSidebarCollapsed(false)}
                      aria-label={t('notebook.view.sidebar.expand')}
                      size="sm"
                    >
                      <SidebarExpandIcon />
                    </Button>
                  </Tooltip>
                  <Tooltip
                    content={t('notebook.view.documents.add')}
                    position="right"
                  >
                    <Button
                      variant="plain"
                      className={classes.addIconButton}
                      onClick={handleOpenUploadModal}
                      aria-label={t('notebook.view.documents.add')}
                    >
                      <AddCircleFilledIcon />
                    </Button>
                  </Tooltip>
                </div>
              )}

              <div className={classes.contentColumn}>
                <div className={classes.topBar}>
                  <Button
                    variant="link"
                    className={classes.closeButton}
                    onClick={onClose}
                    icon={<TimesIcon />}
                    iconPosition="end"
                  >
                    {t('notebook.view.close')}
                  </Button>
                </div>

                <div className={classes.mainContent}>{renderMainContent()}</div>

                {!hasDocuments && messages.length === 0 && (
                  <div className={classes.footerAlignedAlert}>
                    <Alert isInline variant="info" title={t('aria.important')}>
                      {t('disclaimer.withoutValidation')}
                    </Alert>
                  </div>
                )}

                <ChatbotFooter className={classes.footer}>
                  {documents.length === 0 ? (
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
                        />
                      </div>
                    </Tooltip>
                  ) : (
                    <MessageBar
                      hasAttachButton={false}
                      hasMicrophoneButton
                      hasStopButton={false}
                      isSendButtonDisabled={isSendButtonDisabled}
                      onSendMessage={sendMessage}
                      placeholder={t('notebook.view.input.placeholder')}
                    />
                  )}
                  <ChatbotFootnote label={t('footer.accuracy.label')} />
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
        onFilesUploading={handleFilesUploading}
        onUploadStarted={handleUploadStarted}
        onUploadFailed={handleUploadFailed}
        onDuplicatesFound={handleDuplicatesFound}
      />

      <OverwriteConfirmModal
        isOpen={isOverwriteModalOpen}
        onClose={handleOverwriteCancel}
        onConfirm={handleOverwriteConfirm}
        fileNames={filesToOverwrite.map(f => f.name)}
      />
    </div>
  );
};
