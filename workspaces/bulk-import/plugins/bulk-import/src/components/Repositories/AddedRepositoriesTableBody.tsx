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

import { Alert, Flex, Skeleton, Text } from '@backstage/ui';

import { useGitlabConfigured } from '../../hooks';
import { useTranslation } from '../../hooks/useTranslation';
import { AddRepositoryData } from '../../types';
import { repositoriesTableCellStyle } from '../AddRepositories/repositoriesTableShared';
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
            <Flex
              data-testid="import-jobs-loading"
              justify="center"
              style={{ padding: '16px' }}
            >
              <Skeleton width={40} height={40} />
            </Flex>
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
              <Alert
                status="danger"
                title={`${error.name}. ${error.message}`}
              />
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  if (rows?.length > 0) {
    return (
      <tbody data-testid="import-jobs">
        {rows.map(row => {
          return <AddedRepositoryTableRow key={row.id} data={row} />;
        })}
        {emptyRows > 0 && (
          <tr
            style={{
              height: 55 * emptyRows,
            }}
          >
            <td style={repositoriesTableCellStyle} />
          </tr>
        )}
      </tbody>
    );
  }
  return (
    <tbody>
      <tr>
        <td colSpan={repositoriesListColumns?.length}>
          <Flex
            data-testid="no-import-jobs-found"
            justify="center"
            style={{ padding: '16px' }}
          >
            <Text>
              {t(
                gitlabConfigured
                  ? 'repositories.noProjectsFound'
                  : 'repositories.noRecordsFound',
              )}
            </Text>
          </Flex>
        </td>
      </tr>
    </tbody>
  );
};
