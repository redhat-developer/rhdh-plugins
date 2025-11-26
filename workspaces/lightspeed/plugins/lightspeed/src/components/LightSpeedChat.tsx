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

import { MouseEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { FileRejection } from 'react-dropzone/.';

import { makeStyles } from '@material-ui/core';
import Divider from '@mui/material/Divider';
import {
  Chatbot,
  ChatbotAlert,
  ChatbotContent,
  ChatbotDisplayMode,
  ChatbotFooter,
  ChatbotFootnote,
  ChatbotHeader,
  ChatbotHeaderMain,
  ChatbotHeaderMenu,
  ChatbotHeaderTitle,
  ChatbotModal,
  FileDropZone,
  MessageBar,
  MessageProps,
} from '@patternfly/chatbot';
import ChatbotConversationHistoryNav from '@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav';
import { DropdownItem, DropEvent, Title } from '@patternfly/react-core';
import { PlusIcon, SearchIcon } from '@patternfly/react-icons';
import { useQueryClient } from '@tanstack/react-query';

import { supportedFileTypes, TEMP_CONVERSATION_ID } from '../const';
import {
  useBackstageUserIdentity,
  useConversationMessages,
  useConversations,
  useIsMobile,
  useLastOpenedConversation,
  useLightspeedDeletePermission,
} from '../hooks';
import { useLightspeedDrawerContext } from '../hooks/useLightspeedDrawerContext';
import { useLightspeedUpdatePermission } from '../hooks/useLightspeedUpdatePermission';
import { useTranslation } from '../hooks/useTranslation';
import { useWelcomePrompts } from '../hooks/useWelcomePrompts';
import { ConversationSummary } from '../types';
import { getAttachments } from '../utils/attachment-utils';
import {
  getCategorizeMessages,
  getFootnoteProps,
} from '../utils/lightspeed-chatbox-utils';
import Attachment from './Attachment';
import { useFileAttachmentContext } from './AttachmentContext';
import { DeleteModal } from './DeleteModal';
import FilePreview from './FilePreview';
import { LightspeedChatBox } from './LightspeedChatBox';
import { LightspeedChatBoxHeader } from './LightspeedChatBoxHeader';
import { RenameConversationModal } from './RenameConversationModal';
import { ResizableDrawer } from './ResizableDrawer';

const useStyles = makeStyles(theme => ({
  body: {
    // remove default margin and padding from common elements
    '& h1, & h2, & h3, & h4, & h5, & h6, & p, & ul, & ol, & li': {
      margin: 0,
      padding: 0,
    },
  },
  header: {
    padding: `${theme.spacing(3)}px !important`,
  },
  errorContainer: {
    padding: theme.spacing(3),
  },
  headerMenu: {
    // align hamburger icon with title
    '& .pf-v6-c-button': {
      display: 'flex',
      alignItems: 'center',
    },
  },
  headerTitle: {
    justifyContent: 'left !important',
  },
  footer: {
    '&>.pf-chatbot__footer-container': {
      width: '95% !important',
      maxWidth: 'unset !important',
    },
  },
  footerPopover: {
    '& img': {
      maxWidth: '100%',
    },
  },
}));

type LightspeedChatProps = {
  selectedModel: string;
  topicRestrictionEnabled: boolean;
  selectedProvider: string;
  userName?: string;
  avatar?: string;
  profileLoading: boolean;
  handleSelectedModel: (item: string) => void;
  models: { label: string; value: string; provider: string }[];
};

export const LightspeedChat = ({
  selectedModel,
  topicRestrictionEnabled,
  selectedProvider,
  userName,
  avatar,
  profileLoading,
  handleSelectedModel,
  models,
}: LightspeedChatProps) => {
  const isMobile = useIsMobile();
  const classes = useStyles();
  const { t } = useTranslation();
  const user = useBackstageUserIdentity();
  const [filterValue, setFilterValue] = useState<string>('');
  const [announcement, setAnnouncement] = useState<string>('');
  const [conversationId, setConversationId] = useState<string>('');
  const [isEmbeddedDrawerOpen, setIsEmbeddedDrawerOpen] =
    useState<boolean>(!isMobile);
  const [newChatCreated, setNewChatCreated] = useState<boolean>(false);
  const [isSendButtonDisabled, setIsSendButtonDisabled] =
    useState<boolean>(false);
  const [isPinningChatsEnabled, setIsPinningChatsEnabled] = useState(true);
  const [pinnedChats, setPinnedChats] = useState<string[]>([]);
  const [targetConversationId, setTargetConversationId] = useState<string>('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState<boolean>(false);
  const { isReady, lastOpenedId, setLastOpenedId, clearLastOpenedId } =
    useLastOpenedConversation(user);
  const {
    displayMode,
    setDisplayMode,
    drawerWidth,
    setDrawerWidth,
    currentConversationId: routeConversationId,
    setCurrentConversationId,
  } = useLightspeedDrawerContext();
  const {
    uploadError,
    showAlert,
    fileContents,
    setShowAlert,
    setFileContents,
    handleFileUpload,
    setUploadError,
  } = useFileAttachmentContext();

  // Sync conversationId with lastOpenedId whenever lastOpenedId changes
  useEffect(() => {
    if (isReady && lastOpenedId !== null) {
      setConversationId(lastOpenedId);
    }
  }, [lastOpenedId, isReady]);

  useEffect(() => {
    if (!isPinningChatsEnabled) {
      setPinnedChats([]);
    }
  }, [isPinningChatsEnabled]);

  useEffect(() => {
    if (displayMode === ChatbotDisplayMode.embedded) {
      setIsEmbeddedDrawerOpen(true);
    } else if (
      displayMode === ChatbotDisplayMode.docked ||
      displayMode === ChatbotDisplayMode.default
    ) {
      setIsEmbeddedDrawerOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayMode]);

  const queryClient = useQueryClient();

  const {
    data: conversations = [],
    isLoading,
    isRefetching,
  } = useConversations();

  const { allowed: hasDeleteAccess } = useLightspeedDeletePermission();
  const { allowed: hasUpdateAccess } = useLightspeedUpdatePermission();
  const samplePrompts = useWelcomePrompts();
  useEffect(() => {
    if (user && lastOpenedId === null && isReady) {
      setConversationId(TEMP_CONVERSATION_ID);
      setNewChatCreated(true);
    }
  }, [user, isReady, lastOpenedId, setConversationId]);

  useEffect(() => {
    // Clear last opened conversationId when there are no conversations.
    if (
      !isLoading &&
      !isRefetching &&
      conversations.length === 0 &&
      lastOpenedId
    ) {
      clearLastOpenedId();
    }
  }, [isLoading, isRefetching, conversations, lastOpenedId, clearLastOpenedId]);

  useEffect(() => {
    if (
      !isLoading &&
      !isRefetching &&
      routeConversationId &&
      displayMode === ChatbotDisplayMode.embedded
    ) {
      const conversationExists = conversations.some(
        (c: ConversationSummary) => c.conversation_id === routeConversationId,
      );
      if (!conversationExists) {
        // Conversation from route doesn't exist, start a new chat
        setConversationId(TEMP_CONVERSATION_ID);
        setCurrentConversationId(undefined);
        setNewChatCreated(true);
      } else if (conversationId !== routeConversationId) {
        setConversationId(routeConversationId);
      }
    }
  }, [
    isLoading,
    isRefetching,
    routeConversationId,
    conversations,
    displayMode,
    conversationId,
    setCurrentConversationId,
  ]);

  useEffect(() => {
    // Update last opened conversation whenever `conversationId` changes
    if (conversationId) {
      setLastOpenedId(conversationId);
    }
  }, [conversationId, setLastOpenedId]);

  const onStart = (conv_id: string) => {
    setConversationId(conv_id);
    setCurrentConversationId(conv_id);
  };

  const onComplete = (message: string) => {
    setIsSendButtonDisabled(false);
    setAnnouncement(`Message from Bot: ${message}`);
    queryClient.invalidateQueries({
      queryKey: ['conversations'],
    });
    queryClient.invalidateQueries({
      queryKey: ['conversationMessages', conversationId],
    });
    setNewChatCreated(false);
  };

  const { conversationMessages, handleInputPrompt, scrollToBottomRef } =
    useConversationMessages(
      conversationId,
      userName,
      selectedModel,
      selectedProvider,
      avatar,
      onComplete,
      onStart,
    );

  const [messages, setMessages] =
    useState<MessageProps[]>(conversationMessages);

  const sendMessage = (message: string | number) => {
    if (conversationId !== TEMP_CONVERSATION_ID) {
      setNewChatCreated(false);
    }
    setAnnouncement(
      t('conversation.announcement.userMessage' as any, {
        prompt: message.toString(),
      }),
    );
    handleInputPrompt(message.toString(), getAttachments(fileContents));
    setIsSendButtonDisabled(true);
    setFileContents([]);
  };

  const onNewChat = useCallback(() => {
    (async () => {
      if (conversationId !== TEMP_CONVERSATION_ID) {
        setMessages([]);
        setFileContents([]);
        setUploadError({ message: null });
        setConversationId(TEMP_CONVERSATION_ID);
        setNewChatCreated(true);
        setCurrentConversationId(undefined);
        if (displayMode !== ChatbotDisplayMode.embedded) {
          setIsEmbeddedDrawerOpen(false);
        }
      }
    })();
  }, [
    conversationId,
    setFileContents,
    setUploadError,
    displayMode,
    setCurrentConversationId,
  ]);

  const openDeleteModal = (conversation_id: string) => {
    setTargetConversationId(conversation_id);
    setIsDeleteModalOpen(true);
  };

  const openChatRenameModal = (conversation_id: string) => {
    setTargetConversationId(conversation_id);
    setIsRenameModalOpen(true);
  };

  const handleDeleteConversation = useCallback(() => {
    if (targetConversationId === lastOpenedId) {
      onNewChat();
      clearLastOpenedId();
    }
    setIsDeleteModalOpen(false);
  }, [clearLastOpenedId, lastOpenedId, onNewChat, targetConversationId]);

  const pinChat = (convId: string) => {
    setPinnedChats(prev => [...prev, convId]); // write to user settings in future
  };

  const unpinChat = (convId: string) => {
    setPinnedChats(prev => prev.filter(id => id !== convId)); // write to user settings in future
  };

  const additionalMessageProps = useCallback(
    (conversationSummary: ConversationSummary) => {
      const isChatFavorite = pinnedChats?.find(
        c => c === conversationSummary.conversation_id,
      );
      return {
        menuItems: (
          <>
            <DropdownItem
              isDisabled={!hasUpdateAccess}
              onClick={() =>
                openChatRenameModal(conversationSummary.conversation_id)
              }
            >
              {t('conversation.rename')}
            </DropdownItem>
            {isPinningChatsEnabled && (
              <>
                {isChatFavorite ? (
                  <DropdownItem
                    onClick={() =>
                      unpinChat(conversationSummary.conversation_id)
                    }
                  >
                    {t('conversation.removeFromPinnedChats')}
                  </DropdownItem>
                ) : (
                  <DropdownItem
                    onClick={() => pinChat(conversationSummary.conversation_id)}
                  >
                    {t('conversation.addToPinnedChats')}
                  </DropdownItem>
                )}
              </>
            )}
            <DropdownItem
              isDisabled={!hasDeleteAccess}
              onClick={() =>
                openDeleteModal(conversationSummary.conversation_id)
              }
            >
              {t('conversation.delete')}
            </DropdownItem>
          </>
        ),
      };
    },
    [pinnedChats, hasDeleteAccess, isPinningChatsEnabled, hasUpdateAccess, t],
  );

  const categorizedMessages = useMemo(
    () =>
      getCategorizeMessages(
        conversations,
        pinnedChats,
        additionalMessageProps,
        t,
      ),
    [additionalMessageProps, conversations, pinnedChats, t],
  );

  const filterConversations = useCallback(
    (targetValue: string) => {
      const pinnedChatsKey = t('conversation.category.pinnedChats') || 'Pinned';
      let isNoPinnedChatsSearchResults = false;
      let isNoRecentChatsSearchResults = false;
      const filteredConversations = Object.entries(categorizedMessages).reduce(
        (acc, [key, items]) => {
          const filteredItems = items.filter(item =>
            item.text
              .toLocaleLowerCase('en-US')
              .includes(targetValue.toLocaleLowerCase('en-US')),
          );
          const isPinnedCategory = key === pinnedChatsKey;
          if (isPinnedCategory && isPinningChatsEnabled) {
            if (filteredItems.length > 0) {
              acc[pinnedChatsKey] = filteredItems;
            } else {
              isNoPinnedChatsSearchResults =
                categorizedMessages[pinnedChatsKey].length > 0;
              acc[pinnedChatsKey] = [
                {
                  id: isNoPinnedChatsSearchResults
                    ? 'no-pinned-chats-search-results'
                    : 'no-pinned-chats',
                  text: isNoPinnedChatsSearchResults
                    ? t('common.noSearchResults')
                    : t('chatbox.emptyState.noPinnedChats'),
                  noIcon: true,
                  additionalProps: {
                    isDisabled: true,
                  },
                },
              ];
            }
          } else if (!isPinnedCategory) {
            if (filteredItems.length > 0) {
              acc[key] = filteredItems;
            } else {
              isNoRecentChatsSearchResults =
                categorizedMessages[key].length > 0;

              acc[key] = [
                {
                  id: isNoRecentChatsSearchResults
                    ? 'no-recent-chats-search-results'
                    : 'no-recent-chats',
                  text: isNoRecentChatsSearchResults
                    ? t('common.noSearchResults')
                    : t('chatbox.emptyState.noRecentChats'),
                  noIcon: true,
                  additionalProps: {
                    isDisabled: true,
                  },
                },
              ];
            }
          }
          return acc;
        },
        {} as any,
      );
      // If both sections had items but search filtered them all out, return empty object
      // so PatternFly's default empty state shows instead of custom empty state messages
      if (isNoPinnedChatsSearchResults && isNoRecentChatsSearchResults) {
        return {};
      }
      return filteredConversations;
    },
    [categorizedMessages, isPinningChatsEnabled, t],
  );

  useEffect(() => {
    setMessages(conversationMessages);
  }, [conversationMessages]);

  const onSelectActiveItem = useCallback(
    (_: MouseEvent | undefined, selectedItem: string | number | undefined) => {
      setNewChatCreated(false);
      const newConvId = String(selectedItem);
      setConversationId((c_id: string) => {
        if (c_id !== selectedItem) {
          return newConvId;
        }
        return c_id;
      });
      setCurrentConversationId(newConvId);
      setFileContents([]);
      setUploadError({ message: null });
      scrollToBottomRef.current?.scrollToBottom();
    },
    [
      setConversationId,
      setUploadError,
      setFileContents,
      scrollToBottomRef,
      setCurrentConversationId,
    ],
  );

  const conversationFound = !!conversations.find(
    (c: ConversationSummary) => c.conversation_id === conversationId,
  );

  const welcomePrompts =
    (newChatCreated && conversationMessages.length === 0) ||
    (!conversationFound && conversationMessages.length === 0)
      ? samplePrompts?.map(prompt => {
          const p = prompt as { title: string; message: string };
          return {
            title: p.title,
            message: p.message,
            onClick: () => {
              sendMessage(p.message);
            },
          };
        })
      : [];

  const handleFilter = useCallback((value: string) => {
    setFilterValue(value);
  }, []);

  const onEmbeddedDrawerToggle = useCallback(() => {
    setIsEmbeddedDrawerOpen(isOpen => !isOpen);
  }, []);

  const handleAttach = (data: File[], event: DropEvent) => {
    event.preventDefault();
    handleFileUpload(data);
  };

  const onAttachRejected = (data: FileRejection[]) => {
    data.forEach(attachment => {
      if (!!attachment.errors.find(e => e.code === 'file-invalid-type')) {
        setShowAlert(true);
        setUploadError({
          message: t('file.upload.error.unsupportedType'),
        });
      }
    });
  };

  const chatbot = (
    <Chatbot displayMode={ChatbotDisplayMode.embedded} className={classes.body}>
      <ChatbotHeader className={classes.header}>
        <ChatbotHeaderMain>
          <ChatbotHeaderMenu
            aria-expanded={isEmbeddedDrawerOpen}
            onMenuToggle={() => setIsEmbeddedDrawerOpen(!isEmbeddedDrawerOpen)}
            className={classes.headerMenu}
            tooltipContent={t('tooltip.chatHistoryMenu')}
            aria-label={t('aria.chatHistoryMenu')}
          />
          {displayMode === ChatbotDisplayMode.embedded && (
            <ChatbotHeaderTitle className={classes.headerTitle}>
              <Title headingLevel="h1" size="3xl">
                {t('chatbox.header.title')}
              </Title>
            </ChatbotHeaderTitle>
          )}
        </ChatbotHeaderMain>

        <LightspeedChatBoxHeader
          selectedModel={selectedModel}
          handleSelectedModel={item => {
              onNewChat();
              handleSelectedModel(item);
            }}
          models={models}
          isPinningChatsEnabled={isPinningChatsEnabled}
          onPinnedChatsToggle={setIsPinningChatsEnabled}
          isModelSelectorDisabled={isSendButtonDisabled}
          setDisplayMode={setDisplayMode}
          displayMode={displayMode}
        />
      </ChatbotHeader>
      <Divider />
      <ChatbotConversationHistoryNav
        drawerPanelContentProps={{
          isResizable: displayMode === ChatbotDisplayMode.embedded,
          hasNoBorder: displayMode !== ChatbotDisplayMode.embedded,
          style:
            displayMode === ChatbotDisplayMode.embedded
              ? undefined
              : { zIndex: 1300 },
        }}
        reverseButtonOrder
        displayMode={ChatbotDisplayMode.embedded}
        onDrawerToggle={onEmbeddedDrawerToggle}
        title=""
        navTitleIcon={null}
        isDrawerOpen={isEmbeddedDrawerOpen}
        drawerCloseButtonProps={{
          'aria-label': t('aria.closeDrawerPanel'),
        }}
        setIsDrawerOpen={setIsEmbeddedDrawerOpen}
        activeItemId={conversationId}
        onSelectActiveItem={onSelectActiveItem}
        conversations={filterConversations(filterValue)}
        onNewChat={newChatCreated ? undefined : onNewChat}
        newChatButtonText={t('button.newChat')}
        newChatButtonProps={{
          icon: <PlusIcon />,
        }}
        handleTextInputChange={handleFilter}
        searchInputPlaceholder={t('chatbox.search.placeholder')}
        searchInputAriaLabel={t('aria.search.placeholder')}
        searchInputProps={{
          value: filterValue,
          onClear: () => {
            setFilterValue('');
          },
        }}
        noResultsState={
          filterValue &&
          Object.keys(filterConversations(filterValue)).length === 0
            ? {
                bodyText: t('chatbox.emptyState.noResults.body'),
                titleText: t('chatbox.emptyState.noResults.title'),
                icon: SearchIcon,
              }
            : undefined
        }
        drawerContent={
          <FileDropZone
            onFileDrop={(e, data) => handleAttach(data, e)}
            displayMode={ChatbotDisplayMode.embedded}
            infoText={t('chatbox.fileUpload.infoText')}
            allowedFileTypes={supportedFileTypes}
            onAttachRejected={onAttachRejected}
          >
            {showAlert && uploadError.message && (
              <div className={classes.errorContainer}>
                <ChatbotAlert
                  component="h4"
                  title={t('chatbox.fileUpload.failed')}
                  variant={uploadError.type ?? 'danger'}
                  isInline
                  onClose={() => setUploadError({ message: null })}
                >
                  {uploadError.message}
                </ChatbotAlert>
              </div>
            )}

            <ChatbotContent>
              <LightspeedChatBox
                userName={userName}
                messages={messages}
                profileLoading={profileLoading}
                announcement={announcement}
                ref={scrollToBottomRef}
                welcomePrompts={welcomePrompts}
                conversationId={conversationId}
                isStreaming={isSendButtonDisabled}
                topicRestrictionEnabled={topicRestrictionEnabled}
                displayMode={displayMode}
              />
            </ChatbotContent>
            <ChatbotFooter className={classes.footer}>
              <FilePreview />
              <MessageBar
                onSendMessage={sendMessage}
                isSendButtonDisabled={isSendButtonDisabled}
                hasAttachButton
                handleAttach={handleAttach}
                hasMicrophoneButton
                buttonProps={{
                  attach: {
                    inputTestId: 'attachment-input',
                    tooltipContent: t('tooltip.attach'),
                  },
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
                allowedFileTypes={supportedFileTypes}
                onAttachRejected={onAttachRejected}
                placeholder={t('chatbox.message.placeholder')}
              />
              <ChatbotFootnote
                {...getFootnoteProps(classes.footerPopover, t)}
              />
            </ChatbotFooter>
          </FileDropZone>
        }
      />
    </Chatbot>
  );

  const getChatDisplay = () => {
    if (displayMode === ChatbotDisplayMode.docked) {
      return (
        <ResizableDrawer
          isDrawerOpen
          drawerWidth={drawerWidth}
          onWidthChange={setDrawerWidth}
        >
          {chatbot}
        </ResizableDrawer>
      );
    }
    if (displayMode === ChatbotDisplayMode.default) {
      return (
        <ChatbotModal
          isOpen
          displayMode={displayMode}
          onClose={() => {}}
          ouiaId="LightspeedChatbotModal"
          aria-labelledby="lightspeed-chatpopup-modal"
        >
          {chatbot}
        </ChatbotModal>
      );
    }

    return chatbot;
  };

  return (
    <>
      {isDeleteModalOpen && (
        <DeleteModal
          isOpen={isDeleteModalOpen}
          conversationId={targetConversationId}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteConversation}
        />
      )}
      {isRenameModalOpen && (
        <RenameConversationModal
          isOpen={isRenameModalOpen}
          onClose={() => setIsRenameModalOpen(false)}
          conversationId={targetConversationId}
        />
      )}
      {getChatDisplay()}
      <Attachment />
    </>
  );
};
