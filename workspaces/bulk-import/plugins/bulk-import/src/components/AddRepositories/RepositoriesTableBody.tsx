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

import type { MouseEvent } from 'react';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

import { useTranslation } from '../../hooks/useTranslation';
import { AddedRepositories, AddRepositoryData } from '../../types';
import { OrganizationTableRow } from './OrganizationTableRow';
import { getRepositoriesColumnHeader } from './RepositoriesColumnHeader';
import { RepositoryTableRow } from './RepositoryTableRow';

export const RepositoriesTableBody = ({
  loading,
  ariaLabel,
  showOrganizations,
  rows,
  emptyRows,
  onOrgRowSelected,
  onClick,
  selectedRepos,
  isDrawer,
  isApprovalToolGitlab = false,
}: {
  loading: boolean;
  ariaLabel: string;
  emptyRows: number;
  rows: AddRepositoryData[];
  onOrgRowSelected: (org: AddRepositoryData) => void;
  onClick: (_event: MouseEvent, repo: AddRepositoryData) => void;
  selectedRepos: AddedRepositories;
  isDrawer?: boolean;
  showOrganizations?: boolean;
  isApprovalToolGitlab?: boolean;
}) => {
  const { t } = useTranslation();
  const isSelected = (id: string) => {
    return !!selectedRepos[id];
  };

  if (loading) {
    return (
      <tbody>
        <tr>
          <td
            colSpan={
              getRepositoriesColumnHeader(isApprovalToolGitlab, t).length
            }
          >
            <Box
              data-testid={`${ariaLabel}-loading`}
              sx={{
                padding: 2,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <CircularProgress />
            </Box>
          </td>
        </tr>
      </tbody>
    );
  } else if (rows?.length > 0) {
    return (
      <TableBody>
        {rows.map(row => {
          const isItemSelected = isSelected(row.id);
          return showOrganizations ? (
            <OrganizationTableRow
              key={row.id}
              onOrgRowSelected={onOrgRowSelected}
              data={row}
            />
          ) : (
            <RepositoryTableRow
              key={row.id}
              handleClick={onClick}
              isItemSelected={isItemSelected}
              data={row}
              isDrawer={isDrawer}
            />
          );
        })}
        {emptyRows > 0 && (
          <TableRow
            style={{
              height: 55 * emptyRows,
            }}
          >
            <TableCell />
          </TableRow>
        )}
      </TableBody>
    );
  }
  return (
    <tbody>
      <tr>
        <td
          colSpan={getRepositoriesColumnHeader(isApprovalToolGitlab, t).length}
        >
          <Box
            data-testid="no-repositories-found"
            sx={{
              p: 2,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            {t(
              isApprovalToolGitlab
                ? 'repositories.noProjectsFound'
                : 'repositories.noRecordsFound',
            )}
          </Box>
        </td>
      </tr>
    </tbody>
  );
};
