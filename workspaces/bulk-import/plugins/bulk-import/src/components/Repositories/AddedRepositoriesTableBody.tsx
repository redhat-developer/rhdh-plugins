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

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

import { useGitlabConfigured } from '../../hooks';
import { useTranslation } from '../../hooks/useTranslation';
import { AddRepositoryData } from '../../types';
import { AddedRepositoryTableRow } from './AddedRepositoryTableRow';
import { getRepositoriesListColumns } from './RepositoriesListColumns';

export const AddedRepositoriesTableBody = ({
  loading,
  rows,
  emptyRows,
  error,
}: {
  error: { [key: string]: string };
  loading: boolean;
  emptyRows: number;
  rows: AddRepositoryData[];
}) => {
  const gitlabConfigured = useGitlabConfigured();
  const { t } = useTranslation();
  const repositoriesListColumns = getRepositoriesListColumns(
    t,
    gitlabConfigured,
  );

  if (loading) {
    return (
      <tbody>
        <tr>
          <td colSpan={repositoriesListColumns?.length}>
            <Box
              data-testid="import-jobs-loading"
              sx={{
                p: 2,
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
  }
  if (Object.keys(error || {}).length > 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={repositoriesListColumns?.length}>
            <div data-testid="import-jobs-error">
              <Alert severity="error">{`${error.name}. ${error.message}`}</Alert>
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  if (rows?.length > 0) {
    return (
      <TableBody data-testid="import-jobs">
        {rows.map(row => {
          return <AddedRepositoryTableRow key={row.id} data={row} />;
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
        <td colSpan={repositoriesListColumns?.length}>
          <Box
            data-testid="no-import-jobs-found"
            sx={{
              p: 2,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            {t('repositories.noRecordsFound')}
          </Box>
        </td>
      </tr>
    </tbody>
  );
};
