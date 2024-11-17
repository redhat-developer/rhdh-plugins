/*
 * Copyright 2024 The Backstage Authors
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
import * as React from 'react';

import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';

import { Order } from '../../types';
import { RepositoriesListColumns } from '../Repositories/RepositoriesListColumns';
import { OrganizationsColumnHeader } from './OrganizationsColumnHeader';
import { RepositoriesColumnHeader } from './RepositoriesColumnHeader';
import { ReposSelectDrawerColumnHeader } from './ReposSelectDrawerColumnHeader';

export const RepositoriesHeader = ({
  onSelectAllClick,
  order,
  orderBy,
  numSelected,
  rowCount,
  onRequestSort,
  isDataLoading,
  showOrganizations,
  showImportJobs,
  isRepoSelectDrawer = false,
}: {
  numSelected?: number;
  onRequestSort: (event: React.MouseEvent<unknown>, property: any) => void;
  order: Order;
  orderBy: string | undefined;
  rowCount?: number;
  isDataLoading?: boolean;
  showOrganizations?: boolean;
  showImportJobs?: boolean;
  isRepoSelectDrawer?: boolean;
  onSelectAllClick?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  const createSortHandler =
    (property: any) => (event: React.MouseEvent<unknown>) => {
      onRequestSort(event, property);
    };

  const getColumnHeader = () => {
    if (showOrganizations) {
      return OrganizationsColumnHeader;
    }
    if (showImportJobs) {
      return RepositoriesListColumns;
    }
    if (isRepoSelectDrawer) {
      return ReposSelectDrawerColumnHeader;
    }
    return RepositoriesColumnHeader;
  };

  const tableCellStyle = () => {
    if (showImportJobs) {
      return undefined;
    }
    if (showOrganizations) {
      return '15px 16px 15px 24px';
    }
    return '15px 16px 15px 6px';
  };

  return (
    <TableHead>
      <TableRow>
        {getColumnHeader()?.map((headCell, index) => (
          <TableCell
            key={headCell.id as string}
            align="left"
            padding="normal"
            style={{
              lineHeight: '1.5rem',
              fontSize: '0.875rem',
              padding: tableCellStyle(),
              fontWeight: '700',
            }}
            sortDirection={orderBy === headCell.field ? order : 'asc'}
          >
            {index === 0 && !showOrganizations && !showImportJobs && (
              <Checkbox
                disableRipple
                color="primary"
                style={{ padding: '0 12px' }}
                indeterminate={
                  (numSelected &&
                    rowCount &&
                    numSelected > 0 &&
                    numSelected < rowCount) ||
                  false
                }
                checked={
                  ((rowCount ?? 0) > 0 && numSelected === rowCount) || false
                }
                onChange={onSelectAllClick}
                inputProps={{
                  'aria-label': 'select all repositories',
                }}
                disabled={isDataLoading}
              />
            )}
            <TableSortLabel
              active={orderBy === headCell.field}
              direction={orderBy === headCell.field ? order : 'asc'}
              onClick={createSortHandler(headCell.field)}
              disabled={headCell.sorting === false}
            >
              {headCell.title}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
};
