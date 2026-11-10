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

import { Flex, Skeleton, Text } from '@backstage/ui';

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
  onOrgRowSelected,
  onClick,
  selectedRepos,
  isDrawer,
  isApprovalToolGitlab = false,
  loginRejected = false,
}: {
  loading: boolean;
  ariaLabel: string;
  rows: AddRepositoryData[];
  onOrgRowSelected: (org: AddRepositoryData) => void;
  onClick: (_event: MouseEvent, repo: AddRepositoryData) => void;
  selectedRepos: AddedRepositories;
  isDrawer?: boolean;
  showOrganizations?: boolean;
  isApprovalToolGitlab?: boolean;
  loginRejected?: boolean;
}) => {
  const { t } = useTranslation();
  const isSelected = (id: string) => {
    return !!selectedRepos[id];
  };

  const columnCount = getRepositoriesColumnHeader(
    isApprovalToolGitlab,
    t,
  ).length;

  if (loading) {
    return (
      <tbody>
        <tr>
          <td colSpan={columnCount}>
            <Flex
              data-testid={`${ariaLabel}-loading`}
              justify="center"
              style={{ padding: '16px' }}
            >
              <Skeleton width={40} height={40} />
            </Flex>
          </td>
        </tr>
      </tbody>
    );
  } else if (rows?.length > 0) {
    return (
      <tbody>
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
      </tbody>
    );
  }

  let emptyStateMessageKey:
    | 'repositories.logInToViewProjects'
    | 'repositories.logInToViewRepositories'
    | 'repositories.noProjectsFound'
    | 'repositories.noRecordsFound';
  if (loginRejected) {
    emptyStateMessageKey = isApprovalToolGitlab
      ? 'repositories.logInToViewProjects'
      : 'repositories.logInToViewRepositories';
  } else if (isApprovalToolGitlab) {
    emptyStateMessageKey = 'repositories.noProjectsFound';
  } else {
    emptyStateMessageKey = 'repositories.noRecordsFound';
  }

  return (
    <tbody>
      <tr>
        <td colSpan={columnCount}>
          <Flex
            data-testid="no-repositories-found"
            justify="center"
            style={{ padding: '16px' }}
          >
            <Text>{t(emptyStateMessageKey)}</Text>
          </Flex>
        </td>
      </tr>
    </tbody>
  );
};
