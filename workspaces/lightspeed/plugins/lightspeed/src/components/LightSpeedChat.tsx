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
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FileRejection,
  type DropEvent as ReactDropzoneDropEvent,
} from 'react-dropzone';
import { useLocation, useMatch, useNavigate } from 'react-router-dom';

import { configApiRef, useApi } from '@backstage/core-plugin-api';

import { Button, makeStyles } from '@material-ui/core';
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
  Settings,
} from '@patternfly/chatbot';
import ChatbotConversationHistoryNav from '@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav';
import {
  Alert,
  AlertActionCloseButton,
  AlertGroup,
  AlertVariant,
  DropdownItem,
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
  Tab,
  Tabs,
  Title,
  Tooltip,
  type AlertProps,
} from '@patternfly/react-core';
import {
  PlusIcon,
  SearchIcon,
  SortAmountDownAltIcon,
  SortAmountDownIcon,
} from '@patternfly/react-icons';
import { useQueryClient } from '@tanstack/react-query';

import {
  supportedFileTypes,
  TEMP_CONVERSATION_ID,
  UNTITLED_NOTEBOOK_NAME,
} from '../const';
import {
  useBackstageUserIdentity,
  useConversationMessages,
  useConversations,
  useIsMobile,
  useLastOpenedConversation,
  useLightspeedDeletePermission,
  useLightspeedNotebooksPermission,
  useNotebookConversationIds,
  useNotebookSession,
  useNotebookSessions,
  usePinnedChatsSettings,
  useSortSettings,
  useStopConversation,
} from '../hooks';
import { useCreateNotebook } from '../hooks/notebooks/useCreateNotebook';
import { useNotebookDocuments } from '../hooks/notebooks/useNotebookDocuments';
import { useLightspeedDrawerContext } from '../hooks/useLightspeedDrawerContext';
import { useLightspeedUpdatePermission } from '../hooks/useLightspeedUpdatePermission';
import { useTranslation } from '../hooks/useTranslation';
import { useWelcomePrompts } from '../hooks/useWelcomePrompts';
import logo from '../images/logo.svg';
import { ConversationSummary, NotebookSession } from '../types';
import { getAttachments } from '../utils/attachment-utils';
import {
  getCategorizeMessages,
  getFootnoteProps,
  SortOption,
} from '../utils/lightspeed-chatbox-utils';
import Attachment from './Attachment';
import { useFileAttachmentContext } from './AttachmentContext';
import { CollapsedHistoryStrip, EditSquareIcon } from './CollapsedHistoryStrip';
import { DeleteModal } from './DeleteModal';
import FilePreview from './FilePreview';
import { LightspeedChatBox } from './LightspeedChatBox';
import { LightspeedChatBoxHeader } from './LightspeedChatBoxHeader';
import { McpServersSettings } from './McpServersSettings';
import { MessageBarModelSelector } from './MessageBarModelSelector';
import { DeleteNotebookModal } from './notebooks/DeleteNotebookModal';
import { NotebooksTab } from './notebooks/NotebooksTab';
import { NotebookView } from './notebooks/NotebookView';
import { RenameNotebookModal } from './notebooks/RenameNotebookModal';
import PermissionRequiredState from './PermissionRequiredState';
import { RenameConversationModal } from './RenameConversationModal';

const COLLAPSE_PANEL_ICON_SVG = `url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M16 21V3H14V21H16ZM12 17V7L7 12L12 17Z' fill='black'/%3E%3C/svg%3E") no-repeat center`;

const ConditionalWrapper = ({
  condition,
  wrapper,
  children,
}: {
  condition: boolean;
  wrapper: (children: React.ReactNode) => React.ReactNode;
  children: React.ReactNode;
}) => (condition ? wrapper(children) : children);

