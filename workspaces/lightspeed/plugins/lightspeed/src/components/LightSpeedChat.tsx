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

import React from 'react';

import { ErrorPanel } from '@backstage/core-components';

import { Box, makeStyles } from '@material-ui/core';
import {
  Chatbot,
  ChatbotContent,
  ChatbotDisplayMode,
  ChatbotFooter,
  ChatbotFootnote,
  ChatbotHeader,
  ChatbotHeaderMain,
  ChatbotHeaderMenu,
  ChatbotHeaderTitle,
  MessageBar,
  MessageProps,
} from '@patternfly/chatbot';
import ChatbotConversationHistoryNav from '@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav';
import { DropdownItem, DropEvent, Title } from '@patternfly/react-core';
import { useQueryClient } from '@tanstack/react-query';

import { TEMP_CONVERSATION_ID } from '../const';
import {
  useBackstageUserIdentity,
  useConversationMessages,
  useConversations,
  useDeleteConversation,
  useIsMobile,
  useLastOpenedConversation,
  useLightspeedDeletePermission,
} from '../hooks';
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
  userName?: string;
  avatar?: string;
  profileLoading: boolean;
  handleSelectedModel: (item: string) => void;
  models: { label: string; value: string }[];
};

export const LightspeedChat = ({
  selectedModel,
  userName,
  avatar,
  profileLoading,
  handleSelectedModel,
  models,
}: LightspeedChatProps) => {
  const isMobile = useIsMobile();
  const classes = useStyles();
  const user = useBackstageUserIdentity();
  const [filterValue, setFilterValue] = React.useState<string>('');
  const [announcement, setAnnouncement] = React.useState<string>('');
  const [conversationId, setConversationId] = React.useState<string>('');
  const [isDrawerOpen, setIsDrawerOpen] = React.useState<boolean>(!isMobile);
  const [newChatCreated, setNewChatCreated] = React.useState<boolean>(false);
  const [isSendButtonDisabled, setIsSendButtonDisabled] =
    React.useState<boolean>(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [targetConversationId, setTargetConversationId] =
    React.useState<string>('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] =
    React.useState<boolean>(false);
  const { isReady, lastOpenedId, setLastOpenedId, clearLastOpenedId } =
    useLastOpenedConversation(user);

  const { fileContents, setFileContents, handleFileUpload } =
    useFileAttachmentContext();

  // Sync conversationId with lastOpenedId whenever lastOpenedId changes
  React.useEffect(() => {
    if (isReady && lastOpenedId !== null) {
      setConversationId(lastOpenedId);
    }
  }, [lastOpenedId, isReady]);

  const queryClient = useQueryClient();

  const {
    data: conversations = [],
    isLoading,
    isRefetching,
  } = useConversations();
  const { mutateAsync: deleteConversation } = useDeleteConversation();
  const { allowed: hasDeleteAccess } = useLightspeedDeletePermission();
  const samplePrompts = useWelcomePrompts();
  React.useEffect(() => {
    if (user && lastOpenedId === null && isReady) {
      setConversationId(TEMP_CONVERSATION_ID);
      setNewChatCreated(true);
    }
  }, [user, isReady, lastOpenedId, setConversationId]);

  React.useEffect(() => {
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

  React.useEffect(() => {
    // Update last opened conversation whenever `conversationId` changes
    if (conversationId) {
      setLastOpenedId(conversationId);
    }
  }, [conversationId, setLastOpenedId]);

  const onStart = (conv_id: string) => {
    setConversationId(conv_id);
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
      avatar,
      onComplete,
      onStart,
    );

  const [messages, setMessages] =
    React.useState<MessageProps[]>(conversationMessages);

  const sendMessage = (message: string | number) => {
    if (conversationId !== TEMP_CONVERSATION_ID) {
      setNewChatCreated(false);
    }
    setAnnouncement(
      `Message from User: ${prompt}. Message from Bot is loading.`,
    );
    handleInputPrompt(message.toString(), getAttachments(fileContents));
    setIsSendButtonDisabled(true);
    setFileContents([]);
  };

  const onNewChat = React.useCallback(() => {
    (async () => {
      if (conversationId !== TEMP_CONVERSATION_ID) {
        setMessages([]);
        setConversationId(TEMP_CONVERSATION_ID);
        setNewChatCreated(true);
      }
    })();
  }, [conversationId, setConversationId, setMessages]);

  const openDeleteModal = (conversation_id: string) => {
    setTargetConversationId(conversation_id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConversation = React.useCallback(() => {
    (async () => {
      try {
        await deleteConversation({
          conversation_id: targetConversationId,
          invalidateCache: false,
        });
        if (targetConversationId === lastOpenedId) {
          onNewChat();
          clearLastOpenedId();
        }
        setIsDeleteModalOpen(false);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(e);
        setError(e);
      }
    })();
  }, [
    deleteConversation,
    clearLastOpenedId,
    lastOpenedId,
    onNewChat,
    targetConversationId,
  ]);

  const additionalMessageProps = React.useCallback(
    (conversationSummary: ConversationSummary) => ({
      menuItems: (
        <DropdownItem
          isDisabled={!hasDeleteAccess}
          onClick={() => openDeleteModal(conversationSummary.conversation_id)}
        >
          Delete
        </DropdownItem>
      ),
    }),
    [hasDeleteAccess],
  );
  const categorizedMessages = getCategorizeMessages(
    conversations,
    additionalMessageProps,
  );

  const filterConversations = React.useCallback(
    (targetValue: string) => {
      const filteredConversations = Object.entries(categorizedMessages).reduce(
        (acc, [key, items]) => {
          const filteredItems = items.filter(item =>
            item.text
              .toLocaleLowerCase('en-US')
              .includes(targetValue.toLocaleLowerCase('en-US')),
          );
          if (filteredItems.length > 0) {
            acc[key] = filteredItems;
          }
          return acc;
        },
        {} as any,
      );
      return filteredConversations;
    },
    [categorizedMessages],
  );

  React.useEffect(() => {
    setMessages(conversationMessages);
  }, [conversationMessages]);

  const onSelectActiveItem = React.useCallback(
    (
      _: React.MouseEvent | undefined,
      selectedItem: string | number | undefined,
    ) => {
      setNewChatCreated(false);
      setConversationId((c_id: string) => {
        if (c_id !== selectedItem) {
          return String(selectedItem);
        }
        return c_id;
      });
      scrollToBottomRef.current?.scrollToBottom();
    },
    [setConversationId, scrollToBottomRef],
  );

  const conversationFound = !!conversations.find(
    (c: ConversationSummary) => c.conversation_id === conversationId,
  );

  const welcomePrompts =
    (newChatCreated && conversationMessages.length === 0) ||
    (!conversationFound && conversationMessages.length === 0)
      ? samplePrompts?.map(prompt => ({
          title: prompt.title,
          message: prompt.message,
          onClick: () => {
            sendMessage(prompt.message);
          },
        }))
      : [];

  const handleFilter = React.useCallback((value: string) => {
    setFilterValue(value);
  }, []);

  const onDrawerToggle = React.useCallback(() => {
    setIsDrawerOpen(isOpen => !isOpen);
  }, []);

  const handleAttach = (data: File[], event: DropEvent) => {
    event.preventDefault();
    handleFileUpload(data);
  };

  if (error) {
    return (
      <Box padding={1}>
        <ErrorPanel error={error} />
      </Box>
    );
  }

  return (
    <>
      {isDeleteModalOpen && (
        <DeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteConversation}
        />
      )}
      <Chatbot
        displayMode={ChatbotDisplayMode.embedded}
        className={classes.body}
      >
        <ChatbotHeader className={classes.header}>
          <ChatbotHeaderMain>
            <ChatbotHeaderMenu
              aria-expanded={isDrawerOpen}
              onMenuToggle={() => setIsDrawerOpen(!isDrawerOpen)}
              className={classes.headerMenu}
            />
            <ChatbotHeaderTitle className={classes.headerTitle}>
              <Title headingLevel="h1" size="3xl">
                Developer Hub Lightspeed
              </Title>
            </ChatbotHeaderTitle>
          </ChatbotHeaderMain>

          <LightspeedChatBoxHeader
            selectedModel={selectedModel}
            handleSelectedModel={item => handleSelectedModel(item)}
            models={models}
          />
        </ChatbotHeader>
        <ChatbotConversationHistoryNav
          drawerPanelContentProps={{ isResizable: true, minSize: '200px' }}
          reverseButtonOrder
          displayMode={ChatbotDisplayMode.embedded}
          onDrawerToggle={onDrawerToggle}
          isDrawerOpen={isDrawerOpen}
          setIsDrawerOpen={setIsDrawerOpen}
          activeItemId={conversationId}
          onSelectActiveItem={onSelectActiveItem}
          conversations={filterConversations(filterValue)}
          onNewChat={newChatCreated ? undefined : onNewChat}
          handleTextInputChange={handleFilter}
          drawerContent={
            <>
              <ChatbotContent>
                <LightspeedChatBox
                  userName={userName}
                  messages={messages}
                  profileLoading={profileLoading}
                  announcement={announcement}
                  ref={scrollToBottomRef}
                  welcomePrompts={welcomePrompts}
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
                />
                <ChatbotFootnote {...getFootnoteProps(classes.footerPopover)} />
              </ChatbotFooter>
            </>
          }
        />
      </Chatbot>
      <Attachment />
    </>
  );
};
