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
  Table as MUTable,
  TableContainer,
  TableBody,
  TableHead,
  TableCell,
  TableRow,
  TablePagination,
  Typography,
} from '@material-ui/core';
import {
  Bullseye,
  Button,
  Flex,
  FlexItem,
  Spinner,
} from '@patternfly/react-core';

import './Table.css';
import { FRONTEND_PAGINATION } from '@red-hat-developer-hub/backstage-plugin-konflux-common';

const ROWS_PER_PAGE_OPTIONS = FRONTEND_PAGINATION.ROWS_PER_PAGE_OPTIONS;

export type ItemWithKey = {
  itemKey: string;
};

export type Pagination = {
  page: number;
  totalCount: number;
  setPage: (p: number) => void;
  rowsPerPage: number;
  setRowsPerPage: (p: number) => void;
};

type Props<T extends ItemWithKey> = {
  columns: string[];
  data: T[];
  ItemRow: React.ComponentType<T>;
  isFetching?: boolean;
  pagination?: Pagination;
  onLoadMore?: () => void | Promise<void>;
  hasMore?: boolean;
};

export const Table = <T extends ItemWithKey>({
  columns,
  data,
  ItemRow,
  isFetching,
  pagination,
  onLoadMore,
  hasMore,
}: Props<T>) => {
  return (
    <div className="wrapper">
      {isFetching && (
        <div className="spinner-wrapper">
          <Bullseye>
            <Spinner size="xl" />
          </Bullseye>
        </div>
      )}
      <TableContainer>
        <MUTable>
          <TableHead>
            <TableRow>
              {columns.map(c => (
                <TableCell
                  key={c}
                  align="left"
                  className="header"
                  padding="default"
                >
                  {c}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.map(d => {
              if (!d) return null;
              return <ItemRow key={d.itemKey} {...d} />;
            })}
          </TableBody>
        </MUTable>
      </TableContainer>
      {pagination && (
        <TablePagination
          component="div"
          count={pagination.totalCount}
          page={pagination.page}
          onPageChange={(_, newPage) => pagination.setPage(newPage)}
          rowsPerPage={pagination.rowsPerPage}
          onRowsPerPageChange={e => {
            pagination.setRowsPerPage(Number.parseInt(e.target.value, 10));
            pagination.setPage(0);
          }}
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} of ${count}`
          }
        />
      )}
      {onLoadMore && hasMore && (
        <Flex
          direction={{ default: 'column' }}
          alignItems={{ default: 'alignItemsCenter' }}
        >
          <FlexItem>
            <Button
              data-testid="load-more-button"
              variant="primary"
              onClick={onLoadMore}
              disabled={isFetching}
              isDisabled={isFetching}
            >
              {isFetching ? 'Loading...' : 'Load More'}
            </Button>
          </FlexItem>
          <FlexItem>
            <Typography variant="caption" color="textSecondary">
              Fetches next page from clusters
            </Typography>
          </FlexItem>
        </Flex>
      )}
    </div>
  );
};
