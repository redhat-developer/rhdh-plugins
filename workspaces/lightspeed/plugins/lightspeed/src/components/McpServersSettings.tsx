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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { configApiRef, fetchApiRef, useApi } from '@backstage/core-plugin-api';
import { usePermission } from '@backstage/plugin-permission-react';

import { makeStyles } from '@material-ui/core';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import ModeEditOutlineOutlinedIcon from '@mui/icons-material/ModeEditOutlineOutlined';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {
  Alert,
  Button,
  Modal,
  Switch,
  Title,
  Tooltip,
} from '@patternfly/react-core';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  KeyIcon,
  LockIcon,
  OffIcon,
  SortAmountDownIcon,
  SortAmountUpIcon,
  TimesIcon,
} from '@patternfly/react-icons';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import { lightspeedMcpManagePermission } from '@red-hat-developer-hub/backstage-plugin-lightspeed-common';

type ServerStatus = 'tokenRequired' | 'disabled' | 'ok' | 'failed' | 'unknown';

type McpServer = {
  id: string;
  name: string;
  url?: string;
  enabled: boolean;
  status: 'connected' | 'error' | 'unknown';
  toolCount: number;
  hasToken: boolean;
  hasUserToken: boolean;
  validationError?: string;
};

type McpServersSettingsProps = {
  onClose: () => void;
  backgroundColor?: string;
};

type TokenValidationState = 'idle' | 'validating' | 'success' | 'error';

const SAVED_TOKEN_MASK = '********************';

