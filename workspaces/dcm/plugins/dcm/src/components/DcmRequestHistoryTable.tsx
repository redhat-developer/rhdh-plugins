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
  useMemo,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { InfoCard, Link, Table, TableColumn } from '@backstage/core-components';
import {
  Box,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import CloseIcon from '@material-ui/icons/Close';
import PersonIcon from '@material-ui/icons/Person';
import SearchIcon from '@material-ui/icons/Search';
import UpdateIcon from '@material-ui/icons/Update';

import type { DcmRequestHistoryRow } from '../data/dcm-mock-rows';

const useCellStyles = makeStyles(theme => ({
  flexRow: { display: 'flex', alignItems: 'center', gap: 8 },
  underlineLink: { textDecoration: 'underline' },
  mutedIcon: { opacity: 0.7 },
  successIcon: { color: theme.palette.status.ok },
  filterInput: { minWidth: 200 },
}));

function HistoryRequestedByCell({
  data,
}: Readonly<{ data: DcmRequestHistoryRow }>) {
  const classes = useCellStyles();
  return (
    <Box className={classes.flexRow}>
      <PersonIcon fontSize="small" className={classes.mutedIcon} />
      <Link to="#" className={classes.underlineLink}>
        {data.requestedBy}
      </Link>
    </Box>
  );
}

function HistoryComponentCell({
  data,
}: Readonly<{ data: DcmRequestHistoryRow }>) {
  const classes = useCellStyles();
  return (
    <Link to="#" className={classes.underlineLink}>
      {data.component}
    </Link>
  );
}

function HistoryTypeCell({ data }: Readonly<{ data: DcmRequestHistoryRow }>) {
  const classes = useCellStyles();
  return (
    <Box className={classes.flexRow}>
      {data.type === 'Create' ? (
        <CheckCircleIcon fontSize="small" className={classes.successIcon} />
      ) : (
        <UpdateIcon fontSize="small" className={classes.mutedIcon} />
      )}
      <Typography variant="body2">{data.type}</Typography>
    </Box>
  );
}

export function useDcmRequestHistoryListState<T extends DcmRequestHistoryRow>(
  allRows: T[],
) {
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);

  const filteredHistory = useMemo(() => {
    if (!filter.trim()) return allRows;
    const lower = filter.toLowerCase();
    return allRows.filter(
      h =>
        h.requestedBy.toLowerCase().includes(lower) ||
        h.component.toLowerCase().includes(lower) ||
        h.usageId.toLowerCase().includes(lower) ||
        h.details.toLowerCase().includes(lower),
    );
  }, [allRows, filter]);

  const paginatedHistory = useMemo(() => {
    const start = page * pageSize;
    return filteredHistory.slice(start, start + pageSize);
  }, [filteredHistory, page, pageSize]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);
  const handleRowsPerPageChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(0);
  }, []);

  return {
    filter,
    setFilter,
    filteredHistory,
    paginatedHistory,
    page,
    pageSize,
    handlePageChange,
    handleRowsPerPageChange,
    /** Total rows for the entity (before text filter), for card title count. */
    entityRowCount: allRows.length,
  };
}

export const DCM_REQUEST_HISTORY_COLUMNS: TableColumn<DcmRequestHistoryRow>[] =
  [
    {
      title: 'Requested at',
      field: 'requestedAt',
      cellStyle: { minWidth: 160 },
      render: data => (
        <Typography variant="body2">{data.requestedAt}</Typography>
      ),
    },
    {
      title: 'Requested by',
      field: 'requestedBy',
      cellStyle: { minWidth: 120 },
      render: data => <HistoryRequestedByCell data={data} />,
    },
    {
      title: 'Component',
      field: 'component',
      cellStyle: { minWidth: 140 },
      render: data => <HistoryComponentCell data={data} />,
    },
    {
      title: 'Usage ID',
      field: 'usageId',
      cellStyle: { minWidth: 140 },
      render: data => <Typography variant="body2">{data.usageId}</Typography>,
    },
    {
      title: 'Type',
      field: 'type',
      cellStyle: { minWidth: 100 },
      render: data => <HistoryTypeCell data={data} />,
    },
    {
      title: 'Details',
      field: 'details',
      cellStyle: { minWidth: 200 },
      render: data => <Typography variant="body2">{data.details}</Typography>,
    },
  ];

export type DcmRequestHistoryFilterClasses = {
  cardHeaderAction: string;
  searchInput: string;
};

type DcmRequestHistoryFilterProps = Readonly<{
  filter: string;
  setFilter: (value: string) => void;
  classes: DcmRequestHistoryFilterClasses;
}>;

export function DcmRequestHistoryFilter({
  filter,
  setFilter,
  classes,
}: DcmRequestHistoryFilterProps) {
  const localClasses = useCellStyles();
  return (
    <Box className={classes.cardHeaderAction}>
      <TextField
        placeholder="Filter"
        variant="standard"
        value={filter}
        onChange={e => setFilter(e.target.value)}
        className={`${classes.searchInput} ${localClasses.filterInput}`}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: filter ? (
            <InputAdornment position="end">
              <IconButton
                size="small"
                aria-label="Clear filter"
                onClick={() => setFilter('')}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null,
        }}
      />
    </Box>
  );
}

type DcmRequestHistoryCardClasses = DcmRequestHistoryFilterClasses & {
  tableCard: string;
  cardContent: string;
};

type DcmRequestHistoryTableCardProps = Readonly<{
  filter: string;
  setFilter: Dispatch<SetStateAction<string>>;
  filteredHistory: DcmRequestHistoryRow[];
  paginatedHistory: DcmRequestHistoryRow[];
  page: number;
  pageSize: number;
  handlePageChange: (newPage: number) => void;
  handleRowsPerPageChange: (newPageSize: number) => void;
  entityRowCount: number;
  columns: TableColumn<DcmRequestHistoryRow>[];
  classes: DcmRequestHistoryCardClasses;
}>;

/**
 * InfoCard + paginated request history table (environment detail + service-spec detail).
 */
export function DcmRequestHistoryTableCard(
  props: DcmRequestHistoryTableCardProps,
) {
  const {
    filter,
    setFilter,
    filteredHistory,
    paginatedHistory,
    page,
    pageSize,
    handlePageChange,
    handleRowsPerPageChange,
    entityRowCount,
    columns,
    classes,
  } = props;

  return (
    <InfoCard
      title={`Request history (${entityRowCount})`}
      action={
        <DcmRequestHistoryFilter
          filter={filter}
          setFilter={setFilter}
          classes={classes}
        />
      }
      className={classes.tableCard}
    >
      <Box className={classes.cardContent}>
        <Table<DcmRequestHistoryRow>
          data={paginatedHistory}
          columns={columns}
          options={{
            paging: true,
            pageSize,
            pageSizeOptions: [5, 10, 25, 50],
            search: false,
            sorting: true,
            padding: 'default',
            toolbar: false,
            emptyRowsWhenPaging: false,
          }}
          totalCount={filteredHistory.length}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          localization={{
            pagination: {
              labelRowsPerPage: 'rows',
            },
          }}
        />
      </Box>
    </InfoCard>
  );
}
