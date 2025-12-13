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

import type { ChangeEvent, MouseEvent } from 'react';

import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';

import { useGitlabConfigured } from '../../hooks';
import { useImportFlow } from '../../hooks/useImportFlow';
import { useTranslation } from '../../hooks/useTranslation';
import { ImportFlow, Order } from '../../types';
import { getRepositoriesListColumns } from '../Repositories/RepositoriesListColumns';
import { getOrganizationsColumnHeader } from './OrganizationsColumnHeader';
import { getRepositoriesColumnHeader } from './RepositoriesColumnHeader';
import { getReposSelectDrawerColumnHeader } from './ReposSelectDrawerColumnHeader';

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
  isApprovalToolGitlab = false,
}: {
  numSelected?: number;
  onRequestSort: (event: MouseEvent<unknown>, property: any) => void;
  order: Order;
  orderBy: string | undefined;
  rowCount?: number;
  isDataLoading?: boolean;
  showOrganizations?: boolean;
  showImportJobs?: boolean;
  isRepoSelectDrawer?: boolean;
  isApprovalToolGitlab?: boolean;
  onSelectAllClick?: (event: ChangeEvent<HTMLInputElement>) => void;
}) => {
  const { t } = useTranslation();
  const createSortHandler = (property: any) => (event: MouseEvent<unknown>) => {
    onRequestSort(event, property);
  };

  const gitlabConfigured = useGitlabConfigured();
  const importFlow = useImportFlow();
  const isScaffolderEnabled = importFlow === ImportFlow.Scaffolder;

  const getColumnHeader = () => {
    if (showOrganizations) {
      return getOrganizationsColumnHeader(isApprovalToolGitlab, t);
    }
    if (showImportJobs) {
      return getRepositoriesListColumns(
        t,
        gitlabConfigured,
        isScaffolderEnabled,
      );
    }
    if (isRepoSelectDrawer) {
      return getReposSelectDrawerColumnHeader(t);
    }
    return getRepositoriesColumnHeader(
      isApprovalToolGitlab,
      t,
      isScaffolderEnabled,
    );
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
