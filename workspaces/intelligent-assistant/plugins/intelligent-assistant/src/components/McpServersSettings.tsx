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

import { useCallback, useEffect, useState } from 'react';

import { configApiRef, fetchApiRef, useApi } from '@backstage/core-plugin-api';
import { usePermission } from '@backstage/plugin-permission-react';

import { makeStyles } from '@material-ui/core';
import Typography from '@mui/material/Typography';
import { Alert, Button, Switch, Title, Tooltip } from '@patternfly/react-core';
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

import { iaMcpManagePermission } from '@red-hat-developer-hub/backstage-plugin-intelligent-assistant-common';

import { useMcpConfigureModal } from '../hooks/useMcpConfigureModal';
import { useTranslation } from '../hooks/useTranslation';
import { McpConfigureServerModal } from './McpConfigureServerModal';
import {
  compareMcpServers,
  formatApiError,
  getDisplayDetail,
  getDisplayStatus,
  getEnabledToggleChecked,
  isEnabledToggleUnavailable,
  type McpConfigureServer,
  type McpServerSortColumn,
  type ServerStatus,
} from './mcpServersDisplayUtils';

type McpServer = McpConfigureServer;

type McpServersSettingsProps = {
  onClose: () => void;
  backgroundColor?: string;
};

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
    color: 'var(--pf-t--global--icon--color--brand--default)',
  },
  sortHeaderIconInactive: {
    color: 'var(--pf-t--global--icon--color--subtle)',
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
    color: 'var(--pf-t--global--icon--color--status--custom--default)',
  },
  statusWarn: {
    color: 'var(--pf-t--global--icon--color--status--danger--default)',
  },
  statusDisabled: {
    color: 'var(--pf-t--global--icon--color--subtle)',
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
    permission: iaMcpManagePermission,
  });
  const canManageMcp = mcpManagePermission.allowed;
  const [servers, setServers] = useState<McpServer[]>([]);
  const [sortColumn, setSortColumn] = useState<McpServerSortColumn>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

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

  const configureModal = useMcpConfigureModal({
    servers,
    canManageMcp,
    isSaving,
    patchServer,
    validateServer,
    validateCredentials,
    fetchServerValidation,
  });

  const selectedCount = servers.filter(server => {
    const displayStatus = getDisplayStatus(server);
    const isUnavailable =
      displayStatus === 'failed' || displayStatus === 'tokenRequired';
    return server.enabled && !isUnavailable;
  }).length;

  const sortedServers = [...servers].sort((a, b) =>
    compareMcpServers(a, b, sortColumn, sortAsc),
  );

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
            const displayDetail = getDisplayDetail(server, displayStatus, t);
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
                    onClick={() => configureModal.open(server)}
                  />
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
      <McpConfigureServerModal {...configureModal} />
    </div>
  );
};