const useStyles = makeStyles(theme => ({
  body: {
    // remove default margin and padding from common elements
    // lists excluded for proper formatting
    '& h1, & h2, & h3, & h4, & h5, & h6, & p, & li': {
      margin: 0,
      padding: 0,
    },
    '& .pf-chatbot__content': {
      backgroundColor:
        'var(--pf-t--global--background--color--floating--default)',
    },
  },
  header: {
    padding: `${theme.spacing(3)}px ${theme.spacing(3)}px 0 ${theme.spacing(
      3,
    )}px !important`,
    backgroundColor:
      'var(--pf-t--global--background--color--floating--default) !important',
  },
  errorContainer: {
    padding: theme.spacing(3),
  },
  drawerFileDropZone: {
    gap: 0,
    rowGap: 0,
    columnGap: 0,
    '--pf-v6-c-multiple-file-upload--Gap': '0',
    '--pf-v5-c-multiple-file-upload--Gap': '0',
    flex: 1,
    minWidth: 0,
  },
  headerMenu: {
    // align hamburger icon with title
    '& .pf-v6-c-button': {
      display: 'flex',
      alignItems: 'center',
    },
  },
  headerLogo: {
    width: 48,
    height: 48,
    marginRight: theme.spacing(1.5),
    flexShrink: 0,
  },
  headerTitle: {
    justifyContent: 'left !important',
    '& h1': {
      fontSize: '32px !important',
      fontWeight: '700 !important',
      lineHeight: '36.4px !important',
      fontFamily: '"Red Hat Display", sans-serif !important',
    },
  },
  tabs: {
    padding: `0 ${theme.spacing(2)}px`,
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
      paddingTop: theme.spacing(2),
      paddingBottom: theme.spacing(2),
      fontWeight: 700,
      cursor: 'pointer',
    },
    '& .pf-v6-c-tabs__item.pf-m-current .pf-v6-c-tabs__link, & .pf-v5-c-tabs__item.pf-m-current .pf-v5-c-tabs__link':
      {
        color: 'var(--pf-t--global--text--color--brand--default)',
      },
  },
  tabsDivider: {
    borderTop: '1px solid var(--pf-t--global--border--color--default)',
  },
  headerDivider: {
    paddingTop: 8,
    borderBottom: '1px solid var(--pf-t--global--border--color--default)',
    backgroundColor:
      'var(--pf-t--global--background--color--floating--default)',
  },
  notebooksContainer: {
    padding: theme.spacing(3),
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    backgroundColor:
      'var(--pf-t--global--background--color--floating--default)',
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
    paddingBottom: theme.spacing(3),
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
    '&:hover': {
      borderColor: 'var(--pf-t--global--border--color--hover)',
      borderWidth: '1px',
      borderStyle: 'solid',
      cursor: 'pointer',
    },
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
    backgroundColor:
      'var(--pf-t--global--background--color--floating--default)',
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
  fullscreenFooter: {
    '&>.pf-chatbot__footer-container': {
      width: '100% !important',
      padding: theme.spacing(1.5),
      maxWidth: 'unset !important',
      margin: '0 auto',
    },
  },
  fullscreenMessageBar: {
    border: '1px solid var(--pf-t--global--border--color--default)',
    borderRadius: 24,
    padding: theme.spacing(0.5),
    '&::after': {
      display: 'none',
    },
  },
  sortDropdown: {
    padding: 0,
    margin: 0,
  },
  // Outer content wrapper (library may override overflow; we rely on inner scroll wrapper).
  chatbotContent: {
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    '& .pf-chatbot__jump': {
      left: '50% !important',
      right: 'auto !important',
      transform: 'translateX(-50%)',
      visibility: 'hidden',
      pointerEvents: 'none',
    },
  },
  chatbotContentHasOverflow: {
    '& .pf-chatbot__jump': {
      visibility: 'visible',
      pointerEvents: 'auto',
    },
  },
  // Inner scroll container we control: always scrollable so zoomed-in users see full content.
  chatbotContentScroll: {
    minHeight: 0,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  chatbotContentScrollNewChat: {
    backgroundColor:
      'var(--pf-t--global--background--color--floating--default)',
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
  // When present, pushes welcome content to bottom (zoom out). Scroll up to see important box (zoom in).
  chatbotContentSpacer: {
    flex: 1,
    minHeight: 0,
  },
  settingsFlat: {
    height: '100%',
    width: '100%',
    '&.pf-chatbot__settings-form-container': {
      background:
        'var(--pf-v6-c-table--BackgroundColor, var(--pf-t--global--background--color--primary--default))',
      padding: 0,
      margin: 0,
      minHeight: '100%',
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      maxWidth: 'none',
    },
    '& .pf-chatbot__settings-form': {
      margin: 0,
      padding: 0,
      background:
        'var(--pf-v6-c-table--BackgroundColor, var(--pf-t--global--background--color--primary--default))',
      minHeight: '100%',
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      maxWidth: 'none',
    },
    '& .pf-chatbot__settings-form-row': {
      background:
        'var(--pf-v6-c-table--BackgroundColor, var(--pf-t--global--background--color--primary--default))',
      border: 0,
      margin: 0,
      padding: 0,
      minHeight: '100%',
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      maxWidth: 'none',
    },
    '& .pf-chatbot__settings-label': {
      display: 'none',
    },
  },
  mcpFullscreenLayout: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
    minHeight: 0,
    height: '100%',
    flex: 1,
    width: '100%',
    minWidth: 0,
    overflow: 'hidden',
  },
  mcpChatPane: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    width: '100%',
    minWidth: 0,
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
  },
  mcpSettingsPane: {
    width: '100%',
    minWidth: 0,
    borderLeft: `1px solid ${theme.palette.divider}`,
    backgroundColor:
      'var(--pf-v6-c-table--BackgroundColor, var(--pf-t--global--background--color--primary--default))',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    overflow: 'auto',
  },
  mcpCollapsedDrawerOrderFix: {
    '& .pf-v6-c-drawer.pf-m-panel-left > .pf-v6-c-drawer__main > .pf-v6-c-drawer__content, & .pf-v5-c-drawer.pf-m-panel-left > .pf-v5-c-drawer__main > .pf-v5-c-drawer__content':
      {
        order: 'unset',
      },
    '& .pf-v6-c-drawer:not(.pf-m-expanded) > .pf-v6-c-drawer__main > .pf-v6-c-drawer__panel, & .pf-v5-c-drawer:not(.pf-m-expanded) > .pf-v5-c-drawer__main > .pf-v5-c-drawer__panel':
      {
        visibility: 'hidden',
        opacity: 0,
        transition: 'none !important',
      },
  },
  // TODO: These PatternFly drawer overrides are needed because PF Chatbot doesn't
  // provide clean APIs for custom expand/collapse icons and positioning.
  // Remove once PatternFly supports these features.
  // See: https://github.com/patternfly/chatbot/issues/834
  fullscreenChatLayout: {
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
    minHeight: 0,
    height: '100%',
    width: '100%',
    '& .pf-v6-c-drawer, & .pf-v5-c-drawer': {
      flex: 1,
      minWidth: 0,
    },
    '& .pf-v6-c-drawer__content, & .pf-v5-c-drawer__content': {
      flex: 1,
      minWidth: 0,
    },
    '& .pf-v6-c-drawer:not(.pf-m-expanded) > .pf-v6-c-drawer__main > .pf-v6-c-drawer__panel, & .pf-v5-c-drawer:not(.pf-m-expanded) > .pf-v5-c-drawer__main > .pf-v5-c-drawer__panel':
      {
        display: 'none',
      },
    '& .pf-v6-c-drawer__close, & .pf-v5-c-drawer__close': {
      marginTop: -48,
      marginRight: -24,
    },
    '& .pf-v6-c-drawer__close .pf-v6-c-button svg, & .pf-v5-c-drawer__close .pf-v5-c-button svg':
      {
        display: 'none',
      },
    '& .pf-v6-c-drawer__close .pf-v6-c-button, & .pf-v5-c-drawer__close .pf-v5-c-button':
      {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '&::before': {
          content: '""',
          display: 'block',
          width: 24,
          height: 24,
          mask: COLLAPSE_PANEL_ICON_SVG,
          WebkitMask: COLLAPSE_PANEL_ICON_SVG,
          backgroundColor: 'currentColor',
        },
      },
    '& .pf-chatbot__menu-item': {
      cursor: 'pointer',
    },
    '& .pf-chatbot__menu-item .pf-v6-c-menu-toggle, & .pf-chatbot__menu-item .pf-v5-c-menu-toggle':
      {
        opacity: 0,
        transition: 'opacity 0.15s ease-in-out',
      },
    '& .pf-chatbot__menu-item:hover .pf-v6-c-menu-toggle, & .pf-chatbot__menu-item:hover .pf-v5-c-menu-toggle':
      {
        opacity: 1,
      },
  },
  fullscreenMainContent: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    overflow: 'hidden',
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
  const navigate = useNavigate();
  const configApi = useApi(configApiRef);
  const notebooksEnabled =
    configApi.getOptionalBoolean('lightspeed.notebooks.enabled') ?? false;
  const notebooksRouteMatch = useMatch('/lightspeed/notebooks');
  const notebookViewRouteMatch = useMatch('/lightspeed/notebooks/:notebookId');
  const routeNotebookId = notebookViewRouteMatch?.params?.notebookId;
  const isOnNotebookRoute = Boolean(
    notebooksRouteMatch || notebookViewRouteMatch,
  );
  const shouldShowTabs = notebooksEnabled || isOnNotebookRoute;
  const {
    displayMode,
    setDisplayMode,
    currentConversationId: routeConversationId,
    setCurrentConversationId,
    draftMessage,
    setDraftMessage,
    consumePendingOverlayThreadHandoff,
    shellViewTab,
    setShellViewTab,
  } = useLightspeedDrawerContext();
  const isFullscreenMode = displayMode === ChatbotDisplayMode.embedded;
  const location = useLocation();
  const isNotebooksFullscreenPath =
    location.pathname === '/lightspeed/notebooks' ||
    location.pathname.startsWith('/lightspeed/notebooks/');
  const user = useBackstageUserIdentity();
  const [filterValue, setFilterValue] = useState<string>('');
  const [announcement, setAnnouncement] = useState<string>('');
  const [activeTab, setActiveTab] = useState<number>(() => {
    if (!isFullscreenMode) {
      return 0;
    }
    if (notebooksRouteMatch || notebookViewRouteMatch) {
      return 1;
    }
    const p = location.pathname;
    if (p.startsWith('/lightspeed/conversation/')) {
      return 0;
    }
    if (shellViewTab === 1) {
      return 1;
    }
    return 0;
  });
  const { allowed: hasNotebooksAccess, loading: notebooksPermissionLoading } =
    useLightspeedNotebooksPermission();
  const notebooksPermissionResolved =
    !notebooksPermissionLoading && hasNotebooksAccess;

  const { data: notebookConversationIdsArray = [] } =
    useNotebookConversationIds();
  const { data: notebooks = [], refetch: refetchNotebooks } =
    useNotebookSessions(notebooksPermissionResolved);
  const hasNotebooks = notebooks.length > 0;
  const [openNotebookMenuId, setOpenNotebookMenuId] = useState<string | null>(
    null,
  );
  const [renameNotebookId, setRenameNotebookId] = useState<string | null>(null);
  const [deleteNotebookId, setDeleteNotebookId] = useState<string | null>(null);
  const [activeNotebook, setActiveNotebook] = useState<NotebookSession | null>(
    null,
  );
  const {
    data: routeNotebook,
    isLoading: routeNotebookLoading,
    isError: routeNotebookError,
  } = useNotebookSession(routeNotebookId);

  useEffect(() => {
    if (routeNotebookId && routeNotebook && !routeNotebookLoading) {
      setActiveNotebook(routeNotebook);
    } else if (routeNotebookId && routeNotebookError) {
      navigate('/lightspeed/notebooks', { replace: true });
    } else if (!routeNotebookId && notebooksRouteMatch) {
      setActiveNotebook(null);
    }
  }, [
    routeNotebookId,
    routeNotebook,
    routeNotebookLoading,
    routeNotebookError,
    notebooksRouteMatch,
    navigate,
  ]);

  const [notebookAlerts, setNotebookAlerts] = useState<Partial<AlertProps>[]>(
    [],
  );
  const createNotebookMutation = useCreateNotebook();
  const { data: notebookDocuments = [] } = useNotebookDocuments(
    activeNotebook?.session_id,
  );
  const [conversationId, setConversationId] = useState<string>('');
  const [requestId, setRequestId] = useState<string>('');
  const [newChatCreated, setNewChatCreated] = useState<boolean>(false);
  const [isSendButtonDisabled, setIsSendButtonDisabled] =
    useState<boolean>(false);
  const [targetConversationId, setTargetConversationId] = useState<string>('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState<boolean>(false);
  const [isSortSelectOpen, setIsSortSelectOpen] = useState<boolean>(false);
  const [isMcpSettingsOpen, setIsMcpSettingsOpen] = useState<boolean>(false);
  const [chatHeaderBgColor, setChatHeaderBgColor] = useState<string>();
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const [messageBarKey, setMessageBarKey] = useState(0);
  const [hasChatContentOverflow, setHasChatContentOverflow] = useState(false);
  const wasStoppedByUserRef = useRef(false);
  const { isReady, lastOpenedId, setLastOpenedId, clearLastOpenedId } =
    useLastOpenedConversation(user);
  const showChatPanel = !isFullscreenMode || activeTab === 0;
  const showNotebooksPanel =
    (notebooksEnabled || isOnNotebookRoute) && activeTab !== 0;
  const [isChatHistoryDrawerOpen, setIsChatHistoryDrawerOpen] =
    useState<boolean>(!isMobile && isFullscreenMode);

  // Fullscreen: URL drives Chat vs Notebooks, but shellViewTab must win when entering
  // fullscreen from overlay/docked on Notebooks while navigation still lands on /lightspeed.
  useLayoutEffect(() => {
    if (!isFullscreenMode) {
      return;
    }
    if (isNotebooksFullscreenPath) {
      setActiveTab(1);
      setShellViewTab(1);
      return;
    }
    const isBaseLightspeedChatRoute =
      location.pathname === '/lightspeed' ||
      location.pathname === '/lightspeed/';
    if (shellViewTab === 1 && isBaseLightspeedChatRoute) {
      navigate('/lightspeed/notebooks', { replace: true });
      return;
    }
    setActiveTab(0);
    setShellViewTab(0);
  }, [
    isFullscreenMode,
    isNotebooksFullscreenPath,
    shellViewTab,
    location.pathname,
    navigate,
    setShellViewTab,
  ]);

  const handleNotebookTabSelect = (
    _event: React.MouseEvent<any>,
    tabIndex: number | string,
  ) => {
    const nextTab = Number(tabIndex);
    setActiveTab(nextTab);
    setShellViewTab(nextTab);
    if (nextTab === 1) {
      navigate('/lightspeed/notebooks');
      if (notebooksPermissionResolved) {
        refetchNotebooks();
      }
    } else {
      navigate(
        routeConversationId
          ? `/lightspeed/conversation/${routeConversationId}`
          : '/lightspeed',
      );
    }
  };

  const setDisplayModeFromHeader = useCallback(
    (mode: ChatbotDisplayMode) => {
      if (mode !== ChatbotDisplayMode.embedded) {
        setDisplayMode(mode);
        return;
      }
      if (activeTab === 1) {
        const sid = activeNotebook?.session_id;
        setDisplayMode(
          mode,
          undefined,
          sid ? { notebookSessionId: sid } : 'notebooks',
        );
      } else {
        setDisplayMode(mode);
      }
    },
    [setDisplayMode, activeTab, activeNotebook?.session_id],
  );

  const handleCreateNotebook = useCallback(() => {
    createNotebookMutation.mutate(
      { name: UNTITLED_NOTEBOOK_NAME },
      {
        onSuccess: (session: NotebookSession) => {
          navigate(`/lightspeed/notebooks/${session.session_id}`);
        },
      },
    );
  }, [createNotebookMutation, navigate]);

  const handleCloseNotebook = useCallback(() => {
    navigate('/lightspeed/notebooks');
    refetchNotebooks();
  }, [navigate, refetchNotebooks]);

  const handleRemoveNotebookAlert = (key: React.Key) => {
    setNotebookAlerts(prevAlerts =>
      prevAlerts.filter(alert => alert.key !== key),
    );
  };

  const handleNotebookDeleted = () => {
    const key = Date.now();
    setNotebookAlerts(prevAlerts => [
      { title: t('notebooks.delete.toast'), variant: 'success', key },
      ...prevAlerts,
    ]);
  };
  // Open the chat history drawer when entering fullscreen mode on desktop
  useEffect(() => {
    if (!isMobile && isFullscreenMode) {
      setIsChatHistoryDrawerOpen(true);
    }
  }, [isMobile, isFullscreenMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const headerElement = document.querySelector('.pf-chatbot__header');
    if (!headerElement) return;
    const computedBg = window.getComputedStyle(headerElement).backgroundColor;
    if (computedBg) {
      setChatHeaderBgColor(computedBg);
    }
  }, [displayMode, isMcpSettingsOpen]);

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

  // After leaving fullscreen for overlay/docked, provider signals a one-shot handoff so a
  // new LightspeedChat mount does not briefly apply stale lastOpened from storage.
  useLayoutEffect(() => {
    if (!isReady) return;

    if (isFullscreenMode) {
      return;
    }

    const handoff = consumePendingOverlayThreadHandoff?.() ?? false;
    if (handoff) {
      if (routeConversationId) {
        setConversationId(routeConversationId);
        setNewChatCreated(false);
      } else {
        setConversationId(TEMP_CONVERSATION_ID);
        setNewChatCreated(true);
      }
      return;
    }

    if (routeConversationId && routeConversationId !== conversationId) {
      setConversationId(routeConversationId);
      setNewChatCreated(false);
    } else if (
      !routeConversationId &&
      conversationId === '' &&
      lastOpenedId !== null
    ) {
      setConversationId(lastOpenedId);
    }
  }, [
    isReady,
    isFullscreenMode,
    routeConversationId,
    conversationId,
    lastOpenedId,
    consumePendingOverlayThreadHandoff,
  ]);

  // Sync conversationId with lastOpenedId — fullscreen only (overlay uses layout effect above).
  useEffect(() => {
    if (!isReady || !isFullscreenMode) {
      return;
    }
    if (lastOpenedId !== null) {
      setConversationId(lastOpenedId);
    }
  }, [lastOpenedId, isReady, isFullscreenMode]);

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
    const onOverlayLikeSurface = isFullscreenMode || !routeConversationId;
    const stillOnProvisionalThread =
      !conversationId || conversationId === TEMP_CONVERSATION_ID;

    if (lastOpenedId === null) {
      if (onOverlayLikeSurface && stillOnProvisionalThread) {
        setConversationId(TEMP_CONVERSATION_ID);
      }
    }
    // Only treat as blank "new chat" while there is no persisted thread id yet. Otherwise
    // after the first stream assigns a real conversationId, lastOpenedId can lag one frame
    // and this effect would flip newChatCreated back to true and hide the New chat button.
    if (lastOpenedId === TEMP_CONVERSATION_ID || lastOpenedId === null) {
      if (onOverlayLikeSurface && stillOnProvisionalThread) {
        setNewChatCreated(true);
      }
    }
  }, [
    user,
    isReady,
    lastOpenedId,
    setConversationId,
    isFullscreenMode,
    routeConversationId,
    conversationId,
  ]);

  useEffect(() => {
    // Clear last opened conversationId when there are no conversations.
    if (
      !isLoading &&
      !isRefetching &&
      conversations.length === 0 &&
      lastOpenedId
    ) {
      clearLastOpenedId();
      // Stale last-opened pointed at a missing thread; align with blank new chat so
      // provisional UI (e.g. hide New chat) matches storage.
      setConversationId(TEMP_CONVERSATION_ID);
      setNewChatCreated(true);
      setCurrentConversationId(undefined);
    }
  }, [
    isLoading,
    isRefetching,
    conversations,
    lastOpenedId,
    clearLastOpenedId,
    setCurrentConversationId,
  ]);

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
        // New threads can be missing from the summaries list until refetch completes; if we
        // already show this id locally (e.g. streaming), do not reset to a new chat.
        if (routeConversationId !== conversationId) {
          // Conversation from route doesn't exist, start a new chat
          setConversationId(TEMP_CONVERSATION_ID);
          setCurrentConversationId(undefined);
          setNewChatCreated(true);
        }
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

  const viewConversationId = useMemo(
    () =>
      !isFullscreenMode && routeConversationId
        ? routeConversationId
        : conversationId,
    [isFullscreenMode, routeConversationId, conversationId],
  );

  const onStart = (conv_id: string) => {
    setConversationId(conv_id);
    setCurrentConversationId(conv_id);
  };

  const onRequestIdReady = (request_id: string) => {
    setRequestId(request_id);
  };

  const onComplete = (message: string) => {
    setIsSendButtonDisabled(false);
    if (!wasStoppedByUserRef.current) {
      setAnnouncement(`Message from Bot: ${message}`);
    }
    wasStoppedByUserRef.current = false;
    queryClient.invalidateQueries({
      queryKey: ['conversations'],
    });
    queryClient.invalidateQueries({
      queryKey: ['conversationMessages', viewConversationId],
    });
    setNewChatCreated(false);
  };

  const {
    conversationMessages,
    handleInputPrompt,
    scrollToBottomRef,
    streamingConversationId,
  } = useConversationMessages(
    viewConversationId,
    userName,
    selectedModel,
    selectedProvider,
    avatar,
    onComplete,
    onStart,
    undefined,
    onRequestIdReady,
  );

  const streamingUiMatchesView =
    isSendButtonDisabled &&
    streamingConversationId !== null &&
    viewConversationId === streamingConversationId;

  const [messages, setMessages] =
    useState<MessageProps[]>(conversationMessages);

  const sendMessage = (message: string | number) => {
    if (!message.toString().trim()) return;

    wasStoppedByUserRef.current = false;
    if (viewConversationId !== TEMP_CONVERSATION_ID) {
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
      setIsMcpSettingsOpen(false);
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
      } else {
        // Already on new chat: reset so scroll/layout works (e.g. after opening new chat again from another convo then back).
        setMessages([]);
        setNewChatCreated(true);
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

  const notebookConversationIds = useMemo(
    () => new Set(notebookConversationIdsArray),
    [notebookConversationIdsArray],
  );

  const chatOnlyConversations = useMemo(
    () =>
      conversations.filter(
        c => !notebookConversationIds.has(c.conversation_id),
      ),
    [conversations, notebookConversationIds],
  );

  const categorizedMessages = useMemo(
    () =>
      getCategorizeMessages(
        chatOnlyConversations,
        pinnedChats,
        additionalMessageProps,
        t,
        selectedSort,
      ),
    [
      additionalMessageProps,
      chatOnlyConversations,
      pinnedChats,
      t,
      selectedSort,
    ],
  );

  const filterConversations = useCallback(
    (targetValue: string) => {
      const pinnedChatsKey = t('conversation.category.pinnedChats') || 'Pinned';
      let isNoPinnedChatsSearchResults = false;
      let isNoRecentChatsSearchResults = false;
      const filteredConversations = Object.entries(categorizedMessages).reduce(
        (acc, [key, items]) => {
          const filteredItems = items.filter(item =>
            (item.text ?? '')
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
      setIsMcpSettingsOpen(false);
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
      setIsMcpSettingsOpen,
    ],
  );

  const conversationFound = !!conversations.find(
    (c: ConversationSummary) => c.conversation_id === viewConversationId,
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

  // Scroll to bottom when welcome content appears (sentinel + useLayoutEffect/RAF + ResizeObserver).
  useLayoutEffect(() => {
    if (welcomePrompts.length === 0) return undefined;
    const el = contentScrollRef.current;
    const sentinel = bottomSentinelRef.current;
    if (!el) return undefined;

    const scrollToBottom = () => {
      if (sentinel && typeof sentinel.scrollIntoView === 'function') {
        sentinel.scrollIntoView({ block: 'end', behavior: 'auto' });
      } else {
        el.scrollTop = el.scrollHeight;
      }
    };

    const rafId =
      typeof requestAnimationFrame !== 'undefined'
        ? requestAnimationFrame(() => scrollToBottom())
        : null;
    if (rafId === null) scrollToBottom();
    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => scrollToBottom())
        : undefined;
    resizeObserver?.observe(el);

    return () => {
      if (rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(rafId);
      }
      resizeObserver?.disconnect();
    };
  }, [welcomePrompts.length]);

  useEffect(() => {
    const scrollContainer = contentScrollRef.current;
    if (!scrollContainer) {
      setHasChatContentOverflow(false);
      return undefined;
    }

    const getMessageBox = () =>
      scrollContainer.querySelector(
        '.pf-chatbot__messagebox',
      ) as HTMLElement | null;

    const messageBoxOwnsScroll = (messageBox: HTMLElement | null) => {
      if (!messageBox || typeof window === 'undefined') {
        return false;
      }
      const overflowY = window.getComputedStyle(messageBox).overflowY;
      return (
        overflowY === 'auto' ||
        overflowY === 'scroll' ||
        overflowY === 'overlay'
      );
    };

    const getScrollTarget = () => {
      const messageBox = getMessageBox();
      return messageBoxOwnsScroll(messageBox) ? messageBox! : scrollContainer;
    };

    let observedScrollTarget: HTMLElement | null = getScrollTarget();
    let rafId: number | null = null;
    let updateScheduled = false;

    const updateOverflow = () => {
      const scrollTarget = observedScrollTarget ?? scrollContainer;
      setHasChatContentOverflow(
        scrollTarget.scrollHeight > scrollTarget.clientHeight + 1,
      );
    };

    const scheduleOverflowUpdate = () => {
      if (updateScheduled) {
        return;
      }
      updateScheduled = true;
      if (typeof requestAnimationFrame !== 'undefined') {
        rafId = requestAnimationFrame(() => {
          updateScheduled = false;
          updateOverflow();
        });
      } else {
        updateScheduled = false;
        updateOverflow();
      }
    };

    scheduleOverflowUpdate();

    // Use capture so scroll events from inner messagebox also trigger updates.
    scrollContainer.addEventListener('scroll', scheduleOverflowUpdate, {
      passive: true,
      capture: true,
    });

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => scheduleOverflowUpdate())
        : undefined;
    resizeObserver?.observe(scrollContainer);
    if (observedScrollTarget !== scrollContainer) {
      resizeObserver?.observe(observedScrollTarget);
    }

    const syncObservedScrollTarget = () => {
      const nextScrollTarget = getScrollTarget();
      if (nextScrollTarget === observedScrollTarget) {
        return;
      }
      if (observedScrollTarget && observedScrollTarget !== scrollContainer) {
        resizeObserver?.unobserve(observedScrollTarget);
      }
      if (nextScrollTarget !== scrollContainer) {
        resizeObserver?.observe(nextScrollTarget);
      }
      observedScrollTarget = nextScrollTarget;
    };

    const mutationObserver =
      typeof MutationObserver !== 'undefined'
        ? new MutationObserver(() => {
            syncObservedScrollTarget();
            scheduleOverflowUpdate();
          })
        : undefined;
    mutationObserver?.observe(scrollContainer, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateOverflow);
    }

    return () => {
      if (rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(rafId);
      }
      scrollContainer.removeEventListener(
        'scroll',
        scheduleOverflowUpdate,
        true,
      );
      if (observedScrollTarget && observedScrollTarget !== scrollContainer) {
        resizeObserver?.unobserve(observedScrollTarget);
      }
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', updateOverflow);
      }
    };
  }, [
    conversationId,
    displayMode,
    isMcpSettingsOpen,
    messages.length,
    welcomePrompts.length,
  ]);

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

  const handleAttach = (data: File[], event: ReactDropzoneDropEvent) => {
    if (
      'preventDefault' in event &&
      typeof event.preventDefault === 'function'
    ) {
      event.preventDefault();
    }
    handleFileUpload(data);
  };

  const { mutate: stopConversation } = useStopConversation();

  const handleStopButton = () => {
    wasStoppedByUserRef.current = true;
    if (requestId) {
      stopConversation(requestId);
      setRequestId('');
    }
    setIsSendButtonDisabled(false);
    setAnnouncement(t('conversation.announcement.responseStopped'));
    const lastUserMessage = [...conversationMessages]
      .reverse()
      .find((m: { role?: string }) => m.role === 'user');
    const restoredPrompt = (lastUserMessage?.content as string) ?? '';
    setDraftMessage(restoredPrompt.trim());
    if (restoredPrompt) setMessageBarKey(k => k + 1);
    setFileContents([]);
    setUploadError({ message: null });
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

  const chatMainContent = (
    <>
      <ChatbotContent
        className={`${classes.chatbotContent} ${
          hasChatContentOverflow ? classes.chatbotContentHasOverflow : ''
        }`}
      >
        <div
          ref={contentScrollRef}
          className={`${classes.chatbotContentScroll}${
            welcomePrompts.length > 0
              ? ` ${classes.chatbotContentScrollNewChat}`
              : ''
          }`}
        >
          {welcomePrompts.length > 0 && (
            <div className={classes.chatbotContentSpacer} aria-hidden />
          )}
          <LightspeedChatBox
            userName={userName}
            messages={messages}
            profileLoading={profileLoading}
            announcement={announcement}
            ref={scrollToBottomRef}
            welcomePrompts={welcomePrompts}
            conversationId={conversationId}
            isStreaming={streamingUiMatchesView}
            topicRestrictionEnabled={topicRestrictionEnabled}
            displayMode={displayMode}
          />
          {welcomePrompts.length > 0 && (
            <div
              ref={bottomSentinelRef}
              aria-hidden
              style={{ height: 0, flexShrink: 0 }}
            />
          )}
        </div>
      </ChatbotContent>
      <ChatbotFooter
        className={
          isFullscreenMode
            ? `${classes.footer} ${classes.fullscreenFooter}`
            : classes.footer
        }
      >
        <FilePreview />
        <MessageBar
          key={messageBarKey}
          className={
            isFullscreenMode ? classes.fullscreenMessageBar : undefined
          }
          onSendMessage={sendMessage}
          isSendButtonDisabled={isSendButtonDisabled}
          hasAttachButton
          attachButtonPosition={isFullscreenMode ? 'start' : undefined}
          handleAttach={handleAttach}
          hasMicrophoneButton
          value={draftMessage}
          onChange={handleDraftMessage}
          hasStopButton={streamingUiMatchesView}
          handleStopButton={
            streamingUiMatchesView ? handleStopButton : undefined
          }
          buttonProps={{
            attach: {
              inputTestId: 'attachment-input',
              tooltipContent: t('tooltip.attach'),
              'aria-label': t('tooltip.attach'),
              ...(isFullscreenMode && { icon: <PlusIcon /> }),
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
          additionalActions={
            isFullscreenMode ? (
              <MessageBarModelSelector
                selectedModel={selectedModel}
                models={models}
                onSelect={item => {
                  setIsMcpSettingsOpen(false);
                  onNewChat();
                  handleSelectedModel(item);
                }}
                disabled={isSendButtonDisabled}
              />
            ) : undefined
          }
          forceMultilineLayout={isFullscreenMode}
          allowedFileTypes={supportedFileTypes}
          onAttachRejected={onAttachRejected}
          placeholder={t('chatbox.message.placeholder')}
        />
        <ChatbotFootnote {...getFootnoteProps(t)} />
      </ChatbotFooter>
    </>
  );

  const mcpSettingsPanel = (
    <McpServersSettings
      onClose={() => setIsMcpSettingsOpen(false)}
      backgroundColor={chatHeaderBgColor}
    />
  );

  const mainPanelContent = (() => {
    if (!isMcpSettingsOpen) {
      return <>{chatMainContent}</>;
    }

    if (isFullscreenMode) {
      return (
        <div className={classes.mcpFullscreenLayout}>
          <div className={classes.mcpChatPane}>{chatMainContent}</div>
          <div className={classes.mcpSettingsPane}>{mcpSettingsPanel}</div>
        </div>
      );
    }

    return (
      <Settings
        className={classes.settingsFlat}
        fields={[
          {
            id: 'mcp-servers-settings',
            label: '',
            field: mcpSettingsPanel,
          },
        ]}
      />
    );
  })();

  let drawerPanelStyle: { [key: string]: string | number } | undefined;
  if (!isFullscreenMode) {
    drawerPanelStyle = { zIndex: 1300 };
  } else if (isMcpSettingsOpen) {
    drawerPanelStyle = { width: 320, minWidth: 320, maxWidth: 320 };
  } else {
    drawerPanelStyle = { minWidth: 232, maxWidth: 400 };
  }

  return (
    <>
      {notebookAlerts.length > 0 && (
        <AlertGroup
          hasAnimations
          isToast
          isLiveRegion
          className={classes.toastAlertGroup}
        >
          {notebookAlerts.map(({ key, title, variant }) => (
            <Alert
              key={key}
              variant={AlertVariant[variant ?? 'success']}
              title={title}
              className={classes.toastAlert}
              timeout={2000}
              onTimeout={() => handleRemoveNotebookAlert(key as React.Key)}
              actionClose={
                <AlertActionCloseButton
                  title={title as string}
                  variantLabel={`${variant ?? 'success'} alert`}
                  onClose={() => handleRemoveNotebookAlert(key as React.Key)}
                />
              }
            />
          ))}
        </AlertGroup>
      )}
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
          onDeleted={handleNotebookDeleted}
          sessionId={deleteNotebookId}
          name={
            notebooks.find(n => n.session_id === deleteNotebookId)?.name ?? ''
          }
        />
      )}
      <Chatbot
        displayMode={ChatbotDisplayMode.embedded}
        className={`${classes.body} ${
          isMcpSettingsOpen && !isChatHistoryDrawerOpen
            ? classes.mcpCollapsedDrawerOrderFix
            : ''
        }`}
      >
        <ChatbotHeader className={classes.header}>
          <ChatbotHeaderMain>
            {showChatPanel && !isFullscreenMode && (
              <ChatbotHeaderMenu
                aria-expanded={isChatHistoryDrawerOpen}
                onMenuToggle={onChatHistoryDrawerToggle}
                className={classes.headerMenu}
                tooltipContent={t('tooltip.chatHistoryMenu')}
                aria-label={t('aria.chatHistoryMenu')}
              />
            )}
            {isFullscreenMode && (
              <>
                <img
                  src={logo as any}
                  alt={t('icon.lightspeed.alt')}
                  className={classes.headerLogo}
                />
                <ChatbotHeaderTitle className={classes.headerTitle}>
                  <Title headingLevel="h1" size="3xl">
                    {t('chatbox.header.title')}
                  </Title>
                </ChatbotHeaderTitle>
              </>
            )}
          </ChatbotHeaderMain>

          <LightspeedChatBoxHeader
            selectedModel={selectedModel}
            handleSelectedModel={item => {
              setIsMcpSettingsOpen(false);
              onNewChat();
              handleSelectedModel(item);
            }}
            models={models}
            isPinningChatsEnabled={isPinningChatsEnabled}
            isModelSelectorDisabled={isSendButtonDisabled}
            hideModelSelector={showNotebooksPanel || isFullscreenMode}
            showChatTabOptions={!showNotebooksPanel}
            setDisplayMode={setDisplayModeFromHeader}
            displayMode={displayMode}
            onPinnedChatsToggle={handlePinningChatsToggle}
            onMcpSettingsClick={() => setIsMcpSettingsOpen(true)}
          />
        </ChatbotHeader>
        {isFullscreenMode && shouldShowTabs && (
          <div className={classes.headerDivider} />
        )}
        {isFullscreenMode && shouldShowTabs && (
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
          <ConditionalWrapper
            condition={isFullscreenMode}
            wrapper={children => (
              <div className={classes.fullscreenChatLayout}>
                {!isChatHistoryDrawerOpen && (
                  <CollapsedHistoryStrip
                    onExpand={() => setIsChatHistoryDrawerOpen(true)}
                    onNewChat={onNewChat}
                    newChatDisabled={newChatCreated}
                  />
                )}
                {children}
              </div>
            )}
          >
            <ChatbotConversationHistoryNav
              drawerPanelContentProps={{
                isResizable: isFullscreenMode,
                hasNoBorder: !isFullscreenMode,
                style: drawerPanelStyle,
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
              activeItemId={viewConversationId}
              onSelectActiveItem={onSelectActiveItem}
              conversations={filterConversations(filterValue)}
              onNewChat={newChatCreated ? undefined : onNewChat}
              newChatButtonText={t('button.newChat')}
              newChatButtonProps={{
                icon: isFullscreenMode ? <EditSquareIcon /> : <PlusIcon />,
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
                  className={classes.drawerFileDropZone}
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
                  {mainPanelContent}
                </FileDropZone>
              }
            />
          </ConditionalWrapper>
        )}
        {showNotebooksPanel &&
          !notebooksPermissionLoading &&
          hasNotebooksAccess &&
          activeNotebook && (
            <NotebookView
              sessionId={activeNotebook.session_id}
              notebookName={activeNotebook.name}
              documents={notebookDocuments}
              metadata={activeNotebook.metadata}
              topicSummary={
                conversations.find(
                  c =>
                    c.conversation_id ===
                    activeNotebook.metadata?.conversation_id,
                )?.topic_summary ?? undefined
              }
              userName={userName}
              avatar={avatar}
              profileLoading={profileLoading}
              topicRestrictionEnabled={topicRestrictionEnabled}
              onClose={handleCloseNotebook}
            />
          )}
        {showNotebooksPanel &&
          !notebooksPermissionLoading &&
          hasNotebooksAccess &&
          !activeNotebook && (
            <NotebooksTab
              notebooks={notebooks}
              hasNotebooks={hasNotebooks}
              classes={classes}
              openNotebookMenuId={openNotebookMenuId}
              setOpenNotebookMenuId={setOpenNotebookMenuId}
              onSelectNotebook={(notebook: NotebookSession) => {
                navigate(`/lightspeed/notebooks/${notebook.session_id}`);
              }}
              onRename={setRenameNotebookId}
              onDelete={setDeleteNotebookId}
              onCreateNotebook={handleCreateNotebook}
              t={t}
            />
          )}
        {showNotebooksPanel &&
          !notebooksPermissionLoading &&
          !hasNotebooksAccess && (
            <PermissionRequiredState
              subject={t('permission.subject.notebooks')}
              permissions={['lightspeed.notebooks.use']}
              action={
                <Button
                  variant="outlined"
                  color="primary"
                  style={{ borderRadius: '20px' }}
                  onClick={() => {
                    setActiveTab(0);
                    setShellViewTab(0);
                  }}
                >
                  {t('permission.notebooks.goBack')}
                </Button>
              }
            />
          )}
      </Chatbot>
      <Attachment />
    </>
  );
};
