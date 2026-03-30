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

import { configApiRef, fetchApiRef, useApi } from '@backstage/core-plugin-api';

import { makeStyles } from '@material-ui/core';
import ModeEditOutlineOutlinedIcon from '@mui/icons-material/ModeEditOutlineOutlined';
import Typography from '@mui/material/Typography';
import { Alert, Button, Switch, Title, Tooltip } from '@patternfly/react-core';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  KeyIcon,
  OffIcon,
  SortAmountDownIcon,
  SortAmountUpIcon,
  TimesIcon,
} from '@patternfly/react-icons';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

type ServerStatus = 'tokenRequired' | 'disabled' | 'ok' | 'failed' | 'unknown';

type McpServer = {
  id: string;
  name: string;
  enabled: boolean;
  status: 'connected' | 'error' | 'unknown';
  toolCount: number;
  hasToken: boolean;
  hasUserToken: boolean;
};

type McpServersSettingsProps = {
  onClose: () => void;
};

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
};

const getStatusIcon = (status: ServerStatus, className: string) => {
  if (status === 'tokenRequired') return <KeyIcon className={className} />;
  if (status === 'disabled') return <OffIcon className={className} />;
  if (status === 'failed')
    return <ExclamationCircleIcon className={className} />;
  return <CheckCircleIcon className={className} />;
};

const getDisplayStatus = (server: McpServer): ServerStatus => {
  if (!server.enabled) return 'disabled';
  if (!server.hasToken) return 'tokenRequired';
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

const toUiServer = (server: McpServerResponse): McpServer => ({
  id: server.name,
  name: server.name,
  enabled: server.enabled,
  status: server.status,
  toolCount: server.toolCount,
  hasToken: server.hasToken,
  hasUserToken: server.hasUserToken,
});

export const McpServersSettings = ({ onClose }: McpServersSettingsProps) => {
  const classes = useStyles();
  const configApi = useApi(configApiRef);
  const fetchApi = useApi(fetchApiRef);
  const [servers, setServers] = useState<McpServer[]>([]);
  const [sortAsc, setSortAsc] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

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

  const loadServers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const baseUrl = getBaseUrl();
      const data = await fetchJson<McpServersListResponse>(
        `${baseUrl}/mcp-servers`,
      );
      setServers((data.servers ?? []).map(toUiServer));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Failed to load MCP server settings',
      );
    } finally {
      setIsLoading(false);
    }
  }, [fetchJson, getBaseUrl]);

  useEffect(() => {
    loadServers();
  }, [loadServers]);

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
              server.name === serverName ? toUiServer(data.server!) : server,
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
      } finally {
        setIsSaving(prev => ({ ...prev, [serverName]: false }));
      }
    },
    [fetchJson, getBaseUrl, loadServers],
  );

  const selectedCount = useMemo(
    () => servers.filter(server => server.enabled).length,
    [servers],
  );

  const sortedServers = useMemo(() => {
    const next = [...servers];
    next.sort((a, b) =>
      sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
    );
    return next;
  }, [servers, sortAsc]);

  const onEditClick = useCallback((event: MouseEvent) => {
    // Intentionally no-op in this branch; follow-up branch will wire edit flow.
    event.preventDefault();
  }, []);

  return (
    <div className={classes.root}>
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

                    return (
                      <Switch
                        id={`mcp-switch-${server.id}`}
                        aria-label={`Toggle ${server.name}`}
                        isChecked={isChecked}
                        isDisabled={isUnavailable || isRowSaving}
                        onChange={(_event, checked) => {
                          patchServer(server.name, { enabled: checked });
                        }}
                      />
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
                      <Tooltip content="Token authentication failed, click edit to configure it again">
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
                    onClick={onEditClick}
                  />
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </div>
  );
};
