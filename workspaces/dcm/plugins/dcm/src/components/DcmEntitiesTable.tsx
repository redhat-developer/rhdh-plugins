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
import { Link, TableColumn } from '@backstage/core-components';
import { Box, IconButton, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  DCM_ENTITY_STATUS,
  displayDcmEntityStatus,
} from '@red-hat-developer-hub/backstage-plugin-dcm-common';
import CachedIcon from '@material-ui/icons/Cached';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import DeleteIcon from '@material-ui/icons/Delete';
import DescriptionIcon from '@material-ui/icons/Description';
import EditIcon from '@material-ui/icons/Edit';
import PersonIcon from '@material-ui/icons/Person';

import type { DcmEntityRow } from '../data/dcm-mock-rows';

const useCellStyles = makeStyles(theme => ({
  flexRow: { display: 'flex', alignItems: 'center', gap: 8 },
  flexRowTight: { display: 'flex', alignItems: 'center', gap: 4 },
  underlineLink: { textDecoration: 'underline' },
  mutedIcon: { opacity: 0.7 },
  successIcon: { color: theme.palette.status.ok },
}));

function EntityIdCell({ data }: Readonly<{ data: DcmEntityRow }>) {
  const classes = useCellStyles();
  return (
    <Box className={classes.flexRow}>
      <DescriptionIcon fontSize="small" />
      <Typography variant="body2">{data.id}</Typography>
    </Box>
  );
}

function EntityComponentCell({ data }: Readonly<{ data: DcmEntityRow }>) {
  const classes = useCellStyles();
  return (
    <Link to="#" className={classes.underlineLink}>
      {data.component}
    </Link>
  );
}

function EntityStatusCell({ data }: Readonly<{ data: DcmEntityRow }>) {
  const classes = useCellStyles();
  return (
    <Box className={classes.flexRow}>
      {data.status === DCM_ENTITY_STATUS.success ? (
        <CheckCircleIcon fontSize="small" className={classes.successIcon} />
      ) : (
        <CachedIcon fontSize="small" className={classes.mutedIcon} />
      )}
      <Typography variant="body2">
        {displayDcmEntityStatus(data.status)}
      </Typography>
    </Box>
  );
}

function EntityRequestedByCell({ data }: Readonly<{ data: DcmEntityRow }>) {
  const classes = useCellStyles();
  return (
    <Box className={classes.flexRow}>
      <PersonIcon fontSize="small" className={classes.mutedIcon} />
      <Typography variant="body2">{data.requestedBy}</Typography>
    </Box>
  );
}

function EntityActionsCell({ data }: Readonly<{ data: DcmEntityRow }>) {
  const classes = useCellStyles();
  return (
    <Box className={classes.flexRowTight}>
      <IconButton size="small" aria-label="Edit">
        <EditIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        aria-label="Delete"
        disabled={data.status === DCM_ENTITY_STATUS.running}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

export function useDcmEntityListState<T extends DcmEntityRow>(allRows: T[]) {
  const [filter, setFilter] = useState('');

  const filteredEntities = useMemo(() => {
    if (!filter.trim()) return allRows;
    const lower = filter.toLowerCase();
    return allRows.filter(
      e =>
        e.id.toLowerCase().includes(lower) ||
        e.component.toLowerCase().includes(lower) ||
        e.spec.toLowerCase().includes(lower) ||
        e.status.toLowerCase().includes(lower) ||
        displayDcmEntityStatus(e.status).toLowerCase().includes(lower) ||
        e.instanceName.toLowerCase().includes(lower) ||
        e.requestedBy.toLowerCase().includes(lower),
    );
  }, [allRows, filter]);

  return {
    filter,
    setFilter,
    filteredEntities,
    /** Total rows for the entity (before text filter), for card title count. */
    entityRowCount: allRows.length,
  };
}

export const DCM_ENTITY_TABLE_COLUMNS: TableColumn<DcmEntityRow>[] = [
  {
    title: 'ID',
    field: 'id',
    cellStyle: { minWidth: 100 },
    render: data => <EntityIdCell data={data} />,
  },
  {
    title: 'Component',
    field: 'component',
    cellStyle: { minWidth: 140 },
    render: data => <EntityComponentCell data={data} />,
  },
  {
    title: 'Spec',
    field: 'spec',
    cellStyle: { minWidth: 180 },
    render: data => <Typography variant="body2">{data.spec}</Typography>,
  },
  {
    title: 'Status',
    field: 'status',
    cellStyle: { minWidth: 100 },
    render: data => <EntityStatusCell data={data} />,
  },
  {
    title: 'Quantity',
    field: 'quantity',
    cellStyle: { minWidth: 90 },
    render: data => <Typography variant="body2">{data.quantity}</Typography>,
  },
  {
    title: 'Instance name',
    field: 'instanceName',
    cellStyle: { minWidth: 120 },
    render: data => (
      <Typography variant="body2">{data.instanceName}</Typography>
    ),
  },
  {
    title: 'Requested by',
    field: 'requestedBy',
    cellStyle: { minWidth: 120 },
    render: data => <EntityRequestedByCell data={data} />,
  },
  {
    title: 'Actions',
    field: 'actions',
    sorting: false,
    width: '120px',
    render: data => <EntityActionsCell data={data} />,
  },
];

/** Text filter used in entity detail tables (shared implementation with request history). */
export { DcmRequestHistoryFilter as DcmTableFilterField } from './DcmRequestHistoryTable';
