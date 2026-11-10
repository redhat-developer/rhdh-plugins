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

import { Checkbox, Flex } from '@backstage/ui';

import { useGitlabConfigured } from '../../hooks';
import { useImportFlow } from '../../hooks/useImportFlow';
import { useTranslation } from '../../hooks/useTranslation';
import { ImportFlow } from '../../types';
import { getRepositoriesListColumns } from '../Repositories/RepositoriesListColumns';
import { getOrganizationsColumnHeader } from './OrganizationsColumnHeader';
import { getRepositoriesColumnHeader } from './RepositoriesColumnHeader';
import {
  repositoriesTableHeaderCellStyle,
  repositoriesTableOrgHeaderCellStyle,
} from './repositoriesTableShared';
import { getReposSelectDrawerColumnHeader } from './ReposSelectDrawerColumnHeader';

export const RepositoriesHeader = ({
  onSelectAllClick,
  numSelected,
  rowCount,
  isDataLoading,
  showOrganizations,
  showImportJobs,
  isRepoSelectDrawer = false,
  isApprovalToolGitlab = false,
}: {
  numSelected?: number;
  rowCount?: number;
  isDataLoading?: boolean;
  showOrganizations?: boolean;
  showImportJobs?: boolean;
  isRepoSelectDrawer?: boolean;
  isApprovalToolGitlab?: boolean;
  onSelectAllClick?: () => void;
}) => {
  const { t } = useTranslation();

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

  const headerCellStyle = () => {
    if (showImportJobs) {
      return repositoriesTableHeaderCellStyle;
    }
    if (showOrganizations) {
      return repositoriesTableOrgHeaderCellStyle;
    }
    return repositoriesTableHeaderCellStyle;
  };

  const showSelectAll = !showOrganizations && !showImportJobs;

  const isIndeterminate =
    (numSelected ?? 0) > 0 && (rowCount ?? 0) > 0 && numSelected! < rowCount!;
  const isAllSelected = (rowCount ?? 0) > 0 && numSelected === rowCount;

  return (
    <thead>
      <tr>
        {getColumnHeader()?.map((headCell, index) => (
          <th key={headCell.id as string} style={headerCellStyle()}>
            {index === 0 && showSelectAll ? (
              <Flex align="center" gap="2">
                <Checkbox
                  aria-label="select all repositories"
                  isSelected={isAllSelected}
                  isIndeterminate={isIndeterminate}
                  isDisabled={isDataLoading}
                  onChange={onSelectAllClick}
                />
                <span>{headCell.title}</span>
              </Flex>
            ) : (
              headCell.title
            )}
          </th>
        ))}
      </tr>
    </thead>
  );
};
