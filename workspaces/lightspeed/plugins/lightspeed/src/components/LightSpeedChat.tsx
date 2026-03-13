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
  ChangeEvent,
  MouseEvent,
  Ref,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  FileRejection,
  type DropEvent as ReactDropzoneDropEvent,
} from 'react-dropzone';

import { makeStyles, Typography } from '@material-ui/core';
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
  FileDropZone,
  MessageBar,
  MessageProps,
} from '@patternfly/chatbot';
import ChatbotConversationHistoryNav from '@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
  Tab,
  Tabs,
  Title,
  Tooltip,
} from '@patternfly/react-core';
import {
  EllipsisVIcon,
  PlusCircleIcon,
  PlusIcon,
  SearchIcon,
  SortAmountDownAltIcon,
  SortAmountDownIcon,
} from '@patternfly/react-icons';
import { CatalogIcon } from '@patternfly/react-icons/dist/esm/icons';
import { useQueryClient } from '@tanstack/react-query';

import { supportedFileTypes, TEMP_CONVERSATION_ID } from '../const';
import {
  useBackstageUserIdentity,
  useConversationMessages,
  useConversations,
  useIsMobile,
  useLastOpenedConversation,
  useLightspeedDeletePermission,
  useNotebookSessions,
  usePinnedChatsSettings,
  useSortSettings,
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
  SortOption,
} from '../utils/lightspeed-chatbox-utils';
import Attachment from './Attachment';
import { useFileAttachmentContext } from './AttachmentContext';
import { DeleteModal } from './DeleteModal';
import { DeleteNotebookModal } from './DeleteNotebookModal';
import FilePreview from './FilePreview';
import { LightspeedChatBox } from './LightspeedChatBox';
import { LightspeedChatBoxHeader } from './LightspeedChatBoxHeader';
import { RenameConversationModal } from './RenameConversationModal';
import { RenameNotebookModal } from './RenameNotebookModal';

