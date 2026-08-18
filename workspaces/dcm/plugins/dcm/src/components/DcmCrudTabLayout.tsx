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
  Table,
  TableColumn,
  InfoCard,
  Progress,
} from '@backstage/core-components';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@material-ui/core';
import SyncIcon from '@material-ui/icons/Sync';
import { Dispatch, SetStateAction } from 'react';
import MuiAlert from '@material-ui/lab/Alert';
import type { BoxProps } from '@material-ui/core/Box';
import { DcmDataCenterTabEmptyState } from './DcmDataCenterTabEmptyState';
import { DcmSearchCardAction } from './dcmTabListHelpers';
import { CursorPaginatedTable } from './CursorPaginationControls';
import { useDcmStyles } from './dcmStyles';
import { useTranslation } from '../hooks/useTranslation';

export type DcmCrudTabLayoutProps<T extends object> = Readonly<{
  /** Full (unfiltered, unpaginated) list used to decide empty-state vs. table. */
  items: T[];
  /** Client-side-filtered list. Length is shown in the card title. */
  filtered: T[];
  /** Paginated slice of `filtered` passed to `<Table>`. */
  paginated: T[];
  /** Column definitions for `<Table>`. */
  columns: TableColumn<T>[];
  /** Whether data is still loading. Shows a `<Progress>` spinner when true. */
  loading: boolean;
  /** When non-null, shown as an error alert instead of the table. */
  loadError?: string | null;
  /** Retries the data load (used by the error alert's Retry button). */
  onRetry?: () => void;
  /** When non-null, shown as a dismissible inline alert above the table/empty-state. */
  actionError?: string | null;
  /** Called when the user dismisses the actionError alert. */
  onDismissActionError?: () => void;

  // ── Search ──────────────────────────────────────────────────────────────
  search: string;
  onSearchChange: Dispatch<SetStateAction<string>>;

  // ── Client-side pagination (mutually exclusive with cursorPagination) ────
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number, pageSize: number) => void;
  onRowsPerPageChange?: (pageSize: number) => void;

  /**
   * When provided, server-side cursor-based pagination is used instead of the
   * Backstage Table's built-in pager. The table is rendered with `paging:
   * false` and {@link CursorPaginationControls} is shown below it.
   */
  cursorPagination?: {
    hasNext: boolean;
    hasPrev: boolean;
    onNext: () => void;
    onPrev: () => void;
    loading?: boolean;
    pageSize?: number;
    onPageSizeChange?: (size: number) => void;
    pageSizeOptions?: number[];
  };

  // ── Empty state ──────────────────────────────────────────────────────────
  emptyTitle: string;
  emptyDescription: string;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  illustrationSrc?: string;

  // ── Card header ──────────────────────────────────────────────────────────
  entityLabel: string;

  // ── Refresh ──────────────────────────────────────────────────────────────
  /** When provided, a refresh icon button is shown next to the search field. */
  onRefresh?: () => void;
  /** When true, the refresh button shows a spinner instead of the sync icon. */
  refreshing?: boolean;
}>;

function ActionErrorAlert({
  message,
  onClose,
  boxProps,
}: Readonly<{
  message: string;
  onClose?: () => void;
  boxProps?: BoxProps;
}>) {
  return (
    <Box {...boxProps}>
      <MuiAlert severity="error" variant="outlined" onClose={onClose}>
        {message}
      </MuiAlert>
    </Box>
  );
}

/**
 * Generic layout shell for DCM CRUD tab pages.
 *
 * Renders one of four states depending on the supplied props:
 *   - **Loading** — a `<Progress>` spinner while `loading` is true.
 *   - **Error** — an outlined error alert containing `loadError` and, when
 *     `onRetry` is provided, a Retry button.
 *   - **Empty** — the `<DcmDataCenterTabEmptyState>` illustration with
 *     `emptyTitle`, `emptyDescription`, and the primary action button.
 *   - **Table** — a toolbar row with the primary action button above an
 *     `<InfoCard>` that contains a client-side-searchable, paginated
 *     `<Table>`.
 *
 * All data-management concerns (loading, filtering, pagination, dialog state)
 * are handled externally — typically by {@link useCrudTab} — and passed in
 * as props. See {@link DcmCrudTabLayoutProps} for a full description of each
 * prop.
 */
