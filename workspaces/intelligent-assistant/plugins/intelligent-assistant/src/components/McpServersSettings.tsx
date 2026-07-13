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
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';

import { configApiRef, fetchApiRef, useApi } from '@backstage/core-plugin-api';
import { usePermission } from '@backstage/plugin-permission-react';

import { makeStyles } from '@material-ui/core';
import Typography from '@mui/material/Typography';
import {
  Alert,
  Button,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Radio,
  Spinner,
  Switch,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
  Title,
  Tooltip,
} from '@patternfly/react-core';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InfoCircleIcon,
  KeyIcon,
  PencilAltIcon,
  SortAmountDownIcon,
  SortAmountUpIcon,
  TimesIcon,
} from '@patternfly/react-icons';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import { lightspeedMcpManagePermission } from '@red-hat-developer-hub/backstage-plugin-intelligent-assistant-common';

import { useTranslation } from '../hooks/useTranslation';
import {
  compareMcpServers,
  formatApiError,
  getDisplayStatus,
  getEnabledToggleChecked,
  getInitialCredentialMode,
  getModalDisplayHasToken,
  getModalDisplayStatus,
  isModalEnabledChecked as getModalEnabledChecked,
  getModalVerifiedHasToken,
  isSaveTokenDisabled as getSaveTokenDisabled,
  isEnabledToggleUnavailable,
  type CredentialMode,
  type McpServerSortColumn,
  type ServerStatus,
} from './mcpServersDisplayUtils';

type McpServer = {
  id: string;
  name: string;
  url?: string;
  enabled: boolean;
  status: 'connected' | 'error' | 'unknown';
  toolCount: number;
  hasToken: boolean;
  hasUserToken: boolean;
  hasOrgToken: boolean;
  validationError?: string;
  /** 'dcr' = tokens are minted automatically (no manual token needed). */
  auth?: string;
};

type McpServersSettingsProps = {
  onClose: () => void;
  backgroundColor?: string;
};

type TokenValidationState = 'idle' | 'validating' | 'success' | 'error';

const SAVED_TOKEN_MASK = '********************';