const useStyles = makeStyles(theme => ({
  root: {
    padding: 0,
    height: '100%',
    minHeight: '100%',
    width: '100%',
    overflow: 'auto',
    backgroundColor:
      'var(--pf-v6-c-table--BackgroundColor, var(--pf-t--global--background--color--primary--default))',
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
    color: theme.palette.text.secondary,
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
  statusToken: {
    color: '#147878',
  },
  statusWarn: {
    color: '#B1380B',
  },
  statusDisabled: {
    color: theme.palette.text.secondary,
  },
  actionButton: {
    color: theme.palette.text.secondary,
  },
  modalDescription: {
    color: theme.palette.text.secondary,
    fontSize: '0.875rem',
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  modalContent: {
    position: 'relative',
    padding: theme.spacing(3, 0, 3, 3),
    marginRight: theme.spacing(3),
  },
  modalCustomCloseButton: {
    position: 'absolute',
    top: theme.spacing(2),
    right: theme.spacing(-0.5),
    color: '#1F1F1F',
  },
  modalHeading: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.75),
    marginBottom: theme.spacing(1),
    fontSize: '1.25rem',
    lineHeight: 1.4,
    fontWeight: 500,
    '& .v5-MuiTypography-root': {
      fontSize: '1.25rem',
      lineHeight: 1.4,
      fontWeight: 500,
    },
  },
  tokenRow: {
    position: 'relative',
  },
  tokenClearButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 1,
    color: theme.palette.text.secondary,
  },
  tokenHelper: {
    color: theme.palette.text.secondary,
    fontSize: '0.75rem',
    marginTop: theme.spacing(0.5),
  },
  tokenInput: {
    marginTop: '1rem !important',
    '& .MuiOutlinedInput-root': {
      height: '3.5rem',
    },
    '& .MuiOutlinedInput-input': {
      padding: '0 0.875rem',
    },
    '& .MuiInputLabel-root': {
      fontSize: '0.875rem',
    },
  },
  tokenInputSuccess: {
    '& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': {
      borderColor: '#3E8635',
      borderWidth: 1,
    },
    '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#3E8635',
    },
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#3E8635',
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: '#3E8635',
    },
  },
  tokenInputError: {
    '& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': {
      borderColor: '#C9190B',
      borderWidth: 1,
    },
    '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#C9190B',
    },
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#C9190B',
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: '#C9190B',
    },
  },
  modalActions: {
    marginTop: theme.spacing(3),
    display: 'flex',
    gap: theme.spacing(1),
  },
  modalActionButton: {
    fontSize: '1rem',
  },
  modalCancelButton: {
    fontSize: '1rem',
  },
  forgetTokenButton: {
    fontSize: '1rem',
    border: '1px solid #B1380B',
    borderRadius: '1.25rem',
    padding: '0.375rem 1rem',
    color: '#B1380B',
    backgroundColor: 'transparent',
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    boxShadow: 'none',
    '&:hover': {
      backgroundColor: 'rgba(201, 25, 11, 0.08)',
    },
  },
  configureModal: {
    '& .pf-v6-c-modal-box': {
      width: '608px',
      maxWidth: '608px',
      height: '326px',
      minHeight: '326px',
    },
    '& .pf-v6-c-modal-box__title, & .pf-v6-c-modal-box__title-text, & .pf-v5-c-modal-box__title, & .pf-v5-c-modal-box__title-text':
      {
        fontSize: '1.25rem !important',
        lineHeight: '1.4 !important',
      },
    '& .pf-v6-c-modal-box__close': {
      display: 'none',
    },
    '& .pf-v5-c-modal-box__close': {
      display: 'none',
    },
    '& .pf-v6-c-button__icon': {
      paddingTop: '5px !important',
      fontSize: '1.25rem !important',
    },
  },
  toggleCell: {
    paddingRight: '0 !important',
  },
  table: {
    width: '100%',
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

type McpServersValidateResponse = {
  name: string;
  status: 'connected' | 'error' | 'unknown';
  toolCount: number;
  validation?: {
    error?: string;
  };
};

type McpTokenValidateResponse = {
  valid: boolean;
  toolCount: number;
  error?: string;
};

const getStatusIcon = (status: ServerStatus, className: string) => {
  if (status === 'tokenRequired') return <KeyIcon className={className} />;
  if (status === 'disabled') return <OffIcon className={className} />;
  if (status === 'failed')
    return <ExclamationCircleIcon className={className} />;
  return <CheckCircleIcon className={className} />;
};

const getDisplayStatus = (server: McpServer): ServerStatus => {
  if (!server.hasToken) return 'tokenRequired';
  if (!server.enabled) return 'disabled';
  if (server.status === 'error') return 'failed';
  if (server.status === 'connected') return 'ok';
  return 'unknown';
};

const getDisplayDetail = (
  server: McpServer,
  displayStatus: ServerStatus,
): string => {
  if (displayStatus === 'disabled') return 'Disabled';
  if (displayStatus === 'tokenRequired') return 'Token required';
  if (displayStatus === 'failed') return 'Failed';
  if (displayStatus === 'ok') {
    const suffix = server.toolCount === 1 ? 'tool' : 'tools';
    return `${server.toolCount} ${suffix}`;
  }
  return 'Unknown';
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
  validationError: server.status === 'error' ? validationError : undefined,
});
export const McpServersSettings = ({
  onClose,
  backgroundColor,
}: McpServersSettingsProps) => {
  const classes = useStyles();
  const configApi = useApi(configApiRef);
  const fetchApi = useApi(fetchApiRef);
  const mcpManagePermission = usePermission({
    permission: lightspeedMcpManagePermission,
  });
  const canManageMcp = mcpManagePermission.allowed;
  const [servers, setServers] = useState<McpServer[]>([]);
  const [sortAsc, setSortAsc] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [editingServerId, setEditingServerId] = useState<string | null>(null);
  const [tokenInputValue, setTokenInputValue] = useState('');
  const [hasSavedTokenInModal, setHasSavedTokenInModal] = useState(false);
  const [hadSavedTokenAtOpen, setHadSavedTokenAtOpen] = useState(false);
  const [tokenValidationState, setTokenValidationState] =
    useState<TokenValidationState>('idle');
  const [tokenValidationMessage, setTokenValidationMessage] = useState('');
  const latestTokenValidationRequest = useRef(0);
  const latestValidatedTokenKey = useRef<string | null>(null);

  const getBaseUrl = useCallback(() => {
    return `${configApi.getString('backend.baseUrl')}/api/lightspeed`;
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

  const validateServer = useCallback(
    async (serverName: string) => {
      const baseUrl = getBaseUrl();
      const data = await fetchJson<McpServersValidateResponse>(
        `${baseUrl}/mcp-servers/${encodeURIComponent(serverName)}/validate`,
        {
          method: 'POST',
        },
      );

      setServers(prev =>
        prev.map(server =>
          server.name === serverName
            ? {
                ...server,
                status: data.status,
                toolCount: data.toolCount,
                validationError:
                  data.status === 'error'
                    ? (data.validation?.error ?? 'Validation failed')
                    : undefined,
              }
            : server,
        ),
      );
    },
    [fetchJson, getBaseUrl],
  );

  const validateTokenInput = useCallback(
    async (server: McpServer, token: string, requestId: number) => {
      if (!server.url) {
        if (requestId !== latestTokenValidationRequest.current) {
          return;
        }
        setTokenValidationState('error');
        setTokenValidationMessage('Server URL is not available for validation');
        return;
      }

      const toFriendlyErrorMessage = (errorMessage?: string) => {
        if (!errorMessage) {
          return 'Authorization failed. Try again.';
        }
        if (errorMessage.includes('Invalid credentials')) {
          return 'Authorization failed. Try again.';
        }
        return errorMessage;
      };

      try {
        const baseUrl = getBaseUrl();
        const result = await fetchJson<McpTokenValidateResponse>(
          `${baseUrl}/mcp-servers/validate`,
          {
            method: 'POST',
            body: JSON.stringify({ url: server.url, token }),
          },
        );

        if (requestId !== latestTokenValidationRequest.current) {
          return;
        }

        const status = result.valid ? 'connected' : 'error';
        const validationError = result.valid
          ? undefined
          : toFriendlyErrorMessage(result.error);

        setServers(prev =>
          prev.map(existing =>
            existing.name === server.name
              ? {
                  ...existing,
                  status,
                  toolCount: result.toolCount,
                  validationError,
                }
              : existing,
          ),
        );

        if (result.valid) {
          setTokenValidationState('success');
          setTokenValidationMessage('Connection successful');
        } else {
          setTokenValidationState('error');
          setTokenValidationMessage(validationError ?? 'Authorization failed');
        }
      } catch (validationError) {
        if (requestId !== latestTokenValidationRequest.current) {
          return;
        }
        setTokenValidationState('error');
        setTokenValidationMessage(
          validationError instanceof Error
            ? validationError.message
            : 'Authorization failed. Try again.',
        );
      }
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
    next.sort((a, b) =>
      sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
    );
    return next;
  }, [servers, sortAsc]);

  const closeConfigureModal = useCallback(() => {
    setEditingServerId(null);
    setTokenInputValue('');
    setHasSavedTokenInModal(false);
    setHadSavedTokenAtOpen(false);
    setTokenValidationState('idle');
    setTokenValidationMessage('');
    latestValidatedTokenKey.current = null;
  }, []);

  const openConfigureModal = (server: McpServer) => {
    setEditingServerId(server.id);
    const hasSavedToken = server.hasToken;
    setHasSavedTokenInModal(hasSavedToken);
    setHadSavedTokenAtOpen(hasSavedToken);
    setTokenInputValue(hasSavedToken ? SAVED_TOKEN_MASK : '');
    latestValidatedTokenKey.current = null;
    if (server.status === 'error' && server.validationError) {
      setTokenValidationState('error');
      setTokenValidationMessage(server.validationError);
    } else {
      setTokenValidationState('idle');
      setTokenValidationMessage('');
    }
  };

  const onTokenInputChange = (value: string) => {
    if (hasSavedTokenInModal && value !== SAVED_TOKEN_MASK) {
      setHasSavedTokenInModal(false);
    }
    setTokenInputValue(value);
    setTokenValidationState('idle');
    setTokenValidationMessage('');
    latestValidatedTokenKey.current = null;
  };

  useEffect(() => {
    const isSavedTokenPlaceholder =
      hasSavedTokenInModal && tokenInputValue === SAVED_TOKEN_MASK;
    const token = tokenInputValue.trim();
    const editingServerName = editingServer?.name;
    const editingServerUrl = editingServer?.url;
    const tokenKey = editingServerName
      ? `${editingServerName}::${token}`
      : null;
    const shouldValidate =
      Boolean(editingServerName) &&
      Boolean(editingServerUrl) &&
      canManageMcp &&
      Boolean(token) &&
      !isSavedTokenPlaceholder &&
      tokenKey !== latestValidatedTokenKey.current;

    const timeoutId = shouldValidate
      ? (() => {
          const requestId = latestTokenValidationRequest.current + 1;
          latestTokenValidationRequest.current = requestId;
          latestValidatedTokenKey.current = tokenKey;
          setTokenValidationState('validating');
          setTokenValidationMessage('Validating token...');
          return window.setTimeout(() => {
            if (!editingServerName || !editingServerUrl) {
              return;
            }
            void validateTokenInput(
              {
                id: editingServerName,
                name: editingServerName,
                url: editingServerUrl,
                enabled: true,
                status: 'unknown',
                toolCount: 0,
                hasToken: true,
                hasUserToken: true,
              },
              token,
              requestId,
            );
          }, 500);
        })()
      : undefined;

    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [
    canManageMcp,
    editingServer?.name,
    editingServer?.url,
    hasSavedTokenInModal,
    tokenInputValue,
    validateTokenInput,
  ]);

  const clearTokenInput = () => {
    if (hasSavedTokenInModal) {
      setHasSavedTokenInModal(false);
    }
    setTokenInputValue('');
    setTokenValidationState('idle');
    setTokenValidationMessage('');
    latestValidatedTokenKey.current = null;
  };

  const forgetSavedToken = () => {
    setHasSavedTokenInModal(false);
    setTokenInputValue('');
    setTokenValidationState('idle');
    setTokenValidationMessage('');
    latestValidatedTokenKey.current = null;
  };

  let tokenInputStateClass = '';
  let tokenHelperColor: string | undefined;
  if (tokenValidationState === 'success') {
    tokenInputStateClass = classes.tokenInputSuccess;
    tokenHelperColor = '#3E8635';
  } else if (tokenValidationState === 'error') {
    tokenInputStateClass = classes.tokenInputError;
    tokenHelperColor = '#C9190B';
  }

  let tokenInputAdornment = (
    <IconButton
      aria-label="Clear token input"
      size="small"
      className={classes.tokenClearButton}
      onClick={clearTokenInput}
    >
      <CancelOutlinedIcon
        style={{
          color: '#6A6E73',
          fontSize: 24,
          width: 24,
          height: 24,
        }}
      />
    </IconButton>
  );

  if (tokenValidationState === 'success') {
    tokenInputAdornment = (
      <CheckCircleIcon
        style={{
          color: '#3E8635',
          fontSize: 20,
          width: 20,
          height: 20,
          marginRight: 3,
        }}
      />
    );
  } else if (tokenValidationState === 'error') {
    tokenInputAdornment = (
      <ExclamationCircleIcon
        style={{
          color: '#C9190B',
          fontSize: 20,
          width: 20,
          height: 20,
          marginRight: 3,
        }}
      />
    );
  }

  const saveServerToken = useCallback(async () => {
    if (!editingServer || !canManageMcp) return;

    if (hasSavedTokenInModal && tokenInputValue === SAVED_TOKEN_MASK) {
      closeConfigureModal();
      return;
    }

    const token = tokenInputValue.trim();
    const hasToken = token.length > 0;

    setTokenValidationState('validating');
    setTokenValidationMessage('Saving and validating token...');

    try {
      await patchServer(editingServer.name, {
        enabled: true,
        token: hasToken ? token : null,
      });
      if (hasToken) {
        await validateServer(editingServer.name);
      }
      closeConfigureModal();
    } catch (e) {
      setTokenValidationState('error');
      setTokenValidationMessage(
        e instanceof Error
          ? e.message
          : `Failed to update ${editingServer.name} token`,
      );
    }
  }, [
    canManageMcp,
    closeConfigureModal,
    editingServer,
    hasSavedTokenInModal,
    patchServer,
    tokenInputValue,
    validateServer,
  ]);

  const allowEmptyTokenSave = hadSavedTokenAtOpen && !tokenInputValue.trim();

  return (
    <div
      className={classes.root}
      style={backgroundColor ? { backgroundColor } : undefined}
    >
      <div className={classes.headerRow}>
        <div>
          <Title headingLevel="h2" size="xl" className={classes.title}>
            MCP servers
          </Title>
          <div className={classes.selectedCount}>
            {selectedCount} of {servers.length} selected
          </div>
        </div>
        <Button
          aria-label="Close MCP settings"
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
          title="You have read-only access to MCP servers."
          className={classes.alert}
        />
      )}

      <Table
        variant="compact"
        aria-label="MCP servers table"
        className={classes.table}
      >
        <Thead>
          <Tr>
            <Th width={10} screenReaderText="Enabled" />
            <Th>
              <Button
                variant="link"
                className={classes.nameHeaderButton}
                icon={sortAsc ? <SortAmountDownIcon /> : <SortAmountUpIcon />}
                iconPosition="right"
                onClick={() => setSortAsc(prev => !prev)}
              >
                <Typography component="span" className={classes.nameHeaderText}>
                  Name
                </Typography>
              </Button>
            </Th>
            <Th className={classes.statusHeader}>Status</Th>
            <Th screenReaderText="Edit" />
          </Tr>
        </Thead>
        <Tbody>
          {isLoading && (
            <Tr>
              <Td colSpan={4}>Loading MCP servers...</Td>
            </Tr>
          )}
          {!isLoading && sortedServers.length === 0 && (
            <Tr>
              <Td colSpan={4}>No MCP servers available.</Td>
            </Tr>
          )}
          {sortedServers.map(server => {
            const displayStatus = getDisplayStatus(server);
            const displayDetail = getDisplayDetail(server, displayStatus);
            let statusClass = classes.statusWarn;
            if (displayStatus === 'ok') {
              statusClass = classes.statusOk;
            } else if (displayStatus === 'tokenRequired') {
              statusClass = classes.statusToken;
            } else if (displayStatus === 'disabled') {
              statusClass = classes.statusDisabled;
            }

            return (
              <Tr key={server.id}>
                <Td width={10} className={classes.toggleCell}>
                  {(() => {
                    const isUnavailable =
                      displayStatus === 'failed' ||
                      displayStatus === 'tokenRequired';
                    const isChecked = isUnavailable ? false : server.enabled;
                    const isRowSaving = Boolean(isSaving[server.name]);
                    const isToggleDisabled =
                      isUnavailable || isRowSaving || !canManageMcp;
                    const switchControl = (
                      <Switch
                        id={`mcp-switch-${server.id}`}
                        aria-label={`Toggle ${server.name}`}
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
                          'Validation failed. Check server URL and token.'
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
                    aria-label={`Edit ${server.name}`}
                    icon={<ModeEditOutlineOutlinedIcon fontSize="small" />}
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
        title={`Configure ${editingServer?.name ?? ''} server`}
        isOpen={Boolean(editingServer)}
        onClose={closeConfigureModal}
        className={classes.configureModal}
      >
        <div className={classes.modalContent}>
          <IconButton
            aria-label="Close configure modal"
            size="small"
            className={classes.modalCustomCloseButton}
            onClick={closeConfigureModal}
          >
            <CloseOutlinedIcon />
          </IconButton>
          <div className={classes.modalHeading}>
            <LockIcon />
            <Typography component="div">{`Configure ${editingServer?.name ?? ''} server`}</Typography>
          </div>
          <div className={classes.modalDescription}>
            Credentials are encrypted at rest and scoped to your profile.
            Lightspeed will operate with your exact permissions.
          </div>
          <div className={classes.tokenRow}>
            <TextField
              id="mcp-pat-input"
              type="password"
              variant="outlined"
              fullWidth
              value={tokenInputValue}
              onChange={event => onTokenInputChange(event.target.value)}
              className={`${classes.tokenInput} ${tokenInputStateClass}`}
              label={
                hasSavedTokenInModal ? 'Saved token' : 'Personal Access Token'
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {tokenInputAdornment}
                  </InputAdornment>
                ),
              }}
            />
            {(!hasSavedTokenInModal || tokenValidationState !== 'idle') && (
              <div
                className={classes.tokenHelper}
                style={{ color: tokenHelperColor }}
              >
                {tokenValidationMessage || 'Enter your token'}
              </div>
            )}
          </div>
          <div className={classes.modalActions}>
            <Button
              key="save"
              variant="primary"
              onClick={() => void saveServerToken()}
              isDisabled={
                !canManageMcp ||
                Boolean(isSaving[editingServer?.name ?? '']) ||
                tokenValidationState === 'validating' ||
                (!tokenInputValue.trim() && !allowEmptyTokenSave)
              }
              className={classes.modalActionButton}
            >
              Save
            </Button>
            {hasSavedTokenInModal && (
              <Button
                key="forget-token"
                variant="plain"
                onClick={forgetSavedToken}
                className={classes.forgetTokenButton}
              >
                Forget token
              </Button>
            )}
            <Button
              key="cancel"
              variant="link"
              onClick={closeConfigureModal}
              className={classes.modalCancelButton}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
