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

import { Link } from '@backstage/core-components';
import { Text } from '@backstage/ui';

import { useTranslation } from '../../hooks/useTranslation';
import { AddRepositoryData } from '../../types';
import { bulkImportTypographySecondary } from '../bulkImportTypography';

export const SelectRepositories = ({
  onOrgRowSelected,
  orgData,
  addedRepositoriesCount,
}: {
  onOrgRowSelected: (org: AddRepositoryData) => void;
  orgData: AddRepositoryData;
  addedRepositoriesCount: number;
}) => {
  const { t } = useTranslation();

  if (orgData?.totalReposInOrg === 0) {
    return (
      <Text
        as="span"
        style={bulkImportTypographySecondary}
        data-testid="no-repositories"
      >
        {t('addRepositories.noRepositoriesFound')}
      </Text>
    );
  }

  if (orgData?.totalReposInOrg === addedRepositoriesCount) {
    return (
      <Text
        as="span"
        style={bulkImportTypographySecondary}
        data-testid="no-repositories"
      >
        {t('addRepositories.allRepositoriesAdded')}{' '}
        <Link
          to=""
          onClick={e => {
            e.preventDefault();
            onOrgRowSelected(orgData);
          }}
        >
          {t('common.view')}
        </Link>
      </Text>
    );
  }

  if (
    !orgData ||
    Object.keys(orgData?.selectedRepositories || [])?.length === 0
  ) {
    return (
      <Text as="span" data-testid="select-repositories">
        {t('addRepositories.noSelection')}{' '}
        <Link
          to=""
          onClick={e => {
            e.preventDefault();
            onOrgRowSelected(orgData);
          }}
        >
          {t('common.select')}
        </Link>
      </Text>
    );
  }
  return (
    <Text as="span" data-testid="edit-repositories">
      {Object.keys(orgData.selectedRepositories || [])?.length}/
      {(orgData?.totalReposInOrg || 0) - addedRepositoriesCount}{' '}
      <Link
        to=""
        onClick={e => {
          e.preventDefault();
          onOrgRowSelected(orgData);
        }}
      >
        {t('common.edit')}
      </Link>
    </Text>
  );
};
