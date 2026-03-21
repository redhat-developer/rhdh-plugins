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

import { useMemo, useState } from 'react';

import { makeStyles } from '@material-ui/core';
import ModeEditOutlineOutlinedIcon from '@mui/icons-material/ModeEditOutlineOutlined';
import Typography from '@mui/material/Typography';
import { Button, Switch, Title } from '@patternfly/react-core';
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

type ServerStatus = 'tokenRequired' | 'disabled' | 'ok' | 'failed';

type McpServer = {
  id: string;
  name: string;
  enabled: boolean;
  status: ServerStatus;
  detail: string;
};

type McpServersSettingsProps = {
  onClose: () => void;
  backgroundColor?: string;
};

const useStyles = makeStyles(theme => ({
  root: {
    padding: 0,
    height: '100%',
    width: '100%',
    overflow: 'auto',
    backgroundColor: theme.palette.action.disabled,
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
}));

const INITIAL_SERVERS: McpServer[] = [
  {
    id: 'github',
    name: 'Github',
    enabled: false,
    status: 'tokenRequired',
    detail: 'Token required',
  },
  {
    id: 'dynatrace',
    name: 'Dynatrace',
    enabled: false,
    status: 'disabled',
    detail: 'Disabled',
  },
  {
    id: 'openshift',
    name: 'Openshift',
    enabled: true,
    status: 'ok',
    detail: '7 tools',
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    enabled: false,
    status: 'failed',
    detail: '5 tools',
  },
  {
    id: 'developerhub',
    name: 'Developer Hub',
    enabled: true,
    status: 'ok',
    detail: '5 tools',
  },
  {
    id: 'jenkins',
    name: 'Jenkins',
    enabled: false,
    status: 'disabled',
    detail: 'Disabled',
  },
  {
    id: 'servicenow',
    name: 'Servicenow',
    enabled: true,
    status: 'ok',
    detail: '3 tools',
  },
  {
    id: 'figma',
    name: 'Figma',
    enabled: false,
    status: 'failed',
    detail: 'Failed',
  },
];

const getStatusIcon = (status: ServerStatus, className: string) => {
  if (status === 'tokenRequired') return <KeyIcon className={className} />;
  if (status === 'disabled') return <OffIcon className={className} />;
  if (status === 'failed')
    return <ExclamationCircleIcon className={className} />;
  return <CheckCircleIcon className={className} />;
};

export const McpServersSettings = ({
  onClose,
  backgroundColor,
}: McpServersSettingsProps) => {
  const classes = useStyles();
  const [servers, setServers] = useState<McpServer[]>(INITIAL_SERVERS);
  const [sortAsc, setSortAsc] = useState(true);

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

  return (
    <div className={classes.root} style={{ backgroundColor }}>
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
          {sortedServers.map(server => {
            let statusClass = classes.statusWarn;
            if (server.status === 'ok') {
              statusClass = classes.statusOk;
            } else if (server.status === 'tokenRequired') {
              statusClass = classes.statusToken;
            } else if (server.status === 'disabled') {
              statusClass = classes.statusDisabled;
            }

            return (
              <Tr key={server.id}>
                <Td width={10} className={classes.toggleCell}>
                  <Switch
                    id={`mcp-switch-${server.id}`}
                    aria-label={`Toggle ${server.name}`}
                    isChecked={server.enabled}
                    onChange={(_event, checked) =>
                      setServers(prev =>
                        prev.map(item =>
                          item.id === server.id
                            ? { ...item, enabled: checked }
                            : item,
                        ),
                      )
                    }
                  />
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
                    {getStatusIcon(server.status, statusClass)}
                    <Typography
                      component="span"
                      className={classes.statusValue}
                    >
                      {server.detail}
                    </Typography>
                  </div>
                </Td>
                <Td width={15} isActionCell style={{ textAlign: 'right' }}>
                  <Button
                    aria-label={`Edit ${server.name}`}
                    icon={<ModeEditOutlineOutlinedIcon fontSize="small" />}
                    variant="plain"
                    className={classes.actionButton}
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
