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
import type { MouseEvent, ChangeEvent, FC } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TablePagination from '@mui/material/TablePagination';

interface TableFooterPaginationProps {
  count: number;
  rowsPerPage: number;
  page: number;
  handleChangePage: (
    event: MouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) => void;
  handleChangeRowsPerPage: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
}

const generateRowsPerPageOptions = (totalCount: number) => {
  const defaultOptions = [3, 5, 10, 20];
  const maxDefaultOption = Math.max(...defaultOptions);
  if (
    totalCount > 0 &&
    totalCount <= maxDefaultOption &&
    !defaultOptions.includes(totalCount)
  ) {
    const validDefaults = defaultOptions.filter(option => option < totalCount);
    const lastValidDefault = Math.max(...validDefaults);

    if (totalCount === lastValidDefault + 1) {
      const validOptions =
        validDefaults.length > 1
          ? validDefaults.slice(0, -1).concat([totalCount])
          : validDefaults.concat([totalCount]);
      return validOptions.map(value => ({
        label: `Top ${value}`,
        value,
      }));
    } else if (totalCount > lastValidDefault + 1) {
      const validOptions = validDefaults.concat([totalCount]);
      return validOptions.map(value => ({
        label: `Top ${value}`,
        value,
      }));
    }
  }

  const validOptions = defaultOptions.filter(option => option <= totalCount);
  return validOptions.map(value => ({
    label: `Top ${value}`,
    value,
  }));
};

const TableFooterPagination: FC<TableFooterPaginationProps> = ({
  count,
  rowsPerPage,
  page,
  handleChangePage,
  handleChangeRowsPerPage,
}) => {
  const rowsPerPageOptions = generateRowsPerPageOptions(count);

  if (rowsPerPageOptions.length <= 1) {
    return null;
  }

  return (
    <Box
      component={Paper}
      sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        padding: 1,
      }}
    >
      <TablePagination
        sx={{
          '& .v5-MuiTablePagination-select:focus': {
            backgroundColor: 'transparent',
          },
        }}
        rowsPerPageOptions={rowsPerPageOptions}
        component="div"
        count={count}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage={null}
        labelDisplayedRows={() => null}
        ActionsComponent={() => null}
        slotProps={{
          select: {
            MenuProps: {
              MenuListProps: {
                autoFocusItem: false,
              },
              PaperProps: {
                sx: {
                  width: 190,
                  boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)',
                  borderRadius: 2,
                  border: theme => `1px solid ${theme.palette.grey[300]}`,
                  overflow: 'hidden',
                },
              },
            },
          },
        }}
      />
    </Box>
  );
};

export default TableFooterPagination;
