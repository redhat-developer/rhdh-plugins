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

import { configApiRef, fetchApiRef, useApi } from '@backstage/core-plugin-api';

import GlobalStyles from '@mui/material/GlobalStyles';
import { styled } from '@mui/material/styles';
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
} from '@patternfly/react-icons';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import { useIaMcpToolsPermission } from '../hooks/useIaMcpToolsPermission';
import { useMcpConfigureModal } from '../hooks/useMcpConfigureModal';
import { useTranslation } from '../hooks/useTranslation';
import { pf6HideNestedRhUiIconCss } from './chatShellTokens';
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
  backgroundColor?: string;
  /** When true, omits the section title (e.g. tab bar already shows "MCP servers"). */
  hideSectionTitle?: boolean;
  /** Fires when the settings panel root becomes scrollable (overlay/docked jump buttons). */
  onContentOverflowChange?: (hasOverflow: boolean) => void;
};

const mcpClasses = {
  headerRow: 'ia-mcp-headerRow',
  headerRowWithTitle: 'ia-mcp-headerRow--withTitle',
  selectedCount: 'ia-mcp-selectedCount',
  title: 'ia-mcp-title',
  nameHeaderButton: 'ia-mcp-nameHeaderButton',
  statusHeaderButton: 'ia-mcp-statusHeaderButton',
  sortHeaderIconActive: 'ia-mcp-sortHeaderIconActive',
  sortHeaderIconInactive: 'ia-mcp-sortHeaderIconInactive',
  nameHeaderText: 'ia-mcp-nameHeaderText',
  nameCell: 'ia-mcp-nameCell',
  nameHeaderCell: 'ia-mcp-nameHeaderCell',
  statusHeader: 'ia-mcp-statusHeader',
  statusColumnCell: 'ia-mcp-statusColumnCell',
  nameValue: 'ia-mcp-nameValue',
  statusCell: 'ia-mcp-statusCell',
  statusValue: 'ia-mcp-statusValue',
  statusOk: 'ia-mcp-statusOk',
  statusWarn: 'ia-mcp-statusWarn',
  statusDisabled: 'ia-mcp-statusDisabled',
  actionButton: 'ia-mcp-actionButton',
  actionButtonVisible: 'ia-mcp-actionButton--visible',
  actionCell: 'ia-mcp-actionCell',
  tableRow: 'ia-mcp-tableRow',
  toggleCell: 'ia-mcp-toggleCell',
  tableShell: 'ia-mcp-tableShell',
  table: 'ia-mcp-table',
  alert: 'ia-mcp-alert',
} as const;