const useStyles = makeStyles(theme => ({
  '@global': {
    '.pf-v6-c-backdrop': {
      zIndex: '1400 !important',
    },
    '.pf-v5-c-backdrop': {
      zIndex: '1400 !important',
    },
  },
  root: {
    padding: 0,
    height: '100%',
    minHeight: '100%',
    width: '100%',
    overflow: 'auto',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(2),
    marginLeft: theme.spacing(3),
    marginRight: theme.spacing(2),
  },
  selectedCount: {
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
    fontSize: '0.75rem',
  },
  title: {
    fontSize: '1.125rem',
  },
  closeButton: {
    marginTop: -theme.spacing(1),
    marginRight: -theme.spacing(1),
    color: theme.palette.text.primary,
  },
  nameHeaderButton: {
    paddingLeft: 0,
    paddingTop: 0,
    paddingBottom: 0,
    marginLeft: '-0.85rem',
    fontWeight: 600,
    fontSize: '0.75rem',
    lineHeight: '1.25rem',
    minHeight: 'auto',
    color: theme.palette.text.primary,
    textDecoration: 'none !important',
    display: 'inline-flex',
    alignItems: 'center',
  },
  statusHeaderButton: {
    paddingLeft: 0,
    paddingTop: 0,
    paddingBottom: 0,
    fontWeight: 600,
    fontSize: '0.75rem',
    lineHeight: '1.25rem',
    minHeight: 'auto',
    color: theme.palette.text.primary,
    textDecoration: 'none !important',
    display: 'inline-flex',
    alignItems: 'center',
  },
  sortHeaderIconActive: {
    color: 'var(--pf-t--global--icon--color--brand--default, #0066cc)',
  },
  sortHeaderIconInactive: {
    color: 'var(--pf-t--global--icon--color--subtle, #6a6e73)',
  },
  nameHeaderText: {
    paddingLeft: '7px',
    fontSize: '0.75rem',
    lineHeight: '1.25rem',
    fontWeight: 600,
  },
  nameCell: {
    paddingLeft: '8px !important',
  },
  statusHeader: {
    paddingLeft: '0 !important',
  },
  statusColumnCell: {
    paddingLeft: '0 !important',
  },
  rowName: {
    fontSize: '1rem',
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
  nameValue: {
    fontSize: '0.875rem',
    fontWeight: 500,
  },
  statusCell: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    whiteSpace: 'nowrap',
  },
  statusValue: {
    fontSize: '0.875rem',
  },
  statusOk: {
    color: '#147878',
  },
  statusWarn: {
    color: '#B1380B',
  },
  statusDisabled: {
    color:
      theme.palette.type === 'dark'
        ? 'var(--pf-t--global--text--color--subtle, #c7c7c7)'
        : 'var(--pf-t--global--text--color--subtle, #4d4d4d)',
  },
  actionButton: {
    color: theme.palette.text.secondary,
    opacity: 0,
    transition: 'opacity 0.15s ease-in-out',
  },
  tableRow: {
    '&:hover $actionButton, &:focus-within $actionButton': {
      opacity: 1,
    },
  },
  modalInfoAlert: {
    marginTop: 0,
    marginBottom: theme.spacing(2),
    '--pf-v6-c-alert--BorderColor': '#5e40be',
    '--pf-v5-c-alert--BorderColor': '#5e40be',
    borderColor: '#5e40be',
    '& .pf-v6-c-alert, & .pf-v5-c-alert': {
      alignItems: 'flex-start',
    },
    '& .pf-v6-c-alert__icon, & .pf-v5-c-alert__icon': {
      color: '#5e40be',
      alignSelf: 'flex-start',
      paddingBlockStart: 0,
      marginBlockStart: 0,
      lineHeight: 1,
      '& svg': {
        display: 'block',
      },
    },
    '& .pf-v6-c-alert__title, & .pf-v5-c-alert__title': {
      margin: '-0.125rem 0 0 0.5rem',
      lineHeight: 1.4,
    },
  },
  modalSection: {
    marginBottom: theme.spacing(2),
  },
  modalSectionTitle: {
    fontSize: '0.875rem',
    fontWeight: 600,
    marginBottom: theme.spacing(0.75),
  },
  modalSectionDescription: {
    color: theme.palette.text.secondary,
    fontSize: '0.875rem',
    marginTop: theme.spacing(0.25),
  },
  modalStatusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    fontSize: '0.875rem',
  },
  modalToolsList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  },
  modalToolItem: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    fontSize: '0.875rem',
  },
  modalEnabledRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing(2),
  },
  modalEnabledLabel: {
    flex: 1,
  },
  credentialRadioGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
  },
  credentialRadioDescription: {
    color: theme.palette.text.secondary,
    fontSize: '0.875rem',
    marginTop: theme.spacing(0.25),
    marginLeft: theme.spacing(3),
  },
  modalCloseButton: {
    position: 'absolute',
    top: 'var(--pf-v6-c-modal-box__close--InsetBlockStart, 1.5rem)',
    right: 'var(--pf-v6-c-modal-box__close--InsetInlineEnd, 1.5rem)',
    zIndex: 1,
  },
  removePersonalTokenButton: {
    borderRadius: '1.25rem',
    boxShadow: 'none',
    '&:not(:disabled):not(.pf-m-disabled)': {
      '--pf-v6-c-button--BorderColor': '#B1380B',
      '--pf-v6-c-button--Color': '#B1380B',
      '--pf-v6-c-button--BackgroundColor': 'transparent',
      '--pf-v5-c-button--BorderColor': '#B1380B',
      '--pf-v5-c-button--Color': '#B1380B',
      '--pf-v5-c-button--BackgroundColor': 'transparent',
      borderColor: '#B1380B',
      color: '#B1380B',
      backgroundColor: 'transparent',
      '&:hover': {
        '--pf-v6-c-button--BackgroundColor': 'rgba(201, 25, 11, 0.08)',
        '--pf-v5-c-button--BackgroundColor': 'rgba(201, 25, 11, 0.08)',
        backgroundColor: 'rgba(201, 25, 11, 0.08)',
      },
    },
  },
  configureModal: {
    '& .pf-v6-c-modal-box, & .pf-v5-c-modal-box': {
      width: '608px',
      maxWidth: '608px',
    },
    '& .pf-v6-c-modal-box__close, & .pf-v5-c-modal-box__close': {
      display: 'none',
    },
    '& .pf-v6-c-modal-box__header, & .pf-v5-c-modal-box__header': {
      '--pf-v6-c-modal-box__header--PaddingBlockEnd': '0.25rem',
      '--pf-v5-c-modal-box__header--PaddingBlockEnd': '0.25rem',
      paddingBlockEnd: '0.25rem',
    },
    '& .pf-v6-c-modal-box__title, & .pf-v5-c-modal-box__title': {
      marginBlockEnd: 0,
      fontWeight: 600,
    },
    '& .pf-v6-c-modal-box__body, & .pf-v5-c-modal-box__body': {
      '--pf-v6-c-modal-box__body--PaddingBlockStart': '0.5rem',
      '--pf-v6-c-modal-box__header--body--PaddingBlockStart': '0.5rem',
      '--pf-v5-c-modal-box__body--PaddingBlockStart': '0.5rem',
      paddingBlockStart: '0.5rem',
    },
  },
  toggleCell: {
    paddingRight: '0 !important',
  },
  table: {
    width: '100%',
    backgroundColor: 'transparent',
    '--pf-v6-c-table--BackgroundColor': 'transparent',
    '--pf-v5-c-table--BackgroundColor': 'transparent',
    '& table, & thead, & tbody, & tr, & th, & td': {
      backgroundColor: 'transparent !important',
    },
    '& th': {
      borderBottom: 0,
      fontSize: '0.75rem',
      fontWeight: 600,
      color: theme.palette.text.primary,
      whiteSpace: 'nowrap',
      textAlign: 'left',
    },
    '& td': {
      borderBottom: 0,
      paddingTop: theme.spacing(1.5),
      paddingBottom: theme.spacing(1.5),
      verticalAlign: 'middle',
    },
  },
  alert: {
    marginLeft: theme.spacing(3),
    marginRight: theme.spacing(3),
    marginBottom: theme.spacing(2),
  },
}));

type McpServerResponse = {
  name: string;
  url?: string;
  enabled: boolean;
  status: 'connected' | 'error' | 'unknown';
  toolCount: number;
  hasToken: boolean;
  hasUserToken: boolean;
  hasOrgToken: boolean;
  auth?: string;
};

type McpServersListResponse = {
  servers?: McpServerResponse[];
};

type McpServersPatchResponse = {
  server?: McpServerResponse;
  validation?: {
    error?: string;
  };
};

type McpToolInfo = {
  name: string;
  description?: string;
};

type McpServersValidateResponse = {
  name: string;
  status: 'connected' | 'error' | 'unknown';
  toolCount: number;
  validation?: {
    error?: unknown;
    tools?: McpToolInfo[];
  };
};

type McpCredentialsValidateResponse = {
  valid: boolean;
  error?: unknown;
  toolCount: number;
  tools?: McpToolInfo[];
};

const getStatusIcon = (status: ServerStatus, className: string) => {
  if (status === 'tokenRequired') return <KeyIcon className={className} />;
  if (status === 'disabled') return <InfoCircleIcon className={className} />;
  if (status === 'failed')
    return <ExclamationCircleIcon className={className} />;
  return <CheckCircleIcon className={className} />;
};