const useStyles = makeStyles(theme => ({
  body: {
    // remove default margin and padding from common elements
    '& h1, & h2, & h3, & h4, & h5, & h6, & p, & ul, & ol, & li': {
      margin: 0,
      padding: 0,
    },
  },
  header: {
    padding: `${theme.spacing(3)}px ${theme.spacing(3)}px 0 ${theme.spacing(
      3,
    )}px !important`,
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
  tabs: {
    padding: `${theme.spacing(2)}px ${theme.spacing(3)}px 0`,
    backgroundColor:
      'var(--pf-t--global--background--color--floating--default)',
    '& .pf-v6-c-tabs__item, & .pf-v5-c-tabs__item': {
      backgroundColor: 'transparent',
    },
    '& .pf-v6-c-tabs__item:not(:last-child), & .pf-v5-c-tabs__item:not(:last-child)':
      {
        marginRight: theme.spacing(5),
      },
    '& .pf-v6-c-tabs__link, & .pf-v5-c-tabs__link': {
      backgroundColor: 'transparent',
      paddingBottom: theme.spacing(2),
      fontWeight: 700,
    },
    '& .pf-v6-c-tabs__item.pf-m-current .pf-v6-c-tabs__link, & .pf-v5-c-tabs__item.pf-m-current .pf-v5-c-tabs__link':
      {
        color: 'var(--pf-t--global--text--color--brand--default)',
      },
  },
  tabsDivider: {
    borderTop: '1px solid var(--pf-t--global--border--color--default)',
  },
  notebooksContainer: {
    padding: theme.spacing(3),
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  notebooksHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(4),
  },
  notebooksHeading: {
    marginBottom: 0,
  },
  notebooksHeadingEmpty: {
    '&&': {
      marginBottom: theme.spacing(1),
      paddingBottom: theme.spacing(1),
    },
  },
  notebooksEmptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  notebooksIcon: {
    fontSize: 48,
    color: 'var(--pf-t--global--icon--color--subtle)',
    marginBottom: theme.spacing(1.5),
  },
  notebooksDescription: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(3),
    maxWidth: 420,
  },
  notebooksAction: {
    textTransform: 'none',
    borderRadius: 999,
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
  },
  notebooksActionEmpty: {
    textTransform: 'none',
    borderRadius: 999,
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
    marginTop: theme.spacing(3),
  },
  notebooksGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: theme.spacing(2),
    width: '100%',
    maxWidth: '100%',
    [theme.breakpoints.down('md')]: {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },
    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
    },
  },
  notebookCard: {
    borderRadius: theme.spacing(1.5),
    display: 'flex',
    flexDirection: 'column',
  },
  notebookCardHeader: {
    padding: theme.spacing(2),
    paddingBottom: 0,
    alignItems: 'center',
  },
  notebookCardDivider: {
    borderTop: '1px solid var(--pf-t--global--border--color--default)',
    marginTop: theme.spacing(1),
  },
  notebookCardBody: {
    padding: theme.spacing(2),
    paddingTop: theme.spacing(1.5),
  },
  notebookDocuments: {
    paddingTop: theme.spacing(1),
    paddingLeft: theme.spacing(2),
  },
  notebookUpdated: {
    paddingBottom: theme.spacing(5),
    paddingLeft: theme.spacing(2),
    paddingTop: theme.spacing(2),
  },
  notebookTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    minWidth: 0,
    flex: 1,
  },
  notebookCardHeaderActions: {
    marginLeft: theme.spacing(1),
  },
  notebookTitleText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  notebookMenuButton: {
    color: theme.palette.text.secondary,
  },
  notebookDropdownList: {
    paddingTop: 0,
    paddingBottom: 0,
    paddingInlineStart: 0,
  },
  notebookDropdownMenu: {
    '--pf-v6-c-menu--PaddingBlockStart': '0',
    '--pf-v6-c-menu--PaddingBlockEnd': '0',
  },
  notebookDropdownItem: {
    justifyContent: 'flex-start',
    textAlign: 'left',
    paddingLeft: theme.spacing(1.5),
    paddingRight: theme.spacing(1.5),
  },
  footer: {
    '&>.pf-chatbot__footer-container': {
      width: '95% !important',
      maxWidth: 'unset !important',
    },
  },
  sortDropdown: {
    padding: 0,
    margin: 0,
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
  const [activeTab, setActiveTab] = useState<number>(0);
  const { data: notebooks = [], refetch: refetchNotebooks } =
    useNotebookSessions(activeTab === 1);
  const hasNotebooks = notebooks.length > 0;
  const [openNotebookMenuId, setOpenNotebookMenuId] = useState<string | null>(
    null,
  );
  const [renameNotebookId, setRenameNotebookId] = useState<string | null>(null);
  const [deleteNotebookId, setDeleteNotebookId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string>('');
  const [newChatCreated, setNewChatCreated] = useState<boolean>(false);
  const [isSendButtonDisabled, setIsSendButtonDisabled] =
    useState<boolean>(false);
  const [targetConversationId, setTargetConversationId] = useState<string>('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState<boolean>(false);
  const [isSortSelectOpen, setIsSortSelectOpen] = useState<boolean>(false);
  const { isReady, lastOpenedId, setLastOpenedId, clearLastOpenedId } =
    useLastOpenedConversation(user);
  const {
    displayMode,
    setDisplayMode,
    currentConversationId: routeConversationId,
    setCurrentConversationId,
    draftMessage,
    setDraftMessage,
  } = useLightspeedDrawerContext();
  const isFullscreenMode = displayMode === ChatbotDisplayMode.embedded;
  const showChatPanel = !isFullscreenMode || activeTab === 0;
  const showNotebooksPanel = isFullscreenMode && activeTab !== 0;
  const [isChatHistoryDrawerOpen, setIsChatHistoryDrawerOpen] =
    useState<boolean>(!isMobile && isFullscreenMode);

  const handleNotebookTabSelect = (
    _event: React.MouseEvent<any>,
    tabIndex: number | string,
  ) => {
    const nextTab = Number(tabIndex);
    setActiveTab(nextTab);
    if (nextTab === 1) {
      refetchNotebooks();
    }
  };

  // Open the chat history drawer when entering fullscreen mode on desktop
  useEffect(() => {
    if (!isMobile && isFullscreenMode) {
      setIsChatHistoryDrawerOpen(true);
    }
  }, [isMobile, isFullscreenMode]);

  const {
    isPinningChatsEnabled,
    pinnedChats,
    handlePinningChatsToggle,
    pinChat,
    unpinChat,
  } = usePinnedChatsSettings(user);

  const { selectedSort, handleSortChange } = useSortSettings(user);

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
    if (!user || !isReady) return;
    if (lastOpenedId === null) {
      setConversationId(TEMP_CONVERSATION_ID);
    }
    if (lastOpenedId === TEMP_CONVERSATION_ID || lastOpenedId === null) {
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
      isFullscreenMode
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
    isFullscreenMode,
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
    setDraftMessage('');
  };

  const onNewChat = useCallback(() => {
    (async () => {
      if (conversationId !== TEMP_CONVERSATION_ID) {
        setMessages([]);
        setFileContents([]);
        setUploadError({ message: null });
        setDraftMessage('');
        setConversationId(TEMP_CONVERSATION_ID);
        setNewChatCreated(true);
        setCurrentConversationId(undefined);
        if (!isFullscreenMode) {
          setIsChatHistoryDrawerOpen(false);
        }
      }
    })();
  }, [
    conversationId,
    setFileContents,
    setUploadError,
    setDraftMessage,
    setCurrentConversationId,
    isFullscreenMode,
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
    [
      pinnedChats,
      hasDeleteAccess,
      isPinningChatsEnabled,
      hasUpdateAccess,
      t,
      pinChat,
      unpinChat,
    ],
  );

  const categorizedMessages = useMemo(
    () =>
      getCategorizeMessages(
        conversations,
        pinnedChats,
        additionalMessageProps,
        t,
        selectedSort,
      ),
    [additionalMessageProps, conversations, pinnedChats, t, selectedSort],
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
      setDraftMessage('');
      scrollToBottomRef.current?.scrollToBottom();
    },
    [
      setConversationId,
      setUploadError,
      setFileContents,
      setDraftMessage,
      scrollToBottomRef,
      setCurrentConversationId,
    ],
  );

  const conversationFound = !!conversations.find(
    (c: ConversationSummary) => c.conversation_id === conversationId,
  );

  const getMaxPrompts = () => {
    if (isFullscreenMode) {
      return samplePrompts?.length; // In the Fullscreen mode, show all prompts
    }
    if (displayMode === ChatbotDisplayMode.docked) {
      return 2; // In the docked mode, show 2 prompts
    }
    return 1; // In the overlay mode, show 1 prompt
  };
  const maxPrompts = getMaxPrompts();

  const welcomePrompts =
    (newChatCreated && conversationMessages.length === 0) ||
    (!conversationFound && conversationMessages.length === 0)
      ? samplePrompts?.slice(0, maxPrompts).map(prompt => {
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

  const onChatHistoryDrawerToggle = useCallback(() => {
    setIsChatHistoryDrawerOpen(isOpen => !isOpen);
  }, []);

  const onSortToggle = useCallback(() => {
    setIsSortSelectOpen(prev => !prev);
  }, []);

  const onSortSelect = useCallback(
    (_event?: MouseEvent<Element>, value?: string | number) => {
      handleSortChange(value as SortOption);
      setIsSortSelectOpen(false);
    },
    [handleSortChange],
  );

  const getSortLabel = useCallback(
    (option: SortOption): string => {
      const labels: Record<SortOption, string> = {
        newest: t('sort.newest'),
        oldest: t('sort.oldest'),
        alphabeticalAsc: t('sort.alphabeticalAsc'),
        alphabeticalDesc: t('sort.alphabeticalDesc'),
      };
      return labels[option];
    },
    [t],
  );

  const sortToggle = useCallback(
    (toggleRef: Ref<MenuToggleElement>) => (
      <Tooltip content={`${t('sort.label')} - ${getSortLabel(selectedSort)}`}>
        <MenuToggle
          ref={toggleRef}
          aria-label={t('sort.label')}
          variant="plain"
          onClick={onSortToggle}
          isExpanded={isSortSelectOpen}
        >
          {selectedSort === 'oldest' || selectedSort === 'alphabeticalDesc' ? (
            <SortAmountDownAltIcon />
          ) : (
            <SortAmountDownIcon />
          )}
        </MenuToggle>
      </Tooltip>
    ),
    [t, getSortLabel, selectedSort, onSortToggle, isSortSelectOpen],
  );

  const sortDropdown = useMemo(
    () => (
      <Select
        id="sort-select"
        isOpen={isSortSelectOpen}
        selected={selectedSort}
        onSelect={onSortSelect}
        onOpenChange={(isOpen: boolean) => setIsSortSelectOpen(isOpen)}
        popperProps={{ position: 'end' }}
        toggle={sortToggle}
        shouldFocusToggleOnSelect
      >
        <SelectList className={classes.sortDropdown}>
          <SelectOption value="newest">{t('sort.newest')}</SelectOption>
          <SelectOption value="oldest">{t('sort.oldest')}</SelectOption>
          <SelectOption value="alphabeticalAsc">
            {t('sort.alphabeticalAsc')}
          </SelectOption>
          <SelectOption value="alphabeticalDesc">
            {t('sort.alphabeticalDesc')}
          </SelectOption>
        </SelectList>
      </Select>
    ),
    [
      isSortSelectOpen,
      selectedSort,
      onSortSelect,
      sortToggle,
      t,
      classes.sortDropdown,
    ],
  );

  const getDocumentsCount = (documentIds?: string[]) => {
    return Array.isArray(documentIds) ? documentIds.length : 0;
  };

  const formatUpdatedLabel = (updatedAt: string) => {
    const updatedDate = new Date(updatedAt);
    if (Number.isNaN(updatedDate.getTime())) {
      return updatedAt;
    }
    const now = new Date();
    const diffMs = now.getTime() - updatedDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) {
      return t('notebooks.updated.today');
    }
    if (diffDays === 1) {
      return t('notebooks.updated.yesterday');
    }
    if (diffDays < 7) {
      return t('notebooks.updated.days').replace('{{days}}', String(diffDays));
    }
    return `${t('notebooks.updated.on')} ${updatedDate.toLocaleDateString(
      undefined,
      { month: 'short', day: 'numeric' },
    )}`;
  };

  const handleAttach = (data: File[], event: ReactDropzoneDropEvent) => {
    if (
      'preventDefault' in event &&
      typeof event.preventDefault === 'function'
    ) {
      event.preventDefault();
    }
    handleFileUpload(data);
  };

  const handleDraftMessage = (
    _e: ChangeEvent<HTMLTextAreaElement>,
    value: string | number,
  ) => setDraftMessage(value as any);

  const onAttachRejected = (data: FileRejection[]) => {
    data.forEach(attachment => {
      const hasInvalidTypeError = attachment.errors.some(
        (e: { code: string }) => e.code === 'file-invalid-type',
      );
      if (hasInvalidTypeError) {
        setShowAlert(true);
        setUploadError({
          message: t('file.upload.error.unsupportedType'),
        });
      }
    });
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
      {renameNotebookId && (
        <RenameNotebookModal
          isOpen={Boolean(renameNotebookId)}
          onClose={() => setRenameNotebookId(null)}
          sessionId={renameNotebookId}
          currentName={
            notebooks.find(n => n.session_id === renameNotebookId)?.name ?? ''
          }
        />
      )}
      {deleteNotebookId && (
        <DeleteNotebookModal
          isOpen={Boolean(deleteNotebookId)}
          onClose={() => setDeleteNotebookId(null)}
          sessionId={deleteNotebookId}
          name={
            notebooks.find(n => n.session_id === deleteNotebookId)?.name ?? ''
          }
        />
      )}
      <Chatbot
        displayMode={ChatbotDisplayMode.embedded}
        className={classes.body}
      >
        <ChatbotHeader className={classes.header}>
          <ChatbotHeaderMain>
            <ChatbotHeaderMenu
              aria-expanded={isChatHistoryDrawerOpen}
              onMenuToggle={() =>
                setIsChatHistoryDrawerOpen(!isChatHistoryDrawerOpen)
              }
              className={classes.headerMenu}
              tooltipContent={t('tooltip.chatHistoryMenu')}
              aria-label={t('aria.chatHistoryMenu')}
            />
            {isFullscreenMode && (
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
            isModelSelectorDisabled={isSendButtonDisabled}
            setDisplayMode={setDisplayMode}
            displayMode={displayMode}
            onPinnedChatsToggle={handlePinningChatsToggle}
          />
        </ChatbotHeader>
        {isFullscreenMode && (
          <>
            <Tabs
              activeKey={activeTab}
              onSelect={handleNotebookTabSelect}
              aria-label={t('tabs.ariaLabel')}
              className={classes.tabs}
            >
              <Tab eventKey={0} title={t('tabs.chat')} />
              <Tab eventKey={1} title={t('tabs.notebooks')} />
            </Tabs>
            <div className={classes.tabsDivider} />
          </>
        )}
        {showChatPanel && (
          <ChatbotConversationHistoryNav
            drawerPanelContentProps={{
              isResizable: isFullscreenMode,
              hasNoBorder: !isFullscreenMode,
              style: isFullscreenMode ? undefined : { zIndex: 1300 },
            }}
            reverseButtonOrder
            displayMode={ChatbotDisplayMode.embedded}
            onDrawerToggle={onChatHistoryDrawerToggle}
            title=""
            navTitleIcon={null}
            isDrawerOpen={isChatHistoryDrawerOpen}
            drawerCloseButtonProps={{
              'aria-label': t('aria.closeDrawerPanel'),
            }}
            setIsDrawerOpen={setIsChatHistoryDrawerOpen}
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
            searchActionEnd={sortDropdown}
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
                    value={draftMessage}
                    onChange={handleDraftMessage}
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
                  <ChatbotFootnote {...getFootnoteProps(t)} />
                </ChatbotFooter>
              </FileDropZone>
            }
          />
        )}
        {showNotebooksPanel && (
          <div className={classes.notebooksContainer}>
            <div className={classes.notebooksHeader}>
              <Typography variant="h6" className={classes.notebooksHeading}>
                {t('notebooks.title')}
              </Typography>
              {hasNotebooks && (
                <Button
                  variant="primary"
                  className={classes.notebooksAction}
                  icon={<PlusCircleIcon />}
                >
                  {t('notebooks.empty.action')}
                </Button>
              )}
            </div>
            {!hasNotebooks ? (
              <div className={classes.notebooksEmptyState}>
                <CatalogIcon className={classes.notebooksIcon} />
                <Typography
                  variant="h6"
                  className={classes.notebooksHeadingEmpty}
                >
                  {t('notebooks.empty.title')}
                </Typography>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  className={classes.notebooksDescription}
                >
                  {t('notebooks.empty.description')}
                </Typography>
                <Button
                  variant="primary"
                  className={classes.notebooksActionEmpty}
                >
                  {t('notebooks.empty.action')}
                </Button>
              </div>
            ) : (
              <div className={classes.notebooksGrid}>
                {notebooks.map(notebook => (
                  <Card
                    key={notebook.session_id}
                    className={classes.notebookCard}
                    isSelectable
                  >
                    <CardHeader
                      className={classes.notebookCardHeader}
                      actions={{
                        actions: (
                          <Dropdown
                            className={classes.notebookDropdownMenu}
                            isOpen={openNotebookMenuId === notebook.session_id}
                            popperProps={{
                              position: 'end',
                              preventOverflow: true,
                            }}
                            onOpenChange={isOpen =>
                              setOpenNotebookMenuId(
                                isOpen ? notebook.session_id : null,
                              )
                            }
                            toggle={toggleRef => (
                              <MenuToggle
                                ref={toggleRef}
                                variant="plain"
                                className={classes.notebookMenuButton}
                                aria-label={t('aria.options.label')}
                                isExpanded={
                                  openNotebookMenuId === notebook.session_id
                                }
                                onClick={event => {
                                  event.stopPropagation();
                                  setOpenNotebookMenuId(current =>
                                    current === notebook.session_id
                                      ? null
                                      : notebook.session_id,
                                  );
                                }}
                              >
                                <EllipsisVIcon />
                              </MenuToggle>
                            )}
                          >
                            <DropdownList
                              className={classes.notebookDropdownList}
                            >
                              <DropdownItem
                                className={classes.notebookDropdownItem}
                                onClick={() => {
                                  setRenameNotebookId(notebook.session_id);
                                  setOpenNotebookMenuId(null);
                                }}
                              >
                                {t('notebooks.actions.rename')}
                              </DropdownItem>
                              <DropdownItem
                                className={classes.notebookDropdownItem}
                                onClick={() => {
                                  setDeleteNotebookId(notebook.session_id);
                                  setOpenNotebookMenuId(null);
                                }}
                              >
                                {t('notebooks.actions.delete')}
                              </DropdownItem>
                            </DropdownList>
                          </Dropdown>
                        ),
                        className: classes.notebookCardHeaderActions,
                      }}
                    >
                      <CardTitle className={classes.notebookTitle}>
                        <CatalogIcon />
                        <Typography
                          component="span"
                          className={classes.notebookTitleText}
                        >
                          {notebook.name}
                        </Typography>
                      </CardTitle>
                    </CardHeader>
                    <div className={classes.notebookCardDivider} />
                    <CardBody className={classes.notebookCardBody}>
                      <div>
                        <div className={classes.notebookDocuments}>
                          <Typography variant="body2">
                            {getDocumentsCount(notebook.metadata?.document_ids)}{' '}
                            {t('notebooks.documents')}
                          </Typography>
                        </div>
                        <div className={classes.notebookUpdated}>
                          <Typography variant="caption">
                            {formatUpdatedLabel(notebook.updated_at)}
                          </Typography>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </Chatbot>
      <Attachment />
    </>
  );
};
