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

import { useEffect, useState } from 'react';

import { Link } from '@backstage/core-components';
import { Box, Button, ButtonIcon, Flex, Text } from '@backstage/ui';

import { useFormikContext } from 'formik';

import { useTranslation } from '../../hooks/useTranslation';
import {
  AddedRepositories,
  AddRepositoriesFormValues,
  AddRepositoryData,
} from '../../types';
import { urlHelper } from '../../utils/repository-utils';
import {
  BulkImportCloseIcon,
  BulkImportExternalLinkIcon,
  bulkImportExternalLinkLinkStyle,
} from '../bulkImportIcons';
import { BulkImportRightDrawer } from '../BulkImportRightDrawer';
import { bulkImportTypographyH5 } from '../bulkImportTypography';
import { RepositoriesTable } from './RepositoriesTable';
import { AddRepositoriesTableToolbar } from './RepositoriesTableToolbar';

export const AddRepositoriesDrawer = ({
  open,
  onClose,
  onSelect,
  title,
  orgData,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (repos: AddedRepositories) => void;
  title: string;
  orgData: AddRepositoryData;
}) => {
  const { t } = useTranslation();
  const { values, status, setStatus } =
    useFormikContext<AddRepositoriesFormValues>();
  const [searchString, setSearchString] = useState<string>('');
  const [selectedRepos, setSelectedRepos] = useState<AddedRepositories>({});

  const updateSelectedReposInDrawer = (repos: AddedRepositories) => {
    setSelectedRepos(repos);
  };

  const handleSelectRepoFromDrawer = (selected: AddedRepositories) => {
    onSelect(selected);
    const newStatus = { ...(status?.errors || {}) };
    Object.keys(newStatus).forEach(s => {
      if (!Object.keys(selected).find(sel => sel === s)) {
        delete newStatus[s];
      }
    });
    setStatus({ ...status, errors: newStatus });
    onClose();
  };

  useEffect(() => {
    const sr = Object.values(values.repositories).reduce(
      (acc, repo) =>
        repo.orgName === orgData?.orgName ? { ...acc, [repo.id]: repo } : acc,
      {},
    );
    setSelectedRepos(sr);
  }, [orgData?.orgName, values.repositories]);

  return (
    <BulkImportRightDrawer
      open={open}
      onClose={onClose}
      variant="temporary"
      paperWidth="50%"
    >
      <Flex
        direction="column"
        style={{
          flex: 1,
          minHeight: 0,
          height: '100%',
          padding: '20px',
          boxSizing: 'border-box',
        }}
      >
        <Flex align="start" justify="between">
          <Flex direction="column" gap="1" align="start">
            <Text as="h2" style={bulkImportTypographyH5}>
              {orgData?.orgName}
            </Text>
            <span style={{ fontSize: '0.875rem', lineHeight: '1.5rem' }}>
              <Link
                to={orgData?.organizationUrl || ''}
                style={bulkImportExternalLinkLinkStyle}
              >
                {urlHelper(orgData?.organizationUrl || '')}
                <BulkImportExternalLinkIcon />
              </Link>
            </span>
          </Flex>
          <ButtonIcon
            icon={<BulkImportCloseIcon />}
            aria-label={t('common.cancel')}
            variant="tertiary"
            onPress={onClose}
          />
        </Flex>
        <Box
          bg="neutral"
          style={{
            marginTop: '20px',
            border: '1px solid var(--bui-border-1)',
            borderRadius: 'var(--bui-radius-2)',
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <AddRepositoriesTableToolbar
            title={title}
            setSearchString={setSearchString}
            selectedReposFromDrawer={selectedRepos}
            activeOrganization={orgData?.orgName}
          />
          <RepositoriesTable
            searchString={searchString}
            updateSelectedReposInDrawer={updateSelectedReposInDrawer}
            drawerOrganization={orgData?.orgName}
          />
        </Box>
        <Flex
          align="center"
          gap="3"
          justify="end"
          style={{
            flexShrink: 0,
            marginTop: '20px',
            paddingTop: '12px',
            borderTop: '1px solid var(--bui-border-1)',
          }}
        >
          <Button
            variant="primary"
            onPress={() => handleSelectRepoFromDrawer(selectedRepos)}
            data-testid="select-from-drawer"
          >
            {t('common.select')}
          </Button>
          <Button
            variant="secondary"
            onPress={onClose}
            data-testid="close-drawer"
          >
            {t('common.cancel')}
          </Button>
        </Flex>
      </Flex>
    </BulkImportRightDrawer>
  );
};
