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

import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Box, Flex } from '@backstage/ui';

import { useGitlabConfigured } from '../../hooks';
import { useAddedRepositories } from '../../hooks/useAddedRepositories';
import { useTranslation } from '../../hooks/useTranslation';
import {
  AddedRepositoryColumnNameEnum,
  AddRepositoryData,
  SortingOrderEnum,
} from '../../types';
import { RepositoriesHeader } from '../AddRepositories/RepositoriesHeader';
import { RepositoriesTablePagination } from '../AddRepositories/RepositoriesTablePagination';
import {
  repositoriesTableContainerStyle,
  repositoriesTablePanelStyle,
  repositoriesTableRootStyle,
} from '../AddRepositories/repositoriesTableShared';
import { RepositoriesTableToolbar } from '../AddRepositories/RepositoriesTableToolbar';
import { useDeleteDialog } from '../DeleteDialogContext';
import { useDrawer } from '../DrawerContext';
import { AddedRepositoriesTableBody } from './AddedRepositoriesTableBody';
import DeleteRepositoryDialog from './DeleteRepositoryDialog';
import EditCatalogInfo from './EditCatalogInfo';
import { RepositoriesAddLink } from './RepositoriesAddLink';

export const RepositoriesList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const { t } = useTranslation();
  const { openDialog, setOpenDialog, deleteComponent } = useDeleteDialog();
  const { openDrawer, setOpenDrawer, drawerData } = useDrawer();
  const [pageNumber, setPageNumber] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const gitlabConfigured = useGitlabConfigured();

  const {
    data: importJobs,
    error: errJobs,
    loading,
    refetch,
  } = useAddedRepositories(
    pageNumber + 1,
    rowsPerPage,
    debouncedSearch,
    AddedRepositoryColumnNameEnum.repoName,
    SortingOrderEnum.Asc,
  );

  const closeDialog = () => {
    setOpenDialog(false);
    refetch();
  };

  const closeDrawer = () => {
    setOpenDrawer(false);
    const hasDeepLink =
      queryParams.has('repository') || queryParams.has('defaultBranch');
    if (!hasDeepLink) {
      return;
    }
    queryParams.delete('repository');
    queryParams.delete('defaultBranch');
    const search = queryParams.toString();
    navigate(
      {
        pathname: location.pathname,
        search: search ? `?${search}` : '',
      },
      { replace: true },
    );
  };

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    pageNumber > 0 ? Math.max(0, rowsPerPage - importJobs.totalJobs) : 0;

  const handleSearch = (str: string) => {
    setDebouncedSearch(str);
    setPageNumber(0);
  };
  const baseTitle = gitlabConfigured
    ? t('repositories.importedEntities')
    : t('repositories.addedRepositories');

  const getTitleWithCount = () => {
    if (gitlabConfigured) {
      return t('repositories.importedEntitiesCount' as any, {
        count: importJobs.totalJobs.toString(),
      });
    }
    return t('repositories.addedRepositoriesCount' as any, {
      count: importJobs.totalJobs.toString(),
    });
  };

  const finalTitle =
    importJobs?.totalJobs === 0 ? baseTitle : getTitleWithCount();
  return (
    <>
      <RepositoriesAddLink />
      <Box bg="neutral" style={repositoriesTablePanelStyle}>
        <RepositoriesTableToolbar
          title={finalTitle}
          setSearchString={handleSearch}
        />
        <div style={repositoriesTableContainerStyle}>
          <table
            className="bulk-import-repositories-table"
            style={repositoriesTableRootStyle}
          >
            <RepositoriesHeader showImportJobs />
            <AddedRepositoriesTableBody
              error={errJobs}
              loading={loading}
              rows={importJobs.addedRepositories || []}
              emptyRows={emptyRows}
            />
          </table>
          {(importJobs.totalJobs || 0) > 0 && (
            <Flex justify="end">
              <RepositoriesTablePagination
                count={importJobs.totalJobs || 0}
                page={pageNumber}
                rowsPerPage={rowsPerPage}
                onPageChange={setPageNumber}
                onRowsPerPageChange={setRowsPerPage}
              />
            </Flex>
          )}
        </div>
      </Box>
      {openDrawer && (
        <EditCatalogInfo
          open={openDrawer}
          onClose={closeDrawer}
          importStatus={drawerData}
        />
      )}
      {openDialog && (
        <DeleteRepositoryDialog
          open={openDialog}
          closeDialog={closeDialog}
          repository={deleteComponent as AddRepositoryData}
        />
      )}
    </>
  );
};