export function DcmCrudTabLayout<T extends object>({
  items,
  filtered,
  paginated,
  columns,
  loading,
  loadError,
  onRetry,
  actionError,
  onDismissActionError,
  search,
  onSearchChange,
  page = 1,
  pageSize = 5,
  onPageChange,
  onRowsPerPageChange,
  cursorPagination,
  emptyTitle,
  emptyDescription,
  primaryActionLabel,
  onPrimaryAction,
  illustrationSrc,
  entityLabel,
  onRefresh,
  refreshing,
}: DcmCrudTabLayoutProps<T>) {
  const classes = useDcmStyles();
  const { t } = useTranslation();

  if (loading) return <Progress />;

  if (loadError) {
    return (
      <Box p={2}>
        <MuiAlert
          severity="error"
          variant="outlined"
          action={
            onRetry ? (
              <Button color="inherit" size="small" onClick={onRetry}>
                {t('common.retry')}
              </Button>
            ) : undefined
          }
        >
          {loadError}
        </MuiAlert>
      </Box>
    );
  }

  // Show global empty-state only when we are certain the dataset is truly
  // empty (i.e. not just an empty cursor page on page 2+). If hasPrev is true
  // the user deleted the last row on a non-first page — fall through to the
  // table view so cursor controls remain accessible.
  if (items.length === 0 && !cursorPagination?.hasPrev) {
    return (
      <>
        {actionError && (
          <ActionErrorAlert
            message={actionError}
            onClose={onDismissActionError}
            boxProps={{ p: 2 }}
          />
        )}
        <DcmDataCenterTabEmptyState
          title={emptyTitle}
          description={emptyDescription}
          primaryActionLabel={primaryActionLabel}
          onPrimaryAction={onPrimaryAction}
          illustrationSrc={illustrationSrc ?? ''}
        />
      </>
    );
  }

  return (
    <Box className={classes.root}>
      <Box className={classes.toolbarRow}>
        <Button variant="contained" color="primary" onClick={onPrimaryAction}>
          {primaryActionLabel}
        </Button>
      </Box>
      <InfoCard
        title={
          cursorPagination ? entityLabel : `${entityLabel} (${filtered.length})`
        }
        action={
          <Box display="flex" alignItems="center">
            <DcmSearchCardAction
              value={search}
              setValue={onSearchChange}
              classes={classes}
            />
            {onRefresh && (
              <Tooltip title={t('common.refresh')}>
                <Box component="span">
                  <IconButton
                    size="small"
                    aria-label={t('common.refresh')}
                    onClick={onRefresh}
                    disabled={refreshing}
                  >
                    {refreshing ? (
                      <CircularProgress size={16} />
                    ) : (
                      <SyncIcon fontSize="small" />
                    )}
                  </IconButton>
                </Box>
              </Tooltip>
            )}
          </Box>
        }
        className={classes.dataCard}
        titleTypographyProps={{ className: classes.cardTitle }}
      >
        {actionError && (
          <ActionErrorAlert
            message={actionError}
            onClose={onDismissActionError}
            boxProps={{ px: 2, pt: 2 }}
          />
        )}
        <Box className={classes.cardContent}>
          {cursorPagination ? (
            <CursorPaginatedTable<T>
              data={filtered}
              columns={columns}
              pagination={cursorPagination}
            />
          ) : (
            <Table<T>
              data={paginated}
              columns={columns}
              options={{
                paging: true,
                pageSize,
                pageSizeOptions: [5, 10, 25],
                search: false,
                sorting: true,
                padding: 'default',
                toolbar: false,
                /** Avoid blank rows padding the table to `pageSize` when fewer rows exist. */
                emptyRowsWhenPaging: false,
              }}
              totalCount={filtered.length}
              page={Math.max(0, page - 1)}
              onPageChange={
                onPageChange ? (p, ps) => onPageChange(p + 1, ps) : undefined
              }
              onRowsPerPageChange={onRowsPerPageChange}
              localization={{
                pagination: { labelRowsPerPage: t('common.rows') },
              }}
            />
          )}
        </Box>
      </InfoCard>
    </Box>
  );
}
