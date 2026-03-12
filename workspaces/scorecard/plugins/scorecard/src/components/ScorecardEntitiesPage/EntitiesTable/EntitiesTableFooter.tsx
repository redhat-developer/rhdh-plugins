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

import type { ChangeEvent, FC, MouseEvent } from 'react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TablePagination from '@mui/material/TablePagination';

import { useTranslation } from '../../../hooks/useTranslation';

import { EntitiesTablePagination } from './EntitiesTablePagination';

const generateRowsPerPageOptions = (
  totalCount: number,
  t: (key: string, params?: any) => string,
  defaultOptions: number[] = [5, 10, 20],
) => {
  const maxDefaultOption = Math.max(...defaultOptions);

  if (defaultOptions.includes(totalCount)) {
    const validOptions = defaultOptions.filter(option => option <= totalCount);
    return validOptions.map(value => ({
      label: t('entitiesPage.entitiesTableFooter.rows_other', {
        count: value.toString(),
      }),
      value,
    }));
  }

  const validDefaults = defaultOptions.filter(option => option < totalCount);

  if (validDefaults.length > 0 && totalCount <= maxDefaultOption) {
    const options = validDefaults.map(value => ({
      label: t('entitiesPage.entitiesTableFooter.rows_other', {
        count: value.toString(),
      }),
      value,
    }));
    options.push({
      label: t('entitiesPage.entitiesTableFooter.allRows'),
      value: totalCount,
    });
    return options;
  }

  if (validDefaults.length > 0) {
    return validDefaults.map(value => ({
      label: t('entitiesPage.entitiesTableFooter.rows_other', {
        count: value.toString(),
      }),
      value,
    }));
  }

  return [];
};

export interface EntitiesTableFooterProps {
  count: number;
  page: number;
  rowsPerPage: number;
  handleChangePage: (
    event: MouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) => void;
  handleChangeRowsPerPage: (event: ChangeEvent<HTMLInputElement>) => void;
}

export const EntitiesTableFooter: FC<EntitiesTableFooterProps> = ({
  count,
  page,
  rowsPerPage,
  handleChangePage,
  handleChangeRowsPerPage,
}) => {
  const { t } = useTranslation();

  const rowsPerPageOptions = generateRowsPerPageOptions(count, t, [5, 10, 20]);

  return (
    <Box
      component={Paper}
      elevation={0}
      sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        padding: 1,
      }}
    >
      <TablePagination
        labelRowsPerPage={null}
        count={count}
        page={page}
        rowsPerPageOptions={rowsPerPageOptions}
        rowsPerPage={rowsPerPage}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        ActionsComponent={EntitiesTablePagination}
        component="div"
        sx={{
          '& .v5-MuiTablePagination-select:focus': {
            backgroundColor: 'transparent',
          },
          border: 'none',
          '& .v5-MuiTablePagination-input': {
            mr: 1,
          },

          '& .v5-MuiTablePagination-displayedRows': {
            display: 'none',
          },
        }}
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