const toUiServer = (
  server: McpServerResponse,
  validationError?: string,
): McpServer => ({
  id: server.name,
  name: server.name,
  url: server.url,
  enabled: server.enabled,
  status: server.status,
  toolCount: server.toolCount,
  hasToken: server.hasToken,
  hasUserToken: server.hasUserToken,
  hasOrgToken: server.hasOrgToken,
  validationError: server.status === 'error' ? validationError : undefined,
  auth: server.auth,
});
export const McpServersSettings = ({
  onClose,
  backgroundColor,
}: McpServersSettingsProps) => {
  const classes = useStyles();
  const { t } = useTranslation();
  const configApi = useApi(configApiRef);
  const fetchApi = useApi(fetchApiRef);
  const mcpManagePermission = usePermission({
    permission: lightspeedMcpManagePermission,
  });
  const canManageMcp = mcpManagePermission.allowed;
  const [servers, setServers] = useState<McpServer[]>([]);
  const [sortColumn, setSortColumn] = useState<McpServerSortColumn>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [editingServerId, setEditingServerId] = useState<string | null>(null);
  const [tokenInputValue, setTokenInputValue] = useState('');
  const [initialTokenInputValue, setInitialTokenInputValue] = useState('');
  const [hasSavedTokenInModal, setHasSavedTokenInModal] = useState(false);
  const [modalCredentialMode, setModalCredentialMode] =
    useState<CredentialMode>('personal');
  const [initialCredentialMode, setInitialCredentialMode] =
    useState<CredentialMode>('personal');
  const [tokenValidationState, setTokenValidationState] =
    useState<TokenValidationState>('idle');
  const [tokenValidationMessage, setTokenValidationMessage] = useState('');
  const [modalEnabled, setModalEnabled] = useState(true);
  const [modalTools, setModalTools] = useState<string[]>([]);
  const [isLoadingModalTools, setIsLoadingModalTools] = useState(false);
  const [modalToolsError, setModalToolsError] = useState<string | null>(null);
  const [canRemovePersonalToken, setCanRemovePersonalToken] = useState(false);
  const [isUpdatingModalStatus, setIsUpdatingModalStatus] = useState(false);
  const [hasRemovedPersonalToken, setHasRemovedPersonalToken] = useState(false);

  const getBaseUrl = useCallback(() => {
    return `${configApi.getString('backend.baseUrl')}/api/intelligent-assistant`;
  }, [configApi]);

  const fetchJson = useCallback(
    async <T,>(url: string, init?: RequestInit): Promise<T> => {
      const response = await fetchApi.fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
        ...init,
      });
      if (!response.ok) {
        let message = `${response.status} ${response.statusText}`;
        try {
          const bodyText = await response.text();
          if (bodyText) {
            const parsed = JSON.parse(bodyText);
            if (parsed?.error) {
              message = parsed.error;
            }
          }
        } catch {
          // Keep default message when parsing fails.
        }
        throw new Error(message);
      }

      const text = await response.text();
      return (text ? JSON.parse(text) : {}) as T;
    },
    [fetchApi],
  );

  const fetchServerValidation = useCallback(
    async (serverName: string) => {
      const baseUrl = getBaseUrl();
      return fetchJson<McpServersValidateResponse>(
        `${baseUrl}/mcp-servers/${encodeURIComponent(serverName)}/validate`,
        {
          method: 'POST',
        },
      );
    },
    [fetchJson, getBaseUrl],
  );

  const validateServer = useCallback(
    async (serverName: string) => {
      const data = await fetchServerValidation(serverName);

      setServers(prev =>
        prev.map(server =>
          server.name === serverName
            ? {
                ...server,
                status: data.status,
                toolCount: data.toolCount,
                validationError:
                  data.status === 'error'
                    ? formatApiError(data.validation?.error) ||
                      'Validation failed'
                    : undefined,
              }
            : server,
        ),
      );
      return data;
    },
    [fetchServerValidation],
  );

  const validateCredentials = useCallback(
    async (url: string, token: string) => {
      const baseUrl = getBaseUrl();
      return await fetchJson<McpCredentialsValidateResponse>(
        `${baseUrl}/mcp-servers/validate`,
        {
          method: 'POST',
          body: JSON.stringify({ url, token }),
        },
      );
    },
    [fetchJson, getBaseUrl],
  );
  const loadServers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const baseUrl = getBaseUrl();
      const data = await fetchJson<McpServersListResponse>(
        `${baseUrl}/mcp-servers`,
      );
      const uiServers = (data.servers ?? []).map(server => toUiServer(server));
      setServers(uiServers);

      if (canManageMcp) {
        const serversToValidate = uiServers.filter(server => server.hasToken);
        void Promise.allSettled(
          serversToValidate.map(async server => {
            try {
              await validateServer(server.name);
            } catch (validationError) {
              setError(
                prev =>
                  prev ??
                  (validationError instanceof Error
                    ? validationError.message
                    : `Failed to validate ${server.name}`),
              );
            }
          }),
        );
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Failed to load MCP server settings',
      );
    } finally {
      setIsLoading(false);
    }
  }, [canManageMcp, fetchJson, getBaseUrl, validateServer]);

  useEffect(() => {
    loadServers();
  }, [loadServers]);

  const patchServer = useCallback(
    async (
      serverName: string,
      body: { enabled?: boolean; token?: string | null },
    ) => {
      if (!canManageMcp) {
        return;
      }
      setError(null);
      setIsSaving(prev => ({ ...prev, [serverName]: true }));
      try {
        const baseUrl = getBaseUrl();
        const data = await fetchJson<McpServersPatchResponse>(
          `${baseUrl}/mcp-servers/${encodeURIComponent(serverName)}`,
          {
            method: 'PATCH',
            body: JSON.stringify(body),
          },
        );

        if (data.server) {
          setServers(prev =>
            prev.map(server =>
              server.name === serverName
                ? toUiServer(data.server!, data.validation?.error)
                : server,
            ),
          );
        } else {
          await loadServers();
        }
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : `Failed to update ${serverName} settings`,
        );
        throw e;
      } finally {
        setIsSaving(prev => ({ ...prev, [serverName]: false }));
      }
    },
    [canManageMcp, fetchJson, getBaseUrl, loadServers],
  );

  const editingServer = useMemo(
    () => servers.find(server => server.id === editingServerId),
    [servers, editingServerId],
  );

  const selectedCount = useMemo(
    () =>
      servers.filter(server => {
        const displayStatus = getDisplayStatus(server);
        const isUnavailable =
          displayStatus === 'failed' || displayStatus === 'tokenRequired';
        return server.enabled && !isUnavailable;
      }).length,
    [servers],
  );

  const sortedServers = useMemo(() => {
    const next = [...servers];
    next.sort((a, b) => compareMcpServers(a, b, sortColumn, sortAsc));
    return next;
  }, [servers, sortAsc, sortColumn]);

  const onSortColumnClick = (column: McpServerSortColumn) => {
    if (sortColumn === column) {
      setSortAsc(prev => !prev);
      return;
    }
    setSortColumn(column);
    setSortAsc(true);
  };

  const renderSortIcon = (column: McpServerSortColumn) => {
    const isActive = sortColumn === column;
    let Icon = SortAmountDownIcon;
    if (isActive && !sortAsc) {
      Icon = SortAmountUpIcon;
    }

    return (
      <Icon
        className={
          isActive
            ? classes.sortHeaderIconActive
            : classes.sortHeaderIconInactive
        }
      />
    );
  };

  const getDisplayDetail = useCallback(
    (server: McpServer, displayStatus: ServerStatus): string => {
      if (displayStatus === 'disabled')
        return t('mcp.settings.status.disabled');
      if (displayStatus === 'tokenRequired')
        return t('mcp.settings.status.tokenRequired');
      if (displayStatus === 'failed') return t('mcp.settings.status.failed');
      if (displayStatus === 'ok') {
        if (server.toolCount === 1) {
          return t('mcp.settings.status.oneTool' as any, {
            count: String(server.toolCount),
          });
        }
        return t('mcp.settings.status.manyTools' as any, {
          count: String(server.toolCount),
        });
      }
      return t('mcp.settings.status.unknown');
    },
    [t],
  );

  const closeConfigureModal = useCallback(() => {
    setEditingServerId(null);
    setTokenInputValue('');
    setInitialTokenInputValue('');
    setHasSavedTokenInModal(false);
    setModalCredentialMode('personal');
    setInitialCredentialMode('personal');
    setTokenValidationState('idle');
    setTokenValidationMessage('');
    setModalEnabled(true);
    setModalTools([]);
    setIsLoadingModalTools(false);
    setModalToolsError(null);
    setCanRemovePersonalToken(false);
    setIsUpdatingModalStatus(false);
    setHasRemovedPersonalToken(false);
  }, []);

  const openConfigureModal = (server: McpServer) => {
    setEditingServerId(server.id);
    const credentialMode = getInitialCredentialMode(server);
    const hasSavedPersonalToken = server.hasUserToken;
    setModalCredentialMode(credentialMode);
    setInitialCredentialMode(credentialMode);
    setHasSavedTokenInModal(hasSavedPersonalToken);
    setCanRemovePersonalToken(server.hasUserToken && !server.hasOrgToken);
    const initialToken = hasSavedPersonalToken ? SAVED_TOKEN_MASK : '';
    setInitialTokenInputValue(initialToken);
    setTokenInputValue(initialToken);
    setModalEnabled(server.enabled);
    setModalTools([]);
    setModalToolsError(null);
    setIsUpdatingModalStatus(false);
    setHasRemovedPersonalToken(false);
    if (server.status === 'error' && server.validationError) {
      setTokenValidationState('error');
      setTokenValidationMessage(
        formatApiError(server.validationError) ||
          t('mcp.settings.token.validationFailed'),
      );
    } else {
      setTokenValidationState('idle');
      setTokenValidationMessage('');
    }
  };

  useEffect(() => {
    if (!editingServer) {
      return undefined;
    }

    if (editingServer.auth !== 'dcr' && !editingServer.hasToken) {
      setModalTools([]);
      setModalToolsError(null);
      setIsLoadingModalTools(false);
      return undefined;
    }

    let cancelled = false;
    setIsLoadingModalTools(true);
    setModalToolsError(null);

    void fetchServerValidation(editingServer.name)
      .then(data => {
        if (cancelled) {
          return;
        }
        const tools = data.validation?.tools?.map(tool => tool.name) ?? [];
        setModalTools(tools);
        if (data.status === 'error') {
          setModalToolsError(
            formatApiError(data.validation?.error) ||
              t('mcp.settings.token.validationFailed'),
          );
        } else {
          setModalToolsError(null);
        }
      })
      .catch(e => {
        if (cancelled) {
          return;
        }
        setModalTools([]);
        setModalToolsError(
          e instanceof Error
            ? e.message
            : t('mcp.settings.modal.toolsLoadFailed'),
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingModalTools(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [editingServer, fetchServerValidation, t]);

  const onTokenInputChange = (value: string) => {
    if (hasSavedTokenInModal && value !== SAVED_TOKEN_MASK) {
      setHasSavedTokenInModal(false);
    }
    setTokenInputValue(value);
    setTokenValidationState('idle');
    setTokenValidationMessage('');
  };

  const onCredentialModeChange = (mode: CredentialMode) => {
    if (mode === modalCredentialMode) {
      return;
    }
    setModalCredentialMode(mode);
    setTokenValidationState('idle');
    setTokenValidationMessage('');

    if (mode === 'organization') {
      setHasSavedTokenInModal(false);
      setTokenInputValue('');
      return;
    }

    if (editingServer?.hasUserToken) {
      setHasSavedTokenInModal(true);
      setTokenInputValue(SAVED_TOKEN_MASK);
      setInitialTokenInputValue(SAVED_TOKEN_MASK);
      return;
    }

    setHasSavedTokenInModal(false);
    setTokenInputValue('');
    setInitialTokenInputValue('');
  };

  const clearTokenInput = () => {
    if (hasSavedTokenInModal) {
      setHasSavedTokenInModal(false);
    }
    setTokenInputValue('');
    setTokenValidationState('idle');
    setTokenValidationMessage('');
  };

  const showCredentialRadios = Boolean(
    editingServer?.hasOrgToken && editingServer.auth !== 'dcr',
  );
  const showPersonalTokenField =
    editingServer?.auth !== 'dcr' &&
    (!showCredentialRadios || modalCredentialMode === 'personal');

  let tokenInputValidated: 'success' | 'error' | undefined;
  if (tokenValidationState === 'success') {
    tokenInputValidated = 'success';
  } else if (tokenValidationState === 'error') {
    tokenInputValidated = 'error';
  }

  let tokenHelperVariant: 'success' | 'error' | 'default' = 'default';
  if (tokenValidationState === 'success') {
    tokenHelperVariant = 'success';
  } else if (tokenValidationState === 'error') {
    tokenHelperVariant = 'error';
  }

  const showTokenHelperText =
    !hasSavedTokenInModal || tokenValidationState !== 'idle';

  const tokenHelperText =
    tokenValidationMessage || t('mcp.settings.enterToken');

  const configureModalTitle = t('mcp.settings.configureServerTitle' as any, {
    serverName: editingServer?.name ?? '',
  });

  const isConfigureModalSaving = Boolean(isSaving[editingServer?.name ?? '']);
  const isSaveTokenButtonDisabled = getSaveTokenDisabled({
    tokenInputValue,
    initialTokenInputValue,
    modalEnabled,
    serverEnabled: editingServer?.enabled ?? true,
    credentialMode: modalCredentialMode,
    initialCredentialMode,
    hasOrgToken: editingServer?.hasOrgToken ?? false,
    hasSavedPersonalTokenInModal: hasSavedTokenInModal,
    tokenValidationState,
    hasRemovedPersonalToken,
  });

  const removePersonalToken = useCallback(async () => {
    if (
      !editingServer ||
      !canManageMcp ||
      isUpdatingModalStatus ||
      editingServer.hasOrgToken
    ) {
      return;
    }

    setIsUpdatingModalStatus(true);
    setTokenInputValue('');
    setTokenValidationState('idle');
    setTokenValidationMessage('');
    setModalTools([]);
    setModalToolsError(null);
    setIsLoadingModalTools(false);

    try {
      await patchServer(editingServer.name, { token: null, enabled: false });
      setHasSavedTokenInModal(false);
      setInitialTokenInputValue('');
      setModalEnabled(false);
      setHasRemovedPersonalToken(true);
    } catch {
      const server = servers.find(item => item.id === editingServerId);
      if (server?.hasUserToken) {
        setHasSavedTokenInModal(true);
        setCanRemovePersonalToken(true);
        setTokenInputValue(SAVED_TOKEN_MASK);
      }
      setHasRemovedPersonalToken(false);
    } finally {
      setIsUpdatingModalStatus(false);
    }
  }, [
    canManageMcp,
    editingServer,
    editingServerId,
    isUpdatingModalStatus,
    patchServer,
    servers,
  ]);

  const saveServerToken = useCallback(async () => {
    if (!editingServer || !canManageMcp) return;

    const hasCredentialModeChange =
      modalCredentialMode !== initialCredentialMode;
    const hasTokenInputChange = tokenInputValue !== initialTokenInputValue;
    const hasEnabledInputChange = modalEnabled !== editingServer.enabled;

    if (
      !hasCredentialModeChange &&
      !hasTokenInputChange &&
      !hasEnabledInputChange
    ) {
      closeConfigureModal();
      return;
    }

    if (
      modalCredentialMode === 'organization' &&
      (hasCredentialModeChange || hasEnabledInputChange)
    ) {
      setTokenValidationState('validating');
      setTokenValidationMessage(t('mcp.settings.token.savingAndValidating'));
      try {
        await patchServer(editingServer.name, {
          token: null,
          enabled: modalEnabled,
        });
        const validationResult = await validateServer(editingServer.name);
        if (validationResult.status === 'error') {
          setTokenValidationState('error');
          setTokenValidationMessage(
            formatApiError(validationResult.validation?.error) ||
              t('mcp.settings.token.validationFailed'),
          );
          return;
        }
        closeConfigureModal();
      } catch (e) {
        setTokenValidationState('error');
        setTokenValidationMessage(
          e instanceof Error
            ? e.message
            : `Failed to update ${editingServer.name} settings`,
        );
      }
      return;
    }

    if (!hasTokenInputChange && hasEnabledInputChange) {
      await patchServer(editingServer.name, { enabled: modalEnabled });
      closeConfigureModal();
      return;
    }

    const markFailedTokenAttempt = () => {
      setInitialTokenInputValue(tokenInputValue);
    };

    const token = tokenInputValue.trim();
    const hasToken = token.length > 0;

    setTokenValidationState('validating');
    setTokenValidationMessage(t('mcp.settings.token.validating'));

    try {
      if (hasToken) {
        if (!editingServer.url) {
          setTokenValidationState('error');
          setTokenValidationMessage(
            t('mcp.settings.token.urlUnavailableForValidation'),
          );
          markFailedTokenAttempt();
          return;
        }

        const credentialValidation = await validateCredentials(
          editingServer.url,
          token,
        );
        if (!credentialValidation.valid) {
          setTokenValidationState('error');
          setTokenValidationMessage(
            formatApiError(credentialValidation.error) ||
              t('mcp.settings.token.invalidCredentials'),
          );
          markFailedTokenAttempt();
          return;
        }
        setModalTools(credentialValidation.tools?.map(tool => tool.name) ?? []);
      }

      setTokenValidationMessage(t('mcp.settings.token.savingAndValidating'));
      await patchServer(editingServer.name, {
        enabled: modalEnabled,
        token: hasToken ? token : null,
      });
      const validationResult = await validateServer(editingServer.name);
      if (validationResult.status === 'error') {
        setTokenValidationState('error');
        setTokenValidationMessage(
          formatApiError(validationResult.validation?.error) ||
            t('mcp.settings.token.validationFailed'),
        );
        markFailedTokenAttempt();
        return;
      }
      if (hasToken && validationResult.status === 'connected') {
        await patchServer(editingServer.name, { enabled: true });
        setModalEnabled(true);
      }
      setTokenValidationState('success');
      setTokenValidationMessage(t('mcp.settings.token.connectionSuccessful'));
      closeConfigureModal();
    } catch (e) {
      setTokenValidationState('error');
      setTokenValidationMessage(
        e instanceof Error
          ? e.message
          : `Failed to update ${editingServer.name} token`,
      );
      markFailedTokenAttempt();
    }
  }, [
    canManageMcp,
    closeConfigureModal,
    editingServer,
    initialCredentialMode,
    initialTokenInputValue,
    modalCredentialMode,
    modalEnabled,
    patchServer,
    t,
    tokenInputValue,
    validateCredentials,
    validateServer,
  ]);

  const onModalEnabledChange = (_event: FormEvent, checked: boolean) => {
    if (!editingServer || !canManageMcp) {
      return;
    }
    setModalEnabled(checked);
  };

  const modalVerifiedHasToken = editingServer
    ? getModalVerifiedHasToken({
        hasOrgToken: editingServer.hasOrgToken,
        credentialMode: modalCredentialMode,
        hasSavedPersonalTokenInModal: hasSavedTokenInModal,
      })
    : false;

  const modalDisplayStatus = editingServer
    ? getModalDisplayStatus(
        {
          ...editingServer,
          hasToken: getModalDisplayHasToken({
            modalVerifiedHasToken,
            modalEnabled,
            serverHasToken: editingServer.hasToken,
          }),
        },
        modalEnabled,
      )
    : 'unknown';
  const isModalEnabledToggleDisabled =
    !canManageMcp ||
    !editingServer ||
    isUpdatingModalStatus ||
    isEnabledToggleUnavailable(modalDisplayStatus) ||
    Boolean(isSaving[editingServer?.name ?? '']);
  const isModalEnabledChecked = getModalEnabledChecked({
    displayStatus: modalDisplayStatus,
    modalEnabled,
  });

  const modalStatusDetail = editingServer
    ? getDisplayDetail(editingServer, modalDisplayStatus)
    : '';

  const modalToolCount = modalTools.length || editingServer?.toolCount || 0;

  const renderModalStatusIcon = () => {
    if (isUpdatingModalStatus || isLoadingModalTools) {
      return (
        <Spinner
          size="md"
          aria-label={
            isUpdatingModalStatus
              ? t('mcp.settings.modal.loadingStatus')
              : t('mcp.settings.modal.loadingTools')
          }
        />
      );
    }
    if (modalDisplayStatus === 'disabled') {
      return <InfoCircleIcon className={classes.statusDisabled} />;
    }
    if (modalDisplayStatus === 'tokenRequired') {
      return <KeyIcon className={classes.statusWarn} />;
    }
    if (modalDisplayStatus === 'ok' && modalTools.length > 0) {
      return <CheckCircleIcon className={classes.statusOk} />;
    }
    if (modalToolsError || modalDisplayStatus === 'failed') {
      return <ExclamationCircleIcon className={classes.statusWarn} />;
    }
    return <InfoCircleIcon className={classes.statusDisabled} />;
  };

  const renderModalStatusText = () => {
    if (isUpdatingModalStatus) {
      return t('mcp.settings.modal.loadingStatus');
    }
    if (isLoadingModalTools) {
      return t('mcp.settings.modal.loadingTools');
    }
    if (modalDisplayStatus === 'disabled') {
      return t('mcp.settings.status.disabled');
    }
    if (modalDisplayStatus === 'tokenRequired') {
      return t('mcp.settings.status.tokenRequired');
    }
    if (modalDisplayStatus === 'ok' && modalTools.length > 0) {
      if (modalTools.length === 1) {
        return t('mcp.settings.status.oneTool' as any, {
          count: String(modalTools.length),
        });
      }
      return t('mcp.settings.status.manyTools' as any, {
        count: String(modalTools.length),
      });
    }
    if (modalToolsError) {
      return modalToolsError;
    }
    return modalStatusDetail;
  };

  const renderModalToolsContent = () => {
    if (isLoadingModalTools) {
      return (
        <Spinner size="md" aria-label={t('mcp.settings.modal.loadingTools')} />
      );
    }
    if (modalTools.length > 0) {
      return (
        <ul className={classes.modalToolsList}>
          {modalTools.map(toolName => (
            <li key={toolName} className={classes.modalToolItem}>
              <CheckCircleIcon className={classes.statusOk} />
              <Typography component="span">{toolName}</Typography>
            </li>
          ))}
        </ul>
      );
    }
    return (
      <div className={classes.modalSectionDescription}>
        {modalToolsError ?? t('mcp.settings.modal.noToolsAvailable')}
      </div>
    );
  };

  const renderModalEnabledDescription = () => {
    if (isModalEnabledChecked) {
      return t('mcp.settings.modal.enabledDescription');
    }
    if (modalDisplayStatus === 'tokenRequired') {
      return t('mcp.settings.modal.enabledDescriptionTokenRequired');
    }
    return t('mcp.settings.modal.enabledDescriptionOff');
  };

  const renderConfigureModalDetails = () => (
    <>
      <Alert
        variant="custom"
        customIcon={<InfoCircleIcon />}
        title={t('mcp.settings.modalDescription')}
        className={classes.modalInfoAlert}
        isInline
      />
      {hasRemovedPersonalToken && !editingServer?.hasOrgToken && (
        <Alert
          variant="custom"
          customIcon={<InfoCircleIcon />}
          title={t('mcp.settings.modal.tokenRemovedWarning')}
          className={classes.modalInfoAlert}
          isInline
        />
      )}
      <div className={classes.modalSection}>
        <div className={classes.modalSectionTitle}>
          {t('mcp.settings.status')}
        </div>
        <div className={classes.modalStatusRow}>
          {renderModalStatusIcon()}
          <Typography component="span">{renderModalStatusText()}</Typography>
        </div>
      </div>
      {(editingServer?.auth === 'dcr' || modalVerifiedHasToken) &&
        modalDisplayStatus === 'ok' && (
          <div className={classes.modalSection}>
            <div className={classes.modalSectionTitle}>
              {t('mcp.settings.modal.toolsHeading' as any, {
                count: String(modalToolCount),
              })}
            </div>
            {renderModalToolsContent()}
          </div>
        )}
      <div className={classes.modalSection}>
        <div className={classes.modalEnabledRow}>
          <div className={classes.modalEnabledLabel}>
            <div className={classes.modalSectionTitle}>
              {t('mcp.settings.enabled')}
            </div>
            <div className={classes.modalSectionDescription}>
              {renderModalEnabledDescription()}
            </div>
          </div>
          {isModalEnabledToggleDisabled ? (
            <Tooltip content={modalStatusDetail}>
              <Typography component="span">
                <Switch
                  id="mcp-configure-enabled-switch"
                  aria-label={t('mcp.settings.toggleServerAriaLabel' as any, {
                    serverName: editingServer?.name ?? '',
                  })}
                  isChecked={isModalEnabledChecked}
                  isDisabled={isModalEnabledToggleDisabled}
                  onChange={onModalEnabledChange}
                />
              </Typography>
            </Tooltip>
          ) : (
            <Switch
              id="mcp-configure-enabled-switch"
              aria-label={t('mcp.settings.toggleServerAriaLabel' as any, {
                serverName: editingServer?.name ?? '',
              })}
              isChecked={isModalEnabledChecked}
              isDisabled={isModalEnabledToggleDisabled}
              onChange={onModalEnabledChange}
            />
          )}
        </div>
      </div>
    </>
  );

  return (
    <div
      className={classes.root}
      style={backgroundColor ? { backgroundColor } : undefined}
    >
      <div className={classes.headerRow}>
        <div>
          <Title headingLevel="h2" size="xl" className={classes.title}>
            {t('mcp.settings.title')}
          </Title>
          <div className={classes.selectedCount}>
            {t('mcp.settings.selectedCount' as any, {
              selectedCount: String(selectedCount),
              totalCount: String(servers.length),
            })}
          </div>
        </div>
        <Button
          aria-label={t('mcp.settings.closeAriaLabel')}
          icon={<TimesIcon />}
          variant="plain"
          className={classes.closeButton}
          onClick={onClose}
        />
      </div>
      {error && (
        <Alert
          variant="danger"
          isInline
          title={error}
          className={classes.alert}
        />
      )}
      {!mcpManagePermission.loading && !canManageMcp && (
        <Alert
          variant="info"
          isInline
          title={t('mcp.settings.readOnlyAccess')}
          className={classes.alert}
        />
      )}

      <Table
        variant="compact"
        aria-label={t('mcp.settings.tableAriaLabel')}
        className={classes.table}
      >
        <Thead>
          <Tr>
            <Th width={10} screenReaderText={t('mcp.settings.enabled')} />
            <Th>
              <Button
                variant="link"
                className={classes.nameHeaderButton}
                icon={renderSortIcon('name')}
                iconPosition="right"
                onClick={() => onSortColumnClick('name')}
              >
                <Typography component="span" className={classes.nameHeaderText}>
                  {t('mcp.settings.name')}
                </Typography>
              </Button>
            </Th>
            <Th className={classes.statusHeader}>
              <Button
                variant="link"
                className={classes.statusHeaderButton}
                icon={renderSortIcon('status')}
                iconPosition="right"
                onClick={() => onSortColumnClick('status')}
              >
                <Typography component="span" className={classes.nameHeaderText}>
                  {t('mcp.settings.status')}
                </Typography>
              </Button>
            </Th>
            <Th screenReaderText={t('mcp.settings.edit')} />
          </Tr>
        </Thead>
        <Tbody>
          {isLoading && (
            <Tr>
              <Td colSpan={4}>{t('mcp.settings.loading')}</Td>
            </Tr>
          )}
          {!isLoading && sortedServers.length === 0 && (
            <Tr>
              <Td colSpan={4}>{t('mcp.settings.noneAvailable')}</Td>
            </Tr>
          )}
          {sortedServers.map(server => {
            const displayStatus = getDisplayStatus(server);
            const displayDetail = getDisplayDetail(server, displayStatus);
            let statusClass = classes.statusWarn;
            if (displayStatus === 'ok') {
              statusClass = classes.statusOk;
            } else if (displayStatus === 'disabled') {
              statusClass = classes.statusDisabled;
            }

            return (
              <Tr key={server.id} className={classes.tableRow}>
                <Td width={10} className={classes.toggleCell}>
                  {(() => {
                    const isUnavailable =
                      isEnabledToggleUnavailable(displayStatus);
                    const isChecked = getEnabledToggleChecked(
                      server,
                      displayStatus,
                    );
                    const isRowSaving = Boolean(isSaving[server.name]);
                    const isToggleDisabled =
                      isUnavailable || isRowSaving || !canManageMcp;
                    const switchControl = (
                      <Switch
                        id={`mcp-switch-${server.id}`}
                        aria-label={t(
                          'mcp.settings.toggleServerAriaLabel' as any,
                          {
                            serverName: server.name,
                          },
                        )}
                        isChecked={isChecked}
                        isDisabled={isToggleDisabled}
                        onChange={(_event, checked) => {
                          void patchServer(server.name, {
                            enabled: checked,
                          }).catch(() => {
                            // patchServer already updates component error state.
                            // Swallow here to avoid unhandled promise rejections
                            // from event-handler fire-and-forget usage.
                          });
                        }}
                      />
                    );

                    if (!isToggleDisabled) {
                      return switchControl;
                    }

                    return (
                      <Tooltip content={displayDetail}>
                        <Typography component="span">
                          {switchControl}
                        </Typography>
                      </Tooltip>
                    );
                  })()}
                </Td>
                <Td
                  width={35}
                  className={`${classes.rowName} ${classes.nameCell}`}
                >
                  <Typography component="span" className={classes.nameValue}>
                    {server.name}
                  </Typography>
                </Td>
                <Td width={40} className={classes.statusColumnCell}>
                  <div className={classes.statusCell}>
                    {getStatusIcon(displayStatus, statusClass)}
                    {displayStatus === 'failed' ? (
                      <Tooltip
                        content={
                          server.validationError ??
                          t('mcp.settings.token.validationFailed')
                        }
                      >
                        <Typography
                          component="span"
                          className={classes.statusValue}
                        >
                          {displayDetail}
                        </Typography>
                      </Tooltip>
                    ) : (
                      <Typography
                        component="span"
                        className={classes.statusValue}
                      >
                        {displayDetail}
                      </Typography>
                    )}
                  </div>
                </Td>
                <Td width={15} isActionCell style={{ textAlign: 'right' }}>
                  <Button
                    aria-label={t('mcp.settings.editServerAriaLabel' as any, {
                      serverName: server.name,
                    })}
                    icon={<PencilAltIcon />}
                    variant="plain"
                    className={classes.actionButton}
                    isDisabled={!canManageMcp}
                    onClick={() => openConfigureModal(server)}
                  />
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
      <Modal
        variant="small"
        isOpen={Boolean(editingServer)}
        onClose={closeConfigureModal}
        className={classes.configureModal}
        aria-labelledby="mcp-configure-modal"
        aria-describedby="mcp-configure-modal-body"
      >
        <ModalHeader
          title={configureModalTitle}
          labelId="mcp-configure-modal"
          descriptorId="mcp-configure-modal-body"
        />
        <Button
          variant="plain"
          icon={<TimesIcon />}
          aria-label={t('mcp.settings.closeConfigureModalAriaLabel')}
          className={classes.modalCloseButton}
          onClick={closeConfigureModal}
        />
        <ModalBody id="mcp-configure-modal-body">
          {editingServer?.auth === 'dcr' ? (
            <>
              {renderConfigureModalDetails()}
              <div className={classes.modalSectionDescription}>
                {t('mcp.settings.modalDescriptionDcr')}
              </div>
            </>
          ) : (
            <>
              {renderConfigureModalDetails()}
              {showCredentialRadios && (
                <div className={classes.modalSection}>
                  <div className={classes.modalSectionTitle}>
                    {t('mcp.settings.modal.authenticationHeading')}
                  </div>
                  <div
                    className={classes.credentialRadioGroup}
                    id="mcp-credential-mode"
                  >
                    <div>
                      <Radio
                        id="mcp-credential-organization"
                        name="mcp-credential-mode"
                        label={t(
                          'mcp.settings.modal.credentialMode.organization',
                        )}
                        isChecked={modalCredentialMode === 'organization'}
                        onChange={() => onCredentialModeChange('organization')}
                      />
                      <div className={classes.credentialRadioDescription}>
                        {t(
                          'mcp.settings.modal.credentialMode.organizationDescription',
                        )}
                      </div>
                    </div>
                    <Radio
                      id="mcp-credential-personal"
                      name="mcp-credential-mode"
                      label={t('mcp.settings.modal.credentialMode.personal')}
                      isChecked={modalCredentialMode === 'personal'}
                      onChange={() => onCredentialModeChange('personal')}
                    />
                  </div>
                </div>
              )}
              {showPersonalTokenField && (
                <FormGroup
                  label={t('mcp.settings.authenticationToken')}
                  fieldId="mcp-pat-input"
                >
                  <TextInputGroup validated={tokenInputValidated}>
                    <TextInputGroupMain
                      inputId="mcp-pat-input"
                      type="password"
                      value={tokenInputValue}
                      onChange={(_event, value) => onTokenInputChange(value)}
                    />
                    {(tokenValidationState === 'idle' ||
                      tokenValidationState === 'validating') && (
                      <TextInputGroupUtilities>
                        <Button
                          variant="plain"
                          onClick={clearTokenInput}
                          aria-label={t('mcp.settings.token.clearAriaLabel')}
                          icon={<TimesIcon />}
                        />
                      </TextInputGroupUtilities>
                    )}
                  </TextInputGroup>
                  {showTokenHelperText && (
                    <FormHelperText>
                      <HelperText>
                        <HelperTextItem variant={tokenHelperVariant}>
                          {tokenHelperText}
                        </HelperTextItem>
                      </HelperText>
                    </FormHelperText>
                  )}
                </FormGroup>
              )}
            </>
          )}
        </ModalBody>
        <ModalFooter>
          {editingServer?.auth === 'dcr' ? (
            <Button variant="primary" onClick={closeConfigureModal}>
              {t('common.cancel')}
            </Button>
          ) : (
            <>
              <Button
                variant="primary"
                onClick={() => void saveServerToken()}
                isDisabled={
                  !canManageMcp ||
                  isConfigureModalSaving ||
                  tokenValidationState === 'validating' ||
                  isSaveTokenButtonDisabled ||
                  isUpdatingModalStatus
                }
              >
                {t('modal.save')}
              </Button>
              {canRemovePersonalToken && (
                <Button
                  variant="secondary"
                  onClick={() => void removePersonalToken()}
                  isDisabled={
                    !canManageMcp ||
                    isConfigureModalSaving ||
                    tokenValidationState === 'validating' ||
                    isUpdatingModalStatus ||
                    hasRemovedPersonalToken ||
                    !hasSavedTokenInModal
                  }
                  className={classes.removePersonalTokenButton}
                >
                  {t('mcp.settings.removePersonalToken')}
                </Button>
              )}
              <Button variant="link" onClick={closeConfigureModal}>
                {t('common.cancel')}
              </Button>
            </>
          )}
        </ModalFooter>
      </Modal>
    </div>
  );
};
