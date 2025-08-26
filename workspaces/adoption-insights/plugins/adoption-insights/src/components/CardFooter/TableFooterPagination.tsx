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

import { useTranslation } from '../../hooks/useTranslation';

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

const TableFooterPagination: FC<TableFooterPaginationProps> = ({
  count,
  rowsPerPage,
  page,
  handleChangePage,
  handleChangeRowsPerPage,
}) => {
  const { t } = useTranslation();

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
        rowsPerPageOptions={[
          {
            label: t('table.pagination.topN' as any, { count: '3' }),
            value: 3,
          },
          {
            label: t('table.pagination.topN' as any, { count: '5' }),
            value: 5,
          },
          {
            label: t('table.pagination.topN' as any, { count: '10' }),
            value: 10,
          },
          {
            label: t('table.pagination.topN' as any, { count: '20' }),
            value: 20,
          },
        ]}
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
