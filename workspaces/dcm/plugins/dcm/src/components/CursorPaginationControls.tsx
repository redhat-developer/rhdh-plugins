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

import { Table, type TableColumn } from '@backstage/core-components';
import { Box, IconButton, MenuItem, Select, Tooltip } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import { useTranslation } from '../hooks/useTranslation';

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    padding: theme.spacing(1, 2),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
}));

export type CursorPaginationControlsProps = Readonly<{
  hasNext: boolean;
  hasPrev: boolean;
  onNext: () => void;
  onPrev: () => void;
  /** Disables both buttons while a page fetch is in progress. */
  loading?: boolean;
  /** Currently selected page size. Required when `onPageSizeChange` is provided. */
  pageSize?: number;
  /** Called with the newly selected page size. When omitted, the size selector is hidden. */
  onPageSizeChange?: (size: number) => void;
  /** Options shown in the page-size dropdown. Defaults to [5, 15, 25]. */
  pageSizeOptions?: number[];
}>;

/**
 * Previous / Next navigation row for cursor-based (server-side) pagination.
 * Rendered below a table when the Backstage `<Table>`'s built-in pager is
 * disabled (`paging: false`).
 *
 * When `onPageSizeChange` and `pageSize` are provided a rows-per-page selector
 * is rendered to the left of the navigation buttons.
 */
export function CursorPaginationControls({
  hasNext,
  hasPrev,
  onNext,
  onPrev,
  loading = false,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 25],
}: CursorPaginationControlsProps) {
  const classes = useStyles();
  const { t } = useTranslation();

  return (
    <Box className={classes.root}>
      {onPageSizeChange !== undefined && pageSize !== undefined && (
        <Select
          value={pageSize}
          renderValue={val => `${val} ${t('common.rows')}`}
          onChange={e => onPageSizeChange(Number(e.target.value))}
          disabled={loading}
          disableUnderline
          inputProps={{ 'aria-label': t('common.rows') }}
        >
          {pageSizeOptions.map(opt => (
            <MenuItem key={opt} value={opt}>
              {opt}
            </MenuItem>
          ))}
        </Select>
      )}
      <Tooltip title={t('common.previousPage')}>
        <Box component="span">
          <IconButton
            size="small"
            disabled={!hasPrev || loading}
            onClick={onPrev}
            aria-label={t('common.previousPage')}
          >
            <ChevronLeftIcon />
          </IconButton>
        </Box>
      </Tooltip>
      <Tooltip title={t('common.nextPage')}>
        <Box component="span">
          <IconButton
            size="small"
            disabled={!hasNext || loading}
            onClick={onNext}
            aria-label={t('common.nextPage')}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </Tooltip>
    </Box>
  );
}

/**
 * A `<Table>` in cursor-pagination mode (built-in pager disabled) with
 * {@link CursorPaginationControls} rendered directly below it.
 *
 * Use this wherever cursor-based server pagination is enabled to avoid
 * duplicating the table-options + controls wiring.
 */
export function CursorPaginatedTable<T extends object>({
  data,
  columns,
  pagination,
}: Readonly<{
  data: T[];
  columns: TableColumn<T>[];
  pagination: CursorPaginationControlsProps;
}>) {
  return (
    <>
      <Table<T>
        data={data}
        columns={columns}
        options={{
          paging: false,
          search: false,
          sorting: true,
          padding: 'default',
          toolbar: false,
          emptyRowsWhenPaging: false,
        }}
      />
      <CursorPaginationControls {...pagination} />
    </>
  );
}
