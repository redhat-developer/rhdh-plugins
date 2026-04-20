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
import { Box, Button } from '@material-ui/core';
import { Dispatch, SetStateAction } from 'react';
import MuiAlert from '@material-ui/lab/Alert';
import { DcmDataCenterTabEmptyState } from './DcmDataCenterTabEmptyState';
import { DcmSearchCardAction } from './dcmTabListHelpers';
import { useDcmStyles } from './dcmStyles';

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

  // ── Search ──────────────────────────────────────────────────────────────
  search: string;
  onSearchChange: Dispatch<SetStateAction<string>>;

  // ── Pagination ───────────────────────────────────────────────────────────
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
  onRowsPerPageChange: (pageSize: number) => void;

  // ── Empty state ──────────────────────────────────────────────────────────
  emptyTitle: string;
  emptyDescription: string;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  illustrationSrc?: string;

  // ── Card header ──────────────────────────────────────────────────────────
  entityLabel: string;
}>;

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
  search,
  onSearchChange,
  page,
  pageSize,
  onPageChange,
  onRowsPerPageChange,
  emptyTitle,
  emptyDescription,
  primaryActionLabel,
  onPrimaryAction,
  illustrationSrc,
  entityLabel,
}: DcmCrudTabLayoutProps<T>) {
  const classes = useDcmStyles();

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
                Retry
              </Button>
            ) : undefined
          }
        >
          {loadError}
        </MuiAlert>
      </Box>
    );
  }

  if (items.length === 0) {
    return (
      <DcmDataCenterTabEmptyState
        title={emptyTitle}
        description={emptyDescription}
        primaryActionLabel={primaryActionLabel}
        onPrimaryAction={onPrimaryAction}
        illustrationSrc={illustrationSrc ?? ''}
      />
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
        title={`${entityLabel} (${filtered.length})`}
        action={
          <DcmSearchCardAction
            value={search}
            setValue={onSearchChange}
            classes={classes}
          />
        }
        className={classes.dataCard}
        titleTypographyProps={{ className: classes.cardTitle }}
      >
        <Box className={classes.cardContent}>
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
            }}
            totalCount={filtered.length}
            page={page}
            onPageChange={onPageChange}
            onRowsPerPageChange={onRowsPerPageChange}
            localization={{ pagination: { labelRowsPerPage: 'rows' } }}
          />
        </Box>
      </InfoCard>
    </Box>
  );
}