const StyledMcpRoot = styled('div')(({ theme }) => ({
  padding: 0,
  height: '100%',
  minHeight: 0,
  flex: 1,
  width: '100%',
  overflow: 'auto',
  [`& .${mcpClasses.headerRow}`]: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(1.5),
    marginTop: theme.spacing(1),
    marginLeft: theme.spacing(3),
    marginRight: theme.spacing(2),
  },
  [`& .${mcpClasses.headerRowWithTitle}`]: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  [`& .${mcpClasses.selectedCount}`]: {
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
    fontSize: '0.75rem',
  },
  [`& .${mcpClasses.title}`]: {
    fontSize: '1.125rem',
  },
  [`& .${mcpClasses.nameHeaderButton}`]: {
    paddingLeft: 0,
    paddingTop: 0,
    paddingBottom: 0,
    marginLeft: 0,
    fontWeight: 600,
    fontSize: '0.75rem',
    lineHeight: '1.25rem',
    minHeight: 'auto',
    color: theme.palette.text.primary,
    textDecoration: 'none !important',
    display: 'inline-flex',
    alignItems: 'center',
  },
  [`& .${mcpClasses.statusHeaderButton}`]: {
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
  [`& .${mcpClasses.sortHeaderIconActive}`]: {
    color: 'var(--pf-t--global--icon--color--brand--default)',
  },
  [`& .${mcpClasses.sortHeaderIconInactive}`]: {
    color: 'var(--pf-t--global--icon--color--subtle)',
  },
  [`& .${mcpClasses.nameHeaderText}`]: {
    fontSize: '0.75rem',
    lineHeight: '1.25rem',
    fontWeight: 600,
  },
  [`& .${mcpClasses.nameHeaderCell}, & .${mcpClasses.nameCell}`]: {
    paddingLeft: '8px',
    maxWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
  },
  [`& .${mcpClasses.nameValue}`]: {
    fontSize: '0.875rem',
    fontWeight: 500,
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  [`& .${mcpClasses.statusHeader}, & .${mcpClasses.statusColumnCell}`]: {
    paddingLeft: 0,
    maxWidth: 0,
    overflow: 'hidden',
  },
  [`& .${mcpClasses.statusCell}`]: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    whiteSpace: 'nowrap',
    minWidth: 0,
    overflow: 'hidden',
  },
  [`& .${mcpClasses.statusValue}`]: {
    fontSize: '0.875rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  [`& .${mcpClasses.statusOk}`]: {
    color: 'var(--pf-t--global--icon--color--status--custom--default)',
  },
  [`& .${mcpClasses.statusWarn}`]: {
    color: 'var(--pf-t--global--icon--color--status--danger--default)',
  },
  [`& .${mcpClasses.statusDisabled}`]: {
    color: 'var(--pf-t--global--icon--color--subtle)',
  },
  [`& .${mcpClasses.actionButton}`]: {
    color: theme.palette.text.primary,
    opacity: 0,
    transition: 'opacity 0.15s ease-in-out',
    minWidth: '2rem',
    minHeight: '2rem',
    ...pf6HideNestedRhUiIconCss,
  },
  [`& .${mcpClasses.actionButtonVisible}`]: {
    opacity: 1,
  },
  [`& .${mcpClasses.actionCell}`]: {
    width: '2.75rem',
    textAlign: 'center',
    verticalAlign: 'middle',
    paddingInline: 0,
  },
  [`& .${mcpClasses.toggleCell}`]: {
    width: '2.5rem',
    paddingInlineStart: 0,
    paddingInlineEnd: 0,
    verticalAlign: 'middle',
    '--pf-v6-c-table--cell--first-last-child--PaddingInlineStart': '0',
  },
  [`& .${mcpClasses.tableShell}`]: {
    boxSizing: 'border-box',
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(2),
    overflow: 'hidden',
  },
  [`& .${mcpClasses.table}`]: {
    width: '100%',
    maxWidth: '100%',
    margin: 0,
    '--pf-v6-c-table--BackgroundColor': 'transparent',
    '&.pf-m-grid-md tbody tr, &.pf-m-grid-md thead tr': {
      display: 'table-row',
    },
    '&.pf-m-grid-md tbody td, &.pf-m-grid-md thead th': {
      display: 'table-cell',
    },
    '& table': {
      tableLayout: 'fixed',
      width: '100%',
    },
    '& th, & td': {
      backgroundColor: 'transparent',
      borderBottom: 0,
      verticalAlign: 'middle',
    },
    '& th': {
      fontSize: '0.75rem',
      fontWeight: 600,
      color: theme.palette.text.primary,
      whiteSpace: 'nowrap',
      textAlign: 'left',
    },
    '& td': {
      paddingTop: theme.spacing(1.5),
      paddingBottom: theme.spacing(1.5),
    },
    '& thead th:first-of-type, & tbody td:first-of-type': {
      paddingInlineStart: 0,
    },
  },
  [`& .${mcpClasses.alert}`]: {
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
  backgroundColor,
  hideSectionTitle = false,
  onContentOverflowChange,
}: McpServersSettingsProps) => {
  const { t } = useTranslation();
  const rootRef = useRef<HTMLDivElement>(null);
  const configApi = useApi(configApiRef);
  const fetchApi = useApi(fetchApiRef);
  const { allowed: hasMcpToolsAccess, loading: mcpToolsPermissionLoading } =
    useIaMcpToolsPermission();

  const [servers, setServers] = useState<McpServer[]>([]);
  const [sortColumn, setSortColumn] = useState<McpServerSortColumn>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

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
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Failed to load MCP server settings',
      );
    } finally {
      setIsLoading(false);
    }
  }, [fetchJson, getBaseUrl, validateServer]);

  useEffect(() => {
    if (mcpToolsPermissionLoading || !hasMcpToolsAccess) {
      return;
    }
    loadServers();
  }, [loadServers, mcpToolsPermissionLoading, hasMcpToolsAccess]);

  const patchServer = useCallback(
    async (
      serverName: string,
      body: { enabled?: boolean; token?: string | null },
    ) => {
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
    [fetchJson, getBaseUrl, loadServers],
  );

  const configureModal = useMcpConfigureModal({
    servers,
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

  useEffect(() => {
    if (!onContentOverflowChange) {
      return undefined;
    }
    const el = rootRef.current;
    if (!el) {
      return undefined;
    }

    const updateOverflow = () => {
      onContentOverflowChange(el.scrollHeight > el.clientHeight + 1);
    };

    updateOverflow();

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(updateOverflow)
        : undefined;
    resizeObserver?.observe(el);
    el.addEventListener('scroll', updateOverflow, { passive: true });
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateOverflow);
    }

    return () => {
      resizeObserver?.disconnect();
      el.removeEventListener('scroll', updateOverflow);
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', updateOverflow);
      }
      onContentOverflowChange(false);
    };
  }, [onContentOverflowChange, servers.length, isLoading, error]);

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
            ? mcpClasses.sortHeaderIconActive
            : mcpClasses.sortHeaderIconInactive
        }
      />
    );
  };

  if (mcpToolsPermissionLoading || !hasMcpToolsAccess) {
    return null;
  }

  return (
    <StyledMcpRoot
      ref={rootRef}
      style={backgroundColor ? { backgroundColor } : undefined}
    >
      <GlobalStyles
        styles={{
          '.pf-v6-c-backdrop': {
            zIndex: '1400 !important',
          },
          '.pf-v5-c-backdrop': {
            zIndex: '1400 !important',
          },
        }}
      />
      <div
        className={`${mcpClasses.headerRow}${hideSectionTitle ? '' : ` ${mcpClasses.headerRowWithTitle}`}`}
      >
        <div>
          {!hideSectionTitle && (
            <Title headingLevel="h2" size="xl" className={mcpClasses.title}>
              {t('mcp.settings.title')}
            </Title>
          )}
          <div className={mcpClasses.selectedCount}>
            {t('mcp.settings.selectedCount' as any, {
              selectedCount: String(selectedCount),
              totalCount: String(servers.length),
            })}
          </div>
        </div>
      </div>
      {error && (
        <Alert
          variant="danger"
          isInline
          title={error}
          className={mcpClasses.alert}
        />
      )}
      <div className={mcpClasses.tableShell}>
        <Table
          variant="compact"
          aria-label={t('mcp.settings.tableAriaLabel')}
          className={mcpClasses.table}
        >
          <Thead>
            <Tr>
              <Th
                screenReaderText={t('mcp.settings.enabled')}
                className={mcpClasses.toggleCell}
              />
              <Th className={mcpClasses.nameHeaderCell}>
                <Button
                  variant="link"
                  className={mcpClasses.nameHeaderButton}
                  icon={renderSortIcon('name')}
                  iconPosition="right"
                  onClick={() => onSortColumnClick('name')}
                >
                  <Typography
                    component="span"
                    className={mcpClasses.nameHeaderText}
                  >
                    {t('mcp.settings.name')}
                  </Typography>
                </Button>
              </Th>
              <Th className={mcpClasses.statusHeader}>
                <Button
                  variant="link"
                  className={mcpClasses.statusHeaderButton}
                  icon={renderSortIcon('status')}
                  iconPosition="right"
                  onClick={() => onSortColumnClick('status')}
                >
                  <Typography
                    component="span"
                    className={mcpClasses.nameHeaderText}
                  >
                    {t('mcp.settings.status')}
                  </Typography>
                </Button>
              </Th>
              <Th
                screenReaderText={t('mcp.settings.edit')}
                className={mcpClasses.actionCell}
              />
            </Tr>
          </Thead>
          <Tbody
            onMouseOver={event => {
              const row = (event.target as HTMLElement).closest(
                `tr.${mcpClasses.tableRow}`,
              );
              const rowId = row?.getAttribute('data-server-id');
              if (rowId) {
                setHoveredRowId(rowId);
              }
            }}
            onMouseLeave={event => {
              const next = event.relatedTarget;
              if (
                !(next instanceof Node) ||
                !event.currentTarget.contains(next)
              ) {
                setHoveredRowId(null);
              }
            }}
          >
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
              let statusClass:
                | typeof mcpClasses.statusOk
                | typeof mcpClasses.statusWarn
                | typeof mcpClasses.statusDisabled = mcpClasses.statusWarn;
              if (displayStatus === 'ok') {
                statusClass = mcpClasses.statusOk;
              } else if (displayStatus === 'disabled') {
                statusClass = mcpClasses.statusDisabled;
              }

              return (
                <Tr
                  key={server.id}
                  className={mcpClasses.tableRow}
                  data-server-id={server.id}
                >
                  <Td className={mcpClasses.toggleCell}>
                    {(() => {
                      const isUnavailable =
                        isEnabledToggleUnavailable(displayStatus);
                      const isChecked = getEnabledToggleChecked(
                        server,
                        displayStatus,
                      );
                      const isRowSaving = Boolean(isSaving[server.name]);
                      const isToggleDisabled = isUnavailable || isRowSaving;
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
                  <Td className={mcpClasses.nameCell}>
                    <Typography
                      component="span"
                      className={mcpClasses.nameValue}
                    >
                      {server.name}
                    </Typography>
                  </Td>
                  <Td className={mcpClasses.statusColumnCell}>
                    <div className={mcpClasses.statusCell}>
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
                            className={mcpClasses.statusValue}
                          >
                            {displayDetail}
                          </Typography>
                        </Tooltip>
                      ) : (
                        <Typography
                          component="span"
                          className={mcpClasses.statusValue}
                        >
                          {displayDetail}
                        </Typography>
                      )}
                    </div>
                  </Td>
                  <Td className={mcpClasses.actionCell}>
                    <Button
                      variant="plain"
                      className={`${mcpClasses.actionButton}${
                        hoveredRowId === server.id
                          ? ` ${mcpClasses.actionButtonVisible}`
                          : ''
                      }`}
                      aria-label={t('mcp.settings.editServerAriaLabel' as any, {
                        serverName: server.name,
                      })}
                      onFocus={() => setHoveredRowId(server.id)}
                      onBlur={() =>
                        setHoveredRowId(current =>
                          current === server.id ? null : current,
                        )
                      }
                      onClick={event => {
                        configureModal.open(server);
                        event.currentTarget.blur();
                      }}
                    >
                      <PencilAltIcon
                        style={{ width: 18, height: 18, display: 'block' }}
                        aria-hidden
                      />
                    </Button>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </div>
      <McpConfigureServerModal {...configureModal} />
    </StyledMcpRoot>
  );
};
